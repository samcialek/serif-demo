"""
Serif Inference Engine — Configuration
Paths, constants, and global settings.
"""
import os
from pathlib import Path

# ── Base paths ──────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "Oron_Akek_Data"
EXTRACTED_DIR = DATA_DIR / "extracted"
GPX_DIR = DATA_DIR / "apple_health_export" / "workout-routes"
OUTPUT_DIR = BASE_DIR / "inference_engine" / "output_data"

# ── Data files ──────────────────────────────────────────────────
LAB_RESULTS_PATH = EXTRACTED_DIR / "lab_results_structured.json"
MEDIX_DATA_PATH = EXTRACTED_DIR / "brn_scans_structured.json"
APPLE_HEALTH_XML = DATA_DIR / "export.xml"
AUTOSLEEP_CSV = DATA_DIR / "AutoSleep-20160111-to-20260207.csv"
APPLE_HEALTH_DAILY_CSV = BASE_DIR / "inference_engine" / "etl" / "oron_apple_health_daily.csv"
DAILY_TIMELINE_CSV = OUTPUT_DIR / "oron_daily_timeline.csv"

# ── Subject profile (from Medix) ───────────────────────────────
SUBJECT = {
    "id": "oron",
    "name": "Oron Afek",
    "age": 43,
    "dob": "1981-12-27",
    "height_cm": 180,
    "weight_kg": 75.9,
    "sport": "triathlon",
    "gender": "male",
}

# ── Physiological thresholds (from Medix CPET) ─────────────────
VT1_SPEED_KMH = 16.6        # First ventilatory threshold running speed
VT1_HR_BPM = 156             # Heart rate at VT1
VO2_PEAK_ML_KG = 52          # ml/min/kg — rated excellent
RESTING_HR_BPM = 47          # Resting heart rate
MAX_HR_BPM = 175             # Observed max HR

# Heart rate zones (from Medix anaerobic threshold test)
HR_ZONES = {
    "E1_recovery": (130, 144),
    "E2_endurance": (144, 154),
    "E3_threshold": (154, 161),
    "A1_aerobic": (161, 168),
    "A2_max": (168, MAX_HR_BPM),
}

# Running speed classification thresholds (km/h)
SPEED_THRESHOLDS = {
    "walking": (0, 7),
    "easy_run": (7, 12),
    "zone2_run": (12, VT1_SPEED_KMH),
    "threshold_run": (VT1_SPEED_KMH, 19),
    "fast_run": (19, 25),
    "cycling_easy": (15, 25),
    "cycling_moderate": (25, 35),
    "cycling_hard": (35, 50),
}

# ── MCMC settings ──────────────────────────────────────────────
MCMC_SAMPLES = 500
MCMC_TUNE = 500
MCMC_CHAINS = 2
MCMC_CORES = 2
THOMPSON_WORLDS = 128        # Posterior samples for visualization

# ── Evidence weighting ─────────────────────────────────────────
MIN_PERSONAL_OBS = 30        # Below this, personal weight stays low

# ── Safety bounds ──────────────────────────────────────────────
SAFETY_BOUNDS = {
    "weekly_run_km": {"min": 0, "max": 150},
    "iron_total": {"min": 10, "max": 300},
    "ferritin": {"min": 5, "max": 500},
    "testosterone": {"min": 100, "max": 1200},
    "hsCRP": {"min": 0, "max": 20},
    "hdl": {"min": 20, "max": 120},
    "triglycerides": {"min": 20, "max": 500},
    "vo2_peak": {"min": 15, "max": 85},
}

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
