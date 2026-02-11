"""
COMPLE variable categorization mapper.
Maps every variable to its COMPLE category for causal inference.

C = Choices (controllable behaviors — things Oron directly decides)
O = Outcomes (daily observable results — what changes day-to-day)
M = Markers (slow biology, lab-measured or CPET-derived)
P = Physiology (safety-only guardrails, never enters causal learning)
L = Loads (accumulated stressors, derived from recent behavior history)
E = Environment (context variables, used as confounders/adjustments only)

Sources:
  - Quest Labs: 6 draws, ~80 unique tests
  - Medix BRN: CPET, spirometry, body composition (single assessment)
  - GPX Routes: 679 workout files, 9+ years
  - Apple Watch (incoming): HRV, resting HR, sleep stages, steps, etc.
"""
from typing import Dict, List, Tuple

# ══════════════════════════════════════════════════════════════════
# COMPLETE COMPLE MAP — every variable from every data source
# ══════════════════════════════════════════════════════════════════

COMPLE_MAP: Dict[str, str] = {

    # ══════════════════════════════════════════════════════════════
    # C: CHOICES — what Oron directly controls
    # Source: GPX (current) + Apple Watch (incoming)
    # ══════════════════════════════════════════════════════════════

    # Per-workout choices (from GPX)
    "workout_duration_min": "C",
    "workout_intensity": "C",         # easy / zone2 / threshold / high
    "workout_type": "C",              # running / cycling / walking / other
    "time_of_day": "C",              # early_morning / morning / midday / afternoon / evening
    "distance_km": "C",              # per-workout distance
    "elevation_gain_m": "C",         # per-workout elevation choice (route selection)
    "workout_hour": "C",             # numeric hour of workout start

    # Daily behavioral choices (from Apple Watch — incoming)
    "bedtime_hour": "C",             # when Oron goes to bed
    "wake_time_hour": "C",           # when Oron sets alarm / wakes
    "caffeine_cutoff_hour": "C",     # last caffeine time (if tracked)
    "alcohol_units": "C",            # daily alcohol intake (if tracked)
    "eating_window_start": "C",      # first meal time
    "eating_window_end": "C",        # last meal time
    "screen_cutoff_hour": "C",       # screen time before bed (if tracked)

    # ══════════════════════════════════════════════════════════════
    # O: OUTCOMES — daily observable results that fluctuate
    # Source: Apple Watch (incoming) — blocked until data arrives
    # ══════════════════════════════════════════════════════════════

    # Sleep outcomes (from Apple Watch sleep tracking)
    "sleep_score": "O",              # composite sleep quality score
    "sleep_duration": "O",           # total sleep time in minutes
    "deep_sleep_min": "O",           # deep sleep minutes
    "rem_sleep_min": "O",            # REM sleep minutes
    "core_sleep_min": "O",           # core/light sleep minutes (Apple Watch specific)
    "sleep_efficiency": "O",         # % of time in bed actually asleep
    "sleep_latency": "O",            # time to fall asleep in minutes
    "awake_min": "O",               # minutes awake during sleep
    "in_bed_min": "O",              # total time in bed

    # Subjective outcomes (if Oron tracks via app)
    "energy": "O",                   # daily energy 1-10
    "mood": "O",                     # daily mood 1-10
    "focus": "O",                    # daily focus/cognitive 1-10
    "stress": "O",                   # daily perceived stress 1-10

    # Daily activity outcomes (from Apple Watch)
    "steps": "O",                    # daily step count
    "active_calories": "O",          # daily active energy burned
    "exercise_minutes": "O",         # Apple Watch exercise ring minutes
    "distance_walking_running": "O", # daily total walk+run distance
    "distance_cycling": "O",         # daily total cycling distance

    # Recovery outcomes (Apple Watch — daily fluctuation)
    "daily_hrv": "O",               # daily HRV reading (as outcome, not safety P)
    "daily_resting_hr": "O",        # daily resting HR (as outcome, not safety P)

    # ══════════════════════════════════════════════════════════════
    # M: MARKERS — slow-changing biology, measured infrequently
    # Source: Quest Labs (6 draws) + Medix CPET + Medix Body Comp
    # ══════════════════════════════════════════════════════════════

    # ── Iron Panel (Quest Labs) — Oron's #1 clinical issue ────────
    "iron_total": "M",               # 37 mcg/dL (ref 50-180) — CRITICAL LOW
    "ferritin": "M",                 # 46 ng/mL (was 24, ref 38-380)
    "iron_saturation_pct": "M",      # 9.3% (ref 20-48%) — CRITICAL LOW
    "tibc": "M",                     # Total Iron Binding Capacity, 399 mcg/dL

    # ── Lipid Panel (Quest Labs) ──────────────────────────────────
    "total_cholesterol": "M",        # 114 mg/dL
    "hdl": "M",                      # 44 mg/dL (target >50)
    "ldl": "M",                      # 58 mg/dL
    "triglycerides": "M",            # 42 mg/dL (excellent)
    "apob": "M",                     # Apolipoprotein B, 72 mg/dL
    "chol_hdl_ratio": "M",           # Cholesterol/HDL ratio
    "non_hdl_cholesterol": "M",      # Non-HDL cholesterol
    "ldl_particle_number": "M",      # NMR LDL particle number
    "ldl_small": "M",               # Small LDL particles
    "ldl_medium": "M",              # Medium LDL particles
    "hdl_large": "M",               # Large HDL particles
    "ldl_peak_size": "M",           # LDL peak particle size

    # ── Metabolic Panel (Quest Labs) ──────────────────────────────
    "glucose": "M",                  # Fasting glucose, 77 mg/dL
    "hba1c": "M",                    # Hemoglobin A1c, 5.1%
    "insulin": "M",                  # Fasting insulin, 2.0 uIU/mL
    "bun": "M",                      # Blood Urea Nitrogen
    "creatinine": "M",               # Kidney function
    "egfr": "M",                     # Estimated GFR
    "uric_acid": "M",               # Uric acid

    # ── Electrolytes (Quest Labs) ─────────────────────────────────
    "sodium": "M",
    "potassium": "M",
    "chloride": "M",
    "co2": "M",                      # Carbon dioxide (bicarbonate)
    "calcium": "M",
    "magnesium_rbc": "M",            # RBC magnesium (intracellular)

    # ── Liver Function (Quest Labs) ───────────────────────────────
    "total_protein": "M",
    "albumin": "M",
    "globulin": "M",
    "ag_ratio": "M",                 # Albumin/Globulin ratio
    "bilirubin_total": "M",
    "alp": "M",                      # Alkaline phosphatase
    "ast": "M",                      # Aspartate aminotransferase
    "alt": "M",                      # Alanine aminotransferase
    "ggt": "M",                      # Gamma-glutamyl transferase
    "amylase": "M",                  # Pancreatic enzyme
    "lipase": "M",                   # Pancreatic enzyme

    # ── Complete Blood Count (Quest Labs) ─────────────────────────
    "hemoglobin": "M",               # Key for iron deficiency
    "hematocrit": "M",               # Key for iron deficiency
    "rbc": "M",                      # Red blood cell count
    "wbc": "M",                      # White blood cell count
    "platelets": "M",                # Platelet count
    "mcv": "M",                      # Mean corpuscular volume
    "mch": "M",                      # Mean corpuscular hemoglobin
    "mchc": "M",                     # Mean corpuscular hemoglobin concentration
    "rdw": "M",                      # Red cell distribution width
    "mpv": "M",                      # Mean platelet volume

    # ── WBC Differential (Quest Labs) ─────────────────────────────
    "absolute_neutrophils": "M",
    "absolute_lymphocytes": "M",
    "absolute_monocytes": "M",
    "absolute_eosinophils": "M",
    "absolute_basophils": "M",
    "neutrophils_pct": "M",
    "lymphocytes_pct": "M",
    "monocytes_pct": "M",
    "eosinophils_pct": "M",
    "basophils_pct": "M",

    # ── Inflammation (Quest Labs) ─────────────────────────────────
    "hscrp": "M",                    # hs-CRP, 0.3 mg/L (excellent)
    "homocysteine": "M",             # Cardiovascular risk marker

    # ── Hormones (Quest Labs) ─────────────────────────────────────
    "testosterone": "M",             # Total testosterone, 327-444 ng/dL
    "free_testosterone": "M",        # Free testosterone
    "shbg": "M",                     # Sex Hormone Binding Globulin
    "cortisol": "M",                 # Total cortisol, 15.1 mcg/dL
    "dhea_s": "M",                   # DHEA-Sulfate
    "tsh": "M",                      # Thyroid stimulating hormone, 4.44 mIU/L
    "estradiol": "M",                # Estradiol
    "fsh": "M",                      # Follicle-stimulating hormone
    "prolactin": "M",                # Prolactin
    "psa_total": "M",               # Prostate-Specific Antigen total
    "psa_free": "M",                # PSA free
    "leptin": "M",                   # Leptin (adiposity marker)

    # ── Omega-3 & Fatty Acids (Quest Labs) ────────────────────────
    "epa": "M",                      # Eicosapentaenoic acid, 0.5%
    "dha": "M",                      # Docosahexaenoic acid, 2.2% (low)
    "dpa": "M",                      # Docosapentaenoic acid
    "omega3_index": "M",             # EPA + DHA combined index
    "aa_epa_ratio": "M",             # Arachidonic acid/EPA ratio, 24.5 (high)
    "arachidonic_acid": "M",         # Arachidonic acid
    "linoleic_acid": "M",            # Linoleic acid

    # ── Vitamins & Minerals (Quest Labs) ──────────────────────────
    "vitamin_d": "M",                # 25-OH Vitamin D, 47 ng/mL
    "b12": "M",                      # Vitamin B12
    "folate": "M",                   # Serum folate
    "methylmalonic_acid": "M",       # Functional B12 marker

    # ── Immune & Autoimmune (Quest Labs) ──────────────────────────
    "rheumatoid_factor": "M",
    "thyroglobulin_antibodies": "M",
    "thyroid_peroxidase_antibodies": "M",
    "immunoglobulin_a": "M",         # IgA

    # ── Toxicology (Quest Labs) ───────────────────────────────────
    "mercury_blood": "M",            # Blood mercury
    "lead_venous": "M",              # Venous lead

    # ── Urinalysis (Quest Labs) ───────────────────────────────────
    "albumin_urine": "M",            # Urine albumin (kidney marker)
    "urine_specific_gravity": "M",   # Hydration marker

    # ── CPET Performance Markers (Medix, single assessment) ───────
    "vo2_peak": "M",                 # 52 ml/min/kg — excellent
    "vo2_peak_l_min": "M",           # VO2peak in L/min
    "vt1_speed_kmh": "M",            # VT1 at 16.6 km/h running
    "vt1_hr_bpm": "M",              # Heart rate at VT1
    "vt1_vo2_per_kg": "M",          # VO2 at VT1
    "rer_max": "M",                  # Max respiratory exchange ratio
    "max_work_rate_w": "M",          # Max work rate in watts
    "watts_per_kg": "M",             # Power-to-weight ratio
    "max_hr_bpm": "M",              # Max heart rate from test, 175 bpm
    "max_minute_ventilation": "M",   # Max VE L/min
    "max_oxygen_pulse": "M",         # Max VO2/HR ml
    "met_maximum": "M",              # Maximum METs
    "anaerobic_threshold_hr": "M",   # HR at anaerobic threshold
    "anaerobic_threshold_pct_max": "M", # AT as % of max HR

    # ── Spirometry Markers (Medix) ────────────────────────────────
    "fvc": "M",                      # Forced Vital Capacity
    "fev1": "M",                     # Forced Expiratory Volume 1s
    "fev1_fvc_ratio": "M",          # FEV1/FVC ratio
    "pef": "M",                      # Peak Expiratory Flow
    "mef50": "M",                    # Max Expiratory Flow at 50% FVC
    "mef25_75": "M",                 # Average Max Expiratory Flow 25-75%

    # ── Body Composition Markers (Medix Seca) ─────────────────────
    "body_fat_pct": "M",             # 16.5% body fat
    "fat_mass_kg": "M",              # Fat mass in kg
    "fat_free_mass_kg": "M",         # Fat-free mass in kg
    "fat_free_mass_index": "M",      # FFMI
    "fat_mass_index": "M",           # FMI
    "skeletal_muscle_mass_kg": "M",  # Total skeletal muscle
    "visceral_adipose_tissue_l": "M", # Visceral fat in liters
    "waist_circumference_m": "M",    # Waist circumference
    "body_mass_kg": "M",             # 75.9 kg
    "bmi": "M",                      # BMI

    # ── Segmental Muscle Mass (Medix Seca) ────────────────────────
    "smm_right_arm_kg": "M",
    "smm_left_arm_kg": "M",
    "smm_torso_kg": "M",
    "smm_right_leg_kg": "M",
    "smm_left_leg_kg": "M",

    # ── Hydration Status (Medix Seca) ─────────────────────────────
    "total_body_water_l": "M",
    "total_body_water_pct": "M",
    "extracellular_water_l": "M",
    "ecw_tbw_ratio_pct": "M",       # ECW/TBW ratio

    # ── Energy Expenditure (Medix Seca) ───────────────────────────
    "total_energy_expenditure_kcal": "M",
    "resting_energy_expenditure_kcal": "M",
    "physical_activity_level": "M",

    # ══════════════════════════════════════════════════════════════
    # P: PHYSIOLOGY — safety guardrails only, NEVER causal learning
    # These are monitored for red flags but never used as causal
    # sources or targets. Used for alerts/safeguards only.
    # Source: Apple Watch (incoming) + Medix baseline
    # ══════════════════════════════════════════════════════════════

    "resting_hr": "P",               # Apple Watch resting HR (safety ceiling)
    "nightly_hrv": "P",             # Apple Watch nightly HRV (safety floor)
    "respiratory_rate": "P",         # Respiratory rate during sleep
    "body_temp": "P",               # Body temperature deviation
    "spo2": "P",                     # Blood oxygen saturation (if tracked)
    "bp_rest_systolic": "P",         # Resting blood pressure systolic
    "bp_rest_diastolic": "P",        # Resting blood pressure diastolic
    "bp_max_systolic": "P",          # Max exercise blood pressure
    "bp_max_diastolic": "P",         # Max exercise blood pressure

    # ── ECG/Cardiac Safety (Medix stress test) ────────────────────
    "max_st_depression_mv": "P",     # ST depression during exercise
    "max_st_elevation_mv": "P",      # ST elevation during exercise
    "vpb_total": "P",               # Ventricular premature beats
    "vpb_isolated": "P",            # Isolated VPBs
    "ventricular_couplets": "P",     # Ventricular couplets
    "ventricular_tachycardia": "P",  # VT episodes

    # ══════════════════════════════════════════════════════════════
    # L: LOADS — accumulated stressors derived from behavior history
    # Source: Computed from GPX data + future Apple Watch
    # These are DERIVED, not directly measured
    # ══════════════════════════════════════════════════════════════

    # ── A: Training Volume Loads (computed from GPX workouts) ─────
    "trimp": "L",                    # Training Impulse (duration × intensity_factor)
    "daily_trimp": "L",             # Daily aggregate TRIMP
    "atl": "L",                      # Acute Training Load (7-day EWMA)
    "ctl": "L",                      # Chronic Training Load (42-day EWMA)
    "acwr": "L",                     # Acute:Chronic Workload Ratio (<0.8 under, >1.5 danger)
    "weekly_volume_km": "L",         # 7-day rolling total distance
    "weekly_run_km": "L",            # 7-day rolling running distance
    "weekly_cycle_km": "L",          # 7-day rolling cycling distance
    "weekly_zone2_min": "L",         # 7-day rolling Zone 2 minutes
    "weekly_high_intensity_min": "L", # 7-day rolling threshold+high intensity minutes
    "weekly_training_hrs": "L",      # 7-day rolling training hours
    "weekly_duration_min": "L",      # 7-day rolling training duration
    "weekly_elevation_m": "L",       # 7-day rolling elevation gain
    "weekly_intensity_score": "L",   # 7-day rolling TRIMP sum
    "monthly_run_km": "L",           # 28-day rolling running distance
    "monthly_volume_km": "L",        # 28-day rolling total distance
    "monthly_training_hrs": "L",     # 28-day rolling training hours
    "monthly_trimp": "L",            # 28-day rolling TRIMP sum

    # ── B: Training Pattern Loads ─────────────────────────────────
    "monotony": "L",                 # mean/std of daily load over 7d (high = poor periodization)
    "strain": "L",                   # weekly_load × monotony (overreaching composite)
    "training_consistency": "L",     # fraction of active days in 28-day window
    "polarization_index": "L",       # zone2/(zone2+high) ratio (0.8+ = well polarized)
    "rest_day_ratio_7d": "L",        # fraction of rest days in 7d (0 = no recovery)
    "volume_change_pct": "L",        # week-over-week volume change (>30% = danger)
    "double_days_7d": "L",           # count of 2-a-day sessions in 7d

    # ── C: Mechanical Impact Loads ────────────────────────────────
    "weekly_ground_contacts": "L",   # estimated foot strikes in 7d (hemolysis driver)
    "monthly_ground_contacts": "L",  # estimated foot strikes in 28d
    "run_to_cycle_ratio": "L",       # running_km / (running_km + cycling_km) in 7d

    # ── D: Iron Depletion Loads ───────────────────────────────────
    "cumulative_run_km_since_reset": "L",  # total running since last lab draw
    "cumulative_ground_contacts_since_reset": "L",  # total impacts since last lab
    "iron_depletion_pressure_7d": "L",   # composite: hemolysis + sweat + GI loss (7d)
    "iron_depletion_pressure_28d": "L",  # composite: hemolysis + sweat + GI loss (28d)

    # ── E: Hormonal Stress Loads ──────────────────────────────────
    "overtraining_risk_score": "L",  # composite: ATL ratio + rest deficit + monotony
    "consecutive_training_days": "L", # running count of days without rest
    "monthly_high_intensity_min": "L", # 28-day high-intensity minutes

    # ── F: Recovery State Loads (Apple Watch — incoming) ──────────
    "sleep_debt_14d": "L",            # 14-day accumulated sleep deficit vs target
    "sleep_quality_trend_7d": "L",    # 7d rolling deep+REM fraction trend
    "sleep_consistency_7d": "L",      # std of sleep duration over 7d (social jet lag)
    "consecutive_poor_nights": "L",   # running count of nights <80% target sleep

    # ── G: HRV / Autonomic Loads (Apple Watch — incoming) ─────────
    "hrv_7d_mean": "L",              # 7-day rolling HRV mean
    "hrv_trend_7d": "L",             # 7d HRV slope (positive=recovering, negative=stress)
    "hrv_cv_7d": "L",                # 7d HRV coefficient of variation
    "resting_hr_trend_7d": "L",      # 7d resting HR slope (rising=stress)
    "autonomic_recovery_score": "L",  # composite: HRV trend + RHR trend (-1 to +1)

    # ── H: Activity Loads (Apple Watch — incoming) ────────────────
    "weekly_active_calories": "L",   # 7d total active energy burned
    "weekly_steps": "L",             # 7d total steps
    "steps_7d_mean": "L",            # 7d daily step average
    "exercise_streak_days": "L",     # consecutive days with exercise

    # ── I: Travel & Disruption Loads ──────────────────────────────
    "days_since_travel": "L",        # days since last Israel↔US transition
    "travel_load": "L",              # decaying jet lag score (1.0 at travel, 0 by day 7)
    "routine_disruption": "L",       # how different recent pattern is from 90d norm

    # ══════════════════════════════════════════════════════════════
    # E: ENVIRONMENT — context/confounders, adjustment only
    # Source: GPX GPS coords, calendar, weather API (future)
    # ══════════════════════════════════════════════════════════════

    "day_of_week": "E",              # Monday-Sunday
    "month": "E",                    # Calendar month
    "season": "E",                   # Spring/Summer/Fall/Winter
    "location": "E",                 # Israel vs US (from GPS coordinates)
    "altitude_m": "E",               # Workout altitude (from GPS)
    "temperature_c": "E",            # Ambient temperature (future: weather API)
    "humidity_pct": "E",             # Ambient humidity (future: weather API)
    "year": "E",                     # Calendar year (for trend analysis)
    "is_weekend": "E",               # Boolean: Saturday/Sunday
    "travel_flag": "E",              # Whether a location change occurred recently
}


# ══════════════════════════════════════════════════════════════════
# CATEGORY COUNTS (for reference)
# ══════════════════════════════════════════════════════════════════
#
# C (Choices):      14 variables  (7 GPX-derived + 7 Apple Watch incoming)
# O (Outcomes):     20 variables  (all Apple Watch incoming)
# M (Markers):     135 variables  (Quest Labs + Medix CPET/Spirometry/BodyComp)
# P (Physiology):   15 variables  (Apple Watch + Medix cardiac safety)
# L (Loads):        51 variables  (9 categories: volume, pattern, impact, iron,
#                                  hormonal, recovery, autonomic, activity, travel)
# E (Environment):  10 variables  (GPS + calendar + weather future)
#
# TOTAL:           245 variables
# ══════════════════════════════════════════════════════════════════


def get_category(variable: str) -> str:
    """Get COMPLE category for a variable."""
    return COMPLE_MAP.get(variable, "unknown")


def get_variables_by_category(category: str) -> List[str]:
    """Get all variables in a given COMPLE category."""
    return [var for var, cat in COMPLE_MAP.items() if cat == category]


def get_choices() -> List[str]:
    return get_variables_by_category("C")


def get_outcomes() -> List[str]:
    return get_variables_by_category("O")


def get_markers() -> List[str]:
    return get_variables_by_category("M")


def get_physiology() -> List[str]:
    return get_variables_by_category("P")


def get_loads() -> List[str]:
    return get_variables_by_category("L")


def get_environment() -> List[str]:
    return get_variables_by_category("E")


def validate_causal_edge(source: str, target: str) -> Tuple[bool, str]:
    """
    Validate that a causal edge respects COMPLE constraints.
    Rules:
      - Source must be C (Choice) or L (Load)
      - Target must be M (Marker) or O (Outcome)
      - P (Physiology) variables NEVER enter as source or target
      - E (Environment) variables are confounders only (adjustment sets)
    """
    src_cat = get_category(source)
    tgt_cat = get_category(target)

    if src_cat == "unknown":
        return False, f"Source variable '{source}' not found in COMPLE map"
    if tgt_cat == "unknown":
        return False, f"Target variable '{target}' not found in COMPLE map"

    if src_cat == "P" or tgt_cat == "P":
        return False, (
            f"P (physiology) variables are safety-only and cannot appear in "
            f"causal edges: {source}({src_cat}) → {target}({tgt_cat})"
        )

    if src_cat == "E" or tgt_cat == "E":
        return False, (
            f"E (environment) variables are confounders only, not causal "
            f"sources/targets: {source}({src_cat}) → {target}({tgt_cat}). "
            f"Use them in adjustment sets instead."
        )

    if src_cat not in ("C", "L"):
        return False, f"Source must be C or L, got {source}({src_cat})"

    if tgt_cat not in ("M", "O"):
        return False, f"Target must be M or O, got {target}({tgt_cat})"

    return True, "valid"


def get_adjustment_variables() -> List[str]:
    """
    Get variables that should be used for backdoor adjustment (confounders).
    These are E (Environment) variables plus selected L (Load) variables
    that are pre-treatment.
    """
    env_vars = get_environment()
    # Pre-treatment loads that should be conditioned on
    adjustment_loads = ["ctl", "training_consistency", "acwr"]
    return env_vars + [v for v in adjustment_loads if v in COMPLE_MAP]


def categorize_variables(variable_names: List[str]) -> Dict[str, List[str]]:
    """Categorize a list of variable names into COMPLE groups."""
    result = {"C": [], "O": [], "M": [], "P": [], "L": [], "E": [], "unknown": []}
    for var in variable_names:
        cat = get_category(var)
        if cat in result:
            result[cat].append(var)
        else:
            result["unknown"].append(var)
    return result


def print_summary() -> None:
    """Print a summary of the COMPLE categorization."""
    categories = {
        "C": ("Choices", "Controllable behaviors"),
        "O": ("Outcomes", "Daily observable results"),
        "M": ("Markers", "Slow biology, lab/CPET-measured"),
        "P": ("Physiology", "Safety guardrails only"),
        "L": ("Loads", "Accumulated stressors"),
        "E": ("Environment", "Context/confounders"),
    }
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║              COMPLE VARIABLE CATEGORIZATION             ║")
    print("╠══════════════════════════════════════════════════════════╣")
    total = 0
    for cat, (name, desc) in categories.items():
        variables = get_variables_by_category(cat)
        count = len(variables)
        total += count
        print(f"║  {cat} — {name:12s} ({count:3d} vars): {desc}")
    print(f"╠══════════════════════════════════════════════════════════╣")
    print(f"║  TOTAL: {total} variables mapped                          ║")
    print(f"╚══════════════════════════════════════════════════════════╝")


if __name__ == "__main__":
    print_summary()
    print()
    for cat in ["C", "O", "M", "P", "L", "E"]:
        vars_list = get_variables_by_category(cat)
        print(f"\n── {cat} ({len(vars_list)} variables) ──")
        for v in vars_list:
            print(f"  {v}")
