import type { QuestionDef } from "../types.js";
import {
  AES_PROTOTYPES,
  EPS_PROTOTYPES,
  H_PROTOTYPES
} from "./categories.js";

export const REPRESENTATIVE_QUESTIONS: QuestionDef[] = [
  {
    id: 1,
    stage: "fixed12",
    section: "I",
    promptShort: "political_content_frequency",
    uiType: "single_choice",
    quality: 0.92,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ENG", kind: "continuous", role: "position", weight: 0.85, touchType: "behavior_frequency" },
      { node: "ENG", kind: "continuous", role: "salience", weight: 0.60, touchType: "behavior_frequency" },
      { node: "PF", kind: "continuous", role: "salience", weight: 0.20, touchType: "identity_proxy" }
    ],
    optionEvidence: {
      never: {
        continuous: {
          ENG: { pos: [0.70, 0.20, 0.08, 0.02, 0.00], sal: [0.55, 0.30, 0.12, 0.03] }
        }
      },
      few_days: {
        continuous: {
          ENG: { pos: [0.25, 0.45, 0.20, 0.08, 0.02], sal: [0.25, 0.40, 0.25, 0.10] }
        }
      },
      most_days: {
        continuous: {
          ENG: { pos: [0.03, 0.10, 0.25, 0.40, 0.22], sal: [0.05, 0.15, 0.45, 0.35] }
        }
      },
      every_day: {
        continuous: {
          ENG: { pos: [0.00, 0.02, 0.08, 0.25, 0.65], sal: [0.02, 0.08, 0.35, 0.55] }
        }
      }
    }
  },
  {
    id: 2,
    stage: "fixed12",
    section: "I",
    promptShort: "political_identity_centrality",
    uiType: "slider",
    quality: 0.94,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PF", kind: "continuous", role: "salience", weight: 0.95, touchType: "direct_centrality" },
      { node: "TRB", kind: "continuous", role: "salience", weight: 0.25, touchType: "identity_proxy" },
      { node: "ENG", kind: "continuous", role: "salience", weight: 0.20, touchType: "identity_proxy" }
    ],
    sliderMap: {
      "0-20": { continuous: { PF: { sal: [0.70, 0.22, 0.07, 0.01] } } },
      "21-40": { continuous: { PF: { sal: [0.25, 0.45, 0.22, 0.08] } } },
      "41-60": { continuous: { PF: { sal: [0.08, 0.30, 0.40, 0.22] } } },
      "61-80": { continuous: { PF: { sal: [0.02, 0.10, 0.38, 0.50] } } },
      "81-100": { continuous: { PF: { sal: [0.00, 0.03, 0.22, 0.75] } } }
    }
  },
  {
    id: 11,
    stage: "fixed12",
    section: "I",
    promptShort: "nyt_headline_click",
    uiType: "single_choice",
    quality: 0.86,
    rewriteNeeded: false,
    touchProfile: [
      { node: "EPS", kind: "categorical", role: "category", weight: 0.80, touchType: "taste_proxy" },
      { node: "AES", kind: "categorical", role: "category", weight: 0.45, touchType: "style_proxy" },
      { node: "ENG", kind: "continuous", role: "salience", weight: 0.15, touchType: "attention_proxy" }
    ],
    optionEvidence: {
      timeless_principles: {
        categorical: { EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.10, 0.25, 0.40, 0.25] } }
      },
      weird_science: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.10, 0.20, 0.40, 0.30] },
          AES: { cat: AES_PROTOTYPES.visionary, sal: [0.15, 0.25, 0.35, 0.25] }
        }
      },
      practical_tips: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.20, 0.35, 0.30, 0.15] },
          AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.20, 0.35, 0.30, 0.15] }
        }
      },
      other_side_bad: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.05, 0.20, 0.40, 0.35] },
          AES: { cat: AES_PROTOTYPES.fighter, sal: [0.05, 0.15, 0.35, 0.45] }
        }
      }
    }
  },
  {
    id: 15,
    stage: "fixed12",
    section: "II",
    promptShort: "inequality_causes_allocation",
    uiType: "allocation",
    quality: 0.91,
    rewriteNeeded: false,
    touchProfile: [
      { node: "MAT", kind: "continuous", role: "position", weight: 0.85, touchType: "causal_allocation" },
      { node: "ONT_S", kind: "continuous", role: "position", weight: 0.55, touchType: "causal_allocation" },
      { node: "H", kind: "categorical", role: "category", weight: 0.20, touchType: "merit_structure_proxy" }
    ],
    allocationMap: {
      effort_choices: { continuous: { MAT: -0.8, ONT_S: -0.5, COM: -0.4 } },
      family_background: { continuous: { MAT: 0.6, ONT_S: 0.7, COM: 0.3 } },
      discrimination_bias: { continuous: { MAT: 0.8, ONT_S: 0.8, COM: 0.5 } },
      luck_random: { continuous: { ONT_S: 0.4, COM: 0.2 } }
    }
  },
  {
    id: 20,
    stage: "fixed12",
    section: "II",
    promptShort: "bad_outcomes_blame_allocation",
    uiType: "allocation",
    quality: 0.90,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ONT_S", kind: "continuous", role: "position", weight: 0.85, touchType: "causal_allocation" },
      { node: "ZS", kind: "continuous", role: "position", weight: 0.55, touchType: "conflict_attribution" },
      { node: "ONT_H", kind: "continuous", role: "position", weight: 0.25, touchType: "motive_model" }
    ],
    allocationMap: {
      complex_forces: { continuous: { ONT_S: 0.9, COM: 0.5 } },
      powerful_incompetent: { continuous: { ONT_S: 0.2, COM: -0.3 } },
      powerful_selfish: { continuous: { ZS: 0.9, ONT_H: -0.5, COM: -0.6 } },
      ordinary_choices: { continuous: { ONT_S: -0.8, COM: -0.4 } },
      random_luck: { continuous: { ONT_S: 0.3, COM: 0.3 } }
    }
  },
  {
    id: 21,
    stage: "fixed12",
    section: "II",
    promptShort: "controversial_speaker",
    uiType: "single_choice",
    quality: 0.93,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "position", weight: 0.80, touchType: "rights_tradeoff" },
      { node: "COM", kind: "continuous", role: "position", weight: 0.35, touchType: "civic_balance" },
      { node: "EPS", kind: "categorical", role: "category", weight: 0.15, touchType: "truth_authority_proxy" }
    ],
    optionEvidence: {
      cancel: {
        continuous: {
          PRO: { pos: [0.55, 0.30, 0.10, 0.04, 0.01], sal: [0.05, 0.15, 0.40, 0.40] },
          COM: { pos: [0.40, 0.30, 0.15, 0.10, 0.05], sal: [0.10, 0.20, 0.40, 0.30] }
        }
      },
      restricted: {
        continuous: {
          PRO: { pos: [0.30, 0.35, 0.20, 0.10, 0.05], sal: [0.10, 0.20, 0.40, 0.30] },
          COM: { pos: [0.20, 0.25, 0.30, 0.15, 0.10], sal: [0.10, 0.25, 0.40, 0.25] }
        }
      },
      allow_with_counterspeech: {
        continuous: {
          PRO: { pos: [0.10, 0.20, 0.35, 0.25, 0.10], sal: [0.10, 0.20, 0.40, 0.30] },
          COM: { pos: [0.05, 0.10, 0.20, 0.35, 0.30], sal: [0.08, 0.17, 0.40, 0.35] }
        }
      },
      allow_no_restrictions: {
        continuous: {
          PRO: { pos: [0.01, 0.04, 0.10, 0.30, 0.55], sal: [0.05, 0.15, 0.40, 0.40] },
          COM: { pos: [0.10, 0.15, 0.20, 0.25, 0.30], sal: [0.15, 0.25, 0.35, 0.25] }
        }
      }
    }
  },
  {
    id: 23,
    stage: "fixed12",
    section: "III",
    promptShort: "who_should_shape_a_law",
    uiType: "ranking",
    quality: 0.89,
    rewriteNeeded: false,
    touchProfile: [
      { node: "EPS", kind: "categorical", role: "category", weight: 0.70, touchType: "authority_ranking" },
      { node: "H", kind: "categorical", role: "category", weight: 0.45, touchType: "authority_ranking" },
      { node: "PRO", kind: "continuous", role: "position", weight: 0.25, touchType: "governance_priority" }
    ],
    rankingMap: {
      researchers: { categorical: { EPS: EPS_PROTOTYPES.empiricist } },
      organized_residents: { categorical: { EPS: EPS_PROTOTYPES.autonomous } },
      elected_officials: { continuous: { PRO: 0.4 } },
      elders_religious: {
        categorical: {
          H: H_PROTOTYPES.traditional,
          EPS: EPS_PROTOTYPES.traditionalist
        }
      },
      business_stakeholders: {
        categorical: { H: H_PROTOTYPES.institutional }
      }
    }
  },
  {
    id: 24,
    stage: "screen20",
    section: "III",
    promptShort: "child_traits",
    uiType: "pairwise",
    quality: 0.90,
    rewriteNeeded: false,
    touchProfile: [
      { node: "H", kind: "categorical", role: "category", weight: 0.85, touchType: "socialization_pair" },
      { node: "ONT_H", kind: "continuous", role: "position", weight: 0.20, touchType: "human_nature_proxy" }
    ],
    pairMaps: {
      independence_vs_elders: {
        independence: { categorical: { H: H_PROTOTYPES.egalitarian } },
        respect_for_elders: { categorical: { H: H_PROTOTYPES.traditional } }
      },
      obedience_vs_self_reliance: {
        obedience: { categorical: { H: H_PROTOTYPES.paternal } },
        self_reliance: { categorical: { H: H_PROTOTYPES.meritocratic } }
      }
    }
  },
  {
    id: 39,
    stage: "screen20",
    section: "IV",
    promptShort: "opponent_model_allocation",
    uiType: "allocation",
    quality: 0.90,
    rewriteNeeded: false,
    touchProfile: [
      { node: "TRB", kind: "continuous", role: "position", weight: 0.75, touchType: "outgroup_model" },
      { node: "COM", kind: "continuous", role: "position", weight: 0.45, touchType: "outgroup_model" },
      { node: "ONT_H", kind: "continuous", role: "position", weight: 0.30, touchType: "motive_model" }
    ],
    allocationMap: {
      legitimate_values: { continuous: { TRB: -0.9, COM: 0.8 } },
      misinformed: { continuous: { TRB: 0.1 } },
      self_interest: { continuous: { ONT_H: -0.5 } },
      bad_motives: { continuous: { TRB: 0.9, ONT_H: -0.8, COM: -0.7 } }
    }
  },
  {
    id: 56,
    stage: "screen20",
    section: "V",
    promptShort: "effective_leader_style",
    uiType: "single_choice",
    quality: 0.95,
    rewriteNeeded: false,
    touchProfile: [
      { node: "AES", kind: "categorical", role: "category", weight: 0.90, touchType: "leader_style" },
      { node: "PRO", kind: "continuous", role: "position", weight: 0.20, touchType: "governance_style" },
      { node: "ENG", kind: "continuous", role: "salience", weight: 0.10, touchType: "mobilization_proxy" }
    ],
    optionEvidence: {
      channel_anger: {
        categorical: { AES: { cat: AES_PROTOTYPES.fighter, sal: [0.02, 0.08, 0.35, 0.55] } }
      },
      paint_vision: {
        categorical: { AES: { cat: AES_PROTOTYPES.visionary, sal: [0.02, 0.08, 0.35, 0.55] } }
      },
      fight_to_win: {
        categorical: { AES: { cat: AES_PROTOTYPES.fighter, sal: [0.02, 0.08, 0.35, 0.55] } }
      },
      master_policy_details: {
        categorical: { AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.02, 0.08, 0.35, 0.55] } }
      },
      build_expert_coalitions: {
        categorical: { AES: { cat: AES_PROTOTYPES.statesman, sal: [0.02, 0.08, 0.35, 0.55] } }
      }
    }
  },
  {
    id: 60,
    stage: "screen20",
    section: "V",
    promptShort: "politically_important_identities",
    uiType: "ranking",
    quality: 0.96,
    rewriteNeeded: false,
    touchProfile: [
      { node: "TRB", kind: "continuous", role: "position", weight: 0.70, touchType: "identity_ranking" },
      { node: "PF", kind: "continuous", role: "salience", weight: 0.40, touchType: "identity_ranking" },
      { node: "TRB_ANCHOR", kind: "derived", role: "anchor", weight: 0.95, touchType: "identity_ranking" }
    ],
    rankingMap: {
      national_identity: { trbAnchor: { national: 1 } },
      ideological_identity: { trbAnchor: { ideological: 1 } },
      religious_identity: { trbAnchor: { religious: 1 } },
      class_identity: { trbAnchor: { class: 1 } },
      ethnic_racial_identity: { trbAnchor: { ethnic_racial: 1 } },
      global_citizen: { trbAnchor: { global: 1 } }
    }
  },

  // =========================================================================
  // SLIDER EVIDENCE MAPS
  // =========================================================================

  // Q3 — cultural_social_placement (slider)
  {
    id: 3,
    stage: "fixed12",
    section: "I",
    promptShort: "cultural_social_placement",
    uiType: "slider",
    quality: 0.90,
    rewriteNeeded: false,
    touchProfile: [
      { node: "CD", kind: "continuous", role: "position", weight: 0.90, touchType: "direct_placement" },
      { node: "CU", kind: "continuous", role: "position", weight: 0.30, touchType: "boundary_proxy" },
      { node: "MOR", kind: "continuous", role: "position", weight: 0.20, touchType: "values_proxy" }
    ],
    sliderMap: {
      "0-20":   { continuous: { CD: { pos: [0.60, 0.25, 0.10, 0.04, 0.01], sal: [0.08, 0.20, 0.40, 0.32] } } },
      "21-40":  { continuous: { CD: { pos: [0.30, 0.40, 0.20, 0.07, 0.03], sal: [0.10, 0.25, 0.38, 0.27] } } },
      "41-60":  { continuous: { CD: { pos: [0.08, 0.20, 0.44, 0.20, 0.08], sal: [0.15, 0.30, 0.35, 0.20] } } },
      "61-80":  { continuous: { CD: { pos: [0.03, 0.07, 0.20, 0.40, 0.30], sal: [0.10, 0.25, 0.38, 0.27] } } },
      "81-100": { continuous: { CD: { pos: [0.01, 0.04, 0.10, 0.25, 0.60], sal: [0.08, 0.20, 0.40, 0.32] } } }
    }
  },

  // Q4 — cultural_social_salience (slider)
  {
    id: 4,
    stage: "fixed12",
    section: "I",
    promptShort: "cultural_social_salience",
    uiType: "slider",
    quality: 0.93,
    rewriteNeeded: false,
    touchProfile: [
      { node: "CD", kind: "continuous", role: "salience", weight: 0.90, touchType: "direct_salience" },
      { node: "CU", kind: "continuous", role: "salience", weight: 0.45, touchType: "boundary_salience" },
      { node: "MOR", kind: "continuous", role: "salience", weight: 0.20, touchType: "values_salience" }
    ],
    sliderMap: {
      "0-20":   { continuous: { CD: { sal: [0.55, 0.30, 0.12, 0.03] }, CU: { sal: [0.50, 0.30, 0.15, 0.05] }, MOR: { sal: [0.50, 0.30, 0.15, 0.05] } } },
      "21-40":  { continuous: { CD: { sal: [0.30, 0.40, 0.22, 0.08] }, CU: { sal: [0.30, 0.35, 0.25, 0.10] }, MOR: { sal: [0.30, 0.35, 0.25, 0.10] } } },
      "41-60":  { continuous: { CD: { sal: [0.10, 0.30, 0.38, 0.22] }, CU: { sal: [0.12, 0.28, 0.38, 0.22] }, MOR: { sal: [0.15, 0.30, 0.35, 0.20] } } },
      "61-80":  { continuous: { CD: { sal: [0.04, 0.12, 0.38, 0.46] }, CU: { sal: [0.05, 0.15, 0.38, 0.42] }, MOR: { sal: [0.08, 0.20, 0.38, 0.34] } } },
      "81-100": { continuous: { CD: { sal: [0.02, 0.08, 0.30, 0.60] }, CU: { sal: [0.03, 0.10, 0.32, 0.55] }, MOR: { sal: [0.05, 0.12, 0.35, 0.48] } } }
    }
  },

  // Q8 — domestic_vs_abroad_lives (slider)
  {
    id: 8,
    stage: "screen20",
    section: "I",
    promptShort: "domestic_vs_abroad_lives",
    uiType: "slider",
    quality: 0.89,
    rewriteNeeded: false,
    touchProfile: [
      { node: "MOR", kind: "continuous", role: "position", weight: 0.90, touchType: "moral_scope_tradeoff" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.25, touchType: "moral_scope_tradeoff" },
      { node: "ZS", kind: "continuous", role: "position", weight: 0.15, touchType: "moral_scope_tradeoff" }
    ],
    sliderMap: {
      "0-20":   { continuous: { MOR: { pos: [0.55, 0.28, 0.12, 0.04, 0.01], sal: [0.08, 0.20, 0.40, 0.32] } } },
      "21-40":  { continuous: { MOR: { pos: [0.25, 0.40, 0.22, 0.10, 0.03], sal: [0.10, 0.25, 0.38, 0.27] } } },
      "41-60":  { continuous: { MOR: { pos: [0.08, 0.18, 0.48, 0.18, 0.08], sal: [0.12, 0.28, 0.38, 0.22] } } },
      "61-80":  { continuous: { MOR: { pos: [0.03, 0.10, 0.22, 0.40, 0.25], sal: [0.10, 0.25, 0.38, 0.27] } } },
      "81-100": { continuous: { MOR: { pos: [0.01, 0.04, 0.12, 0.28, 0.55], sal: [0.08, 0.20, 0.40, 0.32] } } }
    }
  },

  // Q12 — guess_top_marginal_tax_rate (slider)
  {
    id: 12,
    stage: "stage2",
    section: "II",
    promptShort: "guess_top_marginal_tax_rate",
    uiType: "slider",
    quality: 0.68,
    rewriteNeeded: false,
    touchProfile: [
      { node: "EPS", kind: "categorical", role: "category", weight: 0.35, touchType: "factual_calibration" },
      { node: "ENG", kind: "continuous", role: "position", weight: 0.10, touchType: "policy_attention" }
    ],
    sliderMap: {
      "0-20":   { categorical: { EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.15, 0.30, 0.35, 0.20] } } },
      "21-40":  { categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.10, 0.25, 0.40, 0.25] } } },
      "41-60":  { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.12, 0.28, 0.38, 0.22] } } },
      "61-80":  { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.15, 0.30, 0.35, 0.20] } } },
      "81-100": { categorical: { EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.15, 0.30, 0.35, 0.20] } } }
    }
  },

  // Q13 — preferred_top_marginal_tax_rate (slider)
  {
    id: 13,
    stage: "stage2",
    section: "II",
    promptShort: "preferred_top_marginal_tax_rate",
    uiType: "slider",
    quality: 0.88,
    rewriteNeeded: false,
    touchProfile: [
      { node: "MAT", kind: "continuous", role: "position", weight: 0.92, touchType: "policy_preference" },
      { node: "MAT", kind: "continuous", role: "salience", weight: 0.35, touchType: "policy_preference" }
    ],
    sliderMap: {
      "0-20":   { continuous: { MAT: { pos: [0.60, 0.25, 0.10, 0.04, 0.01], sal: [0.05, 0.15, 0.40, 0.40] } } },
      "21-40":  { continuous: { MAT: { pos: [0.30, 0.40, 0.20, 0.07, 0.03], sal: [0.08, 0.22, 0.40, 0.30] } } },
      "41-60":  { continuous: { MAT: { pos: [0.08, 0.18, 0.48, 0.18, 0.08], sal: [0.10, 0.25, 0.38, 0.27] } } },
      "61-80":  { continuous: { MAT: { pos: [0.03, 0.07, 0.20, 0.40, 0.30], sal: [0.08, 0.22, 0.40, 0.30] } } },
      "81-100": { continuous: { MAT: { pos: [0.01, 0.04, 0.10, 0.25, 0.60], sal: [0.05, 0.15, 0.40, 0.40] } } }
    }
  },

  // Q19 — human_progress_salience (slider)
  {
    id: 19,
    stage: "screen20",
    section: "II",
    promptShort: "human_progress_salience",
    uiType: "slider",
    quality: 0.93,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ONT_H", kind: "continuous", role: "salience", weight: 0.95, touchType: "direct_salience" }
    ],
    sliderMap: {
      "0-20":   { continuous: { ONT_H: { sal: [0.55, 0.30, 0.12, 0.03] } } },
      "21-40":  { continuous: { ONT_H: { sal: [0.25, 0.40, 0.25, 0.10] } } },
      "41-60":  { continuous: { ONT_H: { sal: [0.08, 0.28, 0.40, 0.24] } } },
      "61-80":  { continuous: { ONT_H: { sal: [0.03, 0.12, 0.40, 0.45] } } },
      "81-100": { continuous: { ONT_H: { sal: [0.02, 0.08, 0.30, 0.60] } } }
    }
  },

  // Q32 — mainstream_media_accuracy_estimate (slider)
  {
    id: 32,
    stage: "stage3",
    section: "III",
    promptShort: "mainstream_media_accuracy_estimate",
    uiType: "slider",
    quality: 0.40,
    rewriteNeeded: true,
    touchProfile: [
      { node: "EPS", kind: "categorical", role: "category", weight: 0.40, touchType: "institutional_trust_proxy" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.15, touchType: "trust_hostility_proxy" }
    ],
    sliderMap: {
      "0-20":   { categorical: { EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.10, 0.25, 0.38, 0.27] } } },
      "21-40":  { categorical: { EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.12, 0.28, 0.38, 0.22] } } },
      "41-60":  { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.15, 0.30, 0.35, 0.20] } } },
      "61-80":  { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.15, 0.30, 0.35, 0.20] } } },
      "81-100": { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.15, 0.30, 0.35, 0.20] } } }
    }
  },

  // Q35 — percent_groups_want_best_share_values (slider)
  {
    id: 35,
    stage: "stage2",
    section: "III",
    promptShort: "percent_groups_want_best_share_values",
    uiType: "slider",
    quality: 0.84,
    rewriteNeeded: false,
    touchProfile: [
      { node: "TRB", kind: "continuous", role: "position", weight: 0.80, touchType: "outgroup_trust_estimate" },
      { node: "COM", kind: "continuous", role: "position", weight: 0.35, touchType: "outgroup_trust_estimate" },
      { node: "ZS", kind: "continuous", role: "position", weight: 0.15, touchType: "outgroup_trust_estimate" }
    ],
    sliderMap: {
      "0-20":   { continuous: { TRB: { pos: [0.55, 0.28, 0.12, 0.04, 0.01], sal: [0.05, 0.15, 0.38, 0.42] }, ZS: { sal: [0.08, 0.20, 0.38, 0.34] } } },
      "21-40":  { continuous: { TRB: { pos: [0.30, 0.38, 0.20, 0.09, 0.03], sal: [0.08, 0.20, 0.40, 0.32] }, ZS: { sal: [0.10, 0.25, 0.38, 0.27] } } },
      "41-60":  { continuous: { TRB: { pos: [0.08, 0.18, 0.48, 0.18, 0.08], sal: [0.10, 0.25, 0.38, 0.27] }, ZS: { sal: [0.15, 0.30, 0.35, 0.20] } } },
      "61-80":  { continuous: { TRB: { pos: [0.03, 0.09, 0.20, 0.38, 0.30], sal: [0.08, 0.20, 0.40, 0.32] }, ZS: { sal: [0.15, 0.30, 0.35, 0.20] } } },
      "81-100": { continuous: { TRB: { pos: [0.01, 0.04, 0.12, 0.28, 0.55], sal: [0.05, 0.15, 0.38, 0.42] }, ZS: { sal: [0.15, 0.30, 0.35, 0.20] } } }
    }
  },

  // Q38 — rules_procedures_matter_salience (slider)
  {
    id: 38,
    stage: "screen20",
    section: "IV",
    promptShort: "rules_procedures_matter_salience",
    uiType: "slider",
    quality: 0.94,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "salience", weight: 0.95, touchType: "direct_salience" }
    ],
    sliderMap: {
      "0-20":   { continuous: { PRO: { sal: [0.55, 0.30, 0.12, 0.03] } } },
      "21-40":  { continuous: { PRO: { sal: [0.25, 0.40, 0.25, 0.10] } } },
      "41-60":  { continuous: { PRO: { sal: [0.08, 0.28, 0.40, 0.24] } } },
      "61-80":  { continuous: { PRO: { sal: [0.03, 0.12, 0.40, 0.45] } } },
      "81-100": { continuous: { PRO: { sal: [0.02, 0.08, 0.30, 0.60] } } }
    }
  },

  // Q40 — opponents_matter_to_identity (slider)
  {
    id: 40,
    stage: "fixed12",
    section: "IV",
    promptShort: "opponents_matter_to_identity",
    uiType: "slider",
    quality: 0.91,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PF", kind: "continuous", role: "salience", weight: 0.70, touchType: "identity_enemy_link" },
      { node: "TRB", kind: "continuous", role: "salience", weight: 0.45, touchType: "identity_enemy_link" }
    ],
    sliderMap: {
      "0-20":   { continuous: { PF: { sal: [0.50, 0.30, 0.15, 0.05] }, TRB: { sal: [0.55, 0.30, 0.12, 0.03] } } },
      "21-40":  { continuous: { PF: { sal: [0.25, 0.38, 0.27, 0.10] }, TRB: { sal: [0.25, 0.40, 0.25, 0.10] } } },
      "41-60":  { continuous: { PF: { sal: [0.10, 0.25, 0.40, 0.25] }, TRB: { sal: [0.10, 0.28, 0.38, 0.24] } } },
      "61-80":  { continuous: { PF: { sal: [0.04, 0.12, 0.38, 0.46] }, TRB: { sal: [0.04, 0.14, 0.40, 0.42] } } },
      "81-100": { continuous: { PF: { sal: [0.02, 0.08, 0.30, 0.60] }, TRB: { sal: [0.02, 0.08, 0.35, 0.55] } } }
    }
  },

  // Q44 — views_changed_in_10_years (slider)
  {
    id: 44,
    stage: "stage3",
    section: "IV",
    promptShort: "views_changed_in_10_years",
    uiType: "slider",
    quality: 0.58,
    rewriteNeeded: false,
    touchProfile: [
      { node: "EPS", kind: "categorical", role: "category", weight: 0.20, touchType: "updating_proxy" },
      { node: "PF", kind: "continuous", role: "position", weight: 0.10, touchType: "identity_rigidity_proxy" }
    ],
    sliderMap: {
      "0-20":   { categorical: { EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.20, 0.30, 0.32, 0.18] } } },
      "21-40":  { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.20, 0.30, 0.32, 0.18] } } },
      "41-60":  { categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.18, 0.30, 0.34, 0.18] } } },
      "61-80":  { categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.15, 0.28, 0.35, 0.22] } } },
      "81-100": { categorical: { EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.15, 0.28, 0.35, 0.22] } } }
    }
  },

  // Q46 — caregiver_emotional_availability (slider, background)
  {
    id: 46,
    stage: "stage3",
    section: "IV",
    promptShort: "caregiver_emotional_availability",
    uiType: "slider",
    quality: 0.30,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PF", kind: "continuous", role: "salience", weight: 0.05, touchType: "background_context" },
      { node: "COM", kind: "continuous", role: "position", weight: 0.05, touchType: "background_context" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.05, touchType: "background_context" }
    ],
    sliderMap: {
      "0-20":   { continuous: { COM: { pos: [0.28, 0.27, 0.22, 0.14, 0.09] }, TRB: { pos: [0.12, 0.18, 0.28, 0.25, 0.17] } } },
      "21-40":  { continuous: { COM: { pos: [0.22, 0.28, 0.25, 0.16, 0.09] }, TRB: { pos: [0.14, 0.20, 0.28, 0.22, 0.16] } } },
      "41-60":  { continuous: { COM: { pos: [0.15, 0.22, 0.30, 0.20, 0.13] }, TRB: { pos: [0.17, 0.22, 0.28, 0.20, 0.13] } } },
      "61-80":  { continuous: { COM: { pos: [0.09, 0.16, 0.25, 0.28, 0.22] }, TRB: { pos: [0.18, 0.23, 0.28, 0.18, 0.13] } } },
      "81-100": { continuous: { COM: { pos: [0.06, 0.12, 0.22, 0.30, 0.30] }, TRB: { pos: [0.20, 0.24, 0.26, 0.18, 0.12] } } }
    }
  },

  // Q49 — social_progress_salience (slider)
  {
    id: 49,
    stage: "stage2",
    section: "IV",
    promptShort: "social_progress_salience",
    uiType: "slider",
    quality: 0.92,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ONT_H", kind: "continuous", role: "salience", weight: 0.95, touchType: "direct_salience" },
      { node: "ONT_S", kind: "continuous", role: "salience", weight: 0.20, touchType: "progress_salience" }
    ],
    sliderMap: {
      "0-20":   { continuous: { ONT_H: { sal: [0.55, 0.30, 0.12, 0.03] }, ONT_S: { sal: [0.50, 0.30, 0.15, 0.05] } } },
      "21-40":  { continuous: { ONT_H: { sal: [0.25, 0.40, 0.25, 0.10] }, ONT_S: { sal: [0.28, 0.38, 0.24, 0.10] } } },
      "41-60":  { continuous: { ONT_H: { sal: [0.08, 0.28, 0.40, 0.24] }, ONT_S: { sal: [0.12, 0.28, 0.38, 0.22] } } },
      "61-80":  { continuous: { ONT_H: { sal: [0.03, 0.12, 0.40, 0.45] }, ONT_S: { sal: [0.05, 0.18, 0.40, 0.37] } } },
      "81-100": { continuous: { ONT_H: { sal: [0.02, 0.08, 0.30, 0.60] }, ONT_S: { sal: [0.03, 0.12, 0.35, 0.50] } } }
    }
  },

  // Q51 — immigration_national_identity_salience (slider)
  {
    id: 51,
    stage: "screen20",
    section: "IV",
    promptShort: "immigration_national_identity_salience",
    uiType: "slider",
    quality: 0.93,
    rewriteNeeded: false,
    touchProfile: [
      { node: "CU", kind: "continuous", role: "salience", weight: 0.90, touchType: "direct_salience" },
      { node: "CD", kind: "continuous", role: "salience", weight: 0.25, touchType: "direct_salience" },
      { node: "TRB", kind: "continuous", role: "salience", weight: 0.20, touchType: "identity_salience" },
      { node: "TRB_ANCHOR", kind: "derived", role: "anchor", weight: 0.25, touchType: "nationality_anchor" }
    ],
    sliderMap: {
      "0-20":   { continuous: { CU: { sal: [0.55, 0.30, 0.12, 0.03] }, CD: { sal: [0.50, 0.30, 0.15, 0.05] }, TRB: { sal: [0.50, 0.30, 0.15, 0.05] } } },
      "21-40":  { continuous: { CU: { sal: [0.25, 0.40, 0.25, 0.10] }, CD: { sal: [0.28, 0.38, 0.24, 0.10] }, TRB: { sal: [0.28, 0.38, 0.24, 0.10] } } },
      "41-60":  { continuous: { CU: { sal: [0.08, 0.28, 0.40, 0.24] }, CD: { sal: [0.12, 0.28, 0.38, 0.22] }, TRB: { sal: [0.12, 0.28, 0.38, 0.22] } } },
      "61-80":  { continuous: { CU: { sal: [0.03, 0.12, 0.40, 0.45] }, CD: { sal: [0.05, 0.18, 0.40, 0.37] }, TRB: { sal: [0.05, 0.18, 0.40, 0.37] } } },
      "81-100": { continuous: { CU: { sal: [0.02, 0.08, 0.30, 0.60] }, CD: { sal: [0.03, 0.12, 0.35, 0.50] }, TRB: { sal: [0.03, 0.12, 0.35, 0.50] } } }
    }
  },

  // =========================================================================
  // SINGLE_CHOICE EVIDENCE MAPS (batch 1: Q6, Q7, Q9, Q10, Q14, Q16, Q17)
  // =========================================================================

  // Q6 — surveillance_enforcement_due_process_bundle
  {
    id: 6,
    stage: "stage3",
    section: "I",
    promptShort: "surveillance_enforcement_due_process_bundle",
    uiType: "single_choice",
    quality: 0.45,
    rewriteNeeded: true,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "position", weight: 0.45, touchType: "policy_bundle" },
      { node: "H", kind: "categorical", role: "category", weight: 0.25, touchType: "policy_bundle" },
      { node: "ONT_H", kind: "continuous", role: "position", weight: 0.15, touchType: "policy_bundle" }
    ],
    optionEvidence: {
      due_process_priority: {
        continuous: {
          PRO: { pos: [0.02, 0.08, 0.20, 0.38, 0.32] },
          ONT_H: { pos: [0.05, 0.12, 0.30, 0.33, 0.20] }
        },
        categorical: { H: { cat: H_PROTOTYPES.egalitarian } }
      },
      balanced_security: {
        continuous: {
          PRO: { pos: [0.08, 0.20, 0.44, 0.20, 0.08] }
        },
        categorical: { H: { cat: H_PROTOTYPES.institutional } }
      },
      security_priority: {
        continuous: {
          PRO: { pos: [0.32, 0.38, 0.20, 0.08, 0.02] },
          ONT_H: { pos: [0.20, 0.33, 0.30, 0.12, 0.05] }
        },
        categorical: { H: { cat: H_PROTOTYPES.strong_order } }
      }
    }
  },

  // Q7 — coalition_vs_principle
  {
    id: 7,
    stage: "screen20",
    section: "I",
    promptShort: "coalition_vs_principle",
    uiType: "single_choice",
    quality: 0.88,
    rewriteNeeded: false,
    touchProfile: [
      { node: "COM", kind: "continuous", role: "position", weight: 0.85, touchType: "principle_tradeoff" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.25, touchType: "principle_tradeoff" },
      { node: "PRO", kind: "continuous", role: "position", weight: 0.20, touchType: "principle_tradeoff" }
    ],
    optionEvidence: {
      principle_first: {
        continuous: {
          COM: { pos: [0.02, 0.08, 0.20, 0.38, 0.32], sal: [0.03, 0.12, 0.40, 0.45] }
        }
      },
      coalition_first: {
        continuous: {
          COM: { pos: [0.32, 0.38, 0.20, 0.08, 0.02], sal: [0.03, 0.12, 0.40, 0.45] }
        }
      },
      depends_on_issue: {
        continuous: {
          COM: { pos: [0.08, 0.18, 0.42, 0.22, 0.10], sal: [0.10, 0.25, 0.38, 0.27] }
        }
      }
    }
  },

  // Q9 — politics_at_social_gatherings
  {
    id: 9,
    stage: "stage2",
    section: "I",
    promptShort: "politics_at_social_gatherings",
    uiType: "single_choice",
    quality: 0.86,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ENG", kind: "continuous", role: "position", weight: 0.60, touchType: "social_behavior" },
      { node: "COM", kind: "continuous", role: "position", weight: 0.45, touchType: "social_behavior" },
      { node: "PF", kind: "continuous", role: "salience", weight: 0.15, touchType: "social_behavior" }
    ],
    optionEvidence: {
      avoid_entirely: {
        continuous: {
          ENG: { pos: [0.40, 0.30, 0.18, 0.08, 0.04] },
          COM: { pos: [0.08, 0.15, 0.28, 0.30, 0.19], sal: [0.10, 0.22, 0.38, 0.30] }
        }
      },
      discuss_if_comes_up: {
        continuous: {
          ENG: { pos: [0.08, 0.22, 0.40, 0.22, 0.08] },
          COM: { pos: [0.06, 0.12, 0.30, 0.32, 0.20], sal: [0.08, 0.20, 0.40, 0.32] }
        }
      },
      actively_bring_up: {
        continuous: {
          ENG: { pos: [0.02, 0.06, 0.15, 0.35, 0.42] },
          COM: { pos: [0.15, 0.22, 0.28, 0.22, 0.13], sal: [0.05, 0.18, 0.40, 0.37] }
        }
      }
    }
  },

  // Q10 — climate_energy_bundle
  {
    id: 10,
    stage: "stage3",
    section: "I",
    promptShort: "climate_energy_bundle",
    uiType: "single_choice",
    quality: 0.42,
    rewriteNeeded: true,
    touchProfile: [
      { node: "MAT", kind: "continuous", role: "position", weight: 0.35, touchType: "policy_bundle" },
      { node: "PRO", kind: "continuous", role: "position", weight: 0.20, touchType: "policy_bundle" },
      { node: "ONT_S", kind: "continuous", role: "position", weight: 0.20, touchType: "policy_bundle" },
      { node: "ZS", kind: "continuous", role: "position", weight: 0.10, touchType: "policy_bundle" }
    ],
    optionEvidence: {
      aggressive_transition: {
        continuous: {
          MAT: { pos: [0.02, 0.08, 0.20, 0.35, 0.35] },
          ONT_S: { pos: [0.03, 0.10, 0.25, 0.35, 0.27] }
        }
      },
      gradual_transition: {
        continuous: {
          MAT: { pos: [0.08, 0.18, 0.40, 0.24, 0.10] },
          ONT_S: { pos: [0.08, 0.18, 0.40, 0.24, 0.10] }
        }
      },
      market_led: {
        continuous: {
          MAT: { pos: [0.30, 0.35, 0.22, 0.09, 0.04] },
          ONT_S: { pos: [0.20, 0.30, 0.30, 0.14, 0.06] }
        }
      },
      no_action_needed: {
        continuous: {
          MAT: { pos: [0.45, 0.30, 0.15, 0.07, 0.03] },
          ONT_S: { pos: [0.30, 0.30, 0.25, 0.10, 0.05] }
        }
      }
    }
  },

  // Q14 — university_admissions_approach
  {
    id: 14,
    stage: "stage2",
    section: "II",
    promptShort: "university_admissions_approach",
    uiType: "single_choice",
    quality: 0.83,
    rewriteNeeded: false,
    touchProfile: [
      { node: "MAT", kind: "continuous", role: "position", weight: 0.65, touchType: "fairness_design" },
      { node: "MOR", kind: "continuous", role: "position", weight: 0.20, touchType: "fairness_design" },
      { node: "PRO", kind: "continuous", role: "position", weight: 0.15, touchType: "allocation_rule" }
    ],
    optionEvidence: {
      strict_merit: {
        continuous: {
          MAT: { pos: [0.50, 0.30, 0.13, 0.05, 0.02] },
          MOR: { pos: [0.35, 0.30, 0.22, 0.09, 0.04] }
        }
      },
      holistic_review: {
        continuous: {
          MAT: { pos: [0.05, 0.15, 0.35, 0.30, 0.15] },
          MOR: { pos: [0.05, 0.12, 0.30, 0.33, 0.20] }
        }
      },
      affirmative_action: {
        continuous: {
          MAT: { pos: [0.02, 0.06, 0.18, 0.34, 0.40] },
          MOR: { pos: [0.03, 0.08, 0.22, 0.35, 0.32] }
        }
      },
      lottery: {
        continuous: {
          MAT: { pos: [0.08, 0.15, 0.30, 0.28, 0.19] }
        }
      }
    }
  },

  // Q16 — criminal_justice_bundle
  {
    id: 16,
    stage: "stage3",
    section: "II",
    promptShort: "criminal_justice_bundle",
    uiType: "single_choice",
    quality: 0.40,
    rewriteNeeded: true,
    touchProfile: [
      { node: "H", kind: "categorical", role: "category", weight: 0.35, touchType: "policy_bundle" },
      { node: "PRO", kind: "continuous", role: "position", weight: 0.30, touchType: "policy_bundle" },
      { node: "ONT_H", kind: "continuous", role: "position", weight: 0.20, touchType: "policy_bundle" },
      { node: "COM", kind: "continuous", role: "position", weight: 0.10, touchType: "policy_bundle" }
    ],
    optionEvidence: {
      rehabilitation_focus: {
        continuous: {
          PRO: { pos: [0.05, 0.12, 0.25, 0.35, 0.23] },
          ONT_H: { pos: [0.04, 0.10, 0.25, 0.38, 0.23] }
        },
        categorical: { H: { cat: H_PROTOTYPES.egalitarian } }
      },
      balanced_approach: {
        continuous: {
          PRO: { pos: [0.10, 0.20, 0.40, 0.20, 0.10] }
        },
        categorical: { H: { cat: H_PROTOTYPES.institutional } }
      },
      punishment_focus: {
        continuous: {
          PRO: { pos: [0.30, 0.35, 0.22, 0.09, 0.04] },
          ONT_H: { pos: [0.25, 0.33, 0.25, 0.12, 0.05] }
        },
        categorical: { H: { cat: H_PROTOTYPES.strong_order } }
      }
    }
  },

  // Q17 — ceo_worker_pay_ratio
  {
    id: 17,
    stage: "stage2",
    section: "II",
    promptShort: "ceo_worker_pay_ratio",
    uiType: "single_choice",
    quality: 0.87,
    rewriteNeeded: false,
    touchProfile: [
      { node: "MAT", kind: "continuous", role: "position", weight: 0.90, touchType: "fairness_threshold" },
      { node: "H", kind: "categorical", role: "category", weight: 0.15, touchType: "market_hierarchy_proxy" }
    ],
    optionEvidence: {
      ratio_10_to_1: {
        continuous: {
          MAT: { pos: [0.01, 0.04, 0.15, 0.35, 0.45], sal: [0.05, 0.15, 0.38, 0.42] }
        }
      },
      ratio_50_to_1: {
        continuous: {
          MAT: { pos: [0.04, 0.12, 0.35, 0.32, 0.17], sal: [0.08, 0.22, 0.40, 0.30] }
        }
      },
      ratio_200_to_1: {
        continuous: {
          MAT: { pos: [0.20, 0.35, 0.28, 0.12, 0.05], sal: [0.10, 0.25, 0.38, 0.27] }
        }
      },
      market_decides: {
        continuous: {
          MAT: { pos: [0.45, 0.30, 0.15, 0.07, 0.03], sal: [0.08, 0.20, 0.38, 0.34] }
        }
      }
    }
  },

  // =========================================================================
  // SINGLE_CHOICE EVIDENCE MAPS (batch 2: Q18, Q25, Q26, Q27, Q28, Q30, Q31)
  // =========================================================================

  // Q18 — human_progress_view
  {
    id: 18,
    stage: "screen20",
    section: "II",
    promptShort: "human_progress_view",
    uiType: "single_choice",
    quality: 0.88,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ONT_H", kind: "continuous", role: "position", weight: 0.90, touchType: "ontology_direct" },
      { node: "ONT_H", kind: "continuous", role: "salience", weight: 0.20, touchType: "ontology_direct" },
      { node: "ONT_S", kind: "continuous", role: "position", weight: 0.15, touchType: "worldview_proxy" }
    ],
    optionEvidence: {
      steady_improvement: {
        continuous: {
          ONT_H: { pos: [0.01, 0.05, 0.15, 0.38, 0.41], sal: [0.05, 0.15, 0.40, 0.40] }
        }
      },
      gradual_progress: {
        continuous: {
          ONT_H: { pos: [0.04, 0.12, 0.30, 0.35, 0.19], sal: [0.08, 0.22, 0.40, 0.30] }
        }
      },
      cyclical: {
        continuous: {
          ONT_H: { pos: [0.15, 0.25, 0.35, 0.18, 0.07], sal: [0.08, 0.22, 0.40, 0.30] }
        }
      },
      decline: {
        continuous: {
          ONT_H: { pos: [0.42, 0.30, 0.18, 0.07, 0.03], sal: [0.05, 0.15, 0.38, 0.42] }
        }
      }
    }
  },

  // Q25 — criminal_trial_error_tradeoff
  {
    id: 25,
    stage: "screen20",
    section: "III",
    promptShort: "criminal_trial_error_tradeoff",
    uiType: "single_choice",
    quality: 0.92,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "position", weight: 0.75, touchType: "error_asymmetry" },
      { node: "H", kind: "categorical", role: "category", weight: 0.30, touchType: "punishment_order_proxy" },
      { node: "ONT_H", kind: "continuous", role: "position", weight: 0.15, touchType: "human_motive_proxy" }
    ],
    optionEvidence: {
      rather_free_guilty: {
        continuous: {
          PRO: { pos: [0.02, 0.08, 0.20, 0.35, 0.35], sal: [0.05, 0.15, 0.40, 0.40] }
        },
        categorical: { H: { cat: H_PROTOTYPES.egalitarian, sal: [0.08, 0.20, 0.40, 0.32] } }
      },
      balance_both_errors: {
        continuous: {
          PRO: { pos: [0.10, 0.22, 0.36, 0.22, 0.10], sal: [0.10, 0.25, 0.38, 0.27] }
        },
        categorical: { H: { cat: H_PROTOTYPES.institutional, sal: [0.12, 0.28, 0.38, 0.22] } }
      },
      rather_convict_innocent: {
        continuous: {
          PRO: { pos: [0.35, 0.35, 0.20, 0.08, 0.02], sal: [0.05, 0.15, 0.40, 0.40] }
        },
        categorical: { H: { cat: H_PROTOTYPES.strong_order, sal: [0.08, 0.20, 0.40, 0.32] } }
      }
    }
  },

  // Q26 — vacation_new_vs_familiar
  {
    id: 26,
    stage: "stage2",
    section: "III",
    promptShort: "vacation_new_vs_familiar",
    uiType: "single_choice",
    quality: 0.52,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ONT_H", kind: "continuous", role: "position", weight: 0.25, touchType: "novelty_preference" },
      { node: "AES", kind: "categorical", role: "category", weight: 0.10, touchType: "taste_proxy" }
    ],
    optionEvidence: {
      new_place: {
        continuous: {
          ONT_H: { pos: [0.05, 0.12, 0.28, 0.33, 0.22] }
        },
        categorical: { AES: { cat: AES_PROTOTYPES.visionary, sal: [0.20, 0.30, 0.32, 0.18] } }
      },
      familiar_place: {
        continuous: {
          ONT_H: { pos: [0.22, 0.33, 0.28, 0.12, 0.05] }
        },
        categorical: { AES: { cat: AES_PROTOTYPES.pastoral, sal: [0.20, 0.30, 0.32, 0.18] } }
      },
      mix_both: {
        continuous: {
          ONT_H: { pos: [0.10, 0.20, 0.40, 0.20, 0.10] }
        }
      }
    }
  },

  // Q27 — welfare_error_tradeoff
  {
    id: 27,
    stage: "stage2",
    section: "III",
    promptShort: "welfare_error_tradeoff",
    uiType: "single_choice",
    quality: 0.89,
    rewriteNeeded: false,
    touchProfile: [
      { node: "MAT", kind: "continuous", role: "position", weight: 0.70, touchType: "error_asymmetry" },
      { node: "PRO", kind: "continuous", role: "position", weight: 0.25, touchType: "error_asymmetry" },
      { node: "MOR", kind: "continuous", role: "position", weight: 0.20, touchType: "deservingness_proxy" }
    ],
    optionEvidence: {
      rather_help_undeserving: {
        continuous: {
          MAT: { pos: [0.02, 0.08, 0.22, 0.35, 0.33], sal: [0.05, 0.15, 0.40, 0.40] },
          MOR: { pos: [0.03, 0.10, 0.25, 0.35, 0.27], sal: [0.08, 0.20, 0.40, 0.32] }
        }
      },
      balanced_errors: {
        continuous: {
          MAT: { pos: [0.10, 0.22, 0.36, 0.22, 0.10], sal: [0.10, 0.25, 0.38, 0.27] },
          MOR: { pos: [0.10, 0.20, 0.40, 0.20, 0.10] }
        }
      },
      rather_miss_needy: {
        continuous: {
          MAT: { pos: [0.33, 0.35, 0.22, 0.08, 0.02], sal: [0.05, 0.15, 0.40, 0.40] },
          MOR: { pos: [0.27, 0.35, 0.25, 0.10, 0.03], sal: [0.08, 0.20, 0.40, 0.32] }
        }
      }
    }
  },

  // Q28 — mask_mandate_acceptability
  {
    id: 28,
    stage: "stage2",
    section: "III",
    promptShort: "mask_mandate_acceptability",
    uiType: "single_choice",
    quality: 0.76,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "position", weight: 0.55, touchType: "public_health_authority" },
      { node: "CU", kind: "continuous", role: "position", weight: 0.25, touchType: "collective_uniformity" },
      { node: "H", kind: "categorical", role: "category", weight: 0.10, touchType: "authority_proxy" },
      { node: "COM", kind: "continuous", role: "position", weight: 0.10, touchType: "collective_action_proxy" }
    ],
    optionEvidence: {
      accept_mandate: {
        continuous: {
          PRO: { pos: [0.25, 0.32, 0.25, 0.12, 0.06] },
          CU: { pos: [0.04, 0.10, 0.25, 0.35, 0.26] }
        },
        categorical: { H: { cat: H_PROTOTYPES.institutional, sal: [0.15, 0.28, 0.35, 0.22] } }
      },
      comply_reluctantly: {
        continuous: {
          PRO: { pos: [0.10, 0.20, 0.40, 0.20, 0.10] },
          CU: { pos: [0.10, 0.20, 0.35, 0.25, 0.10] }
        }
      },
      resist_mandate: {
        continuous: {
          PRO: { pos: [0.04, 0.10, 0.20, 0.32, 0.34] },
          CU: { pos: [0.28, 0.30, 0.25, 0.12, 0.05] }
        },
        categorical: { H: { cat: H_PROTOTYPES.meritocratic, sal: [0.15, 0.28, 0.35, 0.22] } }
      }
    }
  },

  // Q30 — information_control_error_tradeoff
  {
    id: 30,
    stage: "stage2",
    section: "III",
    promptShort: "information_control_error_tradeoff",
    uiType: "single_choice",
    quality: 0.90,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "position", weight: 0.70, touchType: "speech_harm_tradeoff" },
      { node: "EPS", kind: "categorical", role: "category", weight: 0.25, touchType: "truth_authority_proxy" },
      { node: "COM", kind: "continuous", role: "position", weight: 0.20, touchType: "pluralism_proxy" }
    ],
    optionEvidence: {
      remove_immediately: {
        continuous: {
          PRO: { pos: [0.40, 0.32, 0.18, 0.07, 0.03] }
        },
        categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.08, 0.20, 0.40, 0.32] } }
      },
      allow_with_labels: {
        continuous: {
          PRO: { pos: [0.08, 0.20, 0.40, 0.22, 0.10] }
        },
        categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.10, 0.25, 0.38, 0.27] } }
      },
      allow_fully: {
        continuous: {
          PRO: { pos: [0.02, 0.06, 0.15, 0.35, 0.42] }
        },
        categorical: { EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.08, 0.20, 0.38, 0.34] } }
      }
    }
  },

  // Q31 — trade_liberalization_effects
  {
    id: 31,
    stage: "fixed12",
    section: "III",
    promptShort: "trade_liberalization_effects",
    uiType: "single_choice",
    quality: 0.90,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ZS", kind: "continuous", role: "position", weight: 0.85, touchType: "macro_sum_view" },
      { node: "ONT_S", kind: "continuous", role: "position", weight: 0.45, touchType: "systems_view" },
      { node: "MAT", kind: "continuous", role: "position", weight: 0.20, touchType: "distribution_proxy" }
    ],
    optionEvidence: {
      net_positive_clear: {
        continuous: {
          ZS: { pos: [0.41, 0.38, 0.15, 0.05, 0.01], sal: [0.05, 0.15, 0.40, 0.40] },
          ONT_S: { pos: [0.03, 0.10, 0.25, 0.38, 0.24], sal: [0.08, 0.20, 0.40, 0.32] }
        }
      },
      net_positive_but_uneven: {
        continuous: {
          ZS: { pos: [0.15, 0.30, 0.35, 0.15, 0.05], sal: [0.08, 0.20, 0.40, 0.32] },
          ONT_S: { pos: [0.05, 0.15, 0.40, 0.28, 0.12], sal: [0.08, 0.22, 0.40, 0.30] }
        }
      },
      mixed_effects: {
        continuous: {
          ZS: { pos: [0.07, 0.18, 0.35, 0.25, 0.15], sal: [0.10, 0.25, 0.38, 0.27] },
          ONT_S: { pos: [0.10, 0.22, 0.40, 0.20, 0.08] }
        }
      },
      mostly_harmful: {
        continuous: {
          ZS: { pos: [0.03, 0.07, 0.18, 0.30, 0.42], sal: [0.05, 0.15, 0.40, 0.40] },
          ONT_S: { pos: [0.25, 0.30, 0.28, 0.12, 0.05] }
        }
      }
    }
  },

  // =========================================================================
  // SINGLE_CHOICE EVIDENCE MAPS (batch 3: Q33, Q34, Q36, Q37, Q41, Q42, Q43)
  // =========================================================================

  // Q33 — immigration_enforcement_error_tradeoff
  {
    id: 33,
    stage: "stage2",
    section: "III",
    promptShort: "immigration_enforcement_error_tradeoff",
    uiType: "single_choice",
    quality: 0.86,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "position", weight: 0.55, touchType: "boundary_error_asymmetry" },
      { node: "CU", kind: "continuous", role: "position", weight: 0.45, touchType: "boundary_error_asymmetry" },
      { node: "MOR", kind: "continuous", role: "position", weight: 0.20, touchType: "moral_scope_boundary" }
    ],
    optionEvidence: {
      open_borders: {
        continuous: {
          CU: { pos: [0.01, 0.04, 0.12, 0.33, 0.50], sal: [0.05, 0.15, 0.38, 0.42] },
          MOR: { pos: [0.02, 0.08, 0.20, 0.35, 0.35], sal: [0.08, 0.20, 0.40, 0.32] }
        }
      },
      generous_policy: {
        continuous: {
          CU: { pos: [0.04, 0.12, 0.25, 0.35, 0.24], sal: [0.08, 0.20, 0.40, 0.32] },
          MOR: { pos: [0.05, 0.12, 0.28, 0.33, 0.22] }
        }
      },
      balanced_approach: {
        continuous: {
          CU: { pos: [0.10, 0.22, 0.38, 0.22, 0.08], sal: [0.10, 0.25, 0.38, 0.27] },
          MOR: { pos: [0.10, 0.20, 0.40, 0.20, 0.10] }
        }
      },
      strict_enforcement: {
        continuous: {
          CU: { pos: [0.40, 0.30, 0.18, 0.08, 0.04], sal: [0.05, 0.15, 0.38, 0.42] },
          MOR: { pos: [0.30, 0.30, 0.25, 0.10, 0.05], sal: [0.08, 0.20, 0.40, 0.32] }
        }
      }
    }
  },

  // Q34 — threats_to_america_external_internal
  {
    id: 34,
    stage: "stage3",
    section: "III",
    promptShort: "threats_to_america_external_internal",
    uiType: "single_choice",
    quality: 0.38,
    rewriteNeeded: true,
    touchProfile: [
      { node: "ZS", kind: "continuous", role: "position", weight: 0.35, touchType: "threat_bundle" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.20, touchType: "threat_bundle" },
      { node: "CU", kind: "continuous", role: "position", weight: 0.15, touchType: "threat_bundle" },
      { node: "ONT_S", kind: "continuous", role: "position", weight: 0.15, touchType: "threat_bundle" }
    ],
    optionEvidence: {
      external_threats: {
        continuous: {
          ZS: { pos: [0.30, 0.30, 0.25, 0.10, 0.05] },
          TRB: { pos: [0.08, 0.15, 0.28, 0.30, 0.19] }
        }
      },
      internal_division: {
        continuous: {
          ZS: { pos: [0.05, 0.12, 0.30, 0.33, 0.20] },
          TRB: { pos: [0.15, 0.22, 0.30, 0.22, 0.11] }
        }
      },
      both_equally: {
        continuous: {
          ZS: { pos: [0.12, 0.22, 0.35, 0.22, 0.09] }
        }
      }
    }
  },

  // Q36 — fda_speed_vs_safety
  {
    id: 36,
    stage: "stage2",
    section: "IV",
    promptShort: "fda_speed_vs_safety",
    uiType: "single_choice",
    quality: 0.88,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "position", weight: 0.65, touchType: "error_asymmetry" },
      { node: "EPS", kind: "categorical", role: "category", weight: 0.20, touchType: "expertise_risk_proxy" },
      { node: "ONT_H", kind: "continuous", role: "position", weight: 0.10, touchType: "risk_humanity_proxy" }
    ],
    optionEvidence: {
      prioritize_safety: {
        continuous: {
          PRO: { pos: [0.30, 0.35, 0.22, 0.09, 0.04] }
        },
        categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.10, 0.25, 0.38, 0.27] } }
      },
      balanced_timeline: {
        continuous: {
          PRO: { pos: [0.10, 0.22, 0.38, 0.22, 0.08] }
        },
        categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.12, 0.28, 0.38, 0.22] } }
      },
      prioritize_speed: {
        continuous: {
          PRO: { pos: [0.04, 0.09, 0.22, 0.35, 0.30] }
        },
        categorical: { EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.10, 0.25, 0.38, 0.27] } }
      }
    }
  },

  // Q37 — stupid_workplace_rule_response
  {
    id: 37,
    stage: "stage2",
    section: "IV",
    promptShort: "stupid_workplace_rule_response",
    uiType: "single_choice",
    quality: 0.80,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "position", weight: 0.60, touchType: "rule_response" },
      { node: "COM", kind: "continuous", role: "position", weight: 0.25, touchType: "rule_response" },
      { node: "ENG", kind: "continuous", role: "position", weight: 0.10, touchType: "conflict_response" }
    ],
    optionEvidence: {
      follow_always: {
        continuous: {
          PRO: { pos: [0.40, 0.32, 0.18, 0.07, 0.03] }
        }
      },
      follow_then_advocate: {
        continuous: {
          PRO: { pos: [0.10, 0.25, 0.38, 0.20, 0.07] },
          COM: { pos: [0.05, 0.12, 0.28, 0.33, 0.22] }
        }
      },
      ignore_quietly: {
        continuous: {
          PRO: { pos: [0.04, 0.10, 0.22, 0.35, 0.29] }
        }
      },
      openly_challenge: {
        continuous: {
          PRO: { pos: [0.03, 0.07, 0.18, 0.32, 0.40] },
          COM: { pos: [0.22, 0.28, 0.25, 0.15, 0.10] }
        }
      }
    }
  },

  // Q41 — election_access_vs_security
  {
    id: 41,
    stage: "stage2",
    section: "IV",
    promptShort: "election_access_vs_security",
    uiType: "single_choice",
    quality: 0.90,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "position", weight: 0.70, touchType: "error_asymmetry" },
      { node: "CU", kind: "continuous", role: "position", weight: 0.20, touchType: "boundary_order_proxy" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.15, touchType: "partisan_fairness_proxy" }
    ],
    optionEvidence: {
      easier_access: {
        continuous: {
          PRO: { pos: [0.04, 0.10, 0.22, 0.34, 0.30] },
          TRB: { pos: [0.15, 0.22, 0.30, 0.22, 0.11], sal: [0.08, 0.22, 0.40, 0.30] }
        }
      },
      balanced_approach: {
        continuous: {
          PRO: { pos: [0.10, 0.22, 0.38, 0.22, 0.08] }
        }
      },
      tighter_security: {
        continuous: {
          PRO: { pos: [0.30, 0.34, 0.22, 0.10, 0.04] },
          TRB: { pos: [0.10, 0.18, 0.28, 0.28, 0.16], sal: [0.08, 0.22, 0.40, 0.30] }
        }
      }
    }
  },

  // Q42 — close_friends_voted_differently
  {
    id: 42,
    stage: "screen20",
    section: "IV",
    promptShort: "close_friends_voted_differently",
    uiType: "single_choice",
    quality: 0.88,
    rewriteNeeded: false,
    touchProfile: [
      { node: "TRB", kind: "continuous", role: "position", weight: 0.75, touchType: "network_homophily" },
      { node: "PF", kind: "continuous", role: "salience", weight: 0.30, touchType: "network_homophily" }
    ],
    optionEvidence: {
      no_big_deal: {
        continuous: {
          TRB: { pos: [0.01, 0.04, 0.15, 0.38, 0.42], sal: [0.05, 0.15, 0.38, 0.42] }
        }
      },
      keep_friendship: {
        continuous: {
          TRB: { pos: [0.04, 0.12, 0.35, 0.30, 0.19], sal: [0.05, 0.18, 0.40, 0.37] }
        }
      },
      distance_somewhat: {
        continuous: {
          TRB: { pos: [0.22, 0.32, 0.28, 0.13, 0.05], sal: [0.03, 0.15, 0.40, 0.42] }
        }
      },
      end_friendship: {
        continuous: {
          TRB: { pos: [0.48, 0.28, 0.15, 0.06, 0.03], sal: [0.02, 0.10, 0.38, 0.50] }
        }
      }
    }
  },

  // Q43 — veil_of_ignorance_society_choice
  {
    id: 43,
    stage: "stage2",
    section: "IV",
    promptShort: "veil_of_ignorance_society_choice",
    uiType: "single_choice",
    quality: 0.91,
    rewriteNeeded: false,
    touchProfile: [
      { node: "MAT", kind: "continuous", role: "position", weight: 0.70, touchType: "distributive_choice" },
      { node: "MOR", kind: "continuous", role: "position", weight: 0.25, touchType: "fairness_scope" },
      { node: "ZS", kind: "continuous", role: "position", weight: 0.15, touchType: "distributional_worldview" }
    ],
    optionEvidence: {
      equal_society: {
        continuous: {
          MAT: { pos: [0.01, 0.04, 0.12, 0.35, 0.48], sal: [0.05, 0.15, 0.38, 0.42] }
        }
      },
      safety_net_society: {
        continuous: {
          MAT: { pos: [0.04, 0.12, 0.30, 0.34, 0.20], sal: [0.08, 0.22, 0.40, 0.30] }
        }
      },
      opportunity_society: {
        continuous: {
          MAT: { pos: [0.18, 0.30, 0.32, 0.14, 0.06], sal: [0.08, 0.22, 0.40, 0.30] }
        }
      },
      free_market_society: {
        continuous: {
          MAT: { pos: [0.45, 0.30, 0.15, 0.07, 0.03], sal: [0.05, 0.15, 0.38, 0.42] }
        }
      }
    }
  },

  // =========================================================================
  // SINGLE_CHOICE EVIDENCE MAPS (batch 4: Q45, Q47, Q48, Q52, Q53, Q54, Q57, Q58)
  // =========================================================================

  // Q45 — what_changed_minds_through_history
  {
    id: 45,
    stage: "stage3",
    section: "IV",
    promptShort: "what_changed_minds_through_history",
    uiType: "single_choice",
    quality: 0.36,
    rewriteNeeded: true,
    touchProfile: [
      { node: "EPS", kind: "categorical", role: "category", weight: 0.25, touchType: "abstract_style" },
      { node: "AES", kind: "categorical", role: "category", weight: 0.20, touchType: "abstract_style" },
      { node: "MOR", kind: "continuous", role: "position", weight: 0.10, touchType: "abstract_style" }
    ],
    optionEvidence: {
      evidence_and_argument: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.15, 0.28, 0.35, 0.22] },
          AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.18, 0.30, 0.32, 0.20] }
        }
      },
      moral_movements: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.15, 0.28, 0.35, 0.22] },
          AES: { cat: AES_PROTOTYPES.pastoral, sal: [0.18, 0.30, 0.32, 0.20] }
        }
      },
      economic_interests: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.18, 0.30, 0.32, 0.20] },
          AES: { cat: AES_PROTOTYPES.statesman, sal: [0.18, 0.30, 0.32, 0.20] }
        }
      },
      power_struggles: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.15, 0.28, 0.35, 0.22] },
          AES: { cat: AES_PROTOTYPES.fighter, sal: [0.18, 0.30, 0.32, 0.20] }
        }
      }
    }
  },

  // Q47 — political_conflict_with_close_others
  {
    id: 47,
    stage: "fixed12",
    section: "IV",
    promptShort: "political_conflict_with_close_others",
    uiType: "single_choice",
    quality: 0.89,
    rewriteNeeded: false,
    touchProfile: [
      { node: "COM", kind: "continuous", role: "position", weight: 0.70, touchType: "interpersonal_conflict" },
      { node: "ENG", kind: "continuous", role: "position", weight: 0.35, touchType: "interpersonal_conflict" },
      { node: "PF", kind: "continuous", role: "salience", weight: 0.15, touchType: "interpersonal_conflict" }
    ],
    optionEvidence: {
      avoid_if_possible: {
        continuous: {
          COM: { pos: [0.03, 0.10, 0.25, 0.35, 0.27], sal: [0.05, 0.15, 0.40, 0.40] }
        }
      },
      engage_carefully: {
        continuous: {
          COM: { pos: [0.06, 0.15, 0.35, 0.28, 0.16], sal: [0.08, 0.22, 0.40, 0.30] }
        }
      },
      stand_ground: {
        continuous: {
          COM: { pos: [0.20, 0.30, 0.28, 0.15, 0.07], sal: [0.05, 0.15, 0.40, 0.40] }
        }
      },
      enjoy_debate: {
        continuous: {
          COM: { pos: [0.35, 0.30, 0.20, 0.10, 0.05], sal: [0.03, 0.12, 0.40, 0.45] }
        }
      }
    }
  },

  // Q48 — social_progress_view
  {
    id: 48,
    stage: "screen20",
    section: "IV",
    promptShort: "social_progress_view",
    uiType: "single_choice",
    quality: 0.87,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ONT_H", kind: "continuous", role: "position", weight: 0.85, touchType: "progress_worldview" },
      { node: "ONT_S", kind: "continuous", role: "position", weight: 0.20, touchType: "progress_worldview" },
      { node: "CD", kind: "continuous", role: "position", weight: 0.10, touchType: "progress_worldview" }
    ],
    optionEvidence: {
      continuous_improvement: {
        continuous: {
          ONT_H: { pos: [0.01, 0.05, 0.15, 0.38, 0.41], sal: [0.05, 0.15, 0.40, 0.40] }
        }
      },
      gradual_improvement: {
        continuous: {
          ONT_H: { pos: [0.04, 0.12, 0.32, 0.34, 0.18], sal: [0.08, 0.22, 0.40, 0.30] }
        }
      },
      stagnation: {
        continuous: {
          ONT_H: { pos: [0.18, 0.28, 0.32, 0.15, 0.07], sal: [0.10, 0.25, 0.38, 0.27] }
        }
      },
      decline: {
        continuous: {
          ONT_H: { pos: [0.42, 0.30, 0.18, 0.07, 0.03], sal: [0.05, 0.15, 0.38, 0.42] }
        }
      }
    }
  },

  // Q52 — political_membership_criterion_rewrite
  {
    id: 52,
    stage: "stage2",
    section: "IV",
    promptShort: "political_membership_criterion_rewrite",
    uiType: "single_choice",
    quality: 0.64,
    rewriteNeeded: true,
    touchProfile: [
      { node: "CU", kind: "continuous", role: "position", weight: 0.80, touchType: "membership_boundary" },
      { node: "MOR", kind: "continuous", role: "position", weight: 0.20, touchType: "membership_boundary" },
      { node: "PF", kind: "continuous", role: "position", weight: 0.15, touchType: "membership_boundary" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.20, touchType: "membership_boundary" },
      { node: "TRB_ANCHOR", kind: "derived", role: "anchor", weight: 0.25, touchType: "nationality_anchor" }
    ],
    optionEvidence: {
      civic_participation: {
        continuous: {
          CU: { pos: [0.04, 0.10, 0.28, 0.35, 0.23] }
        }
      },
      shared_values: {
        continuous: {
          CU: { pos: [0.15, 0.25, 0.35, 0.18, 0.07] },
          TRB: { pos: [0.08, 0.15, 0.28, 0.30, 0.19] }
        }
      },
      cultural_heritage: {
        continuous: {
          CU: { pos: [0.30, 0.30, 0.25, 0.10, 0.05] },
          TRB: { pos: [0.05, 0.12, 0.25, 0.33, 0.25] }
        }
      },
      born_here: {
        continuous: {
          CU: { pos: [0.45, 0.28, 0.17, 0.07, 0.03] },
          TRB: { pos: [0.04, 0.10, 0.22, 0.34, 0.30] }
        }
      }
    }
  },

  // Q53 — parents_politics_growing_up (background, mild)
  {
    id: 53,
    stage: "stage3",
    section: "V",
    promptShort: "parents_politics_growing_up",
    uiType: "single_choice",
    quality: 0.34,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PF", kind: "continuous", role: "salience", weight: 0.05, touchType: "background_context" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.05, touchType: "background_context" },
      { node: "MAT", kind: "continuous", role: "position", weight: 0.05, touchType: "background_context" },
      { node: "CD", kind: "continuous", role: "position", weight: 0.05, touchType: "background_context" }
    ],
    optionEvidence: {
      very_conservative: {
        continuous: {
          CD: { pos: [0.28, 0.25, 0.22, 0.15, 0.10] },
          MAT: { pos: [0.26, 0.25, 0.22, 0.16, 0.11] }
        }
      },
      moderate_household: {
        continuous: {
          CD: { pos: [0.15, 0.22, 0.30, 0.20, 0.13] },
          MAT: { pos: [0.15, 0.22, 0.30, 0.20, 0.13] }
        }
      },
      very_progressive: {
        continuous: {
          CD: { pos: [0.10, 0.15, 0.22, 0.25, 0.28] },
          MAT: { pos: [0.11, 0.16, 0.22, 0.25, 0.26] }
        }
      },
      not_political: {
        continuous: {
          CD: { pos: [0.18, 0.22, 0.25, 0.20, 0.15] }
        }
      }
    }
  },

  // Q54 — religion_in_upbringing (background, mild)
  {
    id: 54,
    stage: "stage3",
    section: "V",
    promptShort: "religion_in_upbringing",
    uiType: "single_choice",
    quality: 0.40,
    rewriteNeeded: false,
    touchProfile: [
      { node: "MOR", kind: "continuous", role: "position", weight: 0.10, touchType: "background_context" },
      { node: "CD", kind: "continuous", role: "position", weight: 0.10, touchType: "background_context" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.10, touchType: "background_context" },
      { node: "TRB_ANCHOR", kind: "derived", role: "anchor", weight: 0.35, touchType: "religious_anchor" }
    ],
    optionEvidence: {
      very_religious: {
        continuous: {
          MOR: { pos: [0.25, 0.27, 0.23, 0.15, 0.10] },
          CD: { pos: [0.25, 0.27, 0.23, 0.15, 0.10] }
        }
      },
      somewhat_religious: {
        continuous: {
          MOR: { pos: [0.18, 0.24, 0.28, 0.18, 0.12] },
          CD: { pos: [0.18, 0.24, 0.28, 0.18, 0.12] }
        }
      },
      not_religious: {
        continuous: {
          MOR: { pos: [0.10, 0.15, 0.25, 0.27, 0.23] },
          CD: { pos: [0.10, 0.15, 0.25, 0.27, 0.23] }
        }
      }
    }
  },

  // Q57 — parents_political_engagement (background, mild)
  {
    id: 57,
    stage: "stage3",
    section: "V",
    promptShort: "parents_political_engagement",
    uiType: "single_choice",
    quality: 0.30,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ENG", kind: "continuous", role: "position", weight: 0.08, touchType: "background_context" },
      { node: "PF", kind: "continuous", role: "salience", weight: 0.05, touchType: "background_context" }
    ],
    optionEvidence: {
      very_engaged: {
        continuous: {
          ENG: { pos: [0.10, 0.15, 0.25, 0.28, 0.22] }
        }
      },
      occasionally_discussed: {
        continuous: {
          ENG: { pos: [0.15, 0.22, 0.30, 0.20, 0.13] }
        }
      },
      never_discussed: {
        continuous: {
          ENG: { pos: [0.25, 0.27, 0.24, 0.15, 0.09] }
        }
      }
    }
  },

  // Q58 — neighborhood_safety_childhood (background, mild)
  {
    id: 58,
    stage: "stage3",
    section: "V",
    promptShort: "neighborhood_safety_childhood",
    uiType: "single_choice",
    quality: 0.30,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ZS", kind: "continuous", role: "position", weight: 0.05, touchType: "background_context" },
      { node: "H", kind: "categorical", role: "category", weight: 0.05, touchType: "background_context" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.05, touchType: "background_context" }
    ],
    optionEvidence: {
      very_safe: {
        continuous: {
          ZS: { pos: [0.12, 0.18, 0.28, 0.25, 0.17] }
        }
      },
      mostly_safe: {
        continuous: {
          ZS: { pos: [0.15, 0.22, 0.28, 0.22, 0.13] }
        }
      },
      somewhat_unsafe: {
        continuous: {
          ZS: { pos: [0.20, 0.25, 0.27, 0.18, 0.10] }
        }
      },
      very_unsafe: {
        continuous: {
          ZS: { pos: [0.25, 0.27, 0.25, 0.15, 0.08] }
        }
      }
    }
  },

  // =========================================================================
  // SINGLE_CHOICE EVIDENCE MAPS (batch 5: Q59, Q61, Q62)
  // =========================================================================

  // Q59 — what_matters_more_in_leader
  {
    id: 59,
    stage: "screen20",
    section: "V",
    promptShort: "what_matters_more_in_leader",
    uiType: "single_choice",
    quality: 0.91,
    rewriteNeeded: false,
    touchProfile: [
      { node: "PRO", kind: "continuous", role: "position", weight: 0.35, touchType: "leader_evaluation" },
      { node: "AES", kind: "categorical", role: "category", weight: 0.45, touchType: "leader_evaluation" },
      { node: "EPS", kind: "categorical", role: "category", weight: 0.20, touchType: "leader_evaluation" },
      { node: "H", kind: "categorical", role: "category", weight: 0.20, touchType: "leader_evaluation" },
      { node: "ENG", kind: "continuous", role: "position", weight: 0.10, touchType: "leader_evaluation" }
    ],
    optionEvidence: {
      competence_record: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.02, 0.08, 0.35, 0.55] },
          EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.03, 0.12, 0.38, 0.47] },
          H: { cat: H_PROTOTYPES.meritocratic, sal: [0.05, 0.18, 0.40, 0.37] }
        }
      },
      moral_character: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.pastoral, sal: [0.02, 0.08, 0.35, 0.55] },
          EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.03, 0.12, 0.38, 0.47] },
          H: { cat: H_PROTOTYPES.traditional, sal: [0.05, 0.18, 0.40, 0.37] }
        }
      },
      fights_for_us: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.fighter, sal: [0.02, 0.08, 0.35, 0.55] },
          EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.03, 0.12, 0.38, 0.47] },
          H: { cat: H_PROTOTYPES.strong_order, sal: [0.05, 0.18, 0.40, 0.37] }
        }
      },
      unifying_vision: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.visionary, sal: [0.02, 0.08, 0.35, 0.55] },
          EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.03, 0.12, 0.38, 0.47] },
          H: { cat: H_PROTOTYPES.egalitarian, sal: [0.05, 0.18, 0.40, 0.37] }
        }
      }
    }
  },

  // Q61 — political_pitch_resonance
  {
    id: 61,
    stage: "screen20",
    section: "V",
    promptShort: "political_pitch_resonance",
    uiType: "single_choice",
    quality: 0.94,
    rewriteNeeded: false,
    touchProfile: [
      { node: "AES", kind: "categorical", role: "category", weight: 0.82, touchType: "rhetorical_preference" },
      { node: "EPS", kind: "categorical", role: "category", weight: 0.30, touchType: "rhetorical_preference" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.20, touchType: "rhetorical_preference" },
      { node: "ZS", kind: "continuous", role: "position", weight: 0.15, touchType: "rhetorical_preference" },
      { node: "PRO", kind: "continuous", role: "position", weight: 0.15, touchType: "rhetorical_preference" }
    ],
    optionEvidence: {
      evidence_pitch: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.02, 0.08, 0.35, 0.55] },
          EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.03, 0.10, 0.37, 0.50] }
        }
      },
      values_pitch: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.pastoral, sal: [0.02, 0.08, 0.35, 0.55] },
          EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.03, 0.10, 0.37, 0.50] }
        }
      },
      fight_pitch: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.fighter, sal: [0.02, 0.08, 0.35, 0.55] },
          EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.03, 0.10, 0.37, 0.50] }
        }
      },
      unity_pitch: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.statesman, sal: [0.02, 0.08, 0.35, 0.55] },
          EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.03, 0.10, 0.37, 0.50] }
        }
      }
    }
  },

  // Q62 — movement_aesthetics_reaction
  {
    id: 62,
    stage: "screen20",
    section: "V",
    promptShort: "movement_aesthetics_reaction",
    uiType: "single_choice",
    quality: 0.90,
    rewriteNeeded: false,
    touchProfile: [
      { node: "AES", kind: "categorical", role: "category", weight: 0.88, touchType: "movement_style" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.20, touchType: "movement_style" },
      { node: "ENG", kind: "continuous", role: "position", weight: 0.15, touchType: "movement_style" }
    ],
    optionEvidence: {
      fiery_rally: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.fighter, sal: [0.02, 0.08, 0.35, 0.55] }
        }
      },
      measured_rally: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.statesman, sal: [0.02, 0.08, 0.35, 0.55] }
        }
      },
      grassroots_community: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.pastoral, sal: [0.02, 0.08, 0.35, 0.55] }
        }
      },
      data_driven_campaign: {
        categorical: {
          AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.02, 0.08, 0.35, 0.55] }
        }
      }
    }
  },

  // =========================================================================
  // MULTI-SELECT EVIDENCE MAPS (Q5, Q55)
  // =========================================================================

  // Q5 — engagement_motivations_top2 (multi)
  {
    id: 5,
    stage: "screen20",
    section: "I",
    promptShort: "engagement_motivations_top2",
    uiType: "multi",
    quality: 0.86,
    rewriteNeeded: false,
    touchProfile: [
      { node: "ENG", kind: "continuous", role: "position", weight: 0.55, touchType: "motive_selection" },
      { node: "PF", kind: "continuous", role: "salience", weight: 0.35, touchType: "motive_selection" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.30, touchType: "motive_selection" },
      { node: "PRO", kind: "continuous", role: "position", weight: 0.20, touchType: "motive_selection" },
      { node: "COM", kind: "continuous", role: "position", weight: 0.20, touchType: "motive_selection" },
      { node: "EPS", kind: "categorical", role: "category", weight: 0.20, touchType: "motive_selection" }
    ],
    optionEvidence: {
      civic_duty: {
        continuous: {
          COM: { pos: [0.05, 0.12, 0.28, 0.33, 0.22], sal: [0.10, 0.22, 0.38, 0.30] }
        }
      },
      protect_values: {
        continuous: {
          TRB: { pos: [0.08, 0.15, 0.28, 0.30, 0.19], sal: [0.08, 0.20, 0.40, 0.32] }
        }
      },
      help_community: {
        continuous: {
          COM: { pos: [0.04, 0.10, 0.25, 0.35, 0.26], sal: [0.08, 0.20, 0.40, 0.32] },
          MOR: { pos: [0.04, 0.10, 0.28, 0.35, 0.23] }
        }
      },
      fight_injustice: {
        continuous: {
          TRB: { pos: [0.12, 0.20, 0.30, 0.24, 0.14], sal: [0.08, 0.20, 0.40, 0.32] },
          PRO: { pos: [0.04, 0.10, 0.25, 0.35, 0.26] }
        }
      },
      self_interest: {
        continuous: {
          ENG: { pos: [0.05, 0.12, 0.28, 0.33, 0.22] }
        },
        categorical: { EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.15, 0.28, 0.35, 0.22] } }
      },
      intellectual_challenge: {
        categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.10, 0.25, 0.38, 0.27] } }
      }
    }
  },

  // Q55 — what_changed_your_mind (multi)
  {
    id: 55,
    stage: "screen20",
    section: "V",
    promptShort: "what_changed_your_mind",
    uiType: "multi",
    quality: 0.94,
    rewriteNeeded: false,
    touchProfile: [
      { node: "EPS", kind: "categorical", role: "category", weight: 0.88, touchType: "updating_channel" },
      { node: "PRO", kind: "continuous", role: "position", weight: 0.15, touchType: "updating_channel" },
      { node: "MOR", kind: "continuous", role: "position", weight: 0.15, touchType: "updating_channel" }
    ],
    optionEvidence: {
      personal_experience: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.08, 0.20, 0.38, 0.34] }
        }
      },
      data_evidence: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.08, 0.20, 0.40, 0.32] }
        }
      },
      trusted_authority: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.08, 0.22, 0.40, 0.30] }
        }
      },
      religious_moral: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.08, 0.20, 0.38, 0.34] }
        }
      },
      never_changed: {
        categorical: {
          EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.10, 0.25, 0.38, 0.27] }
        }
      }
    }
  },

  // =========================================================================
  // ALLOCATION EVIDENCE MAP (Q22)
  // =========================================================================

  // Q22 — factual_estimates_and_confidence (allocation)
  {
    id: 22,
    stage: "screen20",
    section: "II",
    promptShort: "factual_estimates_and_confidence",
    uiType: "allocation",
    quality: 0.95,
    rewriteNeeded: false,
    touchProfile: [
      { node: "EPS", kind: "categorical", role: "category", weight: 0.92, touchType: "factual_calibration" },
      { node: "EPS", kind: "categorical", role: "salience", weight: 0.45, touchType: "factual_calibration" },
      { node: "ENG", kind: "continuous", role: "position", weight: 0.10, touchType: "issue_attention" }
    ],
    allocationMap: {
      expert_consensus: { categorical: { EPS: EPS_PROTOTYPES.institutionalist } },
      personal_research: { categorical: { EPS: EPS_PROTOTYPES.empiricist } },
      lived_experience: { categorical: { EPS: EPS_PROTOTYPES.intuitionist } },
      tradition: { categorical: { EPS: EPS_PROTOTYPES.traditionalist } }
    }
  },

  // =========================================================================
  // RANKING EVIDENCE MAPS (Q29, Q50)
  // =========================================================================

  // Q29 — factory_closure_causes_ranking (ranking)
  {
    id: 29,
    stage: "stage2",
    section: "III",
    promptShort: "factory_closure_causes_ranking",
    uiType: "ranking",
    quality: 0.91,
    rewriteNeeded: false,
    touchProfile: [
      { node: "MAT", kind: "continuous", role: "position", weight: 0.70, touchType: "economic_attribution" },
      { node: "ONT_S", kind: "continuous", role: "position", weight: 0.65, touchType: "economic_attribution" },
      { node: "ZS", kind: "continuous", role: "position", weight: 0.40, touchType: "conflict_attribution" },
      { node: "H", kind: "categorical", role: "category", weight: 0.15, touchType: "labor_order_proxy" }
    ],
    rankingMap: {
      global_competition: {
        continuous: { ONT_S: 0.7, ZS: 0.4 }
      },
      automation: {
        continuous: { ONT_S: 0.6 }
      },
      corporate_decisions: {
        continuous: { MAT: 0.7, ZS: 0.6 },
        categorical: { H: H_PROTOTYPES.egalitarian }
      },
      government_policy: {
        continuous: { MAT: 0.3, ONT_S: 0.3 },
        categorical: { H: H_PROTOTYPES.institutional }
      },
      worker_choices: {
        continuous: { MAT: -0.6, ONT_S: -0.5 },
        categorical: { H: H_PROTOTYPES.meritocratic }
      }
    }
  },

  // Q50 — integration_expectations_rewrite (ranking)
  {
    id: 50,
    stage: "stage2",
    section: "IV",
    promptShort: "integration_expectations_rewrite",
    uiType: "ranking",
    quality: 0.62,
    rewriteNeeded: true,
    touchProfile: [
      { node: "CU", kind: "continuous", role: "position", weight: 0.75, touchType: "membership_expectation" },
      { node: "CD", kind: "continuous", role: "position", weight: 0.25, touchType: "membership_expectation" },
      { node: "MOR", kind: "continuous", role: "position", weight: 0.20, touchType: "membership_expectation" },
      { node: "TRB", kind: "continuous", role: "position", weight: 0.20, touchType: "boundary_identity" }
    ],
    rankingMap: {
      learn_language: {
        continuous: { CU: -0.3 }
      },
      follow_laws: {
        continuous: { CU: -0.2 }
      },
      adopt_values: {
        continuous: { CU: -0.6, CD: -0.4 }
      },
      economic_contribution: {
        continuous: { CU: 0.2, MAT: -0.3 }
      },
      cultural_customs: {
        continuous: { CU: -0.8, CD: -0.6 }
      }
    }
  },

  // =========================================================================
  // BEST_WORST -> rankingMap (Q63)
  // =========================================================================

  // Q63 — best_worst_battery (best_worst, stored as rankingMap for applyRankingAnswer)
  {
    id: 63,
    stage: "screen20",
    section: "VI",
    promptShort: "best_worst_battery",
    uiType: "best_worst",
    quality: 0.95,
    rewriteNeeded: false,
    touchProfile: [
      { node: "MAT", kind: "continuous", role: "salience", weight: 0.25, touchType: "best_worst" },
      { node: "CD", kind: "continuous", role: "salience", weight: 0.20, touchType: "best_worst" },
      { node: "CU", kind: "continuous", role: "salience", weight: 0.25, touchType: "best_worst" },
      { node: "MOR", kind: "continuous", role: "salience", weight: 0.35, touchType: "best_worst" },
      { node: "PRO", kind: "continuous", role: "salience", weight: 0.30, touchType: "best_worst" },
      { node: "EPS", kind: "categorical", role: "salience", weight: 0.35, touchType: "best_worst" },
      { node: "AES", kind: "categorical", role: "salience", weight: 0.30, touchType: "best_worst" },
      { node: "COM", kind: "continuous", role: "salience", weight: 0.30, touchType: "best_worst" },
      { node: "ZS", kind: "continuous", role: "salience", weight: 0.20, touchType: "best_worst" },
      { node: "H", kind: "categorical", role: "salience", weight: 0.25, touchType: "best_worst" },
      { node: "ONT_H", kind: "continuous", role: "salience", weight: 0.20, touchType: "best_worst" },
      { node: "ONT_S", kind: "continuous", role: "salience", weight: 0.20, touchType: "best_worst" },
      { node: "PF", kind: "continuous", role: "salience", weight: 0.35, touchType: "best_worst" },
      { node: "TRB", kind: "continuous", role: "salience", weight: 0.35, touchType: "best_worst" },
      { node: "ENG", kind: "continuous", role: "salience", weight: 0.25, touchType: "best_worst" },
      { node: "TRB_ANCHOR", kind: "derived", role: "anchor", weight: 0.20, touchType: "best_worst" }
    ],
    rankingMap: {
      fairness: {
        continuous: { MAT: 0.5, MOR: 0.4, PRO: 0.3 }
      },
      procedural_integrity: {
        continuous: { PRO: 0.6, COM: 0.3 }
      },
      national_strength: {
        continuous: { CU: -0.5, TRB: 0.4, ZS: -0.3 }
      },
      community_bonds: {
        continuous: { COM: 0.5, TRB: -0.3, MOR: 0.3 }
      },
      individual_freedom: {
        continuous: { PRO: 0.5, MAT: -0.3 }
      },
      tradition_continuity: {
        continuous: { CD: -0.5, CU: -0.4 }
      }
    }
  }
];
