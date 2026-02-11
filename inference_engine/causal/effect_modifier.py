"""
Location effect modification diagnostic.

For each causal edge, checks whether the dose-response relationship
differs meaningfully between Israel and US periods. This is a side
analysis — not a permanent split — that flags edges where location
modifies the causal effect.

Method:
1. Fit BCEL on pooled data (the real estimate)
2. Fit BCEL on Israel-only and US-only subsets
3. Compare theta and beta posteriors using overlap metrics
4. Flag edges where the curves diverge significantly

The output is a metadata flag per edge, not a separate insight.
Small sample sizes (especially Israel with ~170 workouts) mean
we require strong evidence to flag a modifier.
"""
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from inference_engine.causal.edge_table import EdgeSpec
from inference_engine.inference.bcel import fit_edge
from inference_engine.inference.population_priors import get_prior


@dataclass
class EffectModResult:
    """Result of location effect modification test for one edge."""
    edge_name: str
    # Pooled fit (the main result)
    pooled_theta: float
    pooled_beta_below: float
    pooled_beta_above: float
    pooled_n: int
    # Israel fit
    israel_theta: Optional[float]
    israel_beta_below: Optional[float]
    israel_beta_above: Optional[float]
    israel_n: int
    # US fit
    us_theta: Optional[float]
    us_beta_below: Optional[float]
    us_beta_above: Optional[float]
    us_n: int
    # Comparison
    theta_shift: Optional[float]       # Absolute difference in theta
    theta_shift_pct: Optional[float]   # % shift relative to pooled theta
    beta_below_shift: Optional[float]  # Absolute difference in beta_below
    beta_above_shift: Optional[float]  # Absolute difference in beta_above
    # Verdict
    is_modified: bool                  # True if location significantly modifies
    modifier_strength: str             # "none", "weak", "moderate", "strong"
    explanation: str


def run_effect_modification_test(
    edges: List[EdgeSpec],
    timeline,
    min_obs_per_stratum: int = 15,
    verbose: bool = True,
) -> List[EffectModResult]:
    """
    Run location effect modification analysis for all edges.

    For each edge:
    1. Split timeline into Israel and US periods
    2. Fit BCEL on each stratum (if enough data)
    3. Compare posteriors
    4. Flag significant modifiers

    Args:
        edges: Discovered EdgeSpecs
        timeline: Full daily timeline DataFrame
        min_obs_per_stratum: Minimum observations per location to test
        verbose: Print progress
    """
    import pandas as pd
    from inference_engine.data_prep.timeline_builder import extract_dose_response

    if "location" not in timeline.columns:
        if verbose:
            print("No location column in timeline. Skipping effect modification test.")
        return []

    # Split timeline
    tl_israel = timeline[timeline["location"] == "israel"].copy()
    tl_us = timeline[timeline["location"] == "us"].copy()

    if verbose:
        print(f"\n{'=' * 60}")
        print(f"Location Effect Modification Analysis")
        print(f"{'=' * 60}")
        print(f"  Israel days: {len(tl_israel)}")
        print(f"  US days:     {len(tl_us)}")

    results = []

    for edge in edges:
        if verbose:
            print(f"\n  {edge.name}")

        # 1. Pooled fit (already done in main pipeline, but we need the values)
        pooled_result = _fit_stratum(edge, timeline, extract_dose_response)
        if pooled_result is None:
            if verbose:
                print(f"    SKIP: no pooled data")
            continue

        pooled_post, pooled_n = pooled_result

        # 2. Israel fit
        israel_result = _fit_stratum(edge, tl_israel, extract_dose_response)
        israel_n = 0
        israel_post = None
        if israel_result is not None:
            israel_post, israel_n = israel_result

        # 3. US fit
        us_result = _fit_stratum(edge, tl_us, extract_dose_response)
        us_n = 0
        us_post = None
        if us_result is not None:
            us_post, us_n = us_result

        # 4. Compare
        if israel_post is None or us_post is None:
            reason = "israel" if israel_post is None else "US"
            if verbose:
                print(f"    SKIP: insufficient {reason} data "
                      f"(israel={israel_n}, us={us_n}, need {min_obs_per_stratum})")

            results.append(EffectModResult(
                edge_name=edge.name,
                pooled_theta=pooled_post["theta_mean"],
                pooled_beta_below=pooled_post["beta_below_mean"],
                pooled_beta_above=pooled_post["beta_above_mean"],
                pooled_n=pooled_n,
                israel_theta=israel_post["theta_mean"] if israel_post else None,
                israel_beta_below=israel_post["beta_below_mean"] if israel_post else None,
                israel_beta_above=israel_post["beta_above_mean"] if israel_post else None,
                israel_n=israel_n,
                us_theta=us_post["theta_mean"] if us_post else None,
                us_beta_below=us_post["beta_below_mean"] if us_post else None,
                us_beta_above=us_post["beta_above_mean"] if us_post else None,
                us_n=us_n,
                theta_shift=None,
                theta_shift_pct=None,
                beta_below_shift=None,
                beta_above_shift=None,
                is_modified=False,
                modifier_strength="insufficient_data",
                explanation=f"Insufficient data in one stratum (IL={israel_n}, US={us_n})",
            ))
            continue

        # Both strata fitted successfully
        theta_shift = abs(israel_post["theta_mean"] - us_post["theta_mean"])
        theta_denom = abs(pooled_post["theta_mean"]) if abs(pooled_post["theta_mean"]) > 1e-6 else 1.0
        theta_shift_pct = theta_shift / theta_denom * 100

        bb_shift = abs(israel_post["beta_below_mean"] - us_post["beta_below_mean"])
        ba_shift = abs(israel_post["beta_above_mean"] - us_post["beta_above_mean"])

        # Compute overlap significance using posterior SDs
        # Two Gaussians: significant if |mu1 - mu2| > 2 * sqrt(se1^2 + se2^2)
        theta_se_pooled = np.sqrt(
            israel_post["theta_std"] ** 2 + us_post["theta_std"] ** 2
        )
        bb_se_pooled = np.sqrt(
            israel_post["beta_below_std"] ** 2 + us_post["beta_below_std"] ** 2
        )
        ba_se_pooled = np.sqrt(
            israel_post["beta_above_std"] ** 2 + us_post["beta_above_std"] ** 2
        )

        # Z-scores for each parameter
        theta_z = theta_shift / max(theta_se_pooled, 1e-8)
        bb_z = bb_shift / max(bb_se_pooled, 1e-8)
        ba_z = ba_shift / max(ba_se_pooled, 1e-8)
        max_z = max(theta_z, bb_z, ba_z)

        # Classification
        if max_z > 3.0 and theta_shift_pct > 20:
            strength = "strong"
            is_modified = True
        elif max_z > 2.0 and theta_shift_pct > 10:
            strength = "moderate"
            is_modified = True
        elif max_z > 1.5:
            strength = "weak"
            is_modified = False  # Not enough evidence
        else:
            strength = "none"
            is_modified = False

        # Build explanation
        if is_modified:
            explanation = (
                f"Theta differs: IL={israel_post['theta_mean']:.1f} vs "
                f"US={us_post['theta_mean']:.1f} ({theta_shift_pct:.0f}% shift, z={theta_z:.1f}). "
            )
            if bb_z > 2.0:
                explanation += (
                    f"Below-threshold slope differs: IL={israel_post['beta_below_mean']:.3f} "
                    f"vs US={us_post['beta_below_mean']:.3f}. "
                )
            if ba_z > 2.0:
                explanation += (
                    f"Above-threshold slope differs: IL={israel_post['beta_above_mean']:.3f} "
                    f"vs US={us_post['beta_above_mean']:.3f}. "
                )
        else:
            explanation = (
                f"No significant location effect (max z={max_z:.1f}, "
                f"theta shift={theta_shift_pct:.0f}%)."
            )

        if verbose:
            il_t = israel_post["theta_mean"]
            us_t = us_post["theta_mean"]
            flag = " ***" if is_modified else ""
            print(f"    IL: theta={il_t:.1f} bb={israel_post['beta_below_mean']:.3f} "
                  f"ba={israel_post['beta_above_mean']:.3f} (n={israel_n})")
            print(f"    US: theta={us_t:.1f} bb={us_post['beta_below_mean']:.3f} "
                  f"ba={us_post['beta_above_mean']:.3f} (n={us_n})")
            print(f"    Shift: {theta_shift_pct:.0f}% max_z={max_z:.1f} -> {strength}{flag}")

        results.append(EffectModResult(
            edge_name=edge.name,
            pooled_theta=pooled_post["theta_mean"],
            pooled_beta_below=pooled_post["beta_below_mean"],
            pooled_beta_above=pooled_post["beta_above_mean"],
            pooled_n=pooled_n,
            israel_theta=israel_post["theta_mean"],
            israel_beta_below=israel_post["beta_below_mean"],
            israel_beta_above=israel_post["beta_above_mean"],
            israel_n=israel_n,
            us_theta=us_post["theta_mean"],
            us_beta_below=us_post["beta_below_mean"],
            us_beta_above=us_post["beta_above_mean"],
            us_n=us_n,
            theta_shift=theta_shift,
            theta_shift_pct=theta_shift_pct,
            beta_below_shift=bb_shift,
            beta_above_shift=ba_shift,
            is_modified=is_modified,
            modifier_strength=strength,
            explanation=explanation,
        ))

    # Summary
    if verbose:
        n_modified = sum(1 for r in results if r.is_modified)
        n_tested = sum(1 for r in results if r.modifier_strength != "insufficient_data")
        n_skipped = sum(1 for r in results if r.modifier_strength == "insufficient_data")
        print(f"\n{'=' * 60}")
        print(f"Effect Modification Summary")
        print(f"  Tested:   {n_tested} edges")
        print(f"  Skipped:  {n_skipped} edges (insufficient data in one stratum)")
        print(f"  Modified: {n_modified} edges show location effect")
        if n_modified > 0:
            print(f"\n  Modified edges:")
            for r in results:
                if r.is_modified:
                    print(f"    {r.edge_name}: {r.modifier_strength}")
                    print(f"      {r.explanation}")

    return results


def _fit_stratum(
    edge: EdgeSpec,
    timeline,
    extract_fn,
) -> Optional[Tuple[Dict, int]]:
    """
    Fit BCEL on a single stratum (subset of timeline).
    Returns (posterior_dict, n_observations) or None.
    """
    result = extract_fn(
        timeline,
        dose_variable=edge.dose_variable,
        dose_window=edge.dose_window,
        dose_agg=edge.dose_agg,
        response_variable=edge.response_variable,
        response_lag=edge.response_lag,
        min_observations=max(edge.min_observations, 3),
    )

    if result is None:
        return None

    # Unpack (x, y) or (x, y, Z) — ignore covariates for stratified fit
    if len(result) == 3:
        x, y, _ = result
    else:
        x, y = result

    if len(x) < 3:
        return None

    try:
        posterior = fit_edge(x, y, edge.prior_key, use_pymc=False)
        return posterior, len(x)
    except Exception:
        return None


def add_modifier_flags_to_insights(
    insight_json: Dict,
    modifier_results: List[EffectModResult],
) -> Dict:
    """
    Add location effect modification flags to insight JSON.
    """
    mod_by_name = {r.edge_name: r for r in modifier_results}

    for insight in insight_json.get("insights", []):
        edge_name = insight.get("title", "")
        result = mod_by_name.get(edge_name)

        if result is None:
            continue

        insight["locationEffect"] = {
            "isModified": result.is_modified,
            "strength": result.modifier_strength,
            "explanation": result.explanation,
        }

        if result.israel_theta is not None and result.us_theta is not None:
            insight["locationEffect"]["stratified"] = {
                "israel": {
                    "theta": result.israel_theta,
                    "betaBelow": result.israel_beta_below,
                    "betaAbove": result.israel_beta_above,
                    "observations": result.israel_n,
                },
                "us": {
                    "theta": result.us_theta,
                    "betaBelow": result.us_beta_below,
                    "betaAbove": result.us_beta_above,
                    "observations": result.us_n,
                },
            }

    return insight_json


# ===================================================================
# CLI
# ===================================================================

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    import pandas as pd
    from inference_engine.config import DAILY_TIMELINE_CSV
    from inference_engine.causal.edge_discovery import discover_edges

    timeline = pd.read_csv(DAILY_TIMELINE_CSV, parse_dates=["date"])
    print(f"Timeline: {timeline.shape}")

    edges = discover_edges(timeline, verbose=False)
    print(f"Edges: {len(edges)}")

    results = run_effect_modification_test(edges, timeline, verbose=True)
