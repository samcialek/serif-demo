export type ContinuousNodeId =
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
  | "ENG";

export type CategoricalNodeId = "EPS" | "AES";

export type NodeId = ContinuousNodeId | CategoricalNodeId;

export type Cluster = "ENDS" | "MEANS" | "REALITY" | "SELF";
export type NodeType = "continuous" | "categorical";

export interface NodeDef {
  id: NodeId;
  type: NodeType;
  cluster: Cluster;
}

export type ArchetypeTier = "T1" | "T2" | "MEANS" | "GATE" | "REALITY";

export interface ContinuousTemplate {
  kind: "continuous";
  pos: 1 | 2 | 3 | 4 | 5;
  sal: 0 | 1 | 2 | 3;
  anti?: "high" | "low";
}

export interface CategoricalTemplate {
  kind: "categorical";
  probs: [number, number, number, number, number, number];
  sal: 0 | 1 | 2 | 3;
  antiCats?: number[];
}

export type ArchetypeNodeTemplate = ContinuousTemplate | CategoricalTemplate;

export interface Archetype {
  id: string;
  name: string;
  tier: ArchetypeTier;
  prior: number;
  nodes: Partial<Record<NodeId, ArchetypeNodeTemplate>>;
  trbAnchorPrior?: Partial<Record<TrbAnchor, number>>;
}

export type QuestionStage = "fixed12" | "screen20" | "stage2" | "stage3";

export type QuestionUiType =
  | "single_choice"
  | "slider"
  | "allocation"
  | "ranking"
  | "pairwise"
  | "best_worst"
  | "multi";

export type TouchRole = "position" | "salience" | "category" | "anchor";
export type TouchKind = "continuous" | "categorical" | "derived";

export interface TouchTarget {
  node: NodeId | "TRB_ANCHOR";
  kind: TouchKind;
  role: TouchRole;
  weight: number;
  touchType: string;
}

export type SalienceDist = [number, number, number, number];
export type ContinuousPosDist = [number, number, number, number, number];
export type CategoricalDist = [number, number, number, number, number, number];

export interface OptionEvidenceContinuous {
  pos?: ContinuousPosDist;
  sal?: SalienceDist;
}

export interface OptionEvidenceCategorical {
  cat?: CategoricalDist;
  sal?: SalienceDist;
}

export type TrbAnchor =
  | "national"
  | "ideological"
  | "religious"
  | "class"
  | "ethnic_racial"
  | "global"
  | "mixed_none";

export type TrbAnchorDist = [
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

export interface OptionEvidence {
  continuous?: Partial<Record<ContinuousNodeId, OptionEvidenceContinuous>>;
  categorical?: Partial<Record<CategoricalNodeId, OptionEvidenceCategorical>>;
  trbAnchor?: Partial<Record<TrbAnchor, number>>;
}

export interface AllocationBucketMap {
  continuous?: Partial<Record<ContinuousNodeId, number>>;
  categorical?: Partial<Record<CategoricalNodeId, CategoricalDist>>;
  trbAnchor?: Partial<Record<TrbAnchor, number>>;
}

export interface RankingItemMap {
  continuous?: Partial<Record<ContinuousNodeId, number>>;
  categorical?: Partial<Record<CategoricalNodeId, CategoricalDist>>;
  trbAnchor?: Partial<Record<TrbAnchor, number>>;
}

export interface PairOptionMap {
  continuous?: Partial<Record<ContinuousNodeId, number>>;
  categorical?: Partial<Record<CategoricalNodeId, CategoricalDist>>;
}

export interface QuestionDef {
  id: number;
  stage: QuestionStage;
  section: string;
  promptShort: string;
  uiType: QuestionUiType;
  quality: number;
  rewriteNeeded: boolean;
  touchProfile: TouchTarget[];

  optionEvidence?: Record<string, OptionEvidence>;

  sliderMap?: Record<string, OptionEvidence>;

  allocationMap?: Record<string, AllocationBucketMap>;

  rankingMap?: Record<string, RankingItemMap>;

  pairMaps?: Record<string, Record<string, PairOptionMap>>;

  bestWorstMap?: Record<string, RankingItemMap>;

  exposeRules?: {
    eligibleIf?: string[];
    goodFollowupsIfUnresolved?: number[];
  };
}

export type NodeStatus = "unknown" | "dead" | "live_resolved" | "live_unresolved";

export interface ContinuousNodeState {
  posDist: ContinuousPosDist;
  salDist: SalienceDist;
  touches: number;
  touchTypes: Set<string>;
  status: NodeStatus;
}

export interface CategoricalNodeState {
  catDist: CategoricalDist;
  salDist: SalienceDist;
  touches: number;
  touchTypes: Set<string>;
  status: NodeStatus;
}

export interface RespondentState {
  answers: Record<number, unknown>;
  continuous: Record<ContinuousNodeId, ContinuousNodeState>;
  categorical: Record<CategoricalNodeId, CategoricalNodeState>;
  trbAnchor: {
    dist: TrbAnchorDist;
    touches: number;
  };
  archetypePosterior: Record<string, number>;
  /** ID of the current leading archetype (highest posterior). */
  currentLeader?: string;
  /** How many consecutive questions the current leader has held the top spot. */
  consecutiveLeadCount?: number;
}
