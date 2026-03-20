/**
 * Accuracy regression test — runs the full confusion diagnostic and asserts
 * that top-1 accuracy stays at or above the known baseline.
 *
 * Usage:  npx tsx src/accuracyTest.ts
 * Exit 0 = pass, Exit 1 = fail
 */

import { ARCHETYPES } from "./config/archetypes.js";
import { REPRESENTATIVE_QUESTIONS } from "./config/questions.representative.js";
import { FULL_QUESTIONS } from "./config/questions.full.js";
import { FIXED_16 } from "./engine/config.js";
import { createInitialState } from "./state/initialState.js";
import type {
  Archetype,
  QuestionDef,
  RespondentState,
  NodeId,
} from "./types.js";
import {
  applyAllocationAnswer,
  applyPairwiseAnswer,
  applyRankingAnswer,
  applySingleChoiceAnswer,
  applySliderAnswer,
} from "./engine/update.js";
import { recomputeArchetypePosterior, viableArchetypes, pruneArchetypes } from "./engine/archetypeDistance.js";
import { updateNodeStatuses } from "./engine/nodeStatus.js";
import { selectNextBatch } from "./engine/nextQuestion.js";
import { shouldStop } from "./engine/stopRule.js";

// ── Configuration ──
const MIN_TOP1_ACCURACY = 0.95;   // fail if top-1 drops below 95%
const MIN_TOP5_ACCURACY = 0.99;   // fail if top-5 drops below 99%

// ── Question bank (same merge logic as browser.ts / confusionDiagnostic.ts) ──
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
    ...(rq.bestWorstMap !== undefined ? { bestWorstMap: rq.bestWorstMap } : {}),
  };
});
const BANK_BY_ID = new Map(QUESTION_BANK.map((q) => [q.id, q]));

// ── Answer simulation (deterministic best-option for each archetype) ──
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
  if (map?.categorical) {
    for (const [nodeId, catDist] of Object.entries(map.categorical)) {
      const template = archetype.nodes[nodeId as NodeId];
      if (!template || template.kind !== "categorical") continue;
      let dot = 0;
      for (let i = 0; i < 6; i++) dot += ((catDist as number[])[i] ?? 0) * (template.probs[i] ?? 0);
      score += Math.log(Math.max(dot, 0.01));
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
      const scores = keys.map((k) => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
      return { type: "single_choice", value: keys[softmaxSample(scores)]! };
    }
    case "slider": {
      if (!q.sliderMap) return { type: "slider", value: 50 };
      const brackets = Object.keys(q.sliderMap);
      const scores = brackets.map((k) => scoreOptionForArchetype(archetype, q.sliderMap![k]));
      const idx = softmaxSample(scores);
      const parts = brackets[idx]!.split("-").map(Number);
      return { type: "slider", value: Math.round(((parts[0] ?? 0) + (parts[1] ?? 100)) / 2) };
    }
    case "allocation": {
      if (!q.allocationMap) return { type: "allocation", value: {} };
      const keys = Object.keys(q.allocationMap);
      const scores = keys.map((k) => scoreAllocationBucket(archetype, q.allocationMap![k]));
      const maxS = Math.max(...scores);
      const weights = scores.map((s) => Math.exp((s - maxS) / 1.0));
      const totalW = weights.reduce((a, b) => a + b, 0);
      const raw = weights.map((w) => Math.max(1, Math.round((100 * w) / totalW)));
      const rawTotal = raw.reduce((a, b) => a + b, 0);
      const allocation: Record<string, number> = {};
      keys.forEach((k, i) => { allocation[k] = Math.round((100 * raw[i]!) / rawTotal); });
      return { type: "allocation", value: allocation };
    }
    case "ranking": {
      if (!q.rankingMap) return { type: "ranking", value: [] };
      const keys = Object.keys(q.rankingMap);
      const scores = keys.map((k) => scoreAllocationBucket(archetype, q.rankingMap![k]));
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
      return { type: "ranking", value: indexed.map((x) => x.k) };
    }
    case "multi": {
      if (!q.optionEvidence) return { type: "multi", value: ["default"] };
      const keys = Object.keys(q.optionEvidence);
      const scores = keys.map((k) => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
      return { type: "multi", value: indexed.slice(0, 2).map((x) => x.k) };
    }
    case "best_worst": {
      const rmap = q.rankingMap ?? q.bestWorstMap;
      if (!rmap) return { type: "best_worst", value: [] };
      const keys = Object.keys(rmap);
      const scores = keys.map((k) => scoreAllocationBucket(archetype, rmap[k]));
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
      return { type: "best_worst", value: [indexed[0]!.k, indexed[indexed.length - 1]!.k] };
    }
    case "pairwise": {
      if (!q.pairMaps) return { type: "pairwise", value: {} };
      const result: Record<string, string> = {};
      for (const [pairId, options] of Object.entries(q.pairMaps)) {
        const optKeys = Object.keys(options);
        const scores = optKeys.map((k) => scoreAllocationBucket(archetype, options[k]));
        result[pairId] = optKeys[scores.indexOf(Math.max(...scores))]!;
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

// ── Simulation ──
function runSimulation(): { top1: number; top5: number; total: number; failures: string[] } {
  let top1Correct = 0;
  let top5Correct = 0;
  const failures: string[] = [];

  for (const trueArchetype of ARCHETYPES) {
    const answers = new Map<number, SimulatedAnswer>();
    for (const q of QUESTION_BANK) {
      answers.set(q.id, generateAnswer(trueArchetype, q));
    }

    const state = createInitialState();

    // Phase 1: Fixed 16
    for (const qid of FIXED_16) {
      const q = BANK_BY_ID.get(qid);
      if (!q) continue;
      const answer = answers.get(q.id);
      if (!answer) continue;
      applySimulatedAnswer(state, q, answer);
    }
    recomputeArchetypePosterior(state, ARCHETYPES);
    pruneArchetypes(state, ARCHETYPES);
    updateNodeStatuses(state, viableArchetypes(state, ARCHETYPES));

    // Phase 2: Batch-adaptive
    let rounds = 0;
    while (Object.keys(state.answers).length < 63 && rounds < 51) {
      const batch = selectNextBatch(state, QUESTION_BANK, ARCHETYPES);
      if (batch.length === 0) break;
      for (const next of batch) {
        rounds++;
        const answer = answers.get(next.id);
        if (!answer) applySingleChoiceAnswer(state, next, "default");
        else applySimulatedAnswer(state, next, answer);
        recomputeArchetypePosterior(state, ARCHETYPES);
      }
      pruneArchetypes(state, ARCHETYPES);
      updateNodeStatuses(state, viableArchetypes(state, ARCHETYPES));
      if (Object.keys(state.answers).length >= 25 && shouldStop(state, ARCHETYPES)) break;
    }

    const posteriors = ARCHETYPES.map((a) => ({
      id: a.id,
      posterior: state.archetypePosterior[a.id] ?? 0,
    })).sort((a, b) => b.posterior - a.posterior);

    const top1Match = posteriors[0]?.id === trueArchetype.id;
    const top5Match = posteriors.slice(0, 5).some((p) => p.id === trueArchetype.id);

    if (top1Match) top1Correct++;
    if (top5Match) top5Correct++;
    if (!top1Match) failures.push(`${trueArchetype.id} "${trueArchetype.name}" -> ${posteriors[0]?.id}`);
  }

  return { top1: top1Correct, top5: top5Correct, total: ARCHETYPES.length, failures };
}

// ── Run ──
console.log(`Running accuracy test across ${ARCHETYPES.length} archetypes...`);
const start = Date.now();
const { top1, top5, total, failures } = runSimulation();
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

const top1Pct = top1 / total;
const top5Pct = top5 / total;

console.log(`\nCompleted in ${elapsed}s`);
console.log(`Top-1 accuracy: ${top1}/${total} (${(top1Pct * 100).toFixed(1)}%)  threshold: ${(MIN_TOP1_ACCURACY * 100).toFixed(0)}%`);
console.log(`Top-5 accuracy: ${top5}/${total} (${(top5Pct * 100).toFixed(1)}%)  threshold: ${(MIN_TOP5_ACCURACY * 100).toFixed(0)}%`);

if (failures.length > 0) {
  console.log(`\nMisidentified:`);
  for (const f of failures) console.log(`  ${f}`);
}

let exitCode = 0;
if (top1Pct < MIN_TOP1_ACCURACY) {
  console.error(`\nFAIL: Top-1 accuracy ${(top1Pct * 100).toFixed(1)}% is below ${(MIN_TOP1_ACCURACY * 100).toFixed(0)}% threshold`);
  exitCode = 1;
}
if (top5Pct < MIN_TOP5_ACCURACY) {
  console.error(`\nFAIL: Top-5 accuracy ${(top5Pct * 100).toFixed(1)}% is below ${(MIN_TOP5_ACCURACY * 100).toFixed(0)}% threshold`);
  exitCode = 1;
}

if (exitCode === 0) {
  console.log(`\nPASS`);
}
process.exit(exitCode);
