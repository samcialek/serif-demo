"""
Shape classifier for BCEL posterior output.

Given fitted beta_below, beta_above, and theta posteriors, determines:
1. The curve shape (plateau_up, plateau_down, v_min, v_max, linear)
2. The threshold (theta) with CI
3. Whether a changepoint is meaningful (changepointProb)
4. The user's current position relative to theta
5. Effect size category

The shape is DATA-DRIVEN, not pre-assigned. The prior's curve_type hint
is used only as a tiebreaker when the posterior is ambiguous.
"""
import numpy as np
from typing import Dict, Optional, Tuple


# Slope ratio below which a beta is considered "approximately zero"
SLOPE_ZERO_THRESHOLD = 0.15  # |beta| < 0.15 * |other_beta| => ~zero


def _estimate_expected_obs(n_obs: int) -> int:
    """
    Estimate expected observations for completePct calculation.

    Heuristic: if n_obs is very small (<20), this is likely sparse lab data
    with an expected ~12 draws per 2 years. If moderate (20-200), likely
    weekly-aggregated data with ~150 expected. If large (>200), daily data
    with ~1000 expected.
    """
    if n_obs < 20:
        return 12  # Sparse lab draws
    elif n_obs < 200:
        return 200  # Weekly-scale data
    else:
        return 1100  # Daily data over ~3 years


def classify_shape(posterior: Dict, prior_hint: str = "linear") -> str:
    """
    Classify curve shape from BCEL posterior.

    Logic:
      beta_below ~ 0, beta_above > 0  => plateau_up  (flat then rising)
      beta_below > 0, beta_above ~ 0  => plateau_up  (rising then flat)
      beta_below ~ 0, beta_above < 0  => plateau_down (flat then falling)
      beta_below < 0, beta_above ~ 0  => plateau_down (falling then flat)
      beta_below < 0, beta_above > 0  => v_min (U-shape)
      beta_below > 0, beta_above < 0  => v_max (inverted U)
      beta_below ~ beta_above         => linear (no meaningful changepoint)
    """
    bb = posterior["beta_below_mean"]
    ba = posterior["beta_above_mean"]
    bb_std = posterior["beta_below_std"]
    ba_std = posterior["beta_above_std"]

    # Check if the slopes are significantly different from each other
    slope_diff = abs(bb - ba)
    slope_diff_se = np.sqrt(bb_std**2 + ba_std**2)

    # If slopes are not meaningfully different, it's linear
    if slope_diff_se > 0 and slope_diff / slope_diff_se < 1.5:
        return "linear"

    # Determine which slopes are "approximately zero"
    max_abs = max(abs(bb), abs(ba), 1e-10)
    bb_is_zero = abs(bb) < SLOPE_ZERO_THRESHOLD * max_abs or abs(bb) < bb_std
    ba_is_zero = abs(ba) < SLOPE_ZERO_THRESHOLD * max_abs or abs(ba) < ba_std

    # Classification by sign pattern
    if bb >= 0 and ba <= 0:
        # Positive below, negative above => inverted U (peak at theta)
        if bb_is_zero and ba_is_zero:
            return "linear"
        return "v_max"

    if bb <= 0 and ba >= 0:
        # Negative below, positive above => U-shape (minimum at theta)
        if bb_is_zero and ba_is_zero:
            return "linear"
        return "v_min"

    if bb <= 0 and ba <= 0:
        # Both negative => monotone decrease, but steeper on one side
        if bb_is_zero or abs(ba) > 3 * abs(bb):
            return "plateau_down"  # flat then drop
        if ba_is_zero or abs(bb) > 3 * abs(ba):
            return "plateau_down"  # drop then flat
        return "plateau_down"

    if bb >= 0 and ba >= 0:
        # Both positive => monotone increase, but steeper on one side
        if ba_is_zero or abs(bb) > 3 * abs(ba):
            return "plateau_up"  # rise then flat
        if bb_is_zero or abs(ba) > 3 * abs(bb):
            return "plateau_up"  # flat then rise
        return "plateau_up"

    # Fallback to prior hint
    return prior_hint


def compute_changepoint_probability(posterior: Dict) -> float:
    """
    Estimate the probability that a meaningful changepoint exists.

    Uses TWO criteria:
    1. The z-score for slope difference (are the slopes statistically different?)
    2. The absolute magnitude of the slopes (are the slopes practically meaningful?)

    Both must be satisfied for a high changepointProb. Two tiny slopes
    (e.g., 0.001 vs -0.001) should NOT get a high probability even if
    statistically distinguishable.
    """
    bb = posterior["beta_below_mean"]
    ba = posterior["beta_above_mean"]
    bb_std = posterior["beta_below_std"]
    ba_std = posterior["beta_above_std"]
    sigma = max(posterior.get("sigma_mean", 1.0), 1e-10)

    # Criterion 1: Statistical — z-score for the difference in slopes
    diff = abs(bb - ba)
    se = np.sqrt(bb_std**2 + ba_std**2)
    if se < 1e-10:
        z_prob = 0.5
    else:
        z = diff / se
        z_prob = 1.0 / (1.0 + np.exp(-1.5 * (z - 1.0)))

    # Criterion 2: Practical — at least one slope must be meaningful
    # relative to the noise (sigma). A meaningful slope produces at least
    # 0.1 sigma of effect per unit dose.
    max_abs_slope = max(abs(bb), abs(ba))
    practical_ratio = max_abs_slope / sigma
    # Sigmoid: ratio=0.1 -> ~0.25, ratio=0.3 -> ~0.5, ratio=1.0 -> ~0.88
    prac_prob = 1.0 / (1.0 + np.exp(-5.0 * (practical_ratio - 0.3)))

    # Combined: geometric mean ensures both criteria matter
    prob = np.sqrt(z_prob * prac_prob)

    return float(np.clip(prob, 0.05, 0.99))


def compute_effect_size_category(posterior: Dict) -> str:
    """
    Categorize overall effect magnitude as small/medium/large.

    Uses the larger of |beta_below|, |beta_above| relative to
    the outcome's noise (sigma).
    """
    bb = abs(posterior["beta_below_mean"])
    ba = abs(posterior["beta_above_mean"])
    sigma = max(posterior["sigma_mean"], 1e-10)

    # Cohen's d analog: effect per unit / noise
    max_effect = max(bb, ba)
    d = max_effect / sigma

    if d < 0.2:
        return "small"
    elif d < 0.5:
        return "medium"
    else:
        return "large"


def compute_current_status(
    current_value: float,
    theta: float,
    curve_type: str,
) -> str:
    """
    Determine whether the user is at, below, or above optimal.

    Depends on curve shape:
      plateau_up:   optimal is ABOVE theta (you've captured the benefit)
      plateau_down: optimal is BELOW theta (stay safe)
      v_min:        optimal is AT theta (sweet spot)
      v_max:        optimal is AT theta (sweet spot)
      linear:       NO optimal — theta is just a kink, report position only
    """
    tolerance = 0.05 * abs(theta) if theta != 0 else 0.5

    if curve_type == "plateau_up":
        # Want to be above theta (saturating benefit captured)
        if current_value >= theta - tolerance:
            return "at_optimal"
        return "below_optimal"

    elif curve_type == "plateau_down":
        # Want to be below theta (avoid tipping point)
        if current_value <= theta + tolerance:
            return "at_optimal"
        return "above_optimal"

    elif curve_type in ("v_min", "v_max"):
        # Want to be near theta (the sweet spot)
        if abs(current_value - theta) <= tolerance * 2:
            return "at_optimal"
        elif current_value < theta:
            return "below_optimal"
        return "above_optimal"

    else:  # linear — no true optimal; theta is a kink, not a target
        # Never report "at_optimal" for linear curves; just indicate
        # which side of the kink the user is on
        if current_value < theta:
            return "below_threshold"
        return "above_threshold"


def generate_thompson_samples(posterior: Dict, n_worlds: int = 128) -> Dict:
    """
    Generate Thompson Sampling posterior worlds from the Laplace approximation.

    If full MCMC samples exist in the posterior, subsample those instead.
    Returns dict with 128 samples of each parameter.
    """
    if "theta_samples" in posterior and len(posterior["theta_samples"]) >= n_worlds:
        # Use real MCMC samples — subsample to n_worlds
        idx = np.random.choice(len(posterior["theta_samples"]), n_worlds, replace=False)
        return {
            "theta": [posterior["theta_samples"][i] for i in idx],
            "betaBelow": [posterior["beta_below_samples"][i] for i in idx],
            "betaAbove": [posterior["beta_above_samples"][i] for i in idx],
            "alpha": [posterior["alpha_samples"][i] for i in idx],
        }

    # Generate from Laplace approximation (Gaussian around MAP)
    theta_samples = np.random.normal(
        posterior["theta_mean"], posterior["theta_std"], n_worlds
    )
    bb_samples = np.random.normal(
        posterior["beta_below_mean"], posterior["beta_below_std"], n_worlds
    )
    ba_samples = np.random.normal(
        posterior["beta_above_mean"], posterior["beta_above_std"], n_worlds
    )
    alpha_samples = np.random.normal(
        posterior["alpha_mean"], posterior["alpha_std"], n_worlds
    )

    return {
        "theta": theta_samples.tolist(),
        "betaBelow": bb_samples.tolist(),
        "betaAbove": ba_samples.tolist(),
        "alpha": alpha_samples.tolist(),
    }


def posterior_to_causal_params(
    posterior: Dict,
    source_name: str,
    target_name: str,
    theta_unit: str,
    theta_display_fn=None,
    effect_unit: str = "",
    per_unit: str = "",
    current_value: Optional[float] = None,
    prior_curve_hint: str = "linear",
    n_worlds: int = 128,
) -> Dict:
    """
    Convert raw BCEL posterior into the CausalParameters JSON shape
    expected by the TypeScript frontend.

    This is the full pipeline:
      posterior -> shape classification -> threshold extraction ->
      effect sizing -> status -> Thompson samples -> JSON
    """
    # 1. Classify shape from data
    curve_type = classify_shape(posterior, prior_hint=prior_curve_hint)

    # 2. Extract theta with CI
    theta_mean = posterior["theta_mean"]
    theta_std = posterior["theta_std"]
    theta_low = theta_mean - 1.96 * theta_std
    theta_high = theta_mean + 1.96 * theta_std

    # Human-readable theta display
    if theta_display_fn:
        display_value = theta_display_fn(theta_mean)
    else:
        display_value = f"{theta_mean:.1f} {theta_unit}"

    # 3. Changepoint probability
    cp_prob = compute_changepoint_probability(posterior)

    # 4. Effect size category
    size_cat = compute_effect_size_category(posterior)

    # 5. Current status
    status = None
    if current_value is not None:
        status = compute_current_status(current_value, theta_mean, curve_type)

    # 6. Thompson samples
    samples = generate_thompson_samples(posterior, n_worlds)

    # 7. Beta descriptions
    bb = posterior["beta_below_mean"]
    ba = posterior["beta_above_mean"]
    bb_desc = f"{bb:+.2f} {effect_unit}/{per_unit}" if per_unit else f"{bb:+.2f} {effect_unit}"
    ba_desc = f"{ba:+.2f} {effect_unit}/{per_unit}" if per_unit else f"{ba:+.2f} {effect_unit}"

    # Add qualitative labels
    if abs(bb) < abs(ba) * 0.3:
        bb_desc += " (stable)"
    elif abs(bb) > abs(ba) * 3:
        bb_desc += " (strong)"

    if abs(ba) < abs(bb) * 0.3:
        ba_desc += " (diminishing)"
    elif abs(ba) > abs(bb) * 3:
        ba_desc += " (sharp)"

    # 8. Completeness — estimate based on data source and timescale
    # For daily metrics over ~3 years: ~1095 expected.
    # For weekly metrics: ~156. For sparse labs: ~6-12.
    n_obs = posterior.get("n_obs", 0)
    expected_obs = posterior.get("expected_obs", _estimate_expected_obs(n_obs))

    result = {
        "source": source_name,
        "target": target_name,
        "curveType": curve_type,
        "theta": {
            "value": round(theta_mean, 2),
            "unit": theta_unit,
            "low": round(theta_low, 2),
            "high": round(theta_high, 2),
            "displayValue": display_value,
        },
        "betaBelow": {
            "value": round(bb, 3),
            "unit": effect_unit,
            "description": bb_desc,
        },
        "betaAbove": {
            "value": round(ba, 3),
            "unit": effect_unit,
            "description": ba_desc,
        },
        "observations": n_obs,
        "completePct": round(min(100.0, n_obs / max(expected_obs, 1) * 100), 1),
        "changepointProb": round(cp_prob, 2),
        "sizeCategory": size_cat,
        "posteriorSamples": samples,
    }

    if current_value is not None:
        result["currentValue"] = round(current_value, 2)
        result["currentStatus"] = status

    return result
