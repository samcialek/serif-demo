"""
Insight generator.
Converts posteriors, Thompson worlds, and clinical context into
structured Insight JSON matching the Serif TypeScript schema.
"""
import json
from datetime import datetime
from typing import Dict, List, Optional

import numpy as np

from inference_engine.causal.dag_builder import CausalEdge, get_active_edges, get_edge
from inference_engine.inference.population_priors import get_prior
from inference_engine.inference.delta_builder import (
    compute_personal_weight,
    generate_thompson_worlds,
    compute_changepoint_probability,
    categorize_effect_size,
)
from inference_engine.safety.safeguards import check_marker_safety, add_disclaimer


# Insight templates with clinical context for Oron
INSIGHT_TEMPLATES = {
    "weekly_run_km→iron_total": {
        "title": "Training Volume → Iron Status",
        "headline": "Your running volume is depleting iron stores — this is your #1 health risk",
        "recommendation": "Reduce running volume below {theta:.0f} km/week or supplement iron (consult physician for IV iron given severity)",
        "explanation": (
            "Foot-strike hemolysis destroys red blood cells during high-volume running. "
            "Your iron dropped from 63 to 37 mcg/dL (ref: 50-180), which is critically low. "
            "At your current weekly volume, you are losing iron faster than dietary intake can replace."
        ),
        "why_now": "Iron at 37 mcg/dL is below reference range (50-180). Iron saturation at 9.3% vs ref 20-48%.",
        "show_work": (
            "Fit piecewise-linear model: iron ~ f(weekly_run_km) with changepoint at θ. "
            "Below θ: mild decline ({beta_below:.2f} mcg/dL per 10 km). "
            "Above θ: steep decline ({beta_above:.2f} mcg/dL per 10 km). "
            "Prior: Sim et al., Sports Med 2019. "
            "Personal data: {n_obs} observation pairs. "
            "Evidence split: {pw:.0%} personal / {pop_w:.0%} population."
        ),
    },
    "weekly_run_km→ferritin": {
        "title": "Training Volume → Ferritin Stores",
        "headline": "Ferritin improving (24→46) but still suboptimal for endurance performance",
        "recommendation": "Target ferritin >50 ng/mL. Keep running below {theta:.0f} km/week while repleting stores",
        "explanation": (
            "Ferritin reflects total body iron stores. Yours hit a critical low of 24 ng/mL "
            "(ref: 38-380) and has improved to 46 — still below the 50+ ng/mL target for athletes. "
            "Endurance performance is impaired when ferritin drops below 30 ng/mL."
        ),
        "why_now": "Ferritin at 46 ng/mL, improving from 24 but not yet in athlete-optimal range (>50).",
        "show_work": (
            "Piecewise-linear: ferritin ~ f(weekly_run_km). θ = {theta:.0f} km/wk. "
            "Prior: Peeling et al., IJSNEM 2008. "
            "Evidence: {pw:.0%} personal / {pop_w:.0%} population."
        ),
    },
    "weekly_training_hrs→testosterone": {
        "title": "Training Load → Testosterone",
        "headline": "Training hours may be suppressing testosterone — monitor closely",
        "recommendation": "Keep total training below {theta:.0f} hours/week; prioritize recovery weeks",
        "explanation": (
            "Overtraining suppresses the HPG axis, lowering testosterone. "
            "Your levels (327-444 ng/dL) are lower-normal for age 43. "
            "High training volume without adequate recovery exacerbates this."
        ),
        "why_now": "Testosterone 327-444 ng/dL, lower quartile for age. Training volume is high.",
        "show_work": (
            "Piecewise-linear: testosterone ~ f(weekly_training_hrs). θ = {theta:.1f} hrs/wk. "
            "Prior: Hackney et al., BJSM 2003. "
            "Evidence: {pw:.0%} personal / {pop_w:.0%} population."
        ),
    },
    "weekly_zone2_min→triglycerides": {
        "title": "Zone 2 Volume → Triglycerides",
        "headline": "Your aerobic training is keeping triglycerides excellent",
        "recommendation": "Maintain {theta:.0f}+ min/week of Zone 2 training to sustain low triglycerides",
        "explanation": (
            "Regular Zone 2 exercise activates lipoprotein lipase, clearing triglycerides. "
            "Your TG at 42 mg/dL is excellent (<150 optimal, <100 ideal)."
        ),
        "why_now": "Triglycerides at 42 mg/dL — exceptional. Your Zone 2 training is working.",
        "show_work": (
            "Piecewise-linear: triglycerides ~ f(weekly_zone2_min). θ = {theta:.0f} min/wk. "
            "Prior: AHA guidelines. "
            "Evidence: {pw:.0%} personal / {pop_w:.0%} population."
        ),
    },
    "weekly_zone2_min→hdl": {
        "title": "Zone 2 Volume → HDL Cholesterol",
        "headline": "HDL at 44 — could benefit from more consistent Zone 2",
        "recommendation": "Target {theta:.0f}+ min/week Zone 2 to raise HDL above 50 mg/dL",
        "explanation": (
            "HDL at 44 mg/dL is adequate but not protective (>50 preferred for men). "
            "Consistent Zone 2 training is the most effective non-pharmacological HDL booster."
        ),
        "why_now": "HDL at 44 mg/dL, below the 50+ target. Zone 2 volume may be insufficient.",
        "show_work": (
            "Piecewise-linear: hdl ~ f(weekly_zone2_min). θ = {theta:.0f} min/wk. "
            "Prior: AHA guidelines. "
            "Evidence: {pw:.0%} personal / {pop_w:.0%} population."
        ),
    },
    "acwr→hscrp": {
        "title": "Training Load Ratio → Inflammation",
        "headline": "Inflammation excellently controlled — maintain ACWR balance",
        "recommendation": "Keep ACWR below {theta:.1f} to maintain hsCRP under 1.0 mg/L",
        "explanation": (
            "hsCRP at 0.3 mg/L indicates minimal systemic inflammation — outstanding for an athlete. "
            "Acute overreaching (ACWR >1.3) can spike inflammation. "
            "Your current load management is working well."
        ),
        "why_now": "hsCRP stable at 0.3-0.4 mg/L. Maintain current training load management.",
        "show_work": (
            "Piecewise-linear: hscrp ~ f(acwr). θ = {theta:.2f}. "
            "Prior: Hulin et al., BJSM 2016. "
            "Evidence: {pw:.0%} personal / {pop_w:.0%} population."
        ),
    },
    "training_consistency→vo2_peak": {
        "title": "Training Consistency → VO2 Peak",
        "headline": "VO2peak at 52 ml/min/kg (excellent) — consistency is paying off",
        "recommendation": "Maintain training consistency above {theta:.0%} of days to protect VO2peak",
        "explanation": (
            "Your VO2peak of 52 ml/min/kg is rated excellent (129% of predicted). "
            "This is driven by consistent training over years. "
            "However, iron deficiency threatens O2 transport capacity — address iron first."
        ),
        "why_now": "VO2peak excellent at 52. Iron deficiency could erode this if not addressed.",
        "show_work": (
            "Piecewise-linear: vo2_peak ~ f(training_consistency). θ = {theta:.2f}. "
            "Prior: General exercise physiology. "
            "Evidence: {pw:.0%} personal / {pop_w:.0%} population."
        ),
    },
    "ferritin→vo2_peak": {
        "title": "Iron Stores → Performance Ceiling",
        "headline": "Low ferritin is capping your aerobic performance potential",
        "recommendation": "Raise ferritin above {theta:.0f} ng/mL to unlock full VO2peak",
        "explanation": (
            "Ferritin below 30 ng/mL impairs hemoglobin synthesis, limiting oxygen delivery. "
            "Despite excellent VO2peak (52), your iron saturation of 9.3% means O2 transport "
            "is already compromised. Fixing iron could yield further performance gains."
        ),
        "why_now": "Iron saturation at 9.3% (ref 20-48%) is the bottleneck limiting further adaptation.",
        "show_work": (
            "Piecewise-linear: vo2_peak ~ f(ferritin). θ = {theta:.0f} ng/mL. "
            "Prior: DellaValle & Haas, MSSE 2014. "
            "Evidence: {pw:.0%} personal / {pop_w:.0%} population."
        ),
    },
}


def generate_insight(
    edge: CausalEdge,
    posterior: Dict,
    worlds: Dict,
    current_markers: Dict[str, float],
    current_loads: Dict[str, float],
    n_obs: int,
) -> Optional[Dict]:
    """Generate a single structured insight from a fitted causal edge."""
    edge_key = f"{edge.source}→{edge.target}"
    template = INSIGHT_TEMPLATES.get(edge_key)
    if template is None:
        return None

    prior = get_prior(edge_key)
    pw = compute_personal_weight(n_obs)
    pop_w = 1 - pw

    # Changepoint probability from worlds
    cp_prob = compute_changepoint_probability(worlds)

    # Current values
    current_source = current_loads.get(edge.source, current_markers.get(edge.source, 0))
    current_target = current_markers.get(edge.target, 0)

    # Determine current status relative to theta
    theta_val = posterior["theta_mean"]
    if current_source < theta_val * 0.95:
        current_status = "below_optimal"
    elif current_source > theta_val * 1.05:
        current_status = "above_optimal"
    else:
        current_status = "at_optimal"

    # Effect size categorization
    beta_key = "beta_above" if current_source > theta_val else "beta_below"
    beta_mean = posterior[f"{beta_key}_mean"]
    beta_std = posterior[f"{beta_key}_std"]
    size_cat = categorize_effect_size(beta_mean, beta_std, max(abs(current_target), 1))

    # Safety check on target marker
    safety = check_marker_safety(edge.target, current_target)

    # Format template strings
    fmt_kwargs = {
        "theta": theta_val,
        "beta_below": posterior["beta_below_mean"],
        "beta_above": posterior["beta_above_mean"],
        "n_obs": n_obs,
        "pw": pw,
        "pop_w": pop_w,
    }

    insight = {
        "id": f"oron-{edge.source}-{edge.target}",
        "personaId": "oron",
        "category": edge.category,
        "variableType": edge.variable_type,
        "title": template["title"],
        "headline": template["headline"],
        "recommendation": template["recommendation"].format(**fmt_kwargs),
        "explanation": template["explanation"],
        "narrative": template.get("narrative", ""),

        "causalParams": {
            "source": edge.source,
            "target": edge.target,
            "curveType": prior.curve_type if prior else "linear",
            "theta": {
                "value": round(theta_val, 2),
                "unit": prior.theta_unit if prior else "",
                "low": round(theta_val - 1.96 * posterior["theta_std"], 2),
                "high": round(theta_val + 1.96 * posterior["theta_std"], 2),
                "displayValue": _format_theta_display(theta_val, prior.theta_unit if prior else ""),
            },
            "betaBelow": {
                "value": round(posterior["beta_below_mean"], 3),
                "unit": prior.effect_unit if prior else "",
                "description": f"{posterior['beta_below_mean']:+.2f} {prior.effect_unit if prior else ''} {prior.per_unit if prior else ''}",
            },
            "betaAbove": {
                "value": round(posterior["beta_above_mean"], 3),
                "unit": prior.effect_unit if prior else "",
                "description": f"{posterior['beta_above_mean']:+.2f} {prior.effect_unit if prior else ''} {prior.per_unit if prior else ''}",
            },
            "observations": n_obs,
            "completePct": round(min(n_obs / 6 * 100, 100), 1),
            "changepointProb": round(cp_prob, 2),
            "sizeCategory": size_cat,
            "currentValue": round(current_source, 2) if current_source else None,
            "currentStatus": current_status,
            "posteriorSamples": {
                "theta": [round(v, 3) for v in worlds["theta"]],
                "betaBelow": [round(v, 4) for v in worlds["beta_below"]],
                "betaAbove": [round(v, 4) for v in worlds["beta_above"]],
                "alpha": [round(v, 3) for v in worlds["alpha"]],
            },
        },

        "cause": {
            "behavior": edge.source.replace("_", " ").title(),
            "threshold": round(theta_val, 1),
            "unit": prior.theta_unit if prior else "",
            "direction": "above" if posterior["beta_above_mean"] < posterior["beta_below_mean"] else "below",
        },

        "outcome": {
            "metric": edge.target.replace("_", " ").title(),
            "effect": f"{abs(beta_mean):.2f} {prior.effect_unit if prior else ''} {prior.per_unit if prior else ''}",
            "direction": "negative" if beta_mean < 0 else "positive",
        },

        "certainty": round(min(cp_prob * 0.7 + pw * 0.3, 0.99), 2),
        "evidenceWeight": round(pw, 2),
        "evidence": {
            "personalDays": n_obs,
            "personalWeight": round(pw, 2),
            "populationWeight": round(pop_w, 2),
            "stability": round(cp_prob, 2),
        },

        "dataSources": ["bloodwork", "gpx"],
        "comparison": {
            "before": {"value": round(current_target, 1), "label": "Current"},
            "after": {"value": round(current_target + beta_mean * 10, 1), "label": "Projected"},
        },

        "whyNow": template["why_now"],
        "actionable": True,
        "suggestedAction": template["recommendation"].format(**fmt_kwargs),
        "priority": _compute_priority(safety.severity, abs(beta_mean), cp_prob),
        "status": "new",

        "showWork": template["show_work"].format(**fmt_kwargs),
        "safety_severity": safety.severity,
    }

    insight = add_disclaimer(insight)

    return insight


def _format_theta_display(value: float, unit: str) -> str:
    """Format theta for human display."""
    if unit == "km/wk":
        return f"{value:.0f} km/week"
    elif unit == "min/wk":
        return f"{value:.0f} min/week"
    elif unit == "hr/wk":
        return f"{value:.1f} hrs/week"
    elif unit == "ratio":
        return f"{value:.2f}"
    elif unit == "fraction":
        return f"{value:.0%}"
    elif unit == "ng/mL":
        return f"{value:.0f} ng/mL"
    else:
        return f"{value:.1f} {unit}"


def _compute_priority(severity: str, effect_size: float, confidence: float) -> int:
    """Compute insight priority (1=highest)."""
    severity_scores = {"critical": 4, "warning": 3, "caution": 2, "ok": 1}
    score = severity_scores.get(severity, 1) * 10 + effect_size * confidence * 5
    # Convert to 1-10 scale (1=highest priority)
    return max(1, min(10, 11 - int(score / 5)))


def generate_all_insights(
    posteriors: Dict[str, Dict],
    all_worlds: Dict[str, Dict],
    current_markers: Dict[str, float],
    current_loads: Dict[str, float],
) -> List[Dict]:
    """Generate all insights for active causal edges."""
    insights = []

    for edge in get_active_edges():
        edge_key = f"{edge.source}→{edge.target}"
        if edge_key not in posteriors:
            continue

        posterior = posteriors[edge_key]
        worlds = all_worlds.get(edge_key, generate_thompson_worlds(posterior))
        n_obs = posterior.get("n_obs", 6)

        insight = generate_insight(
            edge, posterior, worlds, current_markers, current_loads, n_obs
        )
        if insight:
            insights.append(insight)

    # Sort by priority
    insights.sort(key=lambda i: i.get("priority", 99))

    return insights
