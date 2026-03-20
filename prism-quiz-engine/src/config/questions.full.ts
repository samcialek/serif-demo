import type { QuestionDef, QuestionStage, QuestionUiType, TouchTarget } from "../types.js";

const t = (
  node: TouchTarget["node"],
  kind: TouchTarget["kind"],
  role: TouchTarget["role"],
  weight: number,
  touchType: string
): TouchTarget => ({
  node,
  kind,
  role,
  weight,
  touchType
});

const q = (
  id: number,
  stage: QuestionStage,
  section: string,
  promptShort: string,
  uiType: QuestionUiType,
  quality: number,
  rewriteNeeded: boolean,
  touchProfile: TouchTarget[],
  exposeRules?: QuestionDef["exposeRules"]
): QuestionDef => ({
  id,
  stage,
  section,
  promptShort,
  uiType,
  quality,
  rewriteNeeded,
  touchProfile,
  ...(exposeRules !== undefined ? { exposeRules } : {})
});

export const FULL_QUESTIONS: QuestionDef[] = [
  // ---------------------------------------------------------------------------
  // SECTION I
  // ---------------------------------------------------------------------------
  q(
    1,
    "fixed12",
    "I",
    "political_content_frequency",
    "single_choice",
    0.92,
    false,
    [
      t("ENG", "continuous", "position", 0.85, "behavior_frequency"),
      t("ENG", "continuous", "salience", 0.60, "behavior_frequency"),
      t("PF", "continuous", "salience", 0.20, "identity_proxy")
    ],
    { goodFollowupsIfUnresolved: [5, 9] }
  ),

  q(
    2,
    "fixed12",
    "I",
    "political_identity_centrality",
    "slider",
    0.94,
    false,
    [
      t("PF", "continuous", "salience", 0.95, "direct_centrality"),
      t("TRB", "continuous", "salience", 0.25, "identity_proxy"),
      t("ENG", "continuous", "salience", 0.20, "identity_proxy")
    ],
    { goodFollowupsIfUnresolved: [40, 60] }
  ),

  q(
    3,
    "fixed12",
    "I",
    "cultural_social_placement",
    "slider",
    0.90,
    false,
    [
      t("CD", "continuous", "position", 0.90, "direct_placement"),
      t("CU", "continuous", "position", 0.30, "boundary_proxy"),
      t("MOR", "continuous", "position", 0.20, "values_proxy")
    ],
    { goodFollowupsIfUnresolved: [4, 50, 52] }
  ),

  q(
    4,
    "fixed12",
    "I",
    "cultural_social_salience",
    "slider",
    0.93,
    false,
    [
      t("CD", "continuous", "salience", 0.90, "direct_salience"),
      t("CU", "continuous", "salience", 0.45, "boundary_salience"),
      t("MOR", "continuous", "salience", 0.20, "values_salience")
    ],
    { goodFollowupsIfUnresolved: [51, 48] }
  ),

  q(
    5,
    "screen20",
    "I",
    "engagement_motivations_top2",
    "multi",
    0.86,
    false,
    [
      t("ENG", "continuous", "position", 0.55, "motive_selection"),
      t("PF", "continuous", "salience", 0.35, "motive_selection"),
      t("TRB", "continuous", "position", 0.30, "motive_selection"),
      t("PRO", "continuous", "position", 0.20, "motive_selection"),
      t("COM", "continuous", "position", 0.20, "motive_selection"),
      t("EPS", "categorical", "category", 0.20, "motive_selection")
    ],
    {
      eligibleIf: ["ENG_live_or_unresolved", "PF_live_or_unresolved", "TRB_live_or_unresolved"],
      goodFollowupsIfUnresolved: [9, 39, 60]
    }
  ),

  q(
    6,
    "stage3",
    "I",
    "surveillance_enforcement_due_process_bundle",
    "single_choice",
    0.68,
    true,
    [
      t("PRO", "continuous", "position", 0.70, "policy_bundle"),

      t("ONT_H", "continuous", "position", 0.10, "policy_bundle")
    ],
    {
      eligibleIf: ["late_consistency_check_only"],
      goodFollowupsIfUnresolved: [25, 36, 41]
    }
  ),

  q(
    7,
    "screen20",
    "I",
    "coalition_vs_principle",
    "single_choice",
    0.88,
    false,
    [
      t("COM", "continuous", "position", 0.85, "principle_tradeoff"),
      t("TRB", "continuous", "position", 0.25, "principle_tradeoff"),
      t("PRO", "continuous", "position", 0.20, "principle_tradeoff")
    ],
    {
      eligibleIf: ["COM_live_or_unresolved"],
      goodFollowupsIfUnresolved: [38, 47, 39]
    }
  ),

  q(
    8,
    "screen20",
    "I",
    "domestic_vs_abroad_lives",
    "slider",
    0.89,
    false,
    [
      t("MOR", "continuous", "position", 0.90, "moral_scope_tradeoff"),
      t("TRB", "continuous", "position", 0.25, "moral_scope_tradeoff"),
      t("ZS", "continuous", "position", 0.15, "moral_scope_tradeoff")
    ],
    {
      eligibleIf: ["MOR_live_or_unresolved"],
      goodFollowupsIfUnresolved: [43, 63]
    }
  ),

  q(
    9,
    "stage2",
    "I",
    "politics_at_social_gatherings",
    "single_choice",
    0.86,
    false,
    [
      t("ENG", "continuous", "position", 0.60, "social_behavior"),
      t("COM", "continuous", "position", 0.45, "social_behavior"),
      t("PF", "continuous", "salience", 0.15, "social_behavior")
    ],
    {
      eligibleIf: ["ENG_live_or_unresolved", "COM_live_or_unresolved"],
      goodFollowupsIfUnresolved: [5, 47]
    }
  ),

  q(
    10,
    "stage3",
    "I",
    "climate_energy_bundle",
    "single_choice",
    0.65,
    true,
    [
      t("MAT", "continuous", "position", 0.55, "policy_bundle"),
      t("ONT_S", "continuous", "position", 0.35, "policy_bundle"),
      t("PRO", "continuous", "position", 0.10, "policy_bundle")
    ],
    {
      eligibleIf: ["late_consistency_check_only"],
      goodFollowupsIfUnresolved: [29]
    }
  ),

  q(
    11,
    "fixed12",
    "I",
    "nyt_headline_click",
    "single_choice",
    0.86,
    false,
    [
      t("EPS", "categorical", "category", 0.80, "taste_proxy"),
      t("AES", "categorical", "category", 0.45, "style_proxy"),
      t("ENG", "continuous", "salience", 0.15, "attention_proxy")
    ],
    {
      goodFollowupsIfUnresolved: [22, 55, 56, 61, 62]
    }
  ),

  // ---------------------------------------------------------------------------
  // SECTION II
  // ---------------------------------------------------------------------------
  q(
    12,
    "stage2",
    "II",
    "guess_top_marginal_tax_rate",
    "slider",
    0.68,
    false,
    [
      t("EPS", "categorical", "category", 0.35, "factual_calibration"),
      t("ENG", "continuous", "position", 0.10, "policy_attention")
    ],
    {
      eligibleIf: ["EPS_live_or_unresolved"],
      goodFollowupsIfUnresolved: [22, 13]
    }
  ),

  q(
    13,
    "stage2",
    "II",
    "preferred_top_marginal_tax_rate",
    "slider",
    0.88,
    false,
    [
      t("MAT", "continuous", "position", 0.92, "policy_preference"),
      t("MAT", "continuous", "salience", 0.35, "policy_preference")
    ],
    {
      eligibleIf: ["MAT_live_or_unresolved"],
      goodFollowupsIfUnresolved: [17, 27, 43]
    }
  ),

  q(
    14,
    "stage2",
    "II",
    "university_admissions_approach",
    "single_choice",
    0.83,
    false,
    [
      t("MAT", "continuous", "position", 0.65, "fairness_design"),
      t("MOR", "continuous", "position", 0.35, "fairness_design"),
      t("PRO", "continuous", "position", 0.15, "allocation_rule")
    ],
    {
      eligibleIf: ["MAT_live_or_unresolved", "MOR_live_or_unresolved"],
      goodFollowupsIfUnresolved: [43, 63]
    }
  ),

  q(
    15,
    "fixed12",
    "II",
    "inequality_causes_allocation",
    "allocation",
    0.91,
    false,
    [
      t("MAT", "continuous", "position", 0.85, "causal_allocation"),
      t("ONT_S", "continuous", "position", 0.55, "causal_allocation"),

    ],
    {
      goodFollowupsIfUnresolved: [29, 13, 17]
    }
  ),

  q(
    16,
    "stage3",
    "II",
    "criminal_justice_bundle",
    "single_choice",
    0.65,
    true,
    [
      t("PRO", "continuous", "position", 0.60, "policy_bundle"),

      t("ONT_H", "continuous", "position", 0.10, "policy_bundle")
    ],
    {
      eligibleIf: ["late_consistency_check_only"],
      goodFollowupsIfUnresolved: [25, 27, 36]
    }
  ),

  q(
    17,
    "stage2",
    "II",
    "ceo_worker_pay_ratio",
    "single_choice",
    0.87,
    false,
    [
      t("MAT", "continuous", "position", 0.90, "fairness_threshold"),
    ],
    {
      eligibleIf: ["MAT_live_or_unresolved"],
      goodFollowupsIfUnresolved: [13, 27, 43]
    }
  ),

  q(
    18,
    "screen20",
    "II",
    "human_progress_view",
    "single_choice",
    0.88,
    false,
    [
      t("ONT_H", "continuous", "position", 0.90, "ontology_direct"),
      t("ONT_H", "continuous", "salience", 0.20, "ontology_direct"),
      t("ONT_S", "continuous", "position", 0.15, "worldview_proxy")
    ],
    {
      eligibleIf: ["ONT_H_live_or_unresolved"],
      goodFollowupsIfUnresolved: [19, 48, 49]
    }
  ),

  q(
    19,
    "screen20",
    "II",
    "human_progress_salience",
    "slider",
    0.93,
    false,
    [
      t("ONT_H", "continuous", "salience", 0.95, "direct_salience")
    ],
    {
      eligibleIf: ["ONT_H_live_or_unresolved"],
      goodFollowupsIfUnresolved: [18, 48, 49]
    }
  ),

  q(
    20,
    "fixed12",
    "II",
    "bad_outcomes_blame_allocation",
    "allocation",
    0.90,
    false,
    [
      t("ONT_S", "continuous", "position", 0.85, "causal_allocation"),
      t("ZS", "continuous", "position", 0.55, "conflict_attribution"),
      t("ONT_H", "continuous", "position", 0.25, "motive_model")
    ],
    {
      goodFollowupsIfUnresolved: [29, 31, 34, 48]
    }
  ),

  q(
    21,
    "fixed12",
    "II",
    "controversial_speaker",
    "single_choice",
    0.93,
    false,
    [
      t("PRO", "continuous", "position", 0.80, "rights_tradeoff"),
      t("COM", "continuous", "position", 0.35, "civic_balance"),
      t("EPS", "categorical", "category", 0.15, "truth_authority_proxy")
    ],
    {
      goodFollowupsIfUnresolved: [30, 38, 41]
    }
  ),

  q(
    22,
    "screen20",
    "II",
    "factual_estimates_and_confidence",
    "allocation",
    0.95,
    false,
    [
      t("EPS", "categorical", "category", 0.92, "factual_calibration"),
      t("EPS", "categorical", "salience", 0.45, "factual_calibration"),
      t("ENG", "continuous", "position", 0.10, "issue_attention")
    ],
    {
      eligibleIf: ["EPS_live_or_unresolved"],
      goodFollowupsIfUnresolved: [55, 32, 23]
    }
  ),

  // ---------------------------------------------------------------------------
  // SECTION III
  // ---------------------------------------------------------------------------
  q(
    23,
    "fixed12",
    "III",
    "who_should_shape_a_law",
    "ranking",
    0.89,
    false,
    [
      t("EPS", "categorical", "category", 0.70, "authority_ranking"),
      t("PRO", "continuous", "position", 0.25, "governance_priority")
    ],
    {
      goodFollowupsIfUnresolved: [22, 24, 59]
    }
  ),

  q(
    24,
    "screen20",
    "III",
    "child_traits",
    "pairwise",
    0.90,
    false,
    [
      t("ONT_H", "continuous", "position", 0.20, "human_nature_proxy")
    ],
    {
      eligibleIf: [],
      goodFollowupsIfUnresolved: [25, 59, 36]
    }
  ),

  q(
    25,
    "screen20",
    "III",
    "criminal_trial_error_tradeoff",
    "single_choice",
    0.92,
    false,
    [
      t("PRO", "continuous", "position", 0.75, "error_asymmetry"),
      t("ONT_H", "continuous", "position", 0.15, "human_motive_proxy")
    ],
    {
      eligibleIf: ["PRO_live_or_unresolved"],
      goodFollowupsIfUnresolved: [36, 41, 16]
    }
  ),

  q(
    26,
    "stage2",
    "III",
    "vacation_new_vs_familiar",
    "single_choice",
    0.52,
    false,
    [
      t("ONT_H", "continuous", "position", 0.25, "novelty_preference"),
      t("AES", "categorical", "category", 0.10, "taste_proxy")
    ],
    {
      eligibleIf: ["late_low_weight_only"],
      goodFollowupsIfUnresolved: [18, 48]
    }
  ),

  q(
    27,
    "stage2",
    "III",
    "welfare_error_tradeoff",
    "single_choice",
    0.89,
    false,
    [
      t("MAT", "continuous", "position", 0.70, "error_asymmetry"),
      t("PRO", "continuous", "position", 0.25, "error_asymmetry"),
      t("MOR", "continuous", "position", 0.35, "deservingness_proxy")
    ],
    {
      eligibleIf: ["MAT_live_or_unresolved", "PRO_live_or_unresolved"],
      goodFollowupsIfUnresolved: [13, 17, 43]
    }
  ),

  q(
    28,
    "stage2",
    "III",
    "mask_mandate_acceptability",
    "single_choice",
    0.76,
    false,
    [
      t("PRO", "continuous", "position", 0.55, "public_health_authority"),
      t("CU", "continuous", "position", 0.25, "collective_uniformity"),
      t("COM", "continuous", "position", 0.10, "collective_action_proxy")
    ],
    {
      eligibleIf: ["PRO_live_or_unresolved", "CU_live_or_unresolved"],
      goodFollowupsIfUnresolved: [41, 38]
    }
  ),

  q(
    29,
    "stage2",
    "III",
    "factory_closure_causes_ranking",
    "ranking",
    0.91,
    false,
    [
      t("MAT", "continuous", "position", 0.70, "economic_attribution"),
      t("ONT_S", "continuous", "position", 0.65, "economic_attribution"),
      t("ZS", "continuous", "position", 0.40, "conflict_attribution"),
    ],
    {
      eligibleIf: ["MAT_live_or_unresolved", "ONT_S_live_or_unresolved", "ZS_live_or_unresolved"],
      goodFollowupsIfUnresolved: [31, 20, 34]
    }
  ),

  q(
    30,
    "stage2",
    "III",
    "information_control_error_tradeoff",
    "single_choice",
    0.90,
    false,
    [
      t("PRO", "continuous", "position", 0.70, "speech_harm_tradeoff"),
      t("EPS", "categorical", "category", 0.25, "truth_authority_proxy"),
      t("COM", "continuous", "position", 0.20, "pluralism_proxy")
    ],
    {
      eligibleIf: ["PRO_live_or_unresolved", "EPS_live_or_unresolved"],
      goodFollowupsIfUnresolved: [21, 38]
    }
  ),

  q(
    31,
    "fixed12",
    "III",
    "trade_liberalization_effects",
    "single_choice",
    0.90,
    false,
    [
      t("ZS", "continuous", "position", 0.85, "macro_sum_view"),
      t("ONT_S", "continuous", "position", 0.45, "systems_view"),
      t("MAT", "continuous", "position", 0.20, "distribution_proxy")
    ],
    {
      goodFollowupsIfUnresolved: [29, 34, 48]
    }
  ),

  q(
    32,
    "stage3",
    "III",
    "mainstream_media_accuracy_estimate",
    "slider",
    0.62,
    true,
    [
      t("EPS", "categorical", "category", 0.65, "institutional_trust_proxy"),
      t("TRB", "continuous", "position", 0.15, "trust_hostility_proxy")
    ],
    {
      eligibleIf: ["late_consistency_check_only"],
      goodFollowupsIfUnresolved: [22, 55]
    }
  ),

  q(
    33,
    "stage2",
    "III",
    "immigration_enforcement_error_tradeoff",
    "single_choice",
    0.86,
    false,
    [
      t("PRO", "continuous", "position", 0.55, "boundary_error_asymmetry"),
      t("CU", "continuous", "position", 0.45, "boundary_error_asymmetry"),
      t("MOR", "continuous", "position", 0.20, "moral_scope_boundary")
    ],
    {
      eligibleIf: ["CU_live_or_unresolved", "PRO_live_or_unresolved"],
      goodFollowupsIfUnresolved: [50, 51, 52]
    }
  ),

  q(
    34,
    "stage3",
    "III",
    "threats_to_america_external_internal",
    "single_choice",
    0.65,
    true,
    [
      t("ZS", "continuous", "position", 0.60, "threat_bundle"),
      t("TRB", "continuous", "position", 0.25, "threat_bundle"),
      t("CU", "continuous", "position", 0.10, "threat_bundle")
    ],
    {
      eligibleIf: ["late_consistency_check_only"],
      goodFollowupsIfUnresolved: [39, 51]
    }
  ),

  q(
    35,
    "stage2",
    "III",
    "percent_groups_want_best_share_values",
    "slider",
    0.84,
    false,
    [
      t("TRB", "continuous", "position", 0.80, "outgroup_trust_estimate"),
      t("COM", "continuous", "position", 0.35, "outgroup_trust_estimate"),
      t("ZS", "continuous", "position", 0.30, "outgroup_trust_estimate")
    ],
    {
      eligibleIf: ["TRB_live_or_unresolved", "COM_live_or_unresolved"],
      goodFollowupsIfUnresolved: [39, 42, 60]
    }
  ),

  // ---------------------------------------------------------------------------
  // SECTION IV
  // ---------------------------------------------------------------------------
  q(
    36,
    "stage2",
    "IV",
    "fda_speed_vs_safety",
    "single_choice",
    0.88,
    false,
    [
      t("PRO", "continuous", "position", 0.65, "error_asymmetry"),
      t("EPS", "categorical", "category", 0.20, "expertise_risk_proxy"),
      t("ONT_H", "continuous", "position", 0.10, "risk_humanity_proxy")
    ],
    {
      eligibleIf: ["PRO_live_or_unresolved"],
      goodFollowupsIfUnresolved: [25, 59]
    }
  ),

  q(
    37,
    "stage2",
    "IV",
    "stupid_workplace_rule_response",
    "single_choice",
    0.80,
    false,
    [
      t("PRO", "continuous", "position", 0.60, "rule_response"),
      t("COM", "continuous", "position", 0.25, "rule_response"),
      t("ENG", "continuous", "position", 0.10, "conflict_response")
    ],
    {
      eligibleIf: ["PRO_live_or_unresolved"],
      goodFollowupsIfUnresolved: [38, 47]
    }
  ),

  q(
    38,
    "screen20",
    "IV",
    "rules_procedures_matter_salience",
    "slider",
    0.94,
    false,
    [
      t("PRO", "continuous", "salience", 0.95, "direct_salience")
    ],
    {
      eligibleIf: ["PRO_live_or_unresolved"],
      goodFollowupsIfUnresolved: [25, 30, 41]
    }
  ),

  q(
    39,
    "screen20",
    "IV",
    "opponent_model_allocation",
    "allocation",
    0.90,
    false,
    [
      t("TRB", "continuous", "position", 0.75, "outgroup_model"),
      t("COM", "continuous", "position", 0.45, "outgroup_model"),
      t("ONT_H", "continuous", "position", 0.30, "motive_model")
    ],
    {
      eligibleIf: ["TRB_live_or_unresolved", "COM_live_or_unresolved"],
      goodFollowupsIfUnresolved: [35, 42, 60]
    }
  ),

  q(
    40,
    "fixed12",
    "IV",
    "opponents_matter_to_identity",
    "slider",
    0.91,
    false,
    [
      t("PF", "continuous", "salience", 0.70, "identity_enemy_link"),
      t("TRB", "continuous", "salience", 0.45, "identity_enemy_link")
    ],
    {
      goodFollowupsIfUnresolved: [39, 60, 42]
    }
  ),

  q(
    41,
    "stage2",
    "IV",
    "election_access_vs_security",
    "single_choice",
    0.90,
    false,
    [
      t("PRO", "continuous", "position", 0.70, "error_asymmetry"),
      t("CU", "continuous", "position", 0.20, "boundary_order_proxy"),
      t("TRB", "continuous", "position", 0.15, "partisan_fairness_proxy")
    ],
    {
      eligibleIf: ["PRO_live_or_unresolved"],
      goodFollowupsIfUnresolved: [38, 30]
    }
  ),

  q(
    42,
    "screen20",
    "IV",
    "close_friends_voted_differently",
    "single_choice",
    0.88,
    false,
    [
      t("TRB", "continuous", "position", 0.75, "network_homophily"),
      t("PF", "continuous", "salience", 0.30, "network_homophily")
    ],
    {
      eligibleIf: ["TRB_live_or_unresolved", "PF_live_or_unresolved"],
      goodFollowupsIfUnresolved: [39, 60]
    }
  ),

  q(
    43,
    "stage2",
    "IV",
    "veil_of_ignorance_society_choice",
    "single_choice",
    0.91,
    false,
    [
      t("MAT", "continuous", "position", 0.70, "distributive_choice"),
      t("MOR", "continuous", "position", 0.35, "fairness_scope"),
      t("ZS", "continuous", "position", 0.15, "distributional_worldview"),
      t("ONT_S", "continuous", "position", 0.15, "structural_choice")
    ],
    {
      eligibleIf: ["MAT_live_or_unresolved", "MOR_live_or_unresolved"],
      goodFollowupsIfUnresolved: [13, 17, 27]
    }
  ),

  q(
    44,
    "stage3",
    "IV",
    "views_changed_in_10_years",
    "slider",
    0.58,
    false,
    [
      t("EPS", "categorical", "category", 0.20, "updating_proxy"),
      t("PF", "continuous", "position", 0.10, "identity_rigidity_proxy")
    ],
    {
      eligibleIf: ["late_low_weight_only"],
      goodFollowupsIfUnresolved: [55]
    }
  ),

  q(
    45,
    "stage3",
    "IV",
    "what_changed_minds_through_history",
    "single_choice",
    0.60,
    true,
    [
      t("EPS", "categorical", "category", 0.55, "abstract_style"),
      t("AES", "categorical", "category", 0.25, "abstract_style"),
      t("MOR", "continuous", "position", 0.10, "abstract_style")
    ],
    {
      eligibleIf: ["late_consistency_check_only"],
      goodFollowupsIfUnresolved: [55, 56]
    }
  ),

  q(
    46,
    "stage3",
    "IV",
    "caregiver_emotional_availability",
    "slider",
    0.30,
    false,
    [
      t("PF", "continuous", "salience", 0.05, "background_context"),
      t("COM", "continuous", "position", 0.05, "background_context"),
      t("TRB", "continuous", "position", 0.05, "background_context")
    ],
    {
      eligibleIf: ["background_prior_only"]
    }
  ),

  q(
    47,
    "fixed12",
    "IV",
    "political_conflict_with_close_others",
    "single_choice",
    0.89,
    false,
    [
      t("COM", "continuous", "position", 0.70, "interpersonal_conflict"),
      t("ENG", "continuous", "position", 0.35, "interpersonal_conflict"),
      t("PF", "continuous", "salience", 0.15, "interpersonal_conflict")
    ],
    {
      goodFollowupsIfUnresolved: [7, 38, 39]
    }
  ),

  q(
    48,
    "screen20",
    "IV",
    "social_progress_view",
    "single_choice",
    0.87,
    false,
    [
      t("ONT_H", "continuous", "position", 0.85, "progress_worldview"),
      t("ONT_S", "continuous", "position", 0.20, "progress_worldview"),
      t("CD", "continuous", "position", 0.30, "progress_worldview")
    ],
    {
      eligibleIf: ["ONT_H_live_or_unresolved"],
      goodFollowupsIfUnresolved: [18, 19, 49]
    }
  ),

  q(
    49,
    "stage2",
    "IV",
    "social_progress_salience",
    "slider",
    0.92,
    false,
    [
      t("ONT_H", "continuous", "salience", 0.95, "direct_salience"),
      t("ONT_S", "continuous", "salience", 0.20, "progress_salience")
    ],
    {
      eligibleIf: ["ONT_H_live_or_unresolved"],
      goodFollowupsIfUnresolved: [18, 48]
    }
  ),

  q(
    50,
    "stage2",
    "IV",
    "integration_expectations_rewrite",
    "ranking",
    0.72,
    false,
    [
      t("CU", "continuous", "position", 0.80, "membership_expectation"),
      t("CD", "continuous", "position", 0.35, "membership_expectation"),
      t("MOR", "continuous", "position", 0.15, "membership_expectation"),
      t("TRB", "continuous", "position", 0.15, "boundary_identity")
    ],
    {
      eligibleIf: ["CU_live_or_unresolved"],
      goodFollowupsIfUnresolved: [51, 52, 60]
    }
  ),

  q(
    51,
    "screen20",
    "IV",
    "immigration_national_identity_salience",
    "slider",
    0.93,
    false,
    [
      t("CU", "continuous", "salience", 0.90, "direct_salience"),
      t("CD", "continuous", "salience", 0.35, "direct_salience"),
      t("TRB", "continuous", "salience", 0.20, "identity_salience"),
      t("TRB_ANCHOR", "derived", "anchor", 0.25, "nationality_anchor")
    ],
    {
      eligibleIf: ["CU_live_or_unresolved", "TRB_live_or_unresolved"],
      goodFollowupsIfUnresolved: [50, 52, 60]
    }
  ),

  q(
    52,
    "stage2",
    "IV",
    "political_membership_criterion_rewrite",
    "single_choice",
    0.74,
    false,
    [
      t("CU", "continuous", "position", 0.85, "membership_boundary"),
      t("MOR", "continuous", "position", 0.15, "membership_boundary"),
      t("TRB", "continuous", "position", 0.15, "membership_boundary"),
      t("TRB_ANCHOR", "derived", "anchor", 0.25, "nationality_anchor")
    ],
    {
      eligibleIf: ["CU_live_or_unresolved"],
      goodFollowupsIfUnresolved: [50, 51, 60]
    }
  ),

  // ---------------------------------------------------------------------------
  // SECTION V
  // ---------------------------------------------------------------------------
  q(
    53,
    "stage3",
    "V",
    "parents_politics_growing_up",
    "single_choice",
    0.34,
    false,
    [
      t("PF", "continuous", "salience", 0.05, "background_context"),
      t("TRB", "continuous", "position", 0.05, "background_context"),
      t("MAT", "continuous", "position", 0.05, "background_context"),
      t("CD", "continuous", "position", 0.05, "background_context")
    ],
    {
      eligibleIf: ["background_prior_only"]
    }
  ),

  q(
    54,
    "stage3",
    "V",
    "religion_in_upbringing",
    "single_choice",
    0.40,
    false,
    [
      t("MOR", "continuous", "position", 0.10, "background_context"),
      t("CD", "continuous", "position", 0.10, "background_context"),
      t("TRB", "continuous", "position", 0.10, "background_context"),
      t("TRB_ANCHOR", "derived", "anchor", 0.35, "religious_anchor")
    ],
    {
      eligibleIf: ["background_prior_only_or_TRB_anchor_active"]
    }
  ),

  q(
    55,
    "screen20",
    "V",
    "what_changed_your_mind",
    "multi",
    0.94,
    false,
    [
      t("EPS", "categorical", "category", 0.88, "updating_channel"),
      t("PRO", "continuous", "position", 0.15, "updating_channel"),
      t("MOR", "continuous", "position", 0.15, "updating_channel")
    ],
    {
      eligibleIf: ["EPS_live_or_unresolved"],
      goodFollowupsIfUnresolved: [22, 23, 61]
    }
  ),

  q(
    56,
    "screen20",
    "V",
    "effective_leader_style",
    "single_choice",
    0.95,
    false,
    [
      t("AES", "categorical", "category", 0.90, "leader_style"),
      t("PRO", "continuous", "position", 0.20, "governance_style"),
      t("ENG", "continuous", "salience", 0.10, "mobilization_proxy")
    ],
    {
      eligibleIf: ["AES_live_or_unresolved"],
      goodFollowupsIfUnresolved: [61, 62, 59]
    }
  ),

  q(
    57,
    "stage3",
    "V",
    "parents_political_engagement",
    "single_choice",
    0.30,
    false,
    [
      t("ENG", "continuous", "position", 0.08, "background_context"),
      t("PF", "continuous", "salience", 0.05, "background_context")
    ],
    {
      eligibleIf: ["background_prior_only"]
    }
  ),

  q(
    58,
    "stage3",
    "V",
    "neighborhood_safety_childhood",
    "single_choice",
    0.30,
    false,
    [
      t("ZS", "continuous", "position", 0.05, "background_context"),
      t("TRB", "continuous", "position", 0.05, "background_context")
    ],
    {
      eligibleIf: ["background_prior_only"]
    }
  ),

  q(
    59,
    "screen20",
    "V",
    "what_matters_more_in_leader",
    "single_choice",
    0.91,
    false,
    [
      t("PRO", "continuous", "position", 0.35, "leader_evaluation"),
      t("AES", "categorical", "category", 0.45, "leader_evaluation"),
      t("EPS", "categorical", "category", 0.20, "leader_evaluation"),
      t("ENG", "continuous", "position", 0.10, "leader_evaluation")
    ],
    {
      eligibleIf: ["AES_live_or_unresolved", "PRO_live_or_unresolved"],
      goodFollowupsIfUnresolved: [56, 61, 25]
    }
  ),

  q(
    60,
    "screen20",
    "V",
    "politically_important_identities",
    "ranking",
    0.96,
    false,
    [
      t("TRB", "continuous", "position", 0.70, "identity_ranking"),
      t("PF", "continuous", "salience", 0.40, "identity_ranking"),
      t("TRB_ANCHOR", "derived", "anchor", 0.95, "identity_ranking"),
      t("CU", "continuous", "position", 0.15, "identity_ranking"),
      t("MOR", "continuous", "position", 0.15, "identity_ranking")
    ],
    {
      eligibleIf: ["TRB_live_or_unresolved", "PF_live_or_unresolved"],
      goodFollowupsIfUnresolved: [39, 42, 51]
    }
  ),

  q(
    61,
    "screen20",
    "V",
    "political_pitch_resonance",
    "single_choice",
    0.94,
    false,
    [
      t("AES", "categorical", "category", 0.82, "rhetorical_preference"),
      t("EPS", "categorical", "category", 0.30, "rhetorical_preference"),
      t("TRB", "continuous", "position", 0.20, "rhetorical_preference"),
      t("ZS", "continuous", "position", 0.15, "rhetorical_preference"),
      t("PRO", "continuous", "position", 0.15, "rhetorical_preference")
    ],
    {
      eligibleIf: ["AES_live_or_unresolved", "EPS_live_or_unresolved"],
      goodFollowupsIfUnresolved: [56, 62, 59]
    }
  ),

  q(
    62,
    "screen20",
    "V",
    "movement_aesthetics_reaction",
    "single_choice",
    0.90,
    false,
    [
      t("AES", "categorical", "category", 0.88, "movement_style"),
      t("TRB", "continuous", "position", 0.20, "movement_style"),
      t("ENG", "continuous", "position", 0.15, "movement_style")
    ],
    {
      eligibleIf: ["AES_live_or_unresolved"],
      goodFollowupsIfUnresolved: [56, 61]
    }
  ),

  // ---------------------------------------------------------------------------
  // SECTION VI
  // ---------------------------------------------------------------------------
  q(
    63,
    "screen20",
    "VI",
    "best_worst_battery",
    "best_worst",
    0.95,
    false,
    [
      t("MAT", "continuous", "salience", 0.25, "best_worst"),
      t("CD", "continuous", "salience", 0.20, "best_worst"),
      t("CU", "continuous", "salience", 0.25, "best_worst"),
      t("MOR", "continuous", "salience", 0.35, "best_worst"),
      t("PRO", "continuous", "salience", 0.30, "best_worst"),
      t("EPS", "categorical", "salience", 0.35, "best_worst"),
      t("AES", "categorical", "salience", 0.30, "best_worst"),
      t("COM", "continuous", "salience", 0.30, "best_worst"),
      t("ZS", "continuous", "salience", 0.20, "best_worst"),
      t("ONT_H", "continuous", "salience", 0.20, "best_worst"),
      t("ONT_S", "continuous", "salience", 0.20, "best_worst"),
      t("PF", "continuous", "salience", 0.35, "best_worst"),
      t("TRB", "continuous", "salience", 0.35, "best_worst"),
      t("ENG", "continuous", "salience", 0.25, "best_worst"),
      t("TRB_ANCHOR", "derived", "anchor", 0.20, "best_worst")
    ],
    {
      eligibleIf: ["screen20_or_late_screen"],
      goodFollowupsIfUnresolved: [51, 55, 56, 60]
    }
  ),

  // =========================================================================
  // SECTION VI — NEW GAP-TARGETED EXPANSION (Q64-Q75)
  // =========================================================================

  // Q64 — Political Frustration (PF position via grievance framing + salience)
  q(
    64,
    "stage2",
    "VI",
    "political_frustration",
    "single_choice",
    0.93,
    false,
    [
      t("PF", "continuous", "position", 0.90, "grievance_proxy"),
      t("PF", "continuous", "salience", 0.40, "frustration_intensity"),
      t("ENG", "continuous", "salience", 0.15, "engagement_proxy")
    ],
    {
      eligibleIf: ["PF_live_or_unresolved"],
      goodFollowupsIfUnresolved: [42, 60, 40]
    }
  ),

  /* Q65, Q66, Q67, Q68, Q70, Q73, Q74, Q75 — evidence maps miscalibrated,
     cause accuracy regression. Need recalibration against 124 archetype signatures.
     See src/optimize/questionDiag.ts for individual impact analysis.
  // Q65 — Party-Culture Conflict Response (PF salience + CD salience joint)
  q(
    65,
    "stage2",
    "VI",
    "party_culture_conflict_response",
    "single_choice",
    0.90,
    false,
    [
      t("PF", "continuous", "salience", 0.70, "loyalty_tradeoff"),
      t("CD", "continuous", "salience", 0.55, "cultural_salience"),
      t("COM", "continuous", "position", 0.25, "pragmatism_proxy")
    ],
    {
      eligibleIf: ["PF_live_or_unresolved", "CD_live_or_unresolved"],
      goodFollowupsIfUnresolved: [64, 74, 42]
    }
  ),

  // Q66 — Community Fund Allocation (CD + PRO joint)
  q(
    66,
    "stage2",
    "VI",
    "community_fund_allocation",
    "allocation",
    0.89,
    false,
    [
      t("CD", "continuous", "position", 0.75, "value_allocation"),
      t("PRO", "continuous", "position", 0.60, "governance_allocation"),
      t("MAT", "continuous", "position", 0.20, "economic_proxy")
    ],
    {
      eligibleIf: ["CD_live_or_unresolved", "PRO_live_or_unresolved"],
      goodFollowupsIfUnresolved: [72, 73, 74]
    }
  ),

  // Q67 — Universal vs Local Obligations (CU + MOR + ZS joint)
  q(
    67,
    "stage2",
    "VI",
    "universal_vs_local_obligations",
    "pairwise",
    0.92,
    false,
    [
      t("CU", "continuous", "position", 0.70, "scope_tradeoff"),
      t("MOR", "continuous", "position", 0.80, "scope_tradeoff"),
      t("ZS", "continuous", "position", 0.40, "resource_view")
    ],
    {
      eligibleIf: ["CU_live_or_unresolved", "MOR_live_or_unresolved"],
      goodFollowupsIfUnresolved: [74, 70, 50]
    }
  ),

  // Q68 — Opponent Success Response (COM + ONT_H joint)
  q(
    68,
    "stage2",
    "VI",
    "opponent_success_response",
    "single_choice",
    0.91,
    false,
    [
      t("COM", "continuous", "position", 0.80, "compromise_proxy"),
      t("ONT_H", "continuous", "position", 0.45, "optimism_proxy"),
      t("ZS", "continuous", "position", 0.25, "zero_sum_proxy")
    ],
    {
      eligibleIf: ["COM_live_or_unresolved", "ONT_H_live_or_unresolved"],
      goodFollowupsIfUnresolved: [69, 70, 72]
    }
  ),
  */ // end Q65-Q68 comment block

  // Q69 — Common Ground Salience (re-enabled: Q72 removed, interaction no longer applies)
  q(
    69,
    "stage2",
    "VI",
    "common_ground_salience",
    "slider",
    0.91,
    false,
    [
      t("COM", "continuous", "salience", 0.90, "direct_salience"),
      t("PRO", "continuous", "position", 0.15, "governance_proxy")
    ],
    {
      eligibleIf: ["COM_live_or_unresolved"],
      goodFollowupsIfUnresolved: [68, 7]
    }
  ),

  /* Q70 — needs recalibration: breaks 029, 052
  // Q70 — Zero-Sum Politics (ZS salience + position)
  q(
    70,
    "stage2",
    "VI",
    "zero_sum_politics_view",
    "slider",
    0.90,
    false,
    [
      t("ZS", "continuous", "salience", 0.85, "direct_salience"),
      t("ZS", "continuous", "position", 0.50, "direct_placement")
    ],
    {
      eligibleIf: ["ZS_live_or_unresolved"],
      goodFollowupsIfUnresolved: [31, 68, 67]
    }
  ),
  */ // end Q70 comment block

  /* Q71 — individually safe (98.4%) but causes interaction with Q72 that breaks 117.
     Re-enable if Q72 is removed, or if evidence maps are recalibrated.
  q(
    71,
    "stage2",
    "VI",
    "rhetoric_style_importance",
    "slider",
    0.88,
    false,
    [
      t("AES", "categorical", "salience", 0.90, "direct_salience"),
      t("ENG", "continuous", "salience", 0.20, "attention_proxy")
    ],
    {
      eligibleIf: ["AES_live_or_unresolved"],
      goodFollowupsIfUnresolved: [56, 61, 62]
    }
  ),
  */

  /* Q72 removed — PRO+COM process/outcome tradeoff is already well-covered
     by existing questions in the bank. */

  /* Q73-Q75 — needs recalibration: Q73 breaks 119, Q74 breaks 10 archetypes, Q75 breaks 050
  // Q73 — Inequality Solutions Ranking (MAT + PRO joint)
  q(
    73,
    "stage2",
    "VI",
    "inequality_solutions_ranking",
    "ranking",
    0.90,
    false,
    [
      t("MAT", "continuous", "position", 0.70, "economic_ranking"),
      t("PRO", "continuous", "position", 0.40, "governance_ranking"),
      t("COM", "continuous", "position", 0.20, "pragmatism_proxy")
    ],
    {
      eligibleIf: ["MAT_live_or_unresolved", "PRO_live_or_unresolved"],
      goodFollowupsIfUnresolved: [66, 72, 13]
    }
  ),

  // Q74 — Culture vs Diversity Scope (MOR + CD pairwise)
  q(
    74,
    "stage2",
    "VI",
    "culture_vs_diversity_scope",
    "pairwise",
    0.91,
    false,
    [
      t("MOR", "continuous", "position", 0.70, "moral_scope"),
      t("CD", "continuous", "position", 0.65, "cultural_direction"),
      t("CU", "continuous", "position", 0.30, "universalism_proxy")
    ],
    {
      eligibleIf: ["MOR_live_or_unresolved", "CD_live_or_unresolved"],
      goodFollowupsIfUnresolved: [67, 66, 50]
    }
  ),

  // Q75 — Cross-Party Marriage (TRB + PF joint)
  q(
    75,
    "stage2",
    "VI",
    "cross_party_marriage_comfort",
    "single_choice",
    0.92,
    false,
    [
      t("TRB", "continuous", "position", 0.70, "network_homophily"),
      t("PF", "continuous", "salience", 0.55, "identity_strength"),
      t("PF", "continuous", "position", 0.30, "partisan_intensity")
    ],
    {
      eligibleIf: ["TRB_live_or_unresolved", "PF_live_or_unresolved"],
      goodFollowupsIfUnresolved: [64, 65, 42]
    }
  )
  */ // end Q73-Q75 comment block

  // ── Coverage-gap fillers (Q76-Q79) ──────────────────────────────
  // Added to address biases found in 10k random simulation:
  //   Q76 — ONT_S position skews +0.861 high (structuralist); need individualist coverage
  //   Q77 — EPS intuitionist (3.2%) and nihilist (0.4%) nearly unreachable
  //   Q78 — AES authentic (4.5%) despite being most common AES in archetype bank
  //   Q79 — EPS nihilist dedicated (0% win rate in simulations)

  // Q76 — Success Attribution (ONT_S individualist coverage)
  q(
    76,
    "stage2",
    "IV",
    "success_attribution",
    "single_choice",
    0.91,
    false,
    [
      t("ONT_S", "continuous", "position", 0.90, "causal_attribution"),
      t("ONT_S", "continuous", "salience", 0.40, "causal_attribution"),
      t("ZS", "continuous", "position", 0.20, "distributional_worldview")
    ],
    {
      eligibleIf: ["ONT_S_live_or_unresolved"],
      goodFollowupsIfUnresolved: [20, 15, 29]
    }
  ),

  // Q77 — Decision-Making Style (EPS intuitionist + nihilist coverage)
  q(
    77,
    "stage2",
    "III",
    "decision_making_style",
    "single_choice",
    0.93,
    false,
    [
      t("EPS", "categorical", "category", 0.85, "decision_style"),
      t("EPS", "categorical", "salience", 0.35, "decision_style"),
      t("AES", "categorical", "category", 0.15, "style_proxy")
    ],
    {
      eligibleIf: ["EPS_live_or_unresolved"],
      goodFollowupsIfUnresolved: [79, 22, 55]
    }
  ),

  // Q78 — Speaker Appeal (AES authentic coverage)
  q(
    78,
    "stage2",
    "V",
    "speaker_appeal",
    "single_choice",
    0.92,
    false,
    [
      t("AES", "categorical", "category", 0.88, "rhetorical_preference"),
      t("AES", "categorical", "salience", 0.40, "rhetorical_preference"),
      t("EPS", "categorical", "category", 0.15, "style_proxy")
    ],
    {
      eligibleIf: ["AES_live_or_unresolved"],
      goodFollowupsIfUnresolved: [56, 61, 62]
    }
  ),

  // Q79 — Expert Disagreement (EPS nihilist dedicated)
  q(
    79,
    "stage2",
    "III",
    "expert_disagreement_reaction",
    "single_choice",
    0.90,
    false,
    [
      t("EPS", "categorical", "category", 0.82, "epistemic_response"),
      t("EPS", "categorical", "salience", 0.40, "epistemic_response"),
      t("ENG", "continuous", "salience", 0.15, "attention_proxy")
    ],
    {
      eligibleIf: ["EPS_live_or_unresolved"],
      goodFollowupsIfUnresolved: [77, 22, 44]
    }
  )
];

export const FULL_QUESTIONS_BY_ID = Object.fromEntries(
  FULL_QUESTIONS.map((q) => [q.id, q])
) as Record<number, QuestionDef>;
