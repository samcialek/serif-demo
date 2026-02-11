"""
Algorithmic backdoor identification using Pearl's causal criteria.

Given a causal DAG (built from discovered edges + domain knowledge),
computes minimal sufficient adjustment sets for each edge using:

1. Pearl's Backdoor Criterion: A set Z satisfies the backdoor criterion
   relative to (X, Y) if:
   (a) No node in Z is a descendant of X
   (b) Z blocks every path between X and Y that contains an arrow into X

2. Frontdoor Criterion: Identifies mediators M where X -> M -> Y and
   there are no unblocked backdoor paths from X to M or M to Y after
   conditioning on appropriate sets.

Architecture:
  CausalDAG      - networkx DiGraph with COMPLE node metadata
  build_dag()    - constructs DAG from discovered edges + known structure
  backdoor_sets()  - computes adjustment sets per edge
  frontdoor_paths() - identifies frontdoor opportunities

References:
  Pearl, J. (2009). Causality (2nd ed.), Chapter 3.
  Pearl, J. (2000). "The Book of Why", Chapters 7-8.
"""
import networkx as nx
from dataclasses import dataclass, field
from typing import Dict, FrozenSet, List, Optional, Set, Tuple

from inference_engine.causal.edge_table import EdgeSpec
from inference_engine.data_prep.comple_mapper import COMPLE_MAP, get_category


# ===================================================================
# KNOWN STRUCTURAL RELATIONSHIPS
# These edges are domain-knowledge that the data can't discover
# (confounders, mediators, common causes)
# ===================================================================

# Format: (source, target, edge_type)
# edge_type: "causal" = direct cause, "confounds" = common cause link
STRUCTURAL_EDGES: List[Tuple[str, str, str]] = [
    # ── Environment confounds many things ───────────────────
    ("season", "training_volume", "confounds"),      # People train more in spring/summer
    ("season", "vitamin_d", "confounds"),             # Sunlight exposure varies by season
    ("season", "testosterone", "confounds"),          # Seasonal testosterone variation
    ("season", "sleep_duration", "confounds"),        # Daylight affects sleep patterns
    ("location", "training_volume", "confounds"),     # Training differs Israel vs US
    ("location", "sleep_quality", "confounds"),       # Jet lag, routine disruption
    ("travel_load", "sleep_quality", "confounds"),    # Jet lag directly impairs sleep
    ("travel_load", "hrv_daily", "confounds"),        # Travel stress impacts HRV
    ("travel_load", "resting_hr", "confounds"),       # Travel stress elevates HR
    ("is_weekend", "training_volume", "confounds"),   # Weekend warriors
    ("is_weekend", "sleep_duration", "confounds"),    # People sleep more on weekends
    ("is_weekend", "bedtime", "confounds"),           # Later bedtimes on weekends

    # ── Training structure confounders ──────────────────────
    ("acwr", "hscrp", "causal"),                      # Overreaching -> inflammation
    ("acwr", "resting_hr", "causal"),                 # Overreaching -> elevated HR
    ("acwr", "testosterone", "causal"),               # Overreaching -> T suppression
    ("training_consistency", "vo2_peak", "causal"),   # Consistency drives adaptation
    ("monotony", "hscrp", "causal"),                  # Poor periodization -> inflammation

    # ── Iron pathway: the full mediating chain ──────────────
    # Running -> ground_contacts -> hemolysis -> iron depletion -> ferritin -> hemoglobin -> VO2
    ("running_volume", "ground_contacts", "causal"),
    ("ground_contacts", "iron_total", "causal"),
    ("iron_total", "ferritin", "causal"),
    ("ferritin", "hemoglobin", "causal"),
    ("hemoglobin", "vo2_peak", "causal"),
    ("ferritin", "vo2_peak", "causal"),
    # Sweat and GI pathway (parallel to hemolysis)
    ("running_volume", "sweat_iron_loss", "causal"),
    ("high_intensity", "gi_iron_loss", "causal"),

    # ── Hormone pathway ─────────────────────────────────────
    ("training_volume", "cortisol", "causal"),
    ("cortisol", "testosterone", "causal"),            # Cortisol suppresses T
    ("sleep_duration", "testosterone", "causal"),      # Sleep deprivation lowers T

    # ── Lipid pathway ───────────────────────────────────────
    ("zone2_volume", "lipoprotein_lipase", "causal"),  # LPL mediates TG clearance
    ("lipoprotein_lipase", "triglycerides", "causal"),
    ("zone2_volume", "reverse_cholesterol_transport", "causal"),
    ("reverse_cholesterol_transport", "hdl", "causal"),

    # ── Sleep-recovery chain ────────────────────────────────
    ("training_load", "core_temperature", "causal"),   # Exercise raises core temp
    ("core_temperature", "sleep_quality", "causal"),   # High temp impairs sleep onset
    ("sleep_duration", "hrv_daily", "causal"),
    ("sleep_quality", "hrv_daily", "causal"),
    ("hrv_daily", "resting_hr", "causal"),             # HRV and RHR are linked

    # ── Body composition pathway ────────────────────────────
    ("training_volume", "energy_expenditure", "causal"),
    ("energy_expenditure", "body_fat_pct", "causal"),
    ("body_fat_pct", "leptin", "causal"),

    # ── Immune pathway ────────────────────────────────────
    ("training_volume", "wbc", "causal"),
    ("sleep_duration", "wbc", "causal"),
    ("cortisol", "wbc", "causal"),              # Cortisol suppresses lymphocytes

    # ── Metabolic pathway ─────────────────────────────────
    ("training_volume", "insulin_sensitivity", "causal"),
    ("insulin_sensitivity", "glucose", "causal"),
    ("insulin_sensitivity", "insulin", "causal"),

    # ── Liver / kidney ────────────────────────────────────
    ("training_volume", "ast", "causal"),        # Muscle damage → AST release
    ("training_volume", "creatinine", "causal"),  # Creatine turnover

    # ── Micronutrient depletion ───────────────────────────
    ("running_volume", "zinc", "causal"),
    ("running_volume", "magnesium_rbc", "causal"),

    # ── Omega-3 / inflammation cross-link ─────────────────
    ("omega3_index", "hscrp", "causal"),

    # ── Vitamin D → hormones ──────────────────────────────
    ("vitamin_d", "testosterone", "confounds"),   # Seasonal confound + causal
    ("season", "omega3_index", "confounds"),       # Dietary seasonality

    # ── B12 / methylation pathway ─────────────────────────
    ("b12", "homocysteine", "causal"),
    ("homocysteine", "hscrp", "causal"),
]

# Mapping from abstract node names to actual timeline column families
# This maps the structural DAG nodes to the column names used in edges
NODE_TO_COLUMNS: Dict[str, List[str]] = {
    "running_volume": ["daily_run_km", "run_distance_km", "weekly_run_km", "monthly_run_km"],
    "training_volume": ["daily_distance_km", "daily_duration_min", "weekly_volume_km"],
    "zone2_volume": ["daily_zone2_min", "zone2_minutes", "weekly_zone2_min"],
    "training_load": ["daily_trimp", "atl"],
    "high_intensity": ["daily_high_intensity_min", "weekly_high_intensity_min"],
    "ground_contacts": ["daily_ground_contacts", "weekly_ground_contacts", "monthly_ground_contacts"],
    "iron_total": ["iron_total_smoothed", "iron_total_raw"],
    "ferritin": ["ferritin_smoothed", "ferritin_raw"],
    "hemoglobin": ["hemoglobin_smoothed", "hemoglobin_raw"],
    "vo2_peak": ["vo2_peak_smoothed", "vo2max_apple"],
    "testosterone": ["testosterone_smoothed", "testosterone_raw"],
    "cortisol": ["cortisol_smoothed", "cortisol_raw"],
    "triglycerides": ["triglycerides_smoothed", "triglycerides_raw"],
    "hdl": ["hdl_smoothed", "hdl_raw"],
    "hscrp": ["hscrp_smoothed", "hscrp_raw"],
    "sleep_quality": ["sleep_quality_score"],
    "sleep_duration": ["sleep_duration_hrs"],
    "sleep_efficiency": ["sleep_efficiency_pct"],
    "deep_sleep": ["deep_sleep_min", "ah_deep_sleep_min"],
    "hrv_daily": ["hrv_daily_mean", "sleep_hrv_ms"],
    "resting_hr": ["resting_hr", "sleep_hr_bpm", "resting_hr_7d_mean"],
    "body_fat_pct": ["body_fat_pct"],
    "body_mass": ["body_mass_kg"],
    "vitamin_d": ["vitamin_d_smoothed", "vitamin_d_raw"],
    "bedtime": ["bedtime_hour"],
    "workout_time": ["last_workout_end_hour", "latest_workout_hour"],
    "steps": ["steps"],
    "active_energy": ["active_energy_kcal"],
    "acwr": ["acwr"],
    "training_consistency": ["training_consistency", "training_consistency_90d"],
    "monotony": ["monotony"],
    "sleep_debt": ["sleep_debt_14d"],
    # Environment nodes
    "season": ["season"],
    "location": ["location"],
    "travel_load": ["travel_load"],
    "is_weekend": ["is_weekend"],
    "day_of_week": ["day_of_week"],
    "year": ["year"],
    "month": ["month"],
    # ── New marker nodes ─────────────────────────────────────
    "wbc": ["wbc_smoothed", "wbc_raw"],
    "rbc": ["rbc_smoothed", "rbc_raw"],
    "platelets": ["platelets_smoothed", "platelets_raw"],
    "mcv": ["mcv_smoothed", "mcv_raw"],
    "rdw": ["rdw_smoothed", "rdw_raw"],
    "nlr": ["nlr"],
    "glucose": ["glucose_smoothed", "glucose_raw"],
    "insulin": ["insulin_smoothed", "insulin_raw"],
    "hba1c": ["hba1c_smoothed", "hba1c_raw"],
    "ast": ["ast_smoothed", "ast_raw"],
    "alt": ["alt_smoothed", "alt_raw"],
    "creatinine": ["creatinine_smoothed", "creatinine_raw"],
    "albumin": ["albumin_smoothed", "albumin_raw"],
    "zinc": ["zinc_smoothed", "zinc_raw"],
    "magnesium_rbc": ["magnesium_rbc_smoothed", "magnesium_rbc_raw"],
    "apob": ["apob_smoothed", "apob_raw"],
    "ldl_particle_number": ["ldl_particle_number_smoothed", "ldl_particle_number_raw"],
    "non_hdl_cholesterol": ["non_hdl_cholesterol_smoothed", "non_hdl_cholesterol_raw"],
    "total_cholesterol": ["total_cholesterol_smoothed", "total_cholesterol_raw"],
    "homocysteine": ["homocysteine_smoothed", "homocysteine_raw"],
    "omega3_index": ["omega3_index_derived", "omega3_index_smoothed"],
    "uric_acid": ["uric_acid_smoothed", "uric_acid_raw"],
    "b12": ["b12_smoothed", "b12_raw"],
    "folate": ["folate_smoothed", "folate_raw"],
    "estradiol": ["estradiol_smoothed", "estradiol_raw"],
    "dhea_s": ["dhea_s_smoothed", "dhea_s_raw"],
    "shbg": ["shbg_smoothed", "shbg_raw"],
    "free_testosterone": ["free_testosterone_smoothed", "free_testosterone_raw"],
    "ldl": ["ldl_smoothed", "ldl_raw"],
    # Latent mediators (not directly observed)
    "sweat_iron_loss": [],
    "gi_iron_loss": [],
    "lipoprotein_lipase": [],
    "reverse_cholesterol_transport": [],
    "core_temperature": [],
    "energy_expenditure": [],
    "leptin": [],
    "insulin_sensitivity": [],
}


# ===================================================================
# DATA STRUCTURES
# ===================================================================

@dataclass
class AdjustmentResult:
    """Result of backdoor analysis for a single edge."""
    edge_name: str
    source: str
    target: str
    # Minimal sufficient adjustment set (column names)
    adjustment_set: List[str]
    # All valid adjustment sets found
    all_valid_sets: List[List[str]]
    # Whether backdoor criterion is satisfiable
    backdoor_admissible: bool
    # Explanation
    reasoning: str
    # Frontdoor paths if any
    frontdoor_paths: List[List[str]] = field(default_factory=list)


@dataclass
class CausalDAG:
    """Wrapper around networkx DiGraph with COMPLE metadata."""
    graph: nx.DiGraph
    # Map from column name to abstract node name
    column_to_node: Dict[str, str]
    # Map from abstract node name to column names
    node_to_columns: Dict[str, List[str]]
    # Observable nodes (have columns in the timeline)
    observable_nodes: Set[str]
    # Latent nodes (not directly measured)
    latent_nodes: Set[str]


# ===================================================================
# DAG CONSTRUCTION
# ===================================================================

def build_dag(
    discovered_edges: List[EdgeSpec],
    timeline_columns: Optional[Set[str]] = None,
) -> CausalDAG:
    """
    Build a causal DAG from discovered edges plus domain knowledge.

    The DAG combines:
    1. Edges discovered from data (edge_discovery.py output)
    2. Structural edges from domain knowledge (STRUCTURAL_EDGES)
    3. COMPLE category metadata per node

    Args:
        discovered_edges: EdgeSpecs from edge_discovery.discover_edges()
        timeline_columns: Available columns in the timeline (for observability)

    Returns:
        CausalDAG with full graph structure
    """
    G = nx.DiGraph()
    column_to_node: Dict[str, str] = {}
    node_to_cols: Dict[str, List[str]] = {}

    # Build column -> node mapping
    for node_name, cols in NODE_TO_COLUMNS.items():
        node_to_cols[node_name] = cols
        for col in cols:
            column_to_node[col] = node_name

    # 1. Add nodes from discovered edges
    for edge in discovered_edges:
        dose_node = column_to_node.get(edge.dose_variable, edge.dose_variable)
        resp_node = column_to_node.get(edge.response_variable, edge.response_variable)

        # Add nodes with metadata
        dose_cat = _infer_comple_category(edge.dose_variable)
        resp_cat = _infer_comple_category(edge.response_variable)

        G.add_node(dose_node, comple=dose_cat, label=dose_node)
        G.add_node(resp_node, comple=resp_cat, label=resp_node)
        G.add_edge(dose_node, resp_node,
                    edge_type="discovered",
                    edge_name=edge.name,
                    prior_key=edge.prior_key)

        # Register columns
        if dose_node not in node_to_cols:
            node_to_cols[dose_node] = [edge.dose_variable]
        if resp_node not in node_to_cols:
            node_to_cols[resp_node] = [edge.response_variable]
        column_to_node[edge.dose_variable] = dose_node
        column_to_node[edge.response_variable] = resp_node

    # 2. Add structural edges (domain knowledge)
    for src, tgt, etype in STRUCTURAL_EDGES:
        if src not in G:
            cat = _infer_comple_category_from_node(src)
            G.add_node(src, comple=cat, label=src)
        if tgt not in G:
            cat = _infer_comple_category_from_node(tgt)
            G.add_node(tgt, comple=cat, label=tgt)

        if not G.has_edge(src, tgt):
            G.add_edge(src, tgt, edge_type=etype)

    # 3. Determine observability
    observable = set()
    latent = set()
    for node in G.nodes():
        cols = node_to_cols.get(node, [])
        if timeline_columns:
            if any(c in timeline_columns for c in cols):
                observable.add(node)
            elif len(cols) == 0:
                latent.add(node)
            else:
                latent.add(node)
        else:
            if len(cols) > 0:
                observable.add(node)
            else:
                latent.add(node)

    return CausalDAG(
        graph=G,
        column_to_node=column_to_node,
        node_to_columns=node_to_cols,
        observable_nodes=observable,
        latent_nodes=latent,
    )


def _infer_comple_category(column_name: str) -> str:
    """Infer COMPLE category from column name."""
    cat = COMPLE_MAP.get(column_name)
    if cat:
        return cat
    # Try without suffixes
    base = column_name.replace("_smoothed", "").replace("_raw", "").replace("_7d", "")
    cat = COMPLE_MAP.get(base)
    if cat:
        return cat
    # Heuristics
    if any(k in column_name for k in ["season", "location", "weekend", "month", "year", "travel"]):
        return "E"
    if any(k in column_name for k in ["daily_trimp", "atl", "ctl", "acwr", "weekly_", "monthly_",
                                       "monotony", "strain", "consistency", "depletion"]):
        return "L"
    if any(k in column_name for k in ["smoothed", "raw", "iron", "ferritin", "testosterone",
                                       "cortisol", "hdl", "ldl", "triglycerides", "hscrp"]):
        return "M"
    if any(k in column_name for k in ["sleep_", "hrv_", "resting_hr", "deep_sleep"]):
        return "O"
    return "C"  # Default to Choice


def _infer_comple_category_from_node(node_name: str) -> str:
    """Infer COMPLE category from abstract node name."""
    cat = COMPLE_MAP.get(node_name)
    if cat:
        return cat
    # Check columns mapped to this node
    cols = NODE_TO_COLUMNS.get(node_name, [])
    for col in cols:
        cat = COMPLE_MAP.get(col)
        if cat:
            return cat
    # Environment nodes
    if node_name in ("season", "location", "travel_load", "is_weekend",
                     "day_of_week", "year", "month"):
        return "E"
    # Latent mediators
    if node_name in ("sweat_iron_loss", "gi_iron_loss", "lipoprotein_lipase",
                     "reverse_cholesterol_transport", "core_temperature",
                     "energy_expenditure", "leptin"):
        return "M"  # Latent markers
    return "C"


# ===================================================================
# PEARL'S BACKDOOR CRITERION
# ===================================================================

def _ancestors(G: nx.DiGraph, node: str) -> Set[str]:
    """Get all ancestors of a node in the DAG."""
    return nx.ancestors(G, node)


def _descendants(G: nx.DiGraph, node: str) -> Set[str]:
    """Get all descendants of a node in the DAG."""
    return nx.descendants(G, node)


def _is_d_separated(
    G: nx.DiGraph,
    X: str,
    Y: str,
    Z: FrozenSet[str],
) -> bool:
    """
    Test d-separation: X _||_ Y | Z in DAG G.

    Uses networkx's is_d_separator (checks if Z d-separates X from Y).
    If Z is empty, we check if there's any active path from X to Y
    without conditioning — i.e., whether the empty set blocks all paths.
    """
    try:
        # is_d_separator returns True if Z d-separates {X} from {Y}
        # i.e., every path between X and Y is blocked given Z
        return nx.is_d_separator(G, {X}, {Y}, set(Z))
    except (nx.NetworkXError, nx.NodeNotFound):
        # If nodes missing, fall back to conservative (not separated)
        return False


def _satisfies_backdoor_criterion(
    G: nx.DiGraph,
    X: str,
    Y: str,
    Z: FrozenSet[str],
) -> bool:
    """
    Check if Z satisfies Pearl's backdoor criterion for (X, Y).

    Pearl's Backdoor Criterion (Definition 3.3.1):
    A set of variables Z satisfies the backdoor criterion relative to
    an ordered pair (X_i, X_j) in DAG G if:
      (i)  No node in Z is a descendant of X_i
      (ii) Z blocks every path between X_i and X_j that contains an
           arrow into X_i (i.e., every "backdoor path")

    Condition (ii) is equivalent to: X and Y are d-separated given Z
    in the manipulated graph G_Xbar (G with all arrows out of X removed).
    """
    # Condition (i): No Z is a descendant of X
    desc_X = _descendants(G, X)
    if Z & desc_X:
        return False

    # Condition (ii): d-separation in G_Xbar
    # Create G_Xbar: remove all outgoing edges from X
    G_Xbar = G.copy()
    out_edges = list(G_Xbar.out_edges(X))
    G_Xbar.remove_edges_from(out_edges)

    # Check if X _||_ Y | Z in G_Xbar
    return _is_d_separated(G_Xbar, X, Y, Z)


def find_minimal_adjustment_set(
    dag: CausalDAG,
    source_node: str,
    target_node: str,
    max_set_size: int = 5,
) -> Tuple[Optional[List[str]], List[List[str]], str]:
    """
    Find the minimal sufficient adjustment set for a causal edge.

    Strategy:
    1. Identify candidate adjustment variables (observable, non-descendant of X)
    2. Start with empty set, check if backdoor is already blocked
    3. Incrementally add variables, checking backdoor criterion
    4. Use a greedy approach for tractability

    Returns:
        (minimal_set, all_valid_sets, reasoning)
    """
    G = dag.graph

    if source_node not in G or target_node not in G:
        return None, [], f"Nodes not in DAG: {source_node} or {target_node}"

    # Get descendants of X (cannot be in adjustment set)
    desc_X = _descendants(G, source_node)

    # Candidate adjustment variables: observable, not X, not Y, not descendant of X
    candidates = []
    for node in dag.observable_nodes:
        if node == source_node or node == target_node:
            continue
        if node in desc_X:
            continue
        # Prefer E variables, then L variables
        cat = G.nodes[node].get("comple", "?")
        priority = {"E": 0, "L": 1, "C": 2, "M": 3, "O": 4}.get(cat, 5)
        candidates.append((priority, node))

    candidates.sort()
    candidate_nodes = [n for _, n in candidates]

    # Check if empty set already works (no confounding)
    if _satisfies_backdoor_criterion(G, source_node, target_node, frozenset()):
        return [], [[]], "No backdoor paths exist; no adjustment needed."

    # Try single-variable adjustment sets
    valid_sets: List[List[str]] = []
    for node in candidate_nodes:
        Z = frozenset({node})
        if _satisfies_backdoor_criterion(G, source_node, target_node, Z):
            valid_sets.append([node])

    if valid_sets:
        minimal = valid_sets[0]  # First is highest-priority (E first)
        reasoning = (
            f"Backdoor blocked by conditioning on {minimal}. "
            f"Found {len(valid_sets)} valid single-variable sets."
        )
        return minimal, valid_sets, reasoning

    # Try pairs
    for i, node_i in enumerate(candidate_nodes[:15]):  # Limit search space
        for node_j in candidate_nodes[i + 1:15]:
            Z = frozenset({node_i, node_j})
            if _satisfies_backdoor_criterion(G, source_node, target_node, Z):
                valid_sets.append([node_i, node_j])

    if valid_sets:
        minimal = valid_sets[0]
        reasoning = (
            f"Backdoor requires conditioning on {minimal}. "
            f"Found {len(valid_sets)} valid 2-variable sets."
        )
        return minimal, valid_sets, reasoning

    # Try triples if needed
    for i, node_i in enumerate(candidate_nodes[:10]):
        for j, node_j in enumerate(candidate_nodes[i + 1:10], i + 1):
            for node_k in candidate_nodes[j + 1:10]:
                Z = frozenset({node_i, node_j, node_k})
                if _satisfies_backdoor_criterion(G, source_node, target_node, Z):
                    valid_sets.append([node_i, node_j, node_k])
                    if len(valid_sets) >= 5:
                        break
            if len(valid_sets) >= 5:
                break
        if len(valid_sets) >= 5:
            break

    if valid_sets:
        minimal = valid_sets[0]
        reasoning = (
            f"Backdoor requires conditioning on {minimal}. "
            f"Found {len(valid_sets)} valid 3-variable sets."
        )
        return minimal, valid_sets, reasoning

    # Last resort: condition on all candidates (brute force not tractable,
    # so use the parents-of-target heuristic)
    parents_of_Y = set(G.predecessors(target_node)) - {source_node} - desc_X
    observable_parents = parents_of_Y & dag.observable_nodes
    if observable_parents:
        Z = frozenset(observable_parents)
        if _satisfies_backdoor_criterion(G, source_node, target_node, Z):
            adj = sorted(observable_parents)
            return adj, [adj], f"Adjusted on observable parents of {target_node}: {adj}"

    # Backdoor criterion not satisfiable with observable variables
    return None, [], (
        f"Backdoor criterion not satisfiable for {source_node} -> {target_node} "
        f"with available observables. May require frontdoor criterion or "
        f"instrumental variables."
    )


# ===================================================================
# FRONTDOOR CRITERION
# ===================================================================

def find_frontdoor_paths(
    dag: CausalDAG,
    source_node: str,
    target_node: str,
) -> List[List[str]]:
    """
    Find frontdoor paths from source to target.

    A frontdoor path X -> M -> Y satisfies the frontdoor criterion if:
    1. M intercepts all directed paths from X to Y
    2. There are no unblocked backdoor paths from X to M
    3. All backdoor paths from M to Y are blocked by X

    In practice, we look for observable mediators on directed paths.
    """
    G = dag.graph
    if source_node not in G or target_node not in G:
        return []

    frontdoor_paths = []

    # Find all simple directed paths from source to target
    try:
        all_paths = list(nx.all_simple_paths(G, source_node, target_node, cutoff=4))
    except nx.NetworkXError:
        return []

    # Look for paths with observable mediators
    for path in all_paths:
        if len(path) < 3:
            continue  # Direct edge, no mediator

        mediators = path[1:-1]
        observable_mediators = [m for m in mediators if m in dag.observable_nodes]

        if len(observable_mediators) == len(mediators):
            # All mediators are observable - potential frontdoor
            # Check frontdoor conditions
            if _check_frontdoor_conditions(G, dag, source_node, target_node, mediators):
                frontdoor_paths.append(path)

    return frontdoor_paths


def _check_frontdoor_conditions(
    G: nx.DiGraph,
    dag: CausalDAG,
    X: str,
    Y: str,
    mediators: List[str],
) -> bool:
    """
    Verify the three frontdoor conditions for X -> M1 -> ... -> Mk -> Y.

    Simplified check for the first mediator M:
    1. X -> M (directed path exists)
    2. No unblocked backdoor X <- ... -> M
    3. All backdoor M <- ... -> Y blocked by conditioning on X
    """
    if not mediators:
        return False

    M = mediators[0]

    # Condition 2: Check no unblocked backdoor from X to M
    # In G_Xbar (remove outgoing from X), check if X and M are d-separated
    G_Xbar = G.copy()
    G_Xbar.remove_edges_from(list(G_Xbar.out_edges(X)))
    no_backdoor_X_M = _is_d_separated(G_Xbar, X, M, frozenset())

    # Condition 3: Check all backdoor from M to Y blocked by {X}
    G_Mbar = G.copy()
    G_Mbar.remove_edges_from(list(G_Mbar.out_edges(M)))
    backdoor_M_Y_blocked = _is_d_separated(G_Mbar, M, Y, frozenset({X}))

    return no_backdoor_X_M and backdoor_M_Y_blocked


# ===================================================================
# MAIN API
# ===================================================================

def compute_adjustment_sets(
    discovered_edges: List[EdgeSpec],
    timeline_columns: Optional[Set[str]] = None,
    verbose: bool = True,
) -> Tuple[CausalDAG, List[AdjustmentResult]]:
    """
    Main entry point: compute adjustment sets for all discovered edges.

    Args:
        discovered_edges: Edges from edge_discovery.discover_edges()
        timeline_columns: Available columns in the timeline
        verbose: Print progress

    Returns:
        (dag, results) where results are AdjustmentResult per edge
    """
    if verbose:
        print("=" * 60)
        print("Computing backdoor adjustment sets")
        print("=" * 60)

    # 1. Build DAG
    dag = build_dag(discovered_edges, timeline_columns)
    if verbose:
        print(f"\nDAG: {dag.graph.number_of_nodes()} nodes, "
              f"{dag.graph.number_of_edges()} edges")
        print(f"  Observable: {len(dag.observable_nodes)}")
        print(f"  Latent:     {len(dag.latent_nodes)}")

    # 2. Compute adjustment sets for each discovered edge
    results = []
    for edge in discovered_edges:
        source_node = dag.column_to_node.get(edge.dose_variable, edge.dose_variable)
        target_node = dag.column_to_node.get(edge.response_variable, edge.response_variable)

        if verbose:
            print(f"\n  {edge.name}")
            print(f"    {source_node} -> {target_node}")

        # Backdoor
        adj_set, all_sets, reasoning = find_minimal_adjustment_set(
            dag, source_node, target_node
        )

        # Convert node names back to column names
        adj_columns = _nodes_to_columns(adj_set, dag, timeline_columns) if adj_set is not None else []

        # Frontdoor
        fd_paths = find_frontdoor_paths(dag, source_node, target_node)

        result = AdjustmentResult(
            edge_name=edge.name,
            source=source_node,
            target=target_node,
            adjustment_set=adj_columns,
            all_valid_sets=[_nodes_to_columns(s, dag, timeline_columns) for s in all_sets],
            backdoor_admissible=adj_set is not None,
            reasoning=reasoning,
            frontdoor_paths=fd_paths,
        )
        results.append(result)

        if verbose:
            if adj_set is not None:
                print(f"    Backdoor: adjust on {adj_columns}")
            else:
                print(f"    Backdoor: NOT SATISFIABLE")
            print(f"    Reason: {reasoning}")
            if fd_paths:
                for p in fd_paths:
                    print(f"    Frontdoor: {' -> '.join(p)}")

    # 3. Summary
    if verbose:
        n_ok = sum(1 for r in results if r.backdoor_admissible)
        n_fd = sum(1 for r in results if r.frontdoor_paths)
        print(f"\n{'=' * 60}")
        print(f"Summary: {n_ok}/{len(results)} edges have valid backdoor sets")
        print(f"         {n_fd}/{len(results)} edges have frontdoor paths")

    return dag, results


def _nodes_to_columns(
    node_names: Optional[List[str]],
    dag: CausalDAG,
    timeline_columns: Optional[Set[str]] = None,
) -> List[str]:
    """Convert abstract node names to actual timeline column names."""
    if node_names is None:
        return []
    columns = []
    for node in node_names:
        cols = dag.node_to_columns.get(node, [node])
        if timeline_columns:
            available = [c for c in cols if c in timeline_columns]
            if available:
                columns.append(available[0])
            elif cols:
                columns.append(cols[0])  # Use first even if not in timeline
            else:
                columns.append(node)
        else:
            columns.append(cols[0] if cols else node)
    return columns


def update_edges_with_adjustment_sets(
    edges: List[EdgeSpec],
    results: List[AdjustmentResult],
) -> List[EdgeSpec]:
    """
    Update EdgeSpecs with computed adjustment sets.

    Replaces the hand-curated adjustment_set on each EdgeSpec with
    the algorithmically computed minimal sufficient set.
    """
    result_by_name = {r.edge_name: r for r in results}

    for edge in edges:
        result = result_by_name.get(edge.name)
        if result and result.backdoor_admissible:
            edge.adjustment_set = result.adjustment_set

    return edges


# ===================================================================
# REPORTING
# ===================================================================

def print_dag_summary(dag: CausalDAG) -> None:
    """Print a summary of the causal DAG."""
    G = dag.graph

    print(f"\nCausal DAG Summary")
    print(f"  Nodes: {G.number_of_nodes()}")
    print(f"  Edges: {G.number_of_edges()}")
    print(f"  Observable: {len(dag.observable_nodes)}")
    print(f"  Latent: {len(dag.latent_nodes)}")

    # Group by COMPLE category
    by_cat = {}
    for node in G.nodes():
        cat = G.nodes[node].get("comple", "?")
        by_cat.setdefault(cat, []).append(node)

    for cat in ["C", "L", "M", "O", "E"]:
        nodes = by_cat.get(cat, [])
        if nodes:
            print(f"\n  {cat} nodes ({len(nodes)}):")
            for n in sorted(nodes):
                obs = "obs" if n in dag.observable_nodes else "latent"
                in_deg = G.in_degree(n)
                out_deg = G.out_degree(n)
                print(f"    {n:35s} [{obs}] in={in_deg} out={out_deg}")


def generate_mermaid_dag(dag: CausalDAG, edges: List[EdgeSpec]) -> str:
    """Generate a Mermaid diagram of the causal DAG."""
    G = dag.graph
    lines = ["graph LR"]

    # Style classes by COMPLE category
    cat_styles = {
        "C": "fill:#4CAF50,color:white",    # Green
        "L": "fill:#FF9800,color:white",     # Orange
        "M": "fill:#2196F3,color:white",     # Blue
        "O": "fill:#9C27B0,color:white",     # Purple
        "E": "fill:#9E9E9E,color:white",     # Gray
    }

    # Add nodes grouped by category
    for cat in ["C", "L", "M", "O", "E"]:
        nodes = [n for n in G.nodes() if G.nodes[n].get("comple") == cat]
        for node in sorted(nodes):
            if node in dag.latent_nodes:
                # Dashed border for latent
                lines.append(f"    {_mermaid_id(node)}([\"{node}\"])")
            else:
                lines.append(f"    {_mermaid_id(node)}[\"{node}\"]")

    # Add edges
    for src, tgt, data in G.edges(data=True):
        etype = data.get("edge_type", "unknown")
        if etype == "discovered":
            lines.append(f"    {_mermaid_id(src)} -->|data| {_mermaid_id(tgt)}")
        elif etype == "confounds":
            lines.append(f"    {_mermaid_id(src)} -.->|confounds| {_mermaid_id(tgt)}")
        else:
            lines.append(f"    {_mermaid_id(src)} --> {_mermaid_id(tgt)}")

    # Style classes
    for cat, style in cat_styles.items():
        nodes = [n for n in G.nodes() if G.nodes[n].get("comple") == cat]
        if nodes:
            node_ids = ",".join(_mermaid_id(n) for n in nodes)
            lines.append(f"    style {node_ids} {style}")

    return "\n".join(lines)


def _mermaid_id(name: str) -> str:
    """Convert node name to valid Mermaid ID."""
    return name.replace(" ", "_").replace("-", "_").replace(".", "_")


# ===================================================================
# CLI
# ===================================================================

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')

    import pandas as pd
    from inference_engine.config import DAILY_TIMELINE_CSV
    from inference_engine.causal.edge_discovery import discover_edges

    print(f"Loading timeline: {DAILY_TIMELINE_CSV}")
    timeline = pd.read_csv(DAILY_TIMELINE_CSV, parse_dates=["date"])
    print(f"Shape: {timeline.shape}")

    # Discover edges
    edges = discover_edges(timeline)

    # Compute adjustment sets
    dag, results = compute_adjustment_sets(
        edges, set(timeline.columns), verbose=True
    )

    # Print DAG summary
    print_dag_summary(dag)

    # Update edges with computed sets
    edges = update_edges_with_adjustment_sets(edges, results)

    print("\n\nFinal edge adjustment sets:")
    for edge in edges:
        print(f"  {edge.name:42s} -> adjust on: {edge.adjustment_set}")
