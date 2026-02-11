"""
Edge Table: Complete definition of every C->M/O relationship to test.

Each edge specifies:
  - dose_variable: the raw column name in the daily timeline
  - dose_window: rolling window size (days) to apply to the dose
  - dose_agg: how to aggregate the dose within the window (sum, mean, max)
  - response_variable: the raw column name for the outcome
  - response_lag: days between dose window end and response measurement
  - biological_timescale: how fast the response variable responds
  - prior_key: key into population_priors.py
  - theta_unit: unit for the X-axis / threshold display
  - effect_unit: unit for Y-axis / beta display
  - per_unit: "per X" for beta description
  - theta_display_fn_name: optional function name for human-readable theta
  - adjustment_set: backdoor variables to condition on
  - category: insight category for the UI
  - mechanism: human-readable mechanism description
  - data_sources: which data files feed this edge

Timescale guide:
  - fast (1-7 days): HRV, resting HR, sleep quality, sleep efficiency
  - medium (7-28 days): hsCRP, mood, energy, body composition trends
  - slow (28-90 days): iron, ferritin, testosterone, VO2max, lipids
"""
from dataclasses import dataclass, field
from typing import List, Optional, Callable


@dataclass
class EdgeSpec:
    """Full specification for one causal edge to test."""
    # Identity
    name: str                           # Human-readable name
    edge_key: str                       # "source->target" for prior lookup

    # Dose operationalization
    dose_variable: str                  # Column in daily timeline
    dose_window: int                    # Rolling window in days
    dose_agg: str                       # 'sum', 'mean', 'max', 'last'

    # Response operationalization
    response_variable: str              # Column in daily timeline
    response_lag: int                   # Days lag between dose and response

    # Biology
    biological_timescale: str           # 'fast', 'medium', 'slow'

    # Prior
    prior_key: str                      # Key into PRIORS dict

    # Units
    theta_unit: str
    effect_unit: str
    per_unit: str
    theta_display_fn_name: Optional[str] = None

    # Adjustment
    adjustment_set: List[str] = field(default_factory=list)

    # Metadata
    category: str = ""
    mechanism: str = ""
    data_sources: List[str] = field(default_factory=list)
    min_dose_variance: float = 0.0     # Skip if dose has less variance
    min_observations: int = 6          # Minimum data points to fit


# =============================================================================
# TIER 1: Choice -> Slow Markers (GPX + Labs)
# These use 28-90 day dose windows and sparse lab responses
# =============================================================================

TIER_1_EDGES = [
    EdgeSpec(
        name="Running Volume -> Iron",
        edge_key="weekly_run_km->iron_total",
        dose_variable="run_distance_km",
        dose_window=28,
        dose_agg="sum",
        response_variable="iron_total_smoothed",
        response_lag=7,
        biological_timescale="slow",
        prior_key="weekly_run_km->iron_total",
        theta_unit="km/month",
        effect_unit="mcg/dL",
        per_unit="per 40 km/mo",
        adjustment_set=["season", "location", "acwr_28d"],
        category="metabolic",
        mechanism="Foot-strike hemolysis destroys red blood cells; iron lost via hemolysis, sweat, and GI ischemia",
        data_sources=["gpx", "labs"],
        min_observations=4,
    ),
    EdgeSpec(
        name="Running Volume -> Ferritin",
        edge_key="weekly_run_km->ferritin",
        dose_variable="run_distance_km",
        dose_window=28,
        dose_agg="sum",
        response_variable="ferritin_smoothed",
        response_lag=14,
        biological_timescale="slow",
        prior_key="weekly_run_km->ferritin",
        theta_unit="km/month",
        effect_unit="ng/mL",
        per_unit="per 40 km/mo",
        adjustment_set=["season", "location", "acwr_28d"],
        category="metabolic",
        mechanism="Chronic endurance running depletes iron stores through multiple loss pathways",
        data_sources=["gpx", "labs"],
        min_observations=4,
    ),
    EdgeSpec(
        name="Training Hours -> Testosterone",
        edge_key="weekly_training_hrs->testosterone",
        dose_variable="workout_duration_min",
        dose_window=28,
        dose_agg="sum",
        response_variable="testosterone_smoothed",
        response_lag=14,
        biological_timescale="slow",
        prior_key="weekly_training_hrs->testosterone",
        theta_unit="hrs/month",
        effect_unit="ng/dL",
        per_unit="per 4 hrs/mo",
        adjustment_set=["season", "acwr_28d", "sleep_debt_14d"],
        category="metabolic",
        mechanism="Overtraining suppresses the hypothalamic-pituitary-gonadal axis",
        data_sources=["gpx", "labs"],
        min_observations=3,
    ),
    EdgeSpec(
        name="Zone 2 Volume -> Triglycerides",
        edge_key="weekly_zone2_min->triglycerides",
        dose_variable="zone2_minutes",
        dose_window=28,
        dose_agg="sum",
        response_variable="triglycerides_smoothed",
        response_lag=14,
        biological_timescale="slow",
        prior_key="weekly_zone2_min->triglycerides",
        theta_unit="min/month",
        effect_unit="mg/dL",
        per_unit="per 120 min/mo",
        adjustment_set=["season", "location"],
        category="cardio",
        mechanism="Aerobic exercise increases lipoprotein lipase activity",
        data_sources=["gpx", "labs"],
        min_observations=3,
    ),
    EdgeSpec(
        name="Zone 2 Volume -> HDL",
        edge_key="weekly_zone2_min->hdl",
        dose_variable="zone2_minutes",
        dose_window=28,
        dose_agg="sum",
        response_variable="hdl_smoothed",
        response_lag=14,
        biological_timescale="slow",
        prior_key="weekly_zone2_min->hdl",
        theta_unit="min/month",
        effect_unit="mg/dL",
        per_unit="per 120 min/mo",
        adjustment_set=["season", "location"],
        category="cardio",
        mechanism="Regular aerobic exercise upregulates HDL production",
        data_sources=["gpx", "labs"],
        min_observations=3,
    ),
    EdgeSpec(
        name="ACWR -> Inflammation",
        edge_key="acwr->hscrp",
        dose_variable="acwr",
        dose_window=1,
        dose_agg="last",
        response_variable="hscrp_smoothed",
        response_lag=7,
        biological_timescale="medium",
        prior_key="acwr->hscrp",
        theta_unit="ratio",
        effect_unit="mg/L",
        per_unit="per 0.1 ACWR",
        adjustment_set=["season", "training_consistency_28d"],
        category="recovery",
        mechanism="Acute overreaching triggers systemic inflammation via muscle damage and oxidative stress",
        data_sources=["gpx", "labs"],
        min_observations=4,
    ),
    EdgeSpec(
        name="Training Consistency -> VO2peak",
        edge_key="training_consistency->vo2_peak",
        dose_variable="training_consistency_90d",
        dose_window=1,
        dose_agg="last",
        response_variable="vo2_peak_smoothed",
        response_lag=0,
        biological_timescale="slow",
        prior_key="training_consistency->vo2_peak",
        theta_unit="fraction",
        effect_unit="ml/min/kg",
        per_unit="per 0.1",
        adjustment_set=["season"],
        category="cardio",
        mechanism="Consistent aerobic training drives mitochondrial biogenesis and cardiac remodeling",
        data_sources=["gpx", "medix"],
        min_observations=2,
    ),
]

# =============================================================================
# TIER 2: Marker -> Marker cross-links
# =============================================================================

TIER_2_EDGES = [
    # Sleep Duration -> Lab Marker edges (slow response, daily dose)
    EdgeSpec(
        name="Sleep Duration -> Cortisol",
        edge_key="sleep_duration->cortisol",
        dose_variable="sleep_duration_hrs",
        dose_window=28,
        dose_agg="mean",
        response_variable="cortisol_smoothed",
        response_lag=0,
        biological_timescale="slow",
        prior_key="sleep_duration→cortisol",
        theta_unit="hours",
        effect_unit="mcg/dL",
        per_unit="per hr",
        adjustment_set=["acwr", "season"],
        category="recovery",
        mechanism="Sleep restriction elevates next-morning cortisol via HPA axis dysregulation",
        data_sources=["autosleep", "apple_health", "labs"],
        min_observations=4,
    ),
    EdgeSpec(
        name="Sleep Duration -> Testosterone",
        edge_key="sleep_duration->testosterone",
        dose_variable="sleep_duration_hrs",
        dose_window=28,
        dose_agg="mean",
        response_variable="testosterone_smoothed",
        response_lag=0,
        biological_timescale="slow",
        prior_key="sleep_duration→testosterone",
        theta_unit="hours",
        effect_unit="ng/dL",
        per_unit="per hr",
        adjustment_set=["acwr", "season"],
        category="recovery",
        mechanism="Testosterone is primarily produced during sleep; restriction suppresses production",
        data_sources=["autosleep", "apple_health", "labs"],
        min_observations=4,
    ),
    EdgeSpec(
        name="Sleep Duration -> Glucose",
        edge_key="sleep_duration->glucose",
        dose_variable="sleep_duration_hrs",
        dose_window=28,
        dose_agg="mean",
        response_variable="glucose_smoothed",
        response_lag=0,
        biological_timescale="slow",
        prior_key="sleep_duration→glucose",
        theta_unit="hours",
        effect_unit="mg/dL",
        per_unit="per hr",
        adjustment_set=["acwr", "season"],
        category="recovery",
        mechanism="Chronic sleep restriction impairs insulin sensitivity and glucose tolerance",
        data_sources=["autosleep", "apple_health", "labs"],
        min_observations=4,
    ),
    EdgeSpec(
        name="Sleep Duration -> WBC",
        edge_key="sleep_duration->wbc",
        dose_variable="sleep_duration_hrs",
        dose_window=28,
        dose_agg="mean",
        response_variable="wbc_smoothed",
        response_lag=0,
        biological_timescale="slow",
        prior_key="sleep_duration→wbc",
        theta_unit="hours",
        effect_unit="K/uL",
        per_unit="per hr",
        adjustment_set=["acwr", "season"],
        category="recovery",
        mechanism="Adequate sleep supports immune cell production and healthy WBC counts",
        data_sources=["autosleep", "apple_health", "labs"],
        min_observations=4,
    ),
    EdgeSpec(
        name="Ferritin -> VO2peak",
        edge_key="ferritin->vo2_peak",
        dose_variable="ferritin_smoothed",
        dose_window=1,
        dose_agg="last",
        response_variable="vo2_peak_smoothed",
        response_lag=0,
        biological_timescale="slow",
        prior_key="ferritin->vo2_peak",
        theta_unit="ng/mL",
        effect_unit="ml/min/kg",
        per_unit="per 10 ng/mL",
        adjustment_set=["training_consistency_90d", "season"],
        category="metabolic",
        mechanism="Iron stores limit oxygen transport capacity via hemoglobin synthesis",
        data_sources=["labs", "medix"],
        min_observations=2,
    ),
]

# =============================================================================
# TIER 3: Choice -> Fast Outcomes (Apple Health + AutoSleep)
# These use 1-7 day dose windows and daily response variables
# NOW AVAILABLE with export.xml and AutoSleep data
# =============================================================================

TIER_3_EDGES = [
    # ── Sleep-related edges ──────────────────────────────────
    EdgeSpec(
        name="Workout Time -> Sleep Efficiency",
        edge_key="workout_end_hour->sleep_efficiency",
        dose_variable="last_workout_end_hour",
        dose_window=1,
        dose_agg="last",
        response_variable="sleep_efficiency_pct",
        response_lag=0,
        biological_timescale="fast",
        prior_key="workout_end_hour->sleep_efficiency",
        theta_unit="hour",
        effect_unit="%",
        per_unit="per hr later",
        theta_display_fn_name="hour_to_time",
        adjustment_set=["workout_intensity", "season", "day_of_week"],
        category="sleep",
        mechanism="Late workouts elevate core temperature and sympathetic tone, delaying sleep onset",
        data_sources=["apple_health", "autosleep"],
        min_observations=30,
    ),
    EdgeSpec(
        name="Bedtime -> Sleep Quality",
        edge_key="bedtime_hour->sleep_quality",
        dose_variable="bedtime_hour",
        dose_window=1,
        dose_agg="last",
        response_variable="sleep_quality_score",
        response_lag=0,
        biological_timescale="fast",
        prior_key="bedtime_hour->sleep_quality",
        theta_unit="hour",
        effect_unit="min quality",
        per_unit="per hr later",
        theta_display_fn_name="hour_to_time",
        adjustment_set=["day_of_week", "season"],
        category="sleep",
        mechanism="Later bedtimes misalign with circadian melatonin onset, reducing sleep architecture quality",
        data_sources=["autosleep"],
        min_observations=30,
    ),
    EdgeSpec(
        name="Sleep Duration -> Next-Day HRV",
        edge_key="sleep_duration->next_day_hrv",
        dose_variable="sleep_duration_hrs",
        dose_window=1,
        dose_agg="last",
        response_variable="hrv_daily_mean",
        response_lag=1,
        biological_timescale="fast",
        prior_key="sleep_duration->next_day_hrv",
        theta_unit="hours",
        effect_unit="ms",
        per_unit="per hr",
        adjustment_set=["acwr", "day_of_week"],
        category="recovery",
        mechanism="Adequate sleep restores parasympathetic tone; insufficient sleep elevates sympathetic activity",
        data_sources=["autosleep", "apple_health"],
        min_observations=30,
    ),

    # ── Training load -> Recovery edges ──────────────────────
    EdgeSpec(
        name="Daily Training Load -> Next-Day HRV",
        edge_key="daily_trimp->next_day_hrv",
        dose_variable="daily_trimp",
        dose_window=1,
        dose_agg="sum",
        response_variable="hrv_daily_mean",
        response_lag=1,
        biological_timescale="fast",
        prior_key="daily_trimp->next_day_hrv",
        theta_unit="TRIMP",
        effect_unit="ms",
        per_unit="per 50 TRIMP",
        adjustment_set=["acwr", "sleep_duration_hrs", "season"],
        category="recovery",
        mechanism="Acute training load drives autonomic nervous system fatigue measured via HRV depression",
        data_sources=["gpx", "apple_health"],
        min_observations=30,
    ),
    EdgeSpec(
        name="Daily Training Load -> Next-Day Resting HR",
        edge_key="daily_trimp->resting_hr",
        dose_variable="daily_trimp",
        dose_window=1,
        dose_agg="sum",
        response_variable="resting_hr",
        response_lag=1,
        biological_timescale="fast",
        prior_key="daily_trimp->resting_hr",
        theta_unit="TRIMP",
        effect_unit="bpm",
        per_unit="per 50 TRIMP",
        adjustment_set=["acwr", "sleep_duration_hrs"],
        category="recovery",
        mechanism="Acute training elevates next-day resting HR via sympathetic activation and cardiac fatigue",
        data_sources=["gpx", "apple_health"],
        min_observations=30,
    ),
    EdgeSpec(
        name="ACWR -> Resting HR Trend",
        edge_key="acwr->resting_hr_trend",
        dose_variable="acwr",
        dose_window=1,
        dose_agg="last",
        response_variable="resting_hr_7d_mean",
        response_lag=0,
        biological_timescale="medium",
        prior_key="acwr->resting_hr",
        theta_unit="ratio",
        effect_unit="bpm",
        per_unit="per 0.1 ACWR",
        adjustment_set=["season", "sleep_debt_14d"],
        category="recovery",
        mechanism="Chronic overreaching elevates baseline sympathetic tone",
        data_sources=["gpx", "apple_health"],
        min_observations=30,
    ),

    # ── Activity -> Sleep edges ──────────────────────────────
    EdgeSpec(
        name="Daily Steps -> Sleep Efficiency",
        edge_key="daily_steps->sleep_efficiency",
        dose_variable="steps",
        dose_window=1,
        dose_agg="sum",
        response_variable="sleep_efficiency_pct",
        response_lag=0,
        biological_timescale="fast",
        prior_key="daily_steps->sleep_efficiency",
        theta_unit="steps",
        effect_unit="%",
        per_unit="per 2000 steps",
        adjustment_set=["workout_intensity", "day_of_week"],
        category="sleep",
        mechanism="Moderate daily activity promotes sleep; excessive activity may impair it via overarousal",
        data_sources=["apple_health", "autosleep"],
        min_observations=30,
    ),
    EdgeSpec(
        name="Active Energy -> Deep Sleep",
        edge_key="active_energy->deep_sleep",
        dose_variable="active_energy_kcal",
        dose_window=1,
        dose_agg="sum",
        response_variable="deep_sleep_min",
        response_lag=0,
        biological_timescale="fast",
        prior_key="active_energy->deep_sleep",
        theta_unit="kcal",
        effect_unit="min",
        per_unit="per 100 kcal",
        adjustment_set=["day_of_week", "season"],
        category="sleep",
        mechanism="Physical activity increases slow-wave sleep need via adenosine accumulation and thermoregulation",
        data_sources=["apple_health", "autosleep"],
        min_observations=30,
    ),

    # ── Weekly volume -> Recovery state ──────────────────────
    EdgeSpec(
        name="Weekly Volume -> HRV Baseline",
        edge_key="weekly_km->hrv_baseline",
        dose_variable="run_distance_km",
        dose_window=7,
        dose_agg="sum",
        response_variable="hrv_7d_mean",
        response_lag=0,
        biological_timescale="medium",
        prior_key="weekly_km->hrv_baseline",
        theta_unit="km/week",
        effect_unit="ms",
        per_unit="per 10 km/wk",
        adjustment_set=["season", "sleep_debt_14d"],
        category="recovery",
        mechanism="Moderate volume improves vagal tone; excessive volume suppresses it via overtraining",
        data_sources=["gpx", "apple_health"],
        min_observations=30,
    ),

    # ── Sleep -> Daytime Recovery ────────────────────────────
    EdgeSpec(
        name="Sleep Debt -> Resting HR",
        edge_key="sleep_debt->resting_hr",
        dose_variable="sleep_debt_14d",
        dose_window=1,
        dose_agg="last",
        response_variable="resting_hr",
        response_lag=0,
        biological_timescale="medium",
        prior_key="sleep_debt->resting_hr",
        theta_unit="hours deficit",
        effect_unit="bpm",
        per_unit="per hr deficit",
        adjustment_set=["acwr", "season"],
        category="recovery",
        mechanism="Accumulated sleep deficit elevates sympathetic tone and baseline heart rate",
        data_sources=["autosleep", "apple_health"],
        min_observations=30,
    ),
]

# =============================================================================
# All edges combined
# =============================================================================

ALL_EDGES = TIER_1_EDGES + TIER_2_EDGES + TIER_3_EDGES


def get_edges_by_tier(tier: int) -> list:
    if tier == 1:
        return TIER_1_EDGES
    elif tier == 2:
        return TIER_2_EDGES
    elif tier == 3:
        return TIER_3_EDGES
    return []


def get_edges_by_data_source(source: str) -> list:
    """Get all edges that use a specific data source."""
    return [e for e in ALL_EDGES if source in e.data_sources]


def get_edges_by_category(category: str) -> list:
    return [e for e in ALL_EDGES if e.category == category]


def get_edge_by_key(key: str) -> Optional[EdgeSpec]:
    for e in ALL_EDGES:
        if e.edge_key == key:
            return e
    return None


def get_fast_edges() -> list:
    """Edges testable now with Apple Health + AutoSleep (daily data)."""
    return [e for e in ALL_EDGES if e.biological_timescale == "fast"]


def get_slow_edges() -> list:
    """Edges using sparse lab data (need GP smoothing)."""
    return [e for e in ALL_EDGES if e.biological_timescale == "slow"]


def print_edge_summary():
    print(f"Total edges: {len(ALL_EDGES)}")
    print(f"  Tier 1 (GPX+Labs):     {len(TIER_1_EDGES)}")
    print(f"  Tier 2 (Marker cross): {len(TIER_2_EDGES)}")
    print(f"  Tier 3 (Apple+Sleep):  {len(TIER_3_EDGES)}")
    print()
    for e in ALL_EDGES:
        status = "FAST" if e.biological_timescale == "fast" else e.biological_timescale.upper()
        print(f"  [{status:6s}] {e.name:40s} | window={e.dose_window}d lag={e.response_lag}d | {e.category}")


# =============================================================================
# Display helper functions (referenced by theta_display_fn_name)
# =============================================================================

def hour_to_time(h: float) -> str:
    """Convert decimal hour to HH:MM AM/PM format."""
    hours = int(h) % 24
    minutes = int((h - int(h)) * 60)
    period = "AM" if hours < 12 else "PM"
    display_hour = hours % 12
    if display_hour == 0:
        display_hour = 12
    return f"{display_hour}:{minutes:02d} {period}"


DISPLAY_FNS = {
    "hour_to_time": hour_to_time,
}
