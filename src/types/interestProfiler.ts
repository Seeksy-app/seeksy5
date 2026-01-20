// Interest Profiler (RIASEC) Types

export type RIASECCode = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export interface RIASECType {
  code: RIASECCode;
  name: string;
  tagline: string;
  color: string;
}

export const RIASEC_TYPES: Record<RIASECCode, RIASECType> = {
  R: { code: 'R', name: 'Realistic', tagline: 'Hands-on, practical, tools/tech', color: 'hsl(210, 70%, 45%)' },
  I: { code: 'I', name: 'Investigative', tagline: 'Analytical, curious, science/data', color: 'hsl(45, 80%, 50%)' },
  A: { code: 'A', name: 'Artistic', tagline: 'Creative, expressive, design/writing', color: 'hsl(25, 80%, 55%)' },
  S: { code: 'S', name: 'Social', tagline: 'Helping, teaching, supporting others', color: 'hsl(200, 70%, 50%)' },
  E: { code: 'E', name: 'Enterprising', tagline: 'Persuading, leading, selling, building', color: 'hsl(0, 70%, 50%)' },
  C: { code: 'C', name: 'Conventional', tagline: 'Organized, detail, systems/process', color: 'hsl(140, 50%, 40%)' },
};

export interface IPItem {
  id: string;
  riasec_code: RIASECCode;
  prompt: string;
  display_order: number;
  version: string;
  is_active: boolean;
}

export interface IPAssessment {
  id: string;
  user_id: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  mode: 'short' | 'standard';
  started_at: string;
  completed_at: string | null;
  top_code_3: string | null;
  scores_json: Record<RIASECCode, number> | null;
  scoring_version: string;
  metadata: Record<string, unknown>;
}

export interface IPResponse {
  id: string;
  assessment_id: string;
  item_id: string;
  riasec_code: RIASECCode;
  value: number; // 0-4
  answered_at: string;
}

export interface IPScore {
  id: string;
  assessment_id: string;
  riasec_code: RIASECCode;
  raw_score: number;
  normalized_score: number | null;
}

// Likert scale (0-4)
export const IP_LIKERT_SCALE = [
  { value: 0, label: 'Strongly Dislike', shortLabel: 'No way' },
  { value: 1, label: 'Dislike', shortLabel: 'Not for me' },
  { value: 2, label: 'Unsure', shortLabel: 'Maybe' },
  { value: 3, label: 'Like', shortLabel: 'Sounds good' },
  { value: 4, label: 'Strongly Like', shortLabel: 'Love it!' },
] as const;

// Scoring constants
export const IP_SCORING = {
  MIN_PER_TYPE: 0,
  MAX_PER_TYPE: 40, // 10 items × 4 max
  ITEMS_PER_TYPE: 10,
  TOTAL_ITEMS: 60,
} as const;

// Score result with all computed values
export interface IPScoreResult {
  scores: Array<{
    code: RIASECCode;
    name: string;
    tagline: string;
    rawScore: number;
    normalizedScore: number; // 0-100
    color: string;
  }>;
  topCode3: string;
  topThree: Array<{
    code: RIASECCode;
    name: string;
    rawScore: number;
    normalizedScore: number;
  }>;
  bottomThree: Array<{
    code: RIASECCode;
    name: string;
    rawScore: number;
    normalizedScore: number;
  }>;
}
