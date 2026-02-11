"""
Population priors database.
Curated from exercise physiology literature for each causal relationship.

Includes BiomarkerNoise specifications encoding known measurement variability
(analytical CV + biological CV) for informative sigma priors in BCEL.
"""
from typing import Dict, Optional
from dataclasses import dataclass
import math


@dataclass
class PriorSpec:
    """Prior specification for a causal relationship."""
    # Theta (changepoint) prior
    theta_mu: float
    theta_sigma: float
    theta_unit: str

    # Beta below theta
    beta_below_mu: float
    beta_below_sigma: float

    # Beta above theta
    beta_above_mu: float
    beta_above_sigma: float

    # Units for effects
    effect_unit: str
    per_unit: str  # e.g., "per 10 km" or "per 0.1"

    # Source citation
    source: str

    # Curve type hint
    curve_type: str  # plateau_up, plateau_down, v_min, v_max, linear

    # Evidence tier: 1=meta-analysis/RCT/guideline, 2=strong observational,
    # 3=mechanistic/weak/wide prior. Defaults to 2 for backward compatibility.
    evidence_tier: int = 2


# Literature-based priors per relationship
PRIORS: Dict[str, PriorSpec] = {
    "weekly_run_km→iron_total": PriorSpec(
        theta_mu=40.0, theta_sigma=10.0, theta_unit="km/wk",
        beta_below_mu=-0.2, beta_below_sigma=0.15,   # Mild effect below threshold
        beta_above_mu=-0.8, beta_above_sigma=0.3,     # Steep decline above θ
        effect_unit="mcg/dL", per_unit="per 10 km/wk",
        source="Sim et al., Sports Med 2019",
        curve_type="plateau_down",
        evidence_tier=1,  # Systematic review
    ),

    "weekly_run_km→ferritin": PriorSpec(
        theta_mu=35.0, theta_sigma=7.0, theta_unit="km/wk",
        beta_below_mu=-0.5, beta_below_sigma=0.3,
        beta_above_mu=-1.5, beta_above_sigma=0.6,
        effect_unit="ng/mL", per_unit="per 10 km/wk",
        source="Peeling et al., IJSNEM 2008; male-specific: no menstrual loss variance",
        curve_type="plateau_down",
        evidence_tier=2,
    ),

    "weekly_training_hrs→testosterone": PriorSpec(
        theta_mu=12.0, theta_sigma=3.0, theta_unit="hr/wk",
        beta_below_mu=2.0, beta_below_sigma=3.0,      # Slight increase with moderate training
        beta_above_mu=-15.0, beta_above_sigma=3.5,     # Suppression with overtraining; male-tightened from 5.0
        effect_unit="ng/dL", per_unit="per hr/wk",
        source="Hackney et al., BJSM 2003; EHMC male convergence narrows variance",
        curve_type="plateau_down",
        evidence_tier=2,  # Well-cited review
    ),

    "weekly_zone2_min→triglycerides": PriorSpec(
        theta_mu=150.0, theta_sigma=30.0, theta_unit="min/wk",
        beta_below_mu=-5.0, beta_below_sigma=1.5,     # TG drops with zone 2; male-tightened from 2.0
        beta_above_mu=-1.0, beta_above_sigma=1.0,     # Diminishing returns
        effect_unit="mg/dL", per_unit="per 30 min/wk",
        source="AHA Physical Activity Guidelines; male TG response less variable",
        curve_type="plateau_up",  # Benefit plateaus
        evidence_tier=1,  # Major guideline
    ),

    "weekly_zone2_min→hdl": PriorSpec(
        theta_mu=150.0, theta_sigma=20.0, theta_unit="min/wk",  # male-tightened from 30.0
        beta_below_mu=1.0, beta_below_sigma=0.35,     # HDL rises with zone 2; male-tightened from 0.5
        beta_above_mu=0.2, beta_above_sigma=0.3,      # Diminishing returns
        effect_unit="mg/dL", per_unit="per 30 min/wk",
        source="AHA Guidelines; Kodama et al. 2007 n=83,681 male-stratified 2x HDL effect",
        curve_type="plateau_up",
        evidence_tier=1,  # Major guideline + large meta-analysis
    ),

    "acwr→hscrp": PriorSpec(
        theta_mu=1.3, theta_sigma=0.2, theta_unit="ratio",
        beta_below_mu=-0.02, beta_below_sigma=0.02,   # Low ACWR keeps CRP low
        beta_above_mu=0.1, beta_above_sigma=0.05,     # High ACWR spikes CRP
        effect_unit="mg/L", per_unit="per 0.1 ACWR",
        source="Hulin et al., BJSM 2016",
        curve_type="plateau_down",
        evidence_tier=1,  # Landmark systematic review
    ),

    "training_consistency→vo2_peak": PriorSpec(
        theta_mu=0.6, theta_sigma=0.15, theta_unit="fraction",
        beta_below_mu=5.0, beta_below_sigma=3.0,      # Big gains building consistency
        beta_above_mu=1.0, beta_above_sigma=1.0,      # Diminishing returns at high consistency
        effect_unit="ml/min/kg", per_unit="per 0.1 consistency",
        source="General exercise physiology",
        curve_type="plateau_up",
        evidence_tier=3,  # General physiology, no specific study
    ),

    "ferritin→vo2_peak": PriorSpec(
        theta_mu=30.0, theta_sigma=10.0, theta_unit="ng/mL",
        beta_below_mu=0.5, beta_below_sigma=0.3,      # Low ferritin limits VO2
        beta_above_mu=0.1, beta_above_sigma=0.1,      # Above threshold, minimal effect
        effect_unit="ml/min/kg", per_unit="per 10 ng/mL",
        source="DellaValle & Haas, MSSE 2014",
        curve_type="plateau_up",
        evidence_tier=2,  # RCT in female athletes
    ),

    # ── Tier 3: Apple Health + AutoSleep edges ─────────────────────

    "workout_end_hour→sleep_efficiency": PriorSpec(
        theta_mu=20.5, theta_sigma=1.5, theta_unit="hour",
        beta_below_mu=0.05, beta_below_sigma=0.15,     # Stable before cutoff
        beta_above_mu=-2.0, beta_above_sigma=1.5,      # Efficiency drops with late workouts
        effect_unit="%", per_unit="per hr later",
        source="Stutz et al., Sports Med 2019; Frimpong et al., Sleep Med Rev 2021",
        curve_type="plateau_down",
        evidence_tier=1,  # Two systematic reviews
    ),

    "bedtime_hour→sleep_quality": PriorSpec(
        theta_mu=22.5, theta_sigma=1.0, theta_unit="hour",
        beta_below_mu=0.1, beta_below_sigma=0.2,       # Mild benefit of earlier bedtime
        beta_above_mu=-2.5, beta_above_sigma=1.0,      # Quality drops after threshold
        effect_unit="min quality", per_unit="per hr later",
        source="Faust et al., npj Digital Medicine 2020; circadian DLMO literature",
        curve_type="plateau_down",
        evidence_tier=2,  # Digital medicine study
    ),

    "sleep_duration→next_day_hrv": PriorSpec(
        theta_mu=7.0, theta_sigma=0.8, theta_unit="hours",
        beta_below_mu=5.0, beta_below_sigma=2.0,       # HRV improves with more sleep up to threshold
        beta_above_mu=0.5, beta_above_sigma=0.2,       # Diminishing returns past 7h; tight prior prevents
                                                        # confounded U-shape (long sleep ↔ illness/overtraining
                                                        # reverse-causes low HRV in observational data).
                                                        # Sigma 0.5→0.2: requires ~6:1 Bayes factor to flip sign.
        effect_unit="ms", per_unit="per hr",
        source="Zhang et al., Front Neurol 2025 (meta-analysis); Lastella et al. 2015",
        curve_type="plateau_up",
        evidence_tier=1,  # Meta-analysis
    ),

    "daily_trimp→next_day_hrv": PriorSpec(
        theta_mu=175.0, theta_sigma=35.0, theta_unit="TRIMP",  # male-tightened: mu 150→175, sigma 50→35 (trained athlete resilience)
        beta_below_mu=-0.02, beta_below_sigma=0.01,    # Mild HRV suppression
        beta_above_mu=-0.06, beta_above_sigma=0.03,    # Steeper suppression above threshold
        effect_unit="ms", per_unit="per 50 TRIMP",
        source="Stanley et al., Sports Med 2013; Buchheit 2014; trained male CV narrowing",
        curve_type="plateau_down",
        evidence_tier=1,  # Two landmark reviews
    ),

    "daily_trimp→resting_hr": PriorSpec(
        theta_mu=150.0, theta_sigma=50.0, theta_unit="TRIMP",
        beta_below_mu=0.005, beta_below_sigma=0.003,   # Minimal HR increase
        beta_above_mu=0.015, beta_above_sigma=0.006,   # Noticeable HR elevation
        effect_unit="bpm", per_unit="per 50 TRIMP",
        source="Stanley et al., Sports Med 2013; Buchheit, Front Physiol 2014",
        curve_type="plateau_down",
        evidence_tier=1,  # Two landmark reviews
    ),

    "acwr→resting_hr": PriorSpec(
        theta_mu=1.3, theta_sigma=0.2, theta_unit="ratio",
        beta_below_mu=0.1, beta_below_sigma=0.2,       # Minimal RHR change in safe zone
        beta_above_mu=2.5, beta_above_sigma=1.0,       # Steep escalation above threshold
        effect_unit="bpm", per_unit="per 0.1 ACWR",
        source="Hulin et al., BJSM 2016; Gabbett, BJSM 2016",
        curve_type="plateau_down",
        evidence_tier=1,  # Landmark systematic reviews
    ),

    "daily_steps→sleep_efficiency": PriorSpec(
        theta_mu=10000.0, theta_sigma=3000.0, theta_unit="steps",
        beta_below_mu=0.25, beta_below_sigma=0.15,     # More steps -> better sleep
        beta_above_mu=-0.05, beta_above_sigma=0.15,    # Plateau more than decline
        effect_unit="%", per_unit="per 2000 steps",
        source="Kredlow et al., J Behav Med 2015; PMC7735606",
        curve_type="v_max",
        evidence_tier=1,  # Meta-analysis
    ),

    "active_energy→deep_sleep": PriorSpec(
        theta_mu=500.0, theta_sigma=150.0, theta_unit="kcal",
        beta_below_mu=1.5, beta_below_sigma=0.8,       # More activity -> more deep sleep
        beta_above_mu=-0.3, beta_above_sigma=0.4,      # Plateau more than decline
        effect_unit="min", per_unit="per 100 kcal",
        source="Kline, Am J Lifestyle Med 2014; Stutz et al., Sports Med 2019",
        curve_type="v_max",
        evidence_tier=1,  # Systematic review + review
    ),

    # ── Exercise → Sleep priors ───────────────────────────────
    "daily_duration_min→sleep_efficiency": PriorSpec(
        theta_mu=60.0, theta_sigma=20.0, theta_unit="min/day",
        beta_below_mu=0.3, beta_below_sigma=0.15,      # Moderate exercise improves sleep
        beta_above_mu=-0.1, beta_above_sigma=0.15,      # Diminishing returns / slight impairment
        effect_unit="%", per_unit="per 30 min/day",
        source="Kredlow et al., J Behav Med 2015; Stutz et al., Sports Med 2019",
        curve_type="plateau_up",
        evidence_tier=1,  # Meta-analysis
    ),
    "daily_duration_min→deep_sleep": PriorSpec(
        theta_mu=60.0, theta_sigma=20.0, theta_unit="min/day",
        beta_below_mu=1.0, beta_below_sigma=0.5,       # Exercise increases SWS via adenosine
        beta_above_mu=-0.2, beta_above_sigma=0.3,      # Plateau at high volumes
        effect_unit="min", per_unit="per 30 min/day",
        source="Kline, Am J Lifestyle Med 2014; Driver & Taylor, Sleep Med Rev 2000",
        curve_type="plateau_up",
        evidence_tier=1,  # Systematic review
    ),
    "daily_trimp→sleep_efficiency": PriorSpec(
        theta_mu=100.0, theta_sigma=30.0, theta_unit="TRIMP",
        beta_below_mu=0.15, beta_below_sigma=0.1,      # Moderate load helps sleep
        beta_above_mu=-0.3, beta_above_sigma=0.15,     # High load impairs sleep (sympathetic activation)
        effect_unit="%", per_unit="per 50 TRIMP",
        source="Killer et al., Eur J Appl Physiol 2017; Myllymäki et al., JSAMS 2011",
        curve_type="v_max",
        evidence_tier=2,  # Observational studies
    ),
    "daily_trimp→deep_sleep": PriorSpec(
        theta_mu=100.0, theta_sigma=30.0, theta_unit="TRIMP",
        beta_below_mu=1.5, beta_below_sigma=0.8,       # Hard exercise drives deep sleep need
        beta_above_mu=-0.5, beta_above_sigma=0.5,      # Overtraining suppresses SWS
        effect_unit="min", per_unit="per 50 TRIMP",
        source="Killer et al., Eur J Appl Physiol 2017; Vitale et al., IJSPP 2019",
        curve_type="v_max",
        evidence_tier=2,  # Observational
    ),
    "daily_run_km→sleep_efficiency": PriorSpec(
        theta_mu=8.0, theta_sigma=3.0, theta_unit="km/day",
        beta_below_mu=0.2, beta_below_sigma=0.12,      # Aerobic exercise improves sleep
        beta_above_mu=-0.15, beta_above_sigma=0.12,    # Excessive volume may impair
        effect_unit="%", per_unit="per 2 km/day",
        source="Kredlow et al., J Behav Med 2015; Youngstedt, Med Sci Sports Exerc 2005",
        curve_type="plateau_up",
        evidence_tier=1,  # Meta-analysis
    ),
    "daily_zone2_min→deep_sleep": PriorSpec(
        theta_mu=45.0, theta_sigma=15.0, theta_unit="min/day",
        beta_below_mu=1.2, beta_below_sigma=0.6,       # Zone 2 specifically drives SWS
        beta_above_mu=-0.1, beta_above_sigma=0.3,      # Plateau at high volumes
        effect_unit="min", per_unit="per 15 min/day",
        source="Myllymäki et al., JSAMS 2011; Stutz et al., Sports Med 2019",
        curve_type="plateau_up",
        evidence_tier=2,  # Review + observational
    ),

    "weekly_km→hrv_baseline": PriorSpec(
        theta_mu=50.0, theta_sigma=15.0, theta_unit="km/week",  # male-tightened from 20.0
        beta_below_mu=0.25, beta_below_sigma=0.15,     # Moderate volume improves vagal tone
        beta_above_mu=-0.3, beta_above_sigma=0.25,     # Overtraining suppresses HRV
        effect_unit="ms", per_unit="per 10 km/wk",
        source="Plews et al., Sports Med 2013; Buchheit 2014; trained male CV narrowing",
        curve_type="v_max",
        evidence_tier=1,  # Two landmark reviews
    ),

    "sleep_debt→resting_hr": PriorSpec(
        theta_mu=5.0, theta_sigma=3.0, theta_unit="hours deficit",
        beta_below_mu=0.2, beta_below_sigma=0.15,      # Mild HR increase
        beta_above_mu=1.0, beta_above_sigma=0.4,       # Steep HR increase with large debt
        effect_unit="bpm", per_unit="per hr deficit",
        source="Spiegel et al., Lancet 1999; PMC10543608 sleep restriction study",
        curve_type="plateau_down",
        evidence_tier=1,  # Landmark RCT in Lancet
    ),

    # ── Travel / Jet Lag edges ────────────────────────────────────
    # Israel↔US = ~7 hour time zone shift

    "travel_load→sleep_efficiency": PriorSpec(
        theta_mu=0.5, theta_sigma=0.15, theta_unit="jet lag score",
        beta_below_mu=-1.5, beta_below_sigma=0.8,      # Residual architecture disruption
        beta_above_mu=-8.0, beta_above_sigma=3.0,      # Acute phase very disruptive
        effect_unit="%", per_unit="per 0.2 load",
        source="Dunican et al. 2023; Fowler et al. MSSE 2017; Oura/NUS SLEEP 2025",
        curve_type="plateau_down",
        evidence_tier=2,  # Multiple observational studies
    ),

    "travel_load→hrv_daily": PriorSpec(
        theta_mu=0.45, theta_sigma=0.20, theta_unit="jet lag score",
        beta_below_mu=-1.5, beta_below_sigma=1.0,      # Mild residual HRV suppression
        beta_above_mu=-4.0, beta_above_sigma=2.5,      # Acute circadian disruption
        effect_unit="ms RMSSD", per_unit="per 0.2 load",
        source="Morris et al. PNAS 2016; Grimaldi et al. Hypertension 2016",
        curve_type="plateau_down",
        evidence_tier=2,  # Strong experimental (PNAS)
    ),

    "travel_load→resting_hr": PriorSpec(
        theta_mu=0.45, theta_sigma=0.20, theta_unit="jet lag score",
        beta_below_mu=0.3, beta_below_sigma=0.2,       # Modest residual sympathetic elevation
        beta_above_mu=1.5, beta_above_sigma=0.8,       # Acute HR elevation post-travel
        effect_unit="bpm", per_unit="per 0.2 load",
        source="Morris et al. PNAS 2016; Grimaldi et al. Hypertension 2016",
        curve_type="plateau_down",
        evidence_tier=2,  # Strong experimental (PNAS)
    ),

    # ── Body composition edges (slow timescale) ──────────────────

    "weekly_training_hrs→body_fat_pct": PriorSpec(
        theta_mu=8.0, theta_sigma=3.0, theta_unit="hrs/week",
        beta_below_mu=-0.05, beta_below_sigma=0.05,    # Below habitual: minimal effect
        beta_above_mu=-0.15, beta_above_sigma=0.10,    # Above threshold: modest fat reduction
        effect_unit="% body fat", per_unit="per hr/wk",
        source="Donnelly et al. ACSM 2009; JAMA Network Open meta-analysis 2024",
        curve_type="plateau_down",
        evidence_tier=1,  # ACSM position stand + meta-analysis
    ),

    "daily_activity→body_mass": PriorSpec(
        theta_mu=10000.0, theta_sigma=3000.0, theta_unit="steps",
        beta_below_mu=-0.001, beta_below_sigma=0.001,
        beta_above_mu=-0.005, beta_above_sigma=0.003,
        effect_unit="kg", per_unit="per 2000 steps",
        source="Richardson et al. Ann Intern Med 2008; Dwyer et al. BMJ 2011",
        curve_type="plateau_down",
        evidence_tier=2,  # RCTs in major journals
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: EXERCISE → CBC / HEMATOLOGY
    # ══════════════════════════════════════════════════════════

    "weekly_run_km→rbc": PriorSpec(
        theta_mu=40.0, theta_sigma=12.0, theta_unit="km/wk",
        beta_below_mu=-0.005, beta_below_sigma=0.005,
        beta_above_mu=-0.02, beta_above_sigma=0.01,
        effect_unit="M/uL", per_unit="per 10 km/wk",
        source="Mairbäurl, Front Physiol 2013; plasma expansion dilution",
        curve_type="plateau_down",
        evidence_tier=2,  # Well-cited review
    ),
    "weekly_run_km→mcv": PriorSpec(
        theta_mu=40.0, theta_sigma=12.0, theta_unit="km/wk",
        beta_below_mu=0.05, beta_below_sigma=0.1,
        beta_above_mu=-0.3, beta_above_sigma=0.2,
        effect_unit="fL", per_unit="per 10 km/wk",
        source="Iron deficiency → microcytosis; Peeling et al. IJSNEM 2008",
        curve_type="plateau_down",
        evidence_tier=2,
    ),
    "weekly_run_km→rdw": PriorSpec(
        theta_mu=40.0, theta_sigma=12.0, theta_unit="km/wk",
        beta_below_mu=0.02, beta_below_sigma=0.05,
        beta_above_mu=0.1, beta_above_sigma=0.08,
        effect_unit="%", per_unit="per 10 km/wk",
        source="Anisocytosis from mixed iron-depleted/normal cell populations",
        curve_type="plateau_down",
        evidence_tier=3,  # Mechanistic reasoning
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: TRAINING → LIVER / MUSCLE ENZYMES
    # ══════════════════════════════════════════════════════════

    "weekly_training_hrs→ast": PriorSpec(
        theta_mu=12.0, theta_sigma=4.0, theta_unit="hr/wk",
        beta_below_mu=0.5, beta_below_sigma=0.5,
        beta_above_mu=2.0, beta_above_sigma=1.5,
        effect_unit="U/L", per_unit="per hr/wk",
        source="Banfi et al. Clin Chem Lab Med 2012; exercise AST elevation",
        curve_type="plateau_down",
        evidence_tier=2,
    ),
    "weekly_training_hrs→alt": PriorSpec(
        theta_mu=12.0, theta_sigma=4.0, theta_unit="hr/wk",
        beta_below_mu=0.2, beta_below_sigma=0.3,
        beta_above_mu=1.0, beta_above_sigma=0.8,
        effect_unit="U/L", per_unit="per hr/wk",
        source="Banfi et al. Clin Chem Lab Med 2012; ALT less affected than AST",
        curve_type="plateau_down",
        evidence_tier=2,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: ZONE 2 → ADVANCED LIPIDS
    # ══════════════════════════════════════════════════════════

    "weekly_zone2_min→apob": PriorSpec(
        theta_mu=150.0, theta_sigma=30.0, theta_unit="min/wk",
        beta_below_mu=-0.5, beta_below_sigma=0.3,
        beta_above_mu=-0.15, beta_above_sigma=0.15,
        effect_unit="mg/dL", per_unit="per 30 min/wk",
        source="Kelley & Kelley, Atherosclerosis 2006; exercise reduces ApoB",
        curve_type="plateau_down",
        evidence_tier=1,  # Meta-analysis
    ),
    "weekly_zone2_min→non_hdl_cholesterol": PriorSpec(
        theta_mu=150.0, theta_sigma=30.0, theta_unit="min/wk",
        beta_below_mu=-1.5, beta_below_sigma=1.0,
        beta_above_mu=-0.5, beta_above_sigma=0.5,
        effect_unit="mg/dL", per_unit="per 30 min/wk",
        source="ACSM position stand; composite atherogenic particle reduction",
        curve_type="plateau_down",
        evidence_tier=1,  # ACSM position stand
    ),
    "weekly_zone2_min→total_cholesterol": PriorSpec(
        theta_mu=150.0, theta_sigma=30.0, theta_unit="min/wk",
        beta_below_mu=-1.0, beta_below_sigma=0.8,
        beta_above_mu=-0.3, beta_above_sigma=0.4,
        effect_unit="mg/dL", per_unit="per 30 min/wk",
        source="AHA guidelines; net HDL↑ + LDL↓ effect",
        curve_type="plateau_down",
        evidence_tier=1,  # AHA guideline
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: TRAINING → METABOLIC
    # ══════════════════════════════════════════════════════════

    "weekly_training_hrs→glucose": PriorSpec(
        theta_mu=10.0, theta_sigma=3.0, theta_unit="hr/wk",
        beta_below_mu=-1.0, beta_below_sigma=0.5,
        beta_above_mu=-0.3, beta_above_sigma=0.3,
        effect_unit="mg/dL", per_unit="per hr/wk",
        source="Colberg et al. Diabetes Care 2016; GLUT4 upregulation",
        curve_type="plateau_down",
        evidence_tier=1,  # ADA position statement
    ),
    "weekly_training_hrs→hba1c": PriorSpec(
        theta_mu=10.0, theta_sigma=3.0, theta_unit="hr/wk",
        beta_below_mu=-0.02, beta_below_sigma=0.01,
        beta_above_mu=-0.005, beta_above_sigma=0.005,
        effect_unit="%", per_unit="per hr/wk",
        source="Boulé et al. JAMA 2001 meta-analysis; long-term glycemic effect",
        curve_type="plateau_down",
        evidence_tier=1,  # JAMA meta-analysis
    ),
    "weekly_training_hrs→insulin": PriorSpec(
        theta_mu=10.0, theta_sigma=3.0, theta_unit="hr/wk",
        beta_below_mu=-0.5, beta_below_sigma=0.3,
        beta_above_mu=-0.15, beta_above_sigma=0.15,
        effect_unit="uIU/mL", per_unit="per hr/wk",
        source="Boulé et al. JAMA 2001; improved insulin sensitivity",
        curve_type="plateau_down",
        evidence_tier=1,  # JAMA meta-analysis
    ),
    "weekly_training_hrs→uric_acid": PriorSpec(
        theta_mu=12.0, theta_sigma=4.0, theta_unit="hr/wk",
        beta_below_mu=-0.1, beta_below_sigma=0.1,
        beta_above_mu=-0.2, beta_above_sigma=0.15,
        effect_unit="mg/dL", per_unit="per hr/wk",
        source="Zhu et al. PLoS One 2011; exercise and purine metabolism",
        curve_type="v_max",
        evidence_tier=2,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: ACWR → IMMUNE
    # ══════════════════════════════════════════════════════════

    "acwr→wbc": PriorSpec(
        theta_mu=1.3, theta_sigma=0.2, theta_unit="ratio",
        beta_below_mu=0.02, beta_below_sigma=0.02,
        beta_above_mu=-0.05, beta_above_sigma=0.03,
        effect_unit="K/uL", per_unit="per 0.1 ACWR",
        source="Gleeson, J Appl Physiol 2007; open window immunosuppression",
        curve_type="v_min",
        evidence_tier=2,  # Landmark review
    ),
    "acwr→nlr": PriorSpec(
        theta_mu=1.3, theta_sigma=0.2, theta_unit="ratio",
        beta_below_mu=-0.02, beta_below_sigma=0.03,
        beta_above_mu=0.1, beta_above_sigma=0.05,
        effect_unit="ratio", per_unit="per 0.1 ACWR",
        source="Simpson et al. Exerc Immunol Rev 2020; stress neutrophilia",
        curve_type="v_min",
        evidence_tier=2,  # Major review
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: EXERCISE → MICRONUTRIENTS
    # ══════════════════════════════════════════════════════════

    "weekly_run_km→zinc": PriorSpec(
        theta_mu=40.0, theta_sigma=15.0, theta_unit="km/wk",
        beta_below_mu=-0.3, beta_below_sigma=0.3,
        beta_above_mu=-1.5, beta_above_sigma=1.0,
        effect_unit="mcg/dL", per_unit="per 10 km/wk",
        source="DeRuisseau et al. Sports Med 2006; sweat zinc loss",
        curve_type="plateau_down",
        evidence_tier=2,  # Review
    ),
    "weekly_run_km→magnesium": PriorSpec(
        theta_mu=40.0, theta_sigma=15.0, theta_unit="km/wk",
        beta_below_mu=-0.01, beta_below_sigma=0.01,
        beta_above_mu=-0.05, beta_above_sigma=0.03,
        effect_unit="mg/dL", per_unit="per 10 km/wk",
        source="Nielsen & Lukaski, J Sports Med 2006; exercise Mg depletion",
        curve_type="plateau_down",
        evidence_tier=2,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER A: TRAINING → ADDITIONAL HORMONES
    # ══════════════════════════════════════════════════════════

    "weekly_training_hrs→dhea_s": PriorSpec(
        theta_mu=12.0, theta_sigma=4.0, theta_unit="hr/wk",
        beta_below_mu=3.0, beta_below_sigma=2.0,
        beta_above_mu=-5.0, beta_above_sigma=3.0,
        effect_unit="mcg/dL", per_unit="per hr/wk",
        source="Copeland et al. Eur J Appl Physiol 2002; exercise DHEA response",
        curve_type="v_max",
        evidence_tier=2,
    ),
    "weekly_training_hrs→shbg": PriorSpec(
        theta_mu=12.0, theta_sigma=3.0, theta_unit="hr/wk",
        beta_below_mu=1.0, beta_below_sigma=0.8,
        beta_above_mu=1.5, beta_above_sigma=1.0,
        effect_unit="nmol/L", per_unit="per hr/wk",
        source="Sato et al. J Steroid Biochem 2014; exercise increases SHBG",
        curve_type="plateau_up",
        evidence_tier=2,
    ),

    # ══════════════════════════════════════════════════════════
    # TIER B: MODERATE RATIONALE — WIDER PRIORS
    # ══════════════════════════════════════════════════════════

    "weekly_training_hrs→homocysteine": PriorSpec(
        theta_mu=10.0, theta_sigma=4.0, theta_unit="hr/wk",
        beta_below_mu=-0.15, beta_below_sigma=0.15,
        beta_above_mu=-0.3, beta_above_sigma=0.3,
        effect_unit="umol/L", per_unit="per hr/wk",
        source="Randeva et al. Thromb Haemost 2002; wide prior, limited evidence",
        curve_type="linear",
        evidence_tier=3,  # Limited evidence
    ),
    "weekly_training_hrs→creatinine": PriorSpec(
        theta_mu=12.0, theta_sigma=5.0, theta_unit="hr/wk",
        beta_below_mu=0.005, beta_below_sigma=0.005,
        beta_above_mu=0.01, beta_above_sigma=0.01,
        effect_unit="mg/dL", per_unit="per hr/wk",
        source="General physiology; creatine turnover increases with muscle mass and use",
        curve_type="linear",
        evidence_tier=3,  # General physiology
    ),
    "weekly_training_hrs→estradiol": PriorSpec(
        theta_mu=12.0, theta_sigma=5.0, theta_unit="hr/wk",
        beta_below_mu=0.5, beta_below_sigma=1.0,
        beta_above_mu=-1.0, beta_above_sigma=1.0,
        effect_unit="pg/mL", per_unit="per hr/wk",
        source="Hackney, Exerc Sport Sci Rev 1996; very wide prior — limited male data",
        curve_type="linear",
        evidence_tier=3,  # Very wide prior, limited male data
    ),
    "weekly_training_hrs→platelets": PriorSpec(
        theta_mu=12.0, theta_sigma=5.0, theta_unit="hr/wk",
        beta_below_mu=2.0, beta_below_sigma=3.0,
        beta_above_mu=5.0, beta_above_sigma=5.0,
        effect_unit="K/uL", per_unit="per hr/wk",
        source="El-Sayed et al. Thromb Res 2004; exercise thrombocytosis — wide prior",
        curve_type="v_max",
        evidence_tier=3,  # Wide prior
    ),
    "weekly_training_hrs→albumin": PriorSpec(
        theta_mu=12.0, theta_sigma=5.0, theta_unit="hr/wk",
        beta_below_mu=0.01, beta_below_sigma=0.01,
        beta_above_mu=0.02, beta_above_sigma=0.02,
        effect_unit="g/dL", per_unit="per hr/wk",
        source="General physiology; plasma volume shifts — very wide prior",
        curve_type="linear",
        evidence_tier=3,  # Very wide prior
    ),

    # ── Sleep → Markers ──────────────────────────────────────

    "sleep_duration→cortisol": PriorSpec(
        theta_mu=7.0, theta_sigma=1.0, theta_unit="hours",
        beta_below_mu=-1.0, beta_below_sigma=0.5,
        beta_above_mu=-0.2, beta_above_sigma=0.2,
        effect_unit="mcg/dL", per_unit="per hr",
        source="Spiegel et al. Lancet 1999; sleep restriction → cortisol",
        curve_type="plateau_down",
        evidence_tier=1,  # Landmark RCT in Lancet
    ),
    "sleep_duration→testosterone": PriorSpec(
        theta_mu=7.0, theta_sigma=1.0, theta_unit="hours",
        beta_below_mu=15.0, beta_below_sigma=6.0,     # male-tightened from 8.0; JAMA 2011 + 2022 review
        beta_above_mu=3.0, beta_above_sigma=3.0,
        effect_unit="ng/dL", per_unit="per hr",
        source="Leproult & Van Cauter, JAMA 2011; Liu et al. 2022 review; male-specific",
        curve_type="plateau_up",
        evidence_tier=1,  # JAMA RCT + systematic review
    ),
    "sleep_duration→glucose": PriorSpec(
        theta_mu=7.0, theta_sigma=1.0, theta_unit="hours",
        beta_below_mu=-2.0, beta_below_sigma=1.5,
        beta_above_mu=-0.3, beta_above_sigma=0.3,
        effect_unit="mg/dL", per_unit="per hr",
        source="Spiegel et al. Lancet 1999; sleep restriction → insulin resistance",
        curve_type="plateau_down",
        evidence_tier=1,  # Landmark RCT in Lancet
    ),
    "sleep_duration→wbc": PriorSpec(
        theta_mu=7.0, theta_sigma=1.0, theta_unit="hours",
        beta_below_mu=0.03, beta_below_sigma=0.03,
        beta_above_mu=0.05, beta_above_sigma=0.05,
        effect_unit="K/uL", per_unit="per hr",
        source="General immunology; sleep supports immune function — wide prior",
        curve_type="plateau_up",
        evidence_tier=3,  # Wide prior, general immunology
    ),

    # ══════════════════════════════════════════════════════════
    # TIER C: CROSS-LINKS — MARKER → MARKER
    # ══════════════════════════════════════════════════════════

    "iron_saturation→hemoglobin": PriorSpec(
        theta_mu=20.0, theta_sigma=8.0, theta_unit="%",
        beta_below_mu=0.05, beta_below_sigma=0.03,
        beta_above_mu=0.01, beta_above_sigma=0.01,
        effect_unit="g/dL", per_unit="per 5%",
        source="Iron physiology: saturation determines iron delivery to marrow",
        curve_type="plateau_up",
        evidence_tier=2,  # Established biochemistry
    ),
    "vitamin_d→testosterone": PriorSpec(
        theta_mu=30.0, theta_sigma=10.0, theta_unit="ng/mL",
        beta_below_mu=5.0, beta_below_sigma=4.0,
        beta_above_mu=1.0, beta_above_sigma=2.0,
        effect_unit="ng/dL", per_unit="per 10 ng/mL",
        source="Pilz et al. Horm Metab Res 2011; VitD → Leydig cell function",
        curve_type="plateau_up",
        evidence_tier=2,  # RCT
    ),
    "omega3_index→hscrp": PriorSpec(
        theta_mu=4.0, theta_sigma=1.5, theta_unit="%",
        beta_below_mu=-0.03, beta_below_sigma=0.02,
        beta_above_mu=-0.01, beta_above_sigma=0.01,
        effect_unit="mg/L", per_unit="per 1%",
        source="Calder, Br J Clin Pharmacol 2013; EPA/DHA anti-inflammatory",
        curve_type="plateau_down",
        evidence_tier=1,  # Major review, strong evidence base
    ),
    "ferritin→rbc": PriorSpec(
        theta_mu=30.0, theta_sigma=10.0, theta_unit="ng/mL",
        beta_below_mu=0.02, beta_below_sigma=0.015,
        beta_above_mu=0.005, beta_above_sigma=0.005,
        effect_unit="M/uL", per_unit="per 10 ng/mL",
        source="Iron physiology: stores support erythropoiesis",
        curve_type="plateau_up",
        evidence_tier=2,  # Established biochemistry
    ),
    "ferritin→hemoglobin": PriorSpec(
        theta_mu=30.0, theta_sigma=10.0, theta_unit="ng/mL",
        beta_below_mu=0.1, beta_below_sigma=0.06,
        beta_above_mu=0.02, beta_above_sigma=0.02,
        effect_unit="g/dL", per_unit="per 10 ng/mL",
        source="DellaValle & Haas MSSE 2014; iron stores → Hb synthesis",
        curve_type="plateau_up",
        evidence_tier=2,  # RCT
    ),
    "b12→homocysteine": PriorSpec(
        theta_mu=400.0, theta_sigma=150.0, theta_unit="pg/mL",
        beta_below_mu=-0.5, beta_below_sigma=0.4,
        beta_above_mu=-0.1, beta_above_sigma=0.1,
        effect_unit="umol/L", per_unit="per 100 pg/mL",
        source="Selhub, Annu Rev Nutr 1999; B12 cofactor for methionine synthase",
        curve_type="plateau_down",
        evidence_tier=1,  # Landmark review, well-established biochemistry
    ),
    "homocysteine→hscrp": PriorSpec(
        theta_mu=10.0, theta_sigma=4.0, theta_unit="umol/L",
        beta_below_mu=0.005, beta_below_sigma=0.01,
        beta_above_mu=0.02, beta_above_sigma=0.02,
        effect_unit="mg/L", per_unit="per umol/L",
        source="Ganguly & Alam, Nutr J 2015; vascular inflammation — wide prior",
        curve_type="linear",
        evidence_tier=3,  # Wide prior, observational
    ),

    # ══════════════════════════════════════════════════════════
    # TIER D: DIETARY EDGES
    # ══════════════════════════════════════════════════════════

    "dietary_protein→body_fat": PriorSpec(
        theta_mu=120.0, theta_sigma=30.0, theta_unit="g/day",
        beta_below_mu=-0.01, beta_below_sigma=0.01,
        beta_above_mu=-0.005, beta_above_sigma=0.005,
        effect_unit="% body fat", per_unit="per 10 g/day",
        source="Wycherley et al. Am J Clin Nutr 2012; thermic effect — wide prior",
        curve_type="plateau_down",
        evidence_tier=1,  # Meta-analysis in AJCN
    ),
    "dietary_energy→body_mass": PriorSpec(
        theta_mu=2500.0, theta_sigma=500.0, theta_unit="kcal/day",
        beta_below_mu=-0.001, beta_below_sigma=0.001,
        beta_above_mu=0.002, beta_above_sigma=0.002,
        effect_unit="kg", per_unit="per 100 kcal/day",
        source="Hall et al. Lancet 2011; energy balance model — very wide prior",
        curve_type="linear",
        evidence_tier=1,  # Lancet modeling study
    ),

    # ══════════════════════════════════════════════════════════
    # TIER F: TRAVEL → ADDITIONAL OUTCOMES
    # ══════════════════════════════════════════════════════════

    "travel_load→nlr": PriorSpec(
        theta_mu=0.5, theta_sigma=0.2, theta_unit="jet lag score",
        beta_below_mu=0.05, beta_below_sigma=0.05,
        beta_above_mu=0.15, beta_above_sigma=0.1,
        effect_unit="ratio", per_unit="per 0.2 load",
        source="Morris et al. PNAS 2016; circadian disruption immune shift",
        curve_type="v_min",
        evidence_tier=2,  # PNAS experimental
    ),
    "travel_load→deep_sleep": PriorSpec(
        theta_mu=0.5, theta_sigma=0.15, theta_unit="jet lag score",
        beta_below_mu=-2.0, beta_below_sigma=1.5,
        beta_above_mu=-5.0, beta_above_sigma=3.0,
        effect_unit="min", per_unit="per 0.2 load",
        source="Dunican et al. 2023; jet lag SWS disruption",
        curve_type="plateau_down",
        evidence_tier=2,  # Observational
    ),

    # ── Dedicated priors for previously proxy-mapped edges ───────

    "weekly_training_hrs→cortisol": PriorSpec(
        theta_mu=12.0, theta_sigma=3.0, theta_unit="hr/wk",
        beta_below_mu=-0.5, beta_below_sigma=0.5,     # Moderate training may slightly lower cortisol
        beta_above_mu=2.0, beta_above_sigma=1.0,       # Overtraining RAISES cortisol via HPA activation
        effect_unit="mcg/dL", per_unit="per hr/wk",
        source="Hackney et al., BJSM 2003; Cadegiani & Kater, BMC Sports Sci Med Rehabil 2017",
        curve_type="plateau_down",  # Cortisol rises above threshold (bad direction)
        evidence_tier=2,  # Well-cited reviews
    ),

    "weekly_run_km→hemoglobin": PriorSpec(
        theta_mu=45.0, theta_sigma=12.0, theta_unit="km/wk",
        beta_below_mu=-0.01, beta_below_sigma=0.02,   # Minimal Hb change below threshold
        beta_above_mu=-0.15, beta_above_sigma=0.08,    # Sports anemia: plasma expansion + hemolysis
        effect_unit="g/dL", per_unit="per 10 km/wk",
        source="Mairbäurl, Front Physiol 2013; Eichner, Am J Med 1985",
        curve_type="plateau_down",
        evidence_tier=2,  # Classic reviews
    ),

    "weekly_zone2_min→ldl": PriorSpec(
        theta_mu=150.0, theta_sigma=30.0, theta_unit="min/wk",
        beta_below_mu=-1.0, beta_below_sigma=0.8,     # Modest LDL reduction with aerobic exercise
        beta_above_mu=-0.3, beta_above_sigma=0.5,      # Diminishing returns on LDL reduction
        effect_unit="mg/dL", per_unit="per 30 min/wk",
        source="Mann et al., J Lipid Res 2014; Kelley et al., Atherosclerosis 2012",
        curve_type="plateau_down",
        evidence_tier=1,  # Meta-analysis
    ),
}


def get_prior(edge_key: str) -> Optional[PriorSpec]:
    """Get population prior for a causal edge (format: 'source→target' or 'source->target')."""
    # Normalize: accept both → and ->
    normalized = edge_key.replace("->", "→")
    return PRIORS.get(normalized)


# Units that represent weekly quantities and need scaling for non-7-day windows
_WEEKLY_UNITS = {"km/wk", "km/week", "hr/wk", "hrs/week", "min/wk", "min/week"}

# Hour-based prior units that may need conversion when dose is in minutes
_HOUR_UNITS = {"hr/wk", "hrs/week"}


def scale_prior_to_dose_window(
    prior: PriorSpec,
    dose_window: int,
    dose_agg: str,
    dose_unit: str = "",
) -> PriorSpec:
    """
    Scale a prior to match the actual dose units and window used in BCEL fitting.

    Handles TWO types of mismatch:
    1. Time window: weekly prior → 28-day dose window (scale by dose_window/7)
    2. Unit conversion: prior in hours/wk but dose column in minutes
       (e.g., daily_duration_min summed over 28 days → need theta in min/28d)

    Args:
        prior: The raw population prior
        dose_window: The dose aggregation window in days
        dose_agg: The aggregation method ("sum", "mean", "max", "last")
        dose_unit: The unit of the dose column (e.g., "min", "km", "kcal")

    Returns a new PriorSpec with scaled parameters, or the original if no scaling needed.
    """
    if prior.theta_unit not in _WEEKLY_UNITS:
        return prior
    if dose_agg not in ("sum", "mean"):
        return prior

    # Start with the time window scale
    if dose_agg == "sum" and dose_window != 7:
        time_scale = dose_window / 7.0  # e.g., 28/7 = 4.0
    else:
        time_scale = 1.0

    # Check for hour→minute unit conversion
    # Prior uses hours (hr/wk) but dose column is in minutes
    unit_scale = 1.0
    if prior.theta_unit in _HOUR_UNITS and dose_unit == "min":
        unit_scale = 60.0  # 1 hour = 60 minutes

    total_scale = time_scale * unit_scale

    if total_scale == 1.0:
        return prior  # No scaling needed

    # Build new unit label
    new_unit = prior.theta_unit
    if unit_scale > 1:
        new_unit = new_unit.replace("hr/", "min/").replace("hrs/", "min/")
    if time_scale != 1.0:
        new_unit = new_unit.replace("/wk", f"/{dose_window}d").replace("/week", f"/{dose_window}d")

    return PriorSpec(
        theta_mu=prior.theta_mu * total_scale,
        theta_sigma=prior.theta_sigma * total_scale,
        theta_unit=new_unit,
        beta_below_mu=prior.beta_below_mu / total_scale,
        beta_below_sigma=prior.beta_below_sigma / total_scale,
        beta_above_mu=prior.beta_above_mu / total_scale,
        beta_above_sigma=prior.beta_above_sigma / total_scale,
        effect_unit=prior.effect_unit,
        per_unit=prior.per_unit,
        source=prior.source,
        curve_type=prior.curve_type,
        evidence_tier=prior.evidence_tier,
    )


def get_all_priors() -> Dict[str, PriorSpec]:
    """Get all population priors."""
    return PRIORS.copy()


def prior_exists(source: str, target: str) -> bool:
    """Check if a prior exists for a given edge."""
    key = f"{source}→{target}"
    return key in PRIORS or key.replace("→", "->") in PRIORS


# ══════════════════════════════════════════════════════════════════════
# Biomarker Noise: known measurement variability for informative sigma priors
# ══════════════════════════════════════════════════════════════════════

@dataclass
class BiomarkerNoise:
    """
    Known measurement variability for a biomarker/metric.

    Encodes analytical imprecision (assay CV) and within-individual biological
    variation (day-to-day CV in a healthy person at steady state). Together
    these define the noise floor: even with no real trend, repeated measurements
    will scatter by cv_total * mean_level.

    Used to build informative log-normal priors on BCEL's sigma parameter,
    preventing the model from fitting spurious trends through measurement noise
    when data is sparse (e.g., 3 lab draws).
    """
    cv_analytical: float      # Assay imprecision (0-1 scale, e.g., 0.07 = 7%)
    cv_biological: float      # Within-individual biological variation (0-1 scale)
    typical_level: float      # Representative level for documentation
    typical_level_unit: str
    source: str               # Citation for CV values

    @property
    def cv_total(self) -> float:
        """Total CV combining analytical and biological sources (root-sum-of-squares)."""
        return math.sqrt(self.cv_analytical**2 + self.cv_biological**2)


# Keyed by response family ID (matches RESPONSE_FAMILIES in edge_discovery.py).
# Primary reference: Ricós et al., Scand J Clin Lab Invest 1999 and the
# Westgard QC biological variation database (https://www.westgard.com/biodatabase1.htm).
BIOMARKER_NOISE: Dict[str, BiomarkerNoise] = {
    # ── Hormones ──────────────────────────────────────────────
    "testosterone": BiomarkerNoise(
        cv_analytical=0.07, cv_biological=0.14,
        typical_level=450, typical_level_unit="ng/dL",
        source="Ricós et al. 1999; Westgard BV database",
    ),
    "cortisol": BiomarkerNoise(
        cv_analytical=0.08, cv_biological=0.21,
        typical_level=12.0, typical_level_unit="mcg/dL",
        source="Ricós et al. 1999; diurnal variation dominates CVI",
    ),

    # ── Iron panel ────────────────────────────────────────────
    "ferritin": BiomarkerNoise(
        cv_analytical=0.05, cv_biological=0.15,
        typical_level=80, typical_level_unit="ng/mL",
        source="Ricós et al. 1999; Westgard BV database",
    ),
    "iron_total": BiomarkerNoise(
        cv_analytical=0.05, cv_biological=0.27,
        typical_level=100, typical_level_unit="mcg/dL",
        source="Ricós et al. 1999; iron has high within-day variation",
    ),

    # ── Lipids ────────────────────────────────────────────────
    "hdl": BiomarkerNoise(
        cv_analytical=0.04, cv_biological=0.07,
        typical_level=55, typical_level_unit="mg/dL",
        source="Ricós et al. 1999; Westgard BV database",
    ),
    "ldl": BiomarkerNoise(
        cv_analytical=0.04, cv_biological=0.09,
        typical_level=110, typical_level_unit="mg/dL",
        source="Ricós et al. 1999; Westgard BV database",
    ),
    "triglycerides": BiomarkerNoise(
        cv_analytical=0.05, cv_biological=0.21,
        typical_level=100, typical_level_unit="mg/dL",
        source="Ricós et al. 1999; fasting state dependent",
    ),

    # ── Inflammation ──────────────────────────────────────────
    "hscrp": BiomarkerNoise(
        cv_analytical=0.05, cv_biological=0.42,
        typical_level=1.0, typical_level_unit="mg/L",
        source="Ricós et al. 1999; CRP has very high CVI",
    ),

    # ── Hematology ────────────────────────────────────────────
    "hemoglobin": BiomarkerNoise(
        cv_analytical=0.015, cv_biological=0.03,
        typical_level=15.0, typical_level_unit="g/dL",
        source="Ricós et al. 1999; Westgard BV database",
    ),
    "rbc": BiomarkerNoise(
        cv_analytical=0.015, cv_biological=0.03,
        typical_level=5.0, typical_level_unit="M/uL",
        source="Ricós et al. 1999; Westgard BV database",
    ),
    "wbc": BiomarkerNoise(
        cv_analytical=0.03, cv_biological=0.11,
        typical_level=6.5, typical_level_unit="K/uL",
        source="Ricós et al. 1999; Westgard BV database",
    ),

    # ── Metabolic ─────────────────────────────────────────────
    "glucose": BiomarkerNoise(
        cv_analytical=0.03, cv_biological=0.06,
        typical_level=90, typical_level_unit="mg/dL",
        source="Ricós et al. 1999; fasting glucose",
    ),
    "insulin": BiomarkerNoise(
        cv_analytical=0.06, cv_biological=0.21,
        typical_level=8.0, typical_level_unit="uIU/mL",
        source="Ricós et al. 1999; high CVI due to pulsatile secretion",
    ),

    # ── Wearable metrics (dense data — priors should be weak) ─
    "hrv_daily": BiomarkerNoise(
        cv_analytical=0.03, cv_biological=0.08,
        typical_level=50, typical_level_unit="ms RMSSD",
        source="Plews et al., Sports Med 2013; device-specific CV ~3%",
    ),
    "resting_hr": BiomarkerNoise(
        cv_analytical=0.02, cv_biological=0.05,
        typical_level=55, typical_level_unit="bpm",
        source="Buchheit, Front Physiol 2014; optical HR CV ~2%",
    ),
    "sleep_efficiency": BiomarkerNoise(
        cv_analytical=0.03, cv_biological=0.06,
        typical_level=85, typical_level_unit="%",
        source="Roomkham et al., NPJ Digit Med 2018; consumer device CV",
    ),
    "deep_sleep": BiomarkerNoise(
        cv_analytical=0.05, cv_biological=0.15,
        typical_level=90, typical_level_unit="min",
        source="de Zambotti et al., Sleep 2019; consumer stage estimation",
    ),
    "vo2peak": BiomarkerNoise(
        cv_analytical=0.03, cv_biological=0.05,
        typical_level=50, typical_level_unit="ml/min/kg",
        source="Katch et al., Med Sci Sports 1982; test-retest CV",
    ),
}


def get_biomarker_noise(response_family_id: str) -> Optional[BiomarkerNoise]:
    """
    Get known measurement noise specification for a biomarker.

    Args:
        response_family_id: The response family ID (e.g., 'testosterone', 'hrv_daily').

    Returns:
        BiomarkerNoise if known, None otherwise (caller should use Jeffrey's prior).
    """
    return BIOMARKER_NOISE.get(response_family_id)
