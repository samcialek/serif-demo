/**
 * Diagnostic: compute answer fingerprints for all archetypes.
 * Archetypes with identical fingerprints on all 63 questions
 * can NEVER be distinguished by the engine.
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

function fingerprint(archetype: Archetype, questions: QuestionDef[]): string {
  const parts: string[] = [];
  for (const q of questions) {
    switch (q.uiType) {
      case "single_choice": {
        if (!q.optionEvidence) { parts.push("?"); break; }
        const keys = Object.keys(q.optionEvidence);
        const scores = keys.map(k => scoreOptionForArchetype(archetype, q.optionEvidence![k]));
        let best = 0;
        for (let i = 1; i < scores.length; i++) if (scores[i]! > scores[best]!) best = i;
        parts.push(keys[best]!);
        break;
      }
      case "slider": {
        if (!q.sliderMap) { parts.push("?"); break; }
        const keys = Object.keys(q.sliderMap);
        const scores = keys.map(k => scoreOptionForArchetype(archetype, q.sliderMap![k]));
        let best = 0;
        for (let i = 1; i < scores.length; i++) if (scores[i]! > scores[best]!) best = i;
        parts.push(keys[best]!);
        break;
      }
      case "allocation": {
        if (!q.allocationMap) { parts.push("?"); break; }
        const keys = Object.keys(q.allocationMap);
        const scores = keys.map(k => scoreAllocationBucket(archetype, q.allocationMap![k]));
        // ranking of scores
        const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
        indexed.sort((a, b) => b.s - a.s);
        parts.push(indexed.map(x => x.k).join(">"));
        break;
      }
      case "ranking": {
        if (!q.rankingMap) { parts.push("?"); break; }
        const keys = Object.keys(q.rankingMap);
        const scores = keys.map(k => scoreAllocationBucket(archetype, q.rankingMap![k]));
        const indexed = keys.map((k, i) => ({ k, s: scores[i]! }));
        indexed.sort((a, b) => b.s - a.s);
        parts.push(indexed.map(x => x.k).join(">"));
        break;
      }
      default:
        parts.push("?");
    }
  }
  return parts.join("|");
}

// Main
const fps = new Map<string, string[]>();
for (const a of ARCHETYPES) {
  const fp = fingerprint(a, QUESTION_BANK);
  if (!fps.has(fp)) fps.set(fp, []);
  fps.get(fp)!.push(`${a.id} ${a.name}`);
}

const unique = fps.size;
const collisions = [...fps.values()].filter(v => v.length > 1);
console.log(`Unique answer fingerprints: ${unique} / ${ARCHETYPES.length}`);
console.log(`Collision groups (same answers on all ${QUESTION_BANK.length} questions): ${collisions.length}`);
for (const group of collisions) {
  console.log(`  COLLISION (${group.length}): ${group.join(", ")}`);
}

// Also count per-question discrimination
let discriminating = 0;
for (const q of QUESTION_BANK) {
  const answers = new Set<string>();
  for (const a of ARCHETYPES) {
    const fp = fingerprint(a, [q]);
    answers.add(fp);
  }
  if (answers.size > 1) discriminating++;
}
console.log(`\nDiscriminating questions: ${discriminating} / ${QUESTION_BANK.length}`);

// Show how many distinct answers each question produces
console.log(`\nQuestion discrimination power:`);
const qDisc: { id: number; distinct: number }[] = [];
for (const q of QUESTION_BANK) {
  const answers = new Map<string, number>();
  for (const a of ARCHETYPES) {
    const fp = fingerprint(a, [q]);
    answers.set(fp, (answers.get(fp) ?? 0) + 1);
  }
  qDisc.push({ id: q.id, distinct: answers.size });
}
qDisc.sort((a, b) => b.distinct - a.distinct);
for (const { id, distinct } of qDisc.slice(0, 10)) {
  console.log(`  Q${id}: ${distinct} distinct answers`);
}
for (const { id, distinct } of qDisc.slice(-5)) {
  console.log(`  Q${id}: ${distinct} distinct answers (LOW)`);
}
