"""
Run BCEL fitting on all edges and generate insight JSON.

This is the main pipeline script that:
1. Loads the daily timeline (or builds it if missing)
2. Discovers testable edges from available data (or uses hardcoded edge table)
3. Computes backdoor adjustment sets using Pearl's criterion
4. Extracts dose-response pairs
5. Fits BCEL model
6. Classifies shape from posterior
7. Generates Thompson Sampling worlds
8. Outputs CausalParameters JSON per edge
9. Saves all results to oron_insights.json
"""
import json
import time
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional

from inference_engine.config import OUTPUT_DIR, DAILY_TIMELINE_CSV, THOMPSON_WORLDS
from inference_engine.causal.edge_table import ALL_EDGES, DISPLAY_FNS, EdgeSpec
from inference_engine.inference.bcel import fit_edge
from inference_engine.inference.population_priors import get_prior, scale_prior_to_dose_window, get_biomarker_noise
from inference_engine.inference.shape_classifier import (
    posterior_to_causal_params,
    classify_shape,
)


def _load_timeline():
    """Load the daily timeline, building it if needed."""
    import pandas as pd

    if DAILY_TIMELINE_CSV.exists():
        print(f"Loading existing timeline: {DAILY_TIMELINE_CSV}")
        df = pd.read_csv(DAILY_TIMELINE_CSV, parse_dates=["date"])
        print(f"  Shape: {df.shape}")
        return df

    print("Timeline CSV not found. Building from scratch...")
    from inference_engine.data_prep.timeline_builder import build_daily_timeline
    return build_daily_timeline()


def _infer_dose_unit(dose_variable: str) -> str:
    """Infer the unit of the dose column from its name."""
    if dose_variable.endswith("_min") or "duration_min" in dose_variable or "zone2_min" in dose_variable:
        return "min"
    if dose_variable.endswith("_km") or "run_km" in dose_variable or "distance_km" in dose_variable:
        return "km"
    if dose_variable.endswith("_kcal") or "energy_kcal" in dose_variable:
        return "kcal"
    if "steps" in dose_variable:
        return "steps"
    if "hour" in dose_variable:
        return "hour"
    return ""


def _compute_effective_n(timeline, response_var: str, timescale: str, n_aligned: int) -> int:
    """
    Compute effective independent sample size for certainty weighting.

    For smoothed lab markers (6 actual draws), the effective N is the number
    of raw lab draws, not the 1500+ interpolated daily values.
    For daily metrics, we account for autocorrelation by dividing by
    an estimated autocorrelation length.
    """
    # If response is a smoothed lab marker, count actual raw observations
    if response_var.endswith("_smoothed"):
        raw_col = response_var.replace("_smoothed", "_raw")
        if raw_col in timeline.columns:
            raw_count = int(timeline[raw_col].notna().sum())
            if raw_count > 0:
                return raw_count

    # For slow-timescale responses (labs), cap at a conservative number
    if timescale == "slow":
        # Labs are drawn ~every 3-6 months; even with daily interpolation
        # the independent information content is low
        return min(n_aligned, 20)

    # For medium timescale (weekly rolling averages), divide by ~7
    if timescale == "medium":
        return max(1, n_aligned // 7)

    # For fast timescale (daily), modest autocorrelation correction (~3 days)
    return max(1, n_aligned // 3)


def _infer_response_family_id(response_var: str) -> Optional[str]:
    """
    Infer response family ID from a response variable column name.

    Strips suffixes like _smoothed, _raw, _pct, _min, _mean, _7d, etc.
    and matches against RESPONSE_FAMILIES keys. Uses the reverse lookup
    from actual column names defined in each ResponseFamily.

    Returns the family ID (e.g., 'testosterone', 'hrv_daily') or None.
    """
    try:
        from inference_engine.causal.edge_discovery import RESPONSE_FAMILIES
    except ImportError:
        return None

    # First: direct lookup by checking if response_var is in any family's columns
    for fam_id, fam in RESPONSE_FAMILIES.items():
        if response_var in fam.columns:
            return fam_id

    # Second: strip common suffixes and try matching the base against family IDs
    base = response_var
    for suffix in ["_smoothed", "_raw", "_pct", "_min", "_mean", "_7d_mean",
                   "_7d", "_score", "_hrs", "_ms", "_bpm", "_derived"]:
        base = base.replace(suffix, "")
    base = base.rstrip("_")

    if base in RESPONSE_FAMILIES:
        return base

    # Third: try partial matches (e.g., "sleep_efficiency_pct" -> "sleep_efficiency")
    for fam_id in RESPONSE_FAMILIES:
        if base.startswith(fam_id) or fam_id.startswith(base):
            return fam_id

    return None


def fit_single_edge(edge: EdgeSpec, timeline, verbose: bool = True) -> Optional[Dict]:
    """
    Fit BCEL on a single edge and return CausalParameters dict.
    """
    from inference_engine.data_prep.timeline_builder import (
        extract_dose_response,
        get_current_dose,
    )

    if verbose:
        print(f"\n  [{edge.category:10s}] {edge.name}")
        print(f"    Dose: {edge.dose_variable} (window={edge.dose_window}d, agg={edge.dose_agg})")
        print(f"    Response: {edge.response_variable} (lag={edge.response_lag}d)")

    # Extract dose-response data (with covariates if adjustment set present)
    adj_set = edge.adjustment_set if edge.adjustment_set else None
    result = extract_dose_response(
        timeline,
        dose_variable=edge.dose_variable,
        dose_window=edge.dose_window,
        dose_agg=edge.dose_agg,
        response_variable=edge.response_variable,
        response_lag=edge.response_lag,
        min_observations=edge.min_observations,
        adjustment_set=adj_set,
    )

    if result is None:
        if verbose:
            print(f"    SKIPPED: insufficient data")
        return None

    # Unpack: (x, y) or (x, y, Z)
    if len(result) == 3:
        x, y, Z = result
    else:
        x, y = result
        Z = None

    # For any edge where the response is a smoothed lab marker, subsample to
    # raw draw dates only. Using the windowed dose aggregate at each real draw
    # date gives us n=2-6 real (dose, response) pairs with full likelihood
    # weight. Even sparse confirmatory data genuinely tightens the posterior
    # vs. using 600 interpolated values with likelihood_weight=0.006.
    resp_is_smoothed = edge.response_variable.endswith("_smoothed")
    dose_is_smoothed = edge.dose_variable.endswith("_smoothed")
    using_raw_draws = False
    marker_to_marker = False
    if resp_is_smoothed:
        resp_raw_col = edge.response_variable.replace("_smoothed", "_raw")
        if resp_raw_col in timeline.columns:
            raw_mask = timeline[resp_raw_col].notna()
            # For marker→marker, also require dose raw col
            if dose_is_smoothed:
                dose_raw_col = edge.dose_variable.replace("_smoothed", "_raw")
                if dose_raw_col in timeline.columns:
                    raw_mask = raw_mask & timeline[dose_raw_col].notna()
                    marker_to_marker = True
            n_raw = int(raw_mask.sum())
            if n_raw >= edge.min_observations:
                raw_rows = timeline[raw_mask]
                # Use the windowed dose aggregate (already computed in timeline) at draw dates
                x_at_draws = raw_rows[edge.dose_variable].values
                y_at_draws = raw_rows[edge.response_variable].values
                # Only use if dose has variance at draw dates
                if len(x_at_draws) >= 2 and x_at_draws.std() > 1e-10:
                    x = x_at_draws
                    y = y_at_draws
                    Z = None  # covariates on raw draw dates are unreliable with n<6
                    using_raw_draws = True
                    label = "Marker->Marker" if marker_to_marker else "Wearable->Lab"
                    if verbose:
                        print(f"    {label}: using {n_raw} raw draw dates (not {len(result[0])} interpolated)")

    if verbose:
        print(f"    Data: {len(x)} observations, dose range [{x.min():.1f}, {x.max():.1f}]")
        if Z is not None:
            print(f"    Adjusting for {Z.shape[1]} covariate(s): {adj_set}")

    # Scale prior to match dose window and units (e.g., weekly prior in hrs → 28-day dose sum in min)
    raw_prior = get_prior(edge.prior_key)
    scaled_prior = None
    if raw_prior:
        # Infer dose unit from column name for unit conversion detection
        dose_unit = _infer_dose_unit(edge.dose_variable)
        scaled_prior = scale_prior_to_dose_window(
            raw_prior, edge.dose_window, edge.dose_agg, dose_unit=dose_unit
        )
        if scaled_prior is not raw_prior and verbose:
            print(f"    Prior scaled: theta {raw_prior.theta_mu:.1f} -> {scaled_prior.theta_mu:.1f} "
                  f"({raw_prior.theta_unit} -> {scaled_prior.theta_unit})")

    # Compute likelihood weight to prevent interpolated data from overwhelming the prior
    # For edges subsampled to raw lab draws, use full likelihood weight —
    # these ARE the real observations, no tempering needed.
    if using_raw_draws:
        effective_n = len(x)
        lw = 1.0
    else:
        effective_n = _compute_effective_n(
            timeline, edge.response_variable, edge.biological_timescale, len(x)
        )
        lw = min(1.0, effective_n / max(len(x), 1))
    if verbose and lw < 1.0:
        print(f"    Likelihood weight: {lw:.3f} (effectiveN={effective_n}, rawN={len(x)})")

    # Compute informative sigma prior from known biomarker CV
    sigma_prior_log_mu = None
    sigma_prior_log_sigma = None
    sigma_prior_blend = None
    noise_cv_total = None

    resp_family_id = _infer_response_family_id(edge.response_variable)
    if resp_family_id:
        noise_spec = get_biomarker_noise(resp_family_id)
        if noise_spec is not None:
            y_mean = float(np.mean(np.abs(y))) if len(y) > 0 else 1.0
            sigma_expected = y_mean * noise_spec.cv_total
            if sigma_expected > 1e-10:
                sigma_prior_log_mu = float(np.log(sigma_expected))
                sigma_prior_log_sigma = 0.5  # ~2.7x range at 2 std
                # Blend: strong for sparse data, fades for dense
                sigma_prior_blend = 1.0 / (1.0 + effective_n / 20.0)
                noise_cv_total = noise_spec.cv_total
                if verbose:
                    print(f"    Sigma prior: expected={sigma_expected:.1f} "
                          f"(CV={noise_spec.cv_total:.2f}, y_mean={y_mean:.1f}), "
                          f"blend={sigma_prior_blend:.2f}")

    # Fit BCEL (with covariates for backdoor adjustment)
    # Use grid-conditional Laplace for ALL edges so every edge gets Oron's
    # own posterior samples (unique threshold + effect size). The likelihood
    # weight already handles data sparsity — prior-dominated edges stay
    # prior-dominated, but data-rich edges get proper multi-modal posteriors.
    use_mcmc = True
    if verbose:
        print(f"    Grid-conditional Laplace (effectiveN={effective_n}, lw={lw:.3f})")
    try:
        posterior = fit_edge(x, y, edge.prior_key, Z=Z, use_pymc=use_mcmc,
                             prior_override=scaled_prior,
                             likelihood_weight=lw,
                             sigma_prior_log_mu=sigma_prior_log_mu,
                             sigma_prior_log_sigma=sigma_prior_log_sigma,
                             sigma_prior_blend=sigma_prior_blend)
    except Exception as e:
        if verbose:
            print(f"    FIT ERROR: {e}")
        return None

    if verbose:
        print(f"    Theta: {posterior['theta_mean']:.2f} ± {posterior['theta_std']:.2f}")
        print(f"    Beta below: {posterior['beta_below_mean']:.3f}, above: {posterior['beta_above_mean']:.3f}")
        print(f"    Converged: {posterior.get('converged', 'N/A')}")

    # Get current dose for status computation
    current_dose = get_current_dose(
        timeline, edge.dose_variable, edge.dose_window, edge.dose_agg
    )

    # Get display function
    display_fn = DISPLAY_FNS.get(edge.theta_display_fn_name) if edge.theta_display_fn_name else None

    # Get prior curve hint (use raw prior — curve type doesn't change with scaling)
    prior_hint = raw_prior.curve_type if raw_prior else "linear"

    # Convert to CausalParameters JSON
    causal_params = posterior_to_causal_params(
        posterior=posterior,
        source_name=edge.dose_variable,
        target_name=edge.response_variable,
        theta_unit=edge.theta_unit,
        theta_display_fn=display_fn,
        effect_unit=edge.effect_unit,
        per_unit=edge.per_unit,
        current_value=current_dose,
        prior_curve_hint=prior_hint,
        n_worlds=THOMPSON_WORLDS,
    )

    # Compute effective sample size for certainty weighting
    # Smoothed lab markers have far fewer independent observations than timeline rows
    effective_n = _compute_effective_n(
        timeline, edge.response_variable, edge.biological_timescale, len(x)
    )
    causal_params["effectiveN"] = effective_n

    # Add edge metadata
    causal_params["edgeKey"] = edge.edge_key
    causal_params["edgeName"] = edge.name
    causal_params["category"] = edge.category
    causal_params["mechanism"] = edge.mechanism
    causal_params["biologicalTimescale"] = edge.biological_timescale
    causal_params["dataSources"] = edge.data_sources
    causal_params["adjustmentSet"] = edge.adjustment_set

    # Add prior info for transparency and certainty computation
    if raw_prior:
        causal_params["priorSource"] = raw_prior.source
        causal_params["priorCurveHint"] = raw_prior.curve_type
        causal_params["evidenceTier"] = raw_prior.evidence_tier
        # Store prior beta signs for mechanism-contradiction detection
        causal_params["priorBetaBelowSign"] = 1 if raw_prior.beta_below_mu >= 0 else -1
        causal_params["priorBetaAboveSign"] = 1 if raw_prior.beta_above_mu >= 0 else -1
        # Store prior beta sigmas for Bayesian precision-based personal weight
        causal_params["priorBetaBelowSigma"] = raw_prior.beta_below_sigma
        causal_params["priorBetaAboveSigma"] = raw_prior.beta_above_sigma

    # Store posterior beta stds and residual sigma for precision computation
    causal_params["posteriorBetaBelowStd"] = posterior.get("beta_below_std")
    causal_params["posteriorBetaAboveStd"] = posterior.get("beta_above_std")
    causal_params["residualSigma"] = posterior.get("sigma_mean")

    # Store sigma prior transparency metadata
    if noise_cv_total is not None:
        y_mean_val = float(np.mean(np.abs(y))) if len(y) > 0 else None
        causal_params["sigmaExpected"] = y_mean_val * noise_cv_total if y_mean_val else None
        causal_params["cvTotal"] = noise_cv_total
        causal_params["sigmaPriorBlend"] = sigma_prior_blend

    # Flag degenerate fits
    theta_val = causal_params["theta"]["value"]
    if len(x) > 0:
        x_range = float(np.max(x) - np.min(x))
        x_min = float(np.min(x))
        x_max = float(np.max(x))

        # Check 1: theta at data boundary
        theta_at_boundary = (
            abs(theta_val - x_min) < 0.01 * (x_range + 1e-6) or
            abs(theta_val - x_max) < 0.01 * (x_range + 1e-6)
        )

        # Check 2: theta at or below zero for non-negative dose variables
        # (e.g., travel_load, steps, kcal — a threshold of 0 is meaningless)
        theta_at_zero = (theta_val <= 0 and x_min >= 0)

        # Check 3: near-zero effect sizes on both sides (no real changepoint)
        bb = abs(causal_params["betaBelow"]["value"])
        ba = abs(causal_params["betaAbove"]["value"])
        max_effect = max(bb, ba)
        near_zero_effect = (max_effect < 1e-3)

        if theta_at_boundary or theta_at_zero or near_zero_effect:
            causal_params["degenerate"] = True
            reason = ("at boundary" if theta_at_boundary
                      else "at zero" if theta_at_zero
                      else "near-zero effect")
            if verbose:
                print(f"    WARNING: degenerate fit ({reason}, theta={theta_val:.2f}) — excluding")

    if verbose:
        shape = causal_params["curveType"]
        cp_prob = causal_params["changepointProb"]
        size = causal_params["sizeCategory"]
        status = causal_params.get("currentStatus", "N/A")
        print(f"    Shape: {shape}, CP prob: {cp_prob:.2f}, Size: {size}, Status: {status}")

    return causal_params


def run_all_edges(
    timeline=None,
    tiers: Optional[List[int]] = None,
    use_discovery: bool = True,
    verbose: bool = True,
) -> List[Dict]:
    """
    Run BCEL on all edges (or specified tiers) and return results.

    Args:
        timeline: Pre-loaded timeline DataFrame. Built if None.
        tiers: If set, only run edges from these tiers (hardcoded table only).
        use_discovery: If True, use automatic edge discovery + backdoor
                       identification instead of the hardcoded edge table.
        verbose: Print progress.
    """
    if timeline is None:
        timeline = _load_timeline()

    if use_discovery and not tiers:
        # Use automatic edge discovery
        from inference_engine.causal.edge_discovery import discover_edges, discover_adjustment_sets
        from inference_engine.causal.backdoor import compute_adjustment_sets, update_edges_with_adjustment_sets

        edges = discover_edges(timeline, verbose=verbose)

        # Compute algorithmic backdoor adjustment sets
        if verbose:
            print("\nComputing backdoor adjustment sets...")
        dag, adj_results = compute_adjustment_sets(
            edges, set(timeline.columns), verbose=verbose
        )
        edges = update_edges_with_adjustment_sets(edges, adj_results)

        # Store frontdoor paths for reporting
        frontdoor_info = {
            r.edge_name: r.frontdoor_paths
            for r in adj_results if r.frontdoor_paths
        }
        if verbose and frontdoor_info:
            print(f"\nFrontdoor paths found for {len(frontdoor_info)} edges")
    else:
        # Fall back to hardcoded edge table
        from inference_engine.causal.edge_table import get_edges_by_tier
        if tiers:
            edges = []
            for t in tiers:
                edges.extend(get_edges_by_tier(t))
        else:
            edges = ALL_EDGES
        frontdoor_info = {}

    print(f"\n{'=' * 60}")
    print(f"Running BCEL on {len(edges)} edges")
    print(f"{'=' * 60}")

    results = []
    skipped = []
    errors = []
    degenerate = []

    for i, edge in enumerate(edges):
        t0 = time.time()
        try:
            result = fit_single_edge(edge, timeline, verbose=verbose)
            if result:
                if result.get("degenerate"):
                    degenerate.append(edge.name)
                    # Still include but mark — let the frontend decide
                results.append(result)
            else:
                skipped.append(edge.name)
        except Exception as e:
            errors.append((edge.name, str(e)))
            if verbose:
                print(f"    ERROR: {e}")

        elapsed = time.time() - t0
        if verbose:
            print(f"    ({elapsed:.1f}s)")

    # Summary
    print(f"\n{'=' * 60}")
    print(f"Results: {len(results)} fitted, {len(skipped)} skipped, {len(errors)} errors"
          f"{f', {len(degenerate)} degenerate' if degenerate else ''}")
    if skipped:
        print(f"  Skipped: {', '.join(skipped)}")
    if errors:
        print(f"  Errors: {', '.join(f'{n}: {e}' for n, e in errors)}")
    if degenerate:
        print(f"  Degenerate: {', '.join(degenerate)}")

    return results


def build_insight_json(causal_results: List[Dict]) -> Dict:
    """
    Convert BCEL results into the full insight JSON structure
    matching the Serif TypeScript Insight interface.
    """
    insights = []

    for i, cp in enumerate(causal_results):
        action = _recommend_action(cp)
        certainty_info = _compute_certainty(cp)
        headline = _generate_headline(cp)
        explanation = _generate_explanation(cp)

        # Determine variableType following COMPLE:
        # "marker" for slow biology, "load" for accumulated loads, "outcome" for fast observables
        ts = cp.get("biologicalTimescale", "fast")
        if ts == "slow":
            var_type = "marker"
        elif cp.get("category") == "recovery" and ts == "medium":
            var_type = "load"
        else:
            var_type = "outcome"

        # Build the causalParams sub-object
        causal_params = {
            "source": cp["source"],
            "target": cp["target"],
            "curveType": cp["curveType"],
            "theta": cp["theta"],
            "betaBelow": cp["betaBelow"],
            "betaAbove": cp["betaAbove"],
            "observations": cp["observations"],
            "completePct": cp["completePct"],
            "changepointProb": cp["changepointProb"],
            "sizeCategory": cp["sizeCategory"],
            "posteriorSamples": cp["posteriorSamples"],
        }
        if "currentValue" in cp and cp["currentValue"] is not None:
            causal_params["currentValue"] = cp["currentValue"]
            causal_params["currentStatus"] = cp.get("currentStatus", "unknown")

        # Propagate degenerate flag so downstream filters can see it
        if cp.get("degenerate"):
            causal_params["degenerate"] = True

        # Propagate effectiveN for downstream filtering
        if "effectiveN" in cp:
            causal_params["effectiveN"] = cp["effectiveN"]

        # Propagate prior beta signs for mechanism-contradiction detection
        if "priorBetaBelowSign" in cp:
            causal_params["priorBetaBelowSign"] = cp["priorBetaBelowSign"]
            causal_params["priorBetaAboveSign"] = cp["priorBetaAboveSign"]

        # Clean display names: remove _smoothed, _raw, _pct suffixes for readability
        def _clean_name(name: str) -> str:
            return (name.replace("_smoothed", "").replace("_raw", "")
                    .replace("_", " ").strip().title())

        # Determine cause direction
        bb = cp["betaBelow"]["value"]
        ba = cp["betaAbove"]["value"]
        cause_direction = "above" if abs(ba) > abs(bb) else "below"

        # Build effect description for outcome
        active_beta = ba if abs(ba) > abs(bb) else bb
        effect_desc = f"{abs(active_beta):.2f} {cp['betaAbove'].get('unit', '')} {cp.get('per_unit', '')}"

        # Certainty score (0-1 scale — frontend multiplies by 100 for display)
        # Four components:
        #   - effectReliability (35%): How consistently does the dominant effect appear
        #     across posterior worlds? (replaces changepointProb which unfairly
        #     penalizes linear relationships for not having a threshold)
        #   - personalWeight   (25%): How much personal data do we have?
        #   - priorStrength    (25%): How strong is the population evidence?
        #   - dataAdequacy     (15%): Do we have enough effective observations?
        import numpy as np
        samples = cp.get("posteriorSamples", {})
        bb_samples = np.array(samples.get("betaBelow", [0]))
        ba_samples = np.array(samples.get("betaAbove", [0]))
        # Effect reliability: fraction of worlds where the dominant beta
        # is non-zero in the same direction as its mean
        bb_mean = float(np.mean(bb_samples))
        ba_mean = float(np.mean(ba_samples))
        dominant_samples = ba_samples if abs(ba_mean) >= abs(bb_mean) else bb_samples
        dominant_mean = ba_mean if abs(ba_mean) >= abs(bb_mean) else bb_mean
        if dominant_mean > 0:
            effect_reliability = float(np.mean(dominant_samples > 0))
        elif dominant_mean < 0:
            effect_reliability = float(np.mean(dominant_samples < 0))
        else:
            effect_reliability = 0.5
        # Data adequacy: sigmoid centered at 50 effective observations
        eff_n = cp.get("effectiveN", cp.get("observations", 0))
        import math
        data_adequacy = 1.0 / (1.0 + math.exp(-0.06 * (eff_n - 50)))

        pw = certainty_info["personalWeight"]
        ps = certainty_info["priorStrength"]
        certainty_score = round(min(
            effect_reliability * 0.35 + pw * 0.25 + ps * 0.25 + data_adequacy * 0.15,
            0.99
        ), 2)

        insight = {
            "id": f"oron_insight_{i + 1}",
            "personaId": "oron",
            "category": cp["category"],
            "variableType": var_type,
            "title": cp["edgeName"],
            "headline": headline,
            "recommendation": action,
            "explanation": explanation,

            "causalParams": causal_params,

            "cause": {
                "behavior": _clean_name(cp["source"]),
                "threshold": cp["theta"]["value"],
                "unit": cp["theta"]["unit"],
                "direction": cause_direction,
            },

            "outcome": {
                "metric": _clean_name(cp["target"]),
                "effect": effect_desc.strip(),
                "direction": "negative" if active_beta < 0 else "positive",
            },

            "certainty": certainty_score,
            "evidenceWeight": certainty_info["personalWeight"],
            "evidence": {
                "personalDays": cp.get("observations", 0),
                "personalWeight": certainty_info["personalWeight"],
                "populationWeight": certainty_info["populationWeight"],
                "priorStrength": certainty_info["priorStrength"],
                "evidenceTier": certainty_info["evidenceTier"],
                "stability": cp.get("changepointProb", 0.5),
                "effectReliability": effect_reliability,
                "dataAdequacy": round(data_adequacy, 3),
            },

            "dataSources": cp.get("dataSources", []),
            "comparison": _build_comparison(cp),

            "whyNow": _generate_why_now(cp),

            "actionable": True,
            "suggestedAction": action,
            "priority": _compute_priority(cp),
            "status": "new",

            "showWork": _generate_show_work(cp, certainty_info),

            # Extra metadata (not in TS type but useful for debugging)
            "mechanism": cp.get("mechanism", ""),
            "biologicalTimescale": ts,
            "priorSource": cp.get("priorSource", ""),
            "adjustmentSet": cp.get("adjustmentSet", []),
            "certaintyScale": certainty_info,
        }

        insights.append(insight)

    return {
        "persona": "oron",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "edgeCount": len(causal_results),
        "insights": insights,
    }


def _recommend_action(cp: Dict) -> str:
    """Generate a brief recommendation from the causal parameters."""
    curve = cp["curveType"]
    theta = cp["theta"]["value"]
    theta_unit = cp["theta"]["unit"]
    display = cp["theta"].get("displayValue", f"{theta:.0f} {theta_unit}")
    status = cp.get("currentStatus", "unknown")

    if status == "at_optimal":
        return f"Current level is optimal. Maintain near {display}."

    if curve == "plateau_down":
        if status == "above_optimal":
            return f"Consider reducing below {display} to avoid negative effects."
        return f"Threshold at {display}. Stay below for best results."

    if curve == "plateau_up":
        if status == "below_optimal":
            return f"Increase toward {display} for maximum benefit."
        return f"Above {display}, gains diminish. Current level captures benefit."

    if curve in ("v_max", "v_min"):
        return f"Sweet spot near {display}. Both too little and too much are suboptimal."

    return f"Threshold identified at {display}."


def _generate_headline(cp: Dict) -> str:
    """Generate a human-readable headline for the insight."""
    source = cp["source"].replace("_", " ").replace("smoothed", "").strip()
    target = cp["target"].replace("_", " ").replace("smoothed", "").strip()
    curve = cp["curveType"]
    status = cp.get("currentStatus", "unknown")
    size = cp.get("sizeCategory", "medium")

    if status == "above_optimal" and curve == "plateau_down":
        return f"Your {source} may be high enough to impact {target}"
    if status == "below_optimal" and curve == "plateau_up":
        return f"Increasing {source} could improve {target}"
    if status == "at_optimal":
        if size == "large":
            return f"Your {source} is at the sweet spot for {target}"
        return f"{target.title()} is well-managed at your current {source} level"

    return f"{source.title()} affects {target} with a threshold effect"


def _generate_explanation(cp: Dict) -> str:
    """Generate explanation from mechanism and parameters."""
    mechanism = cp.get("mechanism", "")
    theta = cp["theta"]["value"]
    theta_unit = cp["theta"]["unit"]
    bb = cp["betaBelow"]["value"]
    ba = cp["betaAbove"]["value"]
    effect_unit = cp["betaAbove"].get("unit", "")

    parts = [mechanism + "."] if mechanism else []

    if abs(ba) > abs(bb) * 2:
        parts.append(
            f"The effect intensifies above {theta:.1f} {theta_unit} "
            f"({ba:+.2f} {effect_unit} per unit vs {bb:+.2f} below)."
        )
    elif abs(bb) > abs(ba) * 2:
        parts.append(
            f"Most of the effect occurs below {theta:.1f} {theta_unit} "
            f"({bb:+.2f} {effect_unit} per unit), with diminishing returns above."
        )

    return " ".join(parts)


def _generate_why_now(cp: Dict) -> str:
    """Generate context-sensitive 'why now' message."""
    status = cp.get("currentStatus", "unknown")
    current = cp.get("currentValue")
    theta = cp["theta"]["value"]
    theta_unit = cp["theta"]["unit"]

    if current is not None and current > 0:
        if status in ("above_optimal", "above_threshold"):
            return f"Current value ({current:.1f}) is above the threshold ({theta:.1f} {theta_unit})."
        elif status in ("below_optimal", "below_threshold"):
            return f"Current value ({current:.1f}) is below the threshold ({theta:.1f} {theta_unit})."
        elif status == "at_optimal":
            return f"Current value ({current:.1f}) is near the optimal range ({theta:.1f} {theta_unit})."
        else:
            return f"Current value ({current:.1f}), threshold at {theta:.1f} {theta_unit}."

    return f"Threshold identified at {theta:.1f} {theta_unit} from available data."


def _generate_show_work(cp: Dict, certainty: Dict) -> str:
    """Generate the 'show your work' transparency section."""
    source = cp["source"]
    target = cp["target"]
    theta = cp["theta"]["value"]
    theta_unit = cp["theta"]["unit"]
    bb = cp["betaBelow"]["value"]
    ba = cp["betaAbove"]["value"]
    n_obs = cp.get("observations", 0)
    eff_n = cp.get("effectiveN", n_obs)
    pw = certainty["personalWeight"]
    pop_w = certainty["populationWeight"]
    prior_src = cp.get("priorSource", "literature")

    tier = certainty.get("evidenceTier", 2)
    tier_label = {1: "meta-analysis/RCT", 2: "observational", 3: "mechanistic"}.get(tier, "?")
    return (
        f"Piecewise-linear model: {target} ~ f({source}) with changepoint at theta. "
        f"Theta = {theta:.1f} {theta_unit}. "
        f"Below theta: {bb:+.3f} per unit. Above theta: {ba:+.3f} per unit. "
        f"Fitted on {n_obs} data points (effective N = {eff_n}). "
        f"Evidence split: {pw:.0%} personal / {pop_w:.0%} population. "
        f"Prior source: {prior_src} (evidence tier: {tier_label})."
    )


def _build_comparison(cp: Dict) -> Dict:
    """Build before/after comparison for visualization.

    For curves with a clear optimal (v_min, v_max, plateau), the "after"
    value is the theta target.  For linear curves (no optimal), shows the
    threshold and the dominant effect size instead.
    """
    current = cp.get("currentValue")
    theta = cp["theta"]["value"]
    ba = cp["betaAbove"]["value"]
    bb = cp["betaBelow"]["value"]
    theta_unit = cp["theta"].get("unit", "")
    curve = cp.get("curveType", "linear")
    status = cp.get("currentStatus", "unknown")

    if current is not None:
        # For curves with a clear optimal, target is theta
        if curve in ("v_min", "v_max") or status == "at_optimal":
            return {
                "before": {"value": round(current, 1), "label": "Current"},
                "after": {"value": round(theta, 1), "label": "At optimal"},
            }

        # For plateau curves, target is theta (the boundary)
        if curve in ("plateau_up", "plateau_down"):
            return {
                "before": {"value": round(current, 1), "label": "Current"},
                "after": {"value": round(theta, 1), "label": "Target"},
            }

        # For linear curves: show current and threshold (no "optimal")
        dominant_beta = ba if abs(ba) > abs(bb) else bb
        return {
            "before": {"value": round(current, 1), "label": "Current"},
            "after": {"value": round(theta, 1), "label": f"Threshold ({theta_unit})"},
        }

    # No current value: show effect size relative to theta
    dominant_beta = ba if abs(ba) > abs(bb) else bb
    side = "above" if abs(ba) > abs(bb) else "below"
    return {
        "before": {"value": round(theta, 1), "label": f"Threshold ({theta_unit})"},
        "after": {"value": round(abs(dominant_beta), 2), "label": f"Effect {side}"},
    }


def _compute_priority(cp: Dict) -> int:
    """Compute insight priority (1=highest, 10=lowest)."""
    size = cp.get("sizeCategory", "medium")
    status = cp.get("currentStatus", "unknown")
    cp_prob = cp.get("changepointProb", 0.5)

    score = 5  # Default middle priority

    # Size matters
    if size == "large":
        score -= 2
    elif size == "small":
        score += 2

    # Being away from the optimal/threshold matters
    if status in ("above_optimal", "below_optimal", "above_threshold", "below_threshold"):
        score -= 1

    # High confidence matters
    if cp_prob > 0.8:
        score -= 1

    return max(1, min(10, score))


def _compute_certainty(cp: Dict) -> Dict:
    """
    Compute how much the posterior owes to personal data vs population prior.

    Uses an **effective-sample-size sigmoid** whose midpoint adapts to prior
    informativeness, measured as prior_precision / noise_variance (the number
    of observations the prior is "worth").

    The idea: a tight prior from a meta-analysis (small sigma) is worth many
    data points. The personal data only dominates once effective_n exceeds
    that equivalent sample size by a comfortable margin.

    Formula:
        prior_equiv_n = prior_precision * noise_variance
                      = (noise_sigma / prior_beta_sigma)^2
        midpoint = prior_equiv_n  (clamped to [30, 500])
        personal_weight = sigmoid(effective_n, midpoint, slope=0.02)

    Why not conjugate precision math directly?
    BCEL is a non-conjugate piecewise-linear model. The Laplace-approximated
    posterior std can exceed the prior std (theta uncertainty propagates into
    beta uncertainty), violating the conjugate assumption that
    posterior_prec >= prior_prec. The sigmoid approach avoids this while
    still capturing the key insight: noisy data (large sigma) means more
    observations needed; tight priors mean more observations needed.
    """
    import math
    n_obs = cp.get("observations", 0)
    effective_n = cp.get("effectiveN", n_obs)
    evidence_tier = cp.get("evidenceTier", 2)

    # --- Compute adaptive midpoint from prior + noise ---
    prior_bb_sigma = cp.get("priorBetaBelowSigma")
    prior_ba_sigma = cp.get("priorBetaAboveSigma")
    noise_sigma = cp.get("residualSigma")

    midpoint = None

    if (prior_bb_sigma is not None and prior_ba_sigma is not None
            and noise_sigma is not None
            and prior_bb_sigma > 0 and prior_ba_sigma > 0
            and noise_sigma > 1e-8):

        # Prior equivalent sample size per slope:
        #   How many observations of noise_sigma would it take to match
        #   the information content of the prior?
        #   In OLS: beta_std ≈ noise_sigma / sqrt(n * var(x))
        #   So n_equiv ≈ (noise_sigma / prior_sigma)^2 / var(x)
        #   We approximate var(x) ≈ 1 (already factored into the
        #   beta units), giving n_equiv ≈ (noise_sigma / prior_sigma)^2
        equiv_n_bb = (noise_sigma / prior_bb_sigma) ** 2
        equiv_n_ba = (noise_sigma / prior_ba_sigma) ** 2

        # Use the more informative (larger equiv_n) slope as the driver
        # — this is the slope where the prior has the most to say
        max_equiv_n = max(equiv_n_bb, equiv_n_ba)

        # Scale by evidence tier: strong priors "count for more"
        tier_mult = {1: 1.5, 2: 1.0, 3: 0.7}.get(evidence_tier, 1.0)
        midpoint = max_equiv_n * tier_mult

        # Clamp to reasonable range
        midpoint = max(30.0, min(500.0, midpoint))

    # Fallback if prior info unavailable
    if midpoint is None:
        midpoint = {1: 150, 2: 100, 3: 50}.get(evidence_tier, 100)

    # Sigmoid with gentle slope — reaches ~95% at 2x midpoint
    slope = 3.0 / midpoint  # calibrated so sigmoid(2*mid) ≈ 0.95
    personal_weight = 1.0 / (1.0 + math.exp(-slope * (effective_n - midpoint)))

    # Clamp to [0.01, 0.99] — never claim 100% or 0%
    personal_weight = max(0.01, min(0.99, personal_weight))
    population_weight = 1.0 - personal_weight

    # Prior strength from evidence tier
    tier_strength = {1: 0.85, 2: 0.55, 3: 0.25}.get(evidence_tier, 0.55)

    return {
        "personalWeight": round(personal_weight, 2),
        "populationWeight": round(population_weight, 2),
        "priorStrength": round(tier_strength, 2),
        "evidenceTier": evidence_tier,
        "observations": n_obs,
        "effectiveN": effective_n,
        "confidence": "high" if effective_n > 100 else "medium" if effective_n > 30 else "low",
    }


def save_results(insight_json: Dict, filename: str = "oron_insights.json"):
    """Save insight JSON to output directory."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / filename
    with open(out_path, "w") as f:
        json.dump(insight_json, f, indent=2, default=str)
    print(f"\nSaved insights to: {out_path}")
    return out_path


if __name__ == "__main__":
    import sys

    # Set random seed for deterministic posterior sampling
    np.random.seed(42)
    print(f"Random seed: 42")

    # Parse optional tier arguments
    tiers = None
    if len(sys.argv) > 1:
        tiers = [int(t) for t in sys.argv[1:]]

    timeline = _load_timeline()
    results = run_all_edges(timeline=timeline, tiers=tiers)
    insight_json = build_insight_json(results)

    # Location effect modification (Israel vs US) is available but disabled.
    # The data is pooled for fitting; location can be used for debiasing later.
    # from inference_engine.causal.effect_modifier import (
    #     run_effect_modification_test, add_modifier_flags_to_insights,
    # )
    # mod_results = run_effect_modification_test(edges, timeline, verbose=True)
    # insight_json = add_modifier_flags_to_insights(insight_json, mod_results)

    save_results(insight_json)

    print(f"\n{'=' * 60}")
    print(f"Pipeline complete.")
    print(f"  {len(results)} insights generated")
    for r in results:
        shape = r["curveType"]
        theta = r["theta"]["value"]
        cp = r["changepointProb"]
        print(f"  - {r['edgeName']:40s} {shape:14s} theta={theta:8.1f} CP={cp:.2f}")
