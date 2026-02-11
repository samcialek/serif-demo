"""
Load computer — derives ALL accumulated state variables from raw data.

A Load is any rolling or cumulative state that:
  1. Accumulates over time from Choices or physiological processes
  2. Modifies the dose-response relationship between a Choice and an Outcome/Marker
  3. Cannot be "set" on a single day — it reflects history

Example: The effect of a 10km run on iron depends on whether you've run
200km in the past month (high cumulative foot-strike load) or 40km (low).
The weekly_run_km load modifies the run→iron dose-response curve.

LOAD CATEGORIES:
  A. Training Volume Loads      — how much physical stress has accumulated
  B. Training Pattern Loads     — how the training is structured (monotony, polarization)
  C. Mechanical Impact Loads    — cumulative ground reaction force, joint stress
  D. Iron Depletion Load        — cumulative hemolysis + sweat iron loss
  E. Hormonal Stress Load       — HPG axis suppression from chronic training
  F. Recovery State Loads       — sleep debt, HRV trend (Apple Watch)
  G. Metabolic/Fueling Loads    — energy availability, glycogen status
  H. Travel & Disruption Loads  — jet lag, routine disruption
  I. Environmental Exposure     — heat/cold acclimatization, altitude adaptation

Data sources:
  - GPX (679 files, 9+ years): Categories A, B, C, D, H
  - Quest Labs (6 draws): Category D (iron depletion rate)
  - Medix CPET: Calibration for intensity zones
  - Apple Watch (incoming): Categories F, G, I
"""
import numpy as np
import pandas as pd

from inference_engine.config import VT1_SPEED_KMH


# ══════════════════════════════════════════════════════════════════
# PER-WORKOUT COMPUTATIONS
# ══════════════════════════════════════════════════════════════════

def _intensity_factor(avg_speed: float, workout_type: str) -> float:
    """
    Compute intensity factor (0-3) calibrated to Oron's VT1.
    VT1 at 16.6 km/h running maps to intensity factor = 1.0.
    """
    if workout_type == "running":
        ratio = avg_speed / VT1_SPEED_KMH
        if ratio < 0.75:
            return 0.5   # Easy / recovery
        elif ratio < 0.95:
            return 0.8   # Zone 2 (aerobic base)
        elif ratio < 1.05:
            return 1.2   # Threshold (at VT1)
        else:
            return 1.8   # High intensity (above VT1)
    elif workout_type == "cycling":
        if avg_speed < 20:
            return 0.5
        elif avg_speed < 28:
            return 0.8
        elif avg_speed < 33:
            return 1.2
        else:
            return 1.6
    else:
        return 0.4  # Walking, other


def compute_trimp(duration_min: float, avg_speed: float, workout_type: str) -> float:
    """TRIMP = duration * intensity_factor."""
    return duration_min * _intensity_factor(avg_speed, workout_type)


def _is_zone2(intensity: str) -> bool:
    return intensity == "zone2"


def _is_high_intensity(intensity: str) -> bool:
    return intensity in ("threshold", "high")


def _estimate_ground_contacts(distance_km: float, workout_type: str) -> float:
    """
    Estimate ground contact count from distance.
    Running: ~1400 steps/km (cadence ~170-180 spm, stride ~1.4m)
    Walking: ~1300 steps/km
    Cycling: 0 (no foot strike)
    """
    if workout_type == "running":
        return distance_km * 1400
    elif workout_type == "walking":
        return distance_km * 1300
    return 0.0


# ══════════════════════════════════════════════════════════════════
# CATEGORY A: TRAINING VOLUME LOADS
# The foundation — how much total stress has accumulated
# ══════════════════════════════════════════════════════════════════

def compute_daily_loads(workouts_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute daily training load aggregates from workout DataFrame.

    Input: workouts_df with columns [date, duration_min, distance_km, avg_speed_kmh,
           workout_type, intensity, elevation_gain_m, location, time_of_day, hour]

    Returns: daily_df with per-day aggregate training metrics.
    """
    df = workouts_df.copy()
    df["date"] = pd.to_datetime(df["date"])

    # Per-workout derived metrics
    df["trimp"] = df.apply(
        lambda r: compute_trimp(r["duration_min"], r["avg_speed_kmh"], r["workout_type"]),
        axis=1,
    )
    df["zone2_min"] = df.apply(
        lambda r: r["duration_min"] if _is_zone2(r["intensity"]) else 0, axis=1
    )
    df["high_intensity_min"] = df.apply(
        lambda r: r["duration_min"] if _is_high_intensity(r["intensity"]) else 0, axis=1
    )
    df["run_km"] = df.apply(
        lambda r: r["distance_km"] if r["workout_type"] == "running" else 0, axis=1
    )
    df["cycle_km"] = df.apply(
        lambda r: r["distance_km"] if r["workout_type"] == "cycling" else 0, axis=1
    )
    df["ground_contacts"] = df.apply(
        lambda r: _estimate_ground_contacts(r["distance_km"], r["workout_type"]), axis=1
    )

    # Aggregate to daily
    agg_dict = {
        "daily_trimp": ("trimp", "sum"),
        "daily_distance_km": ("distance_km", "sum"),
        "daily_run_km": ("run_km", "sum"),
        "daily_cycle_km": ("cycle_km", "sum"),
        "daily_zone2_min": ("zone2_min", "sum"),
        "daily_high_intensity_min": ("high_intensity_min", "sum"),
        "daily_duration_min": ("duration_min", "sum"),
        "daily_elevation_m": ("elevation_gain_m", "sum"),
        "daily_ground_contacts": ("ground_contacts", "sum"),
        "n_workouts": ("trimp", "count"),
        "has_running": ("workout_type", lambda x: "running" in x.values),
        "has_cycling": ("workout_type", lambda x: "cycling" in x.values),
        "avg_intensity_factor": ("trimp", lambda x: x.sum() / max(df.loc[x.index, "duration_min"].sum(), 1)),
    }
    if "hour" in df.columns:
        agg_dict["latest_workout_hour"] = ("hour", "max")
    # Propagate location: take the most common location for multi-workout days
    if "location" in df.columns:
        agg_dict["location"] = ("location", lambda x: x.mode().iloc[0] if len(x) > 0 else "unknown")

    daily = df.groupby("date").agg(**agg_dict).reset_index()

    # Fill gaps: create complete date range with rest days as zeros
    if len(daily) > 0:
        date_range = pd.date_range(daily["date"].min(), daily["date"].max(), freq="D")

        # Separate location (needs forward-fill) from numeric cols (need zero-fill)
        has_location = "location" in daily.columns
        if has_location:
            location_series = daily.set_index("date")["location"]

        daily = daily.set_index("date").reindex(date_range, fill_value=0).reset_index()
        daily = daily.rename(columns={"index": "date"})

        # Forward-fill location on rest days (you're still in the same country)
        if has_location:
            daily["location"] = location_series.reindex(date_range).ffill().bfill().values

        daily["has_running"] = daily["has_running"].astype(bool)
        daily["has_cycling"] = daily["has_cycling"].astype(bool)
        daily["is_rest_day"] = daily["daily_trimp"] == 0

    return daily


def compute_rolling_loads(daily_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute ALL rolling load metrics from daily aggregates.

    This is the main function that produces every Load variable.
    Organized by load category.
    """
    df = daily_df.copy()
    df = df.sort_values("date").reset_index(drop=True)

    # ══════════════════════════════════════════════════════════════
    # A. TRAINING VOLUME LOADS — total accumulated physical stress
    # ══════════════════════════════════════════════════════════════

    # ATL: Acute Training Load (7-day EWMA of daily TRIMP)
    # Why it matters: High ATL relative to CTL signals overreaching risk
    df["atl"] = df["daily_trimp"].ewm(span=7, min_periods=1).mean().round(1)

    # CTL: Chronic Training Load (42-day EWMA of daily TRIMP)
    # Why it matters: Baseline fitness. Determines what training the body can absorb
    df["ctl"] = df["daily_trimp"].ewm(span=42, min_periods=1).mean().round(1)

    # ACWR: Acute:Chronic Workload Ratio
    # Why it matters: THE key injury/overreaching predictor.
    # <0.8 = undertrained, 0.8-1.3 = sweet spot, >1.5 = danger zone
    # Modifies: training → hsCRP, training → testosterone, training → sleep
    df["acwr"] = (df["atl"] / df["ctl"].clip(lower=10)).round(2)

    # Weekly rolling sums (7-day windows)
    df["weekly_volume_km"] = df["daily_distance_km"].rolling(7, min_periods=1).sum().round(1)
    df["weekly_run_km"] = df["daily_run_km"].rolling(7, min_periods=1).sum().round(1)
    df["weekly_cycle_km"] = df["daily_cycle_km"].rolling(7, min_periods=1).sum().round(1)
    df["weekly_zone2_min"] = df["daily_zone2_min"].rolling(7, min_periods=1).sum().round(0)
    df["weekly_high_intensity_min"] = df["daily_high_intensity_min"].rolling(7, min_periods=1).sum().round(0)
    df["weekly_duration_min"] = df["daily_duration_min"].rolling(7, min_periods=1).sum().round(0)
    df["weekly_training_hrs"] = (df["weekly_duration_min"] / 60).round(1)
    df["weekly_elevation_m"] = df["daily_elevation_m"].rolling(7, min_periods=1).sum().round(0)
    df["weekly_intensity_score"] = df["daily_trimp"].rolling(7, min_periods=1).sum().round(0)

    # Monthly rolling sums (28-day windows) — for slower-responding markers like labs
    df["monthly_run_km"] = df["daily_run_km"].rolling(28, min_periods=7).sum().round(1)
    df["monthly_volume_km"] = df["daily_distance_km"].rolling(28, min_periods=7).sum().round(1)
    df["monthly_training_hrs"] = (df["daily_duration_min"].rolling(28, min_periods=7).sum() / 60).round(1)
    df["monthly_trimp"] = df["daily_trimp"].rolling(28, min_periods=7).sum().round(0)

    # ══════════════════════════════════════════════════════════════
    # B. TRAINING PATTERN LOADS — how the training is structured
    # These capture not just how much, but how it's distributed
    # ══════════════════════════════════════════════════════════════

    # Monotony: mean(daily_load) / std(daily_load) over 7 days
    # Why it matters: High monotony = every day the same = poor periodization.
    # Same weekly volume with high monotony is more damaging than with variation.
    # Modifies: training → hsCRP, training → testosterone, training → injury risk
    rolling_mean = df["daily_trimp"].rolling(7, min_periods=3).mean()
    rolling_std = df["daily_trimp"].rolling(7, min_periods=3).std()
    df["monotony"] = (rolling_mean / rolling_std.clip(lower=0.1)).round(2)

    # Strain: weekly_load × monotony
    # Why it matters: Captures both volume AND distribution.
    # High strain = high volume done monotonously = maximum overreaching risk
    weekly_load = df["daily_trimp"].rolling(7, min_periods=1).sum()
    df["strain"] = (weekly_load * df["monotony"]).round(0)

    # Training consistency: fraction of days with workouts in 28-day window
    # Why it matters: Consistent 4x/week is different from sporadic 7 sessions
    # clustered in one week. Modifies fitness adaptation rate.
    df["training_consistency"] = (
        (df["daily_trimp"] > 0).astype(float).rolling(28, min_periods=7).mean()
    ).round(2)

    # Polarization index: ratio of easy+zone2 to high-intensity minutes
    # Why it matters: Well-polarized training (80/20 rule) is more effective
    # and less damaging than moderate-intensity-dominated training.
    # Modifies: training → VO2peak adaptation, training → testosterone
    weekly_easy_zone2 = df["daily_zone2_min"].rolling(7, min_periods=1).sum()
    weekly_high = df["daily_high_intensity_min"].rolling(7, min_periods=1).sum()
    df["polarization_index"] = (
        weekly_easy_zone2 / (weekly_easy_zone2 + weekly_high).clip(lower=1)
    ).round(2)
    # 0.8+ = well polarized, 0.5-0.8 = threshold-heavy, <0.5 = intensity-dominant

    # Rest day ratio: fraction of rest days in 7-day window
    # Why it matters: Rest days enable adaptation. 0 rest days in 7 = no recovery.
    # Modifies: training → testosterone, training → hsCRP, training → HRV
    if "is_rest_day" in df.columns:
        df["rest_day_ratio_7d"] = (
            df["is_rest_day"].astype(float).rolling(7, min_periods=1).mean()
        ).round(2)
    else:
        df["rest_day_ratio_7d"] = 0.0

    # Week-over-week volume change: this week vs last week
    # Why it matters: A 30% jump in weekly volume is a strong overreaching trigger
    # regardless of absolute volume. >10% jump = risk, >30% = danger.
    # Modifies: acwr → hsCRP, weekly_km → iron, training → injury
    prev_week_volume = df["daily_distance_km"].rolling(7, min_periods=1).sum().shift(7)
    current_week_volume = df["daily_distance_km"].rolling(7, min_periods=1).sum()
    df["volume_change_pct"] = (
        ((current_week_volume - prev_week_volume) / prev_week_volume.clip(lower=1)) * 100
    ).round(1)

    # Double days count: days with 2+ workouts in 7-day window
    # Why it matters: Two-a-day sessions are higher-stress than the same volume
    # in single sessions. Modifies recovery and hormonal responses.
    df["double_days_7d"] = (
        (df["n_workouts"] >= 2).astype(float).rolling(7, min_periods=1).sum()
    ).round(0)

    # ══════════════════════════════════════════════════════════════
    # C. MECHANICAL IMPACT LOADS — cumulative ground reaction force
    # Specific to running — cycling has zero impact load
    # ══════════════════════════════════════════════════════════════

    # Weekly ground contacts: estimated foot strikes in 7-day window
    # Why it matters: Foot-strike hemolysis (iron destruction) is proportional
    # to the NUMBER of impacts, not just distance. Same distance at higher
    # cadence = more impacts. Modifies: running → iron, running → ferritin
    df["weekly_ground_contacts"] = (
        df["daily_ground_contacts"].rolling(7, min_periods=1).sum()
    ).round(0)

    # Monthly ground contacts: 28-day cumulative impacts
    # Why it matters: Iron depletion is a slow process. Monthly impact load
    # is more predictive of lab iron changes than weekly.
    df["monthly_ground_contacts"] = (
        df["daily_ground_contacts"].rolling(28, min_periods=7).sum()
    ).round(0)

    # Running-to-cycling ratio: proportion of km done running vs cycling
    # Why it matters: Same fitness work on bike has zero hemolysis. If Oron
    # shifts 30% of training to cycling, iron depletion should slow.
    # Modifies: weekly_km → iron, weekly_km → ferritin
    weekly_total = (df["daily_run_km"] + df["daily_cycle_km"]).rolling(7, min_periods=1).sum()
    df["run_to_cycle_ratio"] = (
        df["daily_run_km"].rolling(7, min_periods=1).sum() / weekly_total.clip(lower=0.1)
    ).round(2)

    # Weekly elevation gain: cumulative climbing in 7-day window
    # Why it matters: Uphill running has different ground reaction forces
    # (lower impact but higher muscular demand). Also affects energy expenditure.
    # Already computed above as weekly_elevation_m

    # ══════════════════════════════════════════════════════════════
    # D. IRON DEPLETION LOAD — cumulative hemolysis state
    # This is Oron's #1 clinical issue
    # ══════════════════════════════════════════════════════════════

    # Cumulative running since last lab draw
    # Why it matters: Iron labs are snapshots. What happened between draws
    # determines the trajectory. 400km of running between draws = high depletion.
    # This lets us estimate iron trajectory between lab dates.
    df["cumulative_run_km_since_reset"] = _cumulative_since_reset(
        df["daily_run_km"], reset_interval_days=None  # Will be reset at lab draw dates
    )

    # Cumulative ground contacts since last lab draw
    df["cumulative_ground_contacts_since_reset"] = _cumulative_since_reset(
        df["daily_ground_contacts"], reset_interval_days=None
    )

    # Iron depletion pressure: composite score combining multiple depletion mechanisms
    # Foot-strike hemolysis (proportional to ground contacts) +
    # Sweat iron loss (~0.3-0.5 mg/hr of sweating) +
    # GI losses (proportional to high-intensity running via gut ischemia)
    # Higher = more iron depletion pressure
    sweat_loss_proxy = df["daily_duration_min"] * 0.01  # normalized
    gi_loss_proxy = df["daily_high_intensity_min"] * 0.02  # running at high intensity
    hemolysis_proxy = df["daily_ground_contacts"] / 1000  # per 1000 contacts
    daily_iron_pressure = (hemolysis_proxy + sweat_loss_proxy + gi_loss_proxy).round(2)
    df["iron_depletion_pressure_7d"] = daily_iron_pressure.rolling(7, min_periods=1).mean().round(2)
    df["iron_depletion_pressure_28d"] = daily_iron_pressure.rolling(28, min_periods=7).mean().round(2)

    # ══════════════════════════════════════════════════════════════
    # E. HORMONAL STRESS LOAD — HPG axis suppression risk
    # ══════════════════════════════════════════════════════════════

    # Overtraining risk score: composite of volume, intensity, and recovery
    # Why it matters: Testosterone suppression is driven by chronic energy deficit,
    # high cortisol from training stress, and insufficient recovery. This composite
    # predicts hormonal suppression risk.
    # Modifies: training → testosterone, training → cortisol, training → DHEA-S
    training_stress = df["atl"].fillna(0) / df["atl"].rolling(90, min_periods=14).mean().clip(lower=1)
    rest_deficit = 1 - df["rest_day_ratio_7d"]
    mono_factor = (df["monotony"].fillna(1) / 3).clip(upper=1)  # normalize 0-1
    df["overtraining_risk_score"] = (
        (training_stress * 0.4 + rest_deficit * 0.3 + mono_factor * 0.3)
    ).round(2)

    # Consecutive heavy days: running count of days without rest
    # Why it matters: 10+ consecutive training days is a red flag for HPG suppression.
    # Even moderate volume becomes suppressive without recovery breaks.
    df["consecutive_training_days"] = _consecutive_count(df["daily_trimp"] > 0)

    # Chronic high-intensity load: 28-day rolling high-intensity minutes
    # Why it matters: High-intensity is disproportionately more cortisol-spiking
    # than zone 2. The ratio of high-intensity to total matters for hormones.
    df["monthly_high_intensity_min"] = (
        df["daily_high_intensity_min"].rolling(28, min_periods=7).sum()
    ).round(0)

    # ══════════════════════════════════════════════════════════════
    # F. RECOVERY STATE LOADS (Apple Watch — when available)
    # ══════════════════════════════════════════════════════════════
    # These are stubbed — populated when Apple Watch data arrives

    # Sleep debt: accumulated deficit relative to target (7h minimum)
    # Why it matters: 1 night of 5h sleep is recoverable. 7 consecutive nights
    # of 6h = 7 hours of accumulated debt that impairs EVERYTHING.
    # Modifies: training → HRV, training → testosterone, training → hsCRP
    # Computation: rolling 14-day sum of (target - actual) sleep hours
    # Will be populated from Apple Watch sleep data

    # HRV trend: 7-day slope of daily HRV readings
    # Why it matters: Absolute HRV is individual. The TREND tells you if the body
    # is absorbing training (stable/rising HRV) or failing (declining HRV).
    # A declining HRV trend over 5+ days means current training is too much.
    # Modifies: all training → outcome relationships

    # Recovery balance: composite of sleep quality + HRV trend + resting HR trend
    # Why it matters: Training is only productive if you recover from it.
    # Same training prescription with good vs poor recovery produces opposite results.
    # Modifies: every C → O edge

    # ══════════════════════════════════════════════════════════════
    # G. METABOLIC / FUELING LOADS (Apple Watch — when available)
    # ══════════════════════════════════════════════════════════════

    # Energy availability proxy: training energy expenditure vs step count
    # Why it matters: Relative Energy Deficiency in Sport (RED-S). Chronic
    # underfueling relative to training load = iron depletion, hormone suppression,
    # bone density loss, immune suppression. ALL Oron's issues could trace to RED-S.
    # Will be approximated from: active_calories / body_mass + steps pattern

    # ══════════════════════════════════════════════════════════════
    # H. TRAVEL & DISRUPTION LOADS
    # ══════════════════════════════════════════════════════════════

    # Location change recency: days since last Israel↔US transition
    # Why it matters: Jet lag (~7h for Israel↔US) impairs sleep, HRV, and
    # training quality for 3-7 days. A workout 2 days post-travel has a
    # different dose-response than the same workout in steady state.
    # Modifies: training → sleep, training → HRV, training → resting HR
    if "location" in df.columns:
        location_changed = df["location"].ne(df["location"].shift(1)).astype(float)
        location_changed.iloc[0] = 0
        df["days_since_travel"] = _days_since_event(location_changed)
        df["travel_load"] = np.where(
            df["days_since_travel"] <= 7,
            (7 - df["days_since_travel"]) / 7,  # 1.0 on travel day, decays to 0 by day 7
            0
        )
    else:
        df["days_since_travel"] = 999
        df["travel_load"] = 0.0

    # Routine disruption score: how different recent training pattern is from 90-day norm
    # Why it matters: A sudden shift in training time (morning→evening), type
    # (all running → running + cycling), or volume pattern signals disruption.
    # The body takes time to adapt to routine changes.
    if len(df) > 14:
        recent_pattern = df["daily_trimp"].rolling(7, min_periods=3).mean()
        long_pattern = df["daily_trimp"].rolling(90, min_periods=14).mean()
        df["routine_disruption"] = (
            ((recent_pattern - long_pattern).abs() / long_pattern.clip(lower=1))
        ).round(2)
    else:
        df["routine_disruption"] = 0.0

    return df


# ══════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════

def _cumulative_since_reset(series: pd.Series, reset_interval_days: int = None) -> pd.Series:
    """Compute cumulative sum, optionally resetting at intervals."""
    if reset_interval_days is None:
        # Simple cumulative sum
        return series.cumsum()
    # Reset at intervals
    result = []
    cumsum = 0
    for i, val in enumerate(series):
        cumsum += val
        if (i + 1) % reset_interval_days == 0:
            cumsum = 0
        result.append(cumsum)
    return pd.Series(result, index=series.index)


def _consecutive_count(condition: pd.Series) -> pd.Series:
    """Count consecutive True values, resetting on False."""
    groups = (~condition).cumsum()
    return condition.groupby(groups).cumsum().astype(int)


def _days_since_event(event_flags: pd.Series) -> pd.Series:
    """For each row, count days since the last event (flag=1)."""
    result = []
    days = 999
    for flag in event_flags:
        if flag > 0:
            days = 0
        else:
            days += 1
        result.append(days)
    return pd.Series(result, index=event_flags.index)


# ══════════════════════════════════════════════════════════════════
# APPLE WATCH LOAD COMPUTATION (stubs — activated when data arrives)
# ══════════════════════════════════════════════════════════════════

def compute_sleep_loads(daily_sleep_df: pd.DataFrame, target_sleep_min: float = 420) -> pd.DataFrame:
    """
    Compute sleep-derived loads from Apple Watch data.

    Sleep loads modify almost every training→outcome relationship.

    Args:
        daily_sleep_df: DataFrame with [date, sleep_duration, deep_sleep_min,
                        rem_sleep_min, awake_min, in_bed_min]
        target_sleep_min: Target sleep in minutes (default 7 hours = 420 min)
    """
    df = daily_sleep_df.copy()
    if df.empty or "sleep_duration" not in df.columns:
        return df

    # Sleep debt: rolling 14-day deficit relative to target
    # Why it matters: A single bad night is noise. Accumulated debt is signal.
    # 7 hours of sleep debt = ~1 full night missed = measurable performance drop.
    # Modifies: ALL training → outcome relationships
    df["nightly_deficit"] = (target_sleep_min - df["sleep_duration"]).clip(lower=0)
    df["sleep_debt_14d"] = df["nightly_deficit"].rolling(14, min_periods=3).sum().round(0)

    # Sleep quality trend: 7-day rolling average of deep+REM proportion
    # Why it matters: Total sleep can be adequate but quality declining.
    # Declining deep sleep fraction signals stress or overtraining.
    if "deep_sleep_min" in df.columns and "rem_sleep_min" in df.columns:
        df["quality_sleep_min"] = df["deep_sleep_min"].fillna(0) + df["rem_sleep_min"].fillna(0)
        df["sleep_quality_ratio"] = (
            df["quality_sleep_min"] / df["sleep_duration"].clip(lower=1)
        ).round(2)
        df["sleep_quality_trend_7d"] = (
            df["sleep_quality_ratio"].rolling(7, min_periods=3).mean()
        ).round(2)

    # Sleep consistency: std of bedtime over 7 days
    # Why it matters: Variable bedtimes impair circadian rhythm even if total
    # sleep is adequate. High variability = social jet lag.
    if "in_bed_min" in df.columns:
        # Use in_bed timing variability as proxy
        df["sleep_consistency_7d"] = (
            df["sleep_duration"].rolling(7, min_periods=3).std()
        ).round(1)

    # Consecutive poor nights: running count of nights below 80% of target
    poor_night = df["sleep_duration"] < (target_sleep_min * 0.8)
    df["consecutive_poor_nights"] = _consecutive_count(poor_night)

    return df


def compute_hrv_loads(daily_hrv_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute HRV-derived loads from Apple Watch data.

    HRV trend is the most reliable real-time indicator of whether the body
    is absorbing training stress.
    """
    df = daily_hrv_df.copy()
    if df.empty or "daily_hrv" not in df.columns:
        return df

    # HRV 7-day rolling mean
    df["hrv_7d_mean"] = df["daily_hrv"].rolling(7, min_periods=3).mean().round(1)

    # HRV trend: slope of 7-day regression line (ms/day)
    # Positive = recovering, Negative = accumulating stress
    # Why it matters: Absolute HRV varies hugely person to person.
    # The TREND is what matters. Declining HRV over 5+ days = overreaching.
    # Modifies: every training → outcome relationship
    df["hrv_trend_7d"] = _rolling_slope(df["daily_hrv"], window=7)

    # HRV coefficient of variation: variability over 7 days
    # Why it matters: Some variability is healthy (parasympathetic flexibility).
    # Very low CV can indicate autonomic fatigue (fixed at low level).
    hrv_std = df["daily_hrv"].rolling(7, min_periods=3).std()
    hrv_mean = df["daily_hrv"].rolling(7, min_periods=3).mean()
    df["hrv_cv_7d"] = (hrv_std / hrv_mean.clip(lower=1) * 100).round(1)

    # Resting HR trend: slope of 7-day regression (bpm/day)
    # Inverse of HRV trend — rising resting HR = stress accumulation.
    if "daily_resting_hr" in df.columns:
        df["resting_hr_trend_7d"] = _rolling_slope(df["daily_resting_hr"], window=7)

    # Autonomic recovery score: composite of HRV trend + resting HR trend
    # -1 to +1 scale. Positive = recovering. Negative = accumulating fatigue.
    if "resting_hr_trend_7d" in df.columns:
        # Normalize: positive HRV slope is good, negative RHR slope is good
        hrv_component = (df["hrv_trend_7d"] / df["hrv_trend_7d"].abs().clip(lower=0.1)).clip(-1, 1) * 0.5
        rhr_component = (-df["resting_hr_trend_7d"] / df["resting_hr_trend_7d"].abs().clip(lower=0.1)).clip(-1, 1) * 0.5
        df["autonomic_recovery_score"] = (hrv_component + rhr_component).round(2)

    return df


def compute_activity_loads(daily_activity_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute activity-derived loads from Apple Watch data.
    These capture non-workout activity that still contributes to total stress.
    """
    df = daily_activity_df.copy()
    if df.empty:
        return df

    # Total daily energy expenditure trend
    if "active_calories" in df.columns:
        df["weekly_active_calories"] = df["active_calories"].rolling(7, min_periods=1).sum().round(0)

    # Step count trend — baseline activity level
    if "steps" in df.columns:
        df["weekly_steps"] = df["steps"].rolling(7, min_periods=1).sum().round(0)
        df["steps_7d_mean"] = df["steps"].rolling(7, min_periods=3).mean().round(0)

    # Exercise streak: consecutive days with any exercise
    if "exercise_minutes" in df.columns:
        df["exercise_streak_days"] = _consecutive_count(df["exercise_minutes"] > 0)

    return df


def _rolling_slope(series: pd.Series, window: int = 7) -> pd.Series:
    """Compute rolling OLS slope (units per day) over a window."""
    slopes = []
    for i in range(len(series)):
        if i < window - 1 or series.iloc[max(0, i - window + 1):i + 1].isna().all():
            slopes.append(0.0)
            continue
        y = series.iloc[max(0, i - window + 1):i + 1].dropna()
        if len(y) < 3:
            slopes.append(0.0)
            continue
        x = np.arange(len(y), dtype=float)
        # Simple linear regression slope
        x_mean = x.mean()
        y_mean = y.mean()
        numerator = ((x - x_mean) * (y - y_mean)).sum()
        denominator = ((x - x_mean) ** 2).sum()
        if denominator == 0:
            slopes.append(0.0)
        else:
            slopes.append(round(numerator / denominator, 3))
    return pd.Series(slopes, index=series.index)


# ══════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════

def get_load_at_date(loads_df: pd.DataFrame, target_date: str) -> dict:
    """Get all training load metrics at a specific date."""
    target = pd.to_datetime(target_date)
    closest_idx = (loads_df["date"] - target).abs().idxmin()
    row = loads_df.loc[closest_idx]

    load_fields = [
        # Category A: Training Volume
        "atl", "ctl", "acwr", "weekly_run_km", "weekly_volume_km",
        "weekly_zone2_min", "weekly_training_hrs", "weekly_intensity_score",
        "weekly_high_intensity_min", "weekly_elevation_m",
        "monthly_run_km", "monthly_volume_km", "monthly_training_hrs",
        # Category B: Training Pattern
        "monotony", "strain", "training_consistency",
        "polarization_index", "rest_day_ratio_7d", "volume_change_pct",
        "double_days_7d",
        # Category C: Mechanical Impact
        "weekly_ground_contacts", "monthly_ground_contacts", "run_to_cycle_ratio",
        # Category D: Iron Depletion
        "iron_depletion_pressure_7d", "iron_depletion_pressure_28d",
        # Category E: Hormonal Stress
        "overtraining_risk_score", "consecutive_training_days",
        "monthly_high_intensity_min",
        # Category H: Travel
        "days_since_travel", "travel_load", "routine_disruption",
    ]

    result = {"date": str(row["date"].date()) if hasattr(row["date"], "date") else str(row["date"])}
    for field in load_fields:
        result[field] = float(row.get(field, 0))
    return result


def get_all_load_names() -> list:
    """Return all load variable names produced by this module."""
    return [
        # A: Training Volume
        "atl", "ctl", "acwr",
        "weekly_volume_km", "weekly_run_km", "weekly_cycle_km",
        "weekly_zone2_min", "weekly_high_intensity_min",
        "weekly_duration_min", "weekly_training_hrs",
        "weekly_elevation_m", "weekly_intensity_score",
        "monthly_run_km", "monthly_volume_km", "monthly_training_hrs", "monthly_trimp",
        # B: Training Pattern
        "monotony", "strain", "training_consistency",
        "polarization_index", "rest_day_ratio_7d",
        "volume_change_pct", "double_days_7d",
        # C: Mechanical Impact
        "weekly_ground_contacts", "monthly_ground_contacts", "run_to_cycle_ratio",
        # D: Iron Depletion
        "cumulative_run_km_since_reset", "cumulative_ground_contacts_since_reset",
        "iron_depletion_pressure_7d", "iron_depletion_pressure_28d",
        # E: Hormonal Stress
        "overtraining_risk_score", "consecutive_training_days",
        "monthly_high_intensity_min",
        # F: Recovery (Apple Watch)
        "sleep_debt_14d", "sleep_quality_trend_7d", "sleep_consistency_7d",
        "consecutive_poor_nights",
        # G: HRV / Autonomic (Apple Watch)
        "hrv_7d_mean", "hrv_trend_7d", "hrv_cv_7d",
        "resting_hr_trend_7d", "autonomic_recovery_score",
        # H: Activity (Apple Watch)
        "weekly_active_calories", "weekly_steps", "steps_7d_mean",
        "exercise_streak_days",
        # I: Travel
        "days_since_travel", "travel_load", "routine_disruption",
    ]
