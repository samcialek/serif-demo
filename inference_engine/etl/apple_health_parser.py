"""
Streaming XML parser for Apple Health export.xml files.

Handles multi-GB files (tested up to 3+ GB) using xml.etree.ElementTree.iterparse
with aggressive element clearing to maintain constant memory usage (~200 MB RSS).

Extracts quantity records, category samples (sleep, stand hours), and workouts.
Aggregates everything to daily granularity and returns a single pandas DataFrame.

Usage as module:
    from inference_engine.etl.apple_health_parser import parse_apple_health
    df = parse_apple_health(Path("export.xml"))

Usage as script:
    python apple_health_parser.py C:\\path\\to\\export.xml
"""

import sys
import os
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Record types to extract
# ---------------------------------------------------------------------------

QUANTITY_TYPES = {
    "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
    "HKQuantityTypeIdentifierRestingHeartRate",
    "HKQuantityTypeIdentifierWalkingHeartRateAverage",
    "HKQuantityTypeIdentifierHeartRate",
    "HKQuantityTypeIdentifierStepCount",
    "HKQuantityTypeIdentifierActiveEnergyBurned",
    "HKQuantityTypeIdentifierBasalEnergyBurned",
    "HKQuantityTypeIdentifierBodyMass",
    "HKQuantityTypeIdentifierBodyFatPercentage",
    "HKQuantityTypeIdentifierOxygenSaturation",
    "HKQuantityTypeIdentifierRespiratoryRate",
    "HKQuantityTypeIdentifierVO2Max",
    "HKQuantityTypeIdentifierDistanceWalkingRunning",
    "HKQuantityTypeIdentifierDistanceCycling",
    "HKQuantityTypeIdentifierFlightsClimbed",
    "HKQuantityTypeIdentifierAppleExerciseTime",
    "HKQuantityTypeIdentifierAppleStandTime",
    "HKQuantityTypeIdentifierEnvironmentalAudioExposure",
    "HKQuantityTypeIdentifierHeadphoneAudioExposure",
    "HKQuantityTypeIdentifierDietaryEnergyConsumed",
    "HKQuantityTypeIdentifierDietaryProtein",
    "HKQuantityTypeIdentifierDietaryCarbohydrates",
    "HKQuantityTypeIdentifierDietaryFatTotal",
    "HKQuantityTypeIdentifierDietaryWater",
}

CATEGORY_TYPES = {
    "HKCategoryTypeIdentifierSleepAnalysis",
    "HKCategoryTypeIdentifierAppleStandHour",
}

ALL_RECORD_TYPES = QUANTITY_TYPES | CATEGORY_TYPES

# ---------------------------------------------------------------------------
# Aggregation strategy per metric
# ---------------------------------------------------------------------------

SUM_TYPES = {
    "HKQuantityTypeIdentifierStepCount",
    "HKQuantityTypeIdentifierActiveEnergyBurned",
    "HKQuantityTypeIdentifierBasalEnergyBurned",
    "HKQuantityTypeIdentifierDistanceWalkingRunning",
    "HKQuantityTypeIdentifierDistanceCycling",
    "HKQuantityTypeIdentifierFlightsClimbed",
    "HKQuantityTypeIdentifierAppleExerciseTime",
    "HKQuantityTypeIdentifierAppleStandTime",
    "HKQuantityTypeIdentifierDietaryEnergyConsumed",
    "HKQuantityTypeIdentifierDietaryProtein",
    "HKQuantityTypeIdentifierDietaryCarbohydrates",
    "HKQuantityTypeIdentifierDietaryFatTotal",
    "HKQuantityTypeIdentifierDietaryWater",
}

MEAN_TYPES = {
    "HKQuantityTypeIdentifierHeartRate",
    "HKQuantityTypeIdentifierRestingHeartRate",
    "HKQuantityTypeIdentifierWalkingHeartRateAverage",
    "HKQuantityTypeIdentifierOxygenSaturation",
    "HKQuantityTypeIdentifierRespiratoryRate",
    "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
    "HKQuantityTypeIdentifierEnvironmentalAudioExposure",
    "HKQuantityTypeIdentifierHeadphoneAudioExposure",
}

LAST_TYPES = {
    "HKQuantityTypeIdentifierBodyMass",
    "HKQuantityTypeIdentifierBodyFatPercentage",
    "HKQuantityTypeIdentifierVO2Max",
}

MINMAX_TYPES = {
    "HKQuantityTypeIdentifierHeartRate",
}

# ---------------------------------------------------------------------------
# Short column names for the output DataFrame
# ---------------------------------------------------------------------------

SHORT_NAMES = {
    "HKQuantityTypeIdentifierHeartRateVariabilitySDNN": "hrv_sdnn",
    "HKQuantityTypeIdentifierRestingHeartRate": "resting_hr",
    "HKQuantityTypeIdentifierWalkingHeartRateAverage": "walking_hr_avg",
    "HKQuantityTypeIdentifierHeartRate": "heart_rate",
    "HKQuantityTypeIdentifierStepCount": "steps",
    "HKQuantityTypeIdentifierActiveEnergyBurned": "active_energy_kcal",
    "HKQuantityTypeIdentifierBasalEnergyBurned": "basal_energy_kcal",
    "HKQuantityTypeIdentifierBodyMass": "body_mass_kg",
    "HKQuantityTypeIdentifierBodyFatPercentage": "body_fat_pct",
    "HKQuantityTypeIdentifierOxygenSaturation": "spo2",
    "HKQuantityTypeIdentifierRespiratoryRate": "respiratory_rate",
    "HKQuantityTypeIdentifierVO2Max": "vo2max",
    "HKQuantityTypeIdentifierDistanceWalkingRunning": "distance_walking_running_km",
    "HKQuantityTypeIdentifierDistanceCycling": "distance_cycling_km",
    "HKQuantityTypeIdentifierFlightsClimbed": "flights_climbed",
    "HKQuantityTypeIdentifierAppleExerciseTime": "exercise_time_min",
    "HKQuantityTypeIdentifierAppleStandTime": "stand_time_min",
    "HKQuantityTypeIdentifierEnvironmentalAudioExposure": "env_audio_exposure_dbA",
    "HKQuantityTypeIdentifierHeadphoneAudioExposure": "headphone_audio_exposure_dbA",
    "HKQuantityTypeIdentifierDietaryEnergyConsumed": "dietary_energy_kcal",
    "HKQuantityTypeIdentifierDietaryProtein": "dietary_protein_g",
    "HKQuantityTypeIdentifierDietaryCarbohydrates": "dietary_carbs_g",
    "HKQuantityTypeIdentifierDietaryFatTotal": "dietary_fat_g",
    "HKQuantityTypeIdentifierDietaryWater": "dietary_water_ml",
}

SLEEP_STAGES = {
    "HKCategoryValueSleepAnalysisInBed": "in_bed",
    "HKCategoryValueSleepAnalysisAsleepUnspecified": "asleep",
    "HKCategoryValueSleepAnalysisAsleepCore": "asleep_core",
    "HKCategoryValueSleepAnalysisAsleepDeep": "asleep_deep",
    "HKCategoryValueSleepAnalysisAsleepREM": "asleep_rem",
    "HKCategoryValueSleepAnalysisAwake": "awake",
}


# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------

def _parse_health_date(date_str: str) -> Optional[datetime]:
    """
    Parse an Apple Health date string like ``2024-11-11 17:57:08 -0500``
    into a timezone-aware :class:`datetime`.  The embedded UTC offset already
    represents the device's local timezone at recording time.
    """
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S %z")
    except ValueError:
        try:
            return datetime.strptime(date_str.strip(), "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None


def _local_date_str(date_str: str) -> Optional[str]:
    """
    Return the calendar date (``YYYY-MM-DD``) in the device's local timezone.
    Because the raw string already includes the offset, the wall-clock
    portion *is* local time -- we just slice it.
    """
    dt = _parse_health_date(date_str)
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%d")


# ---------------------------------------------------------------------------
# Daily accumulator
# ---------------------------------------------------------------------------

class _DailyAccumulator:
    """
    Collects raw values per day per metric during the streaming parse,
    then computes final daily aggregates when :meth:`build_dataframe` is called.
    """

    def __init__(self):
        # SUM buckets: {date: {type: running_sum}}
        self._sum = defaultdict(lambda: defaultdict(float))
        self._sum_seen = defaultdict(set)  # track which types have data

        # MEAN buckets: {date: {type: [values]}}
        self._mean = defaultdict(lambda: defaultdict(list))

        # LAST (most-recent) buckets: {date: {type: (datetime, value)}}
        self._last = defaultdict(dict)

        # MIN/MAX buckets: {date: {type: (current_min, current_max)}}
        self._minmax = defaultdict(dict)

        # HRV daily values for std: {date: [values]}
        self._hrv = defaultdict(list)

        # Sleep duration per stage per day (minutes): {date: {stage: minutes}}
        self._sleep = defaultdict(lambda: defaultdict(float))

        # Stand hours per day: {date: count_stood}
        self._stand_hours = defaultdict(int)

        # Workouts per day
        self._workouts = defaultdict(list)

        # Unit observed per type (first seen wins, for metadata)
        self.units = {}

    # ---- quantity records ----

    def add_quantity(self, rtype: str, value: float, unit: str,
                     start_date: str, end_date: str):
        date = _local_date_str(start_date)
        if date is None:
            return

        if rtype not in self.units:
            self.units[rtype] = unit

        if rtype in SUM_TYPES:
            self._sum[date][rtype] += value
            self._sum_seen[date].add(rtype)

        if rtype in MEAN_TYPES:
            self._mean[date][rtype].append(value)

        if rtype in LAST_TYPES:
            dt = _parse_health_date(start_date)
            prev = self._last[date].get(rtype)
            if prev is None or (dt is not None and dt > prev[0]):
                self._last[date][rtype] = (dt, value)

        if rtype in MINMAX_TYPES:
            prev = self._minmax[date].get(rtype)
            if prev is None:
                self._minmax[date][rtype] = (value, value)
            else:
                self._minmax[date][rtype] = (min(prev[0], value),
                                              max(prev[1], value))

        if rtype == "HKQuantityTypeIdentifierHeartRateVariabilitySDNN":
            self._hrv[date].append(value)

    # ---- category records ----

    def add_category(self, rtype: str, value: str,
                     start_date: str, end_date: str):
        if rtype == "HKCategoryTypeIdentifierSleepAnalysis":
            self._add_sleep(value, start_date, end_date)
        elif rtype == "HKCategoryTypeIdentifierAppleStandHour":
            self._add_stand(value, start_date)

    def _add_sleep(self, value: str, start_date: str, end_date: str):
        start_dt = _parse_health_date(start_date)
        end_dt = _parse_health_date(end_date)
        if start_dt is None or end_dt is None:
            return
        duration_min = (end_dt - start_dt).total_seconds() / 60.0
        if duration_min <= 0:
            return
        stage = SLEEP_STAGES.get(value, "unknown")
        # attribute to the end (waking) date
        date = end_dt.strftime("%Y-%m-%d")
        self._sleep[date][stage] += duration_min

    def _add_stand(self, value: str, start_date: str):
        date = _local_date_str(start_date)
        if date is None:
            return
        if value == "HKCategoryValueAppleStandHourStood":
            self._stand_hours[date] += 1

    # ---- workouts ----

    def add_workout(self, workout_type: str,
                    duration_min: Optional[float],
                    distance_km: Optional[float],
                    energy_kcal: Optional[float],
                    start_date: str, end_date: str,
                    source_name: str):
        date = _local_date_str(start_date)
        if date is None:
            return
        self._workouts[date].append({
            "type": workout_type,
            "duration_min": duration_min,
            "distance_km": distance_km,
            "energy_kcal": energy_kcal,
            "start": start_date,
            "end": end_date,
            "source": source_name,
        })

    # ---- build output ----

    def build_dataframe(self) -> pd.DataFrame:
        """Return a single DataFrame with one row per calendar day."""
        all_dates = set()
        all_dates.update(self._sum.keys())
        all_dates.update(self._mean.keys())
        all_dates.update(self._last.keys())
        all_dates.update(self._minmax.keys())
        all_dates.update(self._hrv.keys())
        all_dates.update(self._sleep.keys())
        all_dates.update(self._stand_hours.keys())
        all_dates.update(self._workouts.keys())

        if not all_dates:
            return _empty_daily_df()

        rows = []
        for date in sorted(all_dates):
            row = {"date": date}

            # -- SUM metrics --
            for rtype in SUM_TYPES:
                col = SHORT_NAMES[rtype]
                if rtype in self._sum_seen.get(date, set()):
                    row[col] = self._sum[date][rtype]
                else:
                    row[col] = np.nan

            # -- MEAN metrics --
            for rtype in MEAN_TYPES:
                col = SHORT_NAMES[rtype]
                vals = self._mean[date].get(rtype)
                if vals:
                    row[col + "_mean"] = np.mean(vals)
                    row[col + "_count"] = len(vals)
                else:
                    row[col + "_mean"] = np.nan
                    row[col + "_count"] = 0

            # -- LAST metrics --
            for rtype in LAST_TYPES:
                col = SHORT_NAMES[rtype]
                entry = self._last[date].get(rtype)
                row[col] = entry[1] if entry is not None else np.nan

            # -- MIN / MAX --
            for rtype in MINMAX_TYPES:
                col = SHORT_NAMES[rtype]
                mm = self._minmax[date].get(rtype)
                if mm is not None:
                    row[col + "_min"] = mm[0]
                    row[col + "_max"] = mm[1]
                else:
                    row[col + "_min"] = np.nan
                    row[col + "_max"] = np.nan

            # -- HRV daily std --
            hrv_vals = self._hrv.get(date)
            if hrv_vals and len(hrv_vals) >= 2:
                row["hrv_sdnn_std"] = float(np.std(hrv_vals, ddof=1))
            elif hrv_vals and len(hrv_vals) == 1:
                row["hrv_sdnn_std"] = 0.0
            else:
                row["hrv_sdnn_std"] = np.nan

            # -- Sleep --
            sleep = self._sleep.get(date, {})
            row["sleep_in_bed_min"] = sleep.get("in_bed", np.nan) or np.nan
            row["sleep_asleep_min"] = sleep.get("asleep", np.nan) or np.nan
            row["sleep_core_min"] = sleep.get("asleep_core", np.nan) or np.nan
            row["sleep_deep_min"] = sleep.get("asleep_deep", np.nan) or np.nan
            row["sleep_rem_min"] = sleep.get("asleep_rem", np.nan) or np.nan
            row["sleep_awake_min"] = sleep.get("awake", np.nan) or np.nan

            # total asleep: use stage breakdown (core+deep+rem) when available,
            # fall back to generic "asleep" (unspecified) otherwise.
            # Never sum both — "asleep" is the parent category that already
            # includes core/deep/rem, so adding them would double-count.
            stage_sum = sum(
                sleep.get(s, 0.0)
                for s in ("asleep_core", "asleep_deep", "asleep_rem")
            )
            generic_asleep = sleep.get("asleep", 0.0)
            if stage_sum > 0:
                row["sleep_total_asleep_min"] = stage_sum
            elif generic_asleep > 0:
                row["sleep_total_asleep_min"] = generic_asleep
            else:
                row["sleep_total_asleep_min"] = np.nan

            # -- Stand hours --
            if date in self._stand_hours:
                row["stand_hours_count"] = self._stand_hours[date]
            else:
                row["stand_hours_count"] = np.nan

            # -- Workouts --
            wk = self._workouts.get(date, [])
            if wk:
                row["workout_count"] = len(wk)
                durs = [w["duration_min"] for w in wk if w["duration_min"] is not None]
                row["workout_total_duration_min"] = sum(durs) if durs else np.nan
                ens = [w["energy_kcal"] for w in wk if w["energy_kcal"] is not None]
                row["workout_total_energy_kcal"] = sum(ens) if ens else np.nan
                dsts = [w["distance_km"] for w in wk if w["distance_km"] is not None]
                row["workout_total_distance_km"] = sum(dsts) if dsts else np.nan
                row["workout_types"] = "; ".join(sorted({w["type"] for w in wk}))
            else:
                row["workout_count"] = 0
                row["workout_total_duration_min"] = np.nan
                row["workout_total_energy_kcal"] = np.nan
                row["workout_total_distance_km"] = np.nan
                row["workout_types"] = ""

            rows.append(row)

        df = pd.DataFrame(rows)
        df["date"] = pd.to_datetime(df["date"])
        df.sort_values("date", inplace=True)
        df.reset_index(drop=True, inplace=True)
        return df


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_float(val: Optional[str]) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _empty_daily_df() -> pd.DataFrame:
    """Return an empty DataFrame with the expected column schema."""
    cols = ["date"]
    for rtype in SUM_TYPES:
        cols.append(SHORT_NAMES[rtype])
    for rtype in MEAN_TYPES:
        cols.append(SHORT_NAMES[rtype] + "_mean")
        cols.append(SHORT_NAMES[rtype] + "_count")
    for rtype in LAST_TYPES:
        cols.append(SHORT_NAMES[rtype])
    for rtype in MINMAX_TYPES:
        cols.append(SHORT_NAMES[rtype] + "_min")
        cols.append(SHORT_NAMES[rtype] + "_max")
    cols.append("hrv_sdnn_std")
    cols += [
        "sleep_in_bed_min", "sleep_asleep_min", "sleep_core_min",
        "sleep_deep_min", "sleep_rem_min", "sleep_awake_min",
        "sleep_total_asleep_min", "stand_hours_count",
        "workout_count", "workout_total_duration_min",
        "workout_total_energy_kcal", "workout_total_distance_km",
        "workout_types",
    ]
    return pd.DataFrame(columns=cols)


# ---------------------------------------------------------------------------
# Streaming XML parser core
# ---------------------------------------------------------------------------

def _stream_parse(xml_path: str, progress_every: int = 1_000_000) -> _DailyAccumulator:
    """
    Stream-parse an Apple Health ``export.xml`` using :func:`ET.iterparse`
    with element clearing so that memory stays roughly constant regardless
    of file size.

    Parameters
    ----------
    xml_path : str or Path
        Path to the ``export.xml`` file.
    progress_every : int
        Print a progress line every *N* XML elements (default 1 M).

    Returns
    -------
    _DailyAccumulator
        Populated accumulator; call :meth:`build_dataframe` to get the
        daily DataFrame.
    """
    xml_path = str(xml_path)
    acc = _DailyAccumulator()
    total = 0
    kept = 0
    workouts = 0

    file_size_gb = os.path.getsize(xml_path) / (1024 ** 3)
    print(f"Starting parse of: {xml_path}")
    print(f"File size: {file_size_gb:.2f} GB")

    # We need to track whether we are inside a <Workout> element so that
    # we can collect its <WorkoutStatistics> children before the </Workout>
    # end event fires.
    in_workout = False
    workout_stats: dict = {}

    # iterparse with both start and end events.
    # - 'start' for Workout: set the in_workout flag
    # - 'end' for everything else: process + clear
    context = ET.iterparse(xml_path, events=("start", "end"))

    for event, elem in context:
        # ---- start events (lightweight, just set flags) ----
        if event == "start":
            if elem.tag == "Workout":
                in_workout = True
                workout_stats = {}
            continue

        # ---- end events ----
        total += 1

        if total % progress_every == 0:
            print(f"  {total:>14,} elements | "
                  f"{kept:,} records kept | "
                  f"{workouts:,} workouts")

        tag = elem.tag

        # ---- <Record> ----
        if tag == "Record":
            rtype = elem.get("type")
            if rtype in QUANTITY_TYPES:
                val = _safe_float(elem.get("value"))
                if val is not None:
                    acc.add_quantity(
                        rtype, val,
                        elem.get("unit", ""),
                        elem.get("startDate", ""),
                        elem.get("endDate", ""),
                    )
                    kept += 1
            elif rtype in CATEGORY_TYPES:
                acc.add_category(
                    rtype,
                    elem.get("value", ""),
                    elem.get("startDate", ""),
                    elem.get("endDate", ""),
                )
                kept += 1
            elem.clear()

        # ---- <WorkoutStatistics> (child of <Workout>) ----
        elif tag == "WorkoutStatistics" and in_workout:
            stat_type = elem.get("type", "")
            workout_stats[stat_type] = {
                "sum": _safe_float(elem.get("sum")),
                "average": _safe_float(elem.get("average")),
                "minimum": _safe_float(elem.get("minimum")),
                "maximum": _safe_float(elem.get("maximum")),
                "unit": elem.get("unit", ""),
            }
            elem.clear()

        # ---- </Workout> ----
        elif tag == "Workout":
            in_workout = False

            wtype = elem.get("workoutActivityType", "Unknown")
            start_str = elem.get("startDate", "")
            end_str = elem.get("endDate", "")
            source = elem.get("sourceName", "")

            # Duration
            dur = _safe_float(elem.get("duration"))
            dur_unit = elem.get("durationUnit", "min")
            if dur is not None and dur_unit == "s":
                dur /= 60.0

            # Distance -- prefer WorkoutStatistics, fallback to attribute
            dist_km = None
            for dist_key in (
                "HKQuantityTypeIdentifierDistanceWalkingRunning",
                "HKQuantityTypeIdentifierDistanceCycling",
                "HKQuantityTypeIdentifierDistanceSwimming",
            ):
                st = workout_stats.get(dist_key)
                if st and st["sum"] is not None:
                    dist_km = st["sum"]
                    u = st["unit"]
                    if u == "m":
                        dist_km /= 1000.0
                    elif u == "mi":
                        dist_km *= 1.60934
                    break
            if dist_km is None:
                td = _safe_float(elem.get("totalDistance"))
                if td is not None:
                    tdu = elem.get("totalDistanceUnit", "km")
                    if tdu == "m":
                        dist_km = td / 1000.0
                    elif tdu == "mi":
                        dist_km = td * 1.60934
                    else:
                        dist_km = td

            # Energy -- same pattern
            energy = None
            e_stat = workout_stats.get(
                "HKQuantityTypeIdentifierActiveEnergyBurned")
            if e_stat and e_stat["sum"] is not None:
                energy = e_stat["sum"]
                if e_stat["unit"] == "kJ":
                    energy /= 4.184
            if energy is None:
                te = _safe_float(elem.get("totalEnergyBurned"))
                if te is not None:
                    teu = elem.get("totalEnergyBurnedUnit", "Cal")
                    energy = te / 4.184 if teu == "kJ" else te

            acc.add_workout(wtype, dur, dist_km, energy,
                            start_str, end_str, source)
            workouts += 1
            workout_stats = {}
            elem.clear()

        # ---- everything else: clear to free memory ----
        else:
            elem.clear()

    print(f"\nParse complete.")
    print(f"  Total XML elements: {total:,}")
    print(f"  Records kept:       {kept:,}")
    print(f"  Workouts kept:      {workouts:,}")
    return acc


# ---------------------------------------------------------------------------
# Public API  (preserves backward compatibility with run_pipeline.py)
# ---------------------------------------------------------------------------

def parse_apple_health(export_path: Optional[Path] = None) -> pd.DataFrame:
    """
    Parse Apple Health ``export.xml`` using streaming iterparse.

    Uses ``iterparse`` to handle multi-GB files without loading into memory.
    Extracts quantity records, category samples (sleep, stand hours), and
    workouts.  Aggregates to daily granularity.

    Parameters
    ----------
    export_path : Path or None
        Path to ``export.xml``.  If *None* or the file does not exist,
        returns an empty DataFrame (stub mode for pipeline runs without
        Apple Health data).

    Returns
    -------
    pd.DataFrame
        One row per calendar day with columns for every tracked metric.
    """
    if export_path is None or not Path(export_path).exists():
        print("Apple Health export not found -- returning empty DataFrame (stub mode)")
        return _empty_daily_df()

    acc = _stream_parse(str(export_path))
    print("Building daily aggregated DataFrame...")
    df = acc.build_dataframe()
    print(f"  Shape: {df.shape[0]} days x {df.shape[1]} columns")
    if len(df) > 0:
        print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
    return df


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        xml_path = r"C:\Users\samci\Downloads\Serif_Demo\Oron_Akek_Data\export.xml"
    else:
        xml_path = sys.argv[1]

    if not os.path.exists(xml_path):
        print(f"ERROR: File not found: {xml_path}")
        sys.exit(1)

    # Parse
    acc = _stream_parse(xml_path, progress_every=1_000_000)

    # Build daily DataFrame
    print("\nBuilding daily aggregated DataFrame...")
    df = acc.build_dataframe()

    print(f"  Shape: {df.shape[0]} days x {df.shape[1]} columns")
    if len(df) > 0:
        print(f"  Date range: {df['date'].min()} to {df['date'].max()}")

    # Column summary
    print("\nColumn coverage:")
    for col in df.columns:
        nn = df[col].notna().sum()
        print(f"  {col:<42s} {nn:>6} non-null / {len(df)}")

    # Save CSV
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "oron_apple_health_daily.csv")
    df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"\nSaved to: {output_path}")

    # Quick preview
    preview_cols = [
        "date", "steps", "active_energy_kcal",
        "heart_rate_mean", "resting_hr_mean",
        "sleep_total_asleep_min", "workout_count",
    ]
    available = [c for c in preview_cols if c in df.columns]
    if available:
        print("\nPreview (first 10 rows, selected columns):")
        with pd.option_context("display.max_columns", 20, "display.width", 140):
            print(df[available].head(10).to_string())

    return df


if __name__ == "__main__":
    main()
