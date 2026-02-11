"""
Daily Timeline Builder.

Merges all data sources into a single daily DataFrame:
  - Apple Health (from export.xml parse)
  - AutoSleep (from CSV)
  - GPX workouts (via load_computer)
  - Lab results (sparse, GP-smoothed)

The output is one row per calendar day with every variable available
for BCEL fitting. Column names match what edge_table.py expects.
"""
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional

from inference_engine.config import (
    APPLE_HEALTH_DAILY_CSV,
    AUTOSLEEP_CSV,
    DAILY_TIMELINE_CSV,
    OUTPUT_DIR,
)


def _load_apple_health_daily(path: Optional[Path] = None) -> pd.DataFrame:
    """Load pre-parsed Apple Health daily CSV."""
    path = path or APPLE_HEALTH_DAILY_CSV
    if not path.exists():
        print(f"  Apple Health daily CSV not found: {path}")
        return pd.DataFrame(columns=["date"])
    df = pd.read_csv(path, parse_dates=["date"])
    print(f"  Apple Health: {len(df)} days, {len(df.columns)} columns")
    return df


def _load_autosleep(path: Optional[Path] = None) -> pd.DataFrame:
    """Load AutoSleep data."""
    from inference_engine.etl.autosleep_loader import load_autosleep
    path = path or AUTOSLEEP_CSV
    if not path.exists():
        print(f"  AutoSleep CSV not found: {path}")
        return pd.DataFrame(columns=["date"])
    df = load_autosleep(path)
    df = df.reset_index()  # date from index to column
    print(f"  AutoSleep: {len(df)} nights")
    return df


def _load_gpx_workouts(workouts_csv: Optional[Path] = None) -> pd.DataFrame:
    """Load pre-parsed GPX workouts CSV."""
    if workouts_csv is None:
        workouts_csv = Path(__file__).parent.parent / "etl" / "oron_gpx_workouts.csv"
    if not workouts_csv.exists():
        print(f"  GPX workouts CSV not found: {workouts_csv}")
        return pd.DataFrame(columns=["date"])
    df = pd.read_csv(workouts_csv, parse_dates=["date"])
    print(f"  GPX workouts: {len(df)} workouts")
    return df


def _load_lab_results() -> pd.DataFrame:
    """Load lab results in wide format."""
    from inference_engine.etl.loader import load_lab_results
    try:
        df = load_lab_results()
        if len(df) > 0:
            df["date"] = pd.to_datetime(df["date"])
            print(f"  Lab results: {len(df)} draws")
        return df
    except Exception as e:
        print(f"  Lab results error: {e}")
        return pd.DataFrame(columns=["date"])


def _compute_gpx_daily(workouts_df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate per-workout data to per-day and compute training loads.
    Uses load_computer for rolling metrics.
    """
    from inference_engine.data_prep.load_computer import compute_daily_loads, compute_rolling_loads

    if workouts_df.empty:
        return pd.DataFrame(columns=["date"])

    daily = compute_daily_loads(workouts_df)
    daily = compute_rolling_loads(daily)
    print(f"  GPX daily + loads: {len(daily)} days, {len(daily.columns)} columns")
    return daily


def _smooth_lab_markers(lab_df: pd.DataFrame, date_range: pd.DatetimeIndex) -> pd.DataFrame:
    """
    Create daily estimates for sparse lab markers using linear interpolation.
    GP smoothing would be better but linear interp is sufficient for BCEL
    since the prior dominates with only 6 data points.
    """
    if lab_df.empty or len(lab_df) < 2:
        return pd.DataFrame({"date": date_range})

    # Markers we want to interpolate
    marker_cols = [
        # Iron / hematology
        "iron_total", "ferritin", "iron_saturation_pct",
        "iron_saturation_pct_computed", "hemoglobin", "hematocrit",
        # CBC
        "wbc", "rbc", "mcv", "rdw", "platelets",
        "neutrophils_abs", "lymphocytes_abs",
        # Hormones
        "testosterone", "free_testosterone", "shbg", "dhea_s",
        "cortisol", "estradiol", "fsh", "lh",
        # Thyroid
        "free_t3", "free_t4",
        # Lipids
        "total_cholesterol", "hdl", "ldl", "triglycerides",
        "non_hdl_cholesterol", "apob", "ldl_particle_number",
        # Inflammation
        "hscrp",
        # Metabolic
        "glucose", "hba1c", "insulin", "uric_acid", "homocysteine",
        # Vitamins / minerals
        "vitamin_d", "b12", "folate", "zinc", "magnesium_rbc",
        # Omega-3
        "epa", "dha", "arachidonic_acid", "omega3_index",
        # Kidney / liver
        "creatinine", "egfr", "ast", "alt", "albumin",
    ]
    available = [c for c in marker_cols if c in lab_df.columns]

    # Create daily index and interpolate
    lab_indexed = lab_df.set_index("date")[available].sort_index()

    # Reindex to full date range
    daily_markers = lab_indexed.reindex(date_range)

    # Linear interpolation between draws (no extrapolation beyond draw dates)
    daily_markers = daily_markers.interpolate(method="linear", limit_direction="forward")

    # Add "_smoothed" suffix to distinguish from raw values
    daily_markers.columns = [f"{c}_smoothed" for c in daily_markers.columns]
    daily_markers = daily_markers.reset_index()
    daily_markers = daily_markers.rename(columns={"index": "date"})

    # Also keep raw lab values on draw dates
    raw = lab_df.set_index("date")[available].reindex(date_range)
    raw.columns = [f"{c}_raw" for c in raw.columns]
    raw = raw.reset_index().rename(columns={"index": "date"})

    result = daily_markers.merge(raw, on="date", how="left")
    non_null = sum(result[c].notna().sum() for c in result.columns if c != "date")
    print(f"  Smoothed markers: {len(available)} markers, {non_null} non-null values")
    return result


def _standardize_apple_health_columns(ah_df: pd.DataFrame) -> pd.DataFrame:
    """
    Rename Apple Health parser columns to match what edge_table expects.
    """
    rename_map = {
        # Direct matches
        "steps": "steps",
        "active_energy_kcal": "active_energy_kcal",
        "basal_energy_kcal": "basal_energy_kcal",
        "distance_walking_running_km": "distance_walking_running_km",
        "distance_cycling_km": "distance_cycling_km",
        "exercise_time_min": "exercise_time_min",
        "stand_time_min": "stand_time_min",
        "flights_climbed": "flights_climbed",
        "body_mass_kg": "body_mass_kg",
        "body_fat_pct": "body_fat_pct",
        "vo2max": "vo2max_apple",

        # Mean columns
        "hrv_sdnn_mean": "hrv_daily_mean",
        "resting_hr_mean": "resting_hr",
        "walking_hr_avg_mean": "walking_hr_avg",
        "heart_rate_mean": "heart_rate_avg",
        "spo2_mean": "spo2_daily",
        "respiratory_rate_mean": "respiratory_rate",

        # Heart rate extremes
        "heart_rate_min": "hr_min",
        "heart_rate_max": "hr_max",

        # Sleep from Apple Health
        "sleep_total_asleep_min": "ah_sleep_total_min",
        "sleep_deep_min": "ah_deep_sleep_min",
        "sleep_rem_min": "ah_rem_sleep_min",
        "sleep_core_min": "ah_core_sleep_min",
        "sleep_awake_min": "ah_awake_min",
        "sleep_in_bed_min": "ah_in_bed_min",

        # Workouts from Apple Health
        "workout_count": "ah_workout_count",
        "workout_total_duration_min": "ah_workout_duration_min",
        "workout_total_energy_kcal": "ah_workout_energy_kcal",
        "workout_total_distance_km": "ah_workout_distance_km",

        # HRV extra
        "hrv_sdnn_std": "hrv_daily_std",
        "hrv_sdnn_count": "hrv_readings_count",

        # Stand hours
        "stand_hours_count": "stand_hours",

        # Nutrition
        "dietary_energy_kcal": "dietary_energy_kcal",
        "dietary_protein_g": "dietary_protein_g",
        "dietary_carbs_g": "dietary_carbs_g",
        "dietary_fat_g": "dietary_fat_g",
        "dietary_water_ml": "dietary_water_ml",
    }

    df = ah_df.copy()
    actual_renames = {k: v for k, v in rename_map.items() if k in df.columns}
    df = df.rename(columns=actual_renames)
    return df


def _derive_combined_columns(merged: pd.DataFrame) -> pd.DataFrame:
    """
    Compute derived columns that need data from multiple sources.
    These are the actual dose/response variables used by edge_table.
    """
    df = merged.copy()

    # ── HRV: prefer Apple Health, fall back to AutoSleep ─────────
    if "hrv_daily_mean" in df.columns and "sleep_hrv_ms" in df.columns:
        df["hrv_daily_mean"] = df["hrv_daily_mean"].fillna(df["sleep_hrv_ms"])
    elif "sleep_hrv_ms" in df.columns:
        df["hrv_daily_mean"] = df["sleep_hrv_ms"]

    # HRV 7-day rolling mean
    if "hrv_daily_mean" in df.columns:
        df["hrv_7d_mean"] = df["hrv_daily_mean"].rolling(7, min_periods=3).mean()

    # ── Resting HR: prefer Apple Health, fall back to AutoSleep ──
    if "resting_hr" in df.columns and "sleep_hr_bpm" in df.columns:
        df["resting_hr"] = df["resting_hr"].fillna(df["sleep_hr_bpm"])
    elif "sleep_hr_bpm" in df.columns:
        df["resting_hr"] = df["sleep_hr_bpm"]

    # Resting HR 7-day mean
    if "resting_hr" in df.columns:
        df["resting_hr_7d_mean"] = df["resting_hr"].rolling(7, min_periods=3).mean()

    # ── Sleep: prefer AutoSleep (more detailed), with AH fallback ─
    # sleep_duration_hrs already from AutoSleep
    # sleep_efficiency_pct already from AutoSleep
    # deep_sleep_min already from AutoSleep
    # sleep_quality_score already from AutoSleep

    # Fill sleep_duration_hrs from Apple Health where AutoSleep is missing
    if "ah_sleep_total_min" in df.columns:
        ah_sleep_hrs = df["ah_sleep_total_min"] / 60.0
        if "sleep_duration_hrs" in df.columns:
            df["sleep_duration_hrs"] = df["sleep_duration_hrs"].fillna(ah_sleep_hrs)
        else:
            df["sleep_duration_hrs"] = ah_sleep_hrs

    # Cap sleep at 14 hours — values above this are HealthKit duplication artifacts
    # (multiple sources recording overlapping sleep sessions on the same date)
    if "sleep_duration_hrs" in df.columns:
        df.loc[df["sleep_duration_hrs"] > 14, "sleep_duration_hrs"] = np.nan

    # ── Run distance from GPX (daily_run_km) ──────────────────────
    # Already in GPX daily loads as "daily_run_km"
    # Create run_distance_km alias for edge_table
    if "daily_run_km" in df.columns:
        df["run_distance_km"] = df["daily_run_km"]

    # ── Zone 2 minutes from GPX ───────────────────────────────────
    if "daily_zone2_min" in df.columns:
        df["zone2_minutes"] = df["daily_zone2_min"]

    # ── Workout duration ──────────────────────────────────────────
    if "daily_duration_min" in df.columns:
        df["workout_duration_min"] = df["daily_duration_min"]

    # ── Training consistency (90-day) ─────────────────────────────
    if "training_consistency" in df.columns:
        df["training_consistency_90d"] = df["training_consistency"]

    # ── Workout end hour ──────────────────────────────────────────
    if "latest_workout_hour" in df.columns:
        df["last_workout_end_hour"] = df["latest_workout_hour"]

    # ── Day of week, season, and other Environment variables ───────
    df["day_of_week"] = df["date"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["month"] = df["date"].dt.month
    df["year"] = df["date"].dt.year
    df["season"] = df["month"].map({
        1: "winter", 2: "winter", 3: "spring", 4: "spring",
        5: "spring", 6: "summer", 7: "summer", 8: "summer",
        9: "fall", 10: "fall", 11: "fall", 12: "winter",
    })

    # ── Location: forward-fill from GPX workout location ─────────
    if "location" in df.columns:
        df["location"] = df["location"].replace(0, np.nan).ffill().bfill()

    # ── VO2peak: use Apple Watch vo2max as proxy ────────────────
    if "vo2max_apple" in df.columns:
        # Apple Watch VO2max is a good proxy for VO2peak
        # Fill forward (VO2max updates infrequently)
        df["vo2_peak_smoothed"] = df["vo2max_apple"].ffill()

    # ── Derived lab ratios ────────────────────────────────────────
    # Neutrophil-to-Lymphocyte Ratio (NLR) — inflammation / immune stress proxy
    if "neutrophils_abs_smoothed" in df.columns and "lymphocytes_abs_smoothed" in df.columns:
        denom = df["lymphocytes_abs_smoothed"].clip(lower=0.1)
        df["nlr"] = df["neutrophils_abs_smoothed"] / denom

    # Omega-3 Index (EPA + DHA, if not already computed upstream)
    if "epa_smoothed" in df.columns and "dha_smoothed" in df.columns:
        df["omega3_index_derived"] = df["epa_smoothed"] + df["dha_smoothed"]

    # Free T / Total T ratio
    if "free_testosterone_smoothed" in df.columns and "testosterone_smoothed" in df.columns:
        denom = df["testosterone_smoothed"].clip(lower=1.0)
        df["free_t_ratio"] = df["free_testosterone_smoothed"] / denom

    # AST/ALT ratio (De Ritis ratio — liver vs muscle damage)
    if "ast_smoothed" in df.columns and "alt_smoothed" in df.columns:
        denom = df["alt_smoothed"].clip(lower=1.0)
        df["ast_alt_ratio"] = df["ast_smoothed"] / denom

    # ── Workout intensity category for adjustment ─────────────────
    if "avg_intensity_factor" in df.columns:
        df["workout_intensity"] = pd.cut(
            df["avg_intensity_factor"],
            bins=[0, 0.3, 0.6, 1.0, 2.0],
            labels=["rest", "easy", "moderate", "hard"],
        )
    else:
        df["workout_intensity"] = "unknown"

    return df


def build_daily_timeline(
    apple_health_csv: Optional[Path] = None,
    autosleep_csv: Optional[Path] = None,
    gpx_workouts_csv: Optional[Path] = None,
    save: bool = True,
) -> pd.DataFrame:
    """
    Build the master daily timeline by merging all data sources.

    Returns a DataFrame with one row per calendar day and all columns
    needed by the edge table for BCEL fitting.
    """
    print("=" * 60)
    print("Building daily timeline")
    print("=" * 60)

    # 1. Load all data sources
    print("\n1. Loading data sources...")
    ah_df = _load_apple_health_daily(apple_health_csv)
    as_df = _load_autosleep(autosleep_csv)
    gpx_df = _load_gpx_workouts(gpx_workouts_csv)
    lab_df = _load_lab_results()

    # 2. Compute GPX daily loads
    print("\n2. Computing training loads from GPX...")
    gpx_daily = _compute_gpx_daily(gpx_df)

    # 3. Standardize Apple Health columns
    print("\n3. Standardizing column names...")
    if not ah_df.empty and "date" in ah_df.columns:
        ah_df = _standardize_apple_health_columns(ah_df)

    # 4. Determine date range
    all_dates = []
    for src in [ah_df, as_df, gpx_daily]:
        if not src.empty and "date" in src.columns:
            all_dates.extend(src["date"].dropna().tolist())
    if not all_dates:
        print("ERROR: No data found in any source!")
        return pd.DataFrame()

    date_min = pd.Timestamp(min(all_dates))
    date_max = pd.Timestamp(max(all_dates))
    full_range = pd.date_range(date_min, date_max, freq="D")
    print(f"\n4. Date range: {date_min.date()} to {date_max.date()} ({len(full_range)} days)")

    # 5. Smooth lab markers across the full date range
    print("\n5. Smoothing lab markers...")
    lab_smooth = _smooth_lab_markers(lab_df, full_range)

    # 6. Create base DataFrame with complete date range
    merged = pd.DataFrame({"date": full_range})

    # 7. Merge GPX daily loads (left join on date)
    if not gpx_daily.empty:
        gpx_daily["date"] = pd.to_datetime(gpx_daily["date"])
        merged = merged.merge(gpx_daily, on="date", how="left")
        print(f"  After GPX merge: {len(merged.columns)} columns")

    # 8. Merge AutoSleep
    if not as_df.empty:
        as_df["date"] = pd.to_datetime(as_df["date"])
        # Prefix AutoSleep columns that might conflict
        merged = merged.merge(as_df, on="date", how="left", suffixes=("", "_autosleep"))
        print(f"  After AutoSleep merge: {len(merged.columns)} columns")

    # 9. Merge Apple Health
    if not ah_df.empty and "date" in ah_df.columns:
        ah_df["date"] = pd.to_datetime(ah_df["date"])
        merged = merged.merge(ah_df, on="date", how="left", suffixes=("", "_ah"))
        print(f"  After Apple Health merge: {len(merged.columns)} columns")

    # 10. Merge smoothed lab markers
    if not lab_smooth.empty:
        lab_smooth["date"] = pd.to_datetime(lab_smooth["date"])
        merged = merged.merge(lab_smooth, on="date", how="left")
        print(f"  After lab merge: {len(merged.columns)} columns")

    # 11. Derive combined columns
    print("\n6. Computing derived columns...")
    merged = _derive_combined_columns(merged)
    print(f"  Final: {len(merged)} days x {len(merged.columns)} columns")

    # 12. Fill zeros for training metrics on rest days
    training_fill_zero = [
        "daily_trimp", "daily_distance_km", "daily_run_km", "daily_cycle_km",
        "daily_zone2_min", "daily_high_intensity_min", "daily_duration_min",
        "daily_elevation_m", "daily_ground_contacts", "n_workouts",
        "run_distance_km", "zone2_minutes", "workout_duration_min",
    ]
    for col in training_fill_zero:
        if col in merged.columns:
            merged[col] = merged[col].fillna(0)

    # 13. Sort by date
    merged = merged.sort_values("date").reset_index(drop=True)

    # 14. Report coverage
    print("\n7. Column coverage summary:")
    print(f"{'Column':<45s} {'Non-null':>8s} {'Pct':>6s}")
    print("-" * 62)
    for col in sorted(merged.columns):
        if col == "date":
            continue
        nn = merged[col].notna().sum()
        pct = nn / len(merged) * 100
        if nn > 0:
            print(f"  {col:<43s} {nn:>6d}   {pct:>5.1f}%")

    # 15. Save
    if save:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = DAILY_TIMELINE_CSV
        merged.to_csv(out_path, index=False)
        print(f"\nSaved timeline to: {out_path}")

    return merged


# ── Edge data extraction ─────────────────────────────────────────

def extract_dose_response(
    timeline: pd.DataFrame,
    dose_variable: str,
    dose_window: int,
    dose_agg: str,
    response_variable: str,
    response_lag: int,
    min_observations: int = 6,
    adjustment_set: Optional[list] = None,
) -> Optional[tuple]:
    """
    Extract aligned (x, y) arrays for BCEL fitting from the timeline.

    Applies the dose window aggregation and response lag as specified
    by the edge table.

    Args:
        adjustment_set: Optional list of column names for backdoor adjustment.
            If provided, returns (x, y, Z) where Z is the standardized
            covariate matrix. If None, returns (x, y).

    Returns:
        (x, y) or (x, y, Z) numpy arrays, or None if insufficient data.
    """
    df = timeline.copy()

    # Check columns exist
    if dose_variable not in df.columns:
        print(f"    WARNING: dose variable '{dose_variable}' not in timeline")
        return None
    if response_variable not in df.columns:
        print(f"    WARNING: response variable '{response_variable}' not in timeline")
        return None

    # Compute dose: rolling aggregation
    dose_col = df[dose_variable].astype(float)
    if dose_window > 1:
        if dose_agg == "sum":
            dose = dose_col.rolling(dose_window, min_periods=max(1, dose_window // 2)).sum()
        elif dose_agg == "mean":
            dose = dose_col.rolling(dose_window, min_periods=max(1, dose_window // 2)).mean()
        elif dose_agg == "max":
            dose = dose_col.rolling(dose_window, min_periods=1).max()
        else:
            dose = dose_col
    else:
        dose = dose_col

    # Response with lag
    response = df[response_variable].astype(float)
    if response_lag > 0:
        response = response.shift(-response_lag)

    # Build covariate columns if adjustment set is provided
    cov_columns = []
    if adjustment_set:
        for col in adjustment_set:
            if col not in df.columns:
                continue
            # Encode categorical variables
            if df[col].dtype == object or col in ("season", "location"):
                dummies = pd.get_dummies(df[col], prefix=col, drop_first=True)
                for dc in dummies.columns:
                    cov_columns.append(dummies[dc].astype(float))
            else:
                cov_columns.append(df[col].astype(float))

    # Align: dose, response, and all covariates must be non-null
    mask = dose.notna() & response.notna()
    for cc in cov_columns:
        mask = mask & cc.notna()

    x = dose[mask].values
    y = response[mask].values

    if len(x) < min_observations:
        print(f"    Insufficient data: {len(x)} obs (need {min_observations})")
        return None

    # Check dose variance (skip if constant)
    if np.std(x) < 1e-6:
        print(f"    No variance in dose variable")
        return None

    # Build and standardize covariate matrix
    if cov_columns:
        Z_raw = np.column_stack([cc[mask].values for cc in cov_columns])
        # Standardize: zero mean, unit variance (so gamma is interpretable)
        Z_mean = Z_raw.mean(axis=0)
        Z_std = Z_raw.std(axis=0)
        Z_std[Z_std < 1e-8] = 1.0  # Avoid division by zero for constant cols
        Z = (Z_raw - Z_mean) / Z_std
        return x, y, Z

    return x, y


def get_current_dose(timeline: pd.DataFrame, dose_variable: str,
                     dose_window: int, dose_agg: str,
                     lookback_days: int = 30) -> Optional[float]:
    """
    Get the most recent dose value for determining current status.
    Uses the last `lookback_days` of data.

    For 1-day window edges, uses a 7-day rolling mean instead of the
    last single day to avoid rest-day artifacts (e.g., "You: 0" on a
    day with no training).

    Returns None if no data is available (rather than 0), so the insight
    can honestly report "current status unknown" instead of showing 0.
    """
    df = timeline.tail(lookback_days)
    if dose_variable not in df.columns:
        return None

    dose_col = df[dose_variable].astype(float).dropna()
    if dose_col.empty:
        return None

    # For sum aggregations, require at least half the window to be non-null
    # to avoid under-reporting (e.g., 3 days of data for a 28-day window)
    if dose_window > 1 and dose_agg == "sum":
        available = min(dose_window, len(dose_col))
        if available < dose_window // 2:
            return None  # Insufficient data for a meaningful sum
        return dose_col.tail(available).sum()
    elif dose_window > 1 and dose_agg == "mean":
        return dose_col.tail(min(dose_window, len(dose_col))).mean()
    elif dose_agg == "max":
        return dose_col.tail(min(dose_window, len(dose_col))).max()
    else:
        # For 1-day window edges, use 7-day rolling mean to avoid
        # single rest-day artifacts showing "You: 0"
        recent = dose_col.tail(min(7, len(dose_col)))

        # For "last" variables where 0 means "absent" (e.g., workout end hour,
        # bedtime_hour), exclude zeros before averaging to show only active days
        _zero_means_absent = {"last_workout_end_hour", "bedtime_hour"}
        if dose_variable in _zero_means_absent:
            nonzero = recent[recent > 0]
            if not nonzero.empty:
                return nonzero.mean()
            return None  # No activity in recent window

        return recent.mean()


if __name__ == "__main__":
    df = build_daily_timeline()
    print(f"\nDone. Shape: {df.shape}")
