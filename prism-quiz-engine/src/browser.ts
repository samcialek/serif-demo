/**
 * Browser entry point — exports the quiz engine for use in the web quiz.
 * Bundled by esbuild into a single IIFE that exposes window.PRISM.
 */

import { ARCHETYPES } from "./config/archetypes.js";
import { REPRESENTATIVE_QUESTIONS } from "./config/questions.representative.js";
import { FULL_QUESTIONS } from "./config/questions.full.js";
import { FIXED_16 } from "./engine/config.js";
import { createInitialState } from "./state/initialState.js";
import type { QuestionDef, RespondentState } from "./types.js";
import {
  applyAllocationAnswer,
  applyPairwiseAnswer,
  applyRankingAnswer,
  applySingleChoiceAnswer,
  applySliderAnswer
} from "./engine/update.js";
import { recomputeArchetypePosterior, viableArchetypes, pruneArchetypes } from "./engine/archetypeDistance.js";
import { updateNodeStatuses } from "./engine/nodeStatus.js";
import { selectNextBatch } from "./engine/nextQuestion.js";
import { shouldStop } from "./engine/stopRule.js";
import { NODE_DEFS } from "./config/nodes.js";
import { expectedPosFrom5, expectedSalience, expectedCatArgmax } from "./engine/math.js";

// Build question bank
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
    ...(rq.bestWorstMap !== undefined ? { bestWorstMap: rq.bestWorstMap } : {})
  };
});

const BANK_BY_ID = new Map(QUESTION_BANK.map((q) => [q.id, q]));

// Category labels
const CAT_LABELS: Record<string, string[]> = {
  EPS: ["empiricist", "institutionalist", "traditionalist", "intuitionist", "autonomous", "nihilist"],
  AES: ["statesman", "technocrat", "pastoral", "authentic", "fighter", "visionary"],
  H: ["egalitarian", "meritocratic", "institutional", "traditional", "paternal", "strong_order"]
};

// Node display names
const NODE_NAMES: Record<string, string> = {
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

const NODE_LOW_LABELS: Record<string, string> = {
  MAT: "Economic left", CD: "Progressive", CU: "Particularist", MOR: "Local/narrow",
  PRO: "Outcome-focused", COM: "Principled", ZS: "Positive-sum", ONT_H: "Pessimistic",
  ONT_S: "Secure", PF: "Strong Dem", TRB: "Low identity", ENG: "Disengaged"
};

const NODE_HIGH_LABELS: Record<string, string> = {
  MAT: "Economic right", CD: "Traditional", CU: "Universalist", MOR: "Global/wide",
  PRO: "Process-focused", COM: "Pragmatic", ZS: "Zero-sum", ONT_H: "Optimistic",
  ONT_S: "Anxious", PF: "Strong Rep", TRB: "High identity", ENG: "Highly engaged"
};

// Archetype name lookup
const ARCHETYPE_NAMES = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a.name]));

// Quiz engine class — batch-adaptive architecture
class QuizEngine {
  state: RespondentState;
  fixedPhase: boolean;
  fixedIndex: number;
  questionsAsked: number;
  currentBatch: QuestionDef[];
  batchIndex: number;

  constructor() {
    this.state = createInitialState();
    this.fixedPhase = true;
    this.fixedIndex = 0;
    this.questionsAsked = 0;
    this.currentBatch = [];
    this.batchIndex = 0;
  }

  /** Get the next batch of questions. Returns [] when done. */
  getNextBatch(): QuestionDef[] {
    if (this.fixedPhase) {
      // Return remaining fixed questions as a batch
      const remaining: QuestionDef[] = [];
      for (let i = this.fixedIndex; i < FIXED_16.length; i++) {
        const q = BANK_BY_ID.get(FIXED_16[i]!);
        if (q) remaining.push(q);
      }
      return remaining;
    }

    if (this.questionsAsked >= 25 && shouldStop(this.state, ARCHETYPES)) {
      return [];
    }

    return selectNextBatch(this.state, QUESTION_BANK, ARCHETYPES);
  }

  /** Get the next single question (backward-compatible API). */
  getNextQuestion(): QuestionDef | null {
    // If we're in the fixed phase, return one at a time
    if (this.fixedPhase) {
      if (this.fixedIndex < FIXED_16.length) {
        const qid = FIXED_16[this.fixedIndex]!;
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

    // If we've exhausted the current batch, get a new one
    if (this.batchIndex >= this.currentBatch.length) {
      this.currentBatch = selectNextBatch(this.state, QUESTION_BANK, ARCHETYPES);
      this.batchIndex = 0;
    }

    if (this.currentBatch.length === 0) return null;
    return this.currentBatch[this.batchIndex] ?? null;
  }

  applyAnswer(qId: number, answer: any, answerType: string): void {
    const q = BANK_BY_ID.get(qId);
    if (!q) return;

    switch (answerType) {
      case "single_choice":
        applySingleChoiceAnswer(this.state, q, answer);
        break;
      case "slider":
        applySliderAnswer(this.state, q, answer);
        break;
      case "allocation":
        applyAllocationAnswer(this.state, q, answer);
        break;
      case "ranking":
        applyRankingAnswer(this.state, q, answer);
        break;
      case "pairwise":
        applyPairwiseAnswer(this.state, q, answer);
        break;
      case "best_worst":
        applyRankingAnswer(this.state, q, answer);
        break;
      case "multi":
        for (const v of answer) {
          applySingleChoiceAnswer(this.state, q, v);
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
      // Update posterior after each answer
      recomputeArchetypePosterior(this.state, ARCHETYPES);

      // Advance batch index; prune at batch boundary
      this.batchIndex++;
      if (this.batchIndex >= this.currentBatch.length) {
        pruneArchetypes(this.state, ARCHETYPES);
        updateNodeStatuses(this.state, viableArchetypes(this.state, ARCHETYPES));
      }
    }
  }

  isDone(): boolean {
    if (this.questionsAsked < 25) return false;
    return shouldStop(this.state, ARCHETYPES);
  }

  getResults() {
    const posteriors = Object.entries(this.state.archetypePosterior)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, p]) => ({
        id,
        name: ARCHETYPE_NAMES[id] ?? id,
        posterior: Math.round(p * 1000) / 10
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
        topCategoryProb: Math.round(n.catDist[topIdx]! * 1000) / 10,
        distribution: n.catDist.map((p, i) => ({
          label: labels[i] ?? `cat${i}`,
          prob: Math.round(p * 1000) / 10
        })),
        salience: Math.round(expectedSalience(n.salDist) * 100) / 100,
        status: n.status
      };
    });

    const anchorLabels = ["national", "ideological", "religious", "class", "ethnic_racial", "global", "mixed_none"];
    const trbAnchor = this.state.trbAnchor.dist.map((p, i) => ({
      label: anchorLabels[i] ?? "?",
      prob: Math.round(p * 1000) / 10
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
    const posteriors = Object.entries(this.state.archetypePosterior)
      .sort((a, b) => b[1] - a[1]);
    const top = posteriors[0];
    return {
      questionsAsked: this.questionsAsked,
      topArchetype: top ? { id: top[0], name: ARCHETYPE_NAMES[top[0]] ?? top[0], posterior: Math.round(top[1] * 1000) / 10 } : null,
      viable: viableArchetypes(this.state, ARCHETYPES).length
    };
  }
}

// Expose to window
(window as any).PRISM = {
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
