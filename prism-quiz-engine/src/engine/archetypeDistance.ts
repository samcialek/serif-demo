import type { Archetype, RespondentState } from "../types.js";
import { CATEGORY_COST_MATRIX } from "../config/categories.js";
import {
  centeredPos,
  expectedPosFrom5,
  expectedSalienceWeight,
  matrixBilinear,
  normalize
} from "./math.js";
import { SALIENCE_MISMATCH_LAMBDA, TEMPERATURE } from "./config.js";

function continuousDistance(
  respondentPosDist: [number, number, number, number, number],
  respondentSalDist: [number, number, number, number],
  archetypePos: 1 | 2 | 3 | 4 | 5,
  archetypeSal: 0 | 1 | 2 | 3,
  anti?: "high" | "low"
): number {
  const rp = centeredPos(expectedPosFrom5(respondentPosDist));
  const ap = centeredPos(archetypePos);
  const rs = expectedSalienceWeight(respondentSalDist);
  const as = archetypeSal <= 1 ? 0 : archetypeSal === 2 ? 1 : 1.5;
  const w = Math.max(rs, as);

  let dist = w * Math.pow(rp - ap, 2) + SALIENCE_MISMATCH_LAMBDA * Math.abs(rs - as);

  if (anti === "high") {
    dist += rs * Math.pow(Math.max(0, rp - 0.5), 2);
  }
  if (anti === "low") {
    dist += rs * Math.pow(Math.max(0, -0.5 - rp), 2);
  }

  return dist;
}

function categoricalDistance(
  nodeId: "EPS" | "AES" | "H",
  respondentCatDist: [number, number, number, number, number, number],
  respondentSalDist: [number, number, number, number],
  archetypeProbs: [number, number, number, number, number, number],
  archetypeSal: 0 | 1 | 2 | 3,
  antiCats?: number[]
): number {
  const rs = expectedSalienceWeight(respondentSalDist);
  const as = archetypeSal <= 1 ? 0 : archetypeSal === 2 ? 1 : 1.5;
  const w = Math.max(rs, as);

  let dist =
    w * matrixBilinear(respondentCatDist, CATEGORY_COST_MATRIX[nodeId], archetypeProbs) +
    SALIENCE_MISMATCH_LAMBDA * Math.abs(rs - as);

  if (antiCats?.length) {
    for (const idx of antiCats) {
      dist += rs * (respondentCatDist[idx] ?? 0);
    }
  }

  return dist;
}

export function archetypeDistance(state: RespondentState, archetype: Archetype): number {
  let total = 0;

  for (const [nodeId, template] of Object.entries(archetype.nodes)) {
    if (template.kind === "continuous") {
      const node = state.continuous[nodeId as keyof typeof state.continuous];
      total += continuousDistance(node.posDist, node.salDist, template.pos, template.sal, template.anti);
    } else {
      const node = state.categorical[nodeId as keyof typeof state.categorical];
      total += categoricalDistance(
        nodeId as "EPS" | "AES" | "H",
        node.catDist,
        node.salDist,
        template.probs,
        template.sal,
        template.antiCats
      );
    }
  }

  return total;
}

export function recomputeArchetypePosterior(
  state: RespondentState,
  archetypes: Archetype[]
): void {
  const raw = archetypes.map((a) => a.prior * Math.exp(-archetypeDistance(state, a) / TEMPERATURE));
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

// ---------------------------------------------------------------------------
// Hierarchical pruning: compute viable archetype set
// ---------------------------------------------------------------------------

import { PRUNE_AFTER_QUESTIONS, PRUNE_RATIO, PRUNE_MIN_VIABLE } from "./config.js";

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

  if (nAnswered < PRUNE_AFTER_QUESTIONS) {
    // Pre-pruning: use top 1/3 cutoff (original behavior)
    const cutoff = topP / 3;
    return sorted.filter((a) => (state.archetypePosterior[a.id] ?? 0) >= cutoff);
  }

  // Post-pruning: aggressive hierarchical cutoff
  const cutoff = topP * PRUNE_RATIO;
  const viable = sorted.filter((a) => (state.archetypePosterior[a.id] ?? 0) >= cutoff);

  // Enforce minimum viable set size
  if (viable.length < PRUNE_MIN_VIABLE) {
    return sorted.slice(0, PRUNE_MIN_VIABLE);
  }
  return viable;
}
