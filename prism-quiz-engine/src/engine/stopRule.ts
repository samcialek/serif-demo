import type { Archetype, ContinuousNodeId, CategoricalNodeId, RespondentState } from "../types.js";
import { getConfig } from "../optimize/runtimeConfig.js";

const CAT_CONFIDENT_GAP = 0.50;

// Precompute cosine similarities between archetype node vectors once.
let _pairSimilarityCache: Map<string, number> | null = null;

export function resetSimilarityCache(): void {
  _pairSimilarityCache = null;
}

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
  const cfg = getConfig();
  const nAnswered = Object.keys(state.answers).length;
  if (nAnswered < cfg.STOP_MIN_QUESTIONS) return false;

  const entries = Object.entries(state.archetypePosterior)
    .sort((a, b) => b[1] - a[1]);
  const topId = entries[0]?.[0] ?? "";
  const top = entries[0]?.[1] ?? 0;
  const secondId = entries[1]?.[0] ?? "";
  const second = entries[1]?.[1] ?? 0;
  const margin = top - second;

  const significantCount = entries.filter(([, p]) => p > 0.005).length;
  const adaptiveThreshold = Math.max(
    0.10,
    Math.min(cfg.STOP_POSTERIOR_THRESHOLD, 1.0 / Math.sqrt(significantCount) * 0.55)
  );

  let effectiveMargin = cfg.STOP_MARGIN_THRESHOLD;
  let pairSim = 0;
  if (archetypes) {
    const cache = ensureSimilarityCache(archetypes);
    const key = [topId, secondId].sort().join("|");
    pairSim = cache.get(key) ?? 0;
    if (pairSim > 0.95) {
      effectiveMargin = cfg.STOP_MARGIN_THRESHOLD * 4.0;
    } else if (pairSim > 0.92) {
      effectiveMargin = cfg.STOP_MARGIN_THRESHOLD * 2.5;
    }
  }

  const consecutiveCount = state.consecutiveLeadCount ?? 0;
  const stableLeader = consecutiveCount >= cfg.STOP_MIN_CONSECUTIVE_LEADS;

  const topKIds = entries.slice(0, cfg.STOP_AGREEMENT_K).map(([id]) => id);
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

  const anyCategoricalBlocking = Object.entries(state.categorical).some(([nodeId, n]) => {
    if (n.status !== "live_unresolved") return false;
    const sorted = [...n.catDist].sort((a, b) => b - a);
    const gap = (sorted[0] ?? 0) - (sorted[1] ?? 0);
    if (gap >= CAT_CONFIDENT_GAP) return false;
    return !topKAgreeOnCategorical(nodeId);
  });

  const highConfOverride =
    top >= cfg.HC_POSTERIOR &&
    margin >= cfg.HC_MARGIN &&
    consecutiveCount >= cfg.HC_CONSECUTIVE &&
    pairSim < cfg.HC_COSINE_BLOCK;

  const primaryStop =
    top >= adaptiveThreshold &&
    margin >= effectiveMargin &&
    stableLeader &&
    (highConfOverride || (!anyContinuousBlocking && !anyCategoricalBlocking));

  const deepStableLeader = consecutiveCount >= 6;

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

  const solidAbsMargin = margin >= effectiveMargin * secondaryMarginMultiplier;
  const solidRelMargin = second > 0 ? (top / second) >= 1.4 : true;
  const secondaryStop =
    nAnswered >= cfg.SECONDARY_MIN_Q &&
    top >= adaptiveThreshold &&
    solidAbsMargin &&
    solidRelMargin &&
    deepStableLeader;

  const ultraConfStop =
    nAnswered >= cfg.UC_MIN_Q &&
    top >= cfg.UC_POSTERIOR &&
    margin >= cfg.UC_MARGIN &&
    consecutiveCount >= cfg.UC_CONSECUTIVE;

  const lateGameStop =
    nAnswered >= cfg.LATE_GAME_MIN_Q &&
    top >= cfg.LATE_GAME_POSTERIOR &&
    margin >= cfg.LATE_GAME_MARGIN &&
    consecutiveCount >= cfg.LATE_GAME_CONSECUTIVE;

  return primaryStop || secondaryStop || ultraConfStop || lateGameStop;
}
