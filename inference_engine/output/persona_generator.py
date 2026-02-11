"""
Persona generator.
Converts inference engine output into the full oron.ts TypeScript persona file
matching the PersonaData shape used by the Serif demo.
"""
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import numpy as np

from inference_engine.config import SUBJECT, OUTPUT_DIR


def generate_persona_profile(
    medix_data: Dict,
    current_loads: Dict[str, float],
) -> Dict:
    """Generate the Persona profile object for Oron."""
    cpet = None
    body_comp = None
    for assessment in medix_data.get("assessments", []):
        if assessment.get("type") == "cpet_lab_test":
            cpet = assessment
        elif assessment.get("type") == "body_composition":
            body_comp = assessment

    return {
        "id": "oron",
        "name": "Oron Afek",
        "avatar": "OA",
        "persona": "Triathlete optimizing iron status & endurance performance",
        "age": SUBJECT["age"],
        "archetype": "The Iron-Depleted Endurance Athlete",
        "narrative": (
            "Elite-level triathlete with exceptional VO2peak (52 ml/min/kg) "
            "but critically low iron status threatening performance. "
            "9+ years of GPS workout data reveal training patterns driving iron depletion."
        ),
        "daysOfData": 365 * 9,  # 9 years of GPX data
        "devices": ["bloodwork", "gpx", "medix-cpet"],
        "hasBloodwork": True,
        "labDraws": 6,
        "thresholds": {
            "caffeineCutoff": "14:00",
            "workoutEndTime": "19:00",
            "bedroomTempCeiling": 22,
            "eatingWindowHours": 10,
            "minSleepHours": 7,
            "maxAlcoholUnits": 1,
        },
        "currentMetrics": {
            "sleepScore": 0,  # Blocked on Apple Health
            "deepSleepMin": 0,
            "remSleepMin": 0,
            "sleepLatencyMin": 0,
            "hrv": 0,
            "restingHr": 47,  # From Medix
            "fastingGlucose": 77,
            "weight": 75.9,
            "trainingLoad": "optimal",
        },
        "loads": [
            {
                "id": "iron-depletion",
                "label": "Iron Depletion Risk",
                "value": 85,
                "trend": "stable",
                "status": "critical",
                "unit": "%",
                "detail": "Iron 37 mcg/dL (ref 50-180), saturation 9.3%",
            },
            {
                "id": "training-load",
                "label": "Training Load",
                "value": int(current_loads.get("ctl", 50)),
                "trend": "stable",
                "status": "moderate",
                "unit": "TRIMP",
                "detail": f"CTL: {current_loads.get('ctl', 0):.0f}, ACWR: {current_loads.get('acwr', 0):.2f}",
            },
            {
                "id": "ferritin-stores",
                "label": "Ferritin Stores",
                "value": 30,  # 46/150 optimal → ~30% of range
                "trend": "rising",
                "status": "high",
                "unit": "%",
                "detail": "Ferritin 46 ng/mL (was 24, target >50)",
            },
            {
                "id": "inflammation",
                "label": "Inflammation",
                "value": 10,
                "trend": "stable",
                "status": "low",
                "unit": "%",
                "detail": "hsCRP 0.3 mg/L — excellent",
            },
            {
                "id": "omega3-status",
                "label": "Omega-3 Status",
                "value": 65,
                "trend": "stable",
                "status": "moderate",
                "unit": "%",
                "detail": "DHA 2.2% (low), AA/EPA ratio 24.5 (high)",
            },
        ],
        "tags": [
            "triathlete",
            "iron-deficiency",
            "endurance",
            "high-vo2",
            "real-data",
        ],
    }


def generate_lab_results(labs_wide) -> List[Dict]:
    """Convert wide-format lab data to LabResult[] matching TypeScript schema."""
    lab_results = []

    for _, row in labs_wide.iterrows():
        lab = {
            "date": str(row["date"]),
            "fastingGlucose": float(row.get("glucose", 0) or 0),
            "hba1c": float(row.get("hba1c", 0) or 0),
            "insulin": float(row.get("insulin", 0) or 0) if row.get("insulin") else None,
            "totalCholesterol": float(row.get("total_cholesterol", 0) or 0),
            "ldl": float(row.get("ldl", 0) or 0),
            "hdl": float(row.get("hdl", 0) or 0),
            "triglycerides": float(row.get("triglycerides", 0) or 0),
            "hsCrp": float(row.get("hscrp", 0) or 0),
            "homocysteine": None,
            "testosterone": float(row.get("testosterone", 0) or 0) if row.get("testosterone") else None,
            "cortisol": float(row.get("cortisol", 0) or 0) if row.get("cortisol") else None,
            "tsh": float(row.get("tsh", 0) or 0) if row.get("tsh") else None,
            "vitaminD": float(row.get("vitamin_d", 0) or 0),
            "b12": float(row.get("b12", 0) or 0) if row.get("b12") else None,
            "ferritin": float(row.get("ferritin", 0) or 0) if row.get("ferritin") else None,
            # Extended fields for Oron
            "iron": float(row.get("iron_total", 0) or 0) if row.get("iron_total") else None,
            "tibc": float(row.get("tibc", 0) or 0) if row.get("tibc") else None,
            "ironSaturationPct": float(row.get("iron_saturation_pct_computed", 0) or 0) if row.get("iron_saturation_pct_computed") else None,
            "epa": float(row.get("epa", 0) or 0) if row.get("epa") else None,
            "dha": float(row.get("dha", 0) or 0) if row.get("dha") else None,
            "aaEpaRatio": float(row.get("aa_epa_ratio", 0) or 0) if row.get("aa_epa_ratio") else None,
            "apob": float(row.get("apob", 0) or 0) if row.get("apob") else None,
        }
        lab_results.append(lab)

    return lab_results


def generate_metrics_from_workouts(loads_df) -> List[Dict]:
    """Generate DailyMetrics[] from training loads (GPX-based, no Apple Health yet)."""
    metrics = []
    # Sample last 90 days or available data
    recent = loads_df.tail(90)

    for _, row in recent.iterrows():
        metric = {
            "date": str(row["date"].date()) if hasattr(row["date"], "date") else str(row["date"]),
            "sleepScore": 0,
            "sleepDuration": 0,
            "deepSleep": 0,
            "remSleep": 0,
            "lightSleep": 0,
            "sleepLatency": 0,
            "sleepEfficiency": 0,
            "bedtime": "",
            "wakeTime": "",
            "hrv": 0,
            "restingHr": 47,
            "respiratoryRate": 14,
            "bodyTemp": 36.6,
            "steps": int(row.get("daily_distance_km", 0) * 1300),  # Approx steps from distance
            "activeCalories": int(row.get("daily_trimp", 0) * 4),  # Rough approximation
            "moderateMinutes": int(row.get("daily_duration_min", 0) * 0.6),
            "vigorousMinutes": int(row.get("daily_duration_min", 0) * 0.3),
            "zone2Minutes": int(row.get("daily_zone2_min", 0)),
            "trainingLoad": float(row.get("daily_trimp", 0)),
            "caffeineCutoff": None,
            "alcoholUnits": 0,
            "eatingWindowStart": "08:00",
            "eatingWindowEnd": "18:00",
            "bedroomTemp": 21,
            "workoutTime": "07:00" if row.get("n_workouts", 0) > 0 else None,
            "workoutType": "running" if row.get("has_running", False) else ("cycling" if row.get("has_cycling", False) else None),
            "mood": 7,
            "energy": 7,
            "focus": 7,
            "stress": 3,
        }
        metrics.append(metric)

    return metrics


def generate_protocols(insights: List[Dict]) -> List[Dict]:
    """Generate actionable protocols from insights."""
    protocols = []

    # Iron Repletion Protocol
    iron_insight = next((i for i in insights if "iron_total" in i.get("id", "")), None)
    if iron_insight:
        protocols.append({
            "id": "oron-iron-repletion",
            "personaId": "oron",
            "name": "Iron Repletion Protocol",
            "title": "Replete Iron Stores While Maintaining Fitness",
            "description": "Reduce running volume temporarily, add iron supplementation, retest in 8 weeks",
            "category": "metabolic",
            "outcome": "Iron >50 mcg/dL, Ferritin >50 ng/mL, Iron Saturation >20%",
            "status": "suggested",
            "baseline": {"value": 37, "unit": "mcg/dL"},
            "actions": [
                {
                    "id": "reduce-run-volume",
                    "label": "Reduce weekly running to <35 km",
                    "category": "activity",
                    "isActive": True,
                    "impact": 8,
                    "actionType": "target",
                    "linkedInsightId": iron_insight["id"],
                },
                {
                    "id": "iron-supplement",
                    "label": "Iron supplementation (physician-guided)",
                    "category": "nutrition",
                    "isActive": True,
                    "impact": 9,
                    "actionType": "target",
                },
                {
                    "id": "vitamin-c",
                    "label": "Take vitamin C with iron for absorption",
                    "category": "nutrition",
                    "isActive": True,
                    "impact": 4,
                    "actionType": "target",
                },
                {
                    "id": "retest-8wk",
                    "label": "Retest iron panel in 8 weeks",
                    "category": "metabolic",
                    "isActive": True,
                    "impact": 7,
                    "actionType": "target",
                },
            ],
            "states": [
                {"id": "iron-depleted", "label": "Iron Depleted", "isActive": True},
                {"id": "repleting", "label": "Actively Repleting", "isActive": False},
            ],
            "triggers": [
                {
                    "if": ["iron-depleted"],
                    "then": ["reduce-run-volume", "iron-supplement"],
                    "reason": "Iron at 37 mcg/dL requires active intervention",
                },
            ],
            "personalizedTiming": "8-12 weeks to normalize iron stores",
            "expectedImpact": "Iron >50 mcg/dL, improved O2 delivery, better endurance",
            "difficulty": 3,
            "evidenceLevel": 85,
            "progress": 15,
            "simulator": {
                "deltas": {"iron_total": 25, "ferritin": 30, "iron_saturation_pct": 12},
            },
        })

    # Omega-3 Protocol
    protocols.append({
        "id": "oron-omega3-optimize",
        "personaId": "oron",
        "name": "Omega-3 Optimization",
        "title": "Optimize Omega-3 Index & Reduce AA/EPA Ratio",
        "description": "Supplement EPA/DHA to improve omega-3 index and reduce inflammatory omega-6/omega-3 ratio",
        "category": "nutrition",
        "outcome": "Omega-3 Index >5%, AA/EPA ratio <10",
        "status": "suggested",
        "baseline": {"value": 24.5, "unit": "AA/EPA ratio"},
        "actions": [
            {
                "id": "epa-dha-supplement",
                "label": "EPA/DHA 2-3g daily",
                "category": "nutrition",
                "isActive": True,
                "impact": 8,
                "actionType": "target",
            },
            {
                "id": "fatty-fish",
                "label": "Fatty fish 3x/week",
                "category": "nutrition",
                "isActive": True,
                "impact": 5,
                "actionType": "target",
            },
        ],
        "states": [
            {"id": "low-omega3", "label": "Low Omega-3", "isActive": True},
        ],
        "triggers": [
            {
                "if": ["low-omega3"],
                "then": ["epa-dha-supplement", "fatty-fish"],
                "reason": "AA/EPA ratio 24.5 indicates pro-inflammatory balance",
            },
        ],
        "personalizedTiming": "4-8 weeks to see meaningful ratio change",
        "expectedImpact": "Reduced inflammation, improved recovery, better endothelial function",
        "difficulty": 2,
        "evidenceLevel": 80,
        "progress": 0,
        "simulator": {
            "deltas": {"aa_epa_ratio": -15, "epa": 1.5, "dha": 2.0},
        },
    })

    return protocols


def generate_daily_plan(insights: List[Dict]) -> Dict:
    """Generate today's daily plan from insights."""
    today = datetime.now().strftime("%Y-%m-%d")

    high_priority = []
    moderate_priority = []
    maintain = []

    for insight in sorted(insights, key=lambda i: i.get("priority", 99)):
        item = {
            "id": f"plan-{insight['id']}",
            "text": insight.get("suggestedAction", insight.get("recommendation", "")),
            "explanation": insight.get("explanation", "")[:200],
            "evidenceWeight": f"{insight['evidence']['personalWeight']:.0%} personal, {insight['evidence']['populationWeight']:.0%} population",
        }

        priority = insight.get("priority", 5)
        if priority <= 2:
            high_priority.append(item)
        elif priority <= 5:
            moderate_priority.append(item)
        else:
            maintain.append(item)

    return {
        "personaId": "oron",
        "date": today,
        "greeting": (
            "Good morning, Oron. Your iron status remains critical at 37 mcg/dL. "
            "Today's focus: manage training volume while supporting iron repletion."
        ),
        "priorities": {
            "high": high_priority[:3],
            "moderate": moderate_priority[:3],
            "maintain": maintain[:3],
        },
    }


def generate_full_persona(
    labs_wide,
    medix_data: Dict,
    loads_df,
    insights: List[Dict],
    current_loads: Dict[str, float],
    current_markers: Dict[str, float],
) -> Dict:
    """Generate the complete PersonaData bundle."""
    persona = generate_persona_profile(medix_data, current_loads)
    lab_results = generate_lab_results(labs_wide)
    metrics = generate_metrics_from_workouts(loads_df)
    protocols = generate_protocols(insights)
    daily_plan = generate_daily_plan(insights)

    return {
        "persona": persona,
        "insights": insights,
        "metrics": metrics,
        "labs": lab_results,
        "protocols": protocols,
        "dailyPlan": daily_plan,
    }


def save_persona_json(persona_data: Dict, output_path=None):
    """Save the computed persona data as JSON."""
    output_path = output_path or (OUTPUT_DIR / "oron_computed.json")

    class NumpyEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, (np.integer,)):
                return int(obj)
            if isinstance(obj, (np.floating,)):
                return float(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            if isinstance(obj, (np.bool_,)):
                return bool(obj)
            return super().default(obj)

    with open(output_path, "w") as f:
        json.dump(persona_data, f, indent=2, cls=NumpyEncoder)

    print(f"Saved persona data to {output_path}")
    return output_path
