import { FULL_QUESTIONS } from "./config/questions.full.js";
import { REPRESENTATIVE_QUESTIONS } from "./config/questions.representative.js";
import type { QuestionDef, NodeId, CategoricalNodeId } from "./types.js";

// ---------------------------------------------------------------------------
// Build merged question bank (same as catDiagnostic)
// ---------------------------------------------------------------------------
const REP_BY_ID = new Map(REPRESENTATIVE_QUESTIONS.map((q) => [q.id, q]));
const QUESTION_BANK: QuestionDef[] = FULL_QUESTIONS.map((fq) => {
  const rq = REP_BY_ID.get(fq.id);
  if (!rq) return fq;
  return {
    ...fq,
    ...(rq.optionEvidence !== undefined ? { optionEvidence: rq.optionEvidence } : {}),
    ...(rq.sliderMap !== undefined ? { sliderMap: rq.sliderMap } : {}),
    ...(rq.allocationMap !== undefined ? { allocationMap: rq.allocationMap } : {}),
    ...(rq.rankingMap !== undefined ? { rankingMap: rq.rankingMap } : {}),
    ...(rq.pairMaps !== undefined ? { pairMaps: rq.pairMaps } : {}),
    ...(rq.bestWorstMap !== undefined ? { bestWorstMap: rq.bestWorstMap } : {}),
  };
});

// ---------------------------------------------------------------------------
// All nodes
// ---------------------------------------------------------------------------
const CONTINUOUS_NODES: NodeId[] = [
  "MAT", "CD", "CU", "MOR", "PRO", "COM", "ZS", "ONT_H", "ONT_S", "PF", "TRB", "ENG"
];
const CATEGORICAL_NODES: CategoricalNodeId[] = ["EPS", "AES"];
const ALL_NODES: NodeId[] = [...CONTINUOUS_NODES, ...CATEGORICAL_NODES];

// ---------------------------------------------------------------------------
// SECTION 1: TouchProfile coverage (what questions DECLARE they touch)
// ---------------------------------------------------------------------------
console.log("=".repeat(100));
console.log("SECTION 1: TouchProfile Coverage (what each question DECLARES it touches)");
console.log("=".repeat(100));

// Build node -> questions map from touchProfiles
const touchMap: Record<string, { qId: number; weight: number; role: string }[]> = {};
for (const n of ALL_NODES) touchMap[n] = [];
touchMap["TRB_ANCHOR"] = [];

for (const q of QUESTION_BANK) {
  for (const tp of q.touchProfile) {
    const nodeId = tp.node as string;
    if (touchMap[nodeId]) {
      touchMap[nodeId]!.push({ qId: q.id, weight: tp.weight, role: tp.role });
    }
  }
}

console.log("\nNode coverage from touchProfiles:");
console.log("  " + "Node".padEnd(12) + "# Qs".padStart(5) + "  " + "Qs (weight ≥ 0.3)".padStart(18) + "  Questions");
console.log("  " + "-".repeat(90));

for (const n of [...ALL_NODES, "TRB_ANCHOR" as any]) {
  const entries = touchMap[n as string]!;
  const highWeight = entries.filter(e => e.weight >= 0.3);
  const qList = entries.map(e => `${e.qId}(${e.weight.toFixed(2)})`).join(", ");
  console.log(
    "  " +
    String(n).padEnd(12) +
    String(entries.length).padStart(5) + "  " +
    String(highWeight.length).padStart(18) + "  " +
    qList
  );
}

// ---------------------------------------------------------------------------
// SECTION 2: Actual evidence coverage — what the evidence maps contain
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 2: Actual Evidence Coverage (what nodes appear in evidence maps)");
console.log("=".repeat(100));

interface EvidenceHit {
  qId: number;
  evidenceType: string; // "optionEvidence" | "sliderMap" | "allocationMap" | "rankingMap" | "pairMaps" | "bestWorstMap"
  optionKey: string;
  nodeId: string;
  evidenceKind: "continuous_pos" | "continuous_sal" | "categorical_cat" | "categorical_sal" | "continuous_scalar";
  isEmpty: boolean;
}

const evidenceHits: EvidenceHit[] = [];

function scanEvidence(qId: number, evidenceType: string, optionKey: string, evidence: any) {
  if (!evidence || typeof evidence !== "object") return;

  // Check continuous
  if (evidence.continuous) {
    for (const [nodeId, upd] of Object.entries(evidence.continuous)) {
      if (upd && typeof upd === "object" && "pos" in (upd as any)) {
        evidenceHits.push({ qId, evidenceType, optionKey, nodeId, evidenceKind: "continuous_pos", isEmpty: false });
      }
      if (upd && typeof upd === "object" && "sal" in (upd as any)) {
        evidenceHits.push({ qId, evidenceType, optionKey, nodeId, evidenceKind: "continuous_sal", isEmpty: false });
      }
      // Scalar evidence (ranking/allocation use raw numbers)
      if (typeof upd === "number") {
        evidenceHits.push({ qId, evidenceType, optionKey, nodeId, evidenceKind: "continuous_scalar", isEmpty: false });
      }
    }
  }

  // Check categorical
  if (evidence.categorical) {
    for (const [nodeId, upd] of Object.entries(evidence.categorical)) {
      if (!upd || typeof upd !== "object") {
        evidenceHits.push({ qId, evidenceType, optionKey, nodeId, evidenceKind: "categorical_cat", isEmpty: true });
        continue;
      }
      const hasContent = Object.keys(upd as any).length > 0;
      if ((upd as any).cat) {
        evidenceHits.push({ qId, evidenceType, optionKey, nodeId, evidenceKind: "categorical_cat", isEmpty: false });
      }
      if ((upd as any).sal) {
        evidenceHits.push({ qId, evidenceType, optionKey, nodeId, evidenceKind: "categorical_sal", isEmpty: false });
      }
      if (!hasContent) {
        evidenceHits.push({ qId, evidenceType, optionKey, nodeId, evidenceKind: "categorical_cat", isEmpty: true });
      }
    }
  }

  // Check if evidence object itself is empty
  const hasAnyEvidence = evidence.continuous || evidence.categorical;
  if (!hasAnyEvidence && Object.keys(evidence).length === 0) {
    evidenceHits.push({ qId, evidenceType, optionKey, nodeId: "NONE", evidenceKind: "continuous_pos", isEmpty: true });
  }
}

for (const q of QUESTION_BANK) {
  if (q.optionEvidence) {
    for (const [key, ev] of Object.entries(q.optionEvidence)) {
      scanEvidence(q.id, "optionEvidence", key, ev);
    }
  }
  if (q.sliderMap) {
    for (const [key, ev] of Object.entries(q.sliderMap)) {
      scanEvidence(q.id, "sliderMap", key, ev);
    }
  }
  if (q.allocationMap) {
    for (const [key, ev] of Object.entries(q.allocationMap)) {
      scanEvidence(q.id, "allocationMap", key, ev);
    }
  }
  if (q.rankingMap) {
    for (const [key, ev] of Object.entries(q.rankingMap)) {
      scanEvidence(q.id, "rankingMap", key, ev);
    }
  }
  if (q.pairMaps) {
    for (const [pairId, options] of Object.entries(q.pairMaps)) {
      for (const [optKey, ev] of Object.entries(options)) {
        scanEvidence(q.id, "pairMaps", `${pairId}/${optKey}`, ev);
      }
    }
  }
  if (q.bestWorstMap) {
    for (const [key, ev] of Object.entries(q.bestWorstMap)) {
      scanEvidence(q.id, "bestWorstMap", key, ev);
    }
  }
}

// Summarize by node
console.log("\nActual evidence presence per node:");
console.log("  " + "Node".padEnd(12) + "# Qs with evidence".padStart(20) + "  " + "# Empty/missing".padStart(16) + "  Questions with real evidence");
console.log("  " + "-".repeat(95));

for (const n of ALL_NODES) {
  const nodeHits = evidenceHits.filter(h => h.nodeId === n);
  const realHits = nodeHits.filter(h => !h.isEmpty);
  const emptyHits = nodeHits.filter(h => h.isEmpty);

  const uniqueQsReal = [...new Set(realHits.map(h => h.qId))];
  const uniqueQsEmpty = [...new Set(emptyHits.map(h => h.qId))];

  console.log(
    "  " +
    String(n).padEnd(12) +
    String(uniqueQsReal.length).padStart(20) + "  " +
    String(uniqueQsEmpty.length).padStart(16) + "  " +
    uniqueQsReal.sort((a,b) => a-b).join(", ")
  );
}

// ---------------------------------------------------------------------------
// SECTION 3: Questions with NO evidence maps at all
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 3: Questions with NO evidence mapping (touchProfile only, no evidence)");
console.log("=".repeat(100));

for (const q of QUESTION_BANK) {
  const hasEvidence = q.optionEvidence || q.sliderMap || q.allocationMap || q.rankingMap || q.pairMaps || q.bestWorstMap;
  if (!hasEvidence) {
    const touchNodes = q.touchProfile.map(tp => `${tp.node}(${tp.weight})`).join(", ");
    console.log(`  Q${q.id} [${q.stage}] "${q.promptShort}" (${q.uiType}) — touches: ${touchNodes}`);
  }
}

// ---------------------------------------------------------------------------
// SECTION 4: Questions that touch EPS/AES in touchProfile but have no categorical evidence
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 4: Questions that DECLARE EPS/AES touch but have NO or EMPTY categorical evidence");
console.log("=".repeat(100));

for (const q of QUESTION_BANK) {
  const catTouches = q.touchProfile.filter(tp => tp.node === "EPS" || tp.node === "AES");
  if (catTouches.length === 0) continue;

  // Check if evidence maps contain actual categorical evidence for these nodes
  const qEvidenceNodes = new Set<string>();
  const qEmptyNodes = new Set<string>();

  for (const h of evidenceHits.filter(h => h.qId === q.id)) {
    if (h.nodeId === "EPS" || h.nodeId === "AES") {
      if (h.isEmpty) qEmptyNodes.add(h.nodeId);
      else qEvidenceNodes.add(h.nodeId);
    }
  }

  for (const ct of catTouches) {
    const hasRealEvidence = qEvidenceNodes.has(ct.node);
    const hasEmptyEvidence = qEmptyNodes.has(ct.node);
    const hasNoEvidence = !hasRealEvidence && !hasEmptyEvidence;

    if (!hasRealEvidence) {
      const status = hasEmptyEvidence ? "EMPTY evidence ({})" : "NO evidence at all";
      console.log(`  Q${q.id} [${q.stage}] "${q.promptShort}" — ${ct.node} weight=${ct.weight} role=${ct.role} → ${status}`);
    }
  }
}

// ---------------------------------------------------------------------------
// SECTION 5: Empty evidence objects found
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 5: All empty evidence objects found in mappings");
console.log("=".repeat(100));

const emptyHits = evidenceHits.filter(h => h.isEmpty);
if (emptyHits.length === 0) {
  console.log("  None found!");
} else {
  for (const h of emptyHits) {
    console.log(`  Q${h.qId} ${h.evidenceType} → option "${h.optionKey}" → ${h.nodeId} is EMPTY`);
  }
}

// ---------------------------------------------------------------------------
// SECTION 6: Coverage gap matrix — touchProfile vs actual evidence
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 6: Coverage Gap Matrix — touchProfile declares vs evidence delivers");
console.log("=".repeat(100));

console.log("\n  Question-by-Node coverage (T = touchProfile declares, E = evidence delivers, X = both, - = neither)");
console.log("  " + "Q".padEnd(4) + "Stage".padEnd(10) + ALL_NODES.map(n => n.padStart(7)).join("") + "  uiType");
console.log("  " + "-".repeat(4 + 10 + ALL_NODES.length * 7 + 12));

for (const q of QUESTION_BANK) {
  const touchedNodes = new Set(q.touchProfile.map(tp => tp.node));
  const evidencedNodes = new Set(
    evidenceHits.filter(h => h.qId === q.id && !h.isEmpty).map(h => h.nodeId)
  );

  let row = "  " + String(q.id).padEnd(4) + q.stage.padEnd(10);
  for (const n of ALL_NODES) {
    const hasTouchProfile = touchedNodes.has(n);
    const hasEvidence = evidencedNodes.has(n);

    if (hasTouchProfile && hasEvidence) row += "X".padStart(7);
    else if (hasTouchProfile && !hasEvidence) row += "T".padStart(7);
    else if (!hasTouchProfile && hasEvidence) row += "E".padStart(7);
    else row += "-".padStart(7);
  }
  row += "  " + q.uiType;
  console.log(row);
}

// ---------------------------------------------------------------------------
// SECTION 7: Summary stats
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(100));
console.log("SECTION 7: Summary");
console.log("=".repeat(100));

const totalQs = QUESTION_BANK.length;
const qsWithEvidence = new Set(evidenceHits.filter(h => !h.isEmpty).map(h => h.qId)).size;
const qsWithNoEvidence = totalQs - qsWithEvidence;

console.log(`\n  Total questions: ${totalQs}`);
console.log(`  Questions with ANY evidence map: ${qsWithEvidence}`);
console.log(`  Questions with NO evidence map:  ${qsWithNoEvidence}`);

console.log("\n  Per-node summary:");
console.log("  " + "Node".padEnd(12) + "TouchProfile Qs".padStart(16) + "  Evidence Qs".padStart(13) + "  GAP (T-only)".padStart(14) + "  High-weight T (≥0.3)".padStart(22));
for (const n of ALL_NODES) {
  const tpQs = new Set(QUESTION_BANK.filter(q => q.touchProfile.some(tp => tp.node === n)).map(q => q.id));
  const evQs = new Set(evidenceHits.filter(h => h.nodeId === n && !h.isEmpty).map(h => h.qId));
  const tpOnly = [...tpQs].filter(id => !evQs.has(id));
  const highWeightT = QUESTION_BANK.filter(q => q.touchProfile.some(tp => tp.node === n && tp.weight >= 0.3)).length;

  console.log(
    "  " +
    String(n).padEnd(12) +
    String(tpQs.size).padStart(16) + "  " +
    String(evQs.size).padStart(12) + "  " +
    String(tpOnly.length).padStart(13) + "  " +
    String(highWeightT).padStart(21)
  );
}

// EPS and AES specific detail
console.log("\n  EPS/AES specific:");
for (const catNode of CATEGORICAL_NODES) {
  const tpQs = QUESTION_BANK.filter(q => q.touchProfile.some(tp => tp.node === catNode));
  const evQs = [...new Set(evidenceHits.filter(h => h.nodeId === catNode && !h.isEmpty).map(h => h.qId))];

  console.log(`\n  ${catNode}:`);
  console.log(`    Declared in touchProfile: ${tpQs.length} questions → ${tpQs.map(q => `Q${q.id}(${q.touchProfile.find(tp => tp.node === catNode)!.weight})`).join(", ")}`);
  console.log(`    Has actual evidence: ${evQs.length} questions → ${evQs.sort((a,b) => a-b).map(id => `Q${id}`).join(", ")}`);
  console.log(`    MISSING evidence: ${tpQs.filter(q => !evQs.includes(q.id)).map(q => `Q${q.id}(w=${q.touchProfile.find(tp => tp.node === catNode)!.weight})`).join(", ") || "none"}`);
}
