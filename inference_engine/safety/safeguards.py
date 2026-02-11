"""
Medical safety safeguards.
Filters recommendations against clinical bounds, flags dangerous suggestions,
and adds appropriate disclaimers.
"""
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

from inference_engine.config import SAFETY_BOUNDS


@dataclass
class SafetyCheck:
    """Result of a safety check on a recommendation."""
    passed: bool
    variable: str
    value: float
    bound_type: str       # 'within', 'near_low', 'near_high', 'below', 'above'
    severity: str         # 'ok', 'caution', 'warning', 'critical'
    message: Optional[str] = None


# Clinical alert thresholds (narrower than safety bounds)
CLINICAL_ALERTS = {
    "iron_total": {"critical_low": 30, "warning_low": 50, "optimal_low": 65, "optimal_high": 150},
    "ferritin": {"critical_low": 15, "warning_low": 30, "optimal_low": 50, "optimal_high": 200},
    "iron_saturation_pct": {"critical_low": 10, "warning_low": 16, "optimal_low": 20, "optimal_high": 50},
    "testosterone": {"critical_low": 200, "warning_low": 300, "optimal_low": 400, "optimal_high": 800},
    "hscrp": {"optimal_low": 0, "optimal_high": 1.0, "warning_high": 3.0, "critical_high": 10.0},
    "hdl": {"critical_low": 30, "warning_low": 40, "optimal_low": 50, "optimal_high": 90},
    "triglycerides": {"optimal_low": 30, "optimal_high": 100, "warning_high": 150, "critical_high": 300},
    "glucose": {"critical_low": 50, "warning_low": 65, "optimal_low": 70, "optimal_high": 100, "warning_high": 126},
    "vo2_peak": {"warning_low": 25, "optimal_low": 35},
    "acwr": {"optimal_low": 0.8, "optimal_high": 1.3, "warning_high": 1.5, "critical_high": 2.0},
}


def check_marker_safety(marker: str, value: float) -> SafetyCheck:
    """Check if a marker value is within safe clinical bounds."""
    alerts = CLINICAL_ALERTS.get(marker)
    if not alerts:
        return SafetyCheck(passed=True, variable=marker, value=value,
                          bound_type="within", severity="ok")

    # Check critical lows
    critical_low = alerts.get("critical_low")
    if critical_low is not None and value < critical_low:
        return SafetyCheck(
            passed=False, variable=marker, value=value,
            bound_type="below", severity="critical",
            message=f"{marker} at {value} is critically low (below {critical_low}). Refer to physician.",
        )

    # Check warning lows
    warning_low = alerts.get("warning_low")
    if warning_low is not None and value < warning_low:
        return SafetyCheck(
            passed=True, variable=marker, value=value,
            bound_type="near_low", severity="warning",
            message=f"{marker} at {value} is below optimal (warning threshold: {warning_low}).",
        )

    # Check critical highs
    critical_high = alerts.get("critical_high")
    if critical_high is not None and value > critical_high:
        return SafetyCheck(
            passed=False, variable=marker, value=value,
            bound_type="above", severity="critical",
            message=f"{marker} at {value} is critically high (above {critical_high}). Refer to physician.",
        )

    # Check warning highs
    warning_high = alerts.get("warning_high")
    if warning_high is not None and value > warning_high:
        return SafetyCheck(
            passed=True, variable=marker, value=value,
            bound_type="near_high", severity="warning",
            message=f"{marker} at {value} is above optimal (warning threshold: {warning_high}).",
        )

    return SafetyCheck(passed=True, variable=marker, value=value,
                      bound_type="within", severity="ok")


def filter_recommendation(
    source: str,
    target: str,
    recommended_value: float,
    current_markers: Dict[str, float],
) -> Tuple[bool, Optional[str]]:
    """
    Check if a recommendation is safe to deliver.
    Returns (safe, reason_if_not_safe).
    """
    # Check source bounds
    bounds = SAFETY_BOUNDS.get(source)
    if bounds:
        if recommended_value < bounds["min"]:
            return False, f"Recommended {source}={recommended_value} below minimum safe value {bounds['min']}"
        if recommended_value > bounds["max"]:
            return False, f"Recommended {source}={recommended_value} above maximum safe value {bounds['max']}"

    return True, None


def assess_current_status(markers: Dict[str, float]) -> List[SafetyCheck]:
    """Run safety checks on all current marker values."""
    results = []
    for marker, value in markers.items():
        if value is not None:
            results.append(check_marker_safety(marker, value))

    # Sort by severity: critical first
    severity_order = {"critical": 0, "warning": 1, "caution": 2, "ok": 3}
    results.sort(key=lambda r: severity_order.get(r.severity, 99))

    return results


def add_disclaimer(insight: Dict) -> Dict:
    """Add appropriate medical disclaimers to an insight."""
    severity = insight.get("safety_severity", "ok")

    if severity == "critical":
        insight["disclaimer"] = (
            "This finding indicates a value outside normal clinical range. "
            "Please consult your healthcare provider before making changes."
        )
    elif severity == "warning":
        insight["disclaimer"] = (
            "This marker is approaching a clinical threshold. "
            "Consider discussing with your healthcare provider."
        )
    else:
        insight["disclaimer"] = (
            "Insights are derived from your personal data combined with population research. "
            "They do not constitute medical advice."
        )

    return insight
