import type { Archetype } from "../types.js";
import {
  EPS_PROTOTYPES,
  AES_PROTOTYPES,
  H_PROTOTYPES
} from "./categories.js";

export const SAMPLE_ARCHETYPES: Archetype[] = [
  {
    id: "win_win_centrist",
    name: "Win-Win Centrist",
    tier: "T1",
    prior: 0.04,
    nodes: {
      MAT: { kind: "continuous", pos: 3, sal: 2 },
      CD: { kind: "continuous", pos: 3, sal: 1 },
      CU: { kind: "continuous", pos: 2, sal: 1 },
      MOR: { kind: "continuous", pos: 4, sal: 1 },
      PRO: { kind: "continuous", pos: 4, sal: 2 },
      EPS: { kind: "categorical", probs: EPS_PROTOTYPES.institutionalist, sal: 2 },
      AES: { kind: "categorical", probs: AES_PROTOTYPES.statesman, sal: 2 },
      COM: { kind: "continuous", pos: 5, sal: 3 },
      ZS: { kind: "continuous", pos: 1, sal: 2 },
      H: { kind: "categorical", probs: H_PROTOTYPES.institutional, sal: 2 },
      ONT_H: { kind: "continuous", pos: 4, sal: 1 },
      ONT_S: { kind: "continuous", pos: 4, sal: 1 },
      PF: { kind: "continuous", pos: 2, sal: 1 },
      TRB: { kind: "continuous", pos: 1, sal: 1 },
      ENG: { kind: "continuous", pos: 3, sal: 1 }
    }
  },
  {
    id: "movement_conservative",
    name: "Movement Conservative",
    tier: "T2",
    prior: 0.05,
    nodes: {
      MAT: { kind: "continuous", pos: 2, sal: 2 },
      CD: { kind: "continuous", pos: 1, sal: 3 },
      CU: { kind: "continuous", pos: 4, sal: 2 },
      MOR: { kind: "continuous", pos: 2, sal: 2 },
      PRO: { kind: "continuous", pos: 2, sal: 2 },
      EPS: { kind: "categorical", probs: EPS_PROTOTYPES.autonomous, sal: 2 },
      AES: { kind: "categorical", probs: AES_PROTOTYPES.fighter, sal: 3 },
      COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
      ZS: { kind: "continuous", pos: 5, sal: 3 },
      H: { kind: "categorical", probs: H_PROTOTYPES.strong_order, sal: 2 },
      ONT_H: { kind: "continuous", pos: 2, sal: 2 },
      ONT_S: { kind: "continuous", pos: 2, sal: 1 },
      PF: { kind: "continuous", pos: 4, sal: 2 },
      TRB: { kind: "continuous", pos: 5, sal: 3 },
      ENG: { kind: "continuous", pos: 4, sal: 2 }
    },
    trbAnchorPrior: {
      ideological: 0.45,
      national: 0.35,
      religious: 0.20
    }
  },
  {
    id: "rationalist_technocrat",
    name: "Rationalist Technocrat",
    tier: "MEANS",
    prior: 0.04,
    nodes: {
      MAT: { kind: "continuous", pos: 3, sal: 1 },
      CD: { kind: "continuous", pos: 3, sal: 1 },
      CU: { kind: "continuous", pos: 2, sal: 0 },
      MOR: { kind: "continuous", pos: 4, sal: 1 },
      PRO: { kind: "continuous", pos: 4, sal: 2 },
      EPS: { kind: "categorical", probs: EPS_PROTOTYPES.empiricist, sal: 3 },
      AES: { kind: "categorical", probs: AES_PROTOTYPES.technocrat, sal: 3 },
      COM: { kind: "continuous", pos: 2, sal: 1 },
      ZS: { kind: "continuous", pos: 2, sal: 1 },
      H: { kind: "categorical", probs: H_PROTOTYPES.meritocratic, sal: 2 },
      ONT_H: { kind: "continuous", pos: 4, sal: 1 },
      ONT_S: { kind: "continuous", pos: 5, sal: 2 },
      PF: { kind: "continuous", pos: 1, sal: 0 },
      TRB: { kind: "continuous", pos: 1, sal: 0 },
      ENG: { kind: "continuous", pos: 3, sal: 1 }
    }
  },
  {
    id: "identity_rooted_progressive",
    name: "Identity-Rooted Progressive",
    tier: "GATE",
    prior: 0.03,
    nodes: {
      MAT: { kind: "continuous", pos: 4, sal: 2 },
      CD: { kind: "continuous", pos: 5, sal: 3 },
      CU: { kind: "continuous", pos: 1, sal: 2 },
      MOR: { kind: "continuous", pos: 4, sal: 2 },
      PRO: { kind: "continuous", pos: 3, sal: 1 },
      EPS: { kind: "categorical", probs: EPS_PROTOTYPES.institutionalist, sal: 1 },
      AES: { kind: "categorical", probs: AES_PROTOTYPES.authentic, sal: 2 },
      COM: { kind: "continuous", pos: 2, sal: 1 },
      ZS: { kind: "continuous", pos: 4, sal: 2 },
      H: { kind: "categorical", probs: H_PROTOTYPES.egalitarian, sal: 1 },
      ONT_H: { kind: "continuous", pos: 4, sal: 1 },
      ONT_S: { kind: "continuous", pos: 4, sal: 1 },
      PF: { kind: "continuous", pos: 5, sal: 3 },
      TRB: { kind: "continuous", pos: 4, sal: 3 },
      ENG: { kind: "continuous", pos: 4, sal: 2 }
    },
    trbAnchorPrior: {
      ideological: 0.35,
      ethnic_racial: 0.30,
      class: 0.20,
      global: 0.15
    }
  },
  {
    id: "anti_politics",
    name: "Anti-Politics",
    tier: "GATE",
    prior: 0.04,
    nodes: {
      MAT: { kind: "continuous", pos: 3, sal: 0 },
      CD: { kind: "continuous", pos: 3, sal: 0 },
      CU: { kind: "continuous", pos: 3, sal: 0 },
      MOR: { kind: "continuous", pos: 3, sal: 0 },
      PRO: { kind: "continuous", pos: 4, sal: 0 },
      EPS: { kind: "categorical", probs: EPS_PROTOTYPES.autonomous, sal: 1 },
      AES: { kind: "categorical", probs: AES_PROTOTYPES.pastoral, sal: 0 },
      COM: { kind: "continuous", pos: 3, sal: 1 },
      ZS: { kind: "continuous", pos: 3, sal: 0 },
      H: { kind: "categorical", probs: H_PROTOTYPES.egalitarian, sal: 0 },
      ONT_H: { kind: "continuous", pos: 3, sal: 0 },
      ONT_S: { kind: "continuous", pos: 3, sal: 0 },
      PF: { kind: "continuous", pos: 1, sal: 0 },
      TRB: { kind: "continuous", pos: 1, sal: 0 },
      ENG: { kind: "continuous", pos: 1, sal: 2 }
    }
  }
];
