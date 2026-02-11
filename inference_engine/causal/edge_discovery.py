"""
Automatic edge discovery from available COMPLE variables.

Given a user's daily timeline (whatever columns they have), this module:
1. Identifies which dose families and response families have data
2. Matches them against a mechanism catalog of known biological relationships
3. Selects the best dose column per mechanism (based on timescale + coverage)
4. Generates EdgeSpecs for all testable edges
5. Returns only edges with sufficient data to fit BCEL

This replaces hardcoded edge tables — it works for ANY user, regardless of
which devices or data sources they have.

Architecture:
  DoseFamily    — a group of columns measuring the same underlying dose
  ResponseFamily — a group of columns measuring the same underlying response
  MechanismSpec — a known biological link between a DoseFamily and ResponseFamily
  discover_edges() — the main entry point

The mechanism catalog is curated from exercise physiology literature.
Each mechanism specifies the biological timescale, which determines
dose window, aggregation, and response lag automatically.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

from inference_engine.causal.edge_table import EdgeSpec


# ═══════════════════════════════════════════════════════════════════
# DOSE FAMILIES — groups of columns measuring the same dose
# ═══════════════════════════════════════════════════════════════════

@dataclass
class DoseFamily:
    """A group of columns that measure the same underlying dose concept."""
    id: str                          # e.g. "running_volume"
    label: str                       # Human-readable name
    columns: List[str]               # Possible column names, in priority order
    unit: str                        # e.g. "km", "min", "kcal"
    comple_category: str             # "C" or "L"
    # Preferred time windows per biological timescale
    # Key: timescale ("fast", "medium", "slow")
    # Value: (window_days, aggregation)
    window_by_timescale: Dict[str, Tuple[int, str]] = field(default_factory=dict)


DOSE_FAMILIES: Dict[str, DoseFamily] = {

    # ── Exercise volume doses ─────────────────────────────────
    "running_volume": DoseFamily(
        id="running_volume",
        label="Running Volume",
        columns=["daily_run_km", "run_distance_km", "distance_walking_running_km"],
        unit="km",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "sum"),
            "medium": (7, "sum"),
            "slow": (28, "sum"),
        },
    ),
    "training_duration": DoseFamily(
        id="training_duration",
        label="Training Duration",
        columns=["daily_duration_min", "workout_duration_min", "ah_workout_duration_min", "exercise_time_min"],
        unit="min",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "sum"),
            "medium": (7, "sum"),
            "slow": (28, "sum"),
        },
    ),
    "zone2_volume": DoseFamily(
        id="zone2_volume",
        label="Zone 2 Volume",
        columns=["daily_zone2_min", "zone2_minutes"],
        unit="min",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "sum"),
            "medium": (7, "sum"),
            "slow": (28, "sum"),
        },
    ),
    "total_distance": DoseFamily(
        id="total_distance",
        label="Total Distance",
        columns=["daily_distance_km", "distance_walking_running_km"],
        unit="km",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "sum"),
            "medium": (7, "sum"),
            "slow": (28, "sum"),
        },
    ),
    "active_energy": DoseFamily(
        id="active_energy",
        label="Active Energy",
        columns=["active_energy_kcal", "ah_workout_energy_kcal"],
        unit="kcal",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "sum"),
            "medium": (7, "sum"),
            "slow": (28, "sum"),
        },
    ),
    "daily_steps": DoseFamily(
        id="daily_steps",
        label="Daily Steps",
        columns=["steps"],
        unit="steps",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "sum"),
            "medium": (7, "mean"),
            "slow": (28, "mean"),
        },
    ),
    "training_load": DoseFamily(
        id="training_load",
        label="Training Load (TRIMP)",
        columns=["daily_trimp"],
        unit="TRIMP",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "sum"),
            "medium": (7, "sum"),
            "slow": (28, "sum"),
        },
    ),

    # ── Timing doses ──────────────────────────────────────────
    "workout_end_time": DoseFamily(
        id="workout_end_time",
        label="Workout End Time",
        columns=["last_workout_end_hour", "latest_workout_hour"],
        unit="hour",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "last"),
            "medium": (1, "last"),
        },
    ),
    "bedtime": DoseFamily(
        id="bedtime",
        label="Bedtime",
        columns=["bedtime_hour"],
        unit="hour",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "last"),
        },
    ),

    # ── Load-based doses ──────────────────────────────────────
    "acwr": DoseFamily(
        id="acwr",
        label="ACWR",
        columns=["acwr"],
        unit="ratio",
        comple_category="L",
        window_by_timescale={
            "fast": (1, "last"),
            "medium": (1, "last"),
            "slow": (1, "last"),
        },
    ),
    "training_consistency": DoseFamily(
        id="training_consistency",
        label="Training Consistency",
        columns=["training_consistency", "training_consistency_90d"],
        unit="fraction",
        comple_category="L",
        window_by_timescale={
            "slow": (1, "last"),
        },
    ),
    "sleep_debt": DoseFamily(
        id="sleep_debt",
        label="Sleep Debt",
        columns=["sleep_debt_14d"],
        unit="hours deficit",
        comple_category="L",
        window_by_timescale={
            "fast": (1, "last"),
            "medium": (1, "last"),
        },
    ),
    "sleep_duration": DoseFamily(
        id="sleep_duration",
        label="Sleep Duration",
        columns=["sleep_duration_hrs"],
        unit="hours",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "last"),
            "slow": (28, "mean"),
        },
    ),

    # ── Travel dose ─────────────────────────────────────────
    "travel_load": DoseFamily(
        id="travel_load",
        label="Travel/Jet Lag Load",
        columns=["travel_load"],
        unit="jet lag score",
        comple_category="L",
        window_by_timescale={
            "fast": (1, "last"),
            "medium": (1, "last"),
        },
    ),

    # ── Dietary doses ────────────────────────────────────────
    "dietary_protein": DoseFamily(
        id="dietary_protein",
        label="Dietary Protein",
        columns=["dietary_protein_g"],
        unit="g",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "sum"),
            "medium": (7, "mean"),
            "slow": (28, "mean"),
        },
    ),
    "dietary_energy": DoseFamily(
        id="dietary_energy",
        label="Dietary Energy",
        columns=["dietary_energy_kcal"],
        unit="kcal",
        comple_category="C",
        window_by_timescale={
            "fast": (1, "sum"),
            "medium": (7, "mean"),
            "slow": (28, "mean"),
        },
    ),

    # ── Marker-as-dose (cross-links) ─────────────────────────
    "iron_sat_level": DoseFamily(
        id="iron_sat_level",
        label="Iron Saturation",
        columns=["iron_saturation_pct_smoothed", "iron_saturation_pct_computed_smoothed"],
        unit="%",
        comple_category="M",
        window_by_timescale={
            "slow": (1, "last"),
        },
    ),
    "vitamin_d_level": DoseFamily(
        id="vitamin_d_level",
        label="Vitamin D Level",
        columns=["vitamin_d_smoothed", "vitamin_d_raw"],
        unit="ng/mL",
        comple_category="M",
        window_by_timescale={
            "slow": (1, "last"),
        },
    ),
    "omega3_level": DoseFamily(
        id="omega3_level",
        label="Omega-3 Index",
        columns=["omega3_index_derived", "omega3_index_smoothed"],
        unit="%",
        comple_category="M",
        window_by_timescale={
            "slow": (1, "last"),
        },
    ),
    "b12_level": DoseFamily(
        id="b12_level",
        label="B12 Level",
        columns=["b12_smoothed", "b12_raw"],
        unit="pg/mL",
        comple_category="M",
        window_by_timescale={
            "slow": (1, "last"),
        },
    ),
    "homocysteine_level": DoseFamily(
        id="homocysteine_level",
        label="Homocysteine Level",
        columns=["homocysteine_smoothed", "homocysteine_raw"],
        unit="umol/L",
        comple_category="M",
        window_by_timescale={
            "slow": (1, "last"),
        },
    ),
    "ferritin_level": DoseFamily(
        id="ferritin_level",
        label="Ferritin Level",
        columns=["ferritin_smoothed", "ferritin_raw"],
        unit="ng/mL",
        comple_category="M",  # M→M cross-link
        window_by_timescale={
            "slow": (1, "last"),
        },
    ),
}


# ═══════════════════════════════════════════════════════════════════
# RESPONSE FAMILIES — groups of columns measuring the same response
# ═══════════════════════════════════════════════════════════════════

@dataclass
class ResponseFamily:
    """A group of columns that measure the same underlying response."""
    id: str
    label: str
    columns: List[str]               # Possible column names, in priority order
    unit: str
    comple_category: str             # "M" or "O"
    biological_timescale: str        # "fast", "medium", "slow"


RESPONSE_FAMILIES: Dict[str, ResponseFamily] = {

    # ── Iron / hematology markers (slow) ─────────────────────
    "iron_total": ResponseFamily(
        id="iron_total", label="Serum Iron",
        columns=["iron_total_smoothed", "iron_total_raw"],
        unit="mcg/dL", comple_category="M", biological_timescale="slow",
    ),
    "ferritin": ResponseFamily(
        id="ferritin", label="Ferritin",
        columns=["ferritin_smoothed", "ferritin_raw"],
        unit="ng/mL", comple_category="M", biological_timescale="slow",
    ),
    "hemoglobin": ResponseFamily(
        id="hemoglobin", label="Hemoglobin",
        columns=["hemoglobin_smoothed", "hemoglobin_raw"],
        unit="g/dL", comple_category="M", biological_timescale="slow",
    ),

    # ── Hormones (slow) ──────────────────────────────────────
    "testosterone": ResponseFamily(
        id="testosterone", label="Testosterone",
        columns=["testosterone_smoothed", "testosterone_raw"],
        unit="ng/dL", comple_category="M", biological_timescale="slow",
    ),
    "cortisol": ResponseFamily(
        id="cortisol", label="Cortisol",
        columns=["cortisol_smoothed", "cortisol_raw"],
        unit="mcg/dL", comple_category="M", biological_timescale="slow",
    ),

    # ── Lipids (slow) ────────────────────────────────────────
    "triglycerides": ResponseFamily(
        id="triglycerides", label="Triglycerides",
        columns=["triglycerides_smoothed", "triglycerides_raw"],
        unit="mg/dL", comple_category="M", biological_timescale="slow",
    ),
    "hdl": ResponseFamily(
        id="hdl", label="HDL Cholesterol",
        columns=["hdl_smoothed", "hdl_raw"],
        unit="mg/dL", comple_category="M", biological_timescale="slow",
    ),
    "ldl": ResponseFamily(
        id="ldl", label="LDL Cholesterol",
        columns=["ldl_smoothed", "ldl_raw"],
        unit="mg/dL", comple_category="M", biological_timescale="slow",
    ),

    # ── Inflammation (medium) ────────────────────────────────
    "hscrp": ResponseFamily(
        id="hscrp", label="hs-CRP",
        columns=["hscrp_smoothed", "hscrp_raw"],
        unit="mg/L", comple_category="M", biological_timescale="medium",
    ),

    # ── Fitness markers (slow) ───────────────────────────────
    "vo2peak": ResponseFamily(
        id="vo2peak", label="VO2peak",
        columns=["vo2_peak_smoothed", "vo2max_apple"],
        unit="ml/min/kg", comple_category="M", biological_timescale="slow",
    ),

    # ── Sleep outcomes (fast) ────────────────────────────────
    "sleep_efficiency": ResponseFamily(
        id="sleep_efficiency", label="Sleep Efficiency",
        columns=["sleep_efficiency_pct", "sleep_efficiency_7d"],
        unit="%", comple_category="O", biological_timescale="fast",
    ),
    "sleep_quality": ResponseFamily(
        id="sleep_quality", label="Sleep Quality",
        columns=["sleep_quality_score"],
        unit="min quality", comple_category="O", biological_timescale="fast",
    ),
    "deep_sleep": ResponseFamily(
        id="deep_sleep", label="Deep Sleep",
        columns=["deep_sleep_min", "ah_deep_sleep_min"],
        unit="min", comple_category="O", biological_timescale="fast",
    ),
    "sleep_duration_outcome": ResponseFamily(
        id="sleep_duration_outcome", label="Sleep Duration",
        columns=["sleep_duration_hrs", "ah_sleep_total_min"],
        unit="hrs", comple_category="O", biological_timescale="fast",
    ),

    # ── HRV / autonomic outcomes (fast) ──────────────────────
    "hrv_daily": ResponseFamily(
        id="hrv_daily", label="Daily HRV",
        columns=["hrv_daily_mean", "sleep_hrv_ms", "hrv_ms"],
        unit="ms", comple_category="O", biological_timescale="fast",
    ),
    "hrv_baseline": ResponseFamily(
        id="hrv_baseline", label="HRV 7-Day Baseline",
        columns=["hrv_7d_mean", "sleep_hrv_7d"],
        unit="ms", comple_category="O", biological_timescale="medium",
    ),

    # ── Resting HR outcomes (fast) ───────────────────────────
    "resting_hr": ResponseFamily(
        id="resting_hr", label="Resting Heart Rate",
        columns=["resting_hr", "sleep_hr_bpm"],
        unit="bpm", comple_category="O", biological_timescale="fast",
    ),
    "resting_hr_trend": ResponseFamily(
        id="resting_hr_trend", label="Resting HR 7-Day Avg",
        columns=["resting_hr_7d_mean", "sleep_hr_7d"],
        unit="bpm", comple_category="O", biological_timescale="medium",
    ),

    # ── Body composition (slow) ──────────────────────────────
    "body_fat": ResponseFamily(
        id="body_fat", label="Body Fat %",
        columns=["body_fat_pct"],
        unit="%", comple_category="M", biological_timescale="slow",
    ),
    "body_mass": ResponseFamily(
        id="body_mass", label="Body Mass",
        columns=["body_mass_kg"],
        unit="kg", comple_category="M", biological_timescale="slow",
    ),

    # ── Vitamin D (slow) ─────────────────────────────────────
    "vitamin_d": ResponseFamily(
        id="vitamin_d", label="Vitamin D",
        columns=["vitamin_d_smoothed", "vitamin_d_raw"],
        unit="ng/mL", comple_category="M", biological_timescale="slow",
    ),

    # ── CBC / Immune markers (slow) ────────────────────────
    "wbc": ResponseFamily(
        id="wbc", label="White Blood Cells",
        columns=["wbc_smoothed", "wbc_raw"],
        unit="K/uL", comple_category="M", biological_timescale="slow",
    ),
    "rbc": ResponseFamily(
        id="rbc", label="Red Blood Cells",
        columns=["rbc_smoothed", "rbc_raw"],
        unit="M/uL", comple_category="M", biological_timescale="slow",
    ),
    "platelets": ResponseFamily(
        id="platelets", label="Platelet Count",
        columns=["platelets_smoothed", "platelets_raw"],
        unit="K/uL", comple_category="M", biological_timescale="slow",
    ),
    "mcv": ResponseFamily(
        id="mcv", label="Mean Corpuscular Volume",
        columns=["mcv_smoothed", "mcv_raw"],
        unit="fL", comple_category="M", biological_timescale="slow",
    ),
    "rdw": ResponseFamily(
        id="rdw", label="Red Cell Distribution Width",
        columns=["rdw_smoothed", "rdw_raw"],
        unit="%", comple_category="M", biological_timescale="slow",
    ),
    "nlr": ResponseFamily(
        id="nlr", label="Neutrophil-to-Lymphocyte Ratio",
        columns=["nlr"],
        unit="ratio", comple_category="M", biological_timescale="slow",
    ),

    # ── Advanced lipids (slow) ─────────────────────────────
    "apob": ResponseFamily(
        id="apob", label="Apolipoprotein B",
        columns=["apob_smoothed", "apob_raw"],
        unit="mg/dL", comple_category="M", biological_timescale="slow",
    ),
    "ldl_particle_number": ResponseFamily(
        id="ldl_particle_number", label="LDL Particle Number",
        columns=["ldl_particle_number_smoothed", "ldl_particle_number_raw"],
        unit="nmol/L", comple_category="M", biological_timescale="slow",
    ),
    "non_hdl_cholesterol": ResponseFamily(
        id="non_hdl_cholesterol", label="Non-HDL Cholesterol",
        columns=["non_hdl_cholesterol_smoothed", "non_hdl_cholesterol_raw"],
        unit="mg/dL", comple_category="M", biological_timescale="slow",
    ),
    "total_cholesterol": ResponseFamily(
        id="total_cholesterol", label="Total Cholesterol",
        columns=["total_cholesterol_smoothed", "total_cholesterol_raw"],
        unit="mg/dL", comple_category="M", biological_timescale="slow",
    ),

    # ── Metabolic (slow) ───────────────────────────────────
    "glucose": ResponseFamily(
        id="glucose", label="Fasting Glucose",
        columns=["glucose_smoothed", "glucose_raw"],
        unit="mg/dL", comple_category="M", biological_timescale="slow",
    ),
    "hba1c": ResponseFamily(
        id="hba1c", label="HbA1c",
        columns=["hba1c_smoothed", "hba1c_raw"],
        unit="%", comple_category="M", biological_timescale="slow",
    ),
    "insulin": ResponseFamily(
        id="insulin", label="Insulin",
        columns=["insulin_smoothed", "insulin_raw"],
        unit="uIU/mL", comple_category="M", biological_timescale="slow",
    ),
    "uric_acid": ResponseFamily(
        id="uric_acid", label="Uric Acid",
        columns=["uric_acid_smoothed", "uric_acid_raw"],
        unit="mg/dL", comple_category="M", biological_timescale="slow",
    ),
    "homocysteine": ResponseFamily(
        id="homocysteine", label="Homocysteine",
        columns=["homocysteine_smoothed", "homocysteine_raw"],
        unit="umol/L", comple_category="M", biological_timescale="slow",
    ),

    # ── Micronutrients (slow) ──────────────────────────────
    "b12": ResponseFamily(
        id="b12", label="Vitamin B12",
        columns=["b12_smoothed", "b12_raw"],
        unit="pg/mL", comple_category="M", biological_timescale="slow",
    ),
    "folate": ResponseFamily(
        id="folate", label="Folate",
        columns=["folate_smoothed", "folate_raw"],
        unit="ng/mL", comple_category="M", biological_timescale="slow",
    ),
    "zinc": ResponseFamily(
        id="zinc", label="Zinc",
        columns=["zinc_smoothed", "zinc_raw"],
        unit="mcg/dL", comple_category="M", biological_timescale="slow",
    ),
    "magnesium": ResponseFamily(
        id="magnesium", label="Magnesium (RBC)",
        columns=["magnesium_rbc_smoothed", "magnesium_rbc_raw"],
        unit="mg/dL", comple_category="M", biological_timescale="slow",
    ),

    # ── Omega-3 (slow) ─────────────────────────────────────
    "omega3_index": ResponseFamily(
        id="omega3_index", label="Omega-3 Index",
        columns=["omega3_index_derived", "omega3_index_smoothed"],
        unit="%", comple_category="M", biological_timescale="slow",
    ),

    # ── Kidney / liver (slow) ──────────────────────────────
    "creatinine": ResponseFamily(
        id="creatinine", label="Creatinine",
        columns=["creatinine_smoothed", "creatinine_raw"],
        unit="mg/dL", comple_category="M", biological_timescale="slow",
    ),
    "ast": ResponseFamily(
        id="ast", label="AST",
        columns=["ast_smoothed", "ast_raw"],
        unit="U/L", comple_category="M", biological_timescale="slow",
    ),
    "alt": ResponseFamily(
        id="alt", label="ALT",
        columns=["alt_smoothed", "alt_raw"],
        unit="U/L", comple_category="M", biological_timescale="slow",
    ),
    "albumin": ResponseFamily(
        id="albumin", label="Albumin",
        columns=["albumin_smoothed", "albumin_raw"],
        unit="g/dL", comple_category="M", biological_timescale="slow",
    ),

    # ── Additional hormones (slow) ─────────────────────────
    "dhea_s": ResponseFamily(
        id="dhea_s", label="DHEA-S",
        columns=["dhea_s_smoothed", "dhea_s_raw"],
        unit="mcg/dL", comple_category="M", biological_timescale="slow",
    ),
    "shbg": ResponseFamily(
        id="shbg", label="Sex Hormone Binding Globulin",
        columns=["shbg_smoothed", "shbg_raw"],
        unit="nmol/L", comple_category="M", biological_timescale="slow",
    ),
    "estradiol": ResponseFamily(
        id="estradiol", label="Estradiol",
        columns=["estradiol_smoothed", "estradiol_raw"],
        unit="pg/mL", comple_category="M", biological_timescale="slow",
    ),
    "free_t_ratio": ResponseFamily(
        id="free_t_ratio", label="Free T / Total T Ratio",
        columns=["free_t_ratio"],
        unit="ratio", comple_category="M", biological_timescale="slow",
    ),
}


# ═══════════════════════════════════════════════════════════════════
# MECHANISM CATALOG — known biological relationships
# ═══════════════════════════════════════════════════════════════════

@dataclass
class MechanismSpec:
    """A known biological relationship between a dose and response."""
    id: str
    name: str                         # Human-readable edge name
    dose_family: str                  # Key into DOSE_FAMILIES
    response_family: str              # Key into RESPONSE_FAMILIES
    prior_key: str                    # Key into population_priors.py
    mechanism: str                    # Brief biological explanation
    category: str                     # Insight category for UI
    response_lag: int                 # Days between dose and response
    per_unit: str                     # "per X" for beta description
    min_observations: int = 6         # Minimum data points to fit
    # Optional: specific timescale override (otherwise uses response family)
    timescale_override: Optional[str] = None
    # For display
    theta_display_fn_name: Optional[str] = None


# The catalog: every known C→M, C→O, L→M, L→O, M→M relationship
# that Serif can test if data is available.

MECHANISM_CATALOG: List[MechanismSpec] = [

    # ══════════════════════════════════════════════════════════
    # EXERCISE VOLUME → IRON/HEMATOLOGY (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="run_vol_iron",
        name="Running Volume -> Iron",
        dose_family="running_volume",
        response_family="iron_total",
        prior_key="weekly_run_km->iron_total",
        mechanism="Foot-strike hemolysis destroys red blood cells; iron lost via hemolysis, sweat, and GI ischemia",
        category="metabolic",
        response_lag=7,
        per_unit="per 40 km/mo",
        min_observations=4,
    ),
    MechanismSpec(
        id="run_vol_ferritin",
        name="Running Volume -> Ferritin",
        dose_family="running_volume",
        response_family="ferritin",
        prior_key="weekly_run_km->ferritin",
        mechanism="Chronic endurance running depletes iron stores through multiple loss pathways",
        category="metabolic",
        response_lag=14,
        per_unit="per 40 km/mo",
        min_observations=4,
    ),
    MechanismSpec(
        id="run_vol_hemoglobin",
        name="Running Volume -> Hemoglobin",
        dose_family="running_volume",
        response_family="hemoglobin",
        prior_key="weekly_run_km->hemoglobin",
        mechanism="Iron depletion impairs hemoglobin synthesis; chronic running can cause sports anemia",
        category="metabolic",
        response_lag=14,
        per_unit="per 40 km/mo",
        min_observations=4,
    ),

    # ══════════════════════════════════════════════════════════
    # TRAINING → HORMONES (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="training_hrs_testosterone",
        name="Training Hours -> Testosterone",
        dose_family="training_duration",
        response_family="testosterone",
        prior_key="weekly_training_hrs->testosterone",
        mechanism="Overtraining suppresses the hypothalamic-pituitary-gonadal axis",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="training_hrs_cortisol",
        name="Training Hours -> Cortisol",
        dose_family="training_duration",
        response_family="cortisol",
        prior_key="weekly_training_hrs->cortisol",
        mechanism="Chronic training stress elevates baseline cortisol via HPA axis activation",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),

    # ══════════════════════════════════════════════════════════
    # ZONE 2 → LIPIDS (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="zone2_triglycerides",
        name="Zone 2 Volume -> Triglycerides",
        dose_family="zone2_volume",
        response_family="triglycerides",
        prior_key="weekly_zone2_min->triglycerides",
        mechanism="Aerobic exercise increases lipoprotein lipase activity, clearing triglycerides",
        category="cardio",
        response_lag=14,
        per_unit="per 120 min/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="zone2_hdl",
        name="Zone 2 Volume -> HDL",
        dose_family="zone2_volume",
        response_family="hdl",
        prior_key="weekly_zone2_min->hdl",
        mechanism="Regular aerobic exercise upregulates HDL production and reverse cholesterol transport",
        category="cardio",
        response_lag=14,
        per_unit="per 120 min/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="zone2_ldl",
        name="Zone 2 Volume -> LDL",
        dose_family="zone2_volume",
        response_family="ldl",
        prior_key="weekly_zone2_min->ldl",
        mechanism="Aerobic exercise can modestly reduce LDL and shift particle size from small-dense to large-buoyant",
        category="cardio",
        response_lag=14,
        per_unit="per 120 min/mo",
        min_observations=3,
    ),

    # ══════════════════════════════════════════════════════════
    # ACWR → INFLAMMATION & RECOVERY (medium)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="acwr_hscrp",
        name="ACWR -> Inflammation",
        dose_family="acwr",
        response_family="hscrp",
        prior_key="acwr->hscrp",
        mechanism="Acute overreaching triggers systemic inflammation via muscle damage and oxidative stress",
        category="recovery",
        response_lag=7,
        per_unit="per 0.1 ACWR",
        min_observations=4,
    ),
    MechanismSpec(
        id="acwr_resting_hr",
        name="ACWR -> Resting HR Trend",
        dose_family="acwr",
        response_family="resting_hr_trend",
        prior_key="acwr->resting_hr",
        mechanism="Chronic overreaching elevates baseline sympathetic tone and resting heart rate",
        category="recovery",
        response_lag=0,
        per_unit="per 0.1 ACWR",
        min_observations=30,
    ),

    # ══════════════════════════════════════════════════════════
    # FITNESS ADAPTATION (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="consistency_vo2",
        name="Training Consistency -> VO2peak",
        dose_family="training_consistency",
        response_family="vo2peak",
        prior_key="training_consistency->vo2_peak",
        mechanism="Consistent aerobic training drives mitochondrial biogenesis and cardiac remodeling",
        category="cardio",
        response_lag=0,
        per_unit="per 0.1",
        min_observations=2,
    ),
    MechanismSpec(
        id="ferritin_vo2",
        name="Ferritin -> VO2peak",
        dose_family="ferritin_level",
        response_family="vo2peak",
        prior_key="ferritin->vo2_peak",
        mechanism="Iron stores limit oxygen transport capacity via hemoglobin synthesis",
        category="metabolic",
        response_lag=0,
        per_unit="per 10 ng/mL",
        min_observations=2,
    ),

    # ══════════════════════════════════════════════════════════
    # WORKOUT TIMING → SLEEP (fast)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="workout_time_sleep_eff",
        name="Workout Time -> Sleep Efficiency",
        dose_family="workout_end_time",
        response_family="sleep_efficiency",
        prior_key="workout_end_hour->sleep_efficiency",
        mechanism="Late workouts elevate core temperature and sympathetic tone, delaying sleep onset",
        category="sleep",
        response_lag=0,
        per_unit="per hr later",
        theta_display_fn_name="hour_to_time",
        min_observations=30,
    ),
    MechanismSpec(
        id="bedtime_sleep_quality",
        name="Bedtime -> Sleep Quality",
        dose_family="bedtime",
        response_family="sleep_quality",
        prior_key="bedtime_hour->sleep_quality",
        mechanism="Later bedtimes misalign with circadian melatonin onset, reducing sleep architecture quality",
        category="sleep",
        response_lag=0,
        per_unit="per hr later",
        theta_display_fn_name="hour_to_time",
        min_observations=30,
    ),
    MechanismSpec(
        id="bedtime_deep_sleep",
        name="Bedtime -> Deep Sleep",
        dose_family="bedtime",
        response_family="deep_sleep",
        prior_key="bedtime_hour->sleep_quality",  # Similar circadian mechanism
        mechanism="Earlier bedtime captures more slow-wave sleep in the first half of the night",
        category="sleep",
        response_lag=0,
        per_unit="per hr later",
        theta_display_fn_name="hour_to_time",
        min_observations=30,
    ),

    # ══════════════════════════════════════════════════════════
    # SLEEP → RECOVERY (fast)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="sleep_dur_hrv",
        name="Sleep Duration -> Next-Day HRV",
        dose_family="sleep_duration",
        response_family="hrv_daily",
        prior_key="sleep_duration->next_day_hrv",
        mechanism="Adequate sleep restores parasympathetic tone; insufficient sleep elevates sympathetic activity",
        category="recovery",
        response_lag=1,
        per_unit="per hr",
        min_observations=30,
    ),
    MechanismSpec(
        id="sleep_debt_resting_hr",
        name="Sleep Debt -> Resting HR",
        dose_family="sleep_debt",
        response_family="resting_hr",
        prior_key="sleep_debt->resting_hr",
        mechanism="Accumulated sleep deficit elevates sympathetic tone and baseline heart rate",
        category="recovery",
        response_lag=0,
        per_unit="per hr deficit",
        min_observations=30,
    ),

    # ══════════════════════════════════════════════════════════
    # TRAINING LOAD → RECOVERY (fast)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="trimp_hrv",
        name="Daily Training Load -> Next-Day HRV",
        dose_family="training_load",
        response_family="hrv_daily",
        prior_key="daily_trimp->next_day_hrv",
        mechanism="Acute training load drives autonomic nervous system fatigue measured via HRV depression",
        category="recovery",
        response_lag=1,
        per_unit="per 50 TRIMP",
        min_observations=30,
    ),
    MechanismSpec(
        id="trimp_resting_hr",
        name="Daily Training Load -> Next-Day Resting HR",
        dose_family="training_load",
        response_family="resting_hr",
        prior_key="daily_trimp->resting_hr",
        mechanism="Acute training elevates next-day resting HR via sympathetic activation and cardiac fatigue",
        category="recovery",
        response_lag=1,
        per_unit="per 50 TRIMP",
        min_observations=30,
    ),

    # ══════════════════════════════════════════════════════════
    # ACTIVITY → SLEEP (fast)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="steps_sleep_eff",
        name="Daily Steps -> Sleep Efficiency",
        dose_family="daily_steps",
        response_family="sleep_efficiency",
        prior_key="daily_steps->sleep_efficiency",
        mechanism="Moderate daily activity promotes sleep; excessive activity may impair it via overarousal",
        category="sleep",
        response_lag=0,
        per_unit="per 2000 steps",
        min_observations=30,
    ),
    MechanismSpec(
        id="energy_deep_sleep",
        name="Active Energy -> Deep Sleep",
        dose_family="active_energy",
        response_family="deep_sleep",
        prior_key="active_energy->deep_sleep",
        mechanism="Physical activity increases slow-wave sleep need via adenosine accumulation and thermoregulation",
        category="sleep",
        response_lag=0,
        per_unit="per 100 kcal",
        min_observations=30,
    ),

    # ── Training Duration → Sleep ──────────────────────────────
    MechanismSpec(
        id="duration_sleep_eff",
        name="Training Duration -> Sleep Efficiency",
        dose_family="training_duration",
        response_family="sleep_efficiency",
        prior_key="daily_duration_min->sleep_efficiency",
        mechanism="Moderate exercise promotes sleep onset and consolidation via thermoregulatory and adenosine pathways",
        category="sleep",
        response_lag=0,
        per_unit="per 30 min/day",
        min_observations=30,
    ),
    MechanismSpec(
        id="duration_deep_sleep",
        name="Training Duration -> Deep Sleep",
        dose_family="training_duration",
        response_family="deep_sleep",
        prior_key="daily_duration_min->deep_sleep",
        mechanism="Exercise increases slow-wave sleep need proportional to volume via adenosine accumulation",
        category="sleep",
        response_lag=0,
        per_unit="per 30 min/day",
        min_observations=30,
    ),
    # ── Training Load (TRIMP) → Sleep ─────────────────────────
    MechanismSpec(
        id="trimp_sleep_eff",
        name="Training Load -> Sleep Efficiency",
        dose_family="training_load",
        response_family="sleep_efficiency",
        prior_key="daily_trimp->sleep_efficiency",
        mechanism="High-intensity training elevates sympathetic tone and core temperature, impairing sleep efficiency at high loads",
        category="sleep",
        response_lag=0,
        per_unit="per 50 TRIMP",
        min_observations=30,
    ),
    MechanismSpec(
        id="trimp_deep_sleep",
        name="Training Load -> Deep Sleep",
        dose_family="training_load",
        response_family="deep_sleep",
        prior_key="daily_trimp->deep_sleep",
        mechanism="Training intensity drives deep sleep need but extreme loads suppress SWS via cortisol and sympathetic activation",
        category="sleep",
        response_lag=0,
        per_unit="per 50 TRIMP",
        min_observations=30,
    ),
    # ── Running Volume → Sleep ────────────────────────────────
    MechanismSpec(
        id="running_sleep_eff",
        name="Running Volume -> Sleep Efficiency",
        dose_family="running_volume",
        response_family="sleep_efficiency",
        prior_key="daily_run_km->sleep_efficiency",
        mechanism="Aerobic running improves sleep quality via cardiovascular and thermoregulatory mechanisms",
        category="sleep",
        response_lag=0,
        per_unit="per 2 km/day",
        min_observations=30,
    ),
    # ── Zone 2 Volume → Deep Sleep ────────────────────────────
    MechanismSpec(
        id="zone2_deep_sleep",
        name="Zone 2 Volume -> Deep Sleep",
        dose_family="zone2_volume",
        response_family="deep_sleep",
        prior_key="daily_zone2_min->deep_sleep",
        mechanism="Zone 2 aerobic exercise specifically increases slow-wave sleep via sustained adenosine accumulation",
        category="sleep",
        response_lag=0,
        per_unit="per 15 min/day",
        min_observations=30,
    ),

    # ══════════════════════════════════════════════════════════
    # WEEKLY VOLUME → RECOVERY (medium)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="weekly_km_hrv",
        name="Weekly Volume -> HRV Baseline",
        dose_family="running_volume",
        response_family="hrv_baseline",
        prior_key="weekly_km->hrv_baseline",
        mechanism="Moderate volume improves vagal tone; excessive volume suppresses it via overtraining",
        category="recovery",
        response_lag=0,
        per_unit="per 10 km/wk",
        min_observations=30,
        timescale_override="medium",
    ),

    # ══════════════════════════════════════════════════════════
    # TRAVEL / JET LAG → RECOVERY (fast)
    # Israel↔US = ~7 hour time zone shift, 48 transitions
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="travel_sleep_eff",
        name="Travel Load -> Sleep Efficiency",
        dose_family="travel_load",
        response_family="sleep_efficiency",
        prior_key="travel_load->sleep_efficiency",
        mechanism="Jet lag disrupts circadian rhythm, delaying melatonin onset and reducing sleep efficiency",
        category="sleep",
        response_lag=0,
        per_unit="per 0.2 load",
        min_observations=20,
    ),
    MechanismSpec(
        id="travel_hrv",
        name="Travel Load -> Daily HRV",
        dose_family="travel_load",
        response_family="hrv_daily",
        prior_key="travel_load->hrv_daily",
        mechanism="Travel stress and circadian misalignment suppress parasympathetic tone measured via HRV",
        category="recovery",
        response_lag=0,
        per_unit="per 0.2 load",
        min_observations=20,
    ),
    MechanismSpec(
        id="travel_rhr",
        name="Travel Load -> Resting HR",
        dose_family="travel_load",
        response_family="resting_hr",
        prior_key="travel_load->resting_hr",
        mechanism="Circadian disruption and travel fatigue elevate sympathetic tone and resting heart rate",
        category="recovery",
        response_lag=0,
        per_unit="per 0.2 load",
        min_observations=20,
    ),

    # ══════════════════════════════════════════════════════════
    # ACTIVITY → BODY COMPOSITION (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="training_vol_body_fat",
        name="Training Volume -> Body Fat",
        dose_family="training_duration",
        response_family="body_fat",
        prior_key="weekly_training_hrs->body_fat_pct",
        mechanism="Higher training volume increases energy expenditure and fat oxidation",
        category="metabolic",
        response_lag=0,
        per_unit="per 10 hrs/mo",
        min_observations=10,
    ),
    MechanismSpec(
        id="steps_body_mass",
        name="Daily Activity -> Body Mass",
        dose_family="daily_steps",
        response_family="body_mass",
        prior_key="daily_activity->body_mass",
        mechanism="Higher daily activity creates energy deficit supporting weight management",
        category="metabolic",
        response_lag=0,
        per_unit="per 2000 steps",
        min_observations=10,
        timescale_override="slow",
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: EXERCISE → CBC / HEMATOLOGY (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="run_vol_rbc",
        name="Running Volume -> RBC",
        dose_family="running_volume",
        response_family="rbc",
        prior_key="weekly_run_km->rbc",
        mechanism="Endurance running causes plasma volume expansion, diluting red cell concentration (sports anemia)",
        category="metabolic",
        response_lag=7,
        per_unit="per 40 km/mo",
        min_observations=4,
    ),
    MechanismSpec(
        id="run_vol_mcv",
        name="Running Volume -> MCV",
        dose_family="running_volume",
        response_family="mcv",
        prior_key="weekly_run_km->mcv",
        mechanism="Iron depletion from chronic running leads to microcytic red cells (low MCV)",
        category="metabolic",
        response_lag=14,
        per_unit="per 40 km/mo",
        min_observations=4,
    ),
    MechanismSpec(
        id="run_vol_rdw",
        name="Running Volume -> RDW",
        dose_family="running_volume",
        response_family="rdw",
        prior_key="weekly_run_km->rdw",
        mechanism="Mixed cell populations from iron depletion increase red cell size variation",
        category="metabolic",
        response_lag=14,
        per_unit="per 40 km/mo",
        min_observations=4,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: TRAINING → LIVER / MUSCLE ENZYMES (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="training_hrs_ast",
        name="Training Hours -> AST",
        dose_family="training_duration",
        response_family="ast",
        prior_key="weekly_training_hrs->ast",
        mechanism="Skeletal muscle damage during exercise releases AST into bloodstream",
        category="metabolic",
        response_lag=7,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="training_hrs_alt",
        name="Training Hours -> ALT",
        dose_family="training_duration",
        response_family="alt",
        prior_key="weekly_training_hrs->alt",
        mechanism="Exercise-induced hepatic stress and muscle damage elevate ALT (less than AST)",
        category="metabolic",
        response_lag=7,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: ZONE 2 → ADVANCED LIPIDS (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="zone2_apob",
        name="Zone 2 Volume -> ApoB",
        dose_family="zone2_volume",
        response_family="apob",
        prior_key="weekly_zone2_min->apob",
        mechanism="Aerobic exercise reduces atherogenic particle count via increased LDL receptor activity",
        category="cardio",
        response_lag=14,
        per_unit="per 120 min/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="zone2_non_hdl",
        name="Zone 2 Volume -> Non-HDL Cholesterol",
        dose_family="zone2_volume",
        response_family="non_hdl_cholesterol",
        prior_key="weekly_zone2_min->non_hdl_cholesterol",
        mechanism="Aerobic exercise reduces atherogenic lipoproteins (LDL + VLDL + IDL)",
        category="cardio",
        response_lag=14,
        per_unit="per 120 min/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="zone2_total_chol",
        name="Zone 2 Volume -> Total Cholesterol",
        dose_family="zone2_volume",
        response_family="total_cholesterol",
        prior_key="weekly_zone2_min->total_cholesterol",
        mechanism="Aerobic exercise net effect on total cholesterol (HDL up, LDL down)",
        category="cardio",
        response_lag=14,
        per_unit="per 120 min/mo",
        min_observations=3,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: TRAINING → METABOLIC (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="training_hrs_glucose",
        name="Training Hours -> Glucose",
        dose_family="training_duration",
        response_family="glucose",
        prior_key="weekly_training_hrs->glucose",
        mechanism="Exercise upregulates GLUT4 transporters, improving glucose disposal",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="training_hrs_hba1c",
        name="Training Hours -> HbA1c",
        dose_family="training_duration",
        response_family="hba1c",
        prior_key="weekly_training_hrs->hba1c",
        mechanism="Chronic exercise improves long-term glycemic control through insulin sensitization",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="training_hrs_insulin",
        name="Training Hours -> Insulin",
        dose_family="training_duration",
        response_family="insulin",
        prior_key="weekly_training_hrs->insulin",
        mechanism="Regular exercise improves insulin sensitivity, lowering fasting insulin levels",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="training_hrs_uric_acid",
        name="Training Hours -> Uric Acid",
        dose_family="training_duration",
        response_family="uric_acid",
        prior_key="weekly_training_hrs->uric_acid",
        mechanism="Exercise modulates purine metabolism; moderate exercise may lower uric acid",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: ACWR → IMMUNE (medium)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="acwr_wbc",
        name="ACWR -> White Blood Cells",
        dose_family="acwr",
        response_family="wbc",
        prior_key="acwr->wbc",
        mechanism="Acute overreaching triggers open-window immunosuppression with transient leukopenia",
        category="recovery",
        response_lag=7,
        per_unit="per 0.1 ACWR",
        min_observations=4,
    ),
    MechanismSpec(
        id="acwr_nlr",
        name="ACWR -> Neutrophil-Lymphocyte Ratio",
        dose_family="acwr",
        response_family="nlr",
        prior_key="acwr->nlr",
        mechanism="Training stress shifts immune balance: neutrophilia + lymphopenia = elevated NLR",
        category="recovery",
        response_lag=7,
        per_unit="per 0.1 ACWR",
        min_observations=4,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: EXERCISE → MICRONUTRIENTS (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="run_vol_zinc",
        name="Running Volume -> Zinc",
        dose_family="running_volume",
        response_family="zinc",
        prior_key="weekly_run_km->zinc",
        mechanism="Zinc lost through sweat during endurance exercise; heavy training depletes stores",
        category="metabolic",
        response_lag=14,
        per_unit="per 40 km/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="run_vol_magnesium",
        name="Running Volume -> Magnesium",
        dose_family="running_volume",
        response_family="magnesium",
        prior_key="weekly_run_km->magnesium",
        mechanism="Magnesium lost through sweat and increased renal excretion during exercise",
        category="metabolic",
        response_lag=14,
        per_unit="per 40 km/mo",
        min_observations=3,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: TRAINING → ADDITIONAL HORMONES (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="training_hrs_dhea",
        name="Training Hours -> DHEA-S",
        dose_family="training_duration",
        response_family="dhea_s",
        prior_key="weekly_training_hrs->dhea_s",
        mechanism="Moderate exercise stimulates adrenal DHEA production; overtraining may deplete it",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="training_hrs_shbg",
        name="Training Hours -> SHBG",
        dose_family="training_duration",
        response_family="shbg",
        prior_key="weekly_training_hrs->shbg",
        mechanism="Exercise increases SHBG production, affecting free testosterone availability",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER B: MODERATE RATIONALE — WIDER PRIORS (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="training_hrs_homocysteine",
        name="Training Hours -> Homocysteine",
        dose_family="training_duration",
        response_family="homocysteine",
        prior_key="weekly_training_hrs->homocysteine",
        mechanism="Exercise increases B6/B12/folate demand for methylation; may lower homocysteine",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="training_hrs_creatinine",
        name="Training Hours -> Creatinine",
        dose_family="training_duration",
        response_family="creatinine",
        prior_key="weekly_training_hrs->creatinine",
        mechanism="Higher muscle mass and exercise increase creatine turnover and serum creatinine",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="training_hrs_estradiol",
        name="Training Hours -> Estradiol",
        dose_family="training_duration",
        response_family="estradiol",
        prior_key="weekly_training_hrs->estradiol",
        mechanism="Exercise affects aromatase activity and adipose tissue estrogen production",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="training_hrs_platelets",
        name="Training Hours -> Platelet Count",
        dose_family="training_duration",
        response_family="platelets",
        prior_key="weekly_training_hrs->platelets",
        mechanism="Acute exercise induces thrombocytosis; chronic training may modulate baseline count",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),
    MechanismSpec(
        id="training_hrs_albumin",
        name="Training Hours -> Albumin",
        dose_family="training_duration",
        response_family="albumin",
        prior_key="weekly_training_hrs->albumin",
        mechanism="Exercise-induced plasma volume expansion can dilute serum albumin",
        category="metabolic",
        response_lag=14,
        per_unit="per 4 hrs/mo",
        min_observations=3,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER B: SLEEP → MARKERS (slow response, fast dose)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="sleep_dur_cortisol",
        name="Sleep Duration -> Cortisol",
        dose_family="sleep_duration",
        response_family="cortisol",
        prior_key="sleep_duration->cortisol",
        mechanism="Sleep restriction elevates next-morning cortisol via HPA axis dysregulation",
        category="recovery",
        response_lag=0,
        per_unit="per hr",
        min_observations=4,
        timescale_override="slow",
    ),
    MechanismSpec(
        id="sleep_dur_testosterone",
        name="Sleep Duration -> Testosterone",
        dose_family="sleep_duration",
        response_family="testosterone",
        prior_key="sleep_duration->testosterone",
        mechanism="Testosterone is primarily produced during sleep; restriction suppresses production",
        category="recovery",
        response_lag=0,
        per_unit="per hr",
        min_observations=4,
        timescale_override="slow",
    ),
    MechanismSpec(
        id="sleep_dur_glucose",
        name="Sleep Duration -> Glucose",
        dose_family="sleep_duration",
        response_family="glucose",
        prior_key="sleep_duration->glucose",
        mechanism="Chronic sleep restriction impairs insulin sensitivity and glucose tolerance",
        category="recovery",
        response_lag=0,
        per_unit="per hr",
        min_observations=4,
        timescale_override="slow",
    ),
    MechanismSpec(
        id="sleep_dur_wbc",
        name="Sleep Duration -> WBC",
        dose_family="sleep_duration",
        response_family="wbc",
        prior_key="sleep_duration->wbc",
        mechanism="Adequate sleep supports immune cell production and healthy WBC counts",
        category="recovery",
        response_lag=0,
        per_unit="per hr",
        min_observations=4,
        timescale_override="slow",
    ),

    # ══════════════════════════════════════════════════════════
    # TIER C: CROSS-LINKS — MARKER → MARKER (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="iron_sat_hemoglobin",
        name="Iron Saturation -> Hemoglobin",
        dose_family="iron_sat_level",
        response_family="hemoglobin",
        prior_key="iron_saturation->hemoglobin",
        mechanism="Iron saturation determines iron availability for hemoglobin synthesis",
        category="metabolic",
        response_lag=0,
        per_unit="per 5%",
        min_observations=2,
    ),
    MechanismSpec(
        id="vitamin_d_testosterone",
        name="Vitamin D -> Testosterone",
        dose_family="vitamin_d_level",
        response_family="testosterone",
        prior_key="vitamin_d->testosterone",
        mechanism="Vitamin D receptors in Leydig cells; deficiency is associated with lower testosterone",
        category="metabolic",
        response_lag=0,
        per_unit="per 10 ng/mL",
        min_observations=2,
    ),
    MechanismSpec(
        id="omega3_hscrp",
        name="Omega-3 Index -> hsCRP",
        dose_family="omega3_level",
        response_family="hscrp",
        prior_key="omega3_index->hscrp",
        mechanism="EPA/DHA compete with arachidonic acid, reducing pro-inflammatory eicosanoid production",
        category="metabolic",
        response_lag=0,
        per_unit="per 1%",
        min_observations=2,
    ),
    MechanismSpec(
        id="ferritin_rbc",
        name="Ferritin -> RBC",
        dose_family="ferritin_level",
        response_family="rbc",
        prior_key="ferritin->rbc",
        mechanism="Iron stores support erythropoiesis; depletion impairs red blood cell production",
        category="metabolic",
        response_lag=0,
        per_unit="per 10 ng/mL",
        min_observations=2,
    ),
    MechanismSpec(
        id="ferritin_hemoglobin",
        name="Ferritin -> Hemoglobin",
        dose_family="ferritin_level",
        response_family="hemoglobin",
        prior_key="ferritin->hemoglobin",
        mechanism="Low ferritin limits iron availability for hemoglobin synthesis",
        category="metabolic",
        response_lag=0,
        per_unit="per 10 ng/mL",
        min_observations=2,
    ),
    MechanismSpec(
        id="b12_homocysteine",
        name="B12 -> Homocysteine",
        dose_family="b12_level",
        response_family="homocysteine",
        prior_key="b12->homocysteine",
        mechanism="B12 is a cofactor for methionine synthase which clears homocysteine",
        category="metabolic",
        response_lag=0,
        per_unit="per 100 pg/mL",
        min_observations=2,
    ),
    MechanismSpec(
        id="homocysteine_hscrp",
        name="Homocysteine -> hsCRP",
        dose_family="homocysteine_level",
        response_family="hscrp",
        prior_key="homocysteine->hscrp",
        mechanism="Elevated homocysteine promotes endothelial dysfunction and vascular inflammation",
        category="metabolic",
        response_lag=0,
        per_unit="per umol/L",
        min_observations=2,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER D: DIETARY → BODY COMPOSITION (slow)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="protein_body_fat",
        name="Dietary Protein -> Body Fat",
        dose_family="dietary_protein",
        response_family="body_fat",
        prior_key="dietary_protein->body_fat",
        mechanism="Higher protein intake increases thermic effect and satiety, supporting fat loss",
        category="metabolic",
        response_lag=0,
        per_unit="per 10 g/day",
        min_observations=10,
        timescale_override="slow",
    ),
    MechanismSpec(
        id="energy_body_mass",
        name="Dietary Energy -> Body Mass",
        dose_family="dietary_energy",
        response_family="body_mass",
        prior_key="dietary_energy->body_mass",
        mechanism="Chronic energy surplus/deficit drives body mass changes via energy balance",
        category="metabolic",
        response_lag=0,
        per_unit="per 100 kcal/day",
        min_observations=10,
        timescale_override="slow",
    ),

    # ══════════════════════════════════════════════════════════
    # TIER F: TRAVEL → ADDITIONAL OUTCOMES (fast)
    # ══════════════════════════════════════════════════════════

    MechanismSpec(
        id="travel_nlr",
        name="Travel Load -> NLR",
        dose_family="travel_load",
        response_family="nlr",
        prior_key="travel_load->nlr",
        mechanism="Travel stress and circadian disruption shift immune balance toward neutrophilia",
        category="recovery",
        response_lag=0,
        per_unit="per 0.2 load",
        min_observations=4,
        timescale_override="slow",
    ),
    MechanismSpec(
        id="travel_deep_sleep",
        name="Travel Load -> Deep Sleep",
        dose_family="travel_load",
        response_family="deep_sleep",
        prior_key="travel_load->deep_sleep",
        mechanism="Jet lag disrupts slow-wave sleep architecture via circadian misalignment",
        category="sleep",
        response_lag=0,
        per_unit="per 0.2 load",
        min_observations=20,
    ),
]


# ═══════════════════════════════════════════════════════════════════
# DISCOVERY ENGINE
# ═══════════════════════════════════════════════════════════════════

def _find_best_column(family_columns: List[str], timeline_cols: set,
                      timeline: pd.DataFrame) -> Optional[str]:
    """
    Find the best available column from a family's candidate list.
    Priority: first in the list that exists and has sufficient non-null data.
    """
    for col in family_columns:
        if col in timeline_cols:
            non_null = timeline[col].notna().sum()
            if non_null >= 2:  # At least some data
                return col
    return None


def _count_valid_pairs(dose_col: str, response_col: str,
                       timeline: pd.DataFrame,
                       dose_window: int, dose_agg: str,
                       response_lag: int) -> int:
    """
    Count how many valid (x, y) pairs we'd get for this edge.
    Quick estimate without full aggregation.
    """
    dose = timeline[dose_col].astype(float)
    response = timeline[response_col].astype(float)

    if dose_window > 1:
        if dose_agg == "sum":
            dose = dose.rolling(dose_window, min_periods=max(1, dose_window // 2)).sum()
        elif dose_agg == "mean":
            dose = dose.rolling(dose_window, min_periods=max(1, dose_window // 2)).mean()

    if response_lag > 0:
        response = response.shift(-response_lag)

    valid = dose.notna() & response.notna()
    return int(valid.sum())


def discover_edges(timeline: pd.DataFrame, verbose: bool = True) -> List[EdgeSpec]:
    """
    Discover all testable causal edges from the available timeline data.

    For each mechanism in the catalog:
    1. Check if dose family has an available column
    2. Check if response family has an available column
    3. Select dose operationalization based on response timescale
    4. Verify sufficient data points
    5. Generate EdgeSpec

    Returns a list of EdgeSpecs ready for BCEL fitting.
    """
    timeline_cols = set(timeline.columns)
    discovered = []
    skipped_no_dose = []
    skipped_no_response = []
    skipped_insufficient = []

    if verbose:
        print(f"Scanning {len(timeline.columns)} columns against {len(MECHANISM_CATALOG)} mechanisms...")

    for mech in MECHANISM_CATALOG:
        dose_fam = DOSE_FAMILIES.get(mech.dose_family)
        resp_fam = RESPONSE_FAMILIES.get(mech.response_family)

        if dose_fam is None or resp_fam is None:
            continue

        # 1. Find best dose column
        dose_col = _find_best_column(dose_fam.columns, timeline_cols, timeline)
        if dose_col is None:
            skipped_no_dose.append(mech.name)
            continue

        # 2. Find best response column
        resp_col = _find_best_column(resp_fam.columns, timeline_cols, timeline)
        if resp_col is None:
            skipped_no_response.append(mech.name)
            continue

        # 3. Determine timescale and dose operationalization
        timescale = mech.timescale_override or resp_fam.biological_timescale
        if timescale not in dose_fam.window_by_timescale:
            # Fallback: use the closest available timescale
            available_ts = list(dose_fam.window_by_timescale.keys())
            timescale = available_ts[-1] if available_ts else "medium"

        dose_window, dose_agg = dose_fam.window_by_timescale.get(
            timescale, (7, "sum")
        )

        # 4. Count valid pairs
        n_pairs = _count_valid_pairs(
            dose_col, resp_col, timeline,
            dose_window, dose_agg, mech.response_lag,
        )

        if n_pairs < mech.min_observations:
            skipped_insufficient.append(f"{mech.name} ({n_pairs} obs)")
            continue

        # 5. Build the theta_unit from dose family + window
        #    Only append time period for sum aggregations (cumulative totals).
        #    Mean aggregations retain the raw unit (e.g., "hours" not "hours/month").
        if dose_window == 1 or dose_agg == "mean":
            theta_unit = dose_fam.unit
        elif dose_window == 7:
            theta_unit = f"{dose_fam.unit}/week"
        elif dose_window == 28:
            theta_unit = f"{dose_fam.unit}/month"
        else:
            theta_unit = f"{dose_fam.unit}/{dose_window}d"

        # 6. Generate EdgeSpec
        edge = EdgeSpec(
            name=mech.name,
            edge_key=mech.prior_key,
            dose_variable=dose_col,
            dose_window=dose_window,
            dose_agg=dose_agg,
            response_variable=resp_col,
            response_lag=mech.response_lag,
            biological_timescale=timescale,
            prior_key=mech.prior_key,
            theta_unit=theta_unit,
            effect_unit=resp_fam.unit,
            per_unit=mech.per_unit,
            theta_display_fn_name=mech.theta_display_fn_name,
            adjustment_set=[],  # Could be populated from COMPLE E variables
            category=mech.category,
            mechanism=mech.mechanism,
            data_sources=_infer_data_sources(dose_col, resp_col),
            min_observations=mech.min_observations,
        )

        discovered.append(edge)

        if verbose:
            print(f"  [OK] {mech.name:42s} dose={dose_col:30s} resp={resp_col:25s} "
                  f"n={n_pairs:5d} window={dose_window}d/{dose_agg}")

    if verbose:
        print(f"\nDiscovery summary:")
        print(f"  Testable edges:    {len(discovered)}")
        print(f"  No dose data:      {len(skipped_no_dose)}")
        if skipped_no_dose:
            for s in skipped_no_dose:
                print(f"    - {s}")
        print(f"  No response data:  {len(skipped_no_response)}")
        if skipped_no_response:
            for s in skipped_no_response:
                print(f"    - {s}")
        print(f"  Insufficient data: {len(skipped_insufficient)}")
        if skipped_insufficient:
            for s in skipped_insufficient:
                print(f"    - {s}")

    return discovered


def _infer_data_sources(dose_col: str, resp_col: str) -> List[str]:
    """Infer which data sources feed an edge based on column names."""
    sources = set()
    for col in [dose_col, resp_col]:
        if any(k in col for k in ["run", "cycle", "distance", "elevation", "trimp",
                                    "zone2", "workout", "acwr", "consistency"]):
            sources.add("gpx")
        if any(k in col for k in ["hrv", "resting_hr", "steps", "active_energy",
                                    "exercise", "vo2max", "spo2", "body_mass",
                                    "body_fat", "heart_rate", "ah_"]):
            sources.add("apple_health")
        if any(k in col for k in ["sleep_duration", "sleep_efficiency", "sleep_quality",
                                    "deep_sleep_min", "bedtime", "waketime",
                                    "awake_min", "sleep_debt", "sleep_hr"]):
            sources.add("autosleep")
        if any(k in col for k in ["_smoothed", "_raw", "iron", "ferritin",
                                    "testosterone", "cortisol", "hdl", "ldl",
                                    "triglycerides", "hscrp", "hemoglobin",
                                    "vitamin_d", "dhea", "glucose", "wbc",
                                    "nlr", "rbc", "hematocrit", "free_t",
                                    "lh", "fsh", "shbg", "psa"]):
            sources.add("labs")
        if any(k in col for k in ["travel", "jet_lag", "timezone"]):
            sources.add("derived")
        if any(k in col for k in ["dietary", "protein", "carb", "fat", "calori",
                                    "fiber", "sodium", "sugar"]):
            sources.add("apple_health")
    if not sources:
        sources.add("derived")
    return sorted(sources)


def discover_adjustment_sets(
    timeline: pd.DataFrame,
    edges: List[EdgeSpec],
) -> List[EdgeSpec]:
    """
    Populate adjustment sets for discovered edges using available
    Environment variables from the timeline.
    """
    # Available E variables
    env_candidates = ["season", "day_of_week", "month", "location", "travel_load"]
    available_env = [c for c in env_candidates if c in timeline.columns]

    # Available pre-treatment L variables for adjustment
    load_candidates = ["acwr", "training_consistency", "sleep_debt_14d"]
    available_loads = [c for c in load_candidates if c in timeline.columns]

    for edge in edges:
        adj = []
        # Always include available environment variables for slow markers
        if edge.biological_timescale == "slow":
            adj.extend(available_env)
        else:
            # For fast outcomes, include day_of_week and season
            adj.extend([v for v in available_env if v in ("day_of_week", "season")])

        # Add pre-treatment loads if they're not the dose itself
        for load in available_loads:
            if load != edge.dose_variable:
                adj.append(load)

        edge.adjustment_set = adj

    return edges


# ═══════════════════════════════════════════════════════════════════
# REPORTING
# ═══════════════════════════════════════════════════════════════════

def print_discovery_report(edges: List[EdgeSpec]) -> None:
    """Print a summary of discovered edges grouped by category."""
    by_cat = {}
    for e in edges:
        by_cat.setdefault(e.category, []).append(e)

    print(f"\n{'=' * 70}")
    print(f"DISCOVERED EDGES: {len(edges)} total")
    print(f"{'=' * 70}")

    for cat in ["metabolic", "cardio", "recovery", "sleep"]:
        cat_edges = by_cat.get(cat, [])
        if not cat_edges:
            continue
        print(f"\n  {cat.upper()} ({len(cat_edges)} edges):")
        for e in cat_edges:
            ts = e.biological_timescale
            print(f"    {e.name:42s} [{ts:6s}] "
                  f"dose={e.dose_variable}({e.dose_window}d/{e.dose_agg}) "
                  f"-> {e.response_variable} (lag={e.response_lag}d)")


def get_mechanism_count() -> int:
    """Total mechanisms in the catalog."""
    return len(MECHANISM_CATALOG)


def get_dose_family_ids() -> List[str]:
    """All dose family IDs."""
    return list(DOSE_FAMILIES.keys())


def get_response_family_ids() -> List[str]:
    """All response family IDs."""
    return list(RESPONSE_FAMILIES.keys())


# ═══════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')

    from inference_engine.config import DAILY_TIMELINE_CSV
    import pandas as pd

    print(f"Loading timeline: {DAILY_TIMELINE_CSV}")
    df = pd.read_csv(DAILY_TIMELINE_CSV, parse_dates=["date"])
    print(f"Shape: {df.shape}")

    edges = discover_edges(df)
    edges = discover_adjustment_sets(df, edges)
    print_discovery_report(edges)
