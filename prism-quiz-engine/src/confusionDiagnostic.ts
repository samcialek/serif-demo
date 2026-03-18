import { ARCHETYPES } from "./config/archetypes.js";
import { REPRESENTATIVE_QUESTIONS } from "./config/questions.representative.js";
import { FULL_QUESTIONS } from "./config/questions.full.js";
import { FIXED_12 } from "./engine/config.js";
import { CONTINUOUS_NODES, CATEGORICAL_NODES } from "./config/nodes.js";
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
import { recomputeArchetypePosterior, viableArchetypes } from "./engine/archetypeDistance.js";
import { updateNodeStatuses } from "./engine/nodeStatus.js";
import { selectNextQuestion } from "./engine/nextQuestion.js";

// ---------------------------------------------------------------------------
// Question bank setup (same pattern as catDiagnostic.ts)
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
// Viable candidates helper
// ---------------------------------------------------------------------------
function viableCandidates(state: RespondentState, archetypes: Archetype[]) {
  return viableArchetypes(state, archetypes);
}

// ---------------------------------------------------------------------------
// Answer generation (identical to catDiagnostic.ts)
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
      const scores = keys.map((k) => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
      const idx = softmaxSample(scores);
      return { type: "single_choice", value: keys[idx]! };
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
      keys.forEach((k, i) => {
        allocation[k] = Math.round((100 * raw[i]!) / rawTotal);
      });
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
        const scores = optKeys.map((k) => {
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
// Per-archetype result tracking
// ---------------------------------------------------------------------------
interface ArchetypeSimResult {
  trueId: string;
  trueName: string;
  top1Id: string;
  top1Name: string;
  top1Posterior: number;
  top5: { id: string; name: string; posterior: number }[];
  correct: boolean;
  // Node signatures for the true archetype
  trueNodes: Partial<Record<NodeId, { kind: string; pos?: number; sal?: number; probs?: number[] }>>;
  // Whether EPS/AES resolved
  epsResolved: boolean;
  aesResolved: boolean;
}

// ---------------------------------------------------------------------------
// Build archetype lookup
// ---------------------------------------------------------------------------
const ARCH_BY_ID = new Map(ARCHETYPES.map((a) => [a.id, a]));

// ---------------------------------------------------------------------------
// Main simulation loop
// ---------------------------------------------------------------------------
const results: ArchetypeSimResult[] = [];

for (const trueArchetype of ARCHETYPES) {
  // Pre-generate all answers deterministically
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
  }

  // Collect posterior results
  const posteriorEntries = ARCHETYPES.map((a) => ({
    id: a.id,
    name: a.name,
    posterior: state.archetypePosterior[a.id] ?? 0,
  })).sort((a, b) => b.posterior - a.posterior);

  const top1 = posteriorEntries[0]!;
  const top5 = posteriorEntries.slice(0, 5);

  // Extract true archetype node signatures
  const trueNodes: ArchetypeSimResult["trueNodes"] = {};
  for (const [nid, tmpl] of Object.entries(trueArchetype.nodes)) {
    if (tmpl.kind === "continuous") {
      trueNodes[nid as NodeId] = { kind: "continuous", pos: tmpl.pos, sal: tmpl.sal };
    } else {
      trueNodes[nid as NodeId] = { kind: "categorical", probs: [...tmpl.probs], sal: tmpl.sal };
    }
  }

  results.push({
    trueId: trueArchetype.id,
    trueName: trueArchetype.name,
    top1Id: top1.id,
    top1Name: top1.name,
    top1Posterior: top1.posterior,
    top5,
    correct: top1.id === trueArchetype.id,
    trueNodes,
    epsResolved: state.categorical.EPS.status === "live_resolved",
    aesResolved: state.categorical.AES.status === "live_resolved",
  });
}

// ---------------------------------------------------------------------------
// OUTPUT SECTION 1: Overall top-1 accuracy
// ---------------------------------------------------------------------------
console.log("=".repeat(100));
console.log("ARCHETYPE CONFUSION DIAGNOSTIC");
console.log("=".repeat(100));

const correctCount = results.filter((r) => r.correct).length;
console.log(`\nOverall top-1 accuracy: ${correctCount} / ${results.length} (${(100 * correctCount / results.length).toFixed(1)}%)`);

const top5Count = results.filter((r) => r.top5.some((t) => t.id === r.trueId)).length;
console.log(`Top-5 accuracy: ${top5Count} / ${results.length} (${(100 * top5Count / results.length).toFixed(1)}%)`);

// ---------------------------------------------------------------------------
// OUTPUT SECTION 2: Confusion list -- for each misidentified archetype
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 2: Confusion list -- misidentified archetypes with top-3 posteriors");
console.log("=".repeat(100));

const misidentified = results.filter((r) => !r.correct);
console.log(`\n${misidentified.length} archetypes misidentified:\n`);

// Sort by true ID
misidentified.sort((a, b) => a.trueId.localeCompare(b.trueId));

for (const r of misidentified) {
  const trueRank = r.top5.findIndex((t) => t.id === r.trueId);
  const trueRankStr = trueRank >= 0 ? `rank ${trueRank + 1}` : "not in top-5";
  console.log(`  ${r.trueId} "${r.trueName}" -> guessed ${r.top1Id} "${r.top1Name}" (true archetype: ${trueRankStr})`);
  console.log(`    EPS resolved: ${r.epsResolved}  |  AES resolved: ${r.aesResolved}`);
  console.log(`    Top-3 posteriors:`);
  for (let i = 0; i < Math.min(3, r.top5.length); i++) {
    const t = r.top5[i]!;
    const marker = t.id === r.trueId ? " <-- TRUE" : "";
    console.log(`      ${i + 1}. ${t.id} "${t.name}" = ${(t.posterior * 100).toFixed(2)}%${marker}`);
  }
  console.log();
}

// ---------------------------------------------------------------------------
// OUTPUT SECTION 3: Confusion clusters -- archetypes frequently confused together
// ---------------------------------------------------------------------------
console.log("=".repeat(100));
console.log("SECTION 3: Confusion clusters -- bidirectional confusion pairs");
console.log("=".repeat(100));

// Build directed confusion graph
const confusionEdges = new Map<string, Map<string, number>>(); // trueId -> guessedId -> count
for (const r of results) {
  if (r.correct) continue;
  if (!confusionEdges.has(r.trueId)) confusionEdges.set(r.trueId, new Map());
  const m = confusionEdges.get(r.trueId)!;
  m.set(r.top1Id, (m.get(r.top1Id) ?? 0) + 1);
}

// Find bidirectional pairs (A confused as B AND B confused as A)
const bidirectionalPairs: { a: string; b: string; aName: string; bName: string }[] = [];
const seenPairs = new Set<string>();

for (const [trueId, guesses] of confusionEdges) {
  for (const [guessedId] of guesses) {
    const pairKey = [trueId, guessedId].sort().join("|");
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    const reverseMap = confusionEdges.get(guessedId);
    if (reverseMap?.has(trueId)) {
      const aArch = ARCH_BY_ID.get(trueId);
      const bArch = ARCH_BY_ID.get(guessedId);
      bidirectionalPairs.push({
        a: trueId,
        b: guessedId,
        aName: aArch?.name ?? "?",
        bName: bArch?.name ?? "?",
      });
    }
  }
}

// Also find one-directional clusters (connected components in confusion graph)
// Union-Find for clustering
const parent = new Map<string, string>();
function find(x: string): string {
  if (!parent.has(x)) parent.set(x, x);
  if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
  return parent.get(x)!;
}
function union(a: string, b: string) {
  const ra = find(a), rb = find(b);
  if (ra !== rb) parent.set(ra, rb);
}

for (const r of misidentified) {
  union(r.trueId, r.top1Id);
}

// Build clusters
const clusterMembers = new Map<string, Set<string>>();
for (const r of misidentified) {
  const root = find(r.trueId);
  if (!clusterMembers.has(root)) clusterMembers.set(root, new Set());
  clusterMembers.get(root)!.add(r.trueId);
  clusterMembers.get(root)!.add(r.top1Id);
}

console.log(`\nBidirectional confusion pairs: ${bidirectionalPairs.length}`);
for (const p of bidirectionalPairs) {
  console.log(`  ${p.a} "${p.aName}" <-> ${p.b} "${p.bName}"`);
}

console.log(`\nConfusion clusters (connected components, size >= 2):`);
const sortedClusters = [...clusterMembers.entries()]
  .map(([, members]) => [...members].sort())
  .filter((m) => m.length >= 2)
  .sort((a, b) => b.length - a.length);

for (let ci = 0; ci < sortedClusters.length; ci++) {
  const members = sortedClusters[ci]!;
  console.log(`\n  Cluster ${ci + 1} (${members.length} archetypes):`);
  for (const id of members) {
    const arch = ARCH_BY_ID.get(id);
    const simResult = results.find((r) => r.trueId === id);
    const wasCorrect = simResult?.correct ?? false;
    const guessedAs = wasCorrect ? "(correct)" : `-> ${simResult?.top1Id}`;
    console.log(`    ${id} "${arch?.name ?? "?"}" ${guessedAs}`);
  }
}

// ---------------------------------------------------------------------------
// OUTPUT SECTION 4: Node-level agreement/disagreement for confused pairs
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 4: Node-level agreement/disagreement for confused pairs");
console.log("=".repeat(100));

// Collect all unique confused pairs (true -> guessed)
const confusedPairs: { trueId: string; guessId: string; trueName: string; guessName: string }[] = [];
const pairSet = new Set<string>();
for (const r of misidentified) {
  const key = `${r.trueId}|${r.top1Id}`;
  if (pairSet.has(key)) continue;
  pairSet.add(key);
  confusedPairs.push({
    trueId: r.trueId,
    guessId: r.top1Id,
    trueName: r.trueName,
    guessName: r.top1Name,
  });
}

const ALL_CONTINUOUS: ContinuousNodeId[] = [...CONTINUOUS_NODES] as ContinuousNodeId[];
const ALL_CATEGORICAL: CategoricalNodeId[] = [...CATEGORICAL_NODES] as CategoricalNodeId[];

for (const pair of confusedPairs) {
  const trueArch = ARCH_BY_ID.get(pair.trueId);
  const guessArch = ARCH_BY_ID.get(pair.guessId);
  if (!trueArch || !guessArch) continue;

  console.log(`\n  ${pair.trueId} "${pair.trueName}" confused as ${pair.guessId} "${pair.guessName}":`);

  // Continuous nodes
  const contAgree: string[] = [];
  const contDisagree: string[] = [];
  const contMissing: string[] = [];

  for (const nid of ALL_CONTINUOUS) {
    const tTmpl = trueArch.nodes[nid];
    const gTmpl = guessArch.nodes[nid];
    if (!tTmpl || tTmpl.kind !== "continuous" || !gTmpl || gTmpl.kind !== "continuous") {
      if (tTmpl && !gTmpl) contMissing.push(`${nid}(true has, guess missing)`);
      else if (!tTmpl && gTmpl) contMissing.push(`${nid}(true missing, guess has)`);
      continue;
    }
    const posDiff = Math.abs(tTmpl.pos - gTmpl.pos);
    const salDiff = Math.abs(tTmpl.sal - gTmpl.sal);
    if (posDiff === 0 && salDiff === 0) {
      contAgree.push(`${nid}(pos=${tTmpl.pos},sal=${tTmpl.sal})`);
    } else {
      contDisagree.push(`${nid}(pos:${tTmpl.pos}vs${gTmpl.pos} sal:${tTmpl.sal}vs${gTmpl.sal})`);
    }
  }

  // Categorical nodes
  const catAgree: string[] = [];
  const catDisagree: string[] = [];
  const catMissing: string[] = [];

  for (const nid of ALL_CATEGORICAL) {
    const tTmpl = trueArch.nodes[nid];
    const gTmpl = guessArch.nodes[nid];
    if (!tTmpl || tTmpl.kind !== "categorical" || !gTmpl || gTmpl.kind !== "categorical") {
      if (tTmpl && !gTmpl) catMissing.push(`${nid}(true has, guess missing)`);
      else if (!tTmpl && gTmpl) catMissing.push(`${nid}(true missing, guess has)`);
      continue;
    }
    const tMax = tTmpl.probs.indexOf(Math.max(...tTmpl.probs));
    const gMax = gTmpl.probs.indexOf(Math.max(...gTmpl.probs));
    const salDiff = Math.abs(tTmpl.sal - gTmpl.sal);
    if (tMax === gMax && salDiff === 0) {
      catAgree.push(`${nid}(mode=${tMax},sal=${tTmpl.sal})`);
    } else {
      const tProbs = tTmpl.probs.map((p) => p.toFixed(2)).join(",");
      const gProbs = gTmpl.probs.map((p) => p.toFixed(2)).join(",");
      catDisagree.push(`${nid}(mode:${tMax}vs${gMax} sal:${tTmpl.sal}vs${gTmpl.sal} true:[${tProbs}] guess:[${gProbs}])`);
    }
  }

  console.log(`    CONTINUOUS agree (${contAgree.length}): ${contAgree.join(", ") || "none"}`);
  console.log(`    CONTINUOUS disagree (${contDisagree.length}): ${contDisagree.join(", ") || "none"}`);
  if (contMissing.length > 0) console.log(`    CONTINUOUS missing: ${contMissing.join(", ")}`);
  console.log(`    CATEGORICAL agree (${catAgree.length}): ${catAgree.join(", ") || "none"}`);
  console.log(`    CATEGORICAL disagree (${catDisagree.length}): ${catDisagree.join(", ") || "none"}`);
  if (catMissing.length > 0) console.log(`    CATEGORICAL missing: ${catMissing.join(", ")}`);

  // Count total agreements vs disagreements
  const totalNodes = contAgree.length + contDisagree.length + catAgree.length + catDisagree.length;
  const totalAgree = contAgree.length + catAgree.length;
  console.log(`    Summary: ${totalAgree}/${totalNodes} nodes identical (${totalNodes > 0 ? (100 * totalAgree / totalNodes).toFixed(0) : 0}% overlap)`);
}

// ---------------------------------------------------------------------------
// OUTPUT SECTION 5: Focus on archetypes that never resolve EPS or AES
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 5: Archetypes that never resolve EPS or AES -- confusion details");
console.log("=".repeat(100));

const neverEPS = results.filter((r) => !r.epsResolved);
const neverAES = results.filter((r) => !r.aesResolved);
const neverEither = results.filter((r) => !r.epsResolved || !r.aesResolved);

console.log(`\nNever resolve EPS: ${neverEPS.length}`);
console.log(`Never resolve AES: ${neverAES.length}`);
console.log(`Never resolve either: ${neverEither.length}`);

console.log(`\n--- Archetypes never resolving EPS ---`);
console.log(
  "  " +
  "ID".padEnd(6) +
  "Name".padEnd(40) +
  "Correct?".padEnd(10) +
  "Top-1 guess".padEnd(50) +
  "Top-1 post%"
);
console.log("  " + "-".repeat(115));
for (const r of neverEPS.sort((a, b) => a.trueId.localeCompare(b.trueId))) {
  console.log(
    "  " +
    r.trueId.padEnd(6) +
    r.trueName.slice(0, 39).padEnd(40) +
    (r.correct ? "YES" : "NO").padEnd(10) +
    `${r.top1Id} "${r.top1Name}"`.slice(0, 49).padEnd(50) +
    (r.top1Posterior * 100).toFixed(2) + "%"
  );
}

console.log(`\n--- Archetypes never resolving AES ---`);
console.log(
  "  " +
  "ID".padEnd(6) +
  "Name".padEnd(40) +
  "Correct?".padEnd(10) +
  "Top-1 guess".padEnd(50) +
  "Top-1 post%"
);
console.log("  " + "-".repeat(115));
for (const r of neverAES.sort((a, b) => a.trueId.localeCompare(b.trueId))) {
  console.log(
    "  " +
    r.trueId.padEnd(6) +
    r.trueName.slice(0, 39).padEnd(40) +
    (r.correct ? "YES" : "NO").padEnd(10) +
    `${r.top1Id} "${r.top1Name}"`.slice(0, 49).padEnd(50) +
    (r.top1Posterior * 100).toFixed(2) + "%"
  );
}

// ---------------------------------------------------------------------------
// OUTPUT SECTION 6: Cross-tabulation -- EPS/AES resolution vs correctness
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 6: EPS/AES resolution vs top-1 correctness cross-tabulation");
console.log("=".repeat(100));

const bothResolved = results.filter((r) => r.epsResolved && r.aesResolved);
const epsOnlyUnresolved = results.filter((r) => !r.epsResolved && r.aesResolved);
const aesOnlyUnresolved = results.filter((r) => r.epsResolved && !r.aesResolved);
const neitherResolved = results.filter((r) => !r.epsResolved && !r.aesResolved);

function accuracyStr(arr: ArchetypeSimResult[]): string {
  const c = arr.filter((r) => r.correct).length;
  return `${c}/${arr.length} (${arr.length > 0 ? (100 * c / arr.length).toFixed(1) : "N/A"}%)`;
}

console.log(`\n  Both EPS+AES resolved:     ${bothResolved.length.toString().padStart(4)} archetypes, accuracy: ${accuracyStr(bothResolved)}`);
console.log(`  EPS unresolved only:       ${epsOnlyUnresolved.length.toString().padStart(4)} archetypes, accuracy: ${accuracyStr(epsOnlyUnresolved)}`);
console.log(`  AES unresolved only:       ${aesOnlyUnresolved.length.toString().padStart(4)} archetypes, accuracy: ${accuracyStr(aesOnlyUnresolved)}`);
console.log(`  Neither EPS nor AES resol: ${neitherResolved.length.toString().padStart(4)} archetypes, accuracy: ${accuracyStr(neitherResolved)}`);

// ---------------------------------------------------------------------------
// OUTPUT SECTION 7: Most common confusers (which archetypes are guessed most)
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 7: Most common false-positive archetypes (guessed when wrong)");
console.log("=".repeat(100));

const falsePositiveCounts = new Map<string, number>();
for (const r of misidentified) {
  falsePositiveCounts.set(r.top1Id, (falsePositiveCounts.get(r.top1Id) ?? 0) + 1);
}

const sortedFP = [...falsePositiveCounts.entries()].sort((a, b) => b[1] - a[1]);
console.log(`\n  ${"Archetype".padEnd(50)} Count  Victims`);
console.log("  " + "-".repeat(100));
for (const [id, count] of sortedFP.slice(0, 20)) {
  const arch = ARCH_BY_ID.get(id);
  const victims = misidentified
    .filter((r) => r.top1Id === id)
    .map((r) => r.trueId)
    .join(", ");
  console.log(`  ${id} "${arch?.name ?? "?"}"`.padEnd(50) + ` ${String(count).padStart(5)}  ${victims}`);
}

console.log("\n" + "=".repeat(100));
console.log("DONE");
console.log("=".repeat(100));
