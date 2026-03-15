import { ARCHETYPES } from "./config/archetypes.js";
import { REPRESENTATIVE_QUESTIONS } from "./config/questions.representative.js";
import { FULL_QUESTIONS } from "./config/questions.full.js";
import { FIXED_12 } from "./engine/config.js";
import { createInitialState } from "./state/initialState.js";
import type { Archetype, QuestionDef, RespondentState, ContinuousNodeId, CategoricalNodeId, NodeId } from "./types.js";
import {
  applyAllocationAnswer,
  applyPairwiseAnswer,
  applyRankingAnswer,
  applySingleChoiceAnswer,
  applySliderAnswer
} from "./engine/update.js";
import { recomputeArchetypePosterior, archetypeDistance, viableArchetypes } from "./engine/archetypeDistance.js";
import { updateNodeStatuses } from "./engine/nodeStatus.js";
import { selectNextQuestion, isQuestionEligible } from "./engine/nextQuestion.js";
import { shouldStop } from "./engine/stopRule.js";

// ---------------------------------------------------------------------------
// Build question bank: FULL_QUESTIONS scaffolding enriched with evidence maps
// from REPRESENTATIVE_QUESTIONS wherever IDs match.
// ---------------------------------------------------------------------------

const REP_BY_ID = new Map(REPRESENTATIVE_QUESTIONS.map((q) => [q.id, q]));

const QUESTION_BANK: QuestionDef[] = FULL_QUESTIONS.map((fq) => {
  const rq = REP_BY_ID.get(fq.id);
  if (!rq) return fq;
  return {
    ...fq,
    ...(rq.optionEvidence !== undefined ? { optionEvidence: rq.optionEvidence } : {}),
    ...(rq.sliderMap !== undefined ? { sliderMap: rq.sliderMap } : {}),
    ...(rq.allocationMap !== undefined ? { allocationMap: rq.allocationMap } : {}),
    ...(rq.rankingMap !== undefined ? { rankingMap: rq.rankingMap } : {}),
    ...(rq.pairMaps !== undefined ? { pairMaps: rq.pairMaps } : {}),
    ...(rq.bestWorstMap !== undefined ? { bestWorstMap: rq.bestWorstMap } : {})
  };
});

const BANK_BY_ID = new Map(QUESTION_BANK.map((q) => [q.id, q]));

// ---------------------------------------------------------------------------
// Viable candidates helper (same logic as index.ts)
// ---------------------------------------------------------------------------

function viableCandidates(state: RespondentState, archetypes: Archetype[]) {
  return viableArchetypes(state, archetypes);
}

// ---------------------------------------------------------------------------
// Answer generation helpers
// ---------------------------------------------------------------------------

/**
 * For a single option's OptionEvidence, compute how well it matches the
 * archetype's node positions. Returns a log-score.
 */
function scoreOptionForArchetype(archetype: Archetype, evidence: any): number {
  let logScore = 0;
  if (evidence?.continuous) {
    for (const [nodeId, upd] of Object.entries(evidence.continuous)) {
      const template = archetype.nodes[nodeId as NodeId];
      if (!template || template.kind !== "continuous") continue;
      if ((upd as any)?.pos) {
        // How likely is the archetype's position under this evidence distribution?
        const prob = ((upd as any).pos as number[])[template.pos - 1] ?? 0.1;
        logScore += Math.log(Math.max(prob, 0.01));
      }
      if ((upd as any)?.sal) {
        const prob = ((upd as any).sal as number[])[template.sal] ?? 0.2;
        logScore += Math.log(Math.max(prob, 0.01)) * 0.5; // salience is weaker signal
      }
    }
  }
  if (evidence?.categorical) {
    for (const [nodeId, upd] of Object.entries(evidence.categorical)) {
      const template = archetype.nodes[nodeId as NodeId];
      if (!template || template.kind !== "categorical") continue;
      if ((upd as any)?.cat) {
        // Dot product of option's categorical dist with archetype's probs
        let dot = 0;
        for (let i = 0; i < 6; i++) dot += (((upd as any).cat as number[])[i] ?? 0) * (template.probs[i] ?? 0);
        logScore += Math.log(Math.max(dot, 0.01));
      }
      if ((upd as any)?.sal) {
        const prob = ((upd as any).sal as number[])[template.sal] ?? 0.2;
        logScore += Math.log(Math.max(prob, 0.01)) * 0.5;
      }
    }
  }
  return logScore;
}

/**
 * Pick the index with the highest log-score (deterministic argmax).
 */
function softmaxSample(logScores: number[], _temperature: number = 1.5): number {
  let bestIdx = 0;
  let bestScore = logScores[0]!;
  for (let i = 1; i < logScores.length; i++) {
    if (logScores[i]! > bestScore) {
      bestScore = logScores[i]!;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * For allocation buckets, which use scalar signals (not distributions),
 * compute a score reflecting alignment with the archetype's node positions.
 */
function scoreAllocationBucket(archetype: Archetype, map: any): number {
  let score = 0;
  if (map?.continuous) {
    for (const [nodeId, signal] of Object.entries(map.continuous)) {
      const template = archetype.nodes[nodeId as NodeId];
      if (!template || template.kind !== "continuous") continue;
      // Positive signal = pushes toward high pos. If archetype is high-pos, positive signal is good.
      const centeredArchetype = template.pos - 3;
      score += (signal as number) * centeredArchetype;
    }
  }
  return score;
}

// ---------------------------------------------------------------------------
// Simulated answer types and generation
// ---------------------------------------------------------------------------

type SimulatedAnswer =
  | { type: "single_choice"; value: string }
  | { type: "slider"; value: number }
  | { type: "allocation"; value: Record<string, number> }
  | { type: "ranking"; value: string[] }
  | { type: "pairwise"; value: Record<string, string> }
  | { type: "best_worst"; value: string[] }
  | { type: "multi"; value: string[] };

/**
 * Given an archetype and a question definition, generate a realistic
 * simulated answer. Uses the archetype's node positions to bias the
 * answer selection, with noise for realism.
 */
function generateAnswer(archetype: Archetype, q: QuestionDef): SimulatedAnswer {
  switch (q.uiType) {
    case "single_choice": {
      if (!q.optionEvidence) return { type: "single_choice", value: "default" };
      const keys = Object.keys(q.optionEvidence);
      const scores = keys.map(k => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
      const idx = softmaxSample(scores);
      return { type: "single_choice", value: keys[idx]! };
    }
    case "slider": {
      if (!q.sliderMap) return { type: "slider", value: 50 };
      const brackets = Object.keys(q.sliderMap);
      const scores = brackets.map(k => scoreOptionForArchetype(archetype, q.sliderMap![k]));
      const idx = softmaxSample(scores);
      const bracket = brackets[idx]!;
      // Parse bracket "0-20" -> generate value at bracket midpoint (deterministic)
      const parts = bracket.split("-").map(Number);
      const lo = parts[0] ?? 0;
      const hi = parts[1] ?? 100;
      const value = Math.round((lo + hi) / 2);
      return { type: "slider", value };
    }
    case "allocation": {
      if (!q.allocationMap) return { type: "allocation", value: {} };
      const keys = Object.keys(q.allocationMap);
      const scores = keys.map(k => scoreAllocationBucket(archetype, q.allocationMap![k]));
      // Convert to weights via softmax
      const maxS = Math.max(...scores);
      const weights = scores.map(s => Math.exp((s - maxS) / 1.0));
      const totalW = weights.reduce((a, b) => a + b, 0);
      // Allocate 100 points proportionally (deterministic)
      const raw = weights.map(w => Math.max(1, Math.round(100 * w / totalW)));
      const rawTotal = raw.reduce((a, b) => a + b, 0);
      const allocation: Record<string, number> = {};
      keys.forEach((k, i) => { allocation[k] = Math.round(100 * raw[i]! / rawTotal); });
      return { type: "allocation", value: allocation };
    }
    case "ranking": {
      if (!q.rankingMap) return { type: "ranking", value: [] };
      const keys = Object.keys(q.rankingMap);
      const scores = keys.map(k => {
        const map = q.rankingMap![k];
        return scoreAllocationBucket(archetype, map);
      });
      // Sort by score descending
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
      return { type: "ranking", value: indexed.map(x => x.k) };
    }
    case "multi": {
      if (!q.optionEvidence) return { type: "multi", value: ["default"] };
      const keys = Object.keys(q.optionEvidence);
      const scores = keys.map(k => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
      // Pick top 2
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
      return { type: "multi", value: indexed.slice(0, 2).map(x => x.k) };
    }
    case "best_worst": {
      // Use rankingMap for best_worst, fall back to bestWorstMap
      const rmap = q.rankingMap ?? q.bestWorstMap;
      if (!rmap) return { type: "best_worst", value: [] };
      const keys = Object.keys(rmap);
      const scores = keys.map(k => {
        const map = rmap[k];
        return scoreAllocationBucket(archetype, map);
      });
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
      // best_worst: return [best, worst]
      return { type: "best_worst", value: [indexed[0]!.k, indexed[indexed.length - 1]!.k] };
    }
    case "pairwise": {
      if (!q.pairMaps) return { type: "pairwise", value: {} };
      const result: Record<string, string> = {};
      for (const [pairId, options] of Object.entries(q.pairMaps)) {
        const optKeys = Object.keys(options);
        const scores = optKeys.map(k => {
          const map = options[k];
          let s = 0;
          if (map?.continuous) {
            for (const [nodeId, signal] of Object.entries(map.continuous)) {
              const template = archetype.nodes[nodeId as NodeId];
              if (!template || template.kind !== "continuous") continue;
              s += (signal as number) * (template.pos - 3);
            }
          }
          return s;
        });
        const best = scores.indexOf(Math.max(...scores));
        result[pairId] = optKeys[best]!;
      }
      return { type: "pairwise", value: result };
    }
    default:
      return { type: "single_choice", value: "default" };
  }
}

// ---------------------------------------------------------------------------
// Apply a simulated answer to state using the engine's update functions
// ---------------------------------------------------------------------------

function applySimulatedAnswer(state: RespondentState, q: QuestionDef, answer: SimulatedAnswer): void {
  switch (answer.type) {
    case "single_choice":
      applySingleChoiceAnswer(state, q, answer.value);
      break;
    case "slider":
      applySliderAnswer(state, q, answer.value);
      break;
    case "allocation":
      applyAllocationAnswer(state, q, answer.value);
      break;
    case "ranking":
      applyRankingAnswer(state, q, answer.value);
      break;
    case "pairwise":
      applyPairwiseAnswer(state, q, answer.value);
      break;
    case "best_worst":
      applyRankingAnswer(state, q, answer.value);
      break;
    case "multi":
      for (const v of answer.value) {
        applySingleChoiceAnswer(state, q, v);
      }
      // overwrite the scalar answer with the array
      state.answers[q.id] = answer.value;
      break;
  }
}

// ---------------------------------------------------------------------------
// Main simulation loop
// ---------------------------------------------------------------------------

declare const process: { argv: string[] };
const NUM_SIMS = parseInt(process.argv[2] ?? "100000", 10);

// Precompute cumulative priors for sampling
const totalPrior = ARCHETYPES.reduce((s, a) => s + a.prior, 0);
const cumulPriors: number[] = [];
let cumul = 0;
for (const a of ARCHETYPES) {
  cumul += a.prior / totalPrior;
  cumulPriors.push(cumul);
}

function sampleArchetype(): number {
  const r = Math.random();
  for (let i = 0; i < cumulPriors.length; i++) {
    if (r <= cumulPriors[i]!) return i;
  }
  return ARCHETYPES.length - 1;
}

// Results tracking
const results: { trueId: string; assignedId: string; distance: number; questionsAsked: number }[] = [];

console.log(`Starting ${NUM_SIMS.toLocaleString()} simulations...`);
const startTime = Date.now();

for (let sim = 0; sim < NUM_SIMS; sim++) {
  // Progress logging
  if (sim > 0 && sim % 100 === 0) {
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = sim / elapsed;
    const eta = (NUM_SIMS - sim) / rate;
    console.log(`  ${sim.toLocaleString()} complete (${rate.toFixed(0)}/sec, ETA ${eta.toFixed(0)}s)`);
  }

  // 1. Sample true archetype
  const trueIdx = sampleArchetype();
  const trueArchetype = ARCHETYPES[trueIdx]!;

  // 2. Pre-generate answers to all 63 questions
  const answers = new Map<number, SimulatedAnswer>();
  for (const q of QUESTION_BANK) {
    answers.set(q.id, generateAnswer(trueArchetype, q));
  }

  // 3. Run quiz engine
  const state = createInitialState();

  // Phase 1: Fixed 12
  for (const qid of FIXED_12) {
    const q = BANK_BY_ID.get(qid);
    if (!q) continue;
    const answer = answers.get(q.id);
    if (!answer) continue;
    applySimulatedAnswer(state, q, answer);
  }
  recomputeArchetypePosterior(state, ARCHETYPES);
  updateNodeStatuses(state, viableCandidates(state, ARCHETYPES));

  // Phase 2: Adaptive loop — full scoring with selectNextQuestion
  let rounds = 0;
  const MAX_ADAPTIVE = 51;
  while (Object.keys(state.answers).length < 63 && rounds < MAX_ADAPTIVE) {
    rounds++;
    const next = selectNextQuestion(state, QUESTION_BANK, ARCHETYPES);
    if (!next) break;
    const answer = answers.get(next.id);
    if (!answer) {
      applySingleChoiceAnswer(state, next, "default");
    } else {
      applySimulatedAnswer(state, next, answer);
    }
    recomputeArchetypePosterior(state, ARCHETYPES);
    updateNodeStatuses(state, viableCandidates(state, ARCHETYPES));
    if (shouldStop(state, ARCHETYPES)) break;
  }

  // 4. Record result
  const posteriors = Object.entries(state.archetypePosterior).sort((a, b) => b[1] - a[1]);
  const assignedId = posteriors[0]?.[0] ?? "unknown";
  const assignedArchetype = ARCHETYPES.find(a => a.id === assignedId);
  const dist = assignedArchetype ? archetypeDistance(state, assignedArchetype) : 999;
  const questionsAsked = Object.keys(state.answers).length;

  results.push({ trueId: trueArchetype.id, assignedId, distance: dist, questionsAsked });
}

const totalElapsed = (Date.now() - startTime) / 1000;
console.log(`\nCompleted ${NUM_SIMS.toLocaleString()} simulations in ${totalElapsed.toFixed(1)}s\n`);

// ---------------------------------------------------------------------------
// Output: Results table
// ---------------------------------------------------------------------------

// Aggregate by assigned archetype
const byAssigned = new Map<string, { count: number; totalDist: number; totalQuestions: number; correctCount: number }>();
for (const r of results) {
  let entry = byAssigned.get(r.assignedId);
  if (!entry) {
    entry = { count: 0, totalDist: 0, totalQuestions: 0, correctCount: 0 };
    byAssigned.set(r.assignedId, entry);
  }
  entry.count++;
  entry.totalDist += r.distance;
  entry.totalQuestions += r.questionsAsked;
  if (r.trueId === r.assignedId) entry.correctCount++;
}

// Sort by count descending
const sorted = [...byAssigned.entries()].sort((a, b) => b[1].count - a[1].count);

// Find archetype names
const nameMap = new Map(ARCHETYPES.map(a => [a.id, a.name]));

console.log("=".repeat(110));
console.log("SIMULATION RESULTS: Archetype Classification Distribution (100,000 respondents)");
console.log("=".repeat(110));
console.log(
  "Rank".padStart(4) + "  " +
  "ID".padEnd(6) + "  " +
  "Name".padEnd(40) + "  " +
  "Count".padStart(6) + "  " +
  "Pct".padStart(6) + "  " +
  "AvgDist".padStart(8) + "  " +
  "AvgQ".padStart(5) + "  " +
  "Accuracy".padStart(8)
);
console.log("-".repeat(110));

let rank = 0;
let totalCorrect = 0;
for (const [id, data] of sorted) {
  rank++;
  totalCorrect += data.correctCount;
  const name = nameMap.get(id) ?? id;
  const pct = (100 * data.count / NUM_SIMS).toFixed(2);
  const avgDist = (data.totalDist / data.count).toFixed(3);
  const avgQ = (data.totalQuestions / data.count).toFixed(1);
  const accuracy = (100 * data.correctCount / data.count).toFixed(1);
  console.log(
    String(rank).padStart(4) + "  " +
    id.padEnd(6) + "  " +
    name.slice(0, 40).padEnd(40) + "  " +
    String(data.count).padStart(6) + "  " +
    (pct + "%").padStart(6) + "  " +
    avgDist.padStart(8) + "  " +
    avgQ.padStart(5) + "  " +
    (accuracy + "%").padStart(8)
  );
}

console.log("-".repeat(110));
console.log(`Total assigned to at least one: ${sorted.length} / ${ARCHETYPES.length} archetypes`);
console.log(`Overall accuracy (assigned == true): ${(100 * totalCorrect / NUM_SIMS).toFixed(2)}%`);

// Summary stats
const allDists = results.map(r => r.distance);
const allQuestions = results.map(r => r.questionsAsked);
console.log(`\nOverall avg Euclidean distance from assigned centroid: ${(allDists.reduce((a, b) => a + b, 0) / allDists.length).toFixed(4)}`);
console.log(`Overall avg questions asked: ${(allQuestions.reduce((a, b) => a + b, 0) / allQuestions.length).toFixed(1)}`);
console.log(`Min/Max questions asked: ${Math.min(...allQuestions)} / ${Math.max(...allQuestions)}`);

// Also show confusion: what do mis-classified respondents get assigned to?
console.log("\n" + "=".repeat(110));
console.log("TOP CONFUSION PAIRS (true -> assigned, when misclassified)");
console.log("=".repeat(110));

const confusionPairs = new Map<string, number>();
for (const r of results) {
  if (r.trueId !== r.assignedId) {
    const key = `${nameMap.get(r.trueId) ?? r.trueId} -> ${nameMap.get(r.assignedId) ?? r.assignedId}`;
    confusionPairs.set(key, (confusionPairs.get(key) ?? 0) + 1);
  }
}
const sortedConfusion = [...confusionPairs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
for (const [pair, count] of sortedConfusion) {
  console.log(`  ${String(count).padStart(5)}  ${pair}`);
}
