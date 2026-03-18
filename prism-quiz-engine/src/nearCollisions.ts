/**
 * Diagnostic: find archetype pairs that differ on very few questions.
 */
import { ARCHETYPES } from "./config/archetypes.js";
import { REPRESENTATIVE_QUESTIONS } from "./config/questions.representative.js";
import { FULL_QUESTIONS } from "./config/questions.full.js";
import type { Archetype, QuestionDef, NodeId } from "./types.js";

const REP_BY_ID = new Map(REPRESENTATIVE_QUESTIONS.map((q) => [q.id, q]));
const QUESTION_BANK: QuestionDef[] = FULL_QUESTIONS.map((fq) => {
  const rq = REP_BY_ID.get(fq.id);
  if (!rq) return fq;
  return { ...fq, ...(rq.optionEvidence !== undefined ? { optionEvidence: rq.optionEvidence } : {}),
    ...(rq.sliderMap !== undefined ? { sliderMap: rq.sliderMap } : {}),
    ...(rq.allocationMap !== undefined ? { allocationMap: rq.allocationMap } : {}),
    ...(rq.rankingMap !== undefined ? { rankingMap: rq.rankingMap } : {}),
    ...(rq.pairMaps !== undefined ? { pairMaps: rq.pairMaps } : {}),
    ...(rq.bestWorstMap !== undefined ? { bestWorstMap: rq.bestWorstMap } : {})
  };
});

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
      score += (signal as number) * (template.pos - 3);
    }
  }
  return score;
}

function answerForQuestion(archetype: Archetype, q: QuestionDef): string {
  switch (q.uiType) {
    case "single_choice": {
      if (!q.optionEvidence) return "?";
      const keys = Object.keys(q.optionEvidence);
      const scores = keys.map(k => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
      let best = 0;
      for (let i = 1; i < scores.length; i++) if (scores[i]! > scores[best]!) best = i;
      return keys[best]!;
    }
    case "slider": {
      if (!q.sliderMap) return "?";
      const keys = Object.keys(q.sliderMap);
      const scores = keys.map(k => scoreOptionForArchetype(archetype, q.sliderMap![k]));
      let best = 0;
      for (let i = 1; i < scores.length; i++) if (scores[i]! > scores[best]!) best = i;
      return keys[best]!;
    }
    case "allocation": {
      if (!q.allocationMap) return "?";
      const keys = Object.keys(q.allocationMap);
      const scores = keys.map(k => scoreAllocationBucket(archetype, q.allocationMap![k]));
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
      return indexed.map(x => x.k).join(">");
    }
    case "ranking": {
      if (!q.rankingMap) return "?";
      const keys = Object.keys(q.rankingMap);
      const scores = keys.map(k => scoreAllocationBucket(archetype, q.rankingMap![k]));
      const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
      indexed.sort((a, b) => b.s - a.s);
      return indexed.map(x => x.k).join(">");
    }
    default: return "?";
  }
}

// Compute pairwise question differences
const pairs: { diff: number; a: string; b: string; diffQs: number[] }[] = [];
for (let i = 0; i < ARCHETYPES.length; i++) {
  for (let j = i + 1; j < ARCHETYPES.length; j++) {
    let diffs = 0;
    const diffQs: number[] = [];
    for (const q of QUESTION_BANK) {
      const ai = answerForQuestion(ARCHETYPES[i]!, q);
      const aj = answerForQuestion(ARCHETYPES[j]!, q);
      if (ai !== aj) {
        diffs++;
        diffQs.push(q.id);
      }
    }
    if (diffs <= 10) {
      pairs.push({
        diff: diffs,
        a: `${ARCHETYPES[i]!.id} ${ARCHETYPES[i]!.name}`,
        b: `${ARCHETYPES[j]!.id} ${ARCHETYPES[j]!.name}`,
        diffQs
      });
    }
  }
}

pairs.sort((a, b) => a.diff - b.diff);

console.log(`Pairs differing on <= 10 questions: ${pairs.length}`);
for (const p of pairs.slice(0, 30)) {
  console.log(`  ${p.diff} diffs: ${p.a} vs ${p.b} [Qs: ${p.diffQs.join(",")}]`);
}

// Histogram
const hist = new Map<number, number>();
for (const p of pairs) {
  hist.set(p.diff, (hist.get(p.diff) ?? 0) + 1);
}
console.log("\nHistogram:");
for (const [d, c] of [...hist.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  ${d} diffs: ${c} pairs`);
}
