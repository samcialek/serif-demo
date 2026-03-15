import { ARCHETYPES } from "./config/archetypes.js";
import { REPRESENTATIVE_QUESTIONS } from "./config/questions.representative.js";
import { FULL_QUESTIONS } from "./config/questions.full.js";
import { FIXED_12 } from "./engine/config.js";
import { createInitialState } from "./state/initialState.js";
import type {
  Archetype,
  QuestionDef,
  RespondentState,
  ContinuousNodeId,
  CategoricalNodeId,
  NodeId
} from "./types.js";
import {
  applyAllocationAnswer,
  applyPairwiseAnswer,
  applyRankingAnswer,
  applySingleChoiceAnswer,
  applySliderAnswer
} from "./engine/update.js";
import {
  recomputeArchetypePosterior,
  archetypeDistance,
  viableArchetypes
} from "./engine/archetypeDistance.js";
import { updateNodeStatuses } from "./engine/nodeStatus.js";
import { selectNextQuestion } from "./engine/nextQuestion.js";

// ---------------------------------------------------------------------------
// Build question bank (same as simulation.ts)
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
// Viable candidates helper (same as simulation.ts)
// ---------------------------------------------------------------------------

function viableCandidates(state: RespondentState, archetypes: Archetype[]) {
  return viableArchetypes(state, archetypes);
}

// ---------------------------------------------------------------------------
// Answer generation helpers (from simulation.ts)
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
        for (let i = 0; i < 6; i++)
          dot +=
            (((upd as any).cat as number[])[i] ?? 0) *
            (template.probs[i] ?? 0);
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

function scoreAllocationBucket(archetype: Archetype, map: any): number {
  let score = 0;
  if (map?.continuous) {
    for (const [nodeId, signal] of Object.entries(map.continuous)) {
      const template = archetype.nodes[nodeId as NodeId];
      if (!template || template.kind !== "continuous") continue;
      const centeredArchetype = template.pos - 3;
      score += (signal as number) * centeredArchetype;
    }
  }
  return score;
}

// ---------------------------------------------------------------------------
// Deterministic argmax softmax sample (same as simulation.ts)
// ---------------------------------------------------------------------------

function softmaxSampleArgmax(logScores: number[]): number {
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

// ---------------------------------------------------------------------------
// Stochastic softmax sample (actual probabilistic sampling)
// ---------------------------------------------------------------------------

function softmaxSampleStochastic(
  logScores: number[],
  temperature: number = 1.2
): number {
  if (logScores.length === 0) return 0;
  if (logScores.length === 1) return 0;

  // Compute softmax probabilities
  const maxScore = Math.max(...logScores);
  const exps = logScores.map((s) => Math.exp((s - maxScore) / temperature));
  const totalExp = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / totalExp);

  // Sample from distribution
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i]!;
    if (r <= cumulative) return i;
  }
  return probs.length - 1;
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
 * Generate an answer using the given sampler function.
 * When stochastic=false, uses argmax (deterministic).
 * When stochastic=true, uses probabilistic softmax sampling.
 */
function generateAnswer(
  archetype: Archetype,
  q: QuestionDef,
  stochastic: boolean
): SimulatedAnswer {
  const sampler = stochastic ? softmaxSampleStochastic : softmaxSampleArgmax;

  switch (q.uiType) {
    case "single_choice": {
      if (!q.optionEvidence) return { type: "single_choice", value: "default" };
      const keys = Object.keys(q.optionEvidence);
      const scores = keys.map((k) =>
        scoreOptionForArchetype(archetype, q.optionEvidence![k])
      );
      const idx = sampler(scores);
      return { type: "single_choice", value: keys[idx]! };
    }
    case "slider": {
      if (!q.sliderMap) return { type: "slider", value: 50 };
      const brackets = Object.keys(q.sliderMap);
      const scores = brackets.map((k) =>
        scoreOptionForArchetype(archetype, q.sliderMap![k])
      );
      const idx = sampler(scores);
      const bracket = brackets[idx]!;
      const parts = bracket.split("-").map(Number);
      const lo = parts[0] ?? 0;
      const hi = parts[1] ?? 100;
      let value: number;
      if (stochastic) {
        // Add some randomness to slider value within bracket
        value = Math.round(lo + Math.random() * (hi - lo));
      } else {
        value = Math.round((lo + hi) / 2);
      }
      return { type: "slider", value };
    }
    case "allocation": {
      if (!q.allocationMap) return { type: "allocation", value: {} };
      const keys = Object.keys(q.allocationMap);
      const scores = keys.map((k) =>
        scoreAllocationBucket(archetype, q.allocationMap![k])
      );
      const maxS = Math.max(...scores);
      const temp = stochastic ? 1.2 : 1.0;
      const weights = scores.map((s) => Math.exp((s - maxS) / temp));
      const totalW = weights.reduce((a, b) => a + b, 0);
      if (stochastic) {
        // Add Dirichlet-like noise
        const noisy = weights.map(
          (w) => (w / totalW) * (0.7 + Math.random() * 0.6)
        );
        const noisyTotal = noisy.reduce((a, b) => a + b, 0);
        const raw = noisy.map((n) => Math.max(1, Math.round((100 * n) / noisyTotal)));
        const rawTotal = raw.reduce((a, b) => a + b, 0);
        const allocation: Record<string, number> = {};
        keys.forEach((k, i) => {
          allocation[k] = Math.round((100 * raw[i]!) / rawTotal);
        });
        return { type: "allocation", value: allocation };
      } else {
        const raw = weights.map((w) =>
          Math.max(1, Math.round((100 * w) / totalW))
        );
        const rawTotal = raw.reduce((a, b) => a + b, 0);
        const allocation: Record<string, number> = {};
        keys.forEach((k, i) => {
          allocation[k] = Math.round((100 * raw[i]!) / rawTotal);
        });
        return { type: "allocation", value: allocation };
      }
    }
    case "ranking": {
      if (!q.rankingMap) return { type: "ranking", value: [] };
      const keys = Object.keys(q.rankingMap);
      const scores = keys.map((k) =>
        scoreAllocationBucket(archetype, q.rankingMap![k])
      );
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      if (stochastic) {
        // Add noise before sorting
        indexed.forEach(
          (item) => (item.s += (Math.random() - 0.5) * 0.8)
        );
      }
      indexed.sort((a, b) => b.s - a.s);
      return { type: "ranking", value: indexed.map((x) => x.k) };
    }
    case "multi": {
      if (!q.optionEvidence) return { type: "multi", value: ["default"] };
      const keys = Object.keys(q.optionEvidence);
      const scores = keys.map((k) =>
        scoreOptionForArchetype(archetype, q.optionEvidence![k])
      );
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      if (stochastic) {
        indexed.forEach(
          (item) => (item.s += (Math.random() - 0.5) * 1.0)
        );
      }
      indexed.sort((a, b) => b.s - a.s);
      return { type: "multi", value: indexed.slice(0, 2).map((x) => x.k) };
    }
    case "best_worst": {
      const rmap = q.rankingMap ?? q.bestWorstMap;
      if (!rmap) return { type: "best_worst", value: [] };
      const keys = Object.keys(rmap);
      const scores = keys.map((k) =>
        scoreAllocationBucket(archetype, rmap[k])
      );
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      if (stochastic) {
        indexed.forEach(
          (item) => (item.s += (Math.random() - 0.5) * 0.8)
        );
      }
      indexed.sort((a, b) => b.s - a.s);
      return {
        type: "best_worst",
        value: [indexed[0]!.k, indexed[indexed.length - 1]!.k]
      };
    }
    case "pairwise": {
      if (!q.pairMaps) return { type: "pairwise", value: {} };
      const result: Record<string, string> = {};
      for (const [pairId, options] of Object.entries(q.pairMaps)) {
        const optKeys = Object.keys(options);
        const scores = optKeys.map((k) => {
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
        if (stochastic) {
          scores.forEach((_, i) => {
            scores[i] = scores[i]! + (Math.random() - 0.5) * 0.6;
          });
        }
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
// Apply simulated answer (same as simulation.ts)
// ---------------------------------------------------------------------------

function applySimulatedAnswer(
  state: RespondentState,
  q: QuestionDef,
  answer: SimulatedAnswer
): void {
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
      state.answers[q.id] = answer.value;
      break;
  }
}

// ---------------------------------------------------------------------------
// Deep clone state (careful with Sets in touchTypes)
// ---------------------------------------------------------------------------

function deepCloneState(state: RespondentState): RespondentState {
  const cloned: RespondentState = {
    answers: { ...state.answers },
    continuous: {} as RespondentState["continuous"],
    categorical: {} as RespondentState["categorical"],
    trbAnchor: {
      dist: [...state.trbAnchor.dist] as RespondentState["trbAnchor"]["dist"],
      touches: state.trbAnchor.touches
    },
    archetypePosterior: { ...state.archetypePosterior }
  };

  for (const [nodeId, node] of Object.entries(state.continuous)) {
    (cloned.continuous as any)[nodeId] = {
      posDist: [...node.posDist] as typeof node.posDist,
      salDist: [...node.salDist] as typeof node.salDist,
      touches: node.touches,
      touchTypes: new Set(node.touchTypes),
      status: node.status
    };
  }

  for (const [nodeId, node] of Object.entries(state.categorical)) {
    (cloned.categorical as any)[nodeId] = {
      catDist: [...node.catDist] as typeof node.catDist,
      salDist: [...node.salDist] as typeof node.salDist,
      touches: node.touches,
      touchTypes: new Set(node.touchTypes),
      status: node.status
    };
  }

  return cloned;
}

// ---------------------------------------------------------------------------
// Data types for tracking
// ---------------------------------------------------------------------------

interface QuestionSnapshot {
  questionNumber: number;
  top3: { id: string; name: string; posterior: number }[];
  allPosteriors: Record<string, number>;
  distanceToTrue: number;
}

interface PathData {
  pathIndex: number;
  snapshots: QuestionSnapshot[];
  assignedArchetypeId: string;
  assignedArchetypeName: string;
}

// ---------------------------------------------------------------------------
// Snapshot helper
// ---------------------------------------------------------------------------

const ARCHETYPE_NAME_MAP = new Map(ARCHETYPES.map((a) => [a.id, a.name]));

function takeSnapshot(
  state: RespondentState,
  questionNumber: number,
  trueArchetype: Archetype
): QuestionSnapshot {
  const posteriors = Object.entries(state.archetypePosterior)
    .map(([id, p]) => ({ id, name: ARCHETYPE_NAME_MAP.get(id) ?? id, posterior: p }))
    .sort((a, b) => b.posterior - a.posterior);

  const top3 = posteriors.slice(0, 3);
  const allPosteriors = { ...state.archetypePosterior };
  const dist = archetypeDistance(state, trueArchetype);

  return { questionNumber, top3, allPosteriors, distanceToTrue: dist };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const NUM_PATHS = 10;

// Pick a random true archetype from the top 20 by prior
const sortedByPrior = [...ARCHETYPES].sort((a, b) => b.prior - a.prior);
const top20 = sortedByPrior.slice(0, 20);
const trueArchetype = top20[Math.floor(Math.random() * top20.length)]!;

// Pre-generate deterministic answers for the fixed 12 phase
const fixedAnswers = new Map<number, SimulatedAnswer>();
for (const q of QUESTION_BANK) {
  fixedAnswers.set(q.id, generateAnswer(trueArchetype, q, false));
}

// Run fixed 12 phase (shared across all paths)
const baseState = createInitialState();
const baseSnapshots: QuestionSnapshot[] = [];

let questionCount = 0;
for (const qid of FIXED_12) {
  const q = BANK_BY_ID.get(qid);
  if (!q) continue;
  const answer = fixedAnswers.get(q.id);
  if (!answer) continue;
  applySimulatedAnswer(baseState, q, answer);
  questionCount++;
  recomputeArchetypePosterior(baseState, ARCHETYPES);
  updateNodeStatuses(baseState, viableCandidates(baseState, ARCHETYPES));
  baseSnapshots.push(takeSnapshot(baseState, questionCount, trueArchetype));
}

// Fork into 10 random paths
const allPaths: PathData[] = [];

for (let pathIdx = 0; pathIdx < NUM_PATHS; pathIdx++) {
  const state = deepCloneState(baseState);
  const snapshots = [...baseSnapshots]; // copy shared fixed-phase snapshots
  let qCount = questionCount;

  // Adaptive loop - run until all 63 questions answered
  const MAX_ADAPTIVE = 63 - qCount;
  let rounds = 0;
  while (Object.keys(state.answers).length < 63 && rounds < MAX_ADAPTIVE) {
    rounds++;
    const next = selectNextQuestion(state, QUESTION_BANK, ARCHETYPES);
    if (!next) break;

    // Generate stochastic answer
    const answer = generateAnswer(trueArchetype, next, true);
    applySimulatedAnswer(state, next, answer);
    qCount++;
    recomputeArchetypePosterior(state, ARCHETYPES);
    updateNodeStatuses(state, viableCandidates(state, ARCHETYPES));
    snapshots.push(takeSnapshot(state, qCount, trueArchetype));
  }

  // Determine assigned archetype at end
  const posteriors = Object.entries(state.archetypePosterior).sort(
    (a, b) => b[1] - a[1]
  );
  const assignedId = posteriors[0]?.[0] ?? "unknown";
  const assignedName = ARCHETYPE_NAME_MAP.get(assignedId) ?? assignedId;

  allPaths.push({
    pathIndex: pathIdx,
    snapshots,
    assignedArchetypeId: assignedId,
    assignedArchetypeName: assignedName
  });
}

// ---------------------------------------------------------------------------
// Determine the 3 lines to plot for each path: top 3 archetypes at Q63
// ---------------------------------------------------------------------------

interface PathChartData {
  pathIndex: number;
  assignedName: string;
  lines: {
    archetypeId: string;
    archetypeName: string;
    data: { q: number; posterior: number }[];
  }[];
}

const LINE_COLORS = [
  "rgb(59, 130, 246)",   // blue
  "rgb(239, 68, 68)",    // red
  "rgb(34, 197, 94)",    // green
];

const chartDataList: PathChartData[] = allPaths.map((path) => {
  // Get top 3 archetypes at the last snapshot
  const lastSnapshot = path.snapshots[path.snapshots.length - 1]!;
  const top3AtEnd = lastSnapshot.top3;

  const lines = top3AtEnd.map((archInfo) => {
    const data = path.snapshots.map((snap) => {
      // Look up this archetype's posterior from the full posterior map
      const posterior = snap.allPosteriors[archInfo.id] ?? 0;
      return {
        q: snap.questionNumber,
        posterior
      };
    });
    return {
      archetypeId: archInfo.id,
      archetypeName: archInfo.name,
      data
    };
  });

  return {
    pathIndex: path.pathIndex,
    assignedName: path.assignedArchetypeName,
    lines
  };
});

// ---------------------------------------------------------------------------
// Generate HTML
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateChartJs(chartData: PathChartData, chartIdx: number): string {
  const canvasId = `chart${chartIdx}`;
  const datasets = chartData.lines
    .map((line, li) => {
      const color = LINE_COLORS[li] ?? "rgb(100, 100, 100)";
      const dataPoints = line.data
        .map((d) => `{x:${d.q},y:${(d.posterior * 100).toFixed(4)}}`)
        .join(",");
      return `{
        label: ${JSON.stringify(line.archetypeName)},
        data: [${dataPoints}],
        borderColor: '${color}',
        backgroundColor: '${color}',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        tension: 0.2,
        fill: false
      }`;
    })
    .join(",\n        ");

  return `
  (function() {
    const ctx = document.getElementById('${canvasId}').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          ${datasets}
        ]
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: 'Path ${chartData.pathIndex + 1} — Assigned: ${escapeHtml(chartData.assignedName)}',
            font: { size: 14, weight: 'bold' },
            color: '#1e293b'
          },
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 12,
              font: { size: 11 },
              color: '#334155'
            }
          },
          annotation: {
            annotations: {
              fixedLine: {
                type: 'line',
                xMin: 12,
                xMax: 12,
                borderColor: 'rgba(100, 116, 139, 0.6)',
                borderWidth: 2,
                borderDash: [6, 4],
                label: {
                  content: 'Fixed 12',
                  enabled: true,
                  position: 'start',
                  backgroundColor: 'rgba(100, 116, 139, 0.7)',
                  color: '#fff',
                  font: { size: 10 }
                }
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Question Number',
              font: { size: 11 },
              color: '#475569'
            },
            min: 1,
            max: 63,
            ticks: {
              stepSize: 5,
              color: '#64748b'
            },
            grid: { color: 'rgba(226, 232, 240, 0.6)' }
          },
          y: {
            title: {
              display: true,
              text: 'Posterior (%)',
              font: { size: 11 },
              color: '#475569'
            },
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              color: '#64748b',
              callback: function(value) { return value + '%'; }
            },
            grid: { color: 'rgba(226, 232, 240, 0.6)' }
          }
        }
      }
    });
  })();`;
}

const chartScripts = chartDataList
  .map((cd, i) => generateChartJs(cd, i))
  .join("\n");

const canvasElements = chartDataList
  .map(
    (cd, i) =>
      `<div class="chart-cell">
        <canvas id="chart${i}" width="600" height="350"></canvas>
      </div>`
  )
  .join("\n      ");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quiz Path Visualization — ${escapeHtml(trueArchetype.name)}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #ffffff;
      color: #1e293b;
      padding: 32px;
    }
    h1 {
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #0f172a;
    }
    .subtitle {
      text-align: center;
      font-size: 14px;
      color: #64748b;
      margin-bottom: 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px 24px;
      max-width: 1280px;
      margin: 0 auto;
      justify-items: center;
    }
    .chart-cell {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <h1>10 Random Quiz Paths for: ${escapeHtml(trueArchetype.name)}</h1>
  <div class="subtitle">
    True Archetype: ${escapeHtml(trueArchetype.id)} — ${escapeHtml(trueArchetype.name)} (prior: ${(trueArchetype.prior * 100).toFixed(2)}%)
    &nbsp;|&nbsp; Fixed 12 questions shared, then stochastic adaptive phase (temperature = 1.2)
  </div>
  <div class="grid">
      ${canvasElements}
  </div>
  <div class="footer">
    Generated by vizPaths.ts &mdash; Prism Quiz Engine Simulation
  </div>
  <script>
${chartScripts}
  </script>
</body>
</html>`;

console.log(html);
