import type {
  CategoricalDist,
  ContinuousPosDist,
  SalienceDist,
  TrbAnchorDist
} from "../types.js";

export function normalize<T extends number[]>(arr: T): T {
  const s = arr.reduce((a, b) => a + b, 0);
  if (s <= 0) {
    const v = 1 / arr.length;
    return arr.map(() => v) as T;
  }
  return arr.map((x) => x / s) as T;
}

export function multiplyAndNormalize<T extends number[]>(a: T, b: T): T {
  const out = a.map((v, i) => v * (b[i] ?? 0)) as T;
  return normalize(out);
}

export function expectedPosFrom5(dist: ContinuousPosDist): number {
  return dist.reduce((sum, p, i) => sum + p * (i + 1), 0);
}

export function centeredPos(pos1to5: number): number {
  return pos1to5 - 3;
}

export function expectedSalience(dist: SalienceDist): number {
  return dist.reduce((sum, p, i) => sum + p * i, 0);
}

export function expectedCatArgmax(dist: CategoricalDist): number {
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

export function salienceWeight(s: number): number {
  if (s <= 1) return 0;
  if (s === 2) return 1;
  return 1.5;
}

export function expectedSalienceWeight(dist: SalienceDist): number {
  return dist.reduce((sum, p, i) => sum + p * salienceWeight(i), 0);
}

export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * (b[i] ?? 0), 0);
}

export function matrixBilinear(left: number[], matrix: number[][], right: number[]): number {
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

export function entropy(dist: number[]): number {
  return -dist.reduce((sum, p) => (p > 0 ? sum + p * Math.log(p) : sum), 0);
}

export function updateWeightedPointMass(
  current: ContinuousPosDist,
  shift: number
): ContinuousPosDist {
  const centers = [-2, -1, 0, 1, 2] as const;
  const scores = centers.map((c, i) => (current[i] ?? 0) * Math.exp(-Math.pow(c - shift, 2)));
  return normalize(scores as unknown as ContinuousPosDist);
}

export function updateSalienceToward(
  current: SalienceDist,
  target: number
): SalienceDist {
  const centers = [0, 1, 2, 3] as const;
  const scores = centers.map((c, i) => (current[i] ?? 0) * Math.exp(-0.8 * Math.pow(c - target, 2)));
  return normalize(scores as unknown as SalienceDist);
}

export function addToAnchorDist(
  current: TrbAnchorDist,
  bumps: Partial<Record<"national" | "ideological" | "religious" | "class" | "ethnic_racial" | "global" | "mixed_none", number>>
): TrbAnchorDist {
  const keys = ["national", "ideological", "religious", "class", "ethnic_racial", "global", "mixed_none"] as const;
  const out = current.map((v, i) => {
    const key = keys[i];
    return v + (key !== undefined ? (bumps[key] ?? 0.0001) : 0.0001);
  }) as TrbAnchorDist;
  return normalize(out);
}
