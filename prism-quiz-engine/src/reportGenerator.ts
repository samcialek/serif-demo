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
import { selectNextQuestion } from "./engine/nextQuestion.js";
import { shouldStop } from "./engine/stopRule.js";
import { expectedPosFrom5, expectedSalience, expectedCatArgmax } from "./engine/math.js";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// Build question bank
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
const ALL_Q_IDS = QUESTION_BANK.map(q => q.id);

// ---------------------------------------------------------------------------
// Answer generation (same as simulation.ts)
// ---------------------------------------------------------------------------
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

function generateAnswer(archetype: Archetype, q: QuestionDef): any {
  switch (q.uiType) {
    case "single_choice": {
      if (!q.optionEvidence) return { type: "single_choice", value: "default" };
      const keys = Object.keys(q.optionEvidence);
      const scores = keys.map(k => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
      return { type: "single_choice", value: keys[softmaxSample(scores)]! };
    }
    case "slider": {
      if (!q.sliderMap) return { type: "slider", value: 50 };
      const brackets = Object.keys(q.sliderMap);
      const scores = brackets.map(k => scoreOptionForArchetype(archetype, q.sliderMap![k]));
      const bracket = brackets[softmaxSample(scores)]!;
      const parts = bracket.split("-").map(Number);
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
          const map = options[k]; let s = 0;
          if (map?.continuous) { for (const [nodeId, signal] of Object.entries(map.continuous)) { const t = archetype.nodes[nodeId as NodeId]; if (t && t.kind === "continuous") s += (signal as number) * (t.pos - 3); } }
          return s;
        });
        result[pairId] = optKeys[scores.indexOf(Math.max(...scores))]!;
      }
      return { type: "pairwise", value: result };
    }
    default:
      return { type: "single_choice", value: "default" };
  }
}

function applySimulatedAnswer(state: RespondentState, q: QuestionDef, answer: any): void {
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
// Simulation with per-archetype tracking
// ---------------------------------------------------------------------------
declare const process: { argv: string[] };
const NUM_SIMS = parseInt(process.argv[2] ?? "1000", 10);

// Per-archetype data collection
interface ArchetypeStats {
  id: string;
  name: string;
  prior: number;
  trueCount: number;
  assignedCount: number;
  correctCount: number;
  totalDistance: number;
  totalQuestions: number;
  questionFreq: Map<number, number>; // qId -> times asked
  minQuestions: number;
  maxQuestions: number;
  confusedWith: Map<string, number>; // when true=this, assigned=other
  confusedAs: Map<string, number>;   // when true=other, assigned=this
  distances: number[];
  questionCounts: number[];
}

const archetypeStats = new Map<string, ArchetypeStats>();
for (const a of ARCHETYPES) {
  archetypeStats.set(a.id, {
    id: a.id, name: a.name, prior: a.prior,
    trueCount: 0, assignedCount: 0, correctCount: 0,
    totalDistance: 0, totalQuestions: 0,
    questionFreq: new Map(), minQuestions: 999, maxQuestions: 0,
    confusedWith: new Map(), confusedAs: new Map(),
    distances: [], questionCounts: []
  });
}

// Sampling
const totalPrior = ARCHETYPES.reduce((s, a) => s + a.prior, 0);
const cumulPriors: number[] = [];
let cumul = 0;
for (const a of ARCHETYPES) { cumul += a.prior / totalPrior; cumulPriors.push(cumul); }
function sampleArchetype(): number {
  const r = Math.random();
  for (let i = 0; i < cumulPriors.length; i++) { if (r <= cumulPriors[i]!) return i; }
  return ARCHETYPES.length - 1;
}

console.error(`Running ${NUM_SIMS} simulations...`);
const startTime = Date.now();

let totalCorrect = 0;
let totalQuestions = 0;
let totalDistance = 0;

for (let sim = 0; sim < NUM_SIMS; sim++) {
  if (sim > 0 && sim % 500 === 0) {
    console.error(`  ${sim} / ${NUM_SIMS} (${((sim/NUM_SIMS)*100).toFixed(0)}%)`);
  }

  const trueIdx = sampleArchetype();
  const trueArchetype = ARCHETYPES[trueIdx]!;
  const trueStats = archetypeStats.get(trueArchetype.id)!;
  trueStats.trueCount++;

  // Pre-generate answers
  const answers = new Map<number, any>();
  for (const q of QUESTION_BANK) answers.set(q.id, generateAnswer(trueArchetype, q));

  // Run quiz
  const state = createInitialState();
  const questionsAsked: number[] = [];

  // Fixed 12
  for (const qid of FIXED_12) {
    const q = BANK_BY_ID.get(qid);
    if (!q) continue;
    const answer = answers.get(q.id);
    if (!answer) continue;
    applySimulatedAnswer(state, q, answer);
    questionsAsked.push(qid);
  }
  recomputeArchetypePosterior(state, ARCHETYPES);
  updateNodeStatuses(state, viableArchetypes(state, ARCHETYPES));

  // Adaptive
  let rounds = 0;
  while (Object.keys(state.answers).length < 63 && rounds < 51) {
    rounds++;
    const next = selectNextQuestion(state, QUESTION_BANK, ARCHETYPES);
    if (!next) break;
    const answer = answers.get(next.id);
    if (!answer) { applySingleChoiceAnswer(state, next, "default"); }
    else { applySimulatedAnswer(state, next, answer); }
    questionsAsked.push(next.id);
    recomputeArchetypePosterior(state, ARCHETYPES);
    updateNodeStatuses(state, viableArchetypes(state, ARCHETYPES));
    if (shouldStop(state, ARCHETYPES)) break;
  }

  // Record
  const posteriors = Object.entries(state.archetypePosterior).sort((a, b) => b[1] - a[1]);
  const assignedId = posteriors[0]?.[0] ?? "unknown";
  const assignedArchetype = ARCHETYPES.find(a => a.id === assignedId);
  const dist = assignedArchetype ? archetypeDistance(state, assignedArchetype) : 999;
  const nQ = Object.keys(state.answers).length;

  // Update true archetype stats
  trueStats.totalQuestions += nQ;
  trueStats.questionCounts.push(nQ);
  trueStats.minQuestions = Math.min(trueStats.minQuestions, nQ);
  trueStats.maxQuestions = Math.max(trueStats.maxQuestions, nQ);
  for (const qid of questionsAsked) {
    trueStats.questionFreq.set(qid, (trueStats.questionFreq.get(qid) ?? 0) + 1);
  }

  // Update assigned archetype stats
  const assignedStats = archetypeStats.get(assignedId);
  if (assignedStats) {
    assignedStats.assignedCount++;
    assignedStats.totalDistance += dist;
    assignedStats.distances.push(dist);
  }

  if (trueArchetype.id === assignedId) {
    trueStats.correctCount++;
    totalCorrect++;
  } else {
    trueStats.confusedWith.set(assignedId, (trueStats.confusedWith.get(assignedId) ?? 0) + 1);
    if (assignedStats) {
      assignedStats.confusedAs.set(trueArchetype.id, (assignedStats.confusedAs.get(trueArchetype.id) ?? 0) + 1);
    }
  }

  totalQuestions += nQ;
  totalDistance += dist;
}

const elapsed = (Date.now() - startTime) / 1000;
console.error(`Done in ${elapsed.toFixed(1)}s`);

// ---------------------------------------------------------------------------
// Question names
// ---------------------------------------------------------------------------
const Q_NAMES: Record<number, string> = {};
for (const q of QUESTION_BANK) { Q_NAMES[q.id] = q.promptShort; }

// ---------------------------------------------------------------------------
// Node labels
// ---------------------------------------------------------------------------
const NODE_NAMES: Record<string, string> = {
  MAT: "Economic Values", CD: "Cultural Direction", CU: "Cultural Universalism",
  MOR: "Moral Circle", PRO: "Proceduralism", COM: "Compromise",
  ZS: "Zero-Sum Thinking", ONT_H: "Ontological Hope", ONT_S: "Ontological Security",
  PF: "Party Feeling", TRB: "Tribalism", ENG: "Engagement",
  EPS: "Epistemics", AES: "Aesthetic Style", H: "Hierarchy"
};

const CAT_LABELS: Record<string, string[]> = {
  EPS: ["empiricist", "institutionalist", "traditionalist", "intuitionist", "autonomous", "nihilist"],
  AES: ["statesman", "technocrat", "pastoral", "authentic", "fighter", "visionary"],
  H: ["egalitarian", "meritocratic", "institutional", "traditional", "paternal", "strong_order"]
};

// ---------------------------------------------------------------------------
// Generate HTML
// ---------------------------------------------------------------------------

function escHtml(s: string): string { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
const nameMap = new Map(ARCHETYPES.map(a => [a.id, a.name]));

// Sort archetypes by prior descending for main report
const sortedArchetypes = [...ARCHETYPES].sort((a, b) => b.prior - a.prior);

let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PRISM Engine Diagnostic Report</title>
<style>
  @media print {
    .page-break { page-break-before: always; }
    .no-print { display: none; }
  }
  :root { --bg: #fff; --text: #1a1a2e; --card: #f8f9fa; --border: #dee2e6; --accent: #4361ee; --green: #2d6a4f; --red: #d00000; --orange: #e85d04; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: var(--text); background: var(--bg); line-height: 1.6; padding: 20px; max-width: 1100px; margin: 0 auto; font-size: 11pt; }
  h1 { font-size: 2rem; margin-bottom: 4px; color: var(--accent); }
  h2 { font-size: 1.4rem; margin: 24px 0 12px; color: var(--accent); border-bottom: 2px solid var(--accent); padding-bottom: 4px; }
  h3 { font-size: 1.1rem; margin: 16px 0 8px; }
  .subtitle { color: #666; margin-bottom: 20px; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; text-align: center; }
  .stat-val { font-size: 1.8rem; font-weight: 700; color: var(--accent); }
  .stat-label { font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 0.88rem; }
  th { background: var(--accent); color: white; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 6px 10px; border-bottom: 1px solid var(--border); }
  tr:nth-child(even) { background: #f8f9fa; }
  tr:hover { background: #e9ecef; }
  .bar-bg { height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; width: 100%; }
  .bar-fill { height: 100%; border-radius: 4px; }
  .bar-green { background: var(--green); }
  .bar-accent { background: var(--accent); }
  .bar-orange { background: var(--orange); }
  .bar-red { background: var(--red); }
  .good { color: var(--green); font-weight: 600; }
  .warn { color: var(--orange); font-weight: 600; }
  .bad { color: var(--red); font-weight: 600; }
  .confusion-pair { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 0.85rem; }
  .confusion-count { font-weight: 700; min-width: 40px; text-align: right; }
  .archetype-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  .archetype-card h3 { margin-top: 0; color: var(--accent); }
  .mini-stat { display: inline-block; background: white; border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; margin: 2px 4px 2px 0; font-size: 0.82rem; }
  .mini-stat strong { color: var(--accent); }
  .q-tag { display: inline-block; padding: 2px 6px; margin: 1px; border-radius: 3px; font-size: 0.72rem; font-family: monospace; }
  .q-asked { background: #d4edda; color: #155724; }
  .q-skipped { background: #f8d7da; color: #721c24; }
  .q-fixed { background: #cce5ff; color: #004085; }
  .node-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0; }
  .node-mini { font-size: 0.8rem; padding: 4px 8px; background: white; border: 1px solid var(--border); border-radius: 4px; }
  .node-mini .nm { font-weight: 600; font-size: 0.75rem; color: #555; }
  .appendix-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 800px) { .appendix-pair { grid-template-columns: 1fr; } .summary-grid { grid-template-columns: repeat(2, 1fr); } }
  .toc { column-count: 3; font-size: 0.85rem; margin-bottom: 20px; }
  .toc a { color: var(--accent); text-decoration: none; }
  .toc a:hover { text-decoration: underline; }
</style>
</head>
<body>
<h1>PRISM Engine Diagnostic Report</h1>
<div class="subtitle">Simulation: ${NUM_SIMS.toLocaleString()} respondents &middot; ${ARCHETYPES.length} archetypes &middot; ${QUESTION_BANK.length} questions &middot; Generated ${new Date().toISOString().split('T')[0]}</div>

<h2>Executive Summary</h2>
<div class="summary-grid">
  <div class="stat-card"><div class="stat-val">${(100*totalCorrect/NUM_SIMS).toFixed(1)}%</div><div class="stat-label">Overall Accuracy</div></div>
  <div class="stat-card"><div class="stat-val">${(totalQuestions/NUM_SIMS).toFixed(1)}</div><div class="stat-label">Avg Questions Asked</div></div>
  <div class="stat-card"><div class="stat-val">${(totalDistance/NUM_SIMS).toFixed(2)}</div><div class="stat-label">Avg Euclidean Distance</div></div>
  <div class="stat-card"><div class="stat-val">${ARCHETYPES.length}</div><div class="stat-label">Total Archetypes</div></div>
</div>
`;

// ---------------------------------------------------------------------------
// Main table: all archetypes
// ---------------------------------------------------------------------------
html += `<h2>Archetype Performance Summary</h2>
<table>
<tr><th>#</th><th>ID</th><th>Name</th><th>Prior</th><th>Sampled</th><th>Assigned</th><th>Accuracy</th><th>Avg Dist</th><th>Avg Q</th><th>Min Q</th><th>Max Q</th><th>Accuracy Bar</th></tr>
`;

let rank = 0;
for (const a of sortedArchetypes) {
  rank++;
  const s = archetypeStats.get(a.id)!;
  const accuracy = s.trueCount > 0 ? (100 * s.correctCount / s.trueCount) : 0;
  const avgDist = s.assignedCount > 0 ? (s.totalDistance / s.assignedCount) : 0;
  const avgQ = s.trueCount > 0 ? (s.totalQuestions / s.trueCount) : 0;
  const accClass = accuracy >= 90 ? 'good' : accuracy >= 70 ? 'warn' : 'bad';
  const barColor = accuracy >= 90 ? 'bar-green' : accuracy >= 70 ? 'bar-orange' : 'bar-red';
  html += `<tr>
    <td>${rank}</td>
    <td style="font-family:monospace;font-size:0.8rem;">${escHtml(a.id)}</td>
    <td><a href="#arch_${a.id}">${escHtml(a.name)}</a></td>
    <td>${a.prior.toFixed(3)}</td>
    <td>${s.trueCount}</td>
    <td>${s.assignedCount}</td>
    <td class="${accClass}">${accuracy.toFixed(1)}%</td>
    <td>${avgDist.toFixed(2)}</td>
    <td>${avgQ.toFixed(1)}</td>
    <td>${s.minQuestions === 999 ? '-' : s.minQuestions}</td>
    <td>${s.maxQuestions === 0 ? '-' : s.maxQuestions}</td>
    <td><div class="bar-bg"><div class="bar-fill ${barColor}" style="width:${accuracy}%"></div></div></td>
  </tr>`;
}
html += `</table>`;

// ---------------------------------------------------------------------------
// Top confusion pairs
// ---------------------------------------------------------------------------
html += `<h2>Top Confusion Pairs</h2>
<p style="font-size:0.85rem;color:#666;margin-bottom:12px;">When the engine misclassifies, these are the most common true→assigned pairs.</p>
<table><tr><th>Count</th><th>True Archetype</th><th>→</th><th>Misclassified As</th><th>Reverse?</th></tr>`;

const globalConfusion = new Map<string, number>();
for (const [, s] of archetypeStats) {
  for (const [confId, count] of s.confusedWith) {
    const key = `${s.id}|${confId}`;
    globalConfusion.set(key, count);
  }
}
const sortedConf = [...globalConfusion.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
for (const [key, count] of sortedConf) {
  const [trueId, assignedId] = key.split("|");
  const reverseKey = `${assignedId}|${trueId}`;
  const reverseCount = globalConfusion.get(reverseKey) ?? 0;
  html += `<tr>
    <td style="font-weight:700;">${count}</td>
    <td>${escHtml(nameMap.get(trueId!) ?? trueId!)}</td>
    <td>→</td>
    <td>${escHtml(nameMap.get(assignedId!) ?? assignedId!)}</td>
    <td>${reverseCount > 0 ? `${reverseCount} reverse` : '—'}</td>
  </tr>`;
}
html += `</table>`;

// ---------------------------------------------------------------------------
// Question usage heatmap
// ---------------------------------------------------------------------------
html += `<h2>Question Usage Frequency</h2>
<p style="font-size:0.85rem;color:#666;margin-bottom:12px;">How often each question is asked across all simulations. Fixed-12 questions appear in 100% of runs.</p>
<table><tr><th>Q ID</th><th>Name</th><th>Type</th><th>Stage</th><th>Times Asked</th><th>% of Runs</th><th>Usage</th></tr>`;

const totalRuns = NUM_SIMS;
const qUsageTotals = new Map<number, number>();
for (const [, s] of archetypeStats) {
  for (const [qid, count] of s.questionFreq) {
    qUsageTotals.set(qid, (qUsageTotals.get(qid) ?? 0) + count);
  }
}

for (const q of QUESTION_BANK) {
  const usage = qUsageTotals.get(q.id) ?? 0;
  const pct = (100 * usage / totalRuns);
  const isFixed = FIXED_12.includes(q.id);
  html += `<tr>
    <td style="font-family:monospace;">${q.id}</td>
    <td>${escHtml(q.promptShort)}</td>
    <td>${q.uiType}</td>
    <td>${q.stage}</td>
    <td>${usage.toLocaleString()}</td>
    <td>${pct.toFixed(1)}%</td>
    <td><div class="bar-bg"><div class="bar-fill ${isFixed ? 'bar-accent' : 'bar-green'}" style="width:${Math.min(100, pct)}%"></div></div></td>
  </tr>`;
}
html += `</table>`;

// ---------------------------------------------------------------------------
// APPENDIX: 2 archetypes per page with detailed question info
// ---------------------------------------------------------------------------
html += `<div class="page-break"></div>
<h2>Appendix: Detailed Archetype Profiles</h2>
<p style="font-size:0.85rem;color:#666;margin-bottom:16px;">Two archetypes per page. Shows node profile, question usage, and confusion analysis.</p>
`;

// Table of contents
html += `<div class="toc">`;
for (let i = 0; i < sortedArchetypes.length; i++) {
  html += `<div><a href="#arch_${sortedArchetypes[i]!.id}">${i + 1}. ${escHtml(sortedArchetypes[i]!.name)}</a></div>`;
}
html += `</div>`;

for (let i = 0; i < sortedArchetypes.length; i += 2) {
  if (i > 0) html += `<div class="page-break"></div>`;
  html += `<div class="appendix-pair">`;

  for (let j = i; j < Math.min(i + 2, sortedArchetypes.length); j++) {
    const a = sortedArchetypes[j]!;
    const s = archetypeStats.get(a.id)!;
    const accuracy = s.trueCount > 0 ? (100 * s.correctCount / s.trueCount) : 0;
    const avgDist = s.assignedCount > 0 ? (s.totalDistance / s.assignedCount) : 0;
    const avgQ = s.trueCount > 0 ? (s.totalQuestions / s.trueCount) : 0;
    const accClass = accuracy >= 90 ? 'good' : accuracy >= 70 ? 'warn' : 'bad';

    html += `<div class="archetype-card" id="arch_${a.id}">
      <h3>${escHtml(a.name)} <span style="font-size:0.8rem;color:#666;">(${a.id})</span></h3>
      <div style="margin-bottom:8px;">
        <span class="mini-stat">Prior: <strong>${a.prior.toFixed(3)}</strong></span>
        <span class="mini-stat">Accuracy: <strong class="${accClass}">${accuracy.toFixed(1)}%</strong></span>
        <span class="mini-stat">Avg Dist: <strong>${avgDist.toFixed(2)}</strong></span>
        <span class="mini-stat">Avg Q: <strong>${avgQ.toFixed(1)}</strong></span>
        <span class="mini-stat">Range: <strong>${s.minQuestions === 999 ? '-' : s.minQuestions}–${s.maxQuestions === 0 ? '-' : s.maxQuestions}</strong></span>
        <span class="mini-stat">Sampled: <strong>${s.trueCount}</strong></span>
      </div>`;

    // Node profile
    html += `<h3 style="font-size:0.9rem;">Node Profile</h3><div class="node-grid">`;
    for (const [nodeId, template] of Object.entries(a.nodes)) {
      if (template.kind === "continuous") {
        html += `<div class="node-mini"><div class="nm">${NODE_NAMES[nodeId] ?? nodeId}</div>pos=${template.pos} sal=${template.sal}</div>`;
      } else {
        const topIdx = template.probs.indexOf(Math.max(...template.probs));
        const labels = CAT_LABELS[nodeId] ?? [];
        html += `<div class="node-mini"><div class="nm">${NODE_NAMES[nodeId] ?? nodeId}</div>${labels[topIdx] ?? '?'} (sal=${template.sal})</div>`;
      }
    }
    html += `</div>`;

    // Questions asked vs skipped
    html += `<h3 style="font-size:0.9rem;">Questions Used</h3><div style="margin-bottom:8px;">`;

    // Sort questions by frequency for this archetype
    const qFreqs = ALL_Q_IDS.map(qid => ({
      id: qid,
      freq: s.questionFreq.get(qid) ?? 0,
      pct: s.trueCount > 0 ? (100 * (s.questionFreq.get(qid) ?? 0) / s.trueCount) : 0,
      isFixed: FIXED_12.includes(qid)
    }));

    // Questions ALWAYS asked (>90%)
    const alwaysAsked = qFreqs.filter(q => q.pct > 90).sort((a, b) => b.pct - a.pct);
    // Questions SOMETIMES asked (10-90%)
    const sometimesAsked = qFreqs.filter(q => q.pct > 10 && q.pct <= 90).sort((a, b) => b.pct - a.pct);
    // Questions RARELY/NEVER asked (<10%)
    const neverAsked = qFreqs.filter(q => q.pct <= 10).sort((a, b) => a.id - b.id);

    html += `<div style="font-size:0.78rem;margin-bottom:4px;"><strong>Always asked (>90%):</strong> ${alwaysAsked.length} questions</div>`;
    html += `<div>`;
    for (const q of alwaysAsked) {
      html += `<span class="q-tag ${q.isFixed ? 'q-fixed' : 'q-asked'}">Q${q.id} ${q.pct.toFixed(0)}%</span>`;
    }
    html += `</div>`;

    if (sometimesAsked.length > 0) {
      html += `<div style="font-size:0.78rem;margin:4px 0;"><strong>Sometimes asked:</strong> ${sometimesAsked.length} questions</div>`;
      html += `<div>`;
      for (const q of sometimesAsked) {
        html += `<span class="q-tag q-asked">Q${q.id} ${q.pct.toFixed(0)}%</span>`;
      }
      html += `</div>`;
    }

    html += `<div style="font-size:0.78rem;margin:4px 0;"><strong>Not needed (&lt;10%):</strong> ${neverAsked.length} questions</div>`;
    html += `<div>`;
    for (const q of neverAsked) {
      html += `<span class="q-tag q-skipped">Q${q.id} ${Q_NAMES[q.id]?.slice(0, 20) ?? ''}</span>`;
    }
    html += `</div></div>`;

    // Confusion analysis
    if (s.confusedWith.size > 0) {
      const topConfusions = [...s.confusedWith.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      html += `<h3 style="font-size:0.9rem;">Top Misclassifications</h3>`;
      for (const [confId, count] of topConfusions) {
        const confPct = s.trueCount > 0 ? (100 * count / s.trueCount).toFixed(1) : '0';
        html += `<div class="confusion-pair"><span class="confusion-count">${count}</span> → ${escHtml(nameMap.get(confId) ?? confId)} (${confPct}%)</div>`;
      }
    }

    html += `</div>`; // archetype-card
  }
  html += `</div>`; // appendix-pair
}

html += `
<div class="page-break"></div>
<h2>Methodology Notes</h2>
<ul style="font-size:0.9rem; line-height:1.8;">
  <li><strong>Simulation:</strong> ${NUM_SIMS.toLocaleString()} simulated respondents, each sampled from the archetype prior distribution.</li>
  <li><strong>Answer generation:</strong> Deterministic argmax — each simulated respondent picks the answer that best matches their archetype's node profile.</li>
  <li><strong>Quiz engine:</strong> 12 fixed questions, then adaptive selection blending exploration (coverage-based) and exploitation (discrimination-based scoring).</li>
  <li><strong>Stop rule:</strong> Adaptive posterior threshold (scales with number of significant candidates), margin check, cosine-similarity-aware secondary stop.</li>
  <li><strong>Euclidean distance:</strong> Distance from the respondent's inferred node positions to the assigned archetype's centroid in the 15-node space.</li>
  <li><strong>"Not needed" questions:</strong> Questions asked in fewer than 10% of runs for that archetype. These are questions the engine determined were uninformative for distinguishing this archetype from its competitors.</li>
</ul>

</body></html>`;

// Write output
const outPath = process.argv[3] ?? "../docs/quiz/report.html";
fs.writeFileSync(outPath, html);
console.error(`Report written to ${outPath}`);
