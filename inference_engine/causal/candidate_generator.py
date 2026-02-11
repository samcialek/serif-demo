"""
Candidate action generator.
Given causal edges and posteriors, generates feasible action recommendations.
"""
from typing import Dict, List, Optional
from dataclasses import dataclass

from inference_engine.config import SAFETY_BOUNDS


@dataclass
class ActionCandidate:
    """A feasible action recommendation derived from causal inference."""
    source: str
    target: str
    direction: str           # 'increase' | 'decrease' | 'maintain'
    current_value: float
    recommended_value: float
    expected_effect: float
    expected_effect_unit: str
    confidence: float        # 0-1
    mechanism: str
    safety_note: Optional[str] = None


def generate_candidates(
    posteriors: Dict,
    current_loads: Dict[str, float],
    current_markers: Dict[str, float],
) -> List[ActionCandidate]:
    """
    Generate action candidates from posterior distributions and current state.

    For each causal edge with a fitted posterior:
    1. Determine if current value is above/below optimal (theta)
    2. Compute expected effect of moving toward theta
    3. Check safety bounds
    4. Rank by expected benefit × confidence
    """
    candidates = []

    for key, posterior in posteriors.items():
        source, target = key.split("→")
        theta_mean = posterior.get("theta_mean", 0)
        beta_below_mean = posterior.get("beta_below_mean", 0)
        beta_above_mean = posterior.get("beta_above_mean", 0)
        confidence = posterior.get("confidence", 0.5)

        current = current_loads.get(source, current_markers.get(source))
        if current is None:
            continue

        target_current = current_markers.get(target)

        # Determine direction
        if current > theta_mean and abs(beta_above_mean) > abs(beta_below_mean):
            # Above threshold and there's a stronger effect above — suggest decrease
            direction = "decrease"
            recommended = theta_mean
            expected_delta = beta_above_mean * (current - theta_mean)
        elif current < theta_mean and abs(beta_below_mean) > 0.01:
            # Below threshold — suggest increase toward theta
            direction = "increase"
            recommended = theta_mean
            expected_delta = beta_below_mean * (theta_mean - current)
        else:
            direction = "maintain"
            recommended = current
            expected_delta = 0

        # Safety check
        safety_note = None
        bounds = SAFETY_BOUNDS.get(source)
        if bounds:
            recommended = max(bounds["min"], min(bounds["max"], recommended))
            if recommended == bounds["min"] or recommended == bounds["max"]:
                safety_note = f"Recommendation capped at safety bound ({bounds['min']}-{bounds['max']})"

        target_bounds = SAFETY_BOUNDS.get(target)
        if target_bounds and target_current is not None:
            projected = target_current + expected_delta
            if projected < target_bounds["min"] or projected > target_bounds["max"]:
                safety_note = (safety_note or "") + f" Projected {target} ({projected:.1f}) outside safe range"

        candidates.append(ActionCandidate(
            source=source,
            target=target,
            direction=direction,
            current_value=current,
            recommended_value=round(recommended, 1),
            expected_effect=round(expected_delta, 2),
            expected_effect_unit=posterior.get("target_unit", ""),
            confidence=confidence,
            mechanism=posterior.get("mechanism", ""),
            safety_note=safety_note,
        ))

    # Sort by |expected_effect| × confidence
    candidates.sort(key=lambda c: abs(c.expected_effect) * c.confidence, reverse=True)

    return candidates
