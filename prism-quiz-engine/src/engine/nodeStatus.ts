import type { Archetype, NodeId, RespondentState } from "../types.js";

/**
 * Check if archetypes disagree on a node, but only considering the top-N
 * by posterior weight. With hierarchical pruning the viable set may still
 * contain 8+ archetypes, but only the top 2-3 contenders actually matter
 * for resolution. If the top contenders agree, the node is effectively
 * resolved even if a tail candidate disagrees.
 *
 * `archetypes` is expected to already be sorted by posterior (descending).
 * We only check disagreement among the top 3 entries.
 */
const DISAGREE_CHECK_K = 3;

function archetypesDisagreeOnNode(nodeId: NodeId, archetypes: Archetype[]): boolean {
  if (archetypes.length < 2) return false;

  // Only check the top-K candidates (by posterior, already sorted)
  const topK = archetypes.slice(0, DISAGREE_CHECK_K);

  const templates = topK
    .map((a) => a.nodes[nodeId])
    .filter(Boolean);

  if (templates.length < 2) return false;

  const first = templates[0]!;
  for (const t of templates) {
    if (!t) continue;
    if (first.kind !== t.kind) return true;
    if (first.kind === "continuous" && t.kind === "continuous") {
      if (first.pos !== t.pos) return true;
    } else if (first.kind === "categorical" && t.kind === "categorical") {
      const fMax = first.probs.indexOf(Math.max(...first.probs));
      const tMax = t.probs.indexOf(Math.max(...t.probs));
      if (fMax !== tMax) return true;
    }
  }
  return false;
}

export function updateNodeStatuses(
  state: RespondentState,
  candidateArchetypes: Archetype[]
): void {
  // With hierarchical pruning, the candidate set shrinks faster, which means
  // nodes resolve sooner. We also slightly relax touch thresholds: 2 touches
  // (was 3) for continuous, 3 (was 4) for categorical, to match the more
  // focused question strategy.

  for (const [nodeId, node] of Object.entries(state.continuous)) {
    const probActive = node.salDist[2] + node.salDist[3];
    const enoughTouches = node.touches >= 2 && node.touchTypes.size >= 2;
    const separates = archetypesDisagreeOnNode(nodeId as NodeId, candidateArchetypes);

    if (enoughTouches && probActive < 0.10 && !separates) {
      node.status = "dead";
    } else if (probActive >= 0.35 && (node.salDist[2] > 0.25 || node.salDist[3] > 0.25)) {
      node.status = separates ? "live_unresolved" : "live_resolved";
    } else {
      node.status = "unknown";
    }
  }

  for (const [nodeId, node] of Object.entries(state.categorical)) {
    const probActive = node.salDist[2] + node.salDist[3];
    const enoughTouches = node.touches >= 3 && node.touchTypes.size >= 2;
    const separates = archetypesDisagreeOnNode(nodeId as NodeId, candidateArchetypes);
    const sorted = [...node.catDist].sort((a, b) => b - a);
    const catUncertainty = (sorted[0] ?? 0) - (sorted[1] ?? 0) < 0.30;
    if (enoughTouches && probActive < 0.10 && !separates) {
      node.status = "dead";
    } else if (probActive >= 0.35) {
      node.status = separates || catUncertainty ? "live_unresolved" : "live_resolved";
    } else {
      node.status = "unknown";
    }
  }
}
