// ---------------------------------------------------------------------------
// pairDiagnostic.ts — Focused diagnostic for 4 confusion-prone archetype pairs
//
// For each "true" archetype, runs 100 noisy simulations through all 63
// questions (no early stop) while recording:
//   - posteriors for the true archetype and its confusion partner at every Q
//   - when shouldStop() would first fire
//
// Outputs per pair:
//   1. How often the true archetype leads at checkpoints Q20..Q63
//   2. How often shouldStop fires with the WRONG archetype in the lead
//   3. Median margin (true - partner) at each checkpoint
//   4. Earliest Q at which the true archetype STABLY leads through Q63
// ---------------------------------------------------------------------------

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
  NodeId,
} from "./types.js";
import {
  applyAllocationAnswer,
  applyPairwiseAnswer,
  applyRankingAnswer,
  applySingleChoiceAnswer,
  applySliderAnswer,
} from "./engine/update.js";
import {
  recomputeArchetypePosterior,
  viableArchetypes,
} from "./engine/archetypeDistance.js";
import { updateNodeStatuses } from "./engine/nodeStatus.js";
import { selectNextQuestion } from "./engine/nextQuestion.js";
import { shouldStop } from "./engine/stopRule.js";

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
    ...(rq.bestWorstMap !== undefined ? { bestWorstMap: rq.bestWorstMap } : {}),
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
// Answer generation helpers (from simulation.ts, but with TRUE stochastic
// softmax sampling to introduce noise across runs)
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
          dot += (((upd as any).cat as number[])[i] ?? 0) * (template.probs[i] ?? 0);
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
 * TRUE stochastic softmax: converts log-scores to probabilities via
 * temperature-scaled softmax, then samples from the resulting distribution.
 * This is the key difference from simulation.ts's deterministic argmax --
 * it introduces realistic answer noise so that repeated runs of the same
 * archetype produce different answer sequences.
 */
function noisySoftmaxSample(logScores: number[], temperature: number = 1.5): number {
  if (logScores.length === 0) return 0;
  if (logScores.length === 1) return 0;

  // Temperature-scale the scores
  const scaled = logScores.map((s) => s / temperature);
  const maxS = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - maxS));
  const total = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / total);

  // Sample from the categorical distribution
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i]!;
    if (r <= cumulative) return i;
  }
  return probs.length - 1;
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
// Simulated answer types and noisy generation
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
 * Generate a noisy simulated answer.  Uses stochastic softmax (temperature=1.5)
 * instead of deterministic argmax so that repeated runs produce different
 * answer sequences for the same archetype.  For allocation / ranking /
 * best-worst, adds Gaussian jitter to the underlying scores before sorting.
 */
function generateNoisyAnswer(archetype: Archetype, q: QuestionDef): SimulatedAnswer {
  switch (q.uiType) {
    case "single_choice": {
      if (!q.optionEvidence) return { type: "single_choice", value: "default" };
      const keys = Object.keys(q.optionEvidence);
      const scores = keys.map((k) => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
      const idx = noisySoftmaxSample(scores, 1.5);
      return { type: "single_choice", value: keys[idx]! };
    }
    case "slider": {
      if (!q.sliderMap) return { type: "slider", value: 50 };
      const brackets = Object.keys(q.sliderMap);
      const scores = brackets.map((k) => scoreOptionForArchetype(archetype, q.sliderMap![k]));
      const idx = noisySoftmaxSample(scores, 1.5);
      const bracket = brackets[idx]!;
      const parts = bracket.split("-").map(Number);
      const lo = parts[0] ?? 0;
      const hi = parts[1] ?? 100;
      // Add jitter within the bracket rather than always picking the midpoint
      const value = Math.round(lo + Math.random() * (hi - lo));
      return { type: "slider", value: Math.max(0, Math.min(100, value)) };
    }
    case "allocation": {
      if (!q.allocationMap) return { type: "allocation", value: {} };
      const keys = Object.keys(q.allocationMap);
      const scores = keys.map((k) => scoreAllocationBucket(archetype, q.allocationMap![k]));
      // Add Gaussian-ish noise to scores before computing allocation weights
      const noisyScores = scores.map((s) => s + (Math.random() - 0.5) * 1.0);
      const maxS = Math.max(...noisyScores);
      const weights = noisyScores.map((s) => Math.exp((s - maxS) / 1.0));
      const totalW = weights.reduce((a, b) => a + b, 0);
      const raw = weights.map((w) => Math.max(1, Math.round((100 * w) / totalW)));
      const rawTotal = raw.reduce((a, b) => a + b, 0);
      const allocation: Record<string, number> = {};
      keys.forEach((k, i) => {
        allocation[k] = Math.round((100 * raw[i]!) / rawTotal);
      });
      return { type: "allocation", value: allocation };
    }
    case "ranking": {
      if (!q.rankingMap) return { type: "ranking", value: [] };
      const keys = Object.keys(q.rankingMap);
      const scores = keys.map((k) => scoreAllocationBucket(archetype, q.rankingMap![k]));
      // Add noise before sorting so rankings can shuffle
      const indexed = keys.map((k, i) => ({
        k,
        s: scores[i]! + (Math.random() - 0.5) * 0.8,
      }));
      indexed.sort((a, b) => b.s - a.s);
      return { type: "ranking", value: indexed.map((x) => x.k) };
    }
    case "multi": {
      if (!q.optionEvidence) return { type: "multi", value: ["default"] };
      const keys = Object.keys(q.optionEvidence);
      const scores = keys.map((k) => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
      const indexed = keys.map((k, i) => ({
        k,
        s: scores[i]! + (Math.random() - 0.5) * 0.8,
      }));
      indexed.sort((a, b) => b.s - a.s);
      return { type: "multi", value: indexed.slice(0, 2).map((x) => x.k) };
    }
    case "best_worst": {
      const rmap = q.rankingMap ?? q.bestWorstMap;
      if (!rmap) return { type: "best_worst", value: [] };
      const keys = Object.keys(rmap);
      const scores = keys.map((k) => scoreAllocationBucket(archetype, rmap[k]));
      const indexed = keys.map((k, i) => ({
        k,
        s: scores[i]! + (Math.random() - 0.5) * 0.8,
      }));
      indexed.sort((a, b) => b.s - a.s);
      return { type: "best_worst", value: [indexed[0]!.k, indexed[indexed.length - 1]!.k] };
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
        // Add noise so pairwise choices can flip
        const noisyScores = scores.map((s) => s + (Math.random() - 0.5) * 0.6);
        const best = noisyScores.indexOf(Math.max(...noisyScores));
        result[pairId] = optKeys[best]!;
      }
      return { type: "pairwise", value: result };
    }
    default:
      return { type: "single_choice", value: "default" };
  }
}

// ---------------------------------------------------------------------------
// Apply a simulated answer to state (same as simulation.ts)
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
// Pair definitions
// ---------------------------------------------------------------------------

interface ConfusionPair {
  trueId: string;
  trueName: string;
  partnerId: string;
  partnerName: string;
}

const PAIRS: ConfusionPair[] = [
  { trueId: "088", trueName: "Meritocrat",             partnerId: "070", partnerName: "Establishment Conservative" },
  { trueId: "063", trueName: "Values-Based Centrist",   partnerId: "068", partnerName: "Third Way Democrat" },
  { trueId: "079", trueName: "Civic Nationalist",       partnerId: "N03", partnerName: "Civic Engagement Maximalist" },
  { trueId: "098", trueName: "Fatalist Hierarchist",    partnerId: "M11", partnerName: "Armchair Analyst" },
];

// ---------------------------------------------------------------------------
// Per-simulation trace: posteriors for true & partner at each Q count
// ---------------------------------------------------------------------------

interface SimTrace {
  /** posteriorTrue[q] = posterior of true archetype when q questions answered (q = 12..63) */
  posteriorTrue: Map<number, number>;
  /** posteriorPartner[q] = posterior of partner archetype when q questions answered */
  posteriorPartner: Map<number, number>;
  /** The question count at which shouldStop() first returned true, or null */
  stopFiredAtQ: number | null;
  /** The leader archetype ID at the moment shouldStop() first fired, or null */
  leaderAtStop: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

declare const process: { argv: string[] };
const NUM_SIMS = parseInt(process.argv[2] ?? "100", 10);
const CHECKPOINTS = [20, 25, 30, 35, 40, 45, 50, 55, 63];
const Q_RANGE_START = 12; // first Q count after fixed-12 phase
const Q_RANGE_END = 63;

// ---------------------------------------------------------------------------
// Utility: find leader in posterior
// ---------------------------------------------------------------------------

function getLeaderId(state: RespondentState): string {
  let bestId = "";
  let bestP = -1;
  for (const [id, p] of Object.entries(state.archetypePosterior)) {
    if (p > bestP) {
      bestP = p;
      bestId = id;
    }
  }
  return bestId;
}

// ---------------------------------------------------------------------------
// Utility: median of a sorted-in-place array
// ---------------------------------------------------------------------------

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 !== 0 ? arr[mid]! : (arr[mid - 1]! + arr[mid]!) / 2;
}

// ---------------------------------------------------------------------------
// Run one simulation for a given true archetype, returning the full trace
// ---------------------------------------------------------------------------

function runOneSimulation(trueArchetype: Archetype, partnerId: string): SimTrace {
  const trace: SimTrace = {
    posteriorTrue: new Map(),
    posteriorPartner: new Map(),
    stopFiredAtQ: null,
    leaderAtStop: null,
  };

  // Pre-generate NOISY answers to all 63 questions
  const answers = new Map<number, SimulatedAnswer>();
  for (const q of QUESTION_BANK) {
    answers.set(q.id, generateNoisyAnswer(trueArchetype, q));
  }

  const state = createInitialState();

  // Phase 1: Fixed 12 questions
  for (const qid of FIXED_12) {
    const q = BANK_BY_ID.get(qid);
    if (!q) continue;
    const answer = answers.get(q.id);
    if (!answer) continue;
    applySimulatedAnswer(state, q, answer);
  }
  recomputeArchetypePosterior(state, ARCHETYPES);
  updateNodeStatuses(state, viableCandidates(state, ARCHETYPES));

  // Record posteriors after fixed-12 phase
  const nAfterFixed = Object.keys(state.answers).length;
  trace.posteriorTrue.set(nAfterFixed, state.archetypePosterior[trueArchetype.id] ?? 0);
  trace.posteriorPartner.set(nAfterFixed, state.archetypePosterior[partnerId] ?? 0);

  // Check stop rule even here (it won't fire at Q12, but be systematic)
  if (trace.stopFiredAtQ === null && shouldStop(state)) {
    trace.stopFiredAtQ = nAfterFixed;
    trace.leaderAtStop = getLeaderId(state);
  }

  // Phase 2: Adaptive loop — run ALL remaining questions, do NOT break on stop
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

    const nNow = Object.keys(state.answers).length;

    // Record posteriors at every question count
    trace.posteriorTrue.set(nNow, state.archetypePosterior[trueArchetype.id] ?? 0);
    trace.posteriorPartner.set(nNow, state.archetypePosterior[partnerId] ?? 0);

    // Track first time shouldStop() fires (but do NOT break)
    if (trace.stopFiredAtQ === null && shouldStop(state)) {
      trace.stopFiredAtQ = nNow;
      trace.leaderAtStop = getLeaderId(state);
    }
  }

  return trace;
}

// ---------------------------------------------------------------------------
// Analyze traces for one pair
// ---------------------------------------------------------------------------

interface PairResults {
  pair: ConfusionPair;
  /** For each checkpoint Q, how many of NUM_SIMS had the true archetype leading */
  trueLeadsAtCheckpoint: Map<number, number>;
  /** For each checkpoint Q, the array of margins (true - partner) across sims */
  marginsAtCheckpoint: Map<number, number[]>;
  /** How many sims had shouldStop fire with the WRONG archetype in the lead */
  stopWithWrongLeader: number;
  /** How many sims had shouldStop fire at all */
  stopFiredCount: number;
  /** For each sim, the earliest Q at which the true archetype stably leads through Q63 */
  stableLeadQs: number[];
  /** Distribution of stop-fire Qs */
  stopFireQs: number[];
}

function analyzePair(pair: ConfusionPair): PairResults {
  const trueArchetype = ARCHETYPES.find((a) => a.id === pair.trueId);
  if (!trueArchetype) throw new Error(`Archetype ${pair.trueId} not found`);

  const results: PairResults = {
    pair,
    trueLeadsAtCheckpoint: new Map(CHECKPOINTS.map((q) => [q, 0])),
    marginsAtCheckpoint: new Map(CHECKPOINTS.map((q) => [q, []])),
    stopWithWrongLeader: 0,
    stopFiredCount: 0,
    stableLeadQs: [],
    stopFireQs: [],
  };

  for (let sim = 0; sim < NUM_SIMS; sim++) {
    const trace = runOneSimulation(trueArchetype, pair.partnerId);

    // 1. Check leadership at each checkpoint
    for (const cp of CHECKPOINTS) {
      const pTrue = trace.posteriorTrue.get(cp) ?? 0;
      const pPartner = trace.posteriorPartner.get(cp) ?? 0;
      if (pTrue > pPartner) {
        results.trueLeadsAtCheckpoint.set(cp, (results.trueLeadsAtCheckpoint.get(cp) ?? 0) + 1);
      }
      results.marginsAtCheckpoint.get(cp)!.push(pTrue - pPartner);
    }

    // 2. shouldStop with wrong leader?
    if (trace.stopFiredAtQ !== null) {
      results.stopFiredCount++;
      results.stopFireQs.push(trace.stopFiredAtQ);
      if (trace.leaderAtStop !== pair.trueId) {
        results.stopWithWrongLeader++;
      }
    }

    // 3. Earliest Q at which true archetype STABLY leads through Q63
    //    Walk backwards from Q63: find the last Q where true did NOT lead,
    //    then stableQ = that Q + 1.  If true always led, stableQ = Q_RANGE_START.
    let stableQ: number | null = null;
    // Collect all Q counts present in the trace in ascending order
    const allQs = [...trace.posteriorTrue.keys()].sort((a, b) => a - b);
    if (allQs.length > 0) {
      // Walk backwards through the Qs
      let lastNonLeadIdx = -1;
      for (let i = allQs.length - 1; i >= 0; i--) {
        const q = allQs[i]!;
        const pTrue = trace.posteriorTrue.get(q) ?? 0;
        const pPartner = trace.posteriorPartner.get(q) ?? 0;
        if (pTrue <= pPartner) {
          lastNonLeadIdx = i;
          break;
        }
      }
      if (lastNonLeadIdx === -1) {
        // True archetype led at every single recorded Q
        stableQ = allQs[0]!;
      } else if (lastNonLeadIdx < allQs.length - 1) {
        // Stable from the next Q onward
        stableQ = allQs[lastNonLeadIdx + 1]!;
      } else {
        // True never stably led (partner led at Q63)
        stableQ = null;
      }
    }
    results.stableLeadQs.push(stableQ ?? 999);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Pretty-print results for one pair
// ---------------------------------------------------------------------------

function printPairResults(r: PairResults): void {
  const hdr = `${r.pair.trueId} ${r.pair.trueName} --> ${r.pair.partnerId} ${r.pair.partnerName}`;

  console.log("\n" + "=".repeat(100));
  console.log(`PAIR: ${hdr}`);
  console.log("=".repeat(100));

  // --- Checkpoint table ---
  console.log(
    "\n  " +
      "Checkpoint".padEnd(12) +
      "TrueLeads".padStart(11) +
      "Pct".padStart(8) +
      "MedianMargin".padStart(14) +
      "Min".padStart(10) +
      "Max".padStart(10)
  );
  console.log("  " + "-".repeat(65));

  for (const cp of CHECKPOINTS) {
    const leads = r.trueLeadsAtCheckpoint.get(cp) ?? 0;
    const pct = ((100 * leads) / NUM_SIMS).toFixed(1) + "%";
    const margins = r.marginsAtCheckpoint.get(cp) ?? [];
    const med = median([...margins]);
    const mn = margins.length > 0 ? Math.min(...margins) : 0;
    const mx = margins.length > 0 ? Math.max(...margins) : 0;
    console.log(
      "  " +
        `Q${cp}`.padEnd(12) +
        String(leads).padStart(11) +
        pct.padStart(8) +
        med.toFixed(4).padStart(14) +
        mn.toFixed(4).padStart(10) +
        mx.toFixed(4).padStart(10)
    );
  }

  // --- Stop rule diagnostics ---
  console.log("\n  STOP RULE DIAGNOSTICS:");
  console.log(`    shouldStop() fired in ${r.stopFiredCount} / ${NUM_SIMS} simulations`);
  console.log(`    Fired with WRONG leader: ${r.stopWithWrongLeader} / ${r.stopFiredCount}`);
  if (r.stopFiredCount > 0) {
    const wrongPct = ((100 * r.stopWithWrongLeader) / r.stopFiredCount).toFixed(1);
    console.log(`    Wrong-leader rate: ${wrongPct}%`);
    const sortedStopQs = [...r.stopFireQs].sort((a, b) => a - b);
    console.log(`    Stop-fire Q: min=${sortedStopQs[0]}, median=${median([...r.stopFireQs]).toFixed(0)}, max=${sortedStopQs[sortedStopQs.length - 1]}`);
  }

  // --- Stable-lead analysis ---
  const validStable = r.stableLeadQs.filter((q) => q < 999);
  const neverStable = r.stableLeadQs.filter((q) => q >= 999).length;
  console.log("\n  STABLE LEAD ANALYSIS:");
  console.log(`    True archetype NEVER stably led (partner still ahead at Q63): ${neverStable} / ${NUM_SIMS}`);
  if (validStable.length > 0) {
    const sortedStable = [...validStable].sort((a, b) => a - b);
    const medStable = median([...validStable]);
    console.log(
      `    When it did stabilize: min=Q${sortedStable[0]}, median=Q${medStable.toFixed(0)}, max=Q${sortedStable[sortedStable.length - 1]}`
    );
    // Histogram: how many stabilized in each 5-Q bucket
    const buckets: Record<string, number> = {};
    for (const q of validStable) {
      const bucket = Math.floor(q / 5) * 5;
      const label = `Q${bucket}-${bucket + 4}`;
      buckets[label] = (buckets[label] ?? 0) + 1;
    }
    console.log("    Stabilization histogram:");
    for (const [label, count] of Object.entries(buckets).sort()) {
      const bar = "#".repeat(Math.round((count / NUM_SIMS) * 100));
      console.log(`      ${label.padEnd(10)} ${String(count).padStart(4)}  ${bar}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("=".repeat(100));
console.log("PAIR DIAGNOSTIC: 4 confusion-prone archetype pairs");
console.log(`Running ${NUM_SIMS} noisy simulations per pair`);
console.log("Checkpoints: " + CHECKPOINTS.map((q) => `Q${q}`).join(", "));
console.log("=".repeat(100));

const globalStart = Date.now();

for (const pair of PAIRS) {
  const pairStart = Date.now();
  console.log(`\nSimulating pair: ${pair.trueId} ${pair.trueName} vs ${pair.partnerId} ${pair.partnerName} ...`);

  const results = analyzePair(pair);
  printPairResults(results);

  const pairElapsed = ((Date.now() - pairStart) / 1000).toFixed(1);
  console.log(`\n  [Pair completed in ${pairElapsed}s]`);
}

const totalElapsed = ((Date.now() - globalStart) / 1000).toFixed(1);
console.log("\n" + "=".repeat(100));
console.log(`All pairs complete. Total elapsed: ${totalElapsed}s`);
console.log("=".repeat(100));
