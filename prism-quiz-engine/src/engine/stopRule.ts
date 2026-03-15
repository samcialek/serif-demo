import type { Archetype, ContinuousNodeId, CategoricalNodeId, RespondentState } from "../types.js";
import {
  STOP_MARGIN_THRESHOLD,
  STOP_POSTERIOR_THRESHOLD,
  STOP_MIN_QUESTIONS,
  STOP_MIN_CONSECUTIVE_LEADS,
  STOP_AGREEMENT_K,
} from "./config.js";

// Confidence gap above which a categorical node's "live_unresolved" status
// does not block the stop rule.  The node REMAINS live_unresolved for
// question-selection gating, but the stop rule treats it as effectively
// resolved because the respondent's category is crystallised.
const CAT_CONFIDENT_GAP = 0.50;

// Precompute cosine similarities between archetype node vectors once.
// Used to detect close pairs that need a higher margin.
let _pairSimilarityCache: Map<string, number> | null = null;

function ensureSimilarityCache(archetypes: Archetype[]): Map<string, number> {
  if (_pairSimilarityCache) return _pairSimilarityCache;
  _pairSimilarityCache = new Map();

  function toVector(a: Archetype): number[] {
    const v: number[] = [];
    for (const [, t] of Object.entries(a.nodes)) {
      if (t.kind === "continuous") {
        v.push(t.pos / 5, t.sal / 3);
      } else {
        v.push(...t.probs, t.sal / 3);
      }
    }
    return v;
  }

  function cosine(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += (a[i] ?? 0) * (b[i] ?? 0);
      na += (a[i] ?? 0) ** 2;
      nb += (b[i] ?? 0) ** 2;
    }
    return na > 0 && nb > 0 ? dot / Math.sqrt(na * nb) : 0;
  }

  const vecs = archetypes.map(a => ({ id: a.id, vec: toVector(a) }));
  for (let i = 0; i < vecs.length; i++) {
    for (let j = i + 1; j < vecs.length; j++) {
      const sim = cosine(vecs[i]!.vec, vecs[j]!.vec);
      const key = [vecs[i]!.id, vecs[j]!.id].sort().join("|");
      _pairSimilarityCache.set(key, sim);
    }
  }
  return _pairSimilarityCache;
}

export function shouldStop(
  state: RespondentState,
  archetypes?: Archetype[]
): boolean {
  const nAnswered = Object.keys(state.answers).length;
  if (nAnswered < STOP_MIN_QUESTIONS) return false;

  const entries = Object.entries(state.archetypePosterior)
    .sort((a, b) => b[1] - a[1]);
  const topId = entries[0]?.[0] ?? "";
  const top = entries[0]?.[1] ?? 0;
  const secondId = entries[1]?.[0] ?? "";
  const second = entries[1]?.[1] ?? 0;
  const margin = top - second;

  // ---------------------------------------------------------------------------
  // Adaptive posterior threshold: with 100+ archetypes, even a clear winner
  // may only reach ~20%. Scale the threshold based on the effective number
  // of archetypes still in play (those with >0.5% posterior).
  // ---------------------------------------------------------------------------
  const significantCount = entries.filter(([, p]) => p > 0.005).length;
  // With 5 significant: threshold = 0.25 (original)
  // With 20 significant: threshold = ~0.15
  // With 40 significant: threshold = ~0.12
  const adaptiveThreshold = Math.max(
    0.10,
    Math.min(STOP_POSTERIOR_THRESHOLD, 1.0 / Math.sqrt(significantCount) * 0.55)
  );

  // If the top-2 archetypes are very similar (cosine > 0.96), require a
  // higher margin before stopping — these pairs are inherently hard to
  // separate and early stopping is likely to catch the wrong one.
  let effectiveMargin = STOP_MARGIN_THRESHOLD;
  if (archetypes) {
    const cache = ensureSimilarityCache(archetypes);
    const key = [topId, secondId].sort().join("|");
    const sim = cache.get(key) ?? 0;
    if (sim > 0.95) {
      effectiveMargin = STOP_MARGIN_THRESHOLD * 4.0;
    } else if (sim > 0.92) {
      effectiveMargin = STOP_MARGIN_THRESHOLD * 2.5;
    }
  }

  // Leader must have held the top spot for several consecutive questions.
  const stableLeader = (state.consecutiveLeadCount ?? 0) >= STOP_MIN_CONSECUTIVE_LEADS;

  // ---------------------------------------------------------------------------
  // Hierarchical stop: unresolved nodes only block if top-K candidates
  // actually disagree on them. If all viable leaders agree on a node, its
  // "unresolved" status is non-blocking — resolution won't change the outcome.
  // ---------------------------------------------------------------------------

  const topKIds = entries.slice(0, STOP_AGREEMENT_K).map(([id]) => id);
  const topKArchetypes = archetypes
    ? archetypes.filter((a) => topKIds.includes(a.id))
    : [];

  function topKAgreeOnContinuous(nodeId: string): boolean {
    if (topKArchetypes.length < 2) return true;
    const templates = topKArchetypes
      .map((a) => a.nodes[nodeId as ContinuousNodeId])
      .filter((t) => t && t.kind === "continuous");
    if (templates.length < 2) return true;
    const positions = templates.map((t) => t!.kind === "continuous" ? (t as any).pos : 0);
    return positions.every((p: number) => p === positions[0]);
  }

  function topKAgreeOnCategorical(nodeId: string): boolean {
    if (topKArchetypes.length < 2) return true;
    const templates = topKArchetypes
      .map((a) => a.nodes[nodeId as CategoricalNodeId])
      .filter((t) => t && t.kind === "categorical");
    if (templates.length < 2) return true;
    const topCats = templates.map((t) => {
      const probs = t!.kind === "categorical" ? (t as any).probs : [];
      return probs.indexOf(Math.max(...probs));
    });
    return topCats.every((c: number) => c === topCats[0]);
  }

  const anyContinuousBlocking = Object.entries(state.continuous).some(
    ([nodeId, n]) =>
      n.status === "live_unresolved" && !topKAgreeOnContinuous(nodeId)
  );

  // Categorical nodes only block stopping if their distribution is still
  // uncertain (top–second gap < CAT_CONFIDENT_GAP) AND top-K disagree.
  const anyCategoricalBlocking = Object.entries(state.categorical).some(([nodeId, n]) => {
    if (n.status !== "live_unresolved") return false;
    const sorted = [...n.catDist].sort((a, b) => b - a);
    const gap = (sorted[0] ?? 0) - (sorted[1] ?? 0);
    if (gap >= CAT_CONFIDENT_GAP) return false;
    return !topKAgreeOnCategorical(nodeId);
  });

  // Primary stop: adaptive threshold + margin + stable leader + no blocking nodes
  const primaryStop =
    top >= adaptiveThreshold &&
    margin >= effectiveMargin &&
    stableLeader &&
    !anyContinuousBlocking &&
    !anyCategoricalBlocking;

  // Secondary stop: if the leader has been stable for a long run and the
  // margin is solid, stop even if some nodes are still unresolved. This
  // handles the "moderate respondent" case where nodes stay unresolved
  // because the respondent genuinely sits between positions.
  //
  // IMPORTANT: The secondary stop must ALSO respect cosine similarity.
  // Check the leader against the top-3 candidates (not just #2) since the
  // true archetype might be in 3rd place getting confused with the leader.
  //
  // Also require the margin to be a clear fraction of the top posterior
  // (relative margin) — not just an absolute gap. A 5% gap when the leader
  // is at 15% is very different from a 5% gap when the leader is at 40%.
  const deepStableLeader = (state.consecutiveLeadCount ?? 0) >= 6;

  let secondaryMarginMultiplier = 1.5;
  if (archetypes) {
    const cache = ensureSimilarityCache(archetypes);
    const top3Ids = entries.slice(1, 4).map(([id]) => id);
    let maxSim = 0;
    for (const otherId of top3Ids) {
      const key = [topId, otherId].sort().join("|");
      maxSim = Math.max(maxSim, cache.get(key) ?? 0);
    }
    if (maxSim > 0.95) {
      secondaryMarginMultiplier = 5.0;
    } else if (maxSim > 0.92) {
      secondaryMarginMultiplier = 3.0;
    } else if (maxSim > 0.88) {
      secondaryMarginMultiplier = 2.0;
    }
  }

  // Require both absolute margin AND relative margin (leader must be ≥1.4x runner-up)
  const solidAbsMargin = margin >= effectiveMargin * secondaryMarginMultiplier;
  const solidRelMargin = second > 0 ? (top / second) >= 1.4 : true;
  const secondaryStop =
    nAnswered >= 32 &&
    top >= adaptiveThreshold &&
    solidAbsMargin &&
    solidRelMargin &&
    deepStableLeader;

  return primaryStop || secondaryStop;
}
