"""
Delta builder: Treatment effects from posteriors.
Generates Thompson sampling worlds (128 posterior curve samples)
and computes evidence-weighted personal/population blends.
"""
import numpy as np
from typing import Dict, List, Tuple

from inference_engine.config import THOMPSON_WORLDS, MIN_PERSONAL_OBS


def compute_personal_weight(n_personal: int) -> float:
    """
    Compute personal data weight using sigmoid scaling.
    personalWeight = sigmoid(log(N_personal / 30))
    With 6 lab draws: ~0.15-0.25
    """
    if n_personal <= 0:
        return 0.0
    ratio = n_personal / MIN_PERSONAL_OBS
    log_ratio = np.log(max(ratio, 1e-6))
    weight = 1.0 / (1.0 + np.exp(-log_ratio))
    return round(float(weight), 3)


def generate_thompson_worlds(posterior: Dict, n_worlds: int = THOMPSON_WORLDS) -> Dict:
    """
    Generate n_worlds posterior samples for Thompson sampling.

    Each world is a complete set of (theta, beta_below, beta_above, alpha)
    that defines one possible dose-response curve.

    If full posterior samples are available (from PyMC), subsample them.
    Otherwise, sample from the Laplace approximation (Gaussian).
    """
    # Check if we have full MCMC samples
    if "theta_samples" in posterior and len(posterior["theta_samples"]) >= n_worlds:
        # Subsample from MCMC posterior
        n_avail = len(posterior["theta_samples"])
        idx = np.random.choice(n_avail, size=n_worlds, replace=False)
        return {
            "theta": [posterior["theta_samples"][i] for i in idx],
            "beta_below": [posterior["beta_below_samples"][i] for i in idx],
            "beta_above": [posterior["beta_above_samples"][i] for i in idx],
            "alpha": [posterior["alpha_samples"][i] for i in idx],
        }

    # Sample from Laplace approximation (Gaussian around MAP)
    theta_samples = np.random.normal(
        posterior["theta_mean"], posterior["theta_std"], n_worlds
    ).tolist()
    beta_below_samples = np.random.normal(
        posterior["beta_below_mean"], posterior["beta_below_std"], n_worlds
    ).tolist()
    beta_above_samples = np.random.normal(
        posterior["beta_above_mean"], posterior["beta_above_std"], n_worlds
    ).tolist()
    alpha_samples = np.random.normal(
        posterior["alpha_mean"], posterior["alpha_std"], n_worlds
    ).tolist()

    return {
        "theta": theta_samples,
        "beta_below": beta_below_samples,
        "beta_above": beta_above_samples,
        "alpha": alpha_samples,
    }


def blend_posteriors(
    personal_posterior: Dict,
    prior_spec: Dict,
    n_personal: int,
) -> Dict:
    """
    Blend personal posterior with population prior based on data quantity.

    Uses evidence weighting:
    - personal_weight = sigmoid(log(n_personal / 30))
    - population_weight = 1 - personal_weight
    """
    pw = compute_personal_weight(n_personal)
    pop_w = 1 - pw

    blended = {}
    for param in ["theta", "alpha", "beta_below", "beta_above"]:
        p_mean = personal_posterior.get(f"{param}_mean", 0)
        p_std = personal_posterior.get(f"{param}_std", 1)
        pop_mean = prior_spec.get(f"{param}_mu", p_mean)
        pop_std = prior_spec.get(f"{param}_sigma", p_std)

        # Weighted mean
        blended[f"{param}_mean"] = pw * p_mean + pop_w * pop_mean
        # Combined std (conservative: max of weighted combo)
        blended[f"{param}_std"] = np.sqrt(pw * p_std**2 + pop_w * pop_std**2)

    blended["personal_weight"] = pw
    blended["population_weight"] = pop_w
    blended["n_personal"] = n_personal
    blended["sigma_mean"] = personal_posterior.get("sigma_mean", 1)

    return blended


def compute_treatment_effect(
    posterior: Dict,
    current_value: float,
    target_value: float,
) -> Dict:
    """
    Compute expected treatment effect of changing source from current to target.

    Returns point estimate and uncertainty of the effect on the target variable.
    """
    theta = posterior["theta_mean"]
    bb = posterior["beta_below_mean"]
    ba = posterior["beta_above_mean"]
    alpha = posterior["alpha_mean"]

    # Y at current value
    if current_value <= theta:
        y_current = alpha + bb * (current_value - theta)
    else:
        y_current = alpha + ba * (current_value - theta)

    # Y at target value
    if target_value <= theta:
        y_target = alpha + bb * (target_value - theta)
    else:
        y_target = alpha + ba * (target_value - theta)

    delta = y_target - y_current

    return {
        "current_value": current_value,
        "target_value": target_value,
        "y_current": round(y_current, 2),
        "y_target": round(y_target, 2),
        "delta": round(delta, 2),
        "direction": "up" if delta > 0 else "down" if delta < 0 else "stable",
    }


def compute_changepoint_probability(worlds: Dict) -> float:
    """
    Estimate probability that a changepoint exists by measuring
    how often beta_below and beta_above differ meaningfully across worlds.
    """
    bb = np.array(worlds["beta_below"])
    ba = np.array(worlds["beta_above"])

    # Proportion of worlds where the slopes differ by at least 20%
    ratio = np.abs(ba - bb) / (np.abs(bb) + 1e-6)
    prob = float(np.mean(ratio > 0.2))

    return round(prob, 3)


def categorize_effect_size(
    beta_mean: float,
    beta_std: float,
    baseline_value: float,
) -> str:
    """Categorize effect size as small/medium/large relative to baseline."""
    if baseline_value == 0:
        return "small"

    pct_effect = abs(beta_mean) / abs(baseline_value) * 100

    if pct_effect < 5:
        return "small"
    elif pct_effect < 15:
        return "medium"
    else:
        return "large"
