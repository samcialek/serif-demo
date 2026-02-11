"""
DAG (Directed Acyclic Graph) builder for causal structure.
Defines edges, adjustment sets, and data requirements per relationship.
"""
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

from inference_engine.data_prep.comple_mapper import validate_causal_edge


@dataclass
class CausalEdge:
    """A directed causal edge with metadata."""
    source: str
    target: str
    tier: int                    # 1=strong data, 2=cross-links, 3=needs Apple Health
    mechanism: str               # Human-readable mechanism
    category: str                # insight category
    variable_type: str           # 'marker' | 'outcome' | 'load'
    adjustment_set: List[str]    # Pre-treatment confounders to condition on
    min_observations: int        # Minimum data points needed
    data_available: bool = True  # Whether we currently have the data


# ── Tier 1: Strong data support (GPX → Labs) ───────────────────────
TIER_1_EDGES = [
    CausalEdge(
        source="weekly_run_km",
        target="iron_total",
        tier=1,
        mechanism="Foot-strike hemolysis destroys red blood cells during high-volume running",
        category="metabolic",
        variable_type="marker",
        adjustment_set=["season", "location", "acwr"],
        min_observations=4,
    ),
    CausalEdge(
        source="weekly_run_km",
        target="ferritin",
        tier=1,
        mechanism="Chronic running depletes iron stores via hemolysis, sweating, and GI losses",
        category="metabolic",
        variable_type="marker",
        adjustment_set=["season", "location", "acwr"],
        min_observations=4,
    ),
    CausalEdge(
        source="weekly_training_hrs",
        target="testosterone",
        tier=1,
        mechanism="Overtraining suppresses hypothalamic-pituitary-gonadal axis",
        category="metabolic",
        variable_type="marker",
        adjustment_set=["season", "acwr", "training_consistency"],
        min_observations=3,
    ),
    CausalEdge(
        source="weekly_zone2_min",
        target="triglycerides",
        tier=1,
        mechanism="Aerobic exercise increases lipoprotein lipase activity, clearing triglycerides",
        category="cardio",
        variable_type="marker",
        adjustment_set=["season", "location"],
        min_observations=3,
    ),
    CausalEdge(
        source="weekly_zone2_min",
        target="hdl",
        tier=1,
        mechanism="Regular aerobic exercise upregulates HDL production",
        category="cardio",
        variable_type="marker",
        adjustment_set=["season", "location"],
        min_observations=3,
    ),
    CausalEdge(
        source="acwr",
        target="hscrp",
        tier=1,
        mechanism="Acute overreaching triggers systemic inflammation",
        category="recovery",
        variable_type="marker",
        adjustment_set=["season", "training_consistency"],
        min_observations=4,
    ),
    CausalEdge(
        source="training_consistency",
        target="vo2_peak",
        tier=1,
        mechanism="Consistent aerobic training drives mitochondrial adaptation",
        category="cardio",
        variable_type="marker",
        adjustment_set=["season"],
        min_observations=2,
    ),
]

# ── Tier 2: Marker cross-links ─────────────────────────────────────
TIER_2_EDGES = [
    CausalEdge(
        source="ferritin",
        target="vo2_peak",
        tier=2,
        mechanism="Iron stores limit oxygen transport capacity via hemoglobin synthesis",
        category="metabolic",
        variable_type="marker",
        adjustment_set=["training_consistency", "season"],
        min_observations=2,
    ),
]

# ── Tier 3: Requires Apple Health data ──────────────────────────────
TIER_3_EDGES = [
    CausalEdge(
        source="time_of_day",
        target="sleep_score",
        tier=3,
        mechanism="Late workouts elevate core temperature, delaying sleep onset",
        category="sleep",
        variable_type="outcome",
        adjustment_set=["workout_intensity", "season"],
        min_observations=30,
        data_available=False,
    ),
    CausalEdge(
        source="daily_trimp",
        target="nightly_hrv",
        tier=3,
        mechanism="Training load drives autonomic nervous system recovery patterns",
        category="recovery",
        variable_type="outcome",
        adjustment_set=["acwr", "season"],
        min_observations=30,
        data_available=False,
    ),
    CausalEdge(
        source="acwr",
        target="resting_hr",
        tier=3,
        mechanism="Overreaching elevates sympathetic tone and resting heart rate",
        category="recovery",
        variable_type="outcome",
        adjustment_set=["season", "training_consistency"],
        min_observations=30,
        data_available=False,
    ),
]

ALL_EDGES = TIER_1_EDGES + TIER_2_EDGES + TIER_3_EDGES


def get_active_edges() -> List[CausalEdge]:
    """Get edges that currently have sufficient data."""
    return [e for e in ALL_EDGES if e.data_available]


def get_edges_by_tier(tier: int) -> List[CausalEdge]:
    """Get all edges for a specific tier."""
    return [e for e in ALL_EDGES if e.tier == tier]


def get_edge(source: str, target: str) -> Optional[CausalEdge]:
    """Look up a specific causal edge."""
    for edge in ALL_EDGES:
        if edge.source == source and edge.target == target:
            return edge
    return None


def validate_dag() -> List[str]:
    """Validate all DAG edges against COMPLE constraints."""
    issues = []
    for edge in ALL_EDGES:
        valid, msg = validate_causal_edge(edge.source, edge.target)
        if not valid:
            issues.append(f"{edge.source}→{edge.target}: {msg}")
    return issues


def get_adjustment_set(source: str, target: str) -> List[str]:
    """Get the backdoor adjustment set for a causal edge."""
    edge = get_edge(source, target)
    if edge:
        return edge.adjustment_set
    return []


def build_dag_summary() -> Dict:
    """Build a summary of the full DAG structure."""
    return {
        "total_edges": len(ALL_EDGES),
        "active_edges": len(get_active_edges()),
        "tier_1": len(get_edges_by_tier(1)),
        "tier_2": len(get_edges_by_tier(2)),
        "tier_3": len(get_edges_by_tier(3)),
        "edges": [
            {
                "source": e.source,
                "target": e.target,
                "tier": e.tier,
                "mechanism": e.mechanism,
                "category": e.category,
                "data_available": e.data_available,
            }
            for e in ALL_EDGES
        ],
    }
