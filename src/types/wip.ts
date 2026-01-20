// Work Importance Profiler Types

export interface WIPValue {
  id: string;
  code: string;
  label: string;
  description: string | null;
  sort_order: number;
}

export interface WIPNeed {
  id: string;
  code: string;
  label: string;
  description: string | null;
  value_id: string;
  sort_order: number;
}

export interface WIPRound {
  id: string;
  round_index: number;
  need_ids: string[];
  is_active: boolean;
  version: string;
}

export interface WIPAssessment {
  id: string;
  user_id: string | null;
  audience_path: 'civilian' | 'military' | 'reentry';
  started_at: string;
  completed_at: string | null;
  version: string;
  metadata: Record<string, unknown>;
}

export interface WIPRoundResponse {
  id: string;
  assessment_id: string;
  round_index: number;
  ranked_need_ids: string[];
  created_at: string;
}

export interface WIPNeedScore {
  id: string;
  assessment_id: string;
  need_id: string;
  raw_score: number;
  std_score_0_100: number;
  appearances: number;
  min_possible: number;
  max_possible: number;
}

export interface WIPValueScore {
  id: string;
  assessment_id: string;
  value_id: string;
  raw_sum: number;
  raw_mean: number;
  std_score_0_100: number;
  min_possible: number;
  max_possible: number;
}

export interface ONetOUProfile {
  ou_code: string;
  title: string;
  job_zone: number;
  need_std_scores: Record<string, number>;
  description: string | null;
}

export interface WIPMatchResult {
  id: string;
  assessment_id: string;
  ou_code: string;
  job_zone: number;
  correlation: number;
  is_minimum_match: boolean;
  is_strong_match: boolean;
  rank_within_job_zone: number | null;
}

// Scoring constants - O*NET WIP uses -4 to +4 scale
// Rank 1 (most important) = +4, Rank 5 (least important) = -4
export const RANK_TO_POINTS: Record<number, number> = {
  1: 4,
  2: 2,
  3: 0,
  4: -2,
  5: -4,
};

// Match cutoffs from LinkingProfiles.pdf
export const MATCH_CUTOFFS = {
  MINIMUM: 0.291, // p < .10 one-tailed
  STRONG: 0.368,  // p < .05 one-tailed
};

// Extended types for UI
export interface WIPNeedWithValue extends WIPNeed {
  value: WIPValue;
}

export interface WIPRoundWithNeeds extends WIPRound {
  needs: WIPNeed[];
}

export interface WIPScoreResult {
  needScores: Array<{
    need: WIPNeed;
    rawScore: number;          // Original accumulated points from rankings
    rawScoreScaled: number;    // O*NET -4 to +4 scaled score
    stdScore: number;          // 0-100 standardized for UI
    appearances: number;
    relativeScoreNorm: number; // -1 to +1 normalized (intermediate step)
  }>;
  valueScores: Array<{
    value: WIPValue;
    rawSum: number;
    rawMean: number;
    stdScore: number;          // 0-100 (mean of underlying needs' stdScores)
    needCount: number;
  }>;
}
