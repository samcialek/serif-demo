// Original FIXED_12 (proven 124/124 accuracy) + 4 node-gap fillers:
//   Q8  = MOR position (0.90 weight) — critical gap, 9/15 unreachable archetypes
//   Q18 = ONT_H position (0.90 weight) — critical gap, 10/15 unreachable archetypes
//   Q38 = PRO salience (0.95 weight) — 5/15 unreachable archetypes
//   Q39 = TRB position (0.75) + COM position (0.45) — 6/15 unreachable archetypes
export const FIXED_16 = [1,2,3,4,8,11,15,18,20,21,23,31,38,39,40,47];

/** @deprecated Use FIXED_16 */
export const FIXED_12 = FIXED_16;

export const SCREEN_POOL = [
  5, 7, 19, 22, 24, 25, 42, 48, 51, 55, 56, 59, 60, 61, 62, 63
];

// All tunable constants now live in optimize/runtimeConfig.ts.
// These re-exports exist for backward-compatibility with modules that
// haven't been migrated yet.

export const ACTIVE_SALIENCE_THRESHOLD = 2;

// Stop rule (original hand-tuned — proven 124/124 accuracy)
export const STOP_POSTERIOR_THRESHOLD = 0.3;
export const STOP_MARGIN_THRESHOLD = 0.08;
export const STOP_MIN_QUESTIONS = 25;
export const STOP_MIN_CONSECUTIVE_LEADS = 5;
export const STOP_AGREEMENT_K = 5;

// Core distance
export const TEMPERATURE = 1.6;
export const SALIENCE_MISMATCH_LAMBDA = 0.98;

// Pruning (original hand-tuned)
export const PRUNE_AFTER_QUESTIONS = 16;
export const PRUNE_RATIO = 0.1;
export const PRUNE_MIN_VIABLE = 8;

// Question selection (original hand-tuned)
export const EXPLOIT_BLEND_START = 20;
export const EXPLOIT_BLEND_END = 32;
export const DEVILS_ADVOCATE_WEIGHT = 0;

// Batch-adaptive (original hand-tuned)
export const BATCH_SIZE_MIN = 3;
export const BATCH_SIZE_MAX = 4;
export const BATCH_PRUNE_THRESHOLD = 0.02;
export const BATCH_PRUNE_MIN_VIABLE = 15;

// Experimental (disabled)
export const ARCHETYPE_WEIGHT_BOOST = 1;
export const CONFIRM_LAMBDA = 0;
export const CONFIRM_RADIUS = 0.8;
export const SALIENCE_SURPRISE_LAMBDA = 0;
export const SALIENCE_SURPRISE_THRESHOLD = 0.6;
export const SURPRISE_ONSET = 62;
