import { ARCHETYPES } from "./config/archetypes.js";
import { REPRESENTATIVE_QUESTIONS } from "./config/questions.representative.js";
import { FULL_QUESTIONS } from "./config/questions.full.js";
import { FIXED_12 } from "./engine/config.js";
import { createInitialState } from "./state/initialState.js";
import type { Archetype, QuestionDef, RespondentState } from "./types.js";
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
// Build question bank (same merge logic as index.ts)
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
// Viable candidates (same as index.ts)
// ---------------------------------------------------------------------------

function viableCandidates(state: RespondentState, archetypes: Archetype[]) {
  return viableArchetypes(state, archetypes);
}

// ---------------------------------------------------------------------------
// Simulated answer type
// ---------------------------------------------------------------------------

type SimulatedAnswer =
  | { type: "single_choice"; value: string }
  | { type: "slider"; value: number }
  | { type: "allocation"; value: Record<string, number> }
  | { type: "ranking"; value: string[] }
  | { type: "pairwise"; value: Record<string, string> }
  | { type: "best_worst"; value: string[] }
  | { type: "multi"; value: string[] };

// ---------------------------------------------------------------------------
// 5 RESPONDENT PROFILES — one per archetype
// ---------------------------------------------------------------------------

// Profile 1: "Rationalist Technocrat" — evidence-driven, technocratic, low identity
const PROFILE_RATIONALIST: Record<number, SimulatedAnswer> = {
  1:  { type: "single_choice", value: "every_day" },
  2:  { type: "slider", value: 82 },
  3:  { type: "slider", value: 35 },
  4:  { type: "slider", value: 75 },
  5:  { type: "multi", value: ["civic_duty", "intellectual_challenge"] },
  6:  { type: "single_choice", value: "due_process_priority" },
  7:  { type: "single_choice", value: "principle_first" },
  8:  { type: "slider", value: 55 },
  9:  { type: "single_choice", value: "actively_bring_up" },        // technocrat: eager to debate ideas — COM→LOW
  10: { type: "single_choice", value: "gradual_transition" },
  11: { type: "single_choice", value: "practical_tips" },
  12: { type: "slider", value: 37 },
  13: { type: "slider", value: 45 },
  14: { type: "single_choice", value: "holistic_review" },
  15: { type: "allocation", value: { effort_choices: 35, family_background: 25, discrimination_bias: 20, luck_random: 20 } },  // technocrat: more meritocratic, less structural blame
  16: { type: "single_choice", value: "rehabilitation_focus" },
  17: { type: "single_choice", value: "ratio_50_to_1" },
  18: { type: "single_choice", value: "gradual_progress" },
  19: { type: "slider", value: 65 },
  20: { type: "allocation", value: { complex_forces: 35, powerful_incompetent: 10, powerful_selfish: 15, ordinary_choices: 30, random_luck: 10 } },  // technocrat: systemic complexity + individual agency
  21: { type: "single_choice", value: "allow_no_restrictions" },   // technocrat: free marketplace of ideas — COM→LOW
  22: { type: "allocation", value: { expert_consensus: 40, personal_research: 30, lived_experience: 20, tradition: 10 } },
  23: { type: "ranking", value: ["researchers", "organized_residents", "elected_officials", "business_stakeholders", "elders_religious"] },
  24: { type: "pairwise", value: { independence_vs_elders: "independence", obedience_vs_self_reliance: "self_reliance" } },
  25: { type: "single_choice", value: "rather_free_guilty" },
  26: { type: "single_choice", value: "new_place" },
  27: { type: "single_choice", value: "rather_help_undeserving" },
  28: { type: "single_choice", value: "accept_mandate" },
  29: { type: "ranking", value: ["global_competition", "automation", "corporate_decisions", "government_policy", "worker_choices"] },
  30: { type: "single_choice", value: "allow_with_labels" },
  31: { type: "single_choice", value: "net_positive_but_uneven" },
  32: { type: "slider", value: 55 },
  33: { type: "single_choice", value: "balanced_approach" },
  34: { type: "single_choice", value: "internal_division" },
  35: { type: "slider", value: 60 },
  36: { type: "single_choice", value: "balanced_timeline" },
  37: { type: "single_choice", value: "follow_then_advocate" },
  38: { type: "slider", value: 70 },
  39: { type: "allocation", value: { legitimate_values: 50, misinformed: 20, self_interest: 20, bad_motives: 10 } },
  40: { type: "slider", value: 60 },
  41: { type: "single_choice", value: "easier_access" },
  42: { type: "single_choice", value: "keep_friendship" },
  43: { type: "single_choice", value: "safety_net_society" },
  44: { type: "slider", value: 40 },
  45: { type: "single_choice", value: "evidence_and_argument" },
  46: { type: "slider", value: 70 },
  47: { type: "single_choice", value: "stand_ground" },              // technocrat: defends position with evidence — COM→LOW
  48: { type: "single_choice", value: "gradual_improvement" },
  49: { type: "slider", value: 70 },
  50: { type: "ranking", value: ["learn_language", "follow_laws", "adopt_values", "economic_contribution", "cultural_customs"] },
  51: { type: "slider", value: 55 },
  52: { type: "single_choice", value: "civic_participation" },
  53: { type: "single_choice", value: "moderate_household" },
  54: { type: "single_choice", value: "somewhat_religious" },
  55: { type: "multi", value: ["personal_experience", "data_evidence"] },
  56: { type: "single_choice", value: "build_expert_coalitions" },
  57: { type: "single_choice", value: "occasionally_discussed" },
  58: { type: "single_choice", value: "mostly_safe" },
  59: { type: "single_choice", value: "competence_record" },
  60: { type: "ranking", value: ["ideological_identity", "national_identity", "class_identity", "global_citizen", "religious_identity", "ethnic_racial_identity"] },
  61: { type: "single_choice", value: "evidence_pitch" },
  62: { type: "single_choice", value: "measured_rally" },
  63: { type: "best_worst", value: ["fairness", "procedural_integrity"] }
};

// Profile 2: "Movement Conservative" — tradition, fighter, high TRB, low COM
const PROFILE_CONSERVATIVE: Record<number, SimulatedAnswer> = {
  1:  { type: "single_choice", value: "every_day" },
  2:  { type: "slider", value: 90 },
  3:  { type: "slider", value: 15 },
  4:  { type: "slider", value: 90 },
  5:  { type: "multi", value: ["protect_values", "fight_injustice"] },
  6:  { type: "single_choice", value: "security_priority" },
  7:  { type: "single_choice", value: "principle_first" },
  8:  { type: "slider", value: 20 },
  9:  { type: "single_choice", value: "actively_bring_up" },
  10: { type: "single_choice", value: "no_action_needed" },
  11: { type: "single_choice", value: "other_side_bad" },
  12: { type: "slider", value: 15 },
  13: { type: "slider", value: 15 },
  14: { type: "single_choice", value: "strict_merit" },
  15: { type: "allocation", value: { effort_choices: 60, family_background: 10, discrimination_bias: 10, luck_random: 20 } },
  16: { type: "single_choice", value: "punishment_focus" },
  17: { type: "single_choice", value: "market_decides" },
  18: { type: "single_choice", value: "decline" },
  19: { type: "slider", value: 85 },
  20: { type: "allocation", value: { complex_forces: 5, powerful_incompetent: 15, powerful_selfish: 50, ordinary_choices: 25, random_luck: 5 } },
  21: { type: "single_choice", value: "allow_no_restrictions" },
  22: { type: "allocation", value: { expert_consensus: 10, personal_research: 20, lived_experience: 30, tradition: 40 } },
  23: { type: "ranking", value: ["elders_religious", "elected_officials", "business_stakeholders", "organized_residents", "researchers"] },
  24: { type: "pairwise", value: { independence_vs_elders: "respect_for_elders", obedience_vs_self_reliance: "obedience" } },
  25: { type: "single_choice", value: "rather_convict_innocent" },
  26: { type: "single_choice", value: "familiar_place" },
  27: { type: "single_choice", value: "rather_miss_needy" },
  28: { type: "single_choice", value: "resist_mandate" },
  29: { type: "ranking", value: ["government_policy", "global_competition", "worker_choices", "corporate_decisions", "automation"] },
  30: { type: "single_choice", value: "allow_fully" },
  31: { type: "single_choice", value: "mostly_harmful" },
  32: { type: "slider", value: 20 },
  33: { type: "single_choice", value: "strict_enforcement" },
  34: { type: "single_choice", value: "external_threats" },
  35: { type: "slider", value: 20 },
  36: { type: "single_choice", value: "prioritize_speed" },
  37: { type: "single_choice", value: "openly_challenge" },
  38: { type: "slider", value: 30 },
  39: { type: "allocation", value: { legitimate_values: 5, misinformed: 25, self_interest: 30, bad_motives: 40 } },
  40: { type: "slider", value: 90 },
  41: { type: "single_choice", value: "tighter_security" },
  42: { type: "single_choice", value: "end_friendship" },
  43: { type: "single_choice", value: "free_market_society" },
  44: { type: "slider", value: 10 },
  45: { type: "single_choice", value: "power_struggles" },
  46: { type: "slider", value: 30 },
  47: { type: "single_choice", value: "stand_ground" },
  48: { type: "single_choice", value: "decline" },
  49: { type: "slider", value: 85 },
  50: { type: "ranking", value: ["adopt_values", "cultural_customs", "learn_language", "follow_laws", "economic_contribution"] },
  51: { type: "slider", value: 90 },
  52: { type: "single_choice", value: "cultural_heritage" },
  53: { type: "single_choice", value: "very_conservative" },
  54: { type: "single_choice", value: "very_religious" },
  55: { type: "multi", value: ["religious_moral", "personal_experience"] },
  56: { type: "single_choice", value: "fight_to_win" },
  57: { type: "single_choice", value: "very_engaged" },
  58: { type: "single_choice", value: "somewhat_unsafe" },
  59: { type: "single_choice", value: "fights_for_us" },
  60: { type: "ranking", value: ["national_identity", "religious_identity", "ideological_identity", "ethnic_racial_identity", "class_identity", "global_citizen"] },
  61: { type: "single_choice", value: "fight_pitch" },
  62: { type: "single_choice", value: "fiery_rally" },
  63: { type: "best_worst", value: ["national_strength", "tradition_continuity"] }
};

// Profile 3: "Win-Win Centrist" — high COM(5/sal3), statesman AES(sal2), institutional H(sal2), low ZS(1/sal2)
// Key differentiators vs rationalist_technocrat: COM 5 vs 4, AES statesman vs technocrat,
// H institutional vs meritocratic, ZS 1 vs 2. Must NOT push EPS→empiricist (shared with technocrat).
// Early fixed12 answers must create enough separation to prevent premature stop rule.
const PROFILE_CENTRIST: Record<number, SimulatedAnswer> = {
  1:  { type: "single_choice", value: "most_days" },                   // ENG moderate (vs technocrat every_day)
  2:  { type: "slider", value: 30 },                                   // lower political identity salience
  3:  { type: "slider", value: 55 },                                   // CD→slightly left (centrist)
  4:  { type: "slider", value: 30 },                                   // CU sal→low (centrist is less culture-war)
  5:  { type: "multi", value: ["civic_duty", "help_community"] },
  6:  { type: "single_choice", value: "due_process_priority" },         // H→egalitarian (closer to institutional)
  7:  { type: "single_choice", value: "depends_on_issue" },             // COM→middle (centrist is flexible, not rigid)
  8:  { type: "slider", value: 65 },
  9:  { type: "single_choice", value: "avoid_entirely" },               // COM→pos 4-5, ENG→low
  10: { type: "single_choice", value: "gradual_transition" },
  11: { type: "single_choice", value: "practical_tips" },               // EPS→institutionalist (matches centrist!), AES→technocrat (minor cost)
  12: { type: "slider", value: 40 },
  13: { type: "slider", value: 50 },
  14: { type: "single_choice", value: "holistic_review" },
  15: { type: "allocation", value: { effort_choices: 20, family_background: 30, discrimination_bias: 35, luck_random: 15 } },
  16: { type: "single_choice", value: "balanced_approach" },            // H→institutional
  17: { type: "single_choice", value: "ratio_50_to_1" },
  18: { type: "single_choice", value: "steady_improvement" },
  19: { type: "slider", value: 40 },
  20: { type: "allocation", value: { complex_forces: 40, powerful_incompetent: 15, powerful_selfish: 15, ordinary_choices: 20, random_luck: 10 } },
  21: { type: "single_choice", value: "allow_with_counterspeech" },
  22: { type: "allocation", value: { expert_consensus: 15, personal_research: 20, lived_experience: 30, tradition: 35 } },  // EPS→traditionalist/institutionalist
  23: { type: "ranking", value: ["elected_officials", "organized_residents", "researchers", "business_stakeholders", "elders_religious"] },
  24: { type: "pairwise", value: { independence_vs_elders: "independence", obedience_vs_self_reliance: "self_reliance" } },
  25: { type: "single_choice", value: "balance_both_errors" },          // H→institutional
  26: { type: "single_choice", value: "mix_both" },
  27: { type: "single_choice", value: "rather_help_undeserving" },       // COM→high
  28: { type: "single_choice", value: "accept_mandate" },               // H→institutional
  29: { type: "ranking", value: ["government_policy", "global_competition", "corporate_decisions", "automation", "worker_choices"] },
  30: { type: "single_choice", value: "allow_with_labels" },
  31: { type: "single_choice", value: "net_positive_clear" },           // ONT_S→positive
  32: { type: "slider", value: 65 },
  33: { type: "single_choice", value: "generous_policy" },
  34: { type: "single_choice", value: "both_equally" },
  35: { type: "slider", value: 75 },                                    // COM trust→high
  36: { type: "single_choice", value: "prioritize_safety" },
  37: { type: "single_choice", value: "follow_then_advocate" },          // COM→high
  38: { type: "slider", value: 80 },                                    // MOR→higher
  39: { type: "allocation", value: { legitimate_values: 65, misinformed: 15, self_interest: 15, bad_motives: 5 } },  // COM→very high
  40: { type: "slider", value: 15 },                                    // TRB sal→very low (centrist doesn't do tribalism)
  41: { type: "single_choice", value: "easier_access" },
  42: { type: "single_choice", value: "no_big_deal" },                  // TRB→low
  43: { type: "single_choice", value: "safety_net_society" },
  44: { type: "slider", value: 50 },
  45: { type: "single_choice", value: "economic_interests" },            // AES→statesman
  46: { type: "slider", value: 85 },                                    // COM→very high
  47: { type: "single_choice", value: "avoid_if_possible" },             // COM→pos 4-5
  48: { type: "single_choice", value: "continuous_improvement" },
  49: { type: "slider", value: 35 },
  50: { type: "ranking", value: ["follow_laws", "learn_language", "economic_contribution", "adopt_values", "cultural_customs"] },
  51: { type: "slider", value: 15 },                                    // ZS→very low (positive sum)
  52: { type: "single_choice", value: "civic_participation" },
  53: { type: "single_choice", value: "moderate_household" },
  54: { type: "single_choice", value: "somewhat_religious" },
  55: { type: "multi", value: ["trusted_authority", "personal_experience"] },  // EPS→institutionalist
  56: { type: "single_choice", value: "build_expert_coalitions" },       // AES→statesman
  57: { type: "single_choice", value: "occasionally_discussed" },
  58: { type: "single_choice", value: "very_safe" },
  59: { type: "single_choice", value: "unifying_vision" },              // AES→visionary, H→egalitarian
  60: { type: "ranking", value: ["national_identity", "ideological_identity", "global_citizen", "class_identity", "religious_identity", "ethnic_racial_identity"] },
  61: { type: "single_choice", value: "unity_pitch" },                  // AES→statesman
  62: { type: "single_choice", value: "measured_rally" },               // AES→statesman
  63: { type: "best_worst", value: ["community_bonds", "fairness"] }
};

// Profile 4: "Identity-Rooted Progressive" — high CD(5), high TRB, authentic, identity-focused
const PROFILE_PROGRESSIVE: Record<number, SimulatedAnswer> = {
  1:  { type: "single_choice", value: "every_day" },
  2:  { type: "slider", value: 95 },
  3:  { type: "slider", value: 85 },
  4:  { type: "slider", value: 90 },
  5:  { type: "multi", value: ["fight_injustice", "protect_values"] },
  6:  { type: "single_choice", value: "due_process_priority" },
  7:  { type: "single_choice", value: "principle_first" },
  8:  { type: "slider", value: 80 },
  9:  { type: "single_choice", value: "actively_bring_up" },
  10: { type: "single_choice", value: "aggressive_transition" },
  11: { type: "single_choice", value: "weird_science" },
  12: { type: "slider", value: 35 },
  13: { type: "slider", value: 75 },
  14: { type: "single_choice", value: "affirmative_action" },
  15: { type: "allocation", value: { effort_choices: 5, family_background: 30, discrimination_bias: 55, luck_random: 10 } },
  16: { type: "single_choice", value: "rehabilitation_focus" },
  17: { type: "single_choice", value: "ratio_10_to_1" },
  18: { type: "single_choice", value: "gradual_progress" },
  19: { type: "slider", value: 60 },
  20: { type: "allocation", value: { complex_forces: 15, powerful_incompetent: 10, powerful_selfish: 55, ordinary_choices: 10, random_luck: 10 } },
  21: { type: "single_choice", value: "restricted" },
  22: { type: "allocation", value: { expert_consensus: 30, personal_research: 15, lived_experience: 45, tradition: 10 } },
  23: { type: "ranking", value: ["organized_residents", "researchers", "elected_officials", "business_stakeholders", "elders_religious"] },
  24: { type: "pairwise", value: { independence_vs_elders: "independence", obedience_vs_self_reliance: "self_reliance" } },
  25: { type: "single_choice", value: "rather_free_guilty" },
  26: { type: "single_choice", value: "new_place" },
  27: { type: "single_choice", value: "rather_help_undeserving" },
  28: { type: "single_choice", value: "accept_mandate" },
  29: { type: "ranking", value: ["corporate_decisions", "global_competition", "government_policy", "automation", "worker_choices"] },
  30: { type: "single_choice", value: "remove_immediately" },
  31: { type: "single_choice", value: "mixed_effects" },
  32: { type: "slider", value: 50 },
  33: { type: "single_choice", value: "open_borders" },
  34: { type: "single_choice", value: "internal_division" },
  35: { type: "slider", value: 40 },
  36: { type: "single_choice", value: "prioritize_safety" },
  37: { type: "single_choice", value: "openly_challenge" },
  38: { type: "slider", value: 50 },
  39: { type: "allocation", value: { legitimate_values: 30, misinformed: 35, self_interest: 25, bad_motives: 10 } },
  40: { type: "slider", value: 85 },
  41: { type: "single_choice", value: "easier_access" },
  42: { type: "single_choice", value: "distance_somewhat" },
  43: { type: "single_choice", value: "equal_society" },
  44: { type: "slider", value: 60 },
  45: { type: "single_choice", value: "moral_movements" },
  46: { type: "slider", value: 50 },
  47: { type: "single_choice", value: "stand_ground" },
  48: { type: "single_choice", value: "stagnation" },
  49: { type: "slider", value: 55 },
  50: { type: "ranking", value: ["follow_laws", "learn_language", "economic_contribution", "adopt_values", "cultural_customs"] },
  51: { type: "slider", value: 25 },
  52: { type: "single_choice", value: "civic_participation" },
  53: { type: "single_choice", value: "very_progressive" },
  54: { type: "single_choice", value: "not_religious" },
  55: { type: "multi", value: ["personal_experience", "data_evidence"] },
  56: { type: "single_choice", value: "paint_vision" },
  57: { type: "single_choice", value: "very_engaged" },
  58: { type: "single_choice", value: "somewhat_unsafe" },
  59: { type: "single_choice", value: "moral_character" },
  60: { type: "ranking", value: ["ideological_identity", "ethnic_racial_identity", "class_identity", "global_citizen", "national_identity", "religious_identity"] },
  61: { type: "single_choice", value: "values_pitch" },
  62: { type: "single_choice", value: "grassroots_community" },
  63: { type: "best_worst", value: ["fairness", "community_bonds"] }
};

// Profile 5: "Anti-Politics" — disengaged, low salience on everything, ENG=1, moderate positions
// Key: anti_politics archetype has sal=0 on nearly all nodes, ENG=1, COM=3/sal1, PRO=3/sal1
// Answers should push low engagement, low salience, middle-of-road positions, and NOT
// accidentally push toward empiricist/technocrat signals.
const PROFILE_APOLITICAL: Record<number, SimulatedAnswer> = {
  1:  { type: "single_choice", value: "never" },                       // ENG→pos 1 (key signal!)
  2:  { type: "slider", value: 10 },                                   // ENG sal→very low
  3:  { type: "slider", value: 50 },                                   // CD→middle
  4:  { type: "slider", value: 10 },                                   // sal→very low (don't care)
  5:  { type: "multi", value: ["self_interest", "civic_duty"] },        // ENG→low motivation
  6:  { type: "single_choice", value: "balanced_security" },
  7:  { type: "single_choice", value: "depends_on_issue" },             // COM→middle (not principled or coalition)
  8:  { type: "slider", value: 50 },                                   // MOR→middle
  9:  { type: "single_choice", value: "avoid_entirely" },               // ENG→very low, COM→high (avoids)
  10: { type: "single_choice", value: "market_led" },
  11: { type: "single_choice", value: "practical_tips" },               // AES→technocrat (weak signal)
  12: { type: "slider", value: 50 },                                   // middle
  13: { type: "slider", value: 50 },                                   // MAT→middle
  14: { type: "single_choice", value: "lottery" },                      // EPS→autonomous (anti-politics!)
  15: { type: "allocation", value: { effort_choices: 25, family_background: 25, discrimination_bias: 25, luck_random: 25 } },  // flat = disengaged
  16: { type: "single_choice", value: "balanced_approach" },
  17: { type: "single_choice", value: "ratio_200_to_1" },
  18: { type: "single_choice", value: "cyclical" },                     // ONT_H→low optimism (apathy)
  19: { type: "slider", value: 15 },                                   // ONT_H sal→very low
  20: { type: "allocation", value: { complex_forces: 30, powerful_incompetent: 20, powerful_selfish: 15, ordinary_choices: 20, random_luck: 15 } },
  21: { type: "single_choice", value: "allow_no_restrictions" },        // EPS→autonomous
  22: { type: "allocation", value: { expert_consensus: 15, personal_research: 30, lived_experience: 30, tradition: 25 } },  // EPS→autonomous/intuitionist (NOT empiricist)
  23: { type: "ranking", value: ["elected_officials", "researchers", "organized_residents", "business_stakeholders", "elders_religious"] },
  24: { type: "pairwise", value: { independence_vs_elders: "independence", obedience_vs_self_reliance: "self_reliance" } },
  25: { type: "single_choice", value: "balance_both_errors" },
  26: { type: "single_choice", value: "familiar_place" },
  27: { type: "single_choice", value: "balanced_errors" },
  28: { type: "single_choice", value: "comply_reluctantly" },           // H→not institutional (reluctant)
  29: { type: "ranking", value: ["automation", "global_competition", "government_policy", "corporate_decisions", "worker_choices"] },
  30: { type: "single_choice", value: "allow_fully" },                  // EPS→autonomous
  31: { type: "single_choice", value: "mixed_effects" },                // ZS→middle (indifferent)
  32: { type: "slider", value: 50 },                                   // middle
  33: { type: "single_choice", value: "balanced_approach" },
  34: { type: "single_choice", value: "both_equally" },
  35: { type: "slider", value: 50 },                                   // middle
  36: { type: "single_choice", value: "balanced_timeline" },
  37: { type: "single_choice", value: "ignore_quietly" },               // COM→middle, ENG→low
  38: { type: "slider", value: 35 },                                   // MOR sal→low
  39: { type: "allocation", value: { legitimate_values: 30, misinformed: 30, self_interest: 25, bad_motives: 15 } },
  40: { type: "slider", value: 10 },                                   // TRB sal→very low (doesn't care)
  41: { type: "single_choice", value: "balanced_approach" },
  42: { type: "single_choice", value: "no_big_deal" },                  // TRB→low
  43: { type: "single_choice", value: "opportunity_society" },
  44: { type: "slider", value: 25 },                                   // PF→low (no factional identity)
  45: { type: "single_choice", value: "economic_interests" },
  46: { type: "slider", value: 30 },                                   // COM sal→low
  47: { type: "single_choice", value: "avoid_if_possible" },            // COM→high, but centrist val
  48: { type: "single_choice", value: "stagnation" },                   // ONT_S→pessimistic
  49: { type: "slider", value: 20 },                                   // ONT_S sal→low
  50: { type: "ranking", value: ["follow_laws", "economic_contribution", "learn_language", "adopt_values", "cultural_customs"] },
  51: { type: "slider", value: 30 },
  52: { type: "single_choice", value: "civic_participation" },
  53: { type: "single_choice", value: "not_political" },                // background→disengaged
  54: { type: "single_choice", value: "not_religious" },
  55: { type: "multi", value: ["never_changed", "personal_experience"] },  // EPS→autonomous
  56: { type: "single_choice", value: "paint_vision" },                 // AES→visionary (NOT technocrat)
  57: { type: "single_choice", value: "never_discussed" },              // ENG→very low
  58: { type: "single_choice", value: "very_safe" },
  59: { type: "single_choice", value: "moral_character" },              // AES→pastoral (NOT technocrat), EPS→intuitionist
  60: { type: "ranking", value: ["national_identity", "global_citizen", "class_identity", "ideological_identity", "religious_identity", "ethnic_racial_identity"] },
  61: { type: "single_choice", value: "values_pitch" },                 // AES→pastoral (NOT technocrat)
  62: { type: "single_choice", value: "grassroots_community" },         // AES→pastoral (NOT technocrat)
  63: { type: "best_worst", value: ["individual_freedom", "procedural_integrity"] }
};

// ---------------------------------------------------------------------------
// Apply simulated answer
// ---------------------------------------------------------------------------

function applySimulatedAnswer(
  state: RespondentState,
  q: QuestionDef,
  answers: Record<number, SimulatedAnswer>
): void {
  const sim = answers[q.id];
  if (!sim) {
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
      applyRankingAnswer(state, q, sim.value);
      break;
    case "multi":
      for (const v of sim.value) applySingleChoiceAnswer(state, q, v);
      state.answers[q.id] = sim.value;
      break;
  }
}

// ---------------------------------------------------------------------------
// Run one full simulation
// ---------------------------------------------------------------------------

interface RunResult {
  label: string;
  totalAnswered: number;
  stopped: boolean;
  topArchetype: string;
  topPosterior: number;
  secondArchetype: string;
  secondPosterior: number;
  margin: number;
  unknownNodes: number;
  unresolvedNodes: number;
  resolvedNodes: number;
  deadNodes: number;
  questionsAsked: number[];
  posteriorHistory: { qCount: number; top: string; topP: number }[];
}

function runSimulation(
  label: string,
  answers: Record<number, SimulatedAnswer>
): RunResult {
  const state = createInitialState();
  const questionsAsked: number[] = [];
  const posteriorHistory: RunResult["posteriorHistory"] = [];

  // Phase 1: Fixed 12
  for (const qid of FIXED_12) {
    const q = BANK_BY_ID.get(qid);
    if (!q) continue;
    applySimulatedAnswer(state, q, answers);
    questionsAsked.push(qid);
  }
  recomputeArchetypePosterior(state, ARCHETYPES);
  updateNodeStatuses(state, viableCandidates(state, ARCHETYPES));

  const topAfterFixed = Object.entries(state.archetypePosterior)
    .sort((a, b) => b[1] - a[1]);
  posteriorHistory.push({
    qCount: Object.keys(state.answers).length,
    top: topAfterFixed[0]?.[0] ?? "?",
    topP: topAfterFixed[0]?.[1] ?? 0
  });

  // Phase 2+: Adaptive
  const MAX_QUESTIONS = 63;
  while (Object.keys(state.answers).length < MAX_QUESTIONS) {
    const next = selectNextQuestion(state, QUESTION_BANK, ARCHETYPES);
    if (!next) break;

    applySimulatedAnswer(state, next, answers);
    questionsAsked.push(next.id);
    recomputeArchetypePosterior(state, ARCHETYPES);
    updateNodeStatuses(state, viableCandidates(state, ARCHETYPES));

    const nAnswered = Object.keys(state.answers).length;
    if (nAnswered % 5 === 0 || shouldStop(state)) {
      const sorted = Object.entries(state.archetypePosterior)
        .sort((a, b) => b[1] - a[1]);
      posteriorHistory.push({
        qCount: nAnswered,
        top: sorted[0]?.[0] ?? "?",
        topP: sorted[0]?.[1] ?? 0
      });
    }

    if (shouldStop(state)) break;
  }

  // Final state
  const sorted = Object.entries(state.archetypePosterior)
    .sort((a, b) => b[1] - a[1]);
  const statuses = [
    ...Object.values(state.continuous).map((n) => n.status),
    ...Object.values(state.categorical).map((n) => n.status)
  ];

  return {
    label,
    totalAnswered: Object.keys(state.answers).length,
    stopped: shouldStop(state),
    topArchetype: sorted[0]?.[0] ?? "?",
    topPosterior: sorted[0]?.[1] ?? 0,
    secondArchetype: sorted[1]?.[0] ?? "?",
    secondPosterior: sorted[1]?.[1] ?? 0,
    margin: (sorted[0]?.[1] ?? 0) - (sorted[1]?.[1] ?? 0),
    unknownNodes: statuses.filter((s) => s === "unknown").length,
    unresolvedNodes: statuses.filter((s) => s === "live_unresolved").length,
    resolvedNodes: statuses.filter((s) => s === "live_resolved").length,
    deadNodes: statuses.filter((s) => s === "dead").length,
    questionsAsked,
    posteriorHistory
  };
}

// ---------------------------------------------------------------------------
// Run all profiles
// ---------------------------------------------------------------------------

const profiles: [string, string, Record<number, SimulatedAnswer>][] = [
  ["rationalist_technocrat", "Rationalist Technocrat", PROFILE_RATIONALIST],
  ["movement_conservative", "Movement Conservative", PROFILE_CONSERVATIVE],
  ["win_win_centrist", "Win-Win Centrist", PROFILE_CENTRIST],
  ["identity_rooted_progressive", "Identity Progressive", PROFILE_PROGRESSIVE],
  ["anti_politics", "Anti-Politics", PROFILE_APOLITICAL]
];

console.log("=".repeat(80));
console.log("MULTI-PROFILE DIAGNOSTIC");
console.log("=".repeat(80));
console.log();

const results: RunResult[] = [];

for (const [targetId, label, answers] of profiles) {
  const result = runSimulation(label, answers);
  results.push(result);

  const matched = result.topArchetype === targetId;
  console.log(`${"─".repeat(80)}`);
  console.log(`PROFILE: ${label} (target: ${targetId})`);
  console.log(`${"─".repeat(80)}`);
  console.log(`  Result:    ${matched ? "MATCH" : "MISMATCH"} → classified as ${result.topArchetype}`);
  console.log(`  Posterior: ${(result.topPosterior * 100).toFixed(1)}% (2nd: ${result.secondArchetype} at ${(result.secondPosterior * 100).toFixed(1)}%)`);
  console.log(`  Margin:    ${(result.margin * 100).toFixed(1)}%`);
  console.log(`  Questions: ${result.totalAnswered} / 63`);
  console.log(`  Stopped:   ${result.stopped ? "YES (stop rule fired)" : "NO (exhausted)"}`);
  console.log(`  Nodes:     resolved=${result.resolvedNodes} unresolved=${result.unresolvedNodes} unknown=${result.unknownNodes} dead=${result.deadNodes}`);
  console.log(`  Convergence:`);
  for (const h of result.posteriorHistory) {
    console.log(`    Q${String(h.qCount).padStart(2)}: ${h.top} = ${(h.topP * 100).toFixed(1)}%`);
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Summary table
// ---------------------------------------------------------------------------

console.log("=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80));
console.log();

console.table(
  results.map((r, i) => ({
    profile: r.label,
    target: profiles[i]![0],
    classified: r.topArchetype,
    match: r.topArchetype === profiles[i]![0] ? "YES" : "NO",
    posterior: `${(r.topPosterior * 100).toFixed(1)}%`,
    margin: `${(r.margin * 100).toFixed(1)}%`,
    questions: r.totalAnswered,
    stopped: r.stopped ? "Y" : "N",
    resolved: r.resolvedNodes,
    unknown: r.unknownNodes
  }))
);

const matches = results.filter((r, i) => r.topArchetype === profiles[i]![0]).length;
const stopFired = results.filter((r) => r.stopped).length;
const avgQuestions = results.reduce((s, r) => s + r.totalAnswered, 0) / results.length;
const avgPosterior = results.reduce((s, r) => s + r.topPosterior, 0) / results.length;
const totalUnknown = results.reduce((s, r) => s + r.unknownNodes, 0);

console.log();
console.log(`Classification accuracy: ${matches}/${results.length} (${(matches / results.length * 100).toFixed(0)}%)`);
console.log(`Stop rule fired:         ${stopFired}/${results.length}`);
console.log(`Avg questions asked:     ${avgQuestions.toFixed(1)}`);
console.log(`Avg top posterior:       ${(avgPosterior * 100).toFixed(1)}%`);
console.log(`Total unknown nodes:     ${totalUnknown}`);
