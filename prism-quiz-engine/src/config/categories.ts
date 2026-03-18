import type { CategoricalDist } from "../types.js";

export const EPS_CATEGORIES = [
  "empiricist",
  "institutionalist",
  "traditionalist",
  "intuitionist",
  "autonomous",
  "nihilist"
] as const;

export const AES_CATEGORIES = [
  "statesman",
  "technocrat",
  "pastoral",
  "authentic",
  "fighter",
  "visionary"
] as const;

export const TRB_ANCHORS = [
  "national",
  "ideological",
  "religious",
  "class",
  "ethnic_racial",
  "global",
  "mixed_none"
] as const;

export const UNIFORM_CAT: CategoricalDist = [
  1 / 6,
  1 / 6,
  1 / 6,
  1 / 6,
  1 / 6,
  1 / 6
];

export const CATEGORY_COST_MATRIX: Record<"EPS" | "AES", number[][]> = {
  EPS: [
    [0, 0.4, 0.9, 0.8, 0.6, 1.1],
    [0.4, 0, 0.7, 0.7, 0.5, 1.0],
    [0.9, 0.7, 0, 0.7, 0.9, 1.0],
    [0.8, 0.7, 0.7, 0, 0.6, 0.9],
    [0.6, 0.5, 0.9, 0.6, 0, 0.8],
    [1.1, 1.0, 1.0, 0.9, 0.8, 0]
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

export const EPS_PROTOTYPES: Record<string, CategoricalDist> & {
  empiricist: CategoricalDist;
  institutionalist: CategoricalDist;
  traditionalist: CategoricalDist;
  intuitionist: CategoricalDist;
  autonomous: CategoricalDist;
  nihilist: CategoricalDist;
} = {
  empiricist: [0.72, 0.14, 0.03, 0.04, 0.05, 0.02],
  institutionalist: [0.15, 0.68, 0.05, 0.03, 0.06, 0.03],
  traditionalist: [0.04, 0.08, 0.70, 0.06, 0.08, 0.04],
  intuitionist: [0.05, 0.05, 0.08, 0.68, 0.09, 0.05],
  autonomous: [0.08, 0.08, 0.08, 0.10, 0.60, 0.06],
  nihilist: [0.03, 0.04, 0.04, 0.05, 0.10, 0.74]
};

export const AES_PROTOTYPES: Record<string, CategoricalDist> & {
  statesman: CategoricalDist;
  technocrat: CategoricalDist;
  pastoral: CategoricalDist;
  authentic: CategoricalDist;
  fighter: CategoricalDist;
  visionary: CategoricalDist;
} = {
  statesman: [0.70, 0.10, 0.04, 0.06, 0.04, 0.06],
  technocrat: [0.08, 0.74, 0.04, 0.04, 0.03, 0.07],
  pastoral: [0.06, 0.05, 0.72, 0.07, 0.03, 0.07],
  authentic: [0.05, 0.05, 0.08, 0.70, 0.05, 0.07],
  fighter: [0.04, 0.03, 0.04, 0.08, 0.73, 0.08],
  visionary: [0.06, 0.08, 0.05, 0.06, 0.08, 0.67]
};

