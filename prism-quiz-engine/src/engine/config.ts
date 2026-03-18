export const FIXED_12 = [1, 2, 3, 4, 11, 15, 20, 21, 23, 31, 40, 47];

export const SCREEN_POOL = [
  5, 7, 8, 18, 19, 22, 24, 25, 38, 39, 42, 48, 51, 55, 56, 59, 60, 61, 62, 63
];

export const ACTIVE_SALIENCE_THRESHOLD = 2;
export const STOP_POSTERIOR_THRESHOLD = 0.3;
export const STOP_MARGIN_THRESHOLD = 0.08;
export const STOP_MIN_QUESTIONS = 30;
export const STOP_MIN_CONSECUTIVE_LEADS = 5;
export const TEMPERATURE = 1.6;
export const SALIENCE_MISMATCH_LAMBDA = 0.98;

// ---------------------------------------------------------------------------
// Hierarchical Bayesian pruning constants
// ---------------------------------------------------------------------------

export const PRUNE_AFTER_QUESTIONS = 15;
export const PRUNE_RATIO = 0.1;
export const PRUNE_MIN_VIABLE = 8;
export const EXPLOIT_BLEND_START = 16;
export const EXPLOIT_BLEND_END = 28;
export const STOP_AGREEMENT_K = 5;
