"""
Serif Inference Engine — Main Pipeline
Processes Oron Afek's health data through the full Serif pipeline:
ETL → Data Prep → Causal Structure → Bayesian Inference → Insights → Persona
"""
import sys
import json
import numpy as np
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from inference_engine.config import OUTPUT_DIR, LAB_RESULTS_PATH, MEDIX_DATA_PATH, APPLE_HEALTH_XML
from inference_engine.etl.loader import load_lab_results, load_medix_data, get_lab_flags
from inference_engine.etl.gpx_parser import parse_all_gpx
from inference_engine.etl.apple_health_parser import parse_apple_health
from inference_engine.data_prep.load_computer import compute_daily_loads, compute_rolling_loads, get_load_at_date
from inference_engine.data_prep.marker_smoother import smooth_all_markers
from inference_engine.data_prep.comple_mapper import categorize_variables
from inference_engine.causal.dag_builder import get_active_edges, build_dag_summary
from inference_engine.inference.bcel import fit_edge
from inference_engine.inference.delta_builder import generate_thompson_worlds, blend_posteriors
from inference_engine.inference.population_priors import get_prior, get_all_priors
from inference_engine.safety.safeguards import assess_current_status
from inference_engine.output.insight_generator import generate_all_insights
from inference_engine.output.persona_generator import (
    generate_full_persona,
    save_persona_json,
)


def run_pipeline(use_pymc: bool = False, skip_gpx: bool = False, seed: int = 42):
    """
    Execute the full inference pipeline.

    Args:
        use_pymc: Whether to use PyMC MCMC (requires pymc installed). Falls back to approximate.
        skip_gpx: Skip GPX parsing (use cached/empty workouts for faster iteration).
        seed: Random seed for reproducible posterior sampling. Set to None for non-deterministic.
    """
    if seed is not None:
        np.random.seed(seed)

    print("=" * 60)
    print("SERIF INFERENCE ENGINE — Oron Afek Pipeline")
    print(f"  Random seed: {seed}" if seed is not None else "  Random seed: None (non-deterministic)")
    print("=" * 60)

    # ── Phase 1: ETL ────────────────────────────────────────────
    print("\n▶ Phase 1: Loading data...")

    # 1A: Lab results
    print("  Loading lab results...")
    labs_wide = load_lab_results()
    print(f"  → {len(labs_wide)} lab draws, {len(labs_wide.columns)} tests")

    # 1B: Medix data
    print("  Loading Medix data...")
    medix_data = load_medix_data()
    print(f"  → {len(medix_data.get('assessments', []))} assessments loaded")

    # 1C: GPX workouts
    if not skip_gpx:
        print("  Parsing GPX workout files...")
        workouts_df = parse_all_gpx()
        print(f"  → {len(workouts_df)} workouts parsed")
    else:
        print("  Skipping GPX (using empty DataFrame)...")
        import pandas as pd
        workouts_df = pd.DataFrame()

    # 1D: Apple Health
    print("  Parsing Apple Health export.xml...")
    apple_health_df = parse_apple_health(APPLE_HEALTH_XML)

    # Lab flags for clinical review
    flagged = get_lab_flags()
    print(f"  → {len(flagged)} flagged lab values")

    # ── Phase 2: Data Preparation ───────────────────────────────
    print("\n▶ Phase 2: Preparing data...")

    # 2A: Training loads from GPX
    if len(workouts_df) > 0:
        print("  Computing daily training loads...")
        daily_loads = compute_daily_loads(workouts_df)
        loads_df = compute_rolling_loads(daily_loads)
        print(f"  → {len(loads_df)} days of training load data")

        # Get current loads (most recent)
        current_loads = get_load_at_date(loads_df, loads_df["date"].max().strftime("%Y-%m-%d"))
        print(f"  → Current ACWR: {current_loads['acwr']:.2f}, Weekly run: {current_loads['weekly_run_km']:.1f} km")
    else:
        print("  No GPX data — using population-typical loads")
        import pandas as pd
        loads_df = pd.DataFrame({"date": [pd.Timestamp.now()]})
        current_loads = {
            "atl": 40, "ctl": 45, "acwr": 0.89,
            "weekly_run_km": 45, "weekly_zone2_min": 120,
            "weekly_training_hrs": 8, "monotony": 1.5,
            "strain": 300, "training_consistency": 0.7,
        }

    # 2B: Extract current markers from most recent labs
    latest_labs = labs_wide.iloc[-1] if len(labs_wide) > 0 else {}
    current_markers = {}
    for col in labs_wide.columns:
        if col != "date" and col in latest_labs and not _is_nan(latest_labs[col]):
            current_markers[col] = float(latest_labs[col])

    # Fill in known values from Oron's data
    current_markers.setdefault("iron_total", 37)
    current_markers.setdefault("ferritin", 46)
    current_markers.setdefault("iron_saturation_pct", 9.3)
    current_markers.setdefault("hscrp", 0.3)
    current_markers.setdefault("testosterone", 444)
    current_markers.setdefault("vo2_peak", 52)

    print(f"  → {len(current_markers)} current marker values")

    # 2C: GP smoothing for markers
    print("  Smoothing sparse markers with GP regression...")
    smoothed = smooth_all_markers(labs_wide)
    print(f"  → Smoothed {len(smoothed)} markers")

    # 2D: COMPLE categorization
    all_vars = list(current_markers.keys()) + list(current_loads.keys())
    categories = categorize_variables(all_vars)
    print(f"  → COMPLE: C={len(categories['C'])}, M={len(categories['M'])}, L={len(categories['L'])}, E={len(categories['E'])}")

    # Safety assessment
    safety_results = assess_current_status(current_markers)
    critical = [s for s in safety_results if s.severity == "critical"]
    warnings = [s for s in safety_results if s.severity == "warning"]
    print(f"  → Safety: {len(critical)} critical, {len(warnings)} warnings")

    # ── Phase 3: Causal Structure ───────────────────────────────
    print("\n▶ Phase 3: Building causal DAG...")
    dag_summary = build_dag_summary()
    active_edges = get_active_edges()
    print(f"  → {dag_summary['total_edges']} edges ({dag_summary['active_edges']} active)")
    print(f"  → Tier 1: {dag_summary['tier_1']}, Tier 2: {dag_summary['tier_2']}, Tier 3 (blocked): {dag_summary['tier_3']}")

    # ── Phase 4: Bayesian Inference ─────────────────────────────
    print("\n▶ Phase 4: Fitting Bayesian models...")

    posteriors = {}
    all_worlds = {}

    for edge in active_edges:
        edge_key = f"{edge.source}→{edge.target}"
        prior = get_prior(edge_key)
        if prior is None:
            continue

        print(f"  Fitting {edge_key}...")

        # Gather x, y data for this edge
        x, y = _gather_edge_data(
            edge, labs_wide, loads_df, current_loads, current_markers, smoothed
        )

        if len(x) < 2:
            print(f"    → Insufficient data ({len(x)} points), using prior only")
            # Use prior-only posterior
            posterior = {
                "theta_mean": prior.theta_mu,
                "theta_std": prior.theta_sigma,
                "alpha_mean": float(np.mean(y)) if len(y) > 0 else 0,
                "alpha_std": float(np.std(y)) if len(y) > 0 else 1,
                "beta_below_mean": prior.beta_below_mu,
                "beta_below_std": prior.beta_below_sigma,
                "beta_above_mean": prior.beta_above_mu,
                "beta_above_std": prior.beta_above_sigma,
                "sigma_mean": 1.0,
                "n_obs": len(x),
                "converged": False,
                "edge_key": edge_key,
                "prior": {
                    "theta_mu": prior.theta_mu,
                    "theta_sigma": prior.theta_sigma,
                    "beta_below_mu": prior.beta_below_mu,
                    "beta_below_sigma": prior.beta_below_sigma,
                    "beta_above_mu": prior.beta_above_mu,
                    "beta_above_sigma": prior.beta_above_sigma,
                    "curve_type": prior.curve_type,
                    "source": prior.source,
                },
            }
        else:
            posterior = fit_edge(x, y, edge_key, use_pymc=use_pymc)

        # Blend personal with population
        blended = blend_posteriors(
            posterior,
            {"theta_mu": prior.theta_mu, "theta_sigma": prior.theta_sigma,
             "beta_below_mu": prior.beta_below_mu, "beta_below_sigma": prior.beta_below_sigma,
             "beta_above_mu": prior.beta_above_mu, "beta_above_sigma": prior.beta_above_sigma,
             "alpha_mu": posterior.get("alpha_mean", 0), "alpha_sigma": posterior.get("alpha_std", 1)},
            posterior.get("n_obs", len(x)),
        )

        # Merge blended values into posterior
        for k, v in blended.items():
            posterior[k] = v

        posteriors[edge_key] = posterior

        # Generate Thompson worlds
        worlds = generate_thompson_worlds(posterior)
        all_worlds[edge_key] = worlds

        pw = blended.get("personal_weight", 0)
        print(f"    → θ={posterior['theta_mean']:.1f} ± {posterior['theta_std']:.1f}, "
              f"β_below={posterior['beta_below_mean']:.3f}, "
              f"β_above={posterior['beta_above_mean']:.3f}, "
              f"evidence: {pw:.0%} personal / {1-pw:.0%} population")

    print(f"\n  → Fitted {len(posteriors)} causal models")
    print(f"  → Generated {len(all_worlds)} × 128 Thompson sampling worlds")

    # ── Phase 5: Generate Insights ──────────────────────────────
    print("\n▶ Phase 5: Generating insights...")
    insights = generate_all_insights(posteriors, all_worlds, current_markers, current_loads)
    print(f"  → Generated {len(insights)} insights")

    for i, ins in enumerate(insights):
        severity = ins.get("safety_severity", "ok")
        marker = "⚠️" if severity in ("critical", "warning") else "✓"
        print(f"    {i+1}. [{marker}] {ins['title']} (priority: {ins.get('priority', '?')}, certainty: {ins.get('certainty', '?')}%)")

    # ── Phase 6: Generate Persona ───────────────────────────────
    print("\n▶ Phase 6: Generating persona bundle...")
    persona_data = generate_full_persona(
        labs_wide, medix_data, loads_df, insights, current_loads, current_markers
    )

    output_path = save_persona_json(persona_data)
    print(f"  → Saved to: {output_path}")

    # ── Summary ─────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)
    print(f"  Lab draws processed: {len(labs_wide)}")
    print(f"  Workouts parsed: {len(workouts_df) if not skip_gpx else 'skipped'}")
    print(f"  Causal models fitted: {len(posteriors)}")
    print(f"  Insights generated: {len(insights)}")
    print(f"  Output: {output_path}")
    print()

    return persona_data


def _is_nan(val) -> bool:
    """Check if a value is NaN-like."""
    if val is None:
        return True
    try:
        import math
        return math.isnan(float(val))
    except (ValueError, TypeError):
        return False


def _gather_edge_data(edge, labs_wide, loads_df, current_loads, current_markers, smoothed):
    """
    Gather paired (x, y) data for a causal edge.
    For load→marker edges, pairs training loads at lab draw dates with marker values.
    """
    import pandas as pd

    x_vals = []
    y_vals = []

    source = edge.source
    target = edge.target

    # For most edges: pair training load at lab date with marker value
    if source in current_loads and target in current_markers:
        # Use lab draw dates as observation points
        for _, row in labs_wide.iterrows():
            date = str(row["date"])
            y_val = row.get(target)
            if _is_nan(y_val):
                continue

            # Get load at this date
            if len(loads_df) > 1:
                x_val = get_load_at_date(loads_df, date).get(source, None)
            else:
                x_val = current_loads.get(source)

            if x_val is not None and not _is_nan(x_val):
                x_vals.append(float(x_val))
                y_vals.append(float(y_val))

    # For marker→marker edges (ferritin→vo2_peak)
    elif source in current_markers and target in current_markers:
        for _, row in labs_wide.iterrows():
            x_val = row.get(source)
            y_val = row.get(target)
            if not _is_nan(x_val) and not _is_nan(y_val):
                x_vals.append(float(x_val))
                y_vals.append(float(y_val))

    return np.array(x_vals), np.array(y_vals)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Serif Inference Engine")
    parser.add_argument("--pymc", action="store_true", help="Use PyMC MCMC (slower, more accurate)")
    parser.add_argument("--skip-gpx", action="store_true", help="Skip GPX parsing")
    parser.add_argument("--seed", type=int, default=42, help="Random seed (default: 42, use -1 for non-deterministic)")
    args = parser.parse_args()

    seed = args.seed if args.seed >= 0 else None
    run_pipeline(use_pymc=args.pymc, skip_gpx=args.skip_gpx, seed=seed)
