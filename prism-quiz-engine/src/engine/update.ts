import type {
  ContinuousNodeId,
  CategoricalNodeId,
  OptionEvidence,
  PairOptionMap,
  QuestionDef,
  RespondentState
} from "../types.js";
import { multiplyAndNormalize, normalize, addToAnchorDist } from "./math.js";

function registerTouches(state: RespondentState, q: QuestionDef): void {
  for (const touch of q.touchProfile) {
    if (touch.node === "TRB_ANCHOR") continue;
    if (touch.kind === "continuous" && touch.node in state.continuous) {
      const node = state.continuous[touch.node as ContinuousNodeId];
      node.touches += 1;
      node.touchTypes.add(touch.touchType);
    } else if (touch.kind === "categorical" && touch.node in state.categorical) {
      const node = state.categorical[touch.node as CategoricalNodeId];
      node.touches += 1;
      node.touchTypes.add(touch.touchType);
    }
  }
}

function applyOptionEvidence(state: RespondentState, evidence: OptionEvidence | undefined): void {
  if (!evidence) return;

  if (evidence.continuous) {
    for (const [nodeId, upd] of Object.entries(evidence.continuous)) {
      const node = state.continuous[nodeId as ContinuousNodeId];
      if (upd?.pos) node.posDist = multiplyAndNormalize(node.posDist, upd.pos);
      if (upd?.sal) node.salDist = multiplyAndNormalize(node.salDist, upd.sal);
    }
  }

  if (evidence.categorical) {
    for (const [nodeId, upd] of Object.entries(evidence.categorical)) {
      const node = state.categorical[nodeId as CategoricalNodeId];
      if (upd?.cat) node.catDist = multiplyAndNormalize(node.catDist, upd.cat);
      if (upd?.sal) node.salDist = multiplyAndNormalize(node.salDist, upd.sal);
    }
  }

  if (evidence.trbAnchor) {
    state.trbAnchor.dist = addToAnchorDist(state.trbAnchor.dist, evidence.trbAnchor);
    state.trbAnchor.touches += 1;
  }
}

export function applySingleChoiceAnswer(
  state: RespondentState,
  q: QuestionDef,
  optionKey: string
): void {
  state.answers[q.id] = optionKey;
  registerTouches(state, q);
  applyOptionEvidence(state, q.optionEvidence?.[optionKey]);
}

export function applySliderAnswer(
  state: RespondentState,
  q: QuestionDef,
  rawValue: number
): void {
  state.answers[q.id] = rawValue;
  registerTouches(state, q);

  if (!q.sliderMap) return;
  const bucket = Object.keys(q.sliderMap).find((k) => {
    const parts = k.split("-").map(Number);
    const lo = parts[0] ?? 0;
    const hi = parts[1] ?? 100;
    return rawValue >= lo && rawValue <= hi;
  });
  if (!bucket) return;
  applyOptionEvidence(state, q.sliderMap[bucket]);
}

export function applyAllocationAnswer(
  state: RespondentState,
  q: QuestionDef,
  allocation: Record<string, number>
): void {
  state.answers[q.id] = allocation;
  registerTouches(state, q);

  if (!q.allocationMap) return;
  const total = Math.max(1, Object.values(allocation).reduce((a, b) => a + b, 0));

  for (const [bucket, weight] of Object.entries(allocation)) {
    const share = weight / total;
    const map = q.allocationMap[bucket];
    if (!map) continue;

    if (map.continuous) {
      for (const [nodeId, signal] of Object.entries(map.continuous)) {
        const node = state.continuous[nodeId as ContinuousNodeId];
        const current = node.posDist;
        const bump = current.map((p, i) => p * Math.exp((signal ?? 0) * share * ((i + 1) - 3)));
        node.posDist = normalize(bump as typeof node.posDist);
      }
    }

    if (map.categorical) {
      for (const [nodeId, catDist] of Object.entries(map.categorical)) {
        const node = state.categorical[nodeId as CategoricalNodeId];
        const mixed = node.catDist.map((v, i) => v * (1 - 0.35 * share) + (catDist[i] ?? 0) * (0.35 * share));
        node.catDist = normalize(mixed as typeof node.catDist);
      }
    }

    if (map.trbAnchor) {
      const scaled: Partial<Record<"national" | "ideological" | "religious" | "class" | "ethnic_racial" | "global" | "mixed_none", number>> = {};
      for (const [k, v] of Object.entries(map.trbAnchor)) {
        scaled[k as keyof typeof scaled] = v * share;
      }
      state.trbAnchor.dist = addToAnchorDist(state.trbAnchor.dist, scaled);
      state.trbAnchor.touches += 1;
    }
  }
}

export function applyRankingAnswer(
  state: RespondentState,
  q: QuestionDef,
  ranking: string[]
): void {
  state.answers[q.id] = ranking;
  registerTouches(state, q);

  if (!q.rankingMap) return;
  const weights = [1.0, 0.8, 0.55, 0.35, 0.2, 0.0];

  ranking.forEach((item, idx) => {
    const rankWeight = weights[idx] ?? 0;
    const map = q.rankingMap?.[item];
    if (!map) return;

    if (map.continuous) {
      for (const [nodeId, signal] of Object.entries(map.continuous)) {
        const node = state.continuous[nodeId as ContinuousNodeId];
        const bump = node.posDist.map((p, i) => p * Math.exp((signal ?? 0) * rankWeight * ((i + 1) - 3)));
        node.posDist = normalize(bump as typeof node.posDist);
      }
    }

    if (map.categorical) {
      for (const [nodeId, catDist] of Object.entries(map.categorical)) {
        const node = state.categorical[nodeId as CategoricalNodeId];
        const mixed = node.catDist.map((v, i) => v * (1 - 0.4 * rankWeight) + (catDist[i] ?? 0) * (0.4 * rankWeight));
        node.catDist = normalize(mixed as typeof node.catDist);
      }
    }

    if (map.trbAnchor) {
      const scaled: Partial<Record<"national" | "ideological" | "religious" | "class" | "ethnic_racial" | "global" | "mixed_none", number>> = {};
      for (const [k, v] of Object.entries(map.trbAnchor)) {
        scaled[k as keyof typeof scaled] = v * rankWeight;
      }
      state.trbAnchor.dist = addToAnchorDist(state.trbAnchor.dist, scaled);
      state.trbAnchor.touches += 1;
    }
  });
}

export function applyPairwiseAnswer(
  state: RespondentState,
  q: QuestionDef,
  answers: Record<string, string>
): void {
  state.answers[q.id] = answers;
  registerTouches(state, q);

  if (!q.pairMaps) return;
  for (const [pairId, chosen] of Object.entries(answers)) {
    const map: PairOptionMap | undefined = q.pairMaps[pairId]?.[chosen];
    if (!map) continue;

    if (map.continuous) {
      for (const [nodeId, signal] of Object.entries(map.continuous)) {
        const node = state.continuous[nodeId as ContinuousNodeId];
        const bump = node.posDist.map((p, i) => p * Math.exp((signal ?? 0) * ((i + 1) - 3)));
        node.posDist = normalize(bump as typeof node.posDist);
      }
    }

    if (map.categorical) {
      for (const [nodeId, catDist] of Object.entries(map.categorical)) {
        const node = state.categorical[nodeId as CategoricalNodeId];
        const mixed = node.catDist.map((v, i) => v * 0.6 + (catDist[i] ?? 0) * 0.4);
        node.catDist = normalize(mixed as typeof node.catDist);
      }
    }
  }
}
