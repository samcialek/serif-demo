"use strict";
(() => {
  // src/config/archetypes.ts
  var ARCHETYPES = [
    {
      id: "001",
      name: "Rawlsian Reformer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 1, sal: 2 },
        CU: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 2 },
        TRB: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 2 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 3, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "002",
      name: "Independent Social Democrat",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 3, sal: 2 },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "003",
      name: "Welfare Modernizer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "004",
      name: "Labor Reformer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 2 },
        TRB: { kind: "continuous", pos: 4, sal: 1 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 2, antiCats: [0, 1] }
      }
    },
    {
      id: "005",
      name: "Public Guardian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 2 },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "006",
      name: "Fairness Pragmatist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 3, sal: 1 },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 3, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.6, 0.2, 0.04, 0.06, 0.04, 0.06], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "007",
      name: "Solidarist Reformer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 2, sal: 2 },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 2, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "008",
      name: "Municipal Equalizer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "009",
      name: "Social Stabilizer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "010",
      name: "Bread-and-Butter Progressive",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 3, sal: 0 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 1 },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 3, sal: 2 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "011",
      name: "Jacobin Egalitarian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 4, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 4, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 3, sal: 2, anti: "high" },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 2 },
        TRB: { kind: "continuous", pos: 3, sal: 2 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 3, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 3, antiCats: [0, 1] }
      }
    },
    {
      id: "012",
      name: "Class-War Leftist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 2, sal: 2 },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 2, sal: 1 },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_S: { kind: "continuous", pos: 4, sal: 2 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.2, 0.5, 0.06], sal: 3, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 3, antiCats: [0, 1] }
      }
    },
    {
      id: "013",
      name: "Radical Leveler",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.2, 0.5, 0.06], sal: 2, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 2, antiCats: [0, 1] }
      }
    },
    {
      id: "014",
      name: "Movement Egalitarian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 2, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.2, 0.5, 0.06], sal: 2, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.08, 0.05, 0.06, 0.08, 0.67], sal: 2 }
      }
    },
    {
      id: "015",
      name: "Moral Firebrand",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        ONT_S: { kind: "continuous", pos: 5, sal: 2 },
        PF: { kind: "continuous", pos: 2, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 4, sal: 2 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.08, 0.05, 0.06, 0.08, 0.67], sal: 3 }
      }
    },
    {
      id: "016",
      name: "Insurgent Equalizer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 3, sal: 2 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.2, 0.5, 0.06], sal: 2, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 2, antiCats: [0, 1] }
      }
    },
    {
      id: "017",
      name: "Uncompromising Redistributionist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 2, sal: 1 },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.2, 0.5, 0.06], sal: 2, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 2, antiCats: [0, 1] }
      }
    },
    {
      id: "019",
      name: "Anarchist Mutualist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 1, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 2, sal: 2 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.2, 0.5, 0.06], sal: 2, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 3 }
      }
    },
    {
      id: "020",
      name: "Horizontalist Dissenter",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 2, sal: 2 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 2 },
        PF: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.2, 0.5, 0.06], sal: 2, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "021",
      name: "Kantian Cosmopolitan",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 2 }
      }
    },
    {
      id: "022",
      name: "Pluralist Universalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 2, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 2 }
      }
    },
    {
      id: "023",
      name: "Rights Cosmopolitan",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        CU: { kind: "continuous", pos: 4, sal: 3, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 2 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.06, 0.08, 0.05, 0.06, 0.08, 0.67], sal: 3 }
      }
    },
    {
      id: "024",
      name: "Ethical Internationalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2 },
        CD: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 5, sal: 3 },
        ZS: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 2 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 3, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 3 }
      }
    },
    {
      id: "025",
      name: "World-Minded Reformer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 3, sal: 2 },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 2, sal: 2 },
        TRB: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 2 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "026",
      name: "Cosmopolitan Pragmatist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 1 },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 2 },
        COM: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 2 }
      }
    },
    {
      id: "027",
      name: "Popperian Liberal",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 1 },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 3, sal: 2 },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 3, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "028",
      name: "Global Caretaker",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 2, sal: 2 },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 2 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "029",
      name: "Liberationist Progressive",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2 },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        PRO: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        COM: { kind: "continuous", pos: 2, sal: 2 },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 2 },
        PF: { kind: "continuous", pos: 2, sal: 2 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 3, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 2 }
      }
    },
    {
      id: "030",
      name: "Cultural Pluralist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 3, sal: 2 },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 3, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 2 }
      }
    },
    {
      id: "031",
      name: "Planetary Steward",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 2 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "032",
      name: "Hamiltonian Technocrat",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 4, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 0, anti: "high" },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 3, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "033",
      name: "Systems Modernizer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 2, sal: 3, anti: "high" },
        ZS: { kind: "continuous", pos: 2, sal: 3, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 3 },
        PF: { kind: "continuous", pos: 3, sal: 1, anti: "low" },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 2 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 3 }
      }
    },
    {
      id: "034",
      name: "Evidence Reformer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 1 },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 2 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 2, sal: 1 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "035",
      name: "Administrative Liberal",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 1 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 3, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 2, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "036",
      name: "Institutional Optimizer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2 },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 3, sal: 2 },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 2, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 2 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 2 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 3, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "037",
      name: "Fabian Modernizer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 1 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 2, sal: 2 },
        ONT_H: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 3, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "039",
      name: "Data-Driven Moderate",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 0 },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 3, sal: 1 },
        PRO: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 2, sal: 1, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "040",
      name: "Reform Engineer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2 },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 3, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 3, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "042",
      name: "Localist Progressive",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 2 },
        MOR: { kind: "continuous", pos: 3, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "043",
      name: "Neighborly Egalitarian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 2, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "045",
      name: "Rooted Social Reformer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 4, sal: 2 },
        CU: { kind: "continuous", pos: 2, sal: 1 },
        MOR: { kind: "continuous", pos: 3, sal: 1 },
        PRO: { kind: "continuous", pos: 4, sal: 1 },
        COM: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "046",
      name: "Pastoral Leftist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 4, sal: 2 },
        CU: { kind: "continuous", pos: 2, sal: 2 },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 2 },
        TRB: { kind: "continuous", pos: 2, sal: 2 },
        ENG: { kind: "continuous", pos: 2, sal: 2 },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "047",
      name: "Common-Life Reformer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 1 },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "048",
      name: "Solidaristic Localist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 2 },
        MOR: { kind: "continuous", pos: 3, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 4, sal: 2 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "049",
      name: "Paternal Egalitarian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 1 },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 4, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "050",
      name: "Religious Leftist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 3, sal: 1 },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "051",
      name: "Ecological Localist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 2 },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "052",
      name: "Distributist Localist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 3, anti: "low" },
        CD: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        CU: { kind: "continuous", pos: 2, sal: 3, anti: "high" },
        MOR: { kind: "continuous", pos: 3, sal: 3, anti: "low" },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 5, sal: 2 },
        ZS: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 3, sal: 3 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 2 },
        TRB: { kind: "continuous", pos: 2, sal: 2 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 3, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.62, 0.17, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "053",
      name: "Consensus Builder",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 3, sal: 2 },
        CU: { kind: "continuous", pos: 3, sal: 2 },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        ZS: { kind: "continuous", pos: 2, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 3, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.2, 0.04, 0.06, 0.04, 0.06], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "054",
      name: "Arbiter Moderate",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 3, sal: 2 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 3, anti: "low" },
        PRO: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        COM: { kind: "continuous", pos: 2, sal: 3 },
        ZS: { kind: "continuous", pos: 1, sal: 2 },
        ONT_H: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "055",
      name: "Halifax Moderate",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 1 },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 4, sal: 2 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 2 },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.6, 0.2, 0.04, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "056",
      name: "Institutional Centrist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 4, sal: 2 },
        CU: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        MOR: { kind: "continuous", pos: 4, sal: 3 },
        PRO: { kind: "continuous", pos: 3, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 2, sal: 3, anti: "high" },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 2, sal: 3, anti: "high" },
        PF: { kind: "continuous", pos: 3, sal: 2 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 2 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 3, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.2, 0.04, 0.06, 0.04, 0.06], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "057",
      name: "Temperate Pluralist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 2, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 2, sal: 2 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.2, 0.04, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "059",
      name: "Public-Minded Moderate",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 2 },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 2, sal: 2 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 2, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 2, sal: 2 },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.2, 0.04, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "060",
      name: "Hinge Citizen",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 3 },
        MOR: { kind: "continuous", pos: 3, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 3, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 3, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 2, anti: "high" },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.25, 0.58, 0.05, 0.03, 0.06, 0.03], sal: 3, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.2, 0.04, 0.06, 0.04, 0.06], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "061",
      name: "Millian Liberal",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 5, sal: 2 },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 4, sal: 3, anti: "low" },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 2, sal: 2 },
        COM: { kind: "continuous", pos: 3, sal: 3, anti: "low" },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 2 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.1, 0.6, 0.06], sal: 3, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "062",
      name: "Meritocratic Liberal",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 1 },
        MOR: { kind: "continuous", pos: 3, sal: 1 },
        PRO: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "063",
      name: "Enterprise Pluralist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 2 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.62, 0.14, 0.03, 0.04, 0.15, 0.02], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 2 }
      }
    },
    {
      id: "064",
      name: "Market Optimist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 4, sal: 2 },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 2 },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 2 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.62, 0.14, 0.03, 0.04, 0.15, 0.02], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 2 }
      }
    },
    {
      id: "065",
      name: "Opportunity Liberal",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 3, anti: "low" },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 2 },
        PRO: { kind: "continuous", pos: 1, sal: 3, anti: "low" },
        COM: { kind: "continuous", pos: 3, sal: 2 },
        ZS: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 2 },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 3 }
      }
    },
    {
      id: "067",
      name: "Free-Exchange Modernist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        COM: { kind: "continuous", pos: 3, sal: 2 },
        ZS: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 1, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 2 },
        TRB: { kind: "continuous", pos: 4, sal: 3, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.62, 0.14, 0.03, 0.04, 0.15, 0.02], sal: 3, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.18, 0.05, 0.06, 0.08, 0.57], sal: 3 }
      }
    },
    {
      id: "069",
      name: "Bleeding-Heart Libertarian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.62, 0.14, 0.03, 0.08, 0.11, 0.02], sal: 2, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.7, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "070",
      name: "Burkean Steward",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 4, sal: 2 },
        CU: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 3 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1, anti: "low" },
        ONT_H: { kind: "continuous", pos: 3, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 3, sal: 2 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 2 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "071",
      name: "Constitutional Conservative",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 3, sal: 1 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 2, sal: 2 },
        ZS: { kind: "continuous", pos: 3, sal: 1, anti: "low" },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 2 },
        TRB: { kind: "continuous", pos: 2, sal: 2 },
        ENG: { kind: "continuous", pos: 4, sal: 2 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "072",
      name: "Blackstone Conservative",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "073",
      name: "Civic Traditionalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "074",
      name: "Responsible Conservative",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 3, sal: 2 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1, anti: "high" },
        TRB: { kind: "continuous", pos: 2, sal: 1, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 3, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "075",
      name: "Institutional Conservative",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 2 },
        TRB: { kind: "continuous", pos: 2, sal: 2 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "076",
      name: "Fiscal Gradualist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 2, sal: 2 },
        CU: { kind: "continuous", pos: 3, sal: 1 },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 2 },
        COM: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1, anti: "high" },
        TRB: { kind: "continuous", pos: 2, sal: 1, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "077",
      name: "Ordered Libertarian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 2, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 2 },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "078",
      name: "Meritocratic Conservative",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 2, sal: 1 },
        PRO: { kind: "continuous", pos: 4, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 2 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "079",
      name: "National Developmentalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 1 },
        MOR: { kind: "continuous", pos: 2, sal: 1 },
        PRO: { kind: "continuous", pos: 4, sal: 1 },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "080",
      name: "Chestertonian Traditionalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 2, sal: 2 },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 2 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "081",
      name: "Heritage Guardian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 1 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 1 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.16, 0.05, 0.62, 0.07, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "082",
      name: "Altar-and-Hearth Conservative",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 2, sal: 2 },
        COM: { kind: "continuous", pos: 2, sal: 2 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 2, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.16, 0.05, 0.62, 0.07, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "083",
      name: "Sacred-Order Defender",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.16, 0.05, 0.62, 0.07, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "084",
      name: "Civilizational Conservative",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 2, antiCats: [0, 1] }
      }
    },
    {
      id: "085",
      name: "Customary Localist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 2, sal: 2 },
        COM: { kind: "continuous", pos: 2, sal: 2 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 2 },
        PF: { kind: "continuous", pos: 4, sal: 2 },
        TRB: { kind: "continuous", pos: 2, sal: 2 },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.16, 0.05, 0.62, 0.07, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "086",
      name: "Duty Traditionalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 2 },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.16, 0.05, 0.62, 0.07, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "087",
      name: "Continuity Conservative",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 2 },
        ONT_S: { kind: "continuous", pos: 4, sal: 2 },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 0 },
        ENG: { kind: "continuous", pos: 2, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.16, 0.05, 0.62, 0.07, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "088",
      name: "Gentle Traditionalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 2 },
        COM: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 3, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 2, sal: 1 },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 3, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.16, 0.05, 0.62, 0.07, 0.03, 0.07], sal: 3 }
      }
    },
    {
      id: "089",
      name: "Integral Traditionalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 1 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 2, sal: 2 },
        MOR: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 2 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "090",
      name: "Hobbesian Guardian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 2 },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 2, sal: 2 },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 2, sal: 2, anti: "low" },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 2 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.04, 0.06, 0.14, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "091",
      name: "Security Paternalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 3, sal: 1 },
        PRO: { kind: "continuous", pos: 4, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 2, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.04, 0.06, 0.14, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "092",
      name: "Disciplined Majoritarian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 1 },
        PRO: { kind: "continuous", pos: 4, sal: 1 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 1 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.04, 0.06, 0.14, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "093",
      name: "Stability-First Voter",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.04, 0.06, 0.14, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "094",
      name: "Hard-State Manager",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 4, sal: 2 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.08, 0.64, 0.04, 0.04, 0.03, 0.17], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "095",
      name: "Emergency Orderist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.04, 0.06, 0.14, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "096",
      name: "Civic Disciplinarian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 1 },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 2 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.04, 0.06, 0.14, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "097",
      name: "Authority Pragmatist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 4, sal: 1 },
        COM: { kind: "continuous", pos: 4, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 2, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.15, 0.05, 0.06, 0.06], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.04, 0.06, 0.14, 0.06], sal: 2, antiCats: [4] }
      }
    },
    {
      id: "098",
      name: "Anti-Elite Populist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 1 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.6, 0.15, 0.07], sal: 2 }
      }
    },
    {
      id: "099",
      name: "Scarcity Populist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 4, sal: 2 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 3, sal: 2 },
        TRB: { kind: "continuous", pos: 3, sal: 2 },
        ENG: { kind: "continuous", pos: 3, sal: 2 },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 2, antiCats: [0, 1] }
      }
    },
    {
      id: "100",
      name: "Tribal Insurgent",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 2, antiCats: [0, 1] }
      }
    },
    {
      id: "101",
      name: "Embattled Majoritarian",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 2 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 2, sal: 1 },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 3, sal: 2 },
        ENG: { kind: "continuous", pos: 3, sal: 2 },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.6, 0.15, 0.07], sal: 2 }
      }
    },
    {
      id: "102",
      name: "Folk Tribune",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 1 },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.6, 0.15, 0.07], sal: 2 }
      }
    },
    {
      id: "103",
      name: "Grievance Mobilizer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 2, sal: 1 },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 4, sal: 2 },
        ENG: { kind: "continuous", pos: 2, sal: 2 },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.6, 0.15, 0.07], sal: 2 }
      }
    },
    {
      id: "104",
      name: "National Protector",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 2 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 4, sal: 2 },
        ENG: { kind: "continuous", pos: 4, sal: 2 },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 2, antiCats: [0, 1] }
      }
    },
    {
      id: "105",
      name: "Combative Populist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 2, antiCats: [0, 1] }
      }
    },
    {
      id: "106",
      name: "Leader-Centered Insurgent",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        MOR: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 2, sal: 2 },
        COM: { kind: "continuous", pos: 2, sal: 2 },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 4, sal: 1 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.04, 0.03, 0.04, 0.18, 0.63, 0.08], sal: 2, antiCats: [0, 1] }
      }
    },
    {
      id: "107",
      name: "Resentful Localist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 4, sal: 2 },
        CU: { kind: "continuous", pos: 2, sal: 2 },
        MOR: { kind: "continuous", pos: 2, sal: 2 },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 2, sal: 2 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        TRB: { kind: "continuous", pos: 2, sal: 2 },
        ENG: { kind: "continuous", pos: 3, sal: 2 },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.6, 0.15, 0.07], sal: 2 }
      }
    },
    {
      id: "108",
      name: "Passive Cynic",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 0 },
        CD: { kind: "continuous", pos: 3, sal: 0 },
        CU: { kind: "continuous", pos: 3, sal: 0 },
        MOR: { kind: "continuous", pos: 3, sal: 0 },
        PRO: { kind: "continuous", pos: 2, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 0 },
        ZS: { kind: "continuous", pos: 3, sal: 0 },
        ONT_H: { kind: "continuous", pos: 2, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 0 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.03, 0.04, 0.04, 0.05, 0.1, 0.74], sal: 2, antiCats: [0, 1, 2, 3] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.7, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "109",
      name: "Alienated Outsider",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_S: { kind: "continuous", pos: 4, sal: 2 },
        PF: { kind: "continuous", pos: 2, sal: 1 },
        TRB: { kind: "continuous", pos: 3, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.1, 0.6, 0.06], sal: 3, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 3 }
      }
    },
    {
      id: "110",
      name: "Principled Abstainer",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 2 },
        MOR: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        PRO: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        COM: { kind: "continuous", pos: 1, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1, anti: "low" },
        PF: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.2, 0.5, 0.06], sal: 2, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "111",
      name: "Diogenes Independent",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 0 },
        CD: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CU: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        MOR: { kind: "continuous", pos: 4, sal: 1, anti: "low" },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 3, sal: 0 },
        ZS: { kind: "continuous", pos: 3, sal: 0 },
        ONT_H: { kind: "continuous", pos: 3, sal: 0 },
        ONT_S: { kind: "continuous", pos: 3, sal: 0 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.1, 0.6, 0.06], sal: 2, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.7, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "112",
      name: "Contrarian Intellectual",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 2 },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 2, sal: 1, anti: "high" },
        COM: { kind: "continuous", pos: 3, sal: 1, anti: "high" },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.08, 0.08, 0.08, 0.1, 0.6, 0.06], sal: 3, antiCats: [2, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.7, 0.05, 0.07], sal: 3 }
      }
    },
    {
      id: "115",
      name: "Quietist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 0 },
        CD: { kind: "continuous", pos: 3, sal: 0 },
        CU: { kind: "continuous", pos: 3, sal: 0 },
        MOR: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        PRO: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 0, anti: "low" },
        ONT_H: { kind: "continuous", pos: 4, sal: 2 },
        ONT_S: { kind: "continuous", pos: 3, sal: 0 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.04, 0.08, 0.6, 0.16, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.05, 0.72, 0.07, 0.03, 0.07], sal: 2 }
      }
    },
    {
      id: "116",
      name: "Quiet Middle",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 1 },
        MOR: { kind: "continuous", pos: 3, sal: 2 },
        PRO: { kind: "continuous", pos: 3, sal: 2 },
        COM: { kind: "continuous", pos: 3, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_H: { kind: "continuous", pos: 2, sal: 2 },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 1, anti: "low" },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "117",
      name: "Comfortable Bystander",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 3, sal: 2 },
        CU: { kind: "continuous", pos: 3, sal: 3 },
        MOR: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 5, sal: 1 },
        ZS: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        ONT_H: { kind: "continuous", pos: 2, sal: 3, anti: "low" },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 1, anti: "low" },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 3, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "118",
      name: "Survival Pragmatist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 2 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 1 },
        MOR: { kind: "continuous", pos: 3, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 3, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ONT_S: { kind: "continuous", pos: 4, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "119",
      name: "Apolitical Striver",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        CD: { kind: "continuous", pos: 3, sal: 0 },
        CU: { kind: "continuous", pos: 3, sal: 0 },
        MOR: { kind: "continuous", pos: 3, sal: 0 },
        PRO: { kind: "continuous", pos: 2, sal: 1 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 2, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 2, sal: 2 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "120",
      name: "Good Neighbor",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        CU: { kind: "continuous", pos: 3, sal: 3 },
        MOR: { kind: "continuous", pos: 5, sal: 3, anti: "low" },
        PRO: { kind: "continuous", pos: 3, sal: 1 },
        COM: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 2, sal: 2 },
        ONT_H: { kind: "continuous", pos: 3, sal: 2 },
        ONT_S: { kind: "continuous", pos: 2, sal: 3, anti: "high" },
        PF: { kind: "continuous", pos: 3, sal: 2 },
        TRB: { kind: "continuous", pos: 1, sal: 3, anti: "high" },
        ENG: { kind: "continuous", pos: 2, sal: 2 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.6, 0.1, 0.14, 0.06, 0.04, 0.06], sal: 3, antiCats: [4] }
      }
    },
    {
      id: "121",
      name: "Spectator Citizen",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 2 },
        CD: { kind: "continuous", pos: 3, sal: 2 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 3, sal: 3 },
        PRO: { kind: "continuous", pos: 4, sal: 3 },
        COM: { kind: "continuous", pos: 3, sal: 2 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 2, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.62, 0.24, 0.03, 0.04, 0.03, 0.04], sal: 3, antiCats: [2, 3, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "122",
      name: "Civic Minimalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 0 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 0 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 0 },
        ONT_S: { kind: "continuous", pos: 2, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 2, sal: 2 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "124",
      name: "Crisis-Activated Sleeper",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 0 },
        CD: { kind: "continuous", pos: 3, sal: 0, anti: "low" },
        CU: { kind: "continuous", pos: 3, sal: 0 },
        MOR: { kind: "continuous", pos: 3, sal: 0 },
        PRO: { kind: "continuous", pos: 2, sal: 1 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 4, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 0 },
        ONT_S: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 1 },
        TRB: { kind: "continuous", pos: 2, sal: 1, anti: "high" },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "125",
      name: "Reluctant Partisan",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 0 },
        CD: { kind: "continuous", pos: 3, sal: 0 },
        CU: { kind: "continuous", pos: 3, sal: 0, anti: "low" },
        MOR: { kind: "continuous", pos: 3, sal: 0, anti: "low" },
        PRO: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        ZS: { kind: "continuous", pos: 3, sal: 1, anti: "low" },
        ONT_H: { kind: "continuous", pos: 3, sal: 0 },
        ONT_S: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 4, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 2, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "126",
      name: "Single-Issue Activator",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 0 },
        CD: { kind: "continuous", pos: 3, sal: 0 },
        CU: { kind: "continuous", pos: 3, sal: 0 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 2, sal: 1 },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 0 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 3, sal: 0 },
        TRB: { kind: "continuous", pos: 3, sal: 0, anti: "low" },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "127",
      name: "Tribal Loyalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 0 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 0 },
        MOR: { kind: "continuous", pos: 2, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 0 },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 0 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ENG: { kind: "continuous", pos: 3, sal: 1, anti: "low" },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "128",
      name: "Loyal Democrat",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 2, sal: 1 },
        CD: { kind: "continuous", pos: 3, sal: 0 },
        CU: { kind: "continuous", pos: 4, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 0 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 0 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 4, sal: 2 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "129",
      name: "Loyal Republican",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 4, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 2, sal: 1 },
        MOR: { kind: "continuous", pos: 2, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 0 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 0 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 4, sal: 2 },
        ENG: { kind: "continuous", pos: 3, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "130",
      name: "Legacy Partisan",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 0 },
        MOR: { kind: "continuous", pos: 2, sal: 1 },
        PRO: { kind: "continuous", pos: 3, sal: 0 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 0 },
        ONT_S: { kind: "continuous", pos: 4, sal: 1 },
        PF: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 4, sal: 2 },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.04, 0.18, 0.6, 0.06, 0.08, 0.04], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "131",
      name: "Duty Voter",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 4, sal: 2 },
        CU: { kind: "continuous", pos: 3, sal: 1 },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        COM: { kind: "continuous", pos: 2, sal: 2 },
        ZS: { kind: "continuous", pos: 3, sal: 1 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 4, sal: 2 },
        PF: { kind: "continuous", pos: 3, sal: 1 },
        TRB: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ENG: { kind: "continuous", pos: 3, sal: 2 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "132",
      name: "Negative Partisan",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 0 },
        CD: { kind: "continuous", pos: 3, sal: 0 },
        CU: { kind: "continuous", pos: 3, sal: 0 },
        MOR: { kind: "continuous", pos: 3, sal: 0 },
        PRO: { kind: "continuous", pos: 3, sal: 0 },
        COM: { kind: "continuous", pos: 2, sal: 1 },
        ZS: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        ONT_H: { kind: "continuous", pos: 3, sal: 0 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        TRB: { kind: "continuous", pos: 4, sal: 2 },
        ENG: { kind: "continuous", pos: 4, sal: 1 },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "133",
      name: "Sporadic Alarm Voter",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 3, sal: 1 },
        CD: { kind: "continuous", pos: 3, sal: 1 },
        CU: { kind: "continuous", pos: 3, sal: 1 },
        MOR: { kind: "continuous", pos: 3, sal: 1, anti: "high" },
        PRO: { kind: "continuous", pos: 3, sal: 1, anti: "low" },
        COM: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        ZS: { kind: "continuous", pos: 4, sal: 2 },
        ONT_H: { kind: "continuous", pos: 3, sal: 1 },
        ONT_S: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        PF: { kind: "continuous", pos: 3, sal: 1, anti: "low" },
        TRB: { kind: "continuous", pos: 2, sal: 2, anti: "low" },
        ENG: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        EPS: { kind: "categorical", probs: [0.1, 0.58, 0.05, 0.03, 0.16, 0.08], sal: 2, antiCats: [5] },
        AES: { kind: "categorical", probs: [0.05, 0.05, 0.18, 0.6, 0.05, 0.07], sal: 2 }
      }
    },
    {
      id: "134",
      name: "Progressive Civic Nationalist",
      tier: "T1",
      prior: 1 / 124,
      nodes: {
        MAT: { kind: "continuous", pos: 1, sal: 2, anti: "high" },
        CD: { kind: "continuous", pos: 2, sal: 1 },
        CU: { kind: "continuous", pos: 4, sal: 2 },
        MOR: { kind: "continuous", pos: 4, sal: 2 },
        PRO: { kind: "continuous", pos: 4, sal: 2 },
        COM: { kind: "continuous", pos: 4, sal: 2 },
        ZS: { kind: "continuous", pos: 2, sal: 1 },
        ONT_H: { kind: "continuous", pos: 4, sal: 1 },
        ONT_S: { kind: "continuous", pos: 3, sal: 1 },
        PF: { kind: "continuous", pos: 4, sal: 2 },
        TRB: { kind: "continuous", pos: 4, sal: 2 },
        ENG: { kind: "continuous", pos: 5, sal: 2, anti: "low" },
        EPS: { kind: "categorical", probs: [0.05, 0.05, 0.08, 0.58, 0.19, 0.05], sal: 2, antiCats: [0, 5] },
        AES: { kind: "categorical", probs: [0.06, 0.08, 0.05, 0.06, 0.08, 0.67], sal: 2 }
      }
    }
  ];

  // src/config/categories.ts
  var UNIFORM_CAT = [
    1 / 6,
    1 / 6,
    1 / 6,
    1 / 6,
    1 / 6,
    1 / 6
  ];
  var CATEGORY_COST_MATRIX = {
    EPS: [
      [0, 0.4, 0.9, 0.8, 0.6, 1.1],
      [0.4, 0, 0.7, 0.7, 0.5, 1],
      [0.9, 0.7, 0, 0.7, 0.9, 1],
      [0.8, 0.7, 0.7, 0, 0.6, 0.9],
      [0.6, 0.5, 0.9, 0.6, 0, 0.8],
      [1.1, 1, 1, 0.9, 0.8, 0]
    ],
    AES: [
      [0, 0.4, 0.6, 0.7, 0.9, 0.6],
      [0.4, 0, 0.6, 0.7, 0.8, 0.5],
      [0.6, 0.6, 0, 0.5, 0.7, 0.6],
      [0.7, 0.7, 0.5, 0, 0.6, 0.5],
      [0.9, 0.8, 0.7, 0.6, 0, 0.7],
      [0.6, 0.5, 0.6, 0.5, 0.7, 0]
    ]
  };
  var EPS_PROTOTYPES = {
    empiricist: [0.72, 0.14, 0.03, 0.04, 0.05, 0.02],
    institutionalist: [0.15, 0.68, 0.05, 0.03, 0.06, 0.03],
    traditionalist: [0.04, 0.08, 0.7, 0.06, 0.08, 0.04],
    intuitionist: [0.05, 0.05, 0.08, 0.68, 0.09, 0.05],
    autonomous: [0.08, 0.08, 0.08, 0.1, 0.6, 0.06],
    nihilist: [0.03, 0.04, 0.04, 0.05, 0.1, 0.74]
  };
  var AES_PROTOTYPES = {
    statesman: [0.7, 0.1, 0.04, 0.06, 0.04, 0.06],
    technocrat: [0.08, 0.74, 0.04, 0.04, 0.03, 0.07],
    pastoral: [0.06, 0.05, 0.72, 0.07, 0.03, 0.07],
    authentic: [0.05, 0.05, 0.08, 0.7, 0.05, 0.07],
    fighter: [0.04, 0.03, 0.04, 0.08, 0.73, 0.08],
    visionary: [0.06, 0.08, 0.05, 0.06, 0.08, 0.67]
  };

  // src/config/questions.representative.ts
  var REPRESENTATIVE_QUESTIONS = [
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
        { node: "ENG", kind: "continuous", role: "salience", weight: 0.6, touchType: "behavior_frequency" },
        { node: "PF", kind: "continuous", role: "salience", weight: 0.2, touchType: "identity_proxy" }
      ],
      optionEvidence: {
        never: {
          continuous: {
            ENG: { pos: [0.7, 0.2, 0.08, 0.02, 0], sal: [0.55, 0.3, 0.12, 0.03] }
          }
        },
        few_days: {
          continuous: {
            ENG: { pos: [0.25, 0.45, 0.2, 0.08, 0.02], sal: [0.25, 0.4, 0.25, 0.1] }
          }
        },
        most_days: {
          continuous: {
            ENG: { pos: [0.03, 0.1, 0.25, 0.4, 0.22], sal: [0.05, 0.15, 0.45, 0.35] }
          }
        },
        every_day: {
          continuous: {
            ENG: { pos: [0, 0.02, 0.08, 0.25, 0.65], sal: [0.02, 0.08, 0.35, 0.55] }
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
        { node: "ENG", kind: "continuous", role: "salience", weight: 0.2, touchType: "identity_proxy" }
      ],
      sliderMap: {
        "0-20": { continuous: { PF: { sal: [0.7, 0.22, 0.07, 0.01] } } },
        "21-40": { continuous: { PF: { sal: [0.25, 0.45, 0.22, 0.08] } } },
        "41-60": { continuous: { PF: { sal: [0.08, 0.3, 0.4, 0.22] } } },
        "61-80": { continuous: { PF: { sal: [0.02, 0.1, 0.38, 0.5] } } },
        "81-100": { continuous: { PF: { sal: [0, 0.03, 0.22, 0.75] } } }
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
        { node: "EPS", kind: "categorical", role: "category", weight: 0.8, touchType: "taste_proxy" },
        { node: "AES", kind: "categorical", role: "category", weight: 0.45, touchType: "style_proxy" },
        { node: "ENG", kind: "continuous", role: "salience", weight: 0.15, touchType: "attention_proxy" }
      ],
      optionEvidence: {
        timeless_principles: {
          categorical: { EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.1, 0.25, 0.4, 0.25] } }
        },
        weird_science: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.1, 0.2, 0.4, 0.3] },
            AES: { cat: AES_PROTOTYPES.visionary, sal: [0.15, 0.25, 0.35, 0.25] }
          }
        },
        practical_tips: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.2, 0.35, 0.3, 0.15] },
            AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.2, 0.35, 0.3, 0.15] }
          }
        },
        other_side_bad: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.05, 0.2, 0.4, 0.35] },
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
        { node: "ONT_S", kind: "continuous", role: "position", weight: 0.55, touchType: "causal_allocation" }
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
      quality: 0.9,
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
        { node: "PRO", kind: "continuous", role: "position", weight: 0.8, touchType: "rights_tradeoff" },
        { node: "COM", kind: "continuous", role: "position", weight: 0.35, touchType: "civic_balance" },
        { node: "EPS", kind: "categorical", role: "category", weight: 0.15, touchType: "truth_authority_proxy" }
      ],
      optionEvidence: {
        cancel: {
          continuous: {
            PRO: { pos: [0.55, 0.3, 0.1, 0.04, 0.01], sal: [0.05, 0.15, 0.4, 0.4] },
            COM: { pos: [0.4, 0.3, 0.15, 0.1, 0.05], sal: [0.1, 0.2, 0.4, 0.3] }
          }
        },
        restricted: {
          continuous: {
            PRO: { pos: [0.3, 0.35, 0.2, 0.1, 0.05], sal: [0.1, 0.2, 0.4, 0.3] },
            COM: { pos: [0.2, 0.25, 0.3, 0.15, 0.1], sal: [0.1, 0.25, 0.4, 0.25] }
          }
        },
        allow_with_counterspeech: {
          continuous: {
            PRO: { pos: [0.1, 0.2, 0.35, 0.25, 0.1], sal: [0.1, 0.2, 0.4, 0.3] },
            COM: { pos: [0.05, 0.1, 0.2, 0.35, 0.3], sal: [0.08, 0.17, 0.4, 0.35] }
          }
        },
        allow_no_restrictions: {
          continuous: {
            PRO: { pos: [0.01, 0.04, 0.1, 0.3, 0.55], sal: [0.05, 0.15, 0.4, 0.4] },
            COM: { pos: [0.1, 0.15, 0.2, 0.25, 0.3], sal: [0.15, 0.25, 0.35, 0.25] }
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
        { node: "EPS", kind: "categorical", role: "category", weight: 0.7, touchType: "authority_ranking" },
        { node: "PRO", kind: "continuous", role: "position", weight: 0.25, touchType: "governance_priority" }
      ],
      rankingMap: {
        researchers: { categorical: { EPS: EPS_PROTOTYPES.empiricist } },
        organized_residents: { categorical: { EPS: EPS_PROTOTYPES.autonomous } },
        elected_officials: { continuous: { PRO: 0.4 } },
        elders_religious: {
          categorical: {
            EPS: EPS_PROTOTYPES.traditionalist
          }
        },
        business_stakeholders: {
          categorical: { EPS: EPS_PROTOTYPES.institutionalist },
          continuous: { PRO: -0.3 }
        }
      }
    },
    {
      id: 24,
      stage: "screen20",
      section: "III",
      promptShort: "child_traits",
      uiType: "pairwise",
      quality: 0.9,
      rewriteNeeded: false,
      touchProfile: [
        { node: "ONT_H", kind: "continuous", role: "position", weight: 0.2, touchType: "human_nature_proxy" }
      ],
      pairMaps: {
        independence_vs_elders: {
          independence: {
            continuous: { ONT_H: 0.6 },
            categorical: { EPS: EPS_PROTOTYPES.autonomous, AES: AES_PROTOTYPES.authentic }
          },
          respect_for_elders: {
            continuous: { ONT_H: -0.6 },
            categorical: { EPS: EPS_PROTOTYPES.traditionalist, AES: AES_PROTOTYPES.pastoral }
          }
        },
        obedience_vs_self_reliance: {
          obedience: {
            continuous: { ONT_H: -0.5 },
            categorical: { EPS: EPS_PROTOTYPES.institutionalist, AES: AES_PROTOTYPES.statesman }
          },
          self_reliance: {
            continuous: { ONT_H: 0.5 },
            categorical: { EPS: EPS_PROTOTYPES.empiricist, AES: AES_PROTOTYPES.technocrat }
          }
        }
      }
    },
    {
      id: 39,
      stage: "screen20",
      section: "IV",
      promptShort: "opponent_model_allocation",
      uiType: "allocation",
      quality: 0.9,
      rewriteNeeded: false,
      touchProfile: [
        { node: "TRB", kind: "continuous", role: "position", weight: 0.75, touchType: "outgroup_model" },
        { node: "COM", kind: "continuous", role: "position", weight: 0.45, touchType: "outgroup_model" },
        { node: "ONT_H", kind: "continuous", role: "position", weight: 0.3, touchType: "motive_model" }
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
        { node: "AES", kind: "categorical", role: "category", weight: 0.9, touchType: "leader_style" },
        { node: "PRO", kind: "continuous", role: "position", weight: 0.2, touchType: "governance_style" },
        { node: "ENG", kind: "continuous", role: "salience", weight: 0.1, touchType: "mobilization_proxy" }
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
        { node: "TRB", kind: "continuous", role: "position", weight: 0.7, touchType: "identity_ranking" },
        { node: "PF", kind: "continuous", role: "salience", weight: 0.4, touchType: "identity_ranking" },
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
      quality: 0.9,
      rewriteNeeded: false,
      touchProfile: [
        { node: "CD", kind: "continuous", role: "position", weight: 0.9, touchType: "direct_placement" },
        { node: "CU", kind: "continuous", role: "position", weight: 0.3, touchType: "boundary_proxy" },
        { node: "MOR", kind: "continuous", role: "position", weight: 0.2, touchType: "values_proxy" }
      ],
      sliderMap: {
        "0-20": { continuous: { CD: { pos: [0.6, 0.25, 0.1, 0.04, 0.01], sal: [0.08, 0.2, 0.4, 0.32] } } },
        "21-40": { continuous: { CD: { pos: [0.3, 0.4, 0.2, 0.07, 0.03], sal: [0.1, 0.25, 0.38, 0.27] } } },
        "41-60": { continuous: { CD: { pos: [0.08, 0.2, 0.44, 0.2, 0.08], sal: [0.15, 0.3, 0.35, 0.2] } } },
        "61-80": { continuous: { CD: { pos: [0.03, 0.07, 0.2, 0.4, 0.3], sal: [0.1, 0.25, 0.38, 0.27] } } },
        "81-100": { continuous: { CD: { pos: [0.01, 0.04, 0.1, 0.25, 0.6], sal: [0.08, 0.2, 0.4, 0.32] } } }
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
        { node: "CD", kind: "continuous", role: "salience", weight: 0.9, touchType: "direct_salience" },
        { node: "CU", kind: "continuous", role: "salience", weight: 0.45, touchType: "boundary_salience" },
        { node: "MOR", kind: "continuous", role: "salience", weight: 0.2, touchType: "values_salience" }
      ],
      sliderMap: {
        "0-20": { continuous: { CD: { sal: [0.55, 0.3, 0.12, 0.03] }, CU: { sal: [0.5, 0.3, 0.15, 0.05] }, MOR: { sal: [0.5, 0.3, 0.15, 0.05] } } },
        "21-40": { continuous: { CD: { sal: [0.3, 0.4, 0.22, 0.08] }, CU: { sal: [0.3, 0.35, 0.25, 0.1] }, MOR: { sal: [0.3, 0.35, 0.25, 0.1] } } },
        "41-60": { continuous: { CD: { sal: [0.1, 0.3, 0.38, 0.22] }, CU: { sal: [0.12, 0.28, 0.38, 0.22] }, MOR: { sal: [0.15, 0.3, 0.35, 0.2] } } },
        "61-80": { continuous: { CD: { sal: [0.04, 0.12, 0.38, 0.46] }, CU: { sal: [0.05, 0.15, 0.38, 0.42] }, MOR: { sal: [0.08, 0.2, 0.38, 0.34] } } },
        "81-100": { continuous: { CD: { sal: [0.02, 0.08, 0.3, 0.6] }, CU: { sal: [0.03, 0.1, 0.32, 0.55] }, MOR: { sal: [0.05, 0.12, 0.35, 0.48] } } }
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
        { node: "MOR", kind: "continuous", role: "position", weight: 0.9, touchType: "moral_scope_tradeoff" },
        { node: "TRB", kind: "continuous", role: "position", weight: 0.25, touchType: "moral_scope_tradeoff" },
        { node: "ZS", kind: "continuous", role: "position", weight: 0.15, touchType: "moral_scope_tradeoff" }
      ],
      sliderMap: {
        "0-20": { continuous: { MOR: { pos: [0.55, 0.28, 0.12, 0.04, 0.01], sal: [0.08, 0.2, 0.4, 0.32] } } },
        "21-40": { continuous: { MOR: { pos: [0.25, 0.4, 0.22, 0.1, 0.03], sal: [0.1, 0.25, 0.38, 0.27] } } },
        "41-60": { continuous: { MOR: { pos: [0.08, 0.18, 0.48, 0.18, 0.08], sal: [0.12, 0.28, 0.38, 0.22] } } },
        "61-80": { continuous: { MOR: { pos: [0.03, 0.1, 0.22, 0.4, 0.25], sal: [0.1, 0.25, 0.38, 0.27] } } },
        "81-100": { continuous: { MOR: { pos: [0.01, 0.04, 0.12, 0.28, 0.55], sal: [0.08, 0.2, 0.4, 0.32] } } }
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
        { node: "ENG", kind: "continuous", role: "position", weight: 0.1, touchType: "policy_attention" }
      ],
      sliderMap: {
        "0-20": { categorical: { EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.15, 0.3, 0.35, 0.2] } } },
        "21-40": { categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.1, 0.25, 0.4, 0.25] } } },
        "41-60": { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.12, 0.28, 0.38, 0.22] } } },
        "61-80": { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.15, 0.3, 0.35, 0.2] } } },
        "81-100": { categorical: { EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.15, 0.3, 0.35, 0.2] } } }
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
        "0-20": { continuous: { MAT: { pos: [0.6, 0.25, 0.1, 0.04, 0.01], sal: [0.05, 0.15, 0.4, 0.4] } } },
        "21-40": { continuous: { MAT: { pos: [0.3, 0.4, 0.2, 0.07, 0.03], sal: [0.08, 0.22, 0.4, 0.3] } } },
        "41-60": { continuous: { MAT: { pos: [0.08, 0.18, 0.48, 0.18, 0.08], sal: [0.1, 0.25, 0.38, 0.27] } } },
        "61-80": { continuous: { MAT: { pos: [0.03, 0.07, 0.2, 0.4, 0.3], sal: [0.08, 0.22, 0.4, 0.3] } } },
        "81-100": { continuous: { MAT: { pos: [0.01, 0.04, 0.1, 0.25, 0.6], sal: [0.05, 0.15, 0.4, 0.4] } } }
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
        "0-20": { continuous: { ONT_H: { sal: [0.55, 0.3, 0.12, 0.03] } } },
        "21-40": { continuous: { ONT_H: { sal: [0.25, 0.4, 0.25, 0.1] } } },
        "41-60": { continuous: { ONT_H: { sal: [0.08, 0.28, 0.4, 0.24] } } },
        "61-80": { continuous: { ONT_H: { sal: [0.03, 0.12, 0.4, 0.45] } } },
        "81-100": { continuous: { ONT_H: { sal: [0.02, 0.08, 0.3, 0.6] } } }
      }
    },
    // Q32 — mainstream_media_accuracy_estimate (slider)
    {
      id: 32,
      stage: "stage3",
      section: "III",
      promptShort: "mainstream_media_accuracy_estimate",
      uiType: "slider",
      quality: 0.4,
      rewriteNeeded: true,
      touchProfile: [
        { node: "EPS", kind: "categorical", role: "category", weight: 0.4, touchType: "institutional_trust_proxy" },
        { node: "TRB", kind: "continuous", role: "position", weight: 0.15, touchType: "trust_hostility_proxy" }
      ],
      sliderMap: {
        "0-20": { categorical: { EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.1, 0.25, 0.38, 0.27] } } },
        "21-40": { categorical: { EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.12, 0.28, 0.38, 0.22] } } },
        "41-60": { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.15, 0.3, 0.35, 0.2] } } },
        "61-80": { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.15, 0.3, 0.35, 0.2] } } },
        "81-100": { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.15, 0.3, 0.35, 0.2] } } }
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
        { node: "TRB", kind: "continuous", role: "position", weight: 0.8, touchType: "outgroup_trust_estimate" },
        { node: "COM", kind: "continuous", role: "position", weight: 0.35, touchType: "outgroup_trust_estimate" },
        { node: "ZS", kind: "continuous", role: "position", weight: 0.15, touchType: "outgroup_trust_estimate" }
      ],
      sliderMap: {
        "0-20": { continuous: { TRB: { pos: [0.55, 0.28, 0.12, 0.04, 0.01], sal: [0.05, 0.15, 0.38, 0.42] }, ZS: { sal: [0.08, 0.2, 0.38, 0.34] } } },
        "21-40": { continuous: { TRB: { pos: [0.3, 0.38, 0.2, 0.09, 0.03], sal: [0.08, 0.2, 0.4, 0.32] }, ZS: { sal: [0.1, 0.25, 0.38, 0.27] } } },
        "41-60": { continuous: { TRB: { pos: [0.08, 0.18, 0.48, 0.18, 0.08], sal: [0.1, 0.25, 0.38, 0.27] }, ZS: { sal: [0.15, 0.3, 0.35, 0.2] } } },
        "61-80": { continuous: { TRB: { pos: [0.03, 0.09, 0.2, 0.38, 0.3], sal: [0.08, 0.2, 0.4, 0.32] }, ZS: { sal: [0.15, 0.3, 0.35, 0.2] } } },
        "81-100": { continuous: { TRB: { pos: [0.01, 0.04, 0.12, 0.28, 0.55], sal: [0.05, 0.15, 0.38, 0.42] }, ZS: { sal: [0.15, 0.3, 0.35, 0.2] } } }
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
        "0-20": { continuous: { PRO: { sal: [0.55, 0.3, 0.12, 0.03] } } },
        "21-40": { continuous: { PRO: { sal: [0.25, 0.4, 0.25, 0.1] } } },
        "41-60": { continuous: { PRO: { sal: [0.08, 0.28, 0.4, 0.24] } } },
        "61-80": { continuous: { PRO: { sal: [0.03, 0.12, 0.4, 0.45] } } },
        "81-100": { continuous: { PRO: { sal: [0.02, 0.08, 0.3, 0.6] } } }
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
        { node: "PF", kind: "continuous", role: "salience", weight: 0.7, touchType: "identity_enemy_link" },
        { node: "TRB", kind: "continuous", role: "salience", weight: 0.45, touchType: "identity_enemy_link" }
      ],
      sliderMap: {
        "0-20": { continuous: { PF: { sal: [0.5, 0.3, 0.15, 0.05] }, TRB: { sal: [0.55, 0.3, 0.12, 0.03] } } },
        "21-40": { continuous: { PF: { sal: [0.25, 0.38, 0.27, 0.1] }, TRB: { sal: [0.25, 0.4, 0.25, 0.1] } } },
        "41-60": { continuous: { PF: { sal: [0.1, 0.25, 0.4, 0.25] }, TRB: { sal: [0.1, 0.28, 0.38, 0.24] } } },
        "61-80": { continuous: { PF: { sal: [0.04, 0.12, 0.38, 0.46] }, TRB: { sal: [0.04, 0.14, 0.4, 0.42] } } },
        "81-100": { continuous: { PF: { sal: [0.02, 0.08, 0.3, 0.6] }, TRB: { sal: [0.02, 0.08, 0.35, 0.55] } } }
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
        { node: "EPS", kind: "categorical", role: "category", weight: 0.2, touchType: "updating_proxy" },
        { node: "PF", kind: "continuous", role: "position", weight: 0.1, touchType: "identity_rigidity_proxy" }
      ],
      sliderMap: {
        "0-20": { categorical: { EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.2, 0.3, 0.32, 0.18] } } },
        "21-40": { categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.2, 0.3, 0.32, 0.18] } } },
        "41-60": { categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.18, 0.3, 0.34, 0.18] } } },
        "61-80": { categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.15, 0.28, 0.35, 0.22] } } },
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
      quality: 0.3,
      rewriteNeeded: false,
      touchProfile: [
        { node: "PF", kind: "continuous", role: "salience", weight: 0.05, touchType: "background_context" },
        { node: "COM", kind: "continuous", role: "position", weight: 0.05, touchType: "background_context" },
        { node: "TRB", kind: "continuous", role: "position", weight: 0.05, touchType: "background_context" }
      ],
      sliderMap: {
        "0-20": { continuous: { COM: { pos: [0.28, 0.27, 0.22, 0.14, 0.09] }, TRB: { pos: [0.12, 0.18, 0.28, 0.25, 0.17] } } },
        "21-40": { continuous: { COM: { pos: [0.22, 0.28, 0.25, 0.16, 0.09] }, TRB: { pos: [0.14, 0.2, 0.28, 0.22, 0.16] } } },
        "41-60": { continuous: { COM: { pos: [0.15, 0.22, 0.3, 0.2, 0.13] }, TRB: { pos: [0.17, 0.22, 0.28, 0.2, 0.13] } } },
        "61-80": { continuous: { COM: { pos: [0.09, 0.16, 0.25, 0.28, 0.22] }, TRB: { pos: [0.18, 0.23, 0.28, 0.18, 0.13] } } },
        "81-100": { continuous: { COM: { pos: [0.06, 0.12, 0.22, 0.3, 0.3] }, TRB: { pos: [0.2, 0.24, 0.26, 0.18, 0.12] } } }
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
        { node: "ONT_S", kind: "continuous", role: "salience", weight: 0.2, touchType: "progress_salience" }
      ],
      sliderMap: {
        "0-20": { continuous: { ONT_H: { sal: [0.55, 0.3, 0.12, 0.03] }, ONT_S: { sal: [0.5, 0.3, 0.15, 0.05] } } },
        "21-40": { continuous: { ONT_H: { sal: [0.25, 0.4, 0.25, 0.1] }, ONT_S: { sal: [0.28, 0.38, 0.24, 0.1] } } },
        "41-60": { continuous: { ONT_H: { sal: [0.08, 0.28, 0.4, 0.24] }, ONT_S: { sal: [0.12, 0.28, 0.38, 0.22] } } },
        "61-80": { continuous: { ONT_H: { sal: [0.03, 0.12, 0.4, 0.45] }, ONT_S: { sal: [0.05, 0.18, 0.4, 0.37] } } },
        "81-100": { continuous: { ONT_H: { sal: [0.02, 0.08, 0.3, 0.6] }, ONT_S: { sal: [0.03, 0.12, 0.35, 0.5] } } }
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
        { node: "CU", kind: "continuous", role: "salience", weight: 0.9, touchType: "direct_salience" },
        { node: "CD", kind: "continuous", role: "salience", weight: 0.25, touchType: "direct_salience" },
        { node: "TRB", kind: "continuous", role: "salience", weight: 0.2, touchType: "identity_salience" },
        { node: "TRB_ANCHOR", kind: "derived", role: "anchor", weight: 0.25, touchType: "nationality_anchor" }
      ],
      sliderMap: {
        "0-20": { continuous: { CU: { sal: [0.55, 0.3, 0.12, 0.03] }, CD: { sal: [0.5, 0.3, 0.15, 0.05] }, TRB: { sal: [0.5, 0.3, 0.15, 0.05] } } },
        "21-40": { continuous: { CU: { sal: [0.25, 0.4, 0.25, 0.1] }, CD: { sal: [0.28, 0.38, 0.24, 0.1] }, TRB: { sal: [0.28, 0.38, 0.24, 0.1] } } },
        "41-60": { continuous: { CU: { sal: [0.08, 0.28, 0.4, 0.24] }, CD: { sal: [0.12, 0.28, 0.38, 0.22] }, TRB: { sal: [0.12, 0.28, 0.38, 0.22] } } },
        "61-80": { continuous: { CU: { sal: [0.03, 0.12, 0.4, 0.45] }, CD: { sal: [0.05, 0.18, 0.4, 0.37] }, TRB: { sal: [0.05, 0.18, 0.4, 0.37] } } },
        "81-100": { continuous: { CU: { sal: [0.02, 0.08, 0.3, 0.6] }, CD: { sal: [0.03, 0.12, 0.35, 0.5] }, TRB: { sal: [0.03, 0.12, 0.35, 0.5] } } }
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
        { node: "ONT_H", kind: "continuous", role: "position", weight: 0.15, touchType: "policy_bundle" }
      ],
      optionEvidence: {
        due_process_priority: {
          continuous: {
            PRO: { pos: [0.02, 0.08, 0.2, 0.38, 0.32] },
            ONT_H: { pos: [0.05, 0.12, 0.3, 0.33, 0.2] }
          }
        },
        balanced_security: {
          continuous: {
            PRO: { pos: [0.08, 0.2, 0.44, 0.2, 0.08] }
          }
        },
        security_priority: {
          continuous: {
            PRO: { pos: [0.32, 0.38, 0.2, 0.08, 0.02] },
            ONT_H: { pos: [0.2, 0.33, 0.3, 0.12, 0.05] }
          }
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
        { node: "PRO", kind: "continuous", role: "position", weight: 0.2, touchType: "principle_tradeoff" }
      ],
      optionEvidence: {
        principle_first: {
          continuous: {
            COM: { pos: [0.02, 0.08, 0.2, 0.38, 0.32], sal: [0.03, 0.12, 0.4, 0.45] }
          }
        },
        coalition_first: {
          continuous: {
            COM: { pos: [0.32, 0.38, 0.2, 0.08, 0.02], sal: [0.03, 0.12, 0.4, 0.45] }
          }
        },
        depends_on_issue: {
          continuous: {
            COM: { pos: [0.08, 0.18, 0.42, 0.22, 0.1], sal: [0.1, 0.25, 0.38, 0.27] }
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
        { node: "ENG", kind: "continuous", role: "position", weight: 0.6, touchType: "social_behavior" },
        { node: "COM", kind: "continuous", role: "position", weight: 0.45, touchType: "social_behavior" },
        { node: "PF", kind: "continuous", role: "salience", weight: 0.15, touchType: "social_behavior" }
      ],
      optionEvidence: {
        avoid_entirely: {
          continuous: {
            ENG: { pos: [0.4, 0.3, 0.18, 0.08, 0.04] },
            COM: { pos: [0.08, 0.15, 0.28, 0.3, 0.19], sal: [0.1, 0.22, 0.38, 0.3] }
          }
        },
        discuss_if_comes_up: {
          continuous: {
            ENG: { pos: [0.08, 0.22, 0.4, 0.22, 0.08] },
            COM: { pos: [0.06, 0.12, 0.3, 0.32, 0.2], sal: [0.08, 0.2, 0.4, 0.32] }
          }
        },
        actively_bring_up: {
          continuous: {
            ENG: { pos: [0.02, 0.06, 0.15, 0.35, 0.42] },
            COM: { pos: [0.15, 0.22, 0.28, 0.22, 0.13], sal: [0.05, 0.18, 0.4, 0.37] }
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
        { node: "PRO", kind: "continuous", role: "position", weight: 0.2, touchType: "policy_bundle" },
        { node: "ONT_S", kind: "continuous", role: "position", weight: 0.2, touchType: "policy_bundle" },
        { node: "ZS", kind: "continuous", role: "position", weight: 0.1, touchType: "policy_bundle" }
      ],
      optionEvidence: {
        aggressive_transition: {
          continuous: {
            MAT: { pos: [0.02, 0.08, 0.2, 0.35, 0.35] },
            ONT_S: { pos: [0.03, 0.1, 0.25, 0.35, 0.27] }
          }
        },
        gradual_transition: {
          continuous: {
            MAT: { pos: [0.08, 0.18, 0.4, 0.24, 0.1] },
            ONT_S: { pos: [0.08, 0.18, 0.4, 0.24, 0.1] }
          }
        },
        market_led: {
          continuous: {
            MAT: { pos: [0.3, 0.35, 0.22, 0.09, 0.04] },
            ONT_S: { pos: [0.2, 0.3, 0.3, 0.14, 0.06] }
          }
        },
        no_action_needed: {
          continuous: {
            MAT: { pos: [0.45, 0.3, 0.15, 0.07, 0.03] },
            ONT_S: { pos: [0.3, 0.3, 0.25, 0.1, 0.05] }
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
        { node: "MOR", kind: "continuous", role: "position", weight: 0.2, touchType: "fairness_design" },
        { node: "PRO", kind: "continuous", role: "position", weight: 0.15, touchType: "allocation_rule" }
      ],
      optionEvidence: {
        strict_merit: {
          continuous: {
            MAT: { pos: [0.5, 0.3, 0.13, 0.05, 0.02] },
            MOR: { pos: [0.35, 0.3, 0.22, 0.09, 0.04] }
          }
        },
        holistic_review: {
          continuous: {
            MAT: { pos: [0.05, 0.15, 0.35, 0.3, 0.15] },
            MOR: { pos: [0.05, 0.12, 0.3, 0.33, 0.2] }
          }
        },
        affirmative_action: {
          continuous: {
            MAT: { pos: [0.02, 0.06, 0.18, 0.34, 0.4] },
            MOR: { pos: [0.03, 0.08, 0.22, 0.35, 0.32] }
          }
        },
        lottery: {
          continuous: {
            MAT: { pos: [0.08, 0.15, 0.3, 0.28, 0.19] }
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
      quality: 0.4,
      rewriteNeeded: true,
      touchProfile: [
        { node: "PRO", kind: "continuous", role: "position", weight: 0.3, touchType: "policy_bundle" },
        { node: "ONT_H", kind: "continuous", role: "position", weight: 0.2, touchType: "policy_bundle" },
        { node: "COM", kind: "continuous", role: "position", weight: 0.1, touchType: "policy_bundle" }
      ],
      optionEvidence: {
        rehabilitation_focus: {
          continuous: {
            PRO: { pos: [0.05, 0.12, 0.25, 0.35, 0.23] },
            ONT_H: { pos: [0.04, 0.1, 0.25, 0.38, 0.23] }
          }
        },
        balanced_approach: {
          continuous: {
            PRO: { pos: [0.1, 0.2, 0.4, 0.2, 0.1] }
          }
        },
        punishment_focus: {
          continuous: {
            PRO: { pos: [0.3, 0.35, 0.22, 0.09, 0.04] },
            ONT_H: { pos: [0.25, 0.33, 0.25, 0.12, 0.05] }
          }
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
        { node: "MAT", kind: "continuous", role: "position", weight: 0.9, touchType: "fairness_threshold" }
      ],
      optionEvidence: {
        ratio_10_to_1: {
          continuous: {
            MAT: { pos: [0.01, 0.04, 0.15, 0.35, 0.45], sal: [0.05, 0.15, 0.38, 0.42] }
          }
        },
        ratio_50_to_1: {
          continuous: {
            MAT: { pos: [0.04, 0.12, 0.35, 0.32, 0.17], sal: [0.08, 0.22, 0.4, 0.3] }
          }
        },
        ratio_200_to_1: {
          continuous: {
            MAT: { pos: [0.2, 0.35, 0.28, 0.12, 0.05], sal: [0.1, 0.25, 0.38, 0.27] }
          }
        },
        market_decides: {
          continuous: {
            MAT: { pos: [0.45, 0.3, 0.15, 0.07, 0.03], sal: [0.08, 0.2, 0.38, 0.34] }
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
        { node: "ONT_H", kind: "continuous", role: "position", weight: 0.9, touchType: "ontology_direct" },
        { node: "ONT_H", kind: "continuous", role: "salience", weight: 0.2, touchType: "ontology_direct" },
        { node: "ONT_S", kind: "continuous", role: "position", weight: 0.15, touchType: "worldview_proxy" }
      ],
      optionEvidence: {
        steady_improvement: {
          continuous: {
            ONT_H: { pos: [0.01, 0.05, 0.15, 0.38, 0.41], sal: [0.05, 0.15, 0.4, 0.4] }
          }
        },
        gradual_progress: {
          continuous: {
            ONT_H: { pos: [0.04, 0.12, 0.3, 0.35, 0.19], sal: [0.08, 0.22, 0.4, 0.3] }
          }
        },
        cyclical: {
          continuous: {
            ONT_H: { pos: [0.15, 0.25, 0.35, 0.18, 0.07], sal: [0.08, 0.22, 0.4, 0.3] }
          }
        },
        decline: {
          continuous: {
            ONT_H: { pos: [0.42, 0.3, 0.18, 0.07, 0.03], sal: [0.05, 0.15, 0.38, 0.42] }
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
        { node: "ONT_H", kind: "continuous", role: "position", weight: 0.15, touchType: "human_motive_proxy" }
      ],
      optionEvidence: {
        rather_free_guilty: {
          continuous: {
            PRO: { pos: [0.02, 0.08, 0.2, 0.35, 0.35], sal: [0.05, 0.15, 0.4, 0.4] }
          }
        },
        balance_both_errors: {
          continuous: {
            PRO: { pos: [0.1, 0.22, 0.36, 0.22, 0.1], sal: [0.1, 0.25, 0.38, 0.27] }
          }
        },
        rather_convict_innocent: {
          continuous: {
            PRO: { pos: [0.35, 0.35, 0.2, 0.08, 0.02], sal: [0.05, 0.15, 0.4, 0.4] }
          }
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
        { node: "AES", kind: "categorical", role: "category", weight: 0.1, touchType: "taste_proxy" }
      ],
      optionEvidence: {
        new_place: {
          continuous: {
            ONT_H: { pos: [0.05, 0.12, 0.28, 0.33, 0.22] }
          },
          categorical: { AES: { cat: AES_PROTOTYPES.visionary, sal: [0.2, 0.3, 0.32, 0.18] } }
        },
        familiar_place: {
          continuous: {
            ONT_H: { pos: [0.22, 0.33, 0.28, 0.12, 0.05] }
          },
          categorical: { AES: { cat: AES_PROTOTYPES.pastoral, sal: [0.2, 0.3, 0.32, 0.18] } }
        },
        mix_both: {
          continuous: {
            ONT_H: { pos: [0.1, 0.2, 0.4, 0.2, 0.1] }
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
        { node: "MAT", kind: "continuous", role: "position", weight: 0.7, touchType: "error_asymmetry" },
        { node: "PRO", kind: "continuous", role: "position", weight: 0.25, touchType: "error_asymmetry" },
        { node: "MOR", kind: "continuous", role: "position", weight: 0.2, touchType: "deservingness_proxy" }
      ],
      optionEvidence: {
        rather_help_undeserving: {
          continuous: {
            MAT: { pos: [0.02, 0.08, 0.22, 0.35, 0.33], sal: [0.05, 0.15, 0.4, 0.4] },
            MOR: { pos: [0.03, 0.1, 0.25, 0.35, 0.27], sal: [0.08, 0.2, 0.4, 0.32] }
          }
        },
        balanced_errors: {
          continuous: {
            MAT: { pos: [0.1, 0.22, 0.36, 0.22, 0.1], sal: [0.1, 0.25, 0.38, 0.27] },
            MOR: { pos: [0.1, 0.2, 0.4, 0.2, 0.1] }
          }
        },
        rather_miss_needy: {
          continuous: {
            MAT: { pos: [0.33, 0.35, 0.22, 0.08, 0.02], sal: [0.05, 0.15, 0.4, 0.4] },
            MOR: { pos: [0.27, 0.35, 0.25, 0.1, 0.03], sal: [0.08, 0.2, 0.4, 0.32] }
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
        { node: "COM", kind: "continuous", role: "position", weight: 0.1, touchType: "collective_action_proxy" }
      ],
      optionEvidence: {
        accept_mandate: {
          continuous: {
            PRO: { pos: [0.25, 0.32, 0.25, 0.12, 0.06] },
            CU: { pos: [0.04, 0.1, 0.25, 0.35, 0.26] }
          }
        },
        comply_reluctantly: {
          continuous: {
            PRO: { pos: [0.1, 0.2, 0.4, 0.2, 0.1] },
            CU: { pos: [0.1, 0.2, 0.35, 0.25, 0.1] }
          }
        },
        resist_mandate: {
          continuous: {
            PRO: { pos: [0.04, 0.1, 0.2, 0.32, 0.34] },
            CU: { pos: [0.28, 0.3, 0.25, 0.12, 0.05] }
          }
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
      quality: 0.9,
      rewriteNeeded: false,
      touchProfile: [
        { node: "PRO", kind: "continuous", role: "position", weight: 0.7, touchType: "speech_harm_tradeoff" },
        { node: "EPS", kind: "categorical", role: "category", weight: 0.25, touchType: "truth_authority_proxy" },
        { node: "COM", kind: "continuous", role: "position", weight: 0.2, touchType: "pluralism_proxy" }
      ],
      optionEvidence: {
        remove_immediately: {
          continuous: {
            PRO: { pos: [0.4, 0.32, 0.18, 0.07, 0.03] }
          },
          categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.08, 0.2, 0.4, 0.32] } }
        },
        allow_with_labels: {
          continuous: {
            PRO: { pos: [0.08, 0.2, 0.4, 0.22, 0.1] }
          },
          categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.1, 0.25, 0.38, 0.27] } }
        },
        allow_fully: {
          continuous: {
            PRO: { pos: [0.02, 0.06, 0.15, 0.35, 0.42] }
          },
          categorical: { EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.08, 0.2, 0.38, 0.34] } }
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
      quality: 0.9,
      rewriteNeeded: false,
      touchProfile: [
        { node: "ZS", kind: "continuous", role: "position", weight: 0.85, touchType: "macro_sum_view" },
        { node: "ONT_S", kind: "continuous", role: "position", weight: 0.45, touchType: "systems_view" },
        { node: "MAT", kind: "continuous", role: "position", weight: 0.2, touchType: "distribution_proxy" }
      ],
      optionEvidence: {
        net_positive_clear: {
          continuous: {
            ZS: { pos: [0.41, 0.38, 0.15, 0.05, 0.01], sal: [0.05, 0.15, 0.4, 0.4] },
            ONT_S: { pos: [0.03, 0.1, 0.25, 0.38, 0.24], sal: [0.08, 0.2, 0.4, 0.32] }
          }
        },
        net_positive_but_uneven: {
          continuous: {
            ZS: { pos: [0.15, 0.3, 0.35, 0.15, 0.05], sal: [0.08, 0.2, 0.4, 0.32] },
            ONT_S: { pos: [0.05, 0.15, 0.4, 0.28, 0.12], sal: [0.08, 0.22, 0.4, 0.3] }
          }
        },
        mixed_effects: {
          continuous: {
            ZS: { pos: [0.07, 0.18, 0.35, 0.25, 0.15], sal: [0.1, 0.25, 0.38, 0.27] },
            ONT_S: { pos: [0.1, 0.22, 0.4, 0.2, 0.08] }
          }
        },
        mostly_harmful: {
          continuous: {
            ZS: { pos: [0.03, 0.07, 0.18, 0.3, 0.42], sal: [0.05, 0.15, 0.4, 0.4] },
            ONT_S: { pos: [0.25, 0.3, 0.28, 0.12, 0.05] }
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
        { node: "MOR", kind: "continuous", role: "position", weight: 0.2, touchType: "moral_scope_boundary" }
      ],
      optionEvidence: {
        open_borders: {
          continuous: {
            CU: { pos: [0.01, 0.04, 0.12, 0.33, 0.5], sal: [0.05, 0.15, 0.38, 0.42] },
            MOR: { pos: [0.02, 0.08, 0.2, 0.35, 0.35], sal: [0.08, 0.2, 0.4, 0.32] }
          }
        },
        generous_policy: {
          continuous: {
            CU: { pos: [0.04, 0.12, 0.25, 0.35, 0.24], sal: [0.08, 0.2, 0.4, 0.32] },
            MOR: { pos: [0.05, 0.12, 0.28, 0.33, 0.22] }
          }
        },
        balanced_approach: {
          continuous: {
            CU: { pos: [0.1, 0.22, 0.38, 0.22, 0.08], sal: [0.1, 0.25, 0.38, 0.27] },
            MOR: { pos: [0.1, 0.2, 0.4, 0.2, 0.1] }
          }
        },
        strict_enforcement: {
          continuous: {
            CU: { pos: [0.4, 0.3, 0.18, 0.08, 0.04], sal: [0.05, 0.15, 0.38, 0.42] },
            MOR: { pos: [0.3, 0.3, 0.25, 0.1, 0.05], sal: [0.08, 0.2, 0.4, 0.32] }
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
        { node: "TRB", kind: "continuous", role: "position", weight: 0.2, touchType: "threat_bundle" },
        { node: "CU", kind: "continuous", role: "position", weight: 0.15, touchType: "threat_bundle" },
        { node: "ONT_S", kind: "continuous", role: "position", weight: 0.15, touchType: "threat_bundle" }
      ],
      optionEvidence: {
        external_threats: {
          continuous: {
            ZS: { pos: [0.3, 0.3, 0.25, 0.1, 0.05] },
            TRB: { pos: [0.08, 0.15, 0.28, 0.3, 0.19] }
          }
        },
        internal_division: {
          continuous: {
            ZS: { pos: [0.05, 0.12, 0.3, 0.33, 0.2] },
            TRB: { pos: [0.15, 0.22, 0.3, 0.22, 0.11] }
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
        { node: "EPS", kind: "categorical", role: "category", weight: 0.2, touchType: "expertise_risk_proxy" },
        { node: "ONT_H", kind: "continuous", role: "position", weight: 0.1, touchType: "risk_humanity_proxy" }
      ],
      optionEvidence: {
        prioritize_safety: {
          continuous: {
            PRO: { pos: [0.3, 0.35, 0.22, 0.09, 0.04] }
          },
          categorical: { EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.1, 0.25, 0.38, 0.27] } }
        },
        balanced_timeline: {
          continuous: {
            PRO: { pos: [0.1, 0.22, 0.38, 0.22, 0.08] }
          },
          categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.12, 0.28, 0.38, 0.22] } }
        },
        prioritize_speed: {
          continuous: {
            PRO: { pos: [0.04, 0.09, 0.22, 0.35, 0.3] }
          },
          categorical: { EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.1, 0.25, 0.38, 0.27] } }
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
      quality: 0.8,
      rewriteNeeded: false,
      touchProfile: [
        { node: "PRO", kind: "continuous", role: "position", weight: 0.6, touchType: "rule_response" },
        { node: "COM", kind: "continuous", role: "position", weight: 0.25, touchType: "rule_response" },
        { node: "ENG", kind: "continuous", role: "position", weight: 0.1, touchType: "conflict_response" }
      ],
      optionEvidence: {
        follow_always: {
          continuous: {
            PRO: { pos: [0.4, 0.32, 0.18, 0.07, 0.03] }
          }
        },
        follow_then_advocate: {
          continuous: {
            PRO: { pos: [0.1, 0.25, 0.38, 0.2, 0.07] },
            COM: { pos: [0.05, 0.12, 0.28, 0.33, 0.22] }
          }
        },
        ignore_quietly: {
          continuous: {
            PRO: { pos: [0.04, 0.1, 0.22, 0.35, 0.29] }
          }
        },
        openly_challenge: {
          continuous: {
            PRO: { pos: [0.03, 0.07, 0.18, 0.32, 0.4] },
            COM: { pos: [0.22, 0.28, 0.25, 0.15, 0.1] }
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
      quality: 0.9,
      rewriteNeeded: false,
      touchProfile: [
        { node: "PRO", kind: "continuous", role: "position", weight: 0.7, touchType: "error_asymmetry" },
        { node: "CU", kind: "continuous", role: "position", weight: 0.2, touchType: "boundary_order_proxy" },
        { node: "TRB", kind: "continuous", role: "position", weight: 0.15, touchType: "partisan_fairness_proxy" }
      ],
      optionEvidence: {
        easier_access: {
          continuous: {
            PRO: { pos: [0.04, 0.1, 0.22, 0.34, 0.3] },
            TRB: { pos: [0.15, 0.22, 0.3, 0.22, 0.11], sal: [0.08, 0.22, 0.4, 0.3] }
          }
        },
        balanced_approach: {
          continuous: {
            PRO: { pos: [0.1, 0.22, 0.38, 0.22, 0.08] }
          }
        },
        tighter_security: {
          continuous: {
            PRO: { pos: [0.3, 0.34, 0.22, 0.1, 0.04] },
            TRB: { pos: [0.1, 0.18, 0.28, 0.28, 0.16], sal: [0.08, 0.22, 0.4, 0.3] }
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
        { node: "PF", kind: "continuous", role: "salience", weight: 0.3, touchType: "network_homophily" }
      ],
      optionEvidence: {
        no_big_deal: {
          continuous: {
            TRB: { pos: [0.01, 0.04, 0.15, 0.38, 0.42], sal: [0.05, 0.15, 0.38, 0.42] }
          }
        },
        keep_friendship: {
          continuous: {
            TRB: { pos: [0.04, 0.12, 0.35, 0.3, 0.19], sal: [0.05, 0.18, 0.4, 0.37] }
          }
        },
        distance_somewhat: {
          continuous: {
            TRB: { pos: [0.22, 0.32, 0.28, 0.13, 0.05], sal: [0.03, 0.15, 0.4, 0.42] }
          }
        },
        end_friendship: {
          continuous: {
            TRB: { pos: [0.48, 0.28, 0.15, 0.06, 0.03], sal: [0.02, 0.1, 0.38, 0.5] }
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
        { node: "MAT", kind: "continuous", role: "position", weight: 0.7, touchType: "distributive_choice" },
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
            MAT: { pos: [0.04, 0.12, 0.3, 0.34, 0.2], sal: [0.08, 0.22, 0.4, 0.3] }
          }
        },
        opportunity_society: {
          continuous: {
            MAT: { pos: [0.18, 0.3, 0.32, 0.14, 0.06], sal: [0.08, 0.22, 0.4, 0.3] }
          }
        },
        free_market_society: {
          continuous: {
            MAT: { pos: [0.45, 0.3, 0.15, 0.07, 0.03], sal: [0.05, 0.15, 0.38, 0.42] }
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
        { node: "AES", kind: "categorical", role: "category", weight: 0.2, touchType: "abstract_style" },
        { node: "MOR", kind: "continuous", role: "position", weight: 0.1, touchType: "abstract_style" }
      ],
      optionEvidence: {
        evidence_and_argument: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.15, 0.28, 0.35, 0.22] },
            AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.18, 0.3, 0.32, 0.2] }
          }
        },
        moral_movements: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.15, 0.28, 0.35, 0.22] },
            AES: { cat: AES_PROTOTYPES.pastoral, sal: [0.18, 0.3, 0.32, 0.2] }
          }
        },
        economic_interests: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.18, 0.3, 0.32, 0.2] },
            AES: { cat: AES_PROTOTYPES.statesman, sal: [0.18, 0.3, 0.32, 0.2] }
          }
        },
        power_struggles: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.15, 0.28, 0.35, 0.22] },
            AES: { cat: AES_PROTOTYPES.fighter, sal: [0.18, 0.3, 0.32, 0.2] }
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
        { node: "COM", kind: "continuous", role: "position", weight: 0.7, touchType: "interpersonal_conflict" },
        { node: "ENG", kind: "continuous", role: "position", weight: 0.35, touchType: "interpersonal_conflict" },
        { node: "PF", kind: "continuous", role: "salience", weight: 0.15, touchType: "interpersonal_conflict" }
      ],
      optionEvidence: {
        avoid_if_possible: {
          continuous: {
            COM: { pos: [0.03, 0.1, 0.25, 0.35, 0.27], sal: [0.05, 0.15, 0.4, 0.4] }
          }
        },
        engage_carefully: {
          continuous: {
            COM: { pos: [0.06, 0.15, 0.35, 0.28, 0.16], sal: [0.08, 0.22, 0.4, 0.3] }
          }
        },
        stand_ground: {
          continuous: {
            COM: { pos: [0.2, 0.3, 0.28, 0.15, 0.07], sal: [0.05, 0.15, 0.4, 0.4] }
          }
        },
        enjoy_debate: {
          continuous: {
            COM: { pos: [0.35, 0.3, 0.2, 0.1, 0.05], sal: [0.03, 0.12, 0.4, 0.45] }
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
        { node: "ONT_S", kind: "continuous", role: "position", weight: 0.2, touchType: "progress_worldview" },
        { node: "CD", kind: "continuous", role: "position", weight: 0.1, touchType: "progress_worldview" }
      ],
      optionEvidence: {
        continuous_improvement: {
          continuous: {
            ONT_H: { pos: [0.01, 0.05, 0.15, 0.38, 0.41], sal: [0.05, 0.15, 0.4, 0.4] }
          }
        },
        gradual_improvement: {
          continuous: {
            ONT_H: { pos: [0.04, 0.12, 0.32, 0.34, 0.18], sal: [0.08, 0.22, 0.4, 0.3] }
          }
        },
        stagnation: {
          continuous: {
            ONT_H: { pos: [0.18, 0.28, 0.32, 0.15, 0.07], sal: [0.1, 0.25, 0.38, 0.27] }
          }
        },
        decline: {
          continuous: {
            ONT_H: { pos: [0.42, 0.3, 0.18, 0.07, 0.03], sal: [0.05, 0.15, 0.38, 0.42] }
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
        { node: "CU", kind: "continuous", role: "position", weight: 0.8, touchType: "membership_boundary" },
        { node: "MOR", kind: "continuous", role: "position", weight: 0.2, touchType: "membership_boundary" },
        { node: "PF", kind: "continuous", role: "position", weight: 0.15, touchType: "membership_boundary" },
        { node: "TRB", kind: "continuous", role: "position", weight: 0.2, touchType: "membership_boundary" },
        { node: "TRB_ANCHOR", kind: "derived", role: "anchor", weight: 0.25, touchType: "nationality_anchor" }
      ],
      optionEvidence: {
        civic_participation: {
          continuous: {
            CU: { pos: [0.04, 0.1, 0.28, 0.35, 0.23] }
          }
        },
        shared_values: {
          continuous: {
            CU: { pos: [0.15, 0.25, 0.35, 0.18, 0.07] },
            TRB: { pos: [0.08, 0.15, 0.28, 0.3, 0.19] }
          }
        },
        cultural_heritage: {
          continuous: {
            CU: { pos: [0.3, 0.3, 0.25, 0.1, 0.05] },
            TRB: { pos: [0.05, 0.12, 0.25, 0.33, 0.25] }
          }
        },
        born_here: {
          continuous: {
            CU: { pos: [0.45, 0.28, 0.17, 0.07, 0.03] },
            TRB: { pos: [0.04, 0.1, 0.22, 0.34, 0.3] }
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
            CD: { pos: [0.28, 0.25, 0.22, 0.15, 0.1] },
            MAT: { pos: [0.26, 0.25, 0.22, 0.16, 0.11] }
          }
        },
        moderate_household: {
          continuous: {
            CD: { pos: [0.15, 0.22, 0.3, 0.2, 0.13] },
            MAT: { pos: [0.15, 0.22, 0.3, 0.2, 0.13] }
          }
        },
        very_progressive: {
          continuous: {
            CD: { pos: [0.1, 0.15, 0.22, 0.25, 0.28] },
            MAT: { pos: [0.11, 0.16, 0.22, 0.25, 0.26] }
          }
        },
        not_political: {
          continuous: {
            CD: { pos: [0.18, 0.22, 0.25, 0.2, 0.15] }
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
      quality: 0.4,
      rewriteNeeded: false,
      touchProfile: [
        { node: "MOR", kind: "continuous", role: "position", weight: 0.1, touchType: "background_context" },
        { node: "CD", kind: "continuous", role: "position", weight: 0.1, touchType: "background_context" },
        { node: "TRB", kind: "continuous", role: "position", weight: 0.1, touchType: "background_context" },
        { node: "TRB_ANCHOR", kind: "derived", role: "anchor", weight: 0.35, touchType: "religious_anchor" }
      ],
      optionEvidence: {
        very_religious: {
          continuous: {
            MOR: { pos: [0.25, 0.27, 0.23, 0.15, 0.1] },
            CD: { pos: [0.25, 0.27, 0.23, 0.15, 0.1] }
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
            MOR: { pos: [0.1, 0.15, 0.25, 0.27, 0.23] },
            CD: { pos: [0.1, 0.15, 0.25, 0.27, 0.23] }
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
      quality: 0.3,
      rewriteNeeded: false,
      touchProfile: [
        { node: "ENG", kind: "continuous", role: "position", weight: 0.08, touchType: "background_context" },
        { node: "PF", kind: "continuous", role: "salience", weight: 0.05, touchType: "background_context" }
      ],
      optionEvidence: {
        very_engaged: {
          continuous: {
            ENG: { pos: [0.1, 0.15, 0.25, 0.28, 0.22] }
          }
        },
        occasionally_discussed: {
          continuous: {
            ENG: { pos: [0.15, 0.22, 0.3, 0.2, 0.13] }
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
      quality: 0.3,
      rewriteNeeded: false,
      touchProfile: [
        { node: "ZS", kind: "continuous", role: "position", weight: 0.05, touchType: "background_context" },
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
            ZS: { pos: [0.2, 0.25, 0.27, 0.18, 0.1] }
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
        { node: "EPS", kind: "categorical", role: "category", weight: 0.2, touchType: "leader_evaluation" },
        { node: "ENG", kind: "continuous", role: "position", weight: 0.1, touchType: "leader_evaluation" }
      ],
      optionEvidence: {
        competence_record: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.02, 0.08, 0.35, 0.55] },
            EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.03, 0.12, 0.38, 0.47] }
          }
        },
        moral_character: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.pastoral, sal: [0.02, 0.08, 0.35, 0.55] },
            EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.03, 0.12, 0.38, 0.47] }
          }
        },
        fights_for_us: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.fighter, sal: [0.02, 0.08, 0.35, 0.55] },
            EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.03, 0.12, 0.38, 0.47] }
          }
        },
        unifying_vision: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.visionary, sal: [0.02, 0.08, 0.35, 0.55] },
            EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.03, 0.12, 0.38, 0.47] }
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
        { node: "EPS", kind: "categorical", role: "category", weight: 0.3, touchType: "rhetorical_preference" },
        { node: "TRB", kind: "continuous", role: "position", weight: 0.2, touchType: "rhetorical_preference" },
        { node: "ZS", kind: "continuous", role: "position", weight: 0.15, touchType: "rhetorical_preference" },
        { node: "PRO", kind: "continuous", role: "position", weight: 0.15, touchType: "rhetorical_preference" }
      ],
      optionEvidence: {
        evidence_pitch: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.02, 0.08, 0.35, 0.55] },
            EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.03, 0.1, 0.37, 0.5] }
          }
        },
        values_pitch: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.pastoral, sal: [0.02, 0.08, 0.35, 0.55] },
            EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.03, 0.1, 0.37, 0.5] }
          }
        },
        fight_pitch: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.fighter, sal: [0.02, 0.08, 0.35, 0.55] },
            EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.03, 0.1, 0.37, 0.5] }
          }
        },
        unity_pitch: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.statesman, sal: [0.02, 0.08, 0.35, 0.55] },
            EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.03, 0.1, 0.37, 0.5] }
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
      quality: 0.9,
      rewriteNeeded: false,
      touchProfile: [
        { node: "AES", kind: "categorical", role: "category", weight: 0.88, touchType: "movement_style" },
        { node: "TRB", kind: "continuous", role: "position", weight: 0.2, touchType: "movement_style" },
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
        { node: "TRB", kind: "continuous", role: "position", weight: 0.3, touchType: "motive_selection" },
        { node: "PRO", kind: "continuous", role: "position", weight: 0.2, touchType: "motive_selection" },
        { node: "COM", kind: "continuous", role: "position", weight: 0.2, touchType: "motive_selection" },
        { node: "EPS", kind: "categorical", role: "category", weight: 0.2, touchType: "motive_selection" }
      ],
      optionEvidence: {
        civic_duty: {
          continuous: {
            COM: { pos: [0.05, 0.12, 0.28, 0.33, 0.22], sal: [0.1, 0.22, 0.38, 0.3] }
          }
        },
        protect_values: {
          continuous: {
            TRB: { pos: [0.08, 0.15, 0.28, 0.3, 0.19], sal: [0.08, 0.2, 0.4, 0.32] }
          }
        },
        help_community: {
          continuous: {
            COM: { pos: [0.04, 0.1, 0.25, 0.35, 0.26], sal: [0.08, 0.2, 0.4, 0.32] },
            MOR: { pos: [0.04, 0.1, 0.28, 0.35, 0.23] }
          }
        },
        fight_injustice: {
          continuous: {
            TRB: { pos: [0.12, 0.2, 0.3, 0.24, 0.14], sal: [0.08, 0.2, 0.4, 0.32] },
            PRO: { pos: [0.04, 0.1, 0.25, 0.35, 0.26] }
          }
        },
        self_interest: {
          continuous: {
            ENG: { pos: [0.05, 0.12, 0.28, 0.33, 0.22] }
          },
          categorical: { EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.15, 0.28, 0.35, 0.22] } }
        },
        intellectual_challenge: {
          categorical: { EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.1, 0.25, 0.38, 0.27] } }
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
            EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.08, 0.2, 0.38, 0.34] }
          }
        },
        data_evidence: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.08, 0.2, 0.4, 0.32] }
          }
        },
        trusted_authority: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.08, 0.22, 0.4, 0.3] }
          }
        },
        religious_moral: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.08, 0.2, 0.38, 0.34] }
          }
        },
        never_changed: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.1, 0.25, 0.38, 0.27] }
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
        { node: "ENG", kind: "continuous", role: "position", weight: 0.1, touchType: "issue_attention" }
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
        { node: "MAT", kind: "continuous", role: "position", weight: 0.7, touchType: "economic_attribution" },
        { node: "ONT_S", kind: "continuous", role: "position", weight: 0.65, touchType: "economic_attribution" },
        { node: "ZS", kind: "continuous", role: "position", weight: 0.4, touchType: "conflict_attribution" }
      ],
      rankingMap: {
        global_competition: {
          continuous: { ONT_S: 0.7, ZS: 0.4 }
        },
        automation: {
          continuous: { ONT_S: 0.6 }
        },
        corporate_decisions: {
          continuous: { MAT: 0.7, ZS: 0.6 }
        },
        government_policy: {
          continuous: { MAT: 0.3, ONT_S: 0.3 }
        },
        worker_choices: {
          continuous: { MAT: -0.6, ONT_S: -0.5 }
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
        { node: "MOR", kind: "continuous", role: "position", weight: 0.2, touchType: "membership_expectation" },
        { node: "TRB", kind: "continuous", role: "position", weight: 0.2, touchType: "boundary_identity" }
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
        { node: "CD", kind: "continuous", role: "salience", weight: 0.2, touchType: "best_worst" },
        { node: "CU", kind: "continuous", role: "salience", weight: 0.25, touchType: "best_worst" },
        { node: "MOR", kind: "continuous", role: "salience", weight: 0.35, touchType: "best_worst" },
        { node: "PRO", kind: "continuous", role: "salience", weight: 0.3, touchType: "best_worst" },
        { node: "EPS", kind: "categorical", role: "salience", weight: 0.35, touchType: "best_worst" },
        { node: "AES", kind: "categorical", role: "salience", weight: 0.3, touchType: "best_worst" },
        { node: "COM", kind: "continuous", role: "salience", weight: 0.3, touchType: "best_worst" },
        { node: "ZS", kind: "continuous", role: "salience", weight: 0.2, touchType: "best_worst" },
        { node: "ONT_H", kind: "continuous", role: "salience", weight: 0.2, touchType: "best_worst" },
        { node: "ONT_S", kind: "continuous", role: "salience", weight: 0.2, touchType: "best_worst" },
        { node: "PF", kind: "continuous", role: "salience", weight: 0.35, touchType: "best_worst" },
        { node: "TRB", kind: "continuous", role: "salience", weight: 0.35, touchType: "best_worst" },
        { node: "ENG", kind: "continuous", role: "salience", weight: 0.25, touchType: "best_worst" },
        { node: "TRB_ANCHOR", kind: "derived", role: "anchor", weight: 0.2, touchType: "best_worst" }
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
    },
    // =========================================================================
    // NEW QUESTIONS 64-75: Gap-targeted expansion
    // =========================================================================
    // Q64 — Political Frustration (PF position via grievance framing + salience)
    // "When you think about what's most wrong with the country right now,
    //  which frustration resonates most?"
    {
      id: 64,
      stage: "stage2",
      section: "VI",
      promptShort: "political_frustration",
      uiType: "single_choice",
      quality: 0.93,
      rewriteNeeded: false,
      touchProfile: [
        { node: "PF", kind: "continuous", role: "position", weight: 0.9, touchType: "grievance_proxy" },
        { node: "PF", kind: "continuous", role: "salience", weight: 0.4, touchType: "frustration_intensity" }
      ],
      optionEvidence: {
        // "Corporations and the wealthy have too much power, ordinary people are left behind"
        corporate_power_inequality: {
          continuous: {
            PF: { pos: [0.55, 0.3, 0.1, 0.03, 0.02], sal: [0.03, 0.12, 0.38, 0.47] }
          }
        },
        // "Government has grown too large and intrusive, individual freedom is eroding"
        government_overreach: {
          continuous: {
            PF: { pos: [0.02, 0.05, 0.12, 0.36, 0.45], sal: [0.03, 0.12, 0.38, 0.47] }
          }
        },
        // "Both sides are more interested in fighting than solving real problems"
        both_sides_broken: {
          continuous: {
            PF: { pos: [0.06, 0.14, 0.58, 0.14, 0.08], sal: [0.3, 0.38, 0.22, 0.1] }
          }
        },
        // "The system itself is fundamentally unjust and needs radical change"
        system_unjust: {
          continuous: {
            PF: { pos: [0.6, 0.22, 0.1, 0.05, 0.03], sal: [0.02, 0.08, 0.35, 0.55] }
          }
        },
        // "Traditional values and social cohesion are being abandoned"
        values_eroding: {
          continuous: {
            PF: { pos: [0.02, 0.03, 0.08, 0.32, 0.55], sal: [0.02, 0.1, 0.38, 0.5] }
          }
        },
        // "I don't think much about politics — it doesn't affect my daily life"
        politics_irrelevant: {
          continuous: {
            PF: { pos: [0.1, 0.15, 0.45, 0.18, 0.12], sal: [0.55, 0.3, 0.12, 0.03] }
          }
        }
      }
    },
    {
      id: 69,
      stage: "stage2",
      section: "VI",
      promptShort: "common_ground_salience",
      uiType: "slider",
      quality: 0.91,
      rewriteNeeded: false,
      touchProfile: [
        { node: "COM", kind: "continuous", role: "salience", weight: 0.9, touchType: "direct_salience" },
        { node: "PRO", kind: "continuous", role: "position", weight: 0.15, touchType: "governance_proxy" }
      ],
      sliderMap: {
        "0-20": { continuous: { COM: { sal: [0.55, 0.3, 0.12, 0.03] } } },
        "21-40": { continuous: { COM: { sal: [0.25, 0.42, 0.25, 0.08] } } },
        "41-60": { continuous: { COM: { sal: [0.1, 0.28, 0.4, 0.22] } } },
        "61-80": { continuous: { COM: { sal: [0.04, 0.12, 0.38, 0.46] } } },
        "81-100": { continuous: { COM: { sal: [0.02, 0.08, 0.3, 0.6] } } }
      }
    },
    {
      id: 76,
      stage: "stage2",
      section: "IV",
      promptShort: "success_attribution",
      uiType: "single_choice",
      quality: 0.91,
      rewriteNeeded: false,
      touchProfile: [
        { node: "ONT_S", kind: "continuous", role: "position", weight: 0.9, touchType: "causal_attribution" },
        { node: "ONT_S", kind: "continuous", role: "salience", weight: 0.4, touchType: "causal_attribution" },
        { node: "ZS", kind: "continuous", role: "position", weight: 0.2, touchType: "distributional_worldview" }
      ],
      optionEvidence: {
        hard_work_talent: {
          continuous: {
            ONT_S: { pos: [0.62, 0.22, 0.1, 0.04, 0.02], sal: [0.05, 0.15, 0.4, 0.4] },
            ZS: { pos: [0.35, 0.3, 0.22, 0.09, 0.04] }
          }
        },
        good_choices: {
          continuous: {
            ONT_S: { pos: [0.22, 0.48, 0.2, 0.07, 0.03], sal: [0.08, 0.22, 0.42, 0.28] },
            ZS: { pos: [0.25, 0.35, 0.25, 0.1, 0.05] }
          }
        },
        right_connections: {
          continuous: {
            ONT_S: { pos: [0.06, 0.14, 0.48, 0.22, 0.1], sal: [0.1, 0.25, 0.38, 0.27] },
            ZS: { pos: [0.08, 0.18, 0.38, 0.24, 0.12] }
          }
        },
        system_advantages: {
          continuous: {
            ONT_S: { pos: [0.02, 0.06, 0.15, 0.45, 0.32], sal: [0.03, 0.12, 0.38, 0.47] },
            ZS: { pos: [0.05, 0.1, 0.25, 0.35, 0.25] }
          }
        },
        whole_system: {
          continuous: {
            ONT_S: { pos: [0.01, 0.03, 0.08, 0.28, 0.6], sal: [0.02, 0.08, 0.35, 0.55] },
            ZS: { pos: [0.03, 0.07, 0.18, 0.32, 0.4] }
          }
        }
      }
    },
    // Q77 — Decision-Making Style (EPS intuitionist + nihilist coverage)
    // Life-decision framing (not political) avoids priming institutional answers.
    // "gut_feeling" gives intuitionist a dignified path; "cant_predict" normalizes nihilism.
    {
      id: 77,
      stage: "stage2",
      section: "III",
      promptShort: "decision_making_style",
      uiType: "single_choice",
      quality: 0.93,
      rewriteNeeded: false,
      touchProfile: [
        { node: "EPS", kind: "categorical", role: "category", weight: 0.85, touchType: "decision_style" },
        { node: "EPS", kind: "categorical", role: "salience", weight: 0.35, touchType: "decision_style" },
        { node: "AES", kind: "categorical", role: "category", weight: 0.15, touchType: "style_proxy" }
      ],
      optionEvidence: {
        research_data: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.05, 0.15, 0.42, 0.38] }
          }
        },
        trusted_advice: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.05, 0.18, 0.4, 0.37] }
          }
        },
        values_tradition: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.05, 0.15, 0.4, 0.4] }
          }
        },
        gut_feeling: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.08, 0.2, 0.4, 0.32] },
            AES: { cat: AES_PROTOTYPES.authentic, sal: [0.12, 0.28, 0.38, 0.22] }
          }
        },
        own_reasoning: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.06, 0.18, 0.42, 0.34] }
          }
        },
        cant_predict: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.nihilist, sal: [0.25, 0.35, 0.28, 0.12] }
          }
        }
      }
    },
    // Q78 — Speaker Appeal (AES authentic coverage)
    // Behavioral framing ("would you show up?") reveals aesthetic preference
    // without asking respondents to self-classify their communication style.
    {
      id: 78,
      stage: "stage2",
      section: "V",
      promptShort: "speaker_appeal",
      uiType: "single_choice",
      quality: 0.92,
      rewriteNeeded: false,
      touchProfile: [
        { node: "AES", kind: "categorical", role: "category", weight: 0.88, touchType: "rhetorical_preference" },
        { node: "AES", kind: "categorical", role: "salience", weight: 0.4, touchType: "rhetorical_preference" },
        { node: "EPS", kind: "categorical", role: "category", weight: 0.15, touchType: "style_proxy" }
      ],
      optionEvidence: {
        bridge_builder: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.statesman, sal: [0.05, 0.15, 0.4, 0.4] }
          }
        },
        deep_expertise: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.technocrat, sal: [0.05, 0.15, 0.42, 0.38] }
          }
        },
        community_voice: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.pastoral, sal: [0.05, 0.18, 0.4, 0.37] }
          }
        },
        says_what_they_think: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.authentic, sal: [0.05, 0.15, 0.4, 0.4] },
            EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.15, 0.28, 0.35, 0.22] }
          }
        },
        calls_out_power: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.fighter, sal: [0.03, 0.12, 0.4, 0.45] }
          }
        },
        big_picture: {
          categorical: {
            AES: { cat: AES_PROTOTYPES.visionary, sal: [0.05, 0.15, 0.42, 0.38] }
          }
        }
      }
    },
    // Q79 — Expert Disagreement (EPS nihilist dedicated)
    // Expert disagreement is a natural experiment for epistemic style.
    // "tune_out" normalizes nihilism as practical uncertainty acceptance.
    {
      id: 79,
      stage: "stage2",
      section: "III",
      promptShort: "expert_disagreement_reaction",
      uiType: "single_choice",
      quality: 0.9,
      rewriteNeeded: false,
      touchProfile: [
        { node: "EPS", kind: "categorical", role: "category", weight: 0.82, touchType: "epistemic_response" },
        { node: "EPS", kind: "categorical", role: "salience", weight: 0.4, touchType: "epistemic_response" },
        { node: "ENG", kind: "continuous", role: "salience", weight: 0.15, touchType: "attention_proxy" }
      ],
      optionEvidence: {
        check_evidence: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.empiricist, sal: [0.03, 0.12, 0.4, 0.45] }
          }
        },
        check_credentials: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.institutionalist, sal: [0.05, 0.15, 0.42, 0.38] }
          }
        },
        check_values: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.traditionalist, sal: [0.05, 0.15, 0.4, 0.4] }
          }
        },
        check_experience: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.intuitionist, sal: [0.08, 0.2, 0.4, 0.32] }
          }
        },
        both_wrong: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.autonomous, sal: [0.05, 0.15, 0.42, 0.38] }
          }
        },
        tune_out: {
          categorical: {
            EPS: { cat: EPS_PROTOTYPES.nihilist, sal: [0.4, 0.32, 0.2, 0.08] }
          },
          continuous: {
            ENG: { sal: [0.55, 0.3, 0.12, 0.03] }
          }
        }
      }
    }
  ];

  // src/config/questions.full.ts
  var t = (node, kind, role, weight, touchType) => ({
    node,
    kind,
    role,
    weight,
    touchType
  });
  var q = (id, stage, section, promptShort, uiType, quality, rewriteNeeded, touchProfile, exposeRules) => ({
    id,
    stage,
    section,
    promptShort,
    uiType,
    quality,
    rewriteNeeded,
    touchProfile,
    ...exposeRules !== void 0 ? { exposeRules } : {}
  });
  var FULL_QUESTIONS = [
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
        t("ENG", "continuous", "salience", 0.6, "behavior_frequency"),
        t("PF", "continuous", "salience", 0.2, "identity_proxy")
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
        t("ENG", "continuous", "salience", 0.2, "identity_proxy")
      ],
      { goodFollowupsIfUnresolved: [40, 60] }
    ),
    q(
      3,
      "fixed12",
      "I",
      "cultural_social_placement",
      "slider",
      0.9,
      false,
      [
        t("CD", "continuous", "position", 0.9, "direct_placement"),
        t("CU", "continuous", "position", 0.3, "boundary_proxy"),
        t("MOR", "continuous", "position", 0.2, "values_proxy")
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
        t("CD", "continuous", "salience", 0.9, "direct_salience"),
        t("CU", "continuous", "salience", 0.45, "boundary_salience"),
        t("MOR", "continuous", "salience", 0.2, "values_salience")
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
        t("TRB", "continuous", "position", 0.3, "motive_selection"),
        t("PRO", "continuous", "position", 0.2, "motive_selection"),
        t("COM", "continuous", "position", 0.2, "motive_selection"),
        t("EPS", "categorical", "category", 0.2, "motive_selection")
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
        t("PRO", "continuous", "position", 0.7, "policy_bundle"),
        t("ONT_H", "continuous", "position", 0.1, "policy_bundle")
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
        t("PRO", "continuous", "position", 0.2, "principle_tradeoff")
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
        t("MOR", "continuous", "position", 0.9, "moral_scope_tradeoff"),
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
        t("ENG", "continuous", "position", 0.6, "social_behavior"),
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
        t("PRO", "continuous", "position", 0.1, "policy_bundle")
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
        t("EPS", "categorical", "category", 0.8, "taste_proxy"),
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
        t("ENG", "continuous", "position", 0.1, "policy_attention")
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
        t("ONT_S", "continuous", "position", 0.55, "causal_allocation")
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
        t("PRO", "continuous", "position", 0.6, "policy_bundle"),
        t("ONT_H", "continuous", "position", 0.1, "policy_bundle")
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
        t("MAT", "continuous", "position", 0.9, "fairness_threshold")
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
        t("ONT_H", "continuous", "position", 0.9, "ontology_direct"),
        t("ONT_H", "continuous", "salience", 0.2, "ontology_direct"),
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
      0.9,
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
        t("PRO", "continuous", "position", 0.8, "rights_tradeoff"),
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
        t("ENG", "continuous", "position", 0.1, "issue_attention")
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
        t("EPS", "categorical", "category", 0.7, "authority_ranking"),
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
      0.9,
      false,
      [
        t("ONT_H", "continuous", "position", 0.2, "human_nature_proxy")
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
        t("AES", "categorical", "category", 0.1, "taste_proxy")
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
        t("MAT", "continuous", "position", 0.7, "error_asymmetry"),
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
        t("COM", "continuous", "position", 0.1, "collective_action_proxy")
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
        t("MAT", "continuous", "position", 0.7, "economic_attribution"),
        t("ONT_S", "continuous", "position", 0.65, "economic_attribution"),
        t("ZS", "continuous", "position", 0.4, "conflict_attribution")
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
      0.9,
      false,
      [
        t("PRO", "continuous", "position", 0.7, "speech_harm_tradeoff"),
        t("EPS", "categorical", "category", 0.25, "truth_authority_proxy"),
        t("COM", "continuous", "position", 0.2, "pluralism_proxy")
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
      0.9,
      false,
      [
        t("ZS", "continuous", "position", 0.85, "macro_sum_view"),
        t("ONT_S", "continuous", "position", 0.45, "systems_view"),
        t("MAT", "continuous", "position", 0.2, "distribution_proxy")
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
        t("MOR", "continuous", "position", 0.2, "moral_scope_boundary")
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
        t("ZS", "continuous", "position", 0.6, "threat_bundle"),
        t("TRB", "continuous", "position", 0.25, "threat_bundle"),
        t("CU", "continuous", "position", 0.1, "threat_bundle")
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
        t("TRB", "continuous", "position", 0.8, "outgroup_trust_estimate"),
        t("COM", "continuous", "position", 0.35, "outgroup_trust_estimate"),
        t("ZS", "continuous", "position", 0.3, "outgroup_trust_estimate")
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
        t("EPS", "categorical", "category", 0.2, "expertise_risk_proxy"),
        t("ONT_H", "continuous", "position", 0.1, "risk_humanity_proxy")
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
      0.8,
      false,
      [
        t("PRO", "continuous", "position", 0.6, "rule_response"),
        t("COM", "continuous", "position", 0.25, "rule_response"),
        t("ENG", "continuous", "position", 0.1, "conflict_response")
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
      0.9,
      false,
      [
        t("TRB", "continuous", "position", 0.75, "outgroup_model"),
        t("COM", "continuous", "position", 0.45, "outgroup_model"),
        t("ONT_H", "continuous", "position", 0.3, "motive_model")
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
        t("PF", "continuous", "salience", 0.7, "identity_enemy_link"),
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
      0.9,
      false,
      [
        t("PRO", "continuous", "position", 0.7, "error_asymmetry"),
        t("CU", "continuous", "position", 0.2, "boundary_order_proxy"),
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
        t("PF", "continuous", "salience", 0.3, "network_homophily")
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
        t("MAT", "continuous", "position", 0.7, "distributive_choice"),
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
        t("EPS", "categorical", "category", 0.2, "updating_proxy"),
        t("PF", "continuous", "position", 0.1, "identity_rigidity_proxy")
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
      0.6,
      true,
      [
        t("EPS", "categorical", "category", 0.55, "abstract_style"),
        t("AES", "categorical", "category", 0.25, "abstract_style"),
        t("MOR", "continuous", "position", 0.1, "abstract_style")
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
      0.3,
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
        t("COM", "continuous", "position", 0.7, "interpersonal_conflict"),
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
        t("ONT_S", "continuous", "position", 0.2, "progress_worldview"),
        t("CD", "continuous", "position", 0.3, "progress_worldview")
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
        t("ONT_S", "continuous", "salience", 0.2, "progress_salience")
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
        t("CU", "continuous", "position", 0.8, "membership_expectation"),
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
        t("CU", "continuous", "salience", 0.9, "direct_salience"),
        t("CD", "continuous", "salience", 0.35, "direct_salience"),
        t("TRB", "continuous", "salience", 0.2, "identity_salience"),
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
      0.4,
      false,
      [
        t("MOR", "continuous", "position", 0.1, "background_context"),
        t("CD", "continuous", "position", 0.1, "background_context"),
        t("TRB", "continuous", "position", 0.1, "background_context"),
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
        t("AES", "categorical", "category", 0.9, "leader_style"),
        t("PRO", "continuous", "position", 0.2, "governance_style"),
        t("ENG", "continuous", "salience", 0.1, "mobilization_proxy")
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
      0.3,
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
      0.3,
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
        t("EPS", "categorical", "category", 0.2, "leader_evaluation"),
        t("ENG", "continuous", "position", 0.1, "leader_evaluation")
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
        t("TRB", "continuous", "position", 0.7, "identity_ranking"),
        t("PF", "continuous", "salience", 0.4, "identity_ranking"),
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
        t("EPS", "categorical", "category", 0.3, "rhetorical_preference"),
        t("TRB", "continuous", "position", 0.2, "rhetorical_preference"),
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
      0.9,
      false,
      [
        t("AES", "categorical", "category", 0.88, "movement_style"),
        t("TRB", "continuous", "position", 0.2, "movement_style"),
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
        t("CD", "continuous", "salience", 0.2, "best_worst"),
        t("CU", "continuous", "salience", 0.25, "best_worst"),
        t("MOR", "continuous", "salience", 0.35, "best_worst"),
        t("PRO", "continuous", "salience", 0.3, "best_worst"),
        t("EPS", "categorical", "salience", 0.35, "best_worst"),
        t("AES", "categorical", "salience", 0.3, "best_worst"),
        t("COM", "continuous", "salience", 0.3, "best_worst"),
        t("ZS", "continuous", "salience", 0.2, "best_worst"),
        t("ONT_H", "continuous", "salience", 0.2, "best_worst"),
        t("ONT_S", "continuous", "salience", 0.2, "best_worst"),
        t("PF", "continuous", "salience", 0.35, "best_worst"),
        t("TRB", "continuous", "salience", 0.35, "best_worst"),
        t("ENG", "continuous", "salience", 0.25, "best_worst"),
        t("TRB_ANCHOR", "derived", "anchor", 0.2, "best_worst")
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
        t("PF", "continuous", "position", 0.9, "grievance_proxy"),
        t("PF", "continuous", "salience", 0.4, "frustration_intensity"),
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
      */
    // end Q65-Q68 comment block
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
        t("COM", "continuous", "salience", 0.9, "direct_salience"),
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
    */
    // end Q70 comment block
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
      */
    // end Q73-Q75 comment block
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
        t("ONT_S", "continuous", "position", 0.9, "causal_attribution"),
        t("ONT_S", "continuous", "salience", 0.4, "causal_attribution"),
        t("ZS", "continuous", "position", 0.2, "distributional_worldview")
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
        t("AES", "categorical", "salience", 0.4, "rhetorical_preference"),
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
      0.9,
      false,
      [
        t("EPS", "categorical", "category", 0.82, "epistemic_response"),
        t("EPS", "categorical", "salience", 0.4, "epistemic_response"),
        t("ENG", "continuous", "salience", 0.15, "attention_proxy")
      ],
      {
        eligibleIf: ["EPS_live_or_unresolved"],
        goodFollowupsIfUnresolved: [77, 22, 44]
      }
    )
  ];
  var FULL_QUESTIONS_BY_ID = Object.fromEntries(
    FULL_QUESTIONS.map((q2) => [q2.id, q2])
  );

  // src/engine/config.ts
  var FIXED_16 = [1, 2, 3, 4, 8, 11, 15, 18, 20, 21, 23, 31, 38, 39, 40, 47];

  // src/config/nodes.ts
  var NODE_DEFS = [
    { id: "MAT", type: "continuous", cluster: "ENDS" },
    { id: "CD", type: "continuous", cluster: "ENDS" },
    { id: "CU", type: "continuous", cluster: "ENDS" },
    { id: "MOR", type: "continuous", cluster: "ENDS" },
    { id: "PRO", type: "continuous", cluster: "MEANS" },
    { id: "EPS", type: "categorical", cluster: "MEANS" },
    { id: "AES", type: "categorical", cluster: "MEANS" },
    { id: "COM", type: "continuous", cluster: "MEANS" },
    { id: "ZS", type: "continuous", cluster: "REALITY" },
    { id: "ONT_H", type: "continuous", cluster: "REALITY" },
    { id: "ONT_S", type: "continuous", cluster: "REALITY" },
    { id: "PF", type: "continuous", cluster: "SELF" },
    { id: "TRB", type: "continuous", cluster: "SELF" },
    { id: "ENG", type: "continuous", cluster: "SELF" }
  ];
  var CONTINUOUS_NODES = NODE_DEFS.filter(
    (n) => n.type === "continuous"
  ).map((n) => n.id);
  var CATEGORICAL_NODES = NODE_DEFS.filter(
    (n) => n.type === "categorical"
  ).map((n) => n.id);

  // src/state/initialState.ts
  var uniformPos5 = () => [0.2, 0.2, 0.2, 0.2, 0.2];
  var uniformSal4 = () => [0.25, 0.25, 0.25, 0.25];
  var uniformCat6 = () => [
    1 / 6,
    1 / 6,
    1 / 6,
    1 / 6,
    1 / 6,
    1 / 6
  ];
  var uniformAnchor7 = () => [
    1 / 7,
    1 / 7,
    1 / 7,
    1 / 7,
    1 / 7,
    1 / 7,
    1 / 7
  ];
  function createContinuousState() {
    return {
      posDist: uniformPos5(),
      salDist: uniformSal4(),
      touches: 0,
      touchTypes: /* @__PURE__ */ new Set(),
      status: "unknown"
    };
  }
  function createCategoricalState() {
    return {
      catDist: uniformCat6(),
      salDist: uniformSal4(),
      touches: 0,
      touchTypes: /* @__PURE__ */ new Set(),
      status: "unknown"
    };
  }
  function createInitialState() {
    const continuous = Object.fromEntries(
      CONTINUOUS_NODES.map((id) => [id, createContinuousState()])
    );
    const categorical = Object.fromEntries(
      CATEGORICAL_NODES.map((id) => [id, createCategoricalState()])
    );
    const totalPrior = ARCHETYPES.reduce((sum, a) => sum + a.prior, 0);
    const archetypePosterior = Object.fromEntries(
      ARCHETYPES.map((a) => [a.id, a.prior / totalPrior])
    );
    return {
      answers: {},
      continuous,
      categorical,
      trbAnchor: {
        dist: uniformAnchor7(),
        touches: 0
      },
      archetypePosterior
    };
  }

  // src/engine/math.ts
  function normalize(arr) {
    const s = arr.reduce((a, b) => a + b, 0);
    if (s <= 0) {
      const v = 1 / arr.length;
      return arr.map(() => v);
    }
    return arr.map((x) => x / s);
  }
  function multiplyAndNormalize(a, b) {
    const out = a.map((v, i) => v * (b[i] ?? 0));
    return normalize(out);
  }
  function expectedPosFrom5(dist) {
    return dist.reduce((sum, p, i) => sum + p * (i + 1), 0);
  }
  function centeredPos(pos1to5) {
    return pos1to5 - 3;
  }
  function expectedSalience(dist) {
    return dist.reduce((sum, p, i) => sum + p * i, 0);
  }
  function expectedCatArgmax(dist) {
    let best = 0;
    let bestVal = -Infinity;
    dist.forEach((v, i) => {
      if (v > bestVal) {
        bestVal = v;
        best = i;
      }
    });
    return best;
  }
  function salienceWeight(s) {
    if (s <= 1) return 0;
    if (s === 2) return 1;
    return 1.5;
  }
  function expectedSalienceWeight(dist) {
    return dist.reduce((sum, p, i) => sum + p * salienceWeight(i), 0);
  }
  function matrixBilinear(left, matrix, right) {
    let total = 0;
    for (let i = 0; i < left.length; i += 1) {
      const row = matrix[i];
      if (!row) continue;
      for (let j = 0; j < right.length; j += 1) {
        total += (left[i] ?? 0) * (row[j] ?? 0) * (right[j] ?? 0);
      }
    }
    return total;
  }
  function addToAnchorDist(current, bumps) {
    const keys = ["national", "ideological", "religious", "class", "ethnic_racial", "global", "mixed_none"];
    const out = current.map((v, i) => {
      const key = keys[i];
      return v + (key !== void 0 ? bumps[key] ?? 1e-4 : 1e-4);
    });
    return normalize(out);
  }

  // src/engine/update.ts
  function registerTouches(state, q2) {
    for (const touch of q2.touchProfile) {
      if (touch.node === "TRB_ANCHOR") continue;
      if (touch.kind === "continuous" && touch.node in state.continuous) {
        const node = state.continuous[touch.node];
        node.touches += 1;
        node.touchTypes.add(touch.touchType);
      } else if (touch.kind === "categorical" && touch.node in state.categorical) {
        const node = state.categorical[touch.node];
        node.touches += 1;
        node.touchTypes.add(touch.touchType);
      }
    }
  }
  function applyOptionEvidence(state, evidence) {
    if (!evidence) return;
    if (evidence.continuous) {
      for (const [nodeId, upd] of Object.entries(evidence.continuous)) {
        const node = state.continuous[nodeId];
        if (upd?.pos) node.posDist = multiplyAndNormalize(node.posDist, upd.pos);
        if (upd?.sal) node.salDist = multiplyAndNormalize(node.salDist, upd.sal);
      }
    }
    if (evidence.categorical) {
      for (const [nodeId, upd] of Object.entries(evidence.categorical)) {
        const node = state.categorical[nodeId];
        if (upd?.cat) node.catDist = multiplyAndNormalize(node.catDist, upd.cat);
        if (upd?.sal) node.salDist = multiplyAndNormalize(node.salDist, upd.sal);
      }
    }
    if (evidence.trbAnchor) {
      state.trbAnchor.dist = addToAnchorDist(state.trbAnchor.dist, evidence.trbAnchor);
      state.trbAnchor.touches += 1;
    }
  }
  function applySingleChoiceAnswer(state, q2, optionKey) {
    state.answers[q2.id] = optionKey;
    registerTouches(state, q2);
    applyOptionEvidence(state, q2.optionEvidence?.[optionKey]);
  }
  function applySliderAnswer(state, q2, rawValue) {
    state.answers[q2.id] = rawValue;
    registerTouches(state, q2);
    if (!q2.sliderMap) return;
    const bucket = Object.keys(q2.sliderMap).find((k) => {
      const parts = k.split("-").map(Number);
      const lo = parts[0] ?? 0;
      const hi = parts[1] ?? 100;
      return rawValue >= lo && rawValue <= hi;
    });
    if (!bucket) return;
    applyOptionEvidence(state, q2.sliderMap[bucket]);
  }
  function applyAllocationAnswer(state, q2, allocation) {
    state.answers[q2.id] = allocation;
    registerTouches(state, q2);
    if (!q2.allocationMap) return;
    const total = Math.max(1, Object.values(allocation).reduce((a, b) => a + b, 0));
    for (const [bucket, weight] of Object.entries(allocation)) {
      const share = weight / total;
      const map = q2.allocationMap[bucket];
      if (!map) continue;
      if (map.continuous) {
        for (const [nodeId, signal] of Object.entries(map.continuous)) {
          const node = state.continuous[nodeId];
          const current = node.posDist;
          const bump = current.map((p, i) => p * Math.exp((signal ?? 0) * share * (i + 1 - 3)));
          node.posDist = normalize(bump);
        }
      }
      if (map.categorical) {
        for (const [nodeId, catDist] of Object.entries(map.categorical)) {
          const node = state.categorical[nodeId];
          const mixed = node.catDist.map((v, i) => v * (1 - 0.35 * share) + (catDist[i] ?? 0) * (0.35 * share));
          node.catDist = normalize(mixed);
        }
      }
      if (map.trbAnchor) {
        const scaled = {};
        for (const [k, v] of Object.entries(map.trbAnchor)) {
          scaled[k] = v * share;
        }
        state.trbAnchor.dist = addToAnchorDist(state.trbAnchor.dist, scaled);
        state.trbAnchor.touches += 1;
      }
    }
  }
  function applyRankingAnswer(state, q2, ranking) {
    state.answers[q2.id] = ranking;
    registerTouches(state, q2);
    if (!q2.rankingMap) return;
    const weights = [1, 0.8, 0.55, 0.35, 0.2, 0];
    ranking.forEach((item, idx) => {
      const rankWeight = weights[idx] ?? 0;
      const map = q2.rankingMap?.[item];
      if (!map) return;
      if (map.continuous) {
        for (const [nodeId, signal] of Object.entries(map.continuous)) {
          const node = state.continuous[nodeId];
          const bump = node.posDist.map((p, i) => p * Math.exp((signal ?? 0) * rankWeight * (i + 1 - 3)));
          node.posDist = normalize(bump);
        }
      }
      if (map.categorical) {
        for (const [nodeId, catDist] of Object.entries(map.categorical)) {
          const node = state.categorical[nodeId];
          const mixed = node.catDist.map((v, i) => v * (1 - 0.4 * rankWeight) + (catDist[i] ?? 0) * (0.4 * rankWeight));
          node.catDist = normalize(mixed);
        }
      }
      if (map.trbAnchor) {
        const scaled = {};
        for (const [k, v] of Object.entries(map.trbAnchor)) {
          scaled[k] = v * rankWeight;
        }
        state.trbAnchor.dist = addToAnchorDist(state.trbAnchor.dist, scaled);
        state.trbAnchor.touches += 1;
      }
    });
  }
  function applyPairwiseAnswer(state, q2, answers) {
    state.answers[q2.id] = answers;
    registerTouches(state, q2);
    if (!q2.pairMaps) return;
    for (const [pairId, chosen] of Object.entries(answers)) {
      const map = q2.pairMaps[pairId]?.[chosen];
      if (!map) continue;
      if (map.continuous) {
        for (const [nodeId, signal] of Object.entries(map.continuous)) {
          const node = state.continuous[nodeId];
          const bump = node.posDist.map((p, i) => p * Math.exp((signal ?? 0) * (i + 1 - 3)));
          node.posDist = normalize(bump);
        }
      }
      if (map.categorical) {
        for (const [nodeId, catDist] of Object.entries(map.categorical)) {
          const node = state.categorical[nodeId];
          const mixed = node.catDist.map((v, i) => v * 0.6 + (catDist[i] ?? 0) * 0.4);
          node.catDist = normalize(mixed);
        }
      }
    }
  }

  // src/optimize/runtimeConfig.ts
  var DEFAULTS = {
    // Core distance
    TEMPERATURE: 1.6,
    SALIENCE_MISMATCH_LAMBDA: 0.98,
    ARCHETYPE_WEIGHT_BOOST: 1,
    CONFIRM_LAMBDA: 0,
    CONFIRM_RADIUS: 0.8,
    // Stop rule (original hand-tuned — proven 124/124 accuracy)
    STOP_POSTERIOR_THRESHOLD: 0.3,
    STOP_MARGIN_THRESHOLD: 0.08,
    STOP_MIN_QUESTIONS: 25,
    STOP_MIN_CONSECUTIVE_LEADS: 5,
    STOP_AGREEMENT_K: 5,
    // Stop rule — fine constants (original hand-tuned)
    HC_POSTERIOR: 0.8,
    HC_MARGIN: 0.6,
    HC_CONSECUTIVE: 8,
    HC_COSINE_BLOCK: 0.94,
    SECONDARY_MIN_Q: 50,
    UC_POSTERIOR: 0.93,
    UC_MARGIN: 0.8,
    UC_CONSECUTIVE: 10,
    UC_MIN_Q: 30,
    LATE_GAME_MIN_Q: 55,
    LATE_GAME_POSTERIOR: 0.45,
    LATE_GAME_MARGIN: 0.2,
    LATE_GAME_CONSECUTIVE: 12,
    // Pruning (original hand-tuned)
    PRUNE_AFTER_QUESTIONS: 16,
    PRUNE_RATIO: 0.1,
    PRUNE_MIN_VIABLE: 8,
    // Batch-adaptive (original hand-tuned)
    BATCH_SIZE_MIN: 3,
    BATCH_SIZE_MAX: 4,
    BATCH_PRUNE_THRESHOLD: 0.02,
    BATCH_PRUNE_MIN_VIABLE: 15,
    // Question selection (original hand-tuned)
    EXPLOIT_BLEND_START: 20,
    EXPLOIT_BLEND_END: 32,
    DEVILS_ADVOCATE_WEIGHT: 0,
    NODE_OVERLAP_PENALTY: 0.3,
    BATCH_SEARCH_DEPTH: 10,
    // Salience surprise (disabled)
    SALIENCE_SURPRISE_LAMBDA: 0,
    SALIENCE_SURPRISE_THRESHOLD: 0.6,
    SURPRISE_ONSET: 62
  };
  var _active = { ...DEFAULTS };
  function getConfig() {
    return _active;
  }

  // src/engine/archetypeDistance.ts
  function continuousDistance(respondentPosDist, respondentSalDist, archetypePos, archetypeSal, anti) {
    const cfg = getConfig();
    const rp = centeredPos(expectedPosFrom5(respondentPosDist));
    const ap = centeredPos(archetypePos);
    const rs = expectedSalienceWeight(respondentSalDist);
    const as = archetypeSal <= 1 ? 0 : archetypeSal === 2 ? 1 : 1.5;
    const w = rs + cfg.ARCHETYPE_WEIGHT_BOOST * Math.max(0, as - rs);
    let dist = w * Math.pow(rp - ap, 2) + cfg.SALIENCE_MISMATCH_LAMBDA * Math.abs(rs - as);
    if (anti === "high") {
      dist += rs * Math.pow(Math.max(0, rp - 0.5), 2);
    }
    if (anti === "low") {
      dist += rs * Math.pow(Math.max(0, -0.5 - rp), 2);
    }
    if (cfg.CONFIRM_LAMBDA > 0 && as > 0) {
      const gap = Math.abs(rp - ap);
      if (gap < cfg.CONFIRM_RADIUS) {
        dist -= cfg.CONFIRM_LAMBDA * as * (cfg.CONFIRM_RADIUS - gap);
      }
    }
    return dist;
  }
  function categoricalDistance(nodeId, respondentCatDist, respondentSalDist, archetypeProbs, archetypeSal, antiCats) {
    const cfg = getConfig();
    const rs = expectedSalienceWeight(respondentSalDist);
    const as = archetypeSal <= 1 ? 0 : archetypeSal === 2 ? 1 : 1.5;
    const w = rs + cfg.ARCHETYPE_WEIGHT_BOOST * Math.max(0, as - rs);
    let dist = w * matrixBilinear(respondentCatDist, CATEGORY_COST_MATRIX[nodeId], archetypeProbs) + cfg.SALIENCE_MISMATCH_LAMBDA * Math.abs(rs - as);
    if (antiCats?.length) {
      for (const idx of antiCats) {
        dist += rs * (respondentCatDist[idx] ?? 0);
      }
    }
    if (cfg.CONFIRM_LAMBDA > 0 && as > 0) {
      let dot = 0;
      for (let i = 0; i < 6; i++) dot += (respondentCatDist[i] ?? 0) * (archetypeProbs[i] ?? 0);
      dist -= cfg.CONFIRM_LAMBDA * as * Math.max(0, dot - 0.2);
    }
    return dist;
  }
  function archetypeDistance(state, archetype) {
    let total = 0;
    const cfg = getConfig();
    const nAnswered = Object.keys(state.answers).length;
    const surpriseScale = cfg.SALIENCE_SURPRISE_LAMBDA > 0 ? Math.max(0, (nAnswered - cfg.SURPRISE_ONSET) / (63 - cfg.SURPRISE_ONSET)) : 0;
    for (const [nodeId, template] of Object.entries(archetype.nodes)) {
      if (template.kind === "continuous") {
        const node = state.continuous[nodeId];
        total += continuousDistance(node.posDist, node.salDist, template.pos, template.sal, template.anti);
        if (surpriseScale > 0 && template.sal <= 1) {
          const rs = expectedSalienceWeight(node.salDist);
          const surprise = Math.max(0, rs - cfg.SALIENCE_SURPRISE_THRESHOLD);
          if (surprise > 0) {
            const rp = centeredPos(expectedPosFrom5(node.posDist));
            const ap = centeredPos(template.pos);
            total += surpriseScale * cfg.SALIENCE_SURPRISE_LAMBDA * surprise * surprise * Math.pow(rp - ap, 2);
          }
        }
      } else {
        const node = state.categorical[nodeId];
        total += categoricalDistance(
          nodeId,
          node.catDist,
          node.salDist,
          template.probs,
          template.sal,
          template.antiCats
        );
        if (surpriseScale > 0 && template.sal <= 1) {
          const rs = expectedSalienceWeight(node.salDist);
          const surprise = Math.max(0, rs - cfg.SALIENCE_SURPRISE_THRESHOLD);
          if (surprise > 0) {
            total += surpriseScale * cfg.SALIENCE_SURPRISE_LAMBDA * surprise * surprise * matrixBilinear(node.catDist, CATEGORY_COST_MATRIX[nodeId], template.probs);
          }
        }
      }
    }
    return total;
  }
  function recomputeArchetypePosterior(state, archetypes) {
    const raw = archetypes.map((a) => a.prior * Math.exp(-archetypeDistance(state, a) / getConfig().TEMPERATURE));
    const probs = normalize(raw);
    archetypes.forEach((a, i) => {
      state.archetypePosterior[a.id] = probs[i] ?? 0;
    });
    let bestId = "";
    let bestP = -1;
    for (const a of archetypes) {
      const p = state.archetypePosterior[a.id] ?? 0;
      if (p > bestP) {
        bestP = p;
        bestId = a.id;
      }
    }
    if (bestId === state.currentLeader) {
      state.consecutiveLeadCount = (state.consecutiveLeadCount ?? 0) + 1;
    } else {
      state.currentLeader = bestId;
      state.consecutiveLeadCount = 1;
    }
  }
  function viableArchetypes(state, archetypes) {
    const nAnswered = Object.keys(state.answers).length;
    const sorted = [...archetypes].sort(
      (a, b) => (state.archetypePosterior[b.id] ?? 0) - (state.archetypePosterior[a.id] ?? 0)
    );
    const topP = state.archetypePosterior[sorted[0]?.id ?? ""] ?? 0;
    const cfg = getConfig();
    if (nAnswered < cfg.PRUNE_AFTER_QUESTIONS) {
      const cutoff2 = topP / 3;
      return sorted.filter((a) => (state.archetypePosterior[a.id] ?? 0) >= cutoff2);
    }
    const cutoff = topP * cfg.PRUNE_RATIO;
    const viable = sorted.filter((a) => (state.archetypePosterior[a.id] ?? 0) >= cutoff);
    if (viable.length < cfg.PRUNE_MIN_VIABLE) {
      return sorted.slice(0, cfg.PRUNE_MIN_VIABLE);
    }
    return viable;
  }
  function pruneArchetypes(state, archetypes, threshold = getConfig().BATCH_PRUNE_THRESHOLD, minViable = getConfig().BATCH_PRUNE_MIN_VIABLE) {
    const sorted = [...archetypes].sort(
      (a, b) => (state.archetypePosterior[b.id] ?? 0) - (state.archetypePosterior[a.id] ?? 0)
    );
    const topP = state.archetypePosterior[sorted[0]?.id ?? ""] ?? 0;
    if (topP === 0) return;
    const cutoff = topP * threshold;
    const survivors = sorted.filter(
      (a) => (state.archetypePosterior[a.id] ?? 0) >= cutoff
    );
    if (survivors.length >= minViable) {
      for (const a of archetypes) {
        if ((state.archetypePosterior[a.id] ?? 0) < cutoff) {
          state.archetypePosterior[a.id] = 0;
        }
      }
    } else {
      const keepSet = new Set(sorted.slice(0, minViable).map((a) => a.id));
      for (const a of archetypes) {
        if (!keepSet.has(a.id)) {
          state.archetypePosterior[a.id] = 0;
        }
      }
    }
    const total = archetypes.reduce(
      (s, a) => s + (state.archetypePosterior[a.id] ?? 0),
      0
    );
    if (total > 0) {
      for (const a of archetypes) {
        state.archetypePosterior[a.id] = (state.archetypePosterior[a.id] ?? 0) / total;
      }
    }
  }

  // src/engine/nodeStatus.ts
  var DISAGREE_CHECK_K = 3;
  function archetypesDisagreeOnNode(nodeId, archetypes) {
    if (archetypes.length < 2) return false;
    const topK = archetypes.slice(0, DISAGREE_CHECK_K);
    const templates = topK.map((a) => a.nodes[nodeId]).filter(Boolean);
    if (templates.length < 2) return false;
    const first = templates[0];
    for (const t2 of templates) {
      if (!t2) continue;
      if (first.kind !== t2.kind) return true;
      if (first.kind === "continuous" && t2.kind === "continuous") {
        if (first.pos !== t2.pos) return true;
      } else if (first.kind === "categorical" && t2.kind === "categorical") {
        const fMax = first.probs.indexOf(Math.max(...first.probs));
        const tMax = t2.probs.indexOf(Math.max(...t2.probs));
        if (fMax !== tMax) return true;
      }
    }
    return false;
  }
  function updateNodeStatuses(state, candidateArchetypes) {
    for (const [nodeId, node] of Object.entries(state.continuous)) {
      const probActive = node.salDist[2] + node.salDist[3];
      const enoughTouches = node.touches >= 2 && node.touchTypes.size >= 2;
      const separates = archetypesDisagreeOnNode(nodeId, candidateArchetypes);
      if (enoughTouches && probActive < 0.1 && !separates) {
        node.status = "dead";
      } else if (probActive >= 0.35 && (node.salDist[2] > 0.25 || node.salDist[3] > 0.25)) {
        node.status = separates ? "live_unresolved" : "live_resolved";
      } else {
        node.status = "unknown";
      }
    }
    for (const [nodeId, node] of Object.entries(state.categorical)) {
      const probActive = node.salDist[2] + node.salDist[3];
      const enoughTouches = node.touches >= 3 && node.touchTypes.size >= 2;
      const separates = archetypesDisagreeOnNode(nodeId, candidateArchetypes);
      const sorted = [...node.catDist].sort((a, b) => b - a);
      const catUncertainty = (sorted[0] ?? 0) - (sorted[1] ?? 0) < 0.3;
      if (enoughTouches && probActive < 0.1 && !separates) {
        node.status = "dead";
      } else if (probActive >= 0.35) {
        node.status = separates || catUncertainty ? "live_unresolved" : "live_resolved";
      } else {
        node.status = "unknown";
      }
    }
  }

  // src/engine/nextQuestion.ts
  var LIVE_OR_UNRESOLVED = /* @__PURE__ */ new Set(["unknown", "live_unresolved"]);
  function nodeIsLiveOrUnresolved(state, nodeId) {
    if (nodeId in state.continuous) {
      return LIVE_OR_UNRESOLVED.has(state.continuous[nodeId].status);
    }
    if (nodeId in state.categorical) {
      return LIVE_OR_UNRESOLVED.has(state.categorical[nodeId].status);
    }
    return false;
  }
  function answeredCount(state) {
    return Object.keys(state.answers).length;
  }
  function evaluatePredicate(state, predicate) {
    const liveMatch = predicate.match(/^(.+)_live_or_unresolved$/);
    if (liveMatch) {
      const nodeId = liveMatch[1];
      return nodeIsLiveOrUnresolved(state, nodeId);
    }
    const answered = answeredCount(state);
    switch (predicate) {
      // Eligible once we're past the fixed12 phase
      case "screen20_or_late_screen":
        return answered >= FIXED_16.length;
      // Late-stage consistency checks — most of the quiz is done
      case "late_consistency_check_only":
        return answered >= 30;
      // Low-weight items surfaced moderately late
      case "late_low_weight_only":
        return answered >= 20;
      // Background/biographical questions — very late filler
      case "background_prior_only":
        return answered >= 35;
      // Background eligible OR the TRB anchor is still uncertain
      case "background_prior_only_or_TRB_anchor_active": {
        if (answered >= 35) return true;
        const topAnchorProb = Math.max(...state.trbAnchor.dist);
        return state.trbAnchor.touches >= 1 && topAnchorProb < 0.45;
      }
      default:
        return false;
    }
  }
  function isQuestionEligible(state, q2) {
    const rules = q2.exposeRules?.eligibleIf;
    if (!rules || rules.length === 0) return true;
    return rules.some((predicate) => evaluatePredicate(state, predicate));
  }
  function topCandidateArchetypes(posterior, archetypes, k = 5) {
    return [...archetypes].sort((a, b) => (posterior[b.id] ?? 0) - (posterior[a.id] ?? 0)).slice(0, k);
  }
  function nodeUncertainty(state, nodeId) {
    if (nodeId in state.continuous) {
      const node = state.continuous[nodeId];
      return 1 - Math.max(...node.posDist);
    }
    if (nodeId in state.categorical) {
      const node = state.categorical[nodeId];
      return 1 - Math.max(...node.catDist);
    }
    if (nodeId === "TRB_ANCHOR") {
      return 1 - Math.max(...state.trbAnchor.dist);
    }
    return 0;
  }
  function coverageNeed(state, q2) {
    let score = 0;
    for (const touch of q2.touchProfile) {
      if (touch.node === "TRB_ANCHOR") {
        score += state.trbAnchor.touches < 2 ? 1 : 0.25;
        continue;
      }
      if (touch.kind === "continuous" && touch.node in state.continuous) {
        const n = state.continuous[touch.node];
        score += n.touches < 3 ? 1 : 0.25;
      } else if (touch.kind === "categorical" && touch.node in state.categorical) {
        const n = state.categorical[touch.node];
        score += n.touches < 4 ? 1.25 : 0.35;
      }
    }
    return score / Math.max(1, q2.touchProfile.length);
  }
  function candidateSeparation(q2, candidates) {
    let total = 0;
    for (const touch of q2.touchProfile) {
      if (touch.node === "TRB_ANCHOR") continue;
      const vals = candidates.map((a) => a.nodes[touch.node]).filter(Boolean).map((t2) => JSON.stringify(t2));
      const uniq = new Set(vals);
      total += uniq.size > 1 ? 1 : 0.2;
    }
    return total / Math.max(1, q2.touchProfile.length);
  }
  function scoreExploration(state, q2, archetypes) {
    const candidates = topCandidateArchetypes(state.archetypePosterior, archetypes, 6);
    const uncertainty = q2.touchProfile.reduce((sum, t2) => sum + nodeUncertainty(state, t2.node), 0) / Math.max(1, q2.touchProfile.length);
    return coverageNeed(state, q2) * Math.max(0.05, uncertainty) * candidateSeparation(q2, candidates) * q2.quality * (q2.rewriteNeeded ? 0.7 : 1);
  }
  function pairwiseDisagreement(q2, a1, a2) {
    let totalDisagreement = 0;
    let totalWeight = 0;
    for (const touch of q2.touchProfile) {
      if (touch.node === "TRB_ANCHOR") continue;
      const nodeId = touch.node;
      const t1 = a1.nodes[nodeId];
      const t2 = a2.nodes[nodeId];
      if (!t1 || !t2) continue;
      const w = touch.weight;
      totalWeight += w;
      if (t1.kind === "continuous" && t2.kind === "continuous") {
        const posDiff = Math.abs(t1.pos - t2.pos) / 4;
        const salDiff = Math.abs(t1.sal - t2.sal) / 3;
        totalDisagreement += w * (posDiff * 0.8 + salDiff * 0.2);
      } else if (t1.kind === "categorical" && t2.kind === "categorical") {
        let dot = 0;
        for (let i = 0; i < 6; i++) {
          dot += (t1.probs[i] ?? 0) * (t2.probs[i] ?? 0);
        }
        totalDisagreement += w * (1 - dot);
      }
    }
    return { disagreement: totalDisagreement, weight: totalWeight };
  }
  function discriminationScore(state, q2, topK) {
    let totalScore = 0;
    let pairCount = 0;
    for (let i = 0; i < topK.length; i++) {
      for (let j = i + 1; j < topK.length; j++) {
        const a1 = topK[i];
        const a2 = topK[j];
        const { disagreement, weight } = pairwiseDisagreement(q2, a1, a2);
        if (weight === 0) continue;
        const p1 = state.archetypePosterior[a1.id] ?? 0;
        const p2 = state.archetypePosterior[a2.id] ?? 0;
        const closeness = Math.min(p1, p2) / Math.max(p1, p2, 1e-3);
        totalScore += disagreement / weight * closeness;
        pairCount++;
      }
    }
    if (pairCount === 0) return 0;
    const uncertainty = q2.touchProfile.reduce((sum, t2) => sum + nodeUncertainty(state, t2.node), 0) / Math.max(1, q2.touchProfile.length);
    return totalScore / pairCount * Math.max(0.1, uncertainty) * q2.quality * (q2.rewriteNeeded ? 0.7 : 1);
  }
  function leaderBlindSpotScore(state, q2, leader) {
    let score = 0;
    let count = 0;
    for (const touch of q2.touchProfile) {
      if (touch.node === "TRB_ANCHOR") continue;
      const template = leader.nodes[touch.node];
      if (!template) continue;
      count++;
      if (template.sal <= 1) {
        score += touch.weight * nodeUncertainty(state, touch.node);
      }
    }
    return count > 0 ? score / count : 0;
  }
  function scoreQuestionBlended(state, q2, archetypes) {
    const cfg = getConfig();
    const nAnswered = Object.keys(state.answers).length;
    if (nAnswered < cfg.EXPLOIT_BLEND_START) {
      return scoreExploration(state, q2, archetypes);
    }
    const exploitAlpha = Math.min(
      1,
      (nAnswered - cfg.EXPLOIT_BLEND_START) / (cfg.EXPLOIT_BLEND_END - cfg.EXPLOIT_BLEND_START)
    );
    const exploreScore = scoreExploration(state, q2, archetypes);
    const candidates = topCandidateArchetypes(state.archetypePosterior, archetypes, 2);
    if (candidates.length < 2) return exploreScore;
    const discrimScore = discriminationScore(state, q2, candidates);
    let devilScore = 0;
    if (cfg.DEVILS_ADVOCATE_WEIGHT > 0 && exploitAlpha > 0) {
      const leader = candidates[0];
      devilScore = leaderBlindSpotScore(state, q2, leader);
    }
    return exploreScore * (1 - exploitAlpha) + (discrimScore + cfg.DEVILS_ADVOCATE_WEIGHT * devilScore) * exploitAlpha;
  }
  function computeBatchSize(state, archetypes) {
    const cfg = getConfig();
    const viable = viableArchetypes(state, archetypes);
    if (viable.length > 20) return cfg.BATCH_SIZE_MAX;
    if (viable.length > cfg.BATCH_PRUNE_MIN_VIABLE) return cfg.BATCH_SIZE_MIN;
    return 1;
  }
  function selectNextBatch(state, available, archetypes) {
    const batchSize = computeBatchSize(state, archetypes);
    const eligible = available.filter(
      (q2) => !(q2.id in state.answers) && isQuestionEligible(state, q2)
    );
    if (!eligible.length) return [];
    const scored = eligible.map((q2) => ({
      q: q2,
      baseScore: scoreQuestionBlended(state, q2, archetypes)
    }));
    scored.sort((a, b) => b.baseScore - a.baseScore);
    const batch = [];
    const selectedNodes = /* @__PURE__ */ new Set();
    while (batch.length < batchSize && scored.length > 0) {
      const cfg = getConfig();
      const searchDepth = Math.min(scored.length, cfg.BATCH_SEARCH_DEPTH);
      let bestIdx = 0;
      let bestScore = -Infinity;
      for (let i = 0; i < searchDepth; i++) {
        const candidate = scored[i];
        const touchNodes = candidate.q.touchProfile.map((t2) => t2.node);
        const overlapCount = touchNodes.filter((n) => selectedNodes.has(n)).length;
        const overlapPenalty = 1 - cfg.NODE_OVERLAP_PENALTY * overlapCount / Math.max(1, touchNodes.length);
        const adjustedScore = candidate.baseScore * overlapPenalty;
        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          bestIdx = i;
        }
      }
      const selected = scored.splice(bestIdx, 1)[0];
      batch.push(selected.q);
      for (const t2 of selected.q.touchProfile) {
        selectedNodes.add(t2.node);
      }
    }
    return batch;
  }

  // src/engine/stopRule.ts
  var CAT_CONFIDENT_GAP = 0.5;
  var _pairSimilarityCache = null;
  function ensureSimilarityCache(archetypes) {
    if (_pairSimilarityCache) return _pairSimilarityCache;
    _pairSimilarityCache = /* @__PURE__ */ new Map();
    function toVector(a) {
      const v = [];
      for (const [, t2] of Object.entries(a.nodes)) {
        if (t2.kind === "continuous") {
          v.push(t2.pos / 5, t2.sal / 3);
        } else {
          v.push(...t2.probs, t2.sal / 3);
        }
      }
      return v;
    }
    function cosine(a, b) {
      let dot = 0, na = 0, nb = 0;
      for (let i = 0; i < a.length; i++) {
        dot += (a[i] ?? 0) * (b[i] ?? 0);
        na += (a[i] ?? 0) ** 2;
        nb += (b[i] ?? 0) ** 2;
      }
      return na > 0 && nb > 0 ? dot / Math.sqrt(na * nb) : 0;
    }
    const vecs = archetypes.map((a) => ({ id: a.id, vec: toVector(a) }));
    for (let i = 0; i < vecs.length; i++) {
      for (let j = i + 1; j < vecs.length; j++) {
        const sim = cosine(vecs[i].vec, vecs[j].vec);
        const key = [vecs[i].id, vecs[j].id].sort().join("|");
        _pairSimilarityCache.set(key, sim);
      }
    }
    return _pairSimilarityCache;
  }
  function shouldStop(state, archetypes) {
    const cfg = getConfig();
    const nAnswered = Object.keys(state.answers).length;
    if (nAnswered < cfg.STOP_MIN_QUESTIONS) return false;
    const entries = Object.entries(state.archetypePosterior).sort((a, b) => b[1] - a[1]);
    const topId = entries[0]?.[0] ?? "";
    const top = entries[0]?.[1] ?? 0;
    const secondId = entries[1]?.[0] ?? "";
    const second = entries[1]?.[1] ?? 0;
    const margin = top - second;
    const significantCount = entries.filter(([, p]) => p > 5e-3).length;
    const adaptiveThreshold = Math.max(
      0.1,
      Math.min(cfg.STOP_POSTERIOR_THRESHOLD, 1 / Math.sqrt(significantCount) * 0.55)
    );
    let effectiveMargin = cfg.STOP_MARGIN_THRESHOLD;
    let pairSim = 0;
    if (archetypes) {
      const cache = ensureSimilarityCache(archetypes);
      const key = [topId, secondId].sort().join("|");
      pairSim = cache.get(key) ?? 0;
      if (pairSim > 0.95) {
        effectiveMargin = cfg.STOP_MARGIN_THRESHOLD * 4;
      } else if (pairSim > 0.92) {
        effectiveMargin = cfg.STOP_MARGIN_THRESHOLD * 2.5;
      }
    }
    const consecutiveCount = state.consecutiveLeadCount ?? 0;
    const stableLeader = consecutiveCount >= cfg.STOP_MIN_CONSECUTIVE_LEADS;
    const topKIds = entries.slice(0, cfg.STOP_AGREEMENT_K).map(([id]) => id);
    const topKArchetypes = archetypes ? archetypes.filter((a) => topKIds.includes(a.id)) : [];
    function topKAgreeOnContinuous(nodeId) {
      if (topKArchetypes.length < 2) return true;
      const templates = topKArchetypes.map((a) => a.nodes[nodeId]).filter((t2) => t2 && t2.kind === "continuous");
      if (templates.length < 2) return true;
      const positions = templates.map((t2) => t2.kind === "continuous" ? t2.pos : 0);
      return positions.every((p) => p === positions[0]);
    }
    function topKAgreeOnCategorical(nodeId) {
      if (topKArchetypes.length < 2) return true;
      const templates = topKArchetypes.map((a) => a.nodes[nodeId]).filter((t2) => t2 && t2.kind === "categorical");
      if (templates.length < 2) return true;
      const topCats = templates.map((t2) => {
        const probs = t2.kind === "categorical" ? t2.probs : [];
        return probs.indexOf(Math.max(...probs));
      });
      return topCats.every((c) => c === topCats[0]);
    }
    const anyContinuousBlocking = Object.entries(state.continuous).some(
      ([nodeId, n]) => n.status === "live_unresolved" && !topKAgreeOnContinuous(nodeId)
    );
    const anyCategoricalBlocking = Object.entries(state.categorical).some(([nodeId, n]) => {
      if (n.status !== "live_unresolved") return false;
      const sorted = [...n.catDist].sort((a, b) => b - a);
      const gap = (sorted[0] ?? 0) - (sorted[1] ?? 0);
      if (gap >= CAT_CONFIDENT_GAP) return false;
      return !topKAgreeOnCategorical(nodeId);
    });
    const highConfOverride = top >= cfg.HC_POSTERIOR && margin >= cfg.HC_MARGIN && consecutiveCount >= cfg.HC_CONSECUTIVE && pairSim < cfg.HC_COSINE_BLOCK;
    const primaryStop = top >= adaptiveThreshold && margin >= effectiveMargin && stableLeader && (highConfOverride || !anyContinuousBlocking && !anyCategoricalBlocking);
    const deepStableLeader = consecutiveCount >= 6;
    let secondaryMarginMultiplier = 1.5;
    if (archetypes) {
      const cache = ensureSimilarityCache(archetypes);
      const top3Ids = entries.slice(1, 4).map(([id]) => id);
      let maxSim = 0;
      for (const otherId of top3Ids) {
        const key = [topId, otherId].sort().join("|");
        maxSim = Math.max(maxSim, cache.get(key) ?? 0);
      }
      if (maxSim > 0.95) {
        secondaryMarginMultiplier = 5;
      } else if (maxSim > 0.92) {
        secondaryMarginMultiplier = 3;
      } else if (maxSim > 0.88) {
        secondaryMarginMultiplier = 2;
      }
    }
    const solidAbsMargin = margin >= effectiveMargin * secondaryMarginMultiplier;
    const solidRelMargin = second > 0 ? top / second >= 1.4 : true;
    const secondaryStop = nAnswered >= cfg.SECONDARY_MIN_Q && top >= adaptiveThreshold && solidAbsMargin && solidRelMargin && deepStableLeader;
    const ultraConfStop = nAnswered >= cfg.UC_MIN_Q && top >= cfg.UC_POSTERIOR && margin >= cfg.UC_MARGIN && consecutiveCount >= cfg.UC_CONSECUTIVE;
    const lateGameStop = nAnswered >= cfg.LATE_GAME_MIN_Q && top >= cfg.LATE_GAME_POSTERIOR && margin >= cfg.LATE_GAME_MARGIN && consecutiveCount >= cfg.LATE_GAME_CONSECUTIVE;
    return primaryStop || secondaryStop || ultraConfStop || lateGameStop;
  }

  // src/browser.ts
  var REP_BY_ID = new Map(REPRESENTATIVE_QUESTIONS.map((q2) => [q2.id, q2]));
  var QUESTION_BANK = FULL_QUESTIONS.map((fq) => {
    const rq = REP_BY_ID.get(fq.id);
    if (!rq) return fq;
    return {
      ...fq,
      ...rq.optionEvidence !== void 0 ? { optionEvidence: rq.optionEvidence } : {},
      ...rq.sliderMap !== void 0 ? { sliderMap: rq.sliderMap } : {},
      ...rq.allocationMap !== void 0 ? { allocationMap: rq.allocationMap } : {},
      ...rq.rankingMap !== void 0 ? { rankingMap: rq.rankingMap } : {},
      ...rq.pairMaps !== void 0 ? { pairMaps: rq.pairMaps } : {},
      ...rq.bestWorstMap !== void 0 ? { bestWorstMap: rq.bestWorstMap } : {}
    };
  });
  var BANK_BY_ID = new Map(QUESTION_BANK.map((q2) => [q2.id, q2]));
  var CAT_LABELS = {
    EPS: ["empiricist", "institutionalist", "traditionalist", "intuitionist", "autonomous", "nihilist"],
    AES: ["statesman", "technocrat", "pastoral", "authentic", "fighter", "visionary"],
    H: ["egalitarian", "meritocratic", "institutional", "traditional", "paternal", "strong_order"]
  };
  var NODE_NAMES = {
    MAT: "Economic Values",
    CD: "Cultural Direction",
    CU: "Cultural Universalism",
    MOR: "Moral Circle",
    PRO: "Proceduralism",
    COM: "Compromise",
    ZS: "Zero-Sum Thinking",
    ONT_H: "Ontological Hope",
    ONT_S: "Ontological Security",
    PF: "Party Feeling",
    TRB: "Tribalism",
    ENG: "Engagement",
    EPS: "Epistemics",
    AES: "Aesthetic Style",
    H: "Hierarchy"
  };
  var NODE_LOW_LABELS = {
    MAT: "Economic left",
    CD: "Progressive",
    CU: "Particularist",
    MOR: "Local/narrow",
    PRO: "Outcome-focused",
    COM: "Principled",
    ZS: "Positive-sum",
    ONT_H: "Pessimistic",
    ONT_S: "Secure",
    PF: "Strong Dem",
    TRB: "Low identity",
    ENG: "Disengaged"
  };
  var NODE_HIGH_LABELS = {
    MAT: "Economic right",
    CD: "Traditional",
    CU: "Universalist",
    MOR: "Global/wide",
    PRO: "Process-focused",
    COM: "Pragmatic",
    ZS: "Zero-sum",
    ONT_H: "Optimistic",
    ONT_S: "Anxious",
    PF: "Strong Rep",
    TRB: "High identity",
    ENG: "Highly engaged"
  };
  var ARCHETYPE_NAMES = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a.name]));
  var QuizEngine = class {
    state;
    fixedPhase;
    fixedIndex;
    questionsAsked;
    currentBatch;
    batchIndex;
    constructor() {
      this.state = createInitialState();
      this.fixedPhase = true;
      this.fixedIndex = 0;
      this.questionsAsked = 0;
      this.currentBatch = [];
      this.batchIndex = 0;
    }
    /** Get the next batch of questions. Returns [] when done. */
    getNextBatch() {
      if (this.fixedPhase) {
        const remaining = [];
        for (let i = this.fixedIndex; i < FIXED_16.length; i++) {
          const q2 = BANK_BY_ID.get(FIXED_16[i]);
          if (q2) remaining.push(q2);
        }
        return remaining;
      }
      if (this.questionsAsked >= 25 && shouldStop(this.state, ARCHETYPES)) {
        return [];
      }
      return selectNextBatch(this.state, QUESTION_BANK, ARCHETYPES);
    }
    /** Get the next single question (backward-compatible API). */
    getNextQuestion() {
      if (this.fixedPhase) {
        if (this.fixedIndex < FIXED_16.length) {
          const qid = FIXED_16[this.fixedIndex];
          return BANK_BY_ID.get(qid) ?? null;
        }
        this.fixedPhase = false;
        recomputeArchetypePosterior(this.state, ARCHETYPES);
        pruneArchetypes(this.state, ARCHETYPES);
        updateNodeStatuses(this.state, viableArchetypes(this.state, ARCHETYPES));
      }
      if (this.questionsAsked >= 25 && shouldStop(this.state, ARCHETYPES)) {
        return null;
      }
      if (this.batchIndex >= this.currentBatch.length) {
        this.currentBatch = selectNextBatch(this.state, QUESTION_BANK, ARCHETYPES);
        this.batchIndex = 0;
      }
      if (this.currentBatch.length === 0) return null;
      return this.currentBatch[this.batchIndex] ?? null;
    }
    applyAnswer(qId, answer, answerType) {
      const q2 = BANK_BY_ID.get(qId);
      if (!q2) return;
      switch (answerType) {
        case "single_choice":
          applySingleChoiceAnswer(this.state, q2, answer);
          break;
        case "slider":
          applySliderAnswer(this.state, q2, answer);
          break;
        case "allocation":
          applyAllocationAnswer(this.state, q2, answer);
          break;
        case "ranking":
          applyRankingAnswer(this.state, q2, answer);
          break;
        case "pairwise":
          applyPairwiseAnswer(this.state, q2, answer);
          break;
        case "best_worst":
          applyRankingAnswer(this.state, q2, answer);
          break;
        case "multi":
          for (const v of answer) {
            applySingleChoiceAnswer(this.state, q2, v);
          }
          this.state.answers[qId] = answer;
          break;
      }
      this.questionsAsked++;
      if (this.fixedPhase) {
        this.fixedIndex++;
        if (this.fixedIndex >= FIXED_16.length) {
          this.fixedPhase = false;
          recomputeArchetypePosterior(this.state, ARCHETYPES);
          pruneArchetypes(this.state, ARCHETYPES);
          updateNodeStatuses(this.state, viableArchetypes(this.state, ARCHETYPES));
        }
      } else {
        recomputeArchetypePosterior(this.state, ARCHETYPES);
        this.batchIndex++;
        if (this.batchIndex >= this.currentBatch.length) {
          pruneArchetypes(this.state, ARCHETYPES);
          updateNodeStatuses(this.state, viableArchetypes(this.state, ARCHETYPES));
        }
      }
    }
    isDone() {
      if (this.questionsAsked < 25) return false;
      return shouldStop(this.state, ARCHETYPES);
    }
    getResults() {
      const posteriors = Object.entries(this.state.archetypePosterior).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, p]) => ({
        id,
        name: ARCHETYPE_NAMES[id] ?? id,
        posterior: Math.round(p * 1e3) / 10
      }));
      const continuousNodes = Object.entries(this.state.continuous).map(([id, n]) => ({
        id,
        name: NODE_NAMES[id] ?? id,
        position: Math.round(expectedPosFrom5(n.posDist) * 100) / 100,
        salience: Math.round(expectedSalience(n.salDist) * 100) / 100,
        status: n.status,
        lowLabel: NODE_LOW_LABELS[id] ?? "",
        highLabel: NODE_HIGH_LABELS[id] ?? ""
      }));
      const categoricalNodes = Object.entries(this.state.categorical).map(([id, n]) => {
        const topIdx = expectedCatArgmax(n.catDist);
        const labels = CAT_LABELS[id] ?? [];
        return {
          id,
          name: NODE_NAMES[id] ?? id,
          topCategory: labels[topIdx] ?? "?",
          topCategoryProb: Math.round(n.catDist[topIdx] * 1e3) / 10,
          distribution: n.catDist.map((p, i) => ({
            label: labels[i] ?? `cat${i}`,
            prob: Math.round(p * 1e3) / 10
          })),
          salience: Math.round(expectedSalience(n.salDist) * 100) / 100,
          status: n.status
        };
      });
      const anchorLabels = ["national", "ideological", "religious", "class", "ethnic_racial", "global", "mixed_none"];
      const trbAnchor = this.state.trbAnchor.dist.map((p, i) => ({
        label: anchorLabels[i] ?? "?",
        prob: Math.round(p * 1e3) / 10
      }));
      return {
        questionsAsked: this.questionsAsked,
        topArchetypes: posteriors,
        continuousNodes,
        categoricalNodes,
        trbAnchor,
        winner: posteriors[0] ?? null
      };
    }
    getProgress() {
      const posteriors = Object.entries(this.state.archetypePosterior).sort((a, b) => b[1] - a[1]);
      const top = posteriors[0];
      return {
        questionsAsked: this.questionsAsked,
        topArchetype: top ? { id: top[0], name: ARCHETYPE_NAMES[top[0]] ?? top[0], posterior: Math.round(top[1] * 1e3) / 10 } : null,
        viable: viableArchetypes(this.state, ARCHETYPES).length
      };
    }
  };
  window.PRISM = {
    QuizEngine,
    QUESTION_BANK,
    ARCHETYPES,
    NODE_DEFS,
    NODE_NAMES,
    NODE_LOW_LABELS,
    NODE_HIGH_LABELS,
    CAT_LABELS,
    ARCHETYPE_NAMES
  };
})();
