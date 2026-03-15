import { ARCHETYPES } from "./config/archetypes.js";
import { REPRESENTATIVE_QUESTIONS } from "./config/questions.representative.js";
import { FULL_QUESTIONS } from "./config/questions.full.js";
import { FIXED_12 } from "./engine/config.js";
import { createInitialState } from "./state/initialState.js";
import type { QuestionDef, RespondentState } from "./types.js";
import {
  applyAllocationAnswer,
  applyPairwiseAnswer,
  applyRankingAnswer,
  applySingleChoiceAnswer,
  applySliderAnswer
} from "./engine/update.js";
import { recomputeArchetypePosterior, viableArchetypes } from "./engine/archetypeDistance.js";
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
// Simulated respondent — answers keyed by question id.
// Questions with evidence maps from REPRESENTATIVE_QUESTIONS get real signal;
// all other questions still register touches via their touchProfile.
// ---------------------------------------------------------------------------

type SimulatedAnswer =
  | { type: "single_choice"; value: string }
  | { type: "slider"; value: number }
  | { type: "allocation"; value: Record<string, number> }
  | { type: "ranking"; value: string[] }
  | { type: "pairwise"; value: Record<string, string> }
  | { type: "best_worst"; value: string[] }
  | { type: "multi"; value: string[] };

const SIMULATED: Record<number, SimulatedAnswer> = {
  // fixed12 — evidence-enriched questions
  1:  { type: "single_choice", value: "every_day" },
  2:  { type: "slider", value: 82 },
  11: { type: "single_choice", value: "practical_tips" },
  15: { type: "allocation", value: { effort_choices: 20, family_background: 25, discrimination_bias: 40, luck_random: 15 } },
  20: { type: "allocation", value: { complex_forces: 20, powerful_incompetent: 10, powerful_selfish: 45, ordinary_choices: 15, random_luck: 10 } },
  21: { type: "single_choice", value: "allow_with_counterspeech" },
  23: { type: "ranking", value: ["researchers", "organized_residents", "elected_officials", "business_stakeholders", "elders_religious"] },

  // fixed12 — scaffold-only (no evidence maps yet, touches still register)
  3:  { type: "slider", value: 35 },
  4:  { type: "slider", value: 75 },
  31: { type: "single_choice", value: "net_positive_but_uneven" },
  40: { type: "slider", value: 60 },
  47: { type: "single_choice", value: "avoid_if_possible" },

  // screen20 — evidence-enriched
  24: { type: "pairwise", value: { independence_vs_elders: "independence", obedience_vs_self_reliance: "self_reliance" } },
  39: { type: "allocation", value: { legitimate_values: 50, misinformed: 20, self_interest: 20, bad_motives: 10 } },
  56: { type: "single_choice", value: "build_expert_coalitions" },
  60: { type: "ranking", value: ["ideological_identity", "national_identity", "class_identity", "global_citizen", "religious_identity", "ethnic_racial_identity"] },

  // screen20 — scaffold-only
  5:  { type: "multi", value: ["civic_duty", "protect_values"] },
  7:  { type: "single_choice", value: "principle_first" },
  8:  { type: "slider", value: 55 },
  18: { type: "single_choice", value: "gradual_progress" },
  19: { type: "slider", value: 65 },
  22: { type: "allocation", value: { expert_consensus: 40, personal_research: 30, lived_experience: 20, tradition: 10 } },
  25: { type: "single_choice", value: "rather_free_guilty" },
  38: { type: "slider", value: 70 },
  42: { type: "single_choice", value: "keep_friendship" },
  48: { type: "single_choice", value: "gradual_improvement" },
  51: { type: "slider", value: 55 },
  55: { type: "multi", value: ["personal_experience", "data_evidence"] },
  59: { type: "single_choice", value: "competence_record" },
  61: { type: "single_choice", value: "evidence_pitch" },
  62: { type: "single_choice", value: "measured_rally" },
  63: { type: "best_worst", value: ["fairness", "procedural_integrity"] },

  // stage2
  9:  { type: "single_choice", value: "discuss_if_comes_up" },
  12: { type: "slider", value: 37 },
  13: { type: "slider", value: 45 },
  14: { type: "single_choice", value: "holistic_review" },
  17: { type: "single_choice", value: "ratio_50_to_1" },
  26: { type: "single_choice", value: "new_place" },
  27: { type: "single_choice", value: "rather_help_undeserving" },
  28: { type: "single_choice", value: "accept_mandate" },
  29: { type: "ranking", value: ["global_competition", "automation", "corporate_decisions", "government_policy", "worker_choices"] },
  30: { type: "single_choice", value: "allow_with_labels" },
  33: { type: "single_choice", value: "balanced_approach" },
  35: { type: "slider", value: 60 },
  36: { type: "single_choice", value: "balanced_timeline" },
  37: { type: "single_choice", value: "follow_then_advocate" },
  41: { type: "single_choice", value: "easier_access" },
  43: { type: "single_choice", value: "safety_net_society" },
  49: { type: "slider", value: 70 },
  50: { type: "ranking", value: ["learn_language", "follow_laws", "adopt_values", "economic_contribution", "cultural_customs"] },
  52: { type: "single_choice", value: "civic_participation" },

  // stage3
  6:  { type: "single_choice", value: "due_process_priority" },
  10: { type: "single_choice", value: "gradual_transition" },
  16: { type: "single_choice", value: "rehabilitation_focus" },
  32: { type: "slider", value: 55 },
  34: { type: "single_choice", value: "internal_division" },
  44: { type: "slider", value: 40 },
  45: { type: "single_choice", value: "evidence_and_argument" },
  46: { type: "slider", value: 70 },
  53: { type: "single_choice", value: "moderate_household" },
  54: { type: "single_choice", value: "somewhat_religious" },
  57: { type: "single_choice", value: "occasionally_discussed" },
  58: { type: "single_choice", value: "mostly_safe" }
};

// ---------------------------------------------------------------------------
// Apply a simulated answer to state
// ---------------------------------------------------------------------------

function applySimulatedAnswer(state: RespondentState, q: QuestionDef): void {
  const sim = SIMULATED[q.id];

  if (!sim) {
    // Fallback: record answer and register touches via single_choice path
    applySingleChoiceAnswer(state, q, "default");
    return;
  }

  switch (sim.type) {
    case "single_choice":
      applySingleChoiceAnswer(state, q, sim.value);
      break;
    case "slider":
      applySliderAnswer(state, q, sim.value);
      break;
    case "allocation":
      applyAllocationAnswer(state, q, sim.value);
      break;
    case "ranking":
      applyRankingAnswer(state, q, sim.value);
      break;
    case "pairwise":
      applyPairwiseAnswer(state, q, sim.value);
      break;
    case "best_worst":
      // best_worst reuses ranking mechanics for touch registration
      applyRankingAnswer(state, q, sim.value);
      break;
    case "multi":
      // multi-select: apply each selection as a single_choice for evidence,
      // but record the full array as the answer
      for (const v of sim.value) {
        applySingleChoiceAnswer(state, q, v);
      }
      // overwrite the scalar answer with the array
      state.answers[q.id] = sim.value;
      break;
  }
}

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function viableCandidates(state: RespondentState, archetypes: typeof ARCHETYPES) {
  return viableArchetypes(state, archetypes);
}

function topArchetypes(state: RespondentState, n = 3) {
  return Object.entries(state.archetypePosterior)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, p]) => `${id}=${(p * 100).toFixed(1)}%`)
    .join("  ");
}

function statusSummary(state: RespondentState) {
  const statuses = [
    ...Object.entries(state.continuous).map(([id, n]) => ({ id, status: n.status })),
    ...Object.entries(state.categorical).map(([id, n]) => ({ id, status: n.status }))
  ];
  const dead = statuses.filter((s) => s.status === "dead").map((s) => s.id);
  const resolved = statuses.filter((s) => s.status === "live_resolved").map((s) => s.id);
  const unresolved = statuses.filter((s) => s.status === "live_unresolved").map((s) => s.id);
  const unknown = statuses.filter((s) => s.status === "unknown").map((s) => s.id);
  return { dead, resolved, unresolved, unknown };
}

// ---------------------------------------------------------------------------
// PHASE 1: Fixed 12 (always asked in order)
// ---------------------------------------------------------------------------

const state = createInitialState();

console.log("=".repeat(72));
console.log("PHASE 1: Fixed 12");
console.log("=".repeat(72));

for (const qid of FIXED_12) {
  const q = BANK_BY_ID.get(qid);
  if (!q) continue;
  applySimulatedAnswer(state, q);
}

recomputeArchetypePosterior(state, ARCHETYPES);
updateNodeStatuses(state, viableCandidates(state, ARCHETYPES));

const answeredAfterFixed = Object.keys(state.answers).length;
console.log(`Answered: ${answeredAfterFixed}`);
console.log(`Top: ${topArchetypes(state)}`);

const s1 = statusSummary(state);
console.log(`Nodes — unknown: ${s1.unknown.length}  unresolved: ${s1.unresolved.length}  resolved: ${s1.resolved.length}  dead: ${s1.dead.length}`);
if (s1.unresolved.length) console.log(`  live_unresolved: [${s1.unresolved.join(", ")}]`);
console.log();

// ---------------------------------------------------------------------------
// PHASE 2+: Adaptive loop
// ---------------------------------------------------------------------------

console.log("=".repeat(72));
console.log("PHASE 2+: Adaptive selection");
console.log("=".repeat(72));

let round = 0;
const MAX_QUESTIONS = 63;

while (Object.keys(state.answers).length < MAX_QUESTIONS) {
  round += 1;

  const next = selectNextQuestion(state, QUESTION_BANK, ARCHETYPES);
  if (!next) {
    console.log(`[round ${round}] No eligible unanswered questions remain.`);
    break;
  }

  applySimulatedAnswer(state, next);
  recomputeArchetypePosterior(state, ARCHETYPES);
  updateNodeStatuses(state, viableCandidates(state, ARCHETYPES));

  const nAnswered = Object.keys(state.answers).length;
  const eligibleRemaining = QUESTION_BANK.filter(
    (q) => !(q.id in state.answers) && isQuestionEligible(state, q)
  ).length;

  const viableCount = viableCandidates(state, ARCHETYPES).length;

  // Log every question
  console.log(
    `[${String(nAnswered).padStart(2)}] Q${String(next.id).padStart(2)} ` +
    `${next.promptShort.padEnd(42)} ` +
    `stage=${next.stage.padEnd(8)} ` +
    `viable=${String(viableCount).padStart(3)} ` +
    `eligible_remaining=${eligibleRemaining}`
  );

  // Periodic snapshot every 10 adaptive questions
  if (round % 10 === 0) {
    const s = statusSummary(state);
    console.log(`     >> Top: ${topArchetypes(state)}`);
    console.log(`     >> Nodes — unk:${s.unknown.length} unres:${s.unresolved.length} res:${s.resolved.length} dead:${s.dead.length}`);
  }

  // Check stop rule
  if (shouldStop(state, ARCHETYPES)) {
    console.log(`\n*** STOP RULE FIRED after ${nAnswered} questions ***`);
    break;
  }
}

// ---------------------------------------------------------------------------
// Final state
// ---------------------------------------------------------------------------

console.log();
console.log("=".repeat(72));
console.log("FINAL STATE");
console.log("=".repeat(72));

const totalAnswered = Object.keys(state.answers).length;
console.log(`Total questions answered: ${totalAnswered} / ${QUESTION_BANK.length}`);
console.log(`Should stop: ${shouldStop(state, ARCHETYPES)}`);
console.log();

console.log("Archetype posteriors:");
console.table(
  Object.entries(state.archetypePosterior)
    .sort((a, b) => b[1] - a[1])
    .map(([id, p]) => ({ archetype: id, posterior: Number((p * 100).toFixed(2)) + "%" }))
);

console.log("Continuous node states:");
console.table(
  Object.entries(state.continuous).map(([id, n]) => ({
    node: id,
    status: n.status,
    touches: n.touches,
    touchTypes: n.touchTypes.size,
    sal2plus: Number((n.salDist[2] + n.salDist[3]).toFixed(3)),
    topPos: (n.posDist.indexOf(Math.max(...n.posDist)) + 1)
  }))
);

console.log("Categorical node states:");
console.table(
  Object.entries(state.categorical).map(([id, n]) => {
    const cats = id === "EPS"
      ? ["empiricist", "institutionalist", "traditionalist", "intuitionist", "autonomous", "nihilist"]
      : id === "AES"
        ? ["statesman", "technocrat", "pastoral", "authentic", "fighter", "visionary"]
        : ["egalitarian", "meritocratic", "institutional", "traditional", "paternal", "strong_order"];
    const topIdx = n.catDist.indexOf(Math.max(...n.catDist));
    return {
      node: id,
      status: n.status,
      touches: n.touches,
      touchTypes: n.touchTypes.size,
      sal2plus: Number((n.salDist[2] + n.salDist[3]).toFixed(3)),
      topCat: cats[topIdx] ?? "?"
    };
  })
);

console.log("TRB Anchor distribution:");
const anchorLabels = ["national", "ideological", "religious", "class", "ethnic_racial", "global", "mixed_none"];
console.table(
  state.trbAnchor.dist.map((p, i) => ({
    anchor: anchorLabels[i] ?? "?",
    prob: Number((p * 100).toFixed(1)) + "%"
  }))
);
