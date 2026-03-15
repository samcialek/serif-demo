import type {
  Archetype,
  CategoricalNodeId,
  ContinuousNodeId,
  NodeStatus,
  QuestionDef,
  RespondentState
} from "../types.js";
import { FIXED_12, EXPLOIT_BLEND_START, EXPLOIT_BLEND_END } from "./config.js";
import { archetypeDistance } from "./archetypeDistance.js";

// ---------------------------------------------------------------------------
// eligibleIf predicate evaluator
// ---------------------------------------------------------------------------

const LIVE_OR_UNRESOLVED: ReadonlySet<NodeStatus> = new Set(["unknown", "live_unresolved"]);

function nodeIsLiveOrUnresolved(state: RespondentState, nodeId: string): boolean {
  if (nodeId in state.continuous) {
    return LIVE_OR_UNRESOLVED.has(state.continuous[nodeId as ContinuousNodeId].status);
  }
  if (nodeId in state.categorical) {
    return LIVE_OR_UNRESOLVED.has(state.categorical[nodeId as CategoricalNodeId].status);
  }
  return false;
}

function answeredCount(state: RespondentState): number {
  return Object.keys(state.answers).length;
}

function evaluatePredicate(state: RespondentState, predicate: string): boolean {
  // Pattern: {NODE}_live_or_unresolved
  const liveMatch = predicate.match(/^(.+)_live_or_unresolved$/);
  if (liveMatch) {
    const nodeId = liveMatch[1]!;
    return nodeIsLiveOrUnresolved(state, nodeId);
  }

  const answered = answeredCount(state);

  switch (predicate) {
    // Eligible once we're past the fixed12 phase
    case "screen20_or_late_screen":
      return answered >= FIXED_12.length;

    // Late-stage consistency checks — most of the quiz is done
    case "late_consistency_check_only":
      return answered >= 30;

    // Low-weight items surfaced moderately late
    case "late_low_weight_only":
      return answered >= 20;

    // Background/biographical questions — very late filler
    case "background_prior_only":
      return answered >= 35;

    // Background eligible OR the TRB anchor is still uncertain
    case "background_prior_only_or_TRB_anchor_active": {
      if (answered >= 35) return true;
      // TRB anchor is "active" if it has been touched at least once
      // and the top probability is still below a clear-winner threshold
      const topAnchorProb = Math.max(...state.trbAnchor.dist);
      return state.trbAnchor.touches >= 1 && topAnchorProb < 0.45;
    }

    default:
      // Unknown predicate — fail closed (ineligible)
      return false;
  }
}

/**
 * Evaluate a question's eligibleIf rules against the current respondent state.
 *
 * - If no eligibleIf array exists, the question is always eligible.
 * - If the array is present, at least one predicate must be true (OR semantics).
 */
export function isQuestionEligible(state: RespondentState, q: QuestionDef): boolean {
  const rules = q.exposeRules?.eligibleIf;
  if (!rules || rules.length === 0) return true;
  return rules.some((predicate) => evaluatePredicate(state, predicate));
}

// ---------------------------------------------------------------------------
// Phase 1: Coverage-based scoring (exploration)
// ---------------------------------------------------------------------------

function topCandidateArchetypes(
  posterior: Record<string, number>,
  archetypes: Archetype[],
  k = 5
): Archetype[] {
  return [...archetypes]
    .sort((a, b) => (posterior[b.id] ?? 0) - (posterior[a.id] ?? 0))
    .slice(0, k);
}

function nodeUncertainty(state: RespondentState, nodeId: string): number {
  if (nodeId in state.continuous) {
    const node = state.continuous[nodeId as ContinuousNodeId];
    return 1 - Math.max(...node.posDist);
  }
  if (nodeId in state.categorical) {
    const node = state.categorical[nodeId as CategoricalNodeId];
    return 1 - Math.max(...node.catDist);
  }
  if (nodeId === "TRB_ANCHOR") {
    return 1 - Math.max(...state.trbAnchor.dist);
  }
  return 0;
}

function coverageNeed(state: RespondentState, q: QuestionDef): number {
  let score = 0;
  for (const touch of q.touchProfile) {
    if (touch.node === "TRB_ANCHOR") {
      score += state.trbAnchor.touches < 2 ? 1 : 0.25;
      continue;
    }
    if (touch.kind === "continuous" && touch.node in state.continuous) {
      const n = state.continuous[touch.node as ContinuousNodeId];
      score += n.touches < 3 ? 1 : 0.25;
    } else if (touch.kind === "categorical" && touch.node in state.categorical) {
      const n = state.categorical[touch.node as CategoricalNodeId];
      score += n.touches < 4 ? 1.25 : 0.35;
    }
  }
  return score / Math.max(1, q.touchProfile.length);
}

function candidateSeparation(q: QuestionDef, candidates: Archetype[]): number {
  let total = 0;
  for (const touch of q.touchProfile) {
    if (touch.node === "TRB_ANCHOR") continue;
    const vals = candidates
      .map((a) => a.nodes[touch.node as keyof typeof a.nodes])
      .filter(Boolean)
      .map((t) => JSON.stringify(t));
    const uniq = new Set(vals);
    total += uniq.size > 1 ? 1 : 0.2;
  }
  return total / Math.max(1, q.touchProfile.length);
}

function scoreExploration(
  state: RespondentState,
  q: QuestionDef,
  archetypes: Archetype[]
): number {
  const candidates = topCandidateArchetypes(state.archetypePosterior, archetypes, 6);

  const uncertainty =
    q.touchProfile.reduce((sum, t) => sum + nodeUncertainty(state, t.node), 0) /
    Math.max(1, q.touchProfile.length);

  return (
    coverageNeed(state, q) *
    Math.max(0.05, uncertainty) *
    candidateSeparation(q, candidates) *
    q.quality *
    (q.rewriteNeeded ? 0.7 : 1.0)
  );
}

// ---------------------------------------------------------------------------
// Phase 2: Discrimination-based scoring (exploitation)
//
// Instead of broad coverage, focus on the nodes where the top candidates
// differ most. Score each question by how much the top-2 archetypes
// disagree on the nodes it touches — weighted by each touch's weight.
// ---------------------------------------------------------------------------

/**
 * Compute pairwise disagreement between two archetypes on the nodes
 * touched by question q.
 */
function pairwiseDisagreement(
  q: QuestionDef,
  a1: Archetype,
  a2: Archetype
): { disagreement: number; weight: number } {
  let totalDisagreement = 0;
  let totalWeight = 0;

  for (const touch of q.touchProfile) {
    if (touch.node === "TRB_ANCHOR") continue;
    const nodeId = touch.node as ContinuousNodeId | CategoricalNodeId;
    const t1 = a1.nodes[nodeId];
    const t2 = a2.nodes[nodeId];
    if (!t1 || !t2) continue;

    const w = touch.weight;
    totalWeight += w;

    if (t1.kind === "continuous" && t2.kind === "continuous") {
      const posDiff = Math.abs(t1.pos - t2.pos) / 4;
      const salDiff = Math.abs(t1.sal - t2.sal) / 3;
      totalDisagreement += w * (posDiff * 0.8 + salDiff * 0.2);
    } else if (t1.kind === "categorical" && t2.kind === "categorical") {
      let dot = 0;
      for (let i = 0; i < 6; i++) {
        dot += (t1.probs[i] ?? 0) * (t2.probs[i] ?? 0);
      }
      totalDisagreement += w * (1 - dot);
    }
  }

  return { disagreement: totalDisagreement, weight: totalWeight };
}

/**
 * Score a question by how well it discriminates among the top-K candidates.
 * Checks ALL pairwise disagreements among the top K (not just top-2),
 * weighted by how close each pair is in posterior probability.
 */
function discriminationScore(
  state: RespondentState,
  q: QuestionDef,
  topK: Archetype[]
): number {
  let totalScore = 0;
  let pairCount = 0;

  for (let i = 0; i < topK.length; i++) {
    for (let j = i + 1; j < topK.length; j++) {
      const a1 = topK[i]!;
      const a2 = topK[j]!;
      const { disagreement, weight } = pairwiseDisagreement(q, a1, a2);
      if (weight === 0) continue;

      // Weight pair by closeness in posterior (closer pairs are more important)
      const p1 = state.archetypePosterior[a1.id] ?? 0;
      const p2 = state.archetypePosterior[a2.id] ?? 0;
      const closeness = Math.min(p1, p2) / Math.max(p1, p2, 0.001);

      totalScore += (disagreement / weight) * closeness;
      pairCount++;
    }
  }

  if (pairCount === 0) return 0;

  const uncertainty =
    q.touchProfile.reduce((sum, t) => sum + nodeUncertainty(state, t.node), 0) /
    Math.max(1, q.touchProfile.length);

  return (
    (totalScore / pairCount) *
    Math.max(0.1, uncertainty) *
    q.quality *
    (q.rewriteNeeded ? 0.7 : 1.0)
  );
}

// ---------------------------------------------------------------------------
// Blended scoring: smooth transition from exploration to exploitation
//
// Starts blending at EXPLOIT_BLEND_START, fully exploitative by
// EXPLOIT_BLEND_END. This lets the engine switch to discriminative
// questions earlier, targeting the nodes where top candidates disagree.
// ---------------------------------------------------------------------------

function scoreQuestionBlended(
  state: RespondentState,
  q: QuestionDef,
  archetypes: Archetype[]
): number {
  const nAnswered = Object.keys(state.answers).length;

  if (nAnswered < EXPLOIT_BLEND_START) {
    return scoreExploration(state, q, archetypes);
  }

  const exploitAlpha = Math.min(
    1.0,
    (nAnswered - EXPLOIT_BLEND_START) / (EXPLOIT_BLEND_END - EXPLOIT_BLEND_START)
  );

  const exploreScore = scoreExploration(state, q, archetypes);

  // Discriminate top-2: focus on the decision boundary that matters most.
  // Using more than 2 dilutes the signal across too many pairs.
  const candidates = topCandidateArchetypes(state.archetypePosterior, archetypes, 2);
  if (candidates.length < 2) return exploreScore;

  const discrimScore = discriminationScore(state, q, candidates);

  // Blend: as we move past EXPLOIT_BLEND_START, weight discrimination higher
  return exploreScore * (1 - exploitAlpha) + discrimScore * exploitAlpha;
}

// ---------------------------------------------------------------------------
// Question selection
// ---------------------------------------------------------------------------

export function selectNextQuestion(
  state: RespondentState,
  available: QuestionDef[],
  archetypes: Archetype[]
): QuestionDef | null {
  const eligible = available.filter(
    (q) => !(q.id in state.answers) && isQuestionEligible(state, q)
  );
  if (!eligible.length) return null;

  const scored = eligible.map((q) => ({
    q,
    score: scoreQuestionBlended(state, q, archetypes)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.q ?? null;
}

// Keep old export for compatibility with diagnostic scripts
export function scoreQuestionForExposure(
  state: RespondentState,
  q: QuestionDef,
  archetypes: Archetype[]
): number {
  return scoreQuestionBlended(state, q, archetypes);
}
