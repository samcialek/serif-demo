export const FIXED_12 = [1, 2, 3, 4, 11, 15, 20, 21, 23, 31, 40, 47];

export const SCREEN_POOL = [
  5, 7, 8, 18, 19, 22, 24, 25, 38, 39, 42, 48, 51, 55, 56, 59, 60, 61, 62, 63
];

export const ACTIVE_SALIENCE_THRESHOLD = 2;
export const STOP_POSTERIOR_THRESHOLD = 0.25;
export const STOP_MARGIN_THRESHOLD = 0.08;
export const STOP_MIN_QUESTIONS = 25;
export const STOP_MIN_CONSECUTIVE_LEADS = 3;
export const TEMPERATURE = 1.2;
export const SALIENCE_MISMATCH_LAMBDA = 0.35;

// ---------------------------------------------------------------------------
// Hierarchical Bayesian pruning constants
// ---------------------------------------------------------------------------

/** After this many questions, begin aggressive archetype pruning. */
export const PRUNE_AFTER_QUESTIONS = 15;

/**
 * Archetypes whose posterior drops below (top_posterior * this factor) are
 * pruned from the viable set. The pruned set drives node-status checks and
 * question discrimination, allowing faster convergence.
 */
export const PRUNE_RATIO = 0.10;

/** Minimum viable set size — never prune below this many archetypes. */
export const PRUNE_MIN_VIABLE = 8;

/** Number of questions at which exploitation scoring begins blending in. */
export const EXPLOIT_BLEND_START = 16;

/** Number of questions at which exploitation scoring fully dominates. */
export const EXPLOIT_BLEND_END = 28;

/**
 * When unresolved nodes exist but all top-K candidates AGREE on those nodes,
 * the stop rule treats them as non-blocking. This is the K.
 */
export const STOP_AGREEMENT_K = 5;
