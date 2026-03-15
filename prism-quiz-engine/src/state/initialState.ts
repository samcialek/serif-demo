import type {
  CategoricalNodeState,
  ContinuousNodeState,
  RespondentState,
  TrbAnchorDist
} from "../types.js";
import { CONTINUOUS_NODES, CATEGORICAL_NODES } from "../config/nodes.js";
import { ARCHETYPES } from "../config/archetypes.js";

const uniformPos5 = (): [number, number, number, number, number] => [0.2, 0.2, 0.2, 0.2, 0.2];
const uniformSal4 = (): [number, number, number, number] => [0.25, 0.25, 0.25, 0.25];
const uniformCat6 = (): [number, number, number, number, number, number] => [
  1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6
];
const uniformAnchor7 = (): TrbAnchorDist => [
  1 / 7, 1 / 7, 1 / 7, 1 / 7, 1 / 7, 1 / 7, 1 / 7
];

function createContinuousState(): ContinuousNodeState {
  return {
    posDist: uniformPos5(),
    salDist: uniformSal4(),
    touches: 0,
    touchTypes: new Set(),
    status: "unknown"
  };
}

function createCategoricalState(): CategoricalNodeState {
  return {
    catDist: uniformCat6(),
    salDist: uniformSal4(),
    touches: 0,
    touchTypes: new Set(),
    status: "unknown"
  };
}

export function createInitialState(): RespondentState {
  const continuous = Object.fromEntries(
    CONTINUOUS_NODES.map((id) => [id, createContinuousState()])
  ) as RespondentState["continuous"];

  const categorical = Object.fromEntries(
    CATEGORICAL_NODES.map((id) => [id, createCategoricalState()])
  ) as RespondentState["categorical"];

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
