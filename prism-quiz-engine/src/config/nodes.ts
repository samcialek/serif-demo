import type { NodeDef } from "../types.js";

export const NODE_DEFS: NodeDef[] = [
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

export const CONTINUOUS_NODES = NODE_DEFS.filter(
  (n) => n.type === "continuous"
).map((n) => n.id) as Array<
  | "MAT"
  | "CD"
  | "CU"
  | "MOR"
  | "PRO"
  | "COM"
  | "ZS"
  | "ONT_H"
  | "ONT_S"
  | "PF"
  | "TRB"
  | "ENG"
>;

export const CATEGORICAL_NODES = NODE_DEFS.filter(
  (n) => n.type === "categorical"
).map((n) => n.id) as Array<"EPS" | "AES">;
