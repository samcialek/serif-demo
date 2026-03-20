import type { Archetype, RespondentState } from "../types.js";
import { CATEGORY_COST_MATRIX } from "../config/categories.js";
import {
  centeredPos,
  expectedPosFrom5,
  expectedSalienceWeight,
  matrixBilinear,
  normalize
} from "./math.js";
import { getConfig } from "../optimize/runtimeConfig.js";

function continuousDistance(
  respondentPosDist: [number, number, number, number, number],
  respondentSalDist: [number, number, number, number],
  archetypePos: 1 | 2 | 3 | 4 | 5,
  archetypeSal: 0 | 1 | 2 | 3,
  anti?: "high" | "low"
): number {
  const cfg = getConfig();
  const rp = centeredPos(expectedPosFrom5(respondentPosDist));
  const ap = centeredPos(archetypePos);
  const rs = expectedSalienceWeight(respondentSalDist);
  const as = archetypeSal <= 1 ? 0 : archetypeSal === 2 ? 1 : 1.5;
  const w = rs + cfg.ARCHETYPE_WEIGHT_BOOST * Math.max(0, as - rs);

  let dist = w * Math.pow(rp - ap, 2) + cfg.SALIENCE_MISMATCH_LAMBDA * Math.abs(rs - as);

  if (anti === "high") {
    dist += rs * Math.pow(Math.max(0, rp - 0.5), 2);
  }
  if (anti === "low") {
    dist += rs * Math.pow(Math.max(0, -0.5 - rp), 2);
  }

  if (cfg.CONFIRM_LAMBDA > 0 && as > 0) {
    const gap = Math.abs(rp - ap);
    if (gap < cfg.CONFIRM_RADIUS) {
      dist -= cfg.CONFIRM_LAMBDA * as * (cfg.CONFIRM_RADIUS - gap);
    }
  }

  return dist;
}

function categoricalDistance(
  nodeId: "EPS" | "AES",
  respondentCatDist: [number, number, number, number, number, number],
  respondentSalDist: [number, number, number, number],
  archetypeProbs: [number, number, number, number, number, number],
  archetypeSal: 0 | 1 | 2 | 3,
  antiCats?: number[]
): number {
  const cfg = getConfig();
  const rs = expectedSalienceWeight(respondentSalDist);
  const as = archetypeSal <= 1 ? 0 : archetypeSal === 2 ? 1 : 1.5;
  const w = rs + cfg.ARCHETYPE_WEIGHT_BOOST * Math.max(0, as - rs);

  let dist =
    w * matrixBilinear(respondentCatDist, CATEGORY_COST_MATRIX[nodeId], archetypeProbs) +
    cfg.SALIENCE_MISMATCH_LAMBDA * Math.abs(rs - as);

  if (antiCats?.length) {
    for (const idx of antiCats) {
      dist += rs * (respondentCatDist[idx] ?? 0);
    }
  }

  if (cfg.CONFIRM_LAMBDA > 0 && as > 0) {
    let dot = 0;
    for (let i = 0; i < 6; i++) dot += (respondentCatDist[i] ?? 0) * (archetypeProbs[i] ?? 0);
    dist -= cfg.CONFIRM_LAMBDA * as * Math.max(0, dot - 0.2);
  }

  return dist;
}

export function archetypeDistance(state: RespondentState, archetype: Archetype): number {
  let total = 0;

  const cfg = getConfig();
  const nAnswered = Object.keys(state.answers).length;
  const surpriseScale = cfg.SALIENCE_SURPRISE_LAMBDA > 0
    ? Math.max(0, (nAnswered - cfg.SURPRISE_ONSET) / (63 - cfg.SURPRISE_ONSET))
    : 0;

  for (const [nodeId, template] of Object.entries(archetype.nodes)) {
    if (template.kind === "continuous") {
      const node = state.continuous[nodeId as keyof typeof state.continuous];
      total += continuousDistance(node.posDist, node.salDist, template.pos, template.sal, template.anti);

      // Salience surprise: when archetype is indifferent (sal≤1) but respondent
      // has developed strong salience AND position disagrees, add extra distance.
      // Only active late in the quiz when salience beliefs are well-developed.
      if (surpriseScale > 0 && template.sal <= 1) {
        const rs = expectedSalienceWeight(node.salDist);
        const surprise = Math.max(0, rs - cfg.SALIENCE_SURPRISE_THRESHOLD);
        if (surprise > 0) {
          const rp = centeredPos(expectedPosFrom5(node.posDist));
          const ap = centeredPos(template.pos);
          total += surpriseScale * cfg.SALIENCE_SURPRISE_LAMBDA * surprise * surprise * Math.pow(rp - ap, 2);
        }
      }
    } else {
      const node = state.categorical[nodeId as keyof typeof state.categorical];
      total += categoricalDistance(
        nodeId as "EPS" | "AES",
        node.catDist,
        node.salDist,
        template.probs,
        template.sal,
        template.antiCats
      );

      // Salience surprise for categorical nodes
      if (surpriseScale > 0 && template.sal <= 1) {
        const rs = expectedSalienceWeight(node.salDist);
        const surprise = Math.max(0, rs - cfg.SALIENCE_SURPRISE_THRESHOLD);
        if (surprise > 0) {
          total += surpriseScale * cfg.SALIENCE_SURPRISE_LAMBDA * surprise * surprise *
            matrixBilinear(node.catDist, CATEGORY_COST_MATRIX[nodeId as "EPS" | "AES"], template.probs);
        }
      }
    }
  }

  return total;
}

/**
 * Final-scoring distance: uses w=rs (respondent-only salience weighting)
 * instead of w=max(rs, as). This removes the archetype's ability to inflate
 * distance on undeveloped dimensions. Used only for the final reranking after
 * all questions are answered — does NOT affect question selection.
 */
export function archetypeDistanceFinal(state: RespondentState, archetype: Archetype): number {
  let total = 0;

  for (const [nodeId, template] of Object.entries(archetype.nodes)) {
    if (template.kind === "continuous") {
      const node = state.continuous[nodeId as keyof typeof state.continuous];
      const rp = centeredPos(expectedPosFrom5(node.posDist));
      const ap = centeredPos(template.pos);
      const rs = expectedSalienceWeight(node.salDist);
      const as = template.sal <= 1 ? 0 : template.sal === 2 ? 1 : 1.5;

      let dist = rs * Math.pow(rp - ap, 2) + getConfig().SALIENCE_MISMATCH_LAMBDA * Math.abs(rs - as);

      if (template.anti === "high") {
        dist += rs * Math.pow(Math.max(0, rp - 0.5), 2);
      }
      if (template.anti === "low") {
        dist += rs * Math.pow(Math.max(0, -0.5 - rp), 2);
      }

      total += dist;
    } else {
      const node = state.categorical[nodeId as keyof typeof state.categorical];
      const rs = expectedSalienceWeight(node.salDist);
      const as = template.sal <= 1 ? 0 : template.sal === 2 ? 1 : 1.5;

      total +=
        rs * matrixBilinear(node.catDist, CATEGORY_COST_MATRIX[nodeId as "EPS" | "AES"], template.probs) +
        getConfig().SALIENCE_MISMATCH_LAMBDA * Math.abs(rs - as);

      if (template.antiCats?.length) {
        for (const idx of template.antiCats) {
          total += rs * (node.catDist[idx] ?? 0);
        }
      }
    }
  }

  return total;
}

export function recomputeArchetypePosterior(
  state: RespondentState,
  archetypes: Archetype[]
): void {
  const raw = archetypes.map((a) => a.prior * Math.exp(-archetypeDistance(state, a) / getConfig().TEMPERATURE));
  const probs = normalize(raw);
  archetypes.forEach((a, i) => {
    state.archetypePosterior[a.id] = probs[i] ?? 0;
  });

  // Track leader stability
  let bestId = "";
  let bestP = -1;
  for (const a of archetypes) {
    const p = state.archetypePosterior[a.id] ?? 0;
    if (p > bestP) { bestP = p; bestId = a.id; }
  }
  if (bestId === state.currentLeader) {
    state.consecutiveLeadCount = (state.consecutiveLeadCount ?? 0) + 1;
  } else {
    state.currentLeader = bestId;
    state.consecutiveLeadCount = 1;
  }
}

/**
 * Final reranking: recompute posterior using archetypeDistanceFinal (w=rs).
 * Call this ONCE after all questions are answered. Blends the final-metric
 * posterior with the running posterior using FINAL_RERANK_ALPHA.
 */
export function recomputeFinalPosterior(
  state: RespondentState,
  archetypes: Archetype[],
  alpha: number
): void {
  if (alpha <= 0) return;

  const finalRaw = archetypes.map((a) => a.prior * Math.exp(-archetypeDistanceFinal(state, a) / getConfig().TEMPERATURE));
  const finalProbs = normalize(finalRaw);

  // Blend: (1-alpha)*running + alpha*final
  archetypes.forEach((a, i) => {
    const running = state.archetypePosterior[a.id] ?? 0;
    const final_ = finalProbs[i] ?? 0;
    state.archetypePosterior[a.id] = (1 - alpha) * running + alpha * final_;
  });

  // Re-normalize
  const total = archetypes.reduce((s, a) => s + (state.archetypePosterior[a.id] ?? 0), 0);
  if (total > 0) {
    archetypes.forEach((a) => {
      state.archetypePosterior[a.id] = (state.archetypePosterior[a.id] ?? 0) / total;
    });
  }
}

// ---------------------------------------------------------------------------
// Hierarchical pruning: compute viable archetype set
// ---------------------------------------------------------------------------

// Pruning constants now read from runtimeConfig via getConfig()

/**
 * Returns the set of archetypes that are still viable candidates given the
 * current posterior. Before PRUNE_AFTER_QUESTIONS, returns a generous top-1/3
 * set. After that, aggressively prunes to archetypes within PRUNE_RATIO of
 * the leader, subject to PRUNE_MIN_VIABLE floor.
 */
export function viableArchetypes(
  state: RespondentState,
  archetypes: Archetype[]
): Archetype[] {
  const nAnswered = Object.keys(state.answers).length;
  const sorted = [...archetypes].sort(
    (a, b) => (state.archetypePosterior[b.id] ?? 0) - (state.archetypePosterior[a.id] ?? 0)
  );
  const topP = state.archetypePosterior[sorted[0]?.id ?? ""] ?? 0;

  const cfg = getConfig();
  if (nAnswered < cfg.PRUNE_AFTER_QUESTIONS) {
    const cutoff = topP / 3;
    return sorted.filter((a) => (state.archetypePosterior[a.id] ?? 0) >= cutoff);
  }

  const cutoff = topP * cfg.PRUNE_RATIO;
  const viable = sorted.filter((a) => (state.archetypePosterior[a.id] ?? 0) >= cutoff);

  if (viable.length < cfg.PRUNE_MIN_VIABLE) {
    return sorted.slice(0, cfg.PRUNE_MIN_VIABLE);
  }
  return viable;
}

// ---------------------------------------------------------------------------
// Hard prune: zero out posterior for archetypes below threshold, renormalize.
// Called at batch boundaries to permanently remove dead candidates.
// ---------------------------------------------------------------------------

export function pruneArchetypes(
  state: RespondentState,
  archetypes: Archetype[],
  threshold: number = getConfig().BATCH_PRUNE_THRESHOLD,
  minViable: number = getConfig().BATCH_PRUNE_MIN_VIABLE
): void {
  const sorted = [...archetypes].sort(
    (a, b) => (state.archetypePosterior[b.id] ?? 0) - (state.archetypePosterior[a.id] ?? 0)
  );
  const topP = state.archetypePosterior[sorted[0]?.id ?? ""] ?? 0;
  if (topP === 0) return;

  const cutoff = topP * threshold;

  // Count survivors
  const survivors = sorted.filter(
    (a) => (state.archetypePosterior[a.id] ?? 0) >= cutoff
  );

  if (survivors.length >= minViable) {
    for (const a of archetypes) {
      if ((state.archetypePosterior[a.id] ?? 0) < cutoff) {
        state.archetypePosterior[a.id] = 0;
      }
    }
  } else {
    // Keep at least minViable
    const keepSet = new Set(sorted.slice(0, minViable).map((a) => a.id));
    for (const a of archetypes) {
      if (!keepSet.has(a.id)) {
        state.archetypePosterior[a.id] = 0;
      }
    }
  }

  // Renormalize
  const total = archetypes.reduce(
    (s, a) => s + (state.archetypePosterior[a.id] ?? 0), 0
  );
  if (total > 0) {
    for (const a of archetypes) {
      state.archetypePosterior[a.id] = (state.archetypePosterior[a.id] ?? 0) / total;
    }
  }
}
