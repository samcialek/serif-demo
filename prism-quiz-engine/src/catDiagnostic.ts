import { ARCHETYPES } from "./config/archetypes.js";
import { REPRESENTATIVE_QUESTIONS } from "./config/questions.representative.js";
import { FULL_QUESTIONS } from "./config/questions.full.js";
import { FIXED_12 } from "./engine/config.js";
import { createInitialState } from "./state/initialState.js";
import type {
  Archetype,
  QuestionDef,
  RespondentState,
  CategoricalNodeId,
  NodeId,
  NodeStatus,
  CategoricalDist
} from "./types.js";
import {
  applyAllocationAnswer,
  applyPairwiseAnswer,
  applyRankingAnswer,
  applySingleChoiceAnswer,
  applySliderAnswer
} from "./engine/update.js";
import { recomputeArchetypePosterior, viableArchetypes } from "./engine/archetypeDistance.js";
import { updateNodeStatuses } from "./engine/nodeStatus.js";
import { selectNextQuestion } from "./engine/nextQuestion.js";

// ---------------------------------------------------------------------------
// Question bank setup (same pattern as stopDiagnostic.ts)
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
// Viable candidates (same as stopDiagnostic.ts)
// ---------------------------------------------------------------------------
function viableCandidates(state: RespondentState, archetypes: Archetype[]) {
  return viableArchetypes(state, archetypes);
}

// ---------------------------------------------------------------------------
// Answer generation (same as stopDiagnostic.ts)
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
          return scoreAllocationBucket(archetype, map);
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
// Disagree-on-node helper (mirrors nodeStatus.ts logic)
// ---------------------------------------------------------------------------
function archetypesDisagreeOnNode(nodeId: NodeId, archetypes: Archetype[]): boolean {
  if (archetypes.length < 2) return false;
  const templates = archetypes.map((a) => a.nodes[nodeId]).filter(Boolean);
  if (templates.length < 2) return false;
  const first = templates[0]!;
  for (const t of templates) {
    if (!t) continue;
    if (first.kind !== t.kind) return true;
    if (first.kind === "categorical" && t.kind === "categorical") {
      const fMax = first.probs.indexOf(Math.max(...first.probs));
      const tMax = t.probs.indexOf(Math.max(...t.probs));
      if (fMax !== tMax) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Types for per-question categorical node snapshot
// ---------------------------------------------------------------------------
const CAT_NODES: CategoricalNodeId[] = ["EPS", "AES"];

interface CatSnapshot {
  qCount: number;        // how many questions answered so far
  touches: number;
  touchTypes: number;
  probActive: number;    // salDist[2] + salDist[3]
  catUncertainty: boolean; // (sorted[0] - sorted[1]) < 0.30
  separates: boolean;    // viable candidates disagree on this node
  status: NodeStatus;
  catDist: CategoricalDist;
}

interface ArchetypeResult {
  id: string;
  name: string;
  // For each categorical node: array of snapshots (one per question from Q12 through Q63)
  snapshots: Record<CategoricalNodeId, CatSnapshot[]>;
  // First question count at which node becomes live_resolved (null if never)
  firstResolved: Record<CategoricalNodeId, number | null>;
}

// ---------------------------------------------------------------------------
// Main simulation loop
// ---------------------------------------------------------------------------

const allResults: ArchetypeResult[] = [];

for (const trueArchetype of ARCHETYPES) {
  // Pre-generate all answers deterministically
  const answers = new Map<number, SimulatedAnswer>();
  for (const q of QUESTION_BANK) {
    answers.set(q.id, generateAnswer(trueArchetype, q));
  }

  const state = createInitialState();
  const snapshots: Record<CategoricalNodeId, CatSnapshot[]> = {
    EPS: [], AES: []
  };
  const firstResolved: Record<CategoricalNodeId, number | null> = {
    EPS: null, AES: null
  };

  // Helper: take a snapshot of all categorical nodes at current question count
  function recordSnapshot(nAnswered: number) {
    const candidates = viableCandidates(state, ARCHETYPES);
    for (const catId of CAT_NODES) {
      const node = state.categorical[catId];
      const probActive = node.salDist[2] + node.salDist[3];
      const sorted = [...node.catDist].sort((a, b) => b - a);
      const catUncertainty = (sorted[0] ?? 0) - (sorted[1] ?? 0) < 0.30;
      const separates = archetypesDisagreeOnNode(catId, candidates);

      snapshots[catId].push({
        qCount: nAnswered,
        touches: node.touches,
        touchTypes: node.touchTypes.size,
        probActive,
        catUncertainty,
        separates,
        status: node.status,
        catDist: [...node.catDist] as CategoricalDist
      });

      // Track first time it becomes live_resolved
      if (node.status === "live_resolved" && firstResolved[catId] === null) {
        firstResolved[catId] = nAnswered;
      }
    }
  }

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

  const nAfterFixed = Object.keys(state.answers).length;
  recordSnapshot(nAfterFixed);

  // Phase 2: Adaptive questions
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
    recordSnapshot(nAnswered);
  }

  allResults.push({
    id: trueArchetype.id,
    name: trueArchetype.name,
    snapshots,
    firstResolved
  });
}

// ---------------------------------------------------------------------------
// Output Section 1: Median question at which each categorical node FIRST
// becomes live_resolved
// ---------------------------------------------------------------------------

function median(arr: number[]): number {
  if (arr.length === 0) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1]! + s[mid]!) / 2 : s[mid]!;
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo]!;
  return s[lo]! + (idx - lo) * (s[hi]! - s[lo]!);
}

console.log("=".repeat(100));
console.log("CATEGORICAL NODE DIAGNOSTIC: Resolution timing for EPS, AES");
console.log("=".repeat(100));

console.log("\n" + "=".repeat(80));
console.log("SECTION 1: Median question at which each node FIRST becomes live_resolved");
console.log("=".repeat(80));

for (const catId of CAT_NODES) {
  const resolvedQs = allResults
    .map(r => r.firstResolved[catId])
    .filter((q): q is number => q !== null);
  const neverResolved = allResults.length - resolvedQs.length;

  console.log(`\n  ${catId}:`);
  console.log(`    Resolved in ${resolvedQs.length} / ${allResults.length} archetypes`);
  if (resolvedQs.length > 0) {
    console.log(`    Median Q:  ${median(resolvedQs).toFixed(1)}`);
    console.log(`    P10:       ${percentile(resolvedQs, 10).toFixed(1)}`);
    console.log(`    P25:       ${percentile(resolvedQs, 25).toFixed(1)}`);
    console.log(`    P75:       ${percentile(resolvedQs, 75).toFixed(1)}`);
    console.log(`    P90:       ${percentile(resolvedQs, 90).toFixed(1)}`);
    console.log(`    Min:       ${Math.min(...resolvedQs)}`);
    console.log(`    Max:       ${Math.max(...resolvedQs)}`);
  }
  console.log(`    Never resolved: ${neverResolved}`);
}

// ---------------------------------------------------------------------------
// Output Section 2: Distribution of live_unresolved -> live_resolved transition
// ---------------------------------------------------------------------------

console.log("\n" + "=".repeat(80));
console.log("SECTION 2: Distribution of first resolution question (histogram buckets)");
console.log("=".repeat(80));

for (const catId of CAT_NODES) {
  const resolvedQs = allResults
    .map(r => r.firstResolved[catId])
    .filter((q): q is number => q !== null);

  if (resolvedQs.length === 0) {
    console.log(`\n  ${catId}: No archetypes ever resolve this node.`);
    continue;
  }

  // Bucket into ranges: 12-15, 16-20, 21-25, 26-30, 31-35, 36-40, 41-45, 46-50, 51-55, 56-63
  const buckets: [string, number, number][] = [
    ["12-15", 12, 15], ["16-20", 16, 20], ["21-25", 21, 25],
    ["26-30", 26, 30], ["31-35", 31, 35], ["36-40", 36, 40],
    ["41-45", 41, 45], ["46-50", 46, 50], ["51-55", 51, 55],
    ["56-63", 56, 63]
  ];

  console.log(`\n  ${catId}:`);
  for (const [label, lo, hi] of buckets) {
    const count = resolvedQs.filter(q => q >= lo && q <= hi).length;
    const bar = "#".repeat(Math.round(count * 50 / allResults.length));
    const pct = (100 * count / allResults.length).toFixed(0);
    console.log(`    Q${label.padEnd(6)} ${String(count).padStart(3)} (${pct.padStart(3)}%) ${bar}`);
  }
}

// ---------------------------------------------------------------------------
// Output Section 3: For archetypes that NEVER resolve a node, show catDist at Q63
// ---------------------------------------------------------------------------

console.log("\n" + "=".repeat(80));
console.log("SECTION 3: Archetypes that NEVER resolve a categorical node -- catDist at final Q");
console.log("=".repeat(80));

for (const catId of CAT_NODES) {
  const neverResolved = allResults.filter(r => r.firstResolved[catId] === null);

  if (neverResolved.length === 0) {
    console.log(`\n  ${catId}: All archetypes eventually resolve this node.`);
    continue;
  }

  console.log(`\n  ${catId}: ${neverResolved.length} archetypes never resolve`);
  console.log(
    "    " +
    "Archetype".padEnd(45) +
    "catDist".padEnd(48) +
    "probActive".padStart(11) +
    "  catUncertain  separates  status"
  );
  console.log("    " + "-".repeat(140));

  for (const r of neverResolved) {
    // Get the last snapshot for this node
    const snaps = r.snapshots[catId];
    const last = snaps[snaps.length - 1];
    if (!last) continue;

    const catDistStr = last.catDist.map(v => v.toFixed(3)).join(", ");
    console.log(
      "    " +
      `${r.id} ${r.name}`.slice(0, 45).padEnd(45) +
      `[${catDistStr}]`.padEnd(48) +
      last.probActive.toFixed(3).padStart(11) +
      "  " + String(last.catUncertainty).padEnd(14) +
      String(last.separates).padEnd(11) +
      last.status
    );
  }
}

// ---------------------------------------------------------------------------
// Output Section 4: separates vs catUncertainty as reason for staying unresolved
// ---------------------------------------------------------------------------

console.log("\n" + "=".repeat(80));
console.log("SECTION 4: Why nodes stay live_unresolved -- separates vs catUncertainty");
console.log("=".repeat(80));
console.log("\nAt each question, when a categorical node is live_unresolved, we check why.");
console.log("(A node can be unresolved due to separates, catUncertainty, or both.)\n");

for (const catId of CAT_NODES) {
  let totalUnresolved = 0;
  let onlySeparates = 0;
  let onlyCatUncertainty = 0;
  let both = 0;
  let neither = 0;  // should not happen if status is live_unresolved, but track anyway

  // Also track at specific checkpoints for more detail
  const checkpoints = [15, 20, 25, 30, 35, 40, 50, 63];
  const cpStats: Record<number, { total: number; onlySep: number; onlyCat: number; both: number }> = {};
  for (const cp of checkpoints) {
    cpStats[cp] = { total: 0, onlySep: 0, onlyCat: 0, both: 0 };
  }

  for (const r of allResults) {
    for (const snap of r.snapshots[catId]) {
      if (snap.status !== "live_unresolved") continue;
      totalUnresolved++;
      const hasSep = snap.separates;
      const hasCat = snap.catUncertainty;
      if (hasSep && hasCat) both++;
      else if (hasSep && !hasCat) onlySeparates++;
      else if (!hasSep && hasCat) onlyCatUncertainty++;
      else neither++;

      // Check if this question count matches a checkpoint
      for (const cp of checkpoints) {
        if (snap.qCount === cp) {
          cpStats[cp]!.total++;
          if (hasSep && hasCat) cpStats[cp]!.both++;
          else if (hasSep && !hasCat) cpStats[cp]!.onlySep++;
          else if (!hasSep && hasCat) cpStats[cp]!.onlyCat++;
        }
      }
    }
  }

  console.log(`  ${catId}:`);
  console.log(`    Total live_unresolved observations: ${totalUnresolved}`);
  if (totalUnresolved > 0) {
    const pct = (v: number) => (100 * v / totalUnresolved).toFixed(1);
    console.log(`    Only separates:      ${String(onlySeparates).padStart(5)}  (${pct(onlySeparates)}%)`);
    console.log(`    Only catUncertainty: ${String(onlyCatUncertainty).padStart(5)}  (${pct(onlyCatUncertainty)}%)`);
    console.log(`    Both:                ${String(both).padStart(5)}  (${pct(both)}%)`);
    console.log(`    Neither (bug?):      ${String(neither).padStart(5)}  (${pct(neither)}%)`);

    const moreCommon = (onlySeparates + both) > (onlyCatUncertainty + both)
      ? "separates"
      : (onlySeparates + both) < (onlyCatUncertainty + both)
        ? "catUncertainty"
        : "tied";
    console.log(`    >> Primary reason: ${moreCommon} (separates involved: ${onlySeparates + both}, catUncertainty involved: ${onlyCatUncertainty + both})`);
  }

  console.log(`\n    Per-checkpoint breakdown (unresolved count and reason):`);
  console.log(
    "    " +
    "Q".padEnd(6) +
    "Unresolved".padStart(11) +
    "  onlySep".padStart(10) +
    "  onlyCat".padStart(10) +
    "  both".padStart(8)
  );
  for (const cp of checkpoints) {
    const s = cpStats[cp]!;
    if (s.total === 0) {
      console.log(`    Q${String(cp).padEnd(5)} ${String(0).padStart(11)}`);
    } else {
      console.log(
        `    Q${String(cp).padEnd(5)} ` +
        `${String(s.total).padStart(11)}  ` +
        `${String(s.onlySep).padStart(9)}  ` +
        `${String(s.onlyCat).padStart(9)}  ` +
        `${String(s.both).padStart(7)}`
      );
    }
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Output Section 5: Per-archetype detail table (condensed)
// ---------------------------------------------------------------------------

console.log("=".repeat(80));
console.log("SECTION 5: Per-archetype first-resolution question for each categorical node");
console.log("=".repeat(80));

console.log(
  "  " +
  "ID".padEnd(6) +
  "Name".padEnd(42) +
  "EPS".padStart(5) +
  "AES".padStart(5)
);
console.log("  " + "-".repeat(63));

const sortedResults = [...allResults].sort((a, b) => {
  // Sort by sum of resolution questions (never = 999)
  const sumA = CAT_NODES.reduce((s, n) => s + (a.firstResolved[n] ?? 999), 0);
  const sumB = CAT_NODES.reduce((s, n) => s + (b.firstResolved[n] ?? 999), 0);
  return sumA - sumB;
});

for (const r of sortedResults) {
  const fmt = (q: number | null) => q === null ? "  --" : String(q).padStart(4);
  console.log(
    "  " +
    r.id.padEnd(6) +
    r.name.slice(0, 42).padEnd(42) +
    fmt(r.firstResolved.EPS) + " " +
    fmt(r.firstResolved.AES)
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log("\n" + "=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80));

for (const catId of CAT_NODES) {
  const resolvedQs = allResults
    .map(r => r.firstResolved[catId])
    .filter((q): q is number => q !== null);
  const neverCount = allResults.length - resolvedQs.length;

  // Count how many are unresolved because of separates vs catUncertainty at last snapshot
  let lastSepOnly = 0, lastCatOnly = 0, lastBoth = 0;
  for (const r of allResults) {
    if (r.firstResolved[catId] !== null) continue; // already resolved
    const snaps = r.snapshots[catId];
    const last = snaps[snaps.length - 1];
    if (!last || last.status !== "live_unresolved") continue;
    if (last.separates && last.catUncertainty) lastBoth++;
    else if (last.separates) lastSepOnly++;
    else if (last.catUncertainty) lastCatOnly++;
  }

  console.log(`\n  ${catId}:`);
  console.log(`    Resolved: ${resolvedQs.length}/${allResults.length}  (median Q=${resolvedQs.length > 0 ? median(resolvedQs).toFixed(1) : "N/A"})`);
  console.log(`    Never resolved: ${neverCount}`);
  if (neverCount > 0) {
    console.log(`      Final-Q reason breakdown: onlySeparates=${lastSepOnly}  onlyCatUncertainty=${lastCatOnly}  both=${lastBoth}`);
  }
}
