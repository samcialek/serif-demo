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

// Reuse question bank and answer generation from simulation.ts
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

function viableCandidates(state: RespondentState, archetypes: Archetype[]) {
  return viableArchetypes(state, archetypes);
}

// --- Answer generation (copied from simulation.ts) ---
function scoreOptionForArchetype(archetype: Archetype, evidence: any): number {
  let logScore = 0;
  if (evidence?.continuous) {
    for (const [nodeId, upd] of Object.entries(evidence.continuous)) {
      const template = archetype.nodes[nodeId as NodeId];
      if (!template || template.kind !== "continuous") continue;
      if ((upd as any)?.pos) {
        const prob = ((upd as any).pos as number[])[template.pos - 1] ?? 0.1;
        logScore += Math.log(Math.max(prob, 0.01));
      }
      if ((upd as any)?.sal) {
        const prob = ((upd as any).sal as number[])[template.sal] ?? 0.2;
        logScore += Math.log(Math.max(prob, 0.01)) * 0.5;
      }
    }
  }
  if (evidence?.categorical) {
    for (const [nodeId, upd] of Object.entries(evidence.categorical)) {
      const template = archetype.nodes[nodeId as NodeId];
      if (!template || template.kind !== "categorical") continue;
      if ((upd as any)?.cat) {
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

function softmaxSample(logScores: number[]): number {
  let bestIdx = 0;
  let bestScore = logScores[0]!;
  for (let i = 1; i < logScores.length; i++) {
    if (logScores[i]! > bestScore) { bestScore = logScores[i]!; bestIdx = i; }
  }
  return bestIdx;
}

function scoreAllocationBucket(archetype: Archetype, map: any): number {
  let score = 0;
  if (map?.continuous) {
    for (const [nodeId, signal] of Object.entries(map.continuous)) {
      const template = archetype.nodes[nodeId as NodeId];
      if (!template || template.kind !== "continuous") continue;
      score += (signal as number) * (template.pos - 3);
    }
  }
  return score;
}

type SimulatedAnswer =
  | { type: "single_choice"; value: string }
  | { type: "slider"; value: number }
  | { type: "allocation"; value: Record<string, number> }
  | { type: "ranking"; value: string[] }
  | { type: "pairwise"; value: Record<string, string> }
  | { type: "best_worst"; value: string[] }
  | { type: "multi"; value: string[] };

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
      const parts = brackets[idx]!.split("-").map(Number);
      return { type: "slider", value: Math.round(((parts[0] ?? 0) + (parts[1] ?? 100)) / 2) };
    }
    case "allocation": {
      if (!q.allocationMap) return { type: "allocation", value: {} };
      const keys = Object.keys(q.allocationMap);
      const scores = keys.map(k => scoreAllocationBucket(archetype, q.allocationMap![k]));
      const maxS = Math.max(...scores);
      const weights = scores.map(s => Math.exp((s - maxS) / 1.0));
      const totalW = weights.reduce((a, b) => a + b, 0);
      const raw = weights.map(w => Math.max(1, Math.round(100 * w / totalW)));
      const rawTotal = raw.reduce((a, b) => a + b, 0);
      const allocation: Record<string, number> = {};
      keys.forEach((k, i) => { allocation[k] = Math.round(100 * raw[i]! / rawTotal); });
      return { type: "allocation", value: allocation };
    }
    case "ranking": {
      if (!q.rankingMap) return { type: "ranking", value: [] };
      const keys = Object.keys(q.rankingMap);
      const scores = keys.map(k => scoreAllocationBucket(archetype, q.rankingMap![k]));
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
      return { type: "ranking", value: indexed.map(x => x.k) };
    }
    case "multi": {
      if (!q.optionEvidence) return { type: "multi", value: ["default"] };
      const keys = Object.keys(q.optionEvidence);
      const scores = keys.map(k => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
      return { type: "multi", value: indexed.slice(0, 2).map(x => x.k) };
    }
    case "best_worst": {
      const rmap = q.rankingMap ?? q.bestWorstMap;
      if (!rmap) return { type: "best_worst", value: [] };
      const keys = Object.keys(rmap);
      const scores = keys.map(k => scoreAllocationBucket(archetype, rmap[k]));
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
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

function applySimulatedAnswer(state: RespondentState, q: QuestionDef, answer: SimulatedAnswer): void {
  switch (answer.type) {
    case "single_choice": applySingleChoiceAnswer(state, q, answer.value); break;
    case "slider": applySliderAnswer(state, q, answer.value); break;
    case "allocation": applyAllocationAnswer(state, q, answer.value); break;
    case "ranking": applyRankingAnswer(state, q, answer.value); break;
    case "pairwise": applyPairwiseAnswer(state, q, answer.value); break;
    case "best_worst": applyRankingAnswer(state, q, answer.value); break;
    case "multi":
      for (const v of answer.value) applySingleChoiceAnswer(state, q, v);
      state.answers[q.id] = answer.value;
      break;
  }
}

// ---------------------------------------------------------------------------
// DIAGNOSTIC: For each archetype, track when stop rule WOULD fire and what
// blocks it at each step
// ---------------------------------------------------------------------------

declare const process: { argv: string[] };
const nameMap = new Map(ARCHETYPES.map(a => [a.id, a.name]));

// Track per-archetype: when does stop fire, what blocks it
type StopBlocker = { posterior: number; margin: number; unresolvedNodes: string[] };

const results: {
  id: string;
  name: string;
  stopQ: number;           // question count when stop rule first fires with correct answer
  correctAt: number[];     // list of question counts where top posterior == true archetype
  firstCorrectQ: number;   // first Q where top posterior is correct
  blockers: StopBlocker[]; // what blocked stop rule at Q20, Q25, Q30, Q35, Q40
}[] = [];

for (const trueArchetype of ARCHETYPES) {
  // Pre-generate all answers
  const answers = new Map<number, SimulatedAnswer>();
  for (const q of QUESTION_BANK) {
    answers.set(q.id, generateAnswer(trueArchetype, q));
  }

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

  let stopQ = 63; // default: never stopped
  let firstCorrectQ = 999;
  const correctAt: number[] = [];
  const blockers: StopBlocker[] = [];
  const checkpoints = [20, 25, 30, 35, 40];

  // Check after fixed12
  const nAfterFixed = Object.keys(state.answers).length;
  const posteriorsSorted = Object.entries(state.archetypePosterior).sort((a, b) => b[1] - a[1]);
  if (posteriorsSorted[0]?.[0] === trueArchetype.id) {
    correctAt.push(nAfterFixed);
    if (firstCorrectQ === 999) firstCorrectQ = nAfterFixed;
  }

  // Phase 2: Adaptive
  let rounds = 0;
  while (Object.keys(state.answers).length < 63 && rounds < 51) {
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

    const nAnswered = Object.keys(state.answers).length;
    const sorted = Object.entries(state.archetypePosterior).sort((a, b) => b[1] - a[1]);
    const topId = sorted[0]?.[0];
    const topP = sorted[0]?.[1] ?? 0;
    const secondP = sorted[1]?.[1] ?? 0;

    if (topId === trueArchetype.id) {
      correctAt.push(nAnswered);
      if (firstCorrectQ === 999) firstCorrectQ = nAnswered;
    }

    // Check stop rule
    if (shouldStop(state) && topId === trueArchetype.id && stopQ === 63) {
      stopQ = nAnswered;
    }

    // Record blockers at checkpoints
    if (checkpoints.includes(nAnswered)) {
      const unresolvedNodes: string[] = [];
      for (const [nodeId, ns] of Object.entries(state.continuous)) {
        if (ns.status === "live_unresolved") unresolvedNodes.push(nodeId);
      }
      for (const [nodeId, ns] of Object.entries(state.categorical)) {
        if (ns.status === "live_unresolved") unresolvedNodes.push(nodeId);
      }
      blockers.push({
        posterior: topP,
        margin: topP - secondP,
        unresolvedNodes
      });
    }
  }

  results.push({
    id: trueArchetype.id,
    name: trueArchetype.name,
    stopQ,
    correctAt,
    firstCorrectQ,
    blockers
  });
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

console.log("=".repeat(100));
console.log("STOP RULE DIAGNOSTIC: When would each archetype be identified?");
console.log("=".repeat(100));

// Sort by stopQ
results.sort((a, b) => a.stopQ - b.stopQ);

console.log(
  "StopQ".padStart(6) + "  " +
  "1stOK".padStart(6) + "  " +
  "ID".padEnd(6) + "  " +
  "Name".padEnd(42) + "  " +
  "Blockers@Q20".padEnd(20) + "  " +
  "Blockers@Q30".padEnd(20) + "  " +
  "Blockers@Q40".padEnd(20)
);
console.log("-".repeat(130));

for (const r of results) {
  const b20 = r.blockers.find((_, i) => [20, 25, 30, 35, 40].indexOf([20, 25, 30, 35, 40][i]!) === 0);
  const b30 = r.blockers[2]; // Q30
  const b40 = r.blockers[4]; // Q40

  const fmt = (b: StopBlocker | undefined) => {
    if (!b) return "-".padEnd(20);
    if (b.unresolvedNodes.length === 0 && b.margin >= 0.08 && b.posterior >= 0.25) return "READY".padEnd(20);
    const parts: string[] = [];
    if (b.posterior < 0.25) parts.push(`p=${(b.posterior*100).toFixed(0)}%`);
    if (b.margin < 0.08) parts.push(`m=${(b.margin*100).toFixed(1)}%`);
    if (b.unresolvedNodes.length > 0) parts.push(b.unresolvedNodes.join(","));
    return parts.join(" ").slice(0, 20).padEnd(20);
  };

  console.log(
    String(r.stopQ).padStart(6) + "  " +
    String(r.firstCorrectQ).padStart(6) + "  " +
    r.id.padEnd(6) + "  " +
    r.name.slice(0, 42).padEnd(42) + "  " +
    fmt(r.blockers[0]) + "  " +
    fmt(r.blockers[2]) + "  " +
    fmt(r.blockers[4])
  );
}

// Summary stats
const stopQs = results.map(r => r.stopQ);
const avg = stopQs.reduce((a, b) => a + b, 0) / stopQs.length;
const neverStop = stopQs.filter(q => q === 63).length;
console.log("-".repeat(130));
console.log(`Avg stop Q: ${avg.toFixed(1)}  |  Min: ${Math.min(...stopQs)}  |  Max: ${Math.max(...stopQs)}  |  Never stopped: ${neverStop}`);

// Node frequency as blocker
console.log("\n" + "=".repeat(80));
console.log("MOST FREQUENT BLOCKER NODES (across all archetypes at Q30)");
console.log("=".repeat(80));

const nodeBlockCount = new Map<string, number>();
for (const r of results) {
  const b30 = r.blockers[2]; // Q30
  if (b30) {
    for (const n of b30.unresolvedNodes) {
      nodeBlockCount.set(n, (nodeBlockCount.get(n) ?? 0) + 1);
    }
  }
}
const sortedNodes = [...nodeBlockCount.entries()].sort((a, b) => b[1] - a[1]);
for (const [node, count] of sortedNodes) {
  const pct = (100 * count / ARCHETYPES.length).toFixed(0);
  console.log(`  ${node.padEnd(8)} blocks ${String(count).padStart(3)} / ${ARCHETYPES.length} archetypes (${pct}%) at Q30`);
}

// How many are correct at Q20?
const correctAt20 = results.filter(r => r.firstCorrectQ <= 20).length;
const correctAt30 = results.filter(r => r.firstCorrectQ <= 30).length;
const correctAt40 = results.filter(r => r.firstCorrectQ <= 40).length;
console.log(`\nTop posterior is correct: at Q20: ${correctAt20}/${ARCHETYPES.length}  at Q30: ${correctAt30}/${ARCHETYPES.length}  at Q40: ${correctAt40}/${ARCHETYPES.length}`);

// Margin and posterior analysis at checkpoints
console.log("\n" + "=".repeat(80));
console.log("STOP RULE CONDITIONS MET (across all archetypes)");
console.log("=".repeat(80));
for (let ci = 0; ci < 5; ci++) {
  const cp = [20, 25, 30, 35, 40][ci]!;
  let metPosterior = 0, metMargin = 0, metNodes = 0, metAll = 0;
  for (const r of results) {
    const b = r.blockers[ci];
    if (!b) continue;
    if (b.posterior >= 0.25) metPosterior++;
    if (b.margin >= 0.08) metMargin++;
    if (b.unresolvedNodes.length === 0) metNodes++;
    if (b.posterior >= 0.25 && b.margin >= 0.08 && b.unresolvedNodes.length === 0) metAll++;
  }
  console.log(`  Q${cp}: posterior≥25%: ${metPosterior}  margin≥8%: ${metMargin}  noUnresolved: ${metNodes}  ALL MET: ${metAll}`);
}
