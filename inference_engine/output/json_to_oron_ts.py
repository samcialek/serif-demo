"""
Convert oron_insights.json from the BCEL pipeline into the oronInsights
section of oron.ts, replacing hand-crafted insights with real computed data.

Usage:
    python -m inference_engine.output.json_to_oron_ts

Reads:  inference_engine/output_data/oron_insights.json
Writes: Serif_Demo/serif-demo/src/data/personas/oron.ts  (insights section only)
"""
import json
import re
import textwrap
from pathlib import Path
from typing import Any, Dict, List

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PIPELINE_JSON = PROJECT_ROOT / "inference_engine" / "output_data" / "oron_insights.json"
ORON_TS_DEMO = PROJECT_ROOT / "Serif_Demo" / "serif-demo" / "src" / "data" / "personas" / "oron.ts"
ORON_TS_ORON = PROJECT_ROOT / "Serif_Demo" / "serif-oron" / "src" / "data" / "personas" / "oron.ts"
# Default target (backward compat)
ORON_TS = ORON_TS_DEMO

# Maximum insights to include
MAX_INSIGHTS = 20

# Minimum quality thresholds for inclusion
# Prior-backed edges can show at lower CP since their certainty comes
# partly from population evidence tier, not just personal data signal
MIN_CHANGEPOINT_PROB = 0.10
MIN_OBSERVATIONS = 4

# Minimum personal data percentage to display an insight.
# Edges below this threshold are essentially population priors dressed
# as personal insights — UNLESS the prior is solid (tier 1: meta-analysis/RCT),
# in which case we let them through with an honest evidence label.
MIN_PERSONAL_WEIGHT = 0.10  # 10%
PRIOR_QUALITY_BYPASS_TIER = 1  # Tier 1 priors bypass the personal data filter


# Human-readable title/headline/summary overrides for pipeline edge names.
# Keys are the raw pipeline title (e.g. "Travel Load -> Sleep Efficiency").
# Any insight not in this map keeps its pipeline-generated title/headline.
TITLE_OVERRIDES: Dict[str, Dict[str, str]] = {
    "Travel Load -> Sleep Efficiency": {
        "title": "Travel Disrupts Sleep Efficiency",
        "headline": "Jet-lag and travel fatigue measurably reduce how well you sleep",
        "summary": "When your travel-load index rises above ~0.6, sleep efficiency drops sharply — likely driven by circadian misalignment, altered meal timing, and unfamiliar sleep environments.",
    },
    "Travel Load -> Deep Sleep": {
        "title": "Travel Cuts Deep Sleep",
        "headline": "High travel loads reduce the restorative deep-sleep phase",
        "summary": "Travel stress compresses slow-wave sleep, the phase responsible for tissue repair and growth-hormone release. The effect is strongest in the first 48 hours after a long-haul trip.",
    },
    "ACWR -> Neutrophil-Lymphocyte Ratio": {
        "title": "Training Spikes Shift Immune Balance",
        "headline": "Acute-to-chronic workload ratio drives NLR toward a pro-inflammatory state",
        "summary": "When ACWR exceeds ~1.2, neutrophils rise relative to lymphocytes — a sign the innate immune system is mobilizing while adaptive immunity is suppressed, raising short-term infection risk.",
    },
    "ACWR -> Resting HR Trend": {
        "title": "Training Spikes Elevate Resting Heart Rate",
        "headline": "Sudden increases in training load raise resting HR for days",
        "summary": "Resting heart rate rises linearly with ACWR as the autonomic nervous system shifts toward sympathetic dominance to support recovery from accumulated training stress.",
    },
    "Travel Load -> Resting HR": {
        "title": "Travel Elevates Resting Heart Rate",
        "headline": "High travel load pushes resting HR upward",
        "summary": "Travel stress — disrupted sleep, dehydration, sitting in transit — raises resting heart rate. The effect is linear: more travel, more sympathetic activation.",
    },
    "Travel Load -> Daily HRV": {
        "title": "Travel Suppresses HRV",
        "headline": "Heart-rate variability drops with increasing travel load",
        "summary": "Travel drives a linear decline in HRV, reflecting reduced parasympathetic tone. Circadian disruption and sleep fragmentation are the primary mediators.",
    },
    "Travel Load -> NLR": {
        "title": "Travel Shifts Immune Balance",
        "headline": "Travel load pushes NLR toward a pro-inflammatory state",
        "summary": "Circadian disruption from travel raises neutrophil counts relative to lymphocytes, signaling immune stress that mirrors the response to sleep deprivation.",
    },
    "Omega-3 Index -> hsCRP": {
        "title": "Omega-3 Status Lowers Inflammation",
        "headline": "Higher omega-3 index is linked to lower hsCRP",
        "summary": "Omega-3 fatty acids (EPA + DHA) suppress pro-inflammatory cytokines and NF-κB signaling. A higher omega-3 index correlates with lower systemic inflammation as measured by hsCRP.",
    },
    "Sleep Duration -> Cortisol": {
        "title": "Sleep Duration Influences Cortisol",
        "headline": "More sleep is associated with healthier cortisol patterns",
        "summary": "Short sleep disrupts the HPA axis, elevating evening cortisol and flattening the diurnal curve. Getting adequate sleep helps maintain the normal morning peak and evening trough.",
    },
    "Workout Time -> Sleep Efficiency": {
        "title": "Late Workouts Reduce Sleep Efficiency",
        "headline": "Exercising closer to bedtime makes it harder to sleep well",
        "summary": "Evening exercise raises core body temperature and sympathetic tone, delaying sleep onset. Finishing workouts earlier gives the body time to cool down and shift into parasympathetic mode.",
    },
    "Ferritin -> VO2peak": {
        "title": "Ferritin Supports Aerobic Capacity",
        "headline": "Higher ferritin stores are linked to better VO2peak values",
        "summary": "Ferritin reflects iron availability for hemoglobin synthesis and mitochondrial enzymes. Below ~47 ng/mL, oxygen-carrying capacity declines, limiting aerobic performance.",
    },
    "Sleep Duration -> Next-Day HRV": {
        "title": "Sleep Duration Boosts Next-Day HRV",
        "headline": "More sleep translates to higher heart-rate variability the following day",
        "summary": "Adequate sleep restores parasympathetic tone, raising HRV. The relationship is roughly linear — each additional hour of sleep provides a measurable HRV benefit.",
    },
    "Active Energy -> Deep Sleep": {
        "title": "Active Energy Increases Deep Sleep",
        "headline": "Higher daily energy expenditure drives more deep sleep at night",
        "summary": "Physical activity increases adenosine accumulation and raises sleep pressure, resulting in more slow-wave sleep. The effect scales linearly with total active energy burned.",
    },
    "Weekly Volume -> HRV Baseline": {
        "title": "Weekly Mileage Shapes HRV Baseline",
        "headline": "Consistent weekly running volume improves your 7-day HRV trend",
        "summary": "Chronic aerobic training enhances vagal tone and parasympathetic function. The benefit plateaus around 26 km/week — beyond that, additional volume yields diminishing HRV returns.",
    },
    "Running Volume -> Sleep Efficiency": {
        "title": "Running Improves Sleep Efficiency",
        "headline": "Higher daily running volume is linked to better sleep efficiency",
        "summary": "Aerobic exercise increases sleep drive and promotes thermoregulatory cooling at night, both of which improve sleep continuity and efficiency.",
    },
    "Training Duration -> Sleep Efficiency": {
        "title": "Training Duration Improves Sleep Efficiency",
        "headline": "Longer training sessions lead to better sleep quality",
        "summary": "Extended training increases adenosine accumulation and promotes deeper, more consolidated sleep. The benefit scales with total training time.",
    },
    "Daily Training Load -> Next-Day HRV": {
        "title": "Training Load Influences Next-Day HRV",
        "headline": "Higher daily TRIMP is followed by changes in heart-rate variability",
        "summary": "Acute training load shifts autonomic balance — moderate loads enhance parasympathetic rebound while very high loads can temporarily suppress HRV.",
    },
    "Training Duration -> Deep Sleep": {
        "title": "Training Duration Increases Deep Sleep",
        "headline": "More training time means more slow-wave sleep",
        "summary": "Physical training increases the homeostatic drive for slow-wave sleep, the most restorative sleep phase. Longer sessions amplify the effect.",
    },
    "Training Load -> Sleep Efficiency": {
        "title": "Training Load Supports Sleep Efficiency",
        "headline": "Moderate daily TRIMP is associated with better sleep efficiency",
        "summary": "Training-induced fatigue promotes sleep consolidation, reducing wake-after-sleep-onset. The effect is linear with TRIMP load.",
    },
    "Training Load -> Deep Sleep": {
        "title": "Training Load Drives Deep Sleep",
        "headline": "Higher training load increases slow-wave sleep duration",
        "summary": "Exercise-induced metabolic stress and elevated adenosine increase the proportion and duration of deep sleep.",
    },
    "Running Volume -> Iron": {
        "title": "Running Volume Depletes Iron",
        "headline": "High running mileage draws down serum iron levels",
        "summary": "Foot-strike hemolysis, GI ischemia, and sweat losses all increase with running volume, progressively depleting serum iron stores above ~177 km/month.",
    },
    "Daily Activity -> Body Mass": {
        "title": "Daily Steps Influence Body Mass",
        "headline": "Higher daily step count is associated with lower body mass",
        "summary": "Non-exercise activity thermogenesis (NEAT) from daily walking contributes to total energy expenditure, helping regulate body mass over time.",
    },
    "Daily Steps -> Sleep Efficiency": {
        "title": "Daily Steps Improve Sleep",
        "headline": "More steps during the day lead to better sleep efficiency at night",
        "summary": "Daytime physical activity builds sleep pressure through adenosine accumulation and helps regulate the circadian clock, both of which improve nighttime sleep consolidation.",
    },
    "Sleep Debt -> Resting HR": {
        "title": "Sleep Debt Raises Resting Heart Rate",
        "headline": "Accumulated sleep debt drives up resting HR over days",
        "summary": "Chronic sleep restriction shifts autonomic balance toward sympathetic dominance, raising resting heart rate. The 14-day running sleep debt metric captures this cumulative effect.",
    },
    "Bedtime -> Deep Sleep": {
        "title": "Earlier Bedtime Increases Deep Sleep",
        "headline": "Going to bed earlier is linked to more slow-wave sleep",
        "summary": "Aligning bedtime with the circadian pressure for slow-wave sleep (strongest in the early night) increases the total amount of deep, restorative sleep.",
    },
    "Daily Training Load -> Next-Day Resting HR": {
        "title": "Training Load Elevates Next-Day Resting HR",
        "headline": "Higher daily TRIMP raises resting heart rate the following day",
        "summary": "Acute training stress shifts the autonomic nervous system toward sympathetic dominance, transiently raising resting heart rate as the body mobilizes recovery resources.",
    },
    "Bedtime -> Sleep Quality": {
        "title": "Earlier Bedtime Improves Sleep Quality",
        "headline": "Consistent early bedtimes produce higher sleep quality scores",
        "summary": "Earlier bedtimes align with the circadian drive for deep sleep and reduce exposure to late-night blue light and stimulation, improving overall sleep architecture.",
    },
    "Training Consistency -> VO2peak": {
        "title": "Training Consistency Maintains VO2peak",
        "headline": "Consistent training protects aerobic fitness over time",
        "summary": "Regular training preserves mitochondrial density and capillary networks that support oxygen delivery, maintaining VO2peak even as absolute volume fluctuates.",
    },
    "ACWR -> Inflammation": {
        "title": "Training Spikes Increase Inflammation",
        "headline": "Acute-to-chronic workload spikes elevate hsCRP",
        "summary": "Rapid increases in training load trigger muscle damage and acute-phase inflammatory responses, raising hsCRP as the body mobilizes repair mechanisms.",
    },
    "ACWR -> White Blood Cells": {
        "title": "Training Spikes Shift White Blood Cells",
        "headline": "Workload ratio spikes mobilize white blood cells",
        "summary": "Acute training stress causes demargination of leukocytes and mobilization of immune cells, temporarily elevating total WBC count.",
    },
    "Zone 2 Volume -> Triglycerides": {
        "title": "Zone 2 Training Lowers Triglycerides",
        "headline": "More zone-2 aerobic training reduces blood triglycerides",
        "summary": "Sustained moderate-intensity exercise upregulates lipoprotein lipase activity, accelerating triglyceride clearance from the bloodstream.",
    },
    "Zone 2 Volume -> HDL": {
        "title": "Zone 2 Training Raises HDL",
        "headline": "Zone-2 volume positively influences HDL cholesterol",
        "summary": "Aerobic training increases CETP activity and enhances reverse cholesterol transport, raising HDL levels — an established cardioprotective effect.",
    },
    "Zone 2 Volume -> LDL": {
        "title": "Zone 2 Training Lowers LDL",
        "headline": "More zone-2 training is associated with lower LDL cholesterol",
        "summary": "Regular aerobic exercise enhances hepatic LDL receptor expression and reduces VLDL production, leading to lower circulating LDL levels.",
    },
    "Training Hours -> Testosterone": {
        "title": "Training Volume Influences Testosterone",
        "headline": "Training hours have a dose-dependent effect on testosterone",
        "summary": "Moderate training stimulates the HPG axis and supports healthy testosterone levels, but excessive volume can suppress LH pulse frequency and lower testosterone.",
    },
    "Training Hours -> Cortisol": {
        "title": "Training Raises Cortisol",
        "headline": "Training hours elevate cortisol production",
        "summary": "Exercise activates the HPA axis proportionally to training stress. Cortisol supports glucose mobilization during training but chronic elevation impairs recovery.",
    },
    "Sleep Duration -> Testosterone": {
        "title": "Sleep Duration Supports Testosterone",
        "headline": "Longer sleep supports healthy testosterone production",
        "summary": "Most testosterone is secreted during sleep, particularly during REM phases. Reduced sleep truncates the nocturnal testosterone pulse, leading to lower morning levels.",
    },
    "Iron Saturation -> Hemoglobin": {
        "title": "Iron Saturation Supports Hemoglobin",
        "headline": "Adequate iron saturation maintains hemoglobin levels",
        "summary": "Iron saturation reflects bioavailable iron for erythropoiesis. Below ~14%, hemoglobin synthesis is impaired, eventually leading to iron-deficiency anemia.",
    },
    "Ferritin -> RBC": {
        "title": "Ferritin Supports Red Blood Cell Count",
        "headline": "Higher ferritin stores maintain healthy RBC production",
        "summary": "Ferritin provides the iron reservoir needed for erythropoiesis. Low ferritin restricts red blood cell production even before frank anemia develops.",
    },
    "Ferritin -> Hemoglobin": {
        "title": "Ferritin Supports Hemoglobin Levels",
        "headline": "Adequate ferritin is essential for maintaining hemoglobin",
        "summary": "Ferritin supplies the iron needed for heme synthesis. When stores fall below ~46 ng/mL, hemoglobin production becomes rate-limited.",
    },
    "Homocysteine -> hsCRP": {
        "title": "Homocysteine Drives Inflammation",
        "headline": "Elevated homocysteine is associated with higher hsCRP",
        "summary": "Homocysteine promotes endothelial oxidative stress and NF-κB activation, contributing to systemic inflammation as reflected by hsCRP levels.",
    },
    "Training Volume -> Body Fat": {
        "title": "Training Volume Reduces Body Fat",
        "headline": "More training hours are linked to lower body fat percentage",
        "summary": "Increased training volume raises total daily energy expenditure and enhances fat oxidation capacity, progressively reducing body fat percentage.",
    },
    "Dietary Protein -> Body Fat": {
        "title": "Protein Intake Influences Body Composition",
        "headline": "Higher protein intake is associated with lower body fat",
        "summary": "Adequate protein supports lean mass retention and increases diet-induced thermogenesis, both of which contribute to favorable body composition.",
    },
    "Dietary Energy -> Body Mass": {
        "title": "Caloric Intake Affects Body Mass",
        "headline": "Total energy intake is the primary driver of body mass changes",
        "summary": "Chronic energy surplus leads to mass gain while deficit leads to loss — the fundamental energy balance equation modulated by activity level and metabolic rate.",
    },
    "Sleep Duration -> Glucose": {
        "title": "Sleep Duration Affects Glucose",
        "headline": "Longer sleep supports healthier blood glucose levels",
        "summary": "Sleep restriction impairs insulin sensitivity and glucose tolerance. Adequate sleep helps maintain normal fasting glucose and post-prandial responses.",
    },
    "Sleep Duration -> WBC": {
        "title": "Sleep Duration Modulates Immune Cells",
        "headline": "Sleep duration influences white blood cell counts",
        "summary": "Sleep regulates the diurnal oscillation of immune cells. Insufficient sleep disrupts leukocyte trafficking patterns and can elevate total WBC count.",
    },
}

# Human-readable display names for cause.behavior and outcome.metric fields
BEHAVIOR_OVERRIDES: Dict[str, str] = {
    "Daily Run Km": "Daily Running (km)",
    "Daily Duration Min": "Training Duration (min)",
    "Daily Zone2 Min": "Zone 2 Time (min)",
    "Acwr": "ACWR",
    "Training Consistency": "Training Consistency",
    "Ferritin Smoothed": "Ferritin",
    "Last Workout End Hour": "Workout End Time",
    "Bedtime Hour": "Bedtime Hour",
    "Sleep Duration Hrs": "Sleep Duration (hrs)",
    "Sleep Debt 14D": "Sleep Debt (14d)",
    "Daily Trimp": "Training Load (TRIMP)",
    "Steps": "Daily Steps",
    "Active Energy Kcal": "Active Energy (kcal)",
    "Travel Load": "Travel Load",
    "Iron Saturation Pct Smoothed": "Iron Saturation (%)",
    "Iron Saturation Pct": "Iron Saturation (%)",
    "Vitamin D Smoothed": "Vitamin D",
    "Omega3 Index Derived": "Omega-3 Index",
    "Homocysteine": "Homocysteine",
    "Homocysteine Smoothed": "Homocysteine",
    "Dietary Protein G": "Dietary Protein (g)",
    "Dietary Energy Kcal": "Dietary Energy (kcal)",
    "Body Mass Kg": "Body Mass (kg)",
}

METRIC_OVERRIDES: Dict[str, str] = {
    # With "Smoothed" suffix (from raw column names)
    "Iron Total Smoothed": "Serum Iron",
    "Ferritin Smoothed": "Ferritin",
    "Hemoglobin Smoothed": "Hemoglobin",
    "Testosterone Smoothed": "Testosterone",
    "Cortisol Smoothed": "Cortisol",
    "Triglycerides Smoothed": "Triglycerides",
    "Hdl Smoothed": "HDL",
    "Ldl Smoothed": "LDL",
    "Hscrp Smoothed": "hsCRP",
    "Vo2 Peak Smoothed": "VO2peak",
    "Rbc Smoothed": "Red Blood Cells",
    "Mcv Smoothed": "MCV",
    "Rdw Smoothed": "RDW",
    "Ast Smoothed": "AST",
    "Alt Smoothed": "ALT",
    "Apob Smoothed": "ApoB",
    "Non Hdl Cholesterol Smoothed": "Non-HDL Cholesterol",
    "Total Cholesterol Smoothed": "Total Cholesterol",
    "Glucose Smoothed": "Glucose",
    "Insulin Smoothed": "Insulin",
    "Uric Acid Smoothed": "Uric Acid",
    "Wbc Smoothed": "White Blood Cells",
    "Zinc Smoothed": "Zinc",
    "Magnesium Rbc Smoothed": "Magnesium (RBC)",
    "Dhea S Smoothed": "DHEA-S",
    "Shbg Smoothed": "SHBG",
    "Homocysteine Smoothed": "Homocysteine",
    "Creatinine Smoothed": "Creatinine",
    "Estradiol Smoothed": "Estradiol",
    "Platelets Smoothed": "Platelets",
    "Albumin Smoothed": "Albumin",
    # Without "Smoothed" suffix (from pipeline _clean_name output)
    "Iron Total": "Serum Iron",
    "Hdl": "HDL",
    "Ldl": "LDL",
    "Hscrp": "hsCRP",
    "Vo2 Peak": "VO2peak",
    "Rbc": "Red Blood Cells",
    "Mcv": "MCV",
    "Rdw": "RDW",
    "Ast": "AST",
    "Alt": "ALT",
    "Apob": "ApoB",
    "Non Hdl Cholesterol": "Non-HDL Cholesterol",
    "Total Cholesterol": "Total Cholesterol",
    "Wbc": "White Blood Cells",
    "Nlr": "NLR",
    "Magnesium Rbc": "Magnesium (RBC)",
    "Dhea S": "DHEA-S",
    "Shbg": "SHBG",
    "Sleep Efficiency Pct": "Sleep Efficiency",
    "Sleep Quality Score": "Sleep Quality",
    "Deep Sleep Min": "Deep Sleep (min)",
    "Hrv Daily Mean": "HRV (daily)",
    "Resting Hr": "Resting HR",
    "Resting Hr 7D Mean": "Resting HR (7d avg)",
    "Hrv 7D Mean": "HRV (7d avg)",
    "Body Fat Pct": "Body Fat (%)",
    "Body Mass Kg": "Body Mass (kg)",
}


def _apply_title_overrides(insights: List[Dict]) -> List[Dict]:
    """Apply human-readable title/headline/summary overrides to pipeline insights."""
    for ins in insights:
        raw_title = ins.get("title", "")
        overrides = TITLE_OVERRIDES.get(raw_title)
        if overrides:
            ins["title"] = overrides.get("title", ins["title"])
            ins["headline"] = overrides.get("headline", ins.get("headline", ""))
            ins["summary"] = overrides.get("summary", ins.get("summary", ""))
        # Apply behavior/metric display name overrides
        cause = ins.get("cause", {})
        outcome = ins.get("outcome", {})
        if cause.get("behavior") in BEHAVIOR_OVERRIDES:
            cause["behavior"] = BEHAVIOR_OVERRIDES[cause["behavior"]]
        if outcome.get("metric") in METRIC_OVERRIDES:
            outcome["metric"] = METRIC_OVERRIDES[outcome["metric"]]
    return insights


def load_pipeline_insights() -> List[Dict]:
    """Load insights from the pipeline JSON output."""
    with open(PIPELINE_JSON) as f:
        data = json.load(f)
    return data["insights"]


def filter_and_rank(insights: List[Dict]) -> List[Dict]:
    """
    Filter out low-quality insights and rank by clinical relevance.

    Removes:
    - Degenerate fits (theta at data boundary)
    - Very low changepoint probability
    - Too few observations

    Ranks by: priority (lower = higher priority), then changepointProb descending
    """
    filtered = []
    for ins in insights:
        cp = ins.get("causalParams", {})

        # Skip degenerate fits
        if cp.get("degenerate", False):
            continue

        # Skip very low changepoint probability
        if cp.get("changepointProb", 0) < MIN_CHANGEPOINT_PROB:
            continue

        # Skip too few observations
        if cp.get("observations", 0) < MIN_OBSERVATIONS:
            continue

        # Skip prior-dominated insights unless the prior is solid.
        # Edges with <10% personal data are essentially showing population
        # estimates, which is misleading unless the literature is strong.
        evidence = ins.get("evidence", {})
        personal_w = evidence.get("personalWeight", 1.0)
        evidence_tier = evidence.get("evidenceTier", 2)
        if personal_w < MIN_PERSONAL_WEIGHT and evidence_tier > PRIOR_QUALITY_BYPASS_TIER:
            continue

        # Skip mechanism contradictions: when the dominant fitted beta
        # has opposite sign from the prior's expected direction AND the
        # data is sparse (prior-dominated), the insight will show numbers
        # that contradict the stated mechanism text.
        if "priorBetaBelowSign" in cp:
            bb = cp.get("betaBelow", {}).get("value", 0)
            ba = cp.get("betaAbove", {}).get("value", 0)
            prior_bb_sign = cp["priorBetaBelowSign"]
            prior_ba_sign = cp["priorBetaAboveSign"]
            # Check if BOTH fitted betas contradict their prior signs
            bb_contradicts = (bb > 0 and prior_bb_sign < 0) or (bb < 0 and prior_bb_sign > 0)
            ba_contradicts = (ba > 0 and prior_ba_sign < 0) or (ba < 0 and prior_ba_sign > 0)
            # Only filter if both sides contradict (full sign flip)
            # and data is sparse enough that the fit is unreliable
            eff_n = cp.get("effectiveN", cp.get("observations", 100))
            if bb_contradicts and ba_contradicts and eff_n < 20:
                continue

        filtered.append(ins)

    # Sort by hybrid score: certainty-dominant so high-confidence insights
    # aren't excluded just because their clinical priority bucket is lower.
    # Priority breaks ties; certainty is the main driver.
    filtered.sort(key=lambda i: (
        i.get("priority", 99) * 0.15 - i.get("certainty", 0) * 0.85,
    ))

    return filtered[:MAX_INSIGHTS]


def _ts_string(s: str) -> str:
    """Escape a string for TypeScript single-quoted string literal."""
    if s is None:
        return "''"
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n") + "'"


def _ts_number(v: Any) -> str:
    """Format a number for TypeScript."""
    if v is None:
        return "0"
    if isinstance(v, float):
        # Remove trailing zeros but keep at least one decimal
        s = f"{v:.6f}".rstrip("0").rstrip(".")
        # For very small numbers, use compact format
        if abs(v) < 0.0001 and v != 0:
            return f"{v:.6f}"
        return s
    return str(v)


def _ts_array_compact(arr: List[float], indent: int = 8) -> str:
    """
    Format a number array compactly — fitting multiple values per line.
    Targets ~100 chars per line for readability.
    """
    if not arr:
        return "[]"

    # Format each number
    items = [f"{v:.4f}" if isinstance(v, float) else str(v) for v in arr]

    # Build lines of ~100 chars each
    prefix = " " * indent
    lines = []
    current_line = []
    current_len = 0

    for item in items:
        item_len = len(item) + 2  # +2 for ", "
        if current_len + item_len > 95 and current_line:
            lines.append(prefix + ", ".join(current_line) + ",")
            current_line = [item]
            current_len = len(item)
        else:
            current_line.append(item)
            current_len += item_len

    if current_line:
        lines.append(prefix + ", ".join(current_line))

    return "[\n" + "\n".join(lines) + ",\n" + " " * (indent - 2) + "]"


def insight_to_ts(ins: Dict, index: int) -> str:
    """Convert a single pipeline insight dict to TypeScript Insight object literal."""
    cp = ins.get("causalParams", {})
    theta = cp.get("theta", {})
    bb = cp.get("betaBelow", {})
    ba = cp.get("betaAbove", {})
    evidence = ins.get("evidence", {})
    comparison = ins.get("comparison", {})
    before = comparison.get("before", {})
    after = comparison.get("after", {})
    cause = ins.get("cause", {})
    outcome = ins.get("outcome", {})
    samples = cp.get("posteriorSamples", {})

    # Build the posteriorSamples block
    samples_block = ""
    if samples and samples.get("theta"):
        samples_block = f"""posteriorSamples: {{
        theta: {_ts_array_compact(samples.get('theta', []), 10)},
        betaBelow: {_ts_array_compact(samples.get('betaBelow', []), 10)},
        betaAbove: {_ts_array_compact(samples.get('betaAbove', []), 10)},
        alpha: {_ts_array_compact(samples.get('alpha', []), 10)},
      }},"""

    # currentValue/currentStatus
    current_block = ""
    if cp.get("currentValue") is not None:
        current_block = f"""currentValue: {_ts_number(cp['currentValue'])},
      currentStatus: {_ts_string(cp.get('currentStatus', 'at_optimal'))},"""

    # populationThreshold (from prior info if available)
    pop_threshold_block = ""
    prior_src = ins.get("priorSource", "")
    if prior_src:
        pop_threshold_block = f"""populationThreshold: {{
      value: {_ts_number(theta.get('value', 0))},
      label: 'Population Prior',
      variance: {_ts_string(f"Prior source: {prior_src}")},
    }},"""

    # Change block
    change_block = ""

    # holdoutPreview
    holdout_block = ""

    ts = f"""  {{
    id: {_ts_string(ins.get('id', f'oron_insight_{index + 1}'))},
    personaId: 'oron',
    category: {_ts_string(ins.get('category', 'metabolic'))},
    variableType: {_ts_string(ins.get('variableType', 'marker'))},
    title: {_ts_string(ins.get('title', ''))},
    headline: {_ts_string(ins.get('headline', ''))},
    summary: {_ts_string(ins.get('summary', ins.get('headline', '')))},
    recommendation: {_ts_string(ins.get('recommendation', ''))},
    explanation: {_ts_string(ins.get('explanation', ''))},

    causalParams: {{
      source: {_ts_string(cp.get('source', ''))},
      target: {_ts_string(cp.get('target', ''))},
      curveType: {_ts_string(cp.get('curveType', 'linear'))},
      theta: {{
        value: {_ts_number(theta.get('value', 0))},
        unit: {_ts_string(theta.get('unit', ''))},
        low: {_ts_number(theta.get('low', 0))},
        high: {_ts_number(theta.get('high', 0))},
        displayValue: {_ts_string(theta.get('displayValue', ''))},
      }},
      betaBelow: {{
        value: {_ts_number(bb.get('value', 0))},
        unit: {_ts_string(bb.get('unit', ''))},
        description: {_ts_string(bb.get('description', ''))},
      }},
      betaAbove: {{
        value: {_ts_number(ba.get('value', 0))},
        unit: {_ts_string(ba.get('unit', ''))},
        description: {_ts_string(ba.get('description', ''))},
      }},
      observations: {cp.get('observations', 0)},
      completePct: {_ts_number(cp.get('completePct', 0))},
      changepointProb: {_ts_number(cp.get('changepointProb', 0))},
      sizeCategory: {_ts_string(cp.get('sizeCategory', 'medium'))},
      {current_block}
      {samples_block}
    }},

    cause: {{
      behavior: {_ts_string(cause.get('behavior', ''))},
      threshold: {_ts_number(cause.get('threshold', 0))},
      unit: {_ts_string(cause.get('unit', ''))},
      direction: {_ts_string(cause.get('direction', 'above'))},
    }},

    {pop_threshold_block}

    outcome: {{
      metric: {_ts_string(outcome.get('metric', ''))},
      effect: {_ts_string(outcome.get('effect', ''))},
      direction: {_ts_string(outcome.get('direction', 'positive'))},
    }},

    certainty: {_ts_number(ins.get('certainty', 0.5))},
    evidenceWeight: {_ts_number(ins.get('evidenceWeight', 0.5))},
    evidence: {{
      personalDays: {evidence.get('personalDays', 0)},
      personalWeight: {_ts_number(evidence.get('personalWeight', 0.5))},
      populationWeight: {_ts_number(evidence.get('populationWeight', 0.5))},
      stability: {_ts_number(evidence.get('stability', 0.5))},
    }},

    dataSources: [{', '.join(_ts_string(s) for s in ins.get('dataSources', []))}],

    comparison: {{
      before: {{ value: {_ts_number(before.get('value', 0))}, label: {_ts_string(before.get('label', ''))} }},
      after: {{ value: {_ts_number(after.get('value', 0))}, label: {_ts_string(after.get('label', ''))} }},
    }},

    whyNow: {_ts_string(ins.get('whyNow', ''))},

    actionable: {str(ins.get('actionable', True)).lower()},
    suggestedAction: {_ts_string(ins.get('suggestedAction', ''))},
    priority: {ins.get('priority', 5)},
    status: 'new',

    showWork: {_ts_string(ins.get('showWork', ''))},
  }}"""

    # Clean up empty lines from optional blocks
    ts = re.sub(r'\n\s*\n\s*\n', '\n\n', ts)
    # Clean up trailing commas before closing braces
    ts = re.sub(r',\s*\n(\s*)\}', r',\n\1}', ts)

    return ts


def generate_insights_ts(insights: List[Dict]) -> str:
    """Generate the full oronInsights TypeScript array."""
    items = []
    for i, ins in enumerate(insights):
        items.append(insight_to_ts(ins, i))

    return (
        "export const oronInsights: Insight[] = [\n"
        + ",\n\n".join(items)
        + ",\n]\n"
    )


def update_oron_ts(insights_ts: str) -> None:
    """
    Replace the oronInsights section of oron.ts with computed insights.

    Strategy: Find the INSIGHTS section header comment block, then find the
    next section header (LAB RESULTS), and replace everything between.
    """
    content = ORON_TS.read_text(encoding="utf-8")

    # Find the INSIGHTS section header (the `// ──` block before oronInsights)
    header_pattern = r'// ─{3,}[^\n]*\n// INSIGHTS[^\n]*\n(?:// [^\n]*\n)*// ─{3,}[^\n]*\n'
    header_match = re.search(header_pattern, content)
    if not header_match:
        # Fallback: find just the export line
        export_match = re.search(r'export const oronInsights', content)
        if not export_match:
            raise ValueError("Could not find oronInsights in oron.ts")
        replace_start = export_match.start()
    else:
        replace_start = header_match.start()

    # Find the next section header AFTER the insights section
    # This is the LAB RESULTS section: `// ──────...`
    # Search from after the insights header
    search_from = replace_start + 100  # Past the insights header itself
    next_section = re.search(r'\n// ─{3,}[^\n]*\n// LAB', content[search_from:])
    if next_section:
        replace_end = search_from + next_section.start() + 1  # +1 for the leading \n
    else:
        # Fallback: find any `// ──` section header after search_from
        next_section = re.search(r'\n// ─{3,}', content[search_from:])
        if next_section:
            replace_end = search_from + next_section.start() + 1
        else:
            raise ValueError("Could not find section marker after oronInsights")

    # Build the replacement
    header = (
        "// ──────────────────────────────────────────────────────────────\n"
        "// INSIGHTS — Computed by BCEL Bayesian Inference Engine\n"
        "// Auto-generated from oron_insights.json — do not edit manually\n"
        "// ──────────────────────────────────────────────────────────────\n\n"
    )

    new_content = content[:replace_start] + header + insights_ts + "\n" + content[replace_end:]

    # Clean up any triple+ blank lines
    new_content = re.sub(r'\n{3,}', '\n\n', new_content)

    ORON_TS.write_text(new_content, encoding="utf-8")
    print(f"Updated {ORON_TS}")
    print(f"  Replaced oronInsights with {insights_ts.count('id:')} computed insights")


def main():
    print("Loading pipeline insights...")
    raw_insights = load_pipeline_insights()
    print(f"  Loaded {len(raw_insights)} insights from pipeline")

    print("\nFiltering and ranking...")
    selected = filter_and_rank(raw_insights)
    print(f"  Selected {len(selected)} insights (from {len(raw_insights)} total)")

    print("\nApplying title/headline/summary overrides...")
    selected = _apply_title_overrides(selected)
    for ins in selected:
        cp = ins.get("causalParams", {})
        print(f"    [{ins.get('priority', '?'):>2}] cert={ins.get('certainty', 0):.2f} "
              f"{ins.get('title', ''):45s} "
              f"cpProb={cp.get('changepointProb', 0):.2f} "
              f"size={cp.get('sizeCategory', '?')}")

    print("\nGenerating TypeScript...")
    insights_ts = generate_insights_ts(selected)

    # Write to both serif-demo and serif-oron
    for ts_path in [ORON_TS_DEMO, ORON_TS_ORON]:
        if ts_path.exists():
            print(f"\nUpdating {ts_path}...")
            global ORON_TS
            ORON_TS = ts_path
            update_oron_ts(insights_ts)
        else:
            print(f"\nSkipping {ts_path} (not found)")

    print("\nDone.")


if __name__ == "__main__":
    main()
