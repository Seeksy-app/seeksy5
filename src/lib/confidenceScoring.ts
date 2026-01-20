// confidenceScoring.ts
// Deterministic confidence scoring for "Explain change" based on data completeness + coverage + volume.

type GscMetrics = {
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null; // 0..1 or 0..100
  position?: number | null; // lower is better
};

type Ga4Metrics = {
  users?: number | null;
  sessions?: number | null;
  views?: number | null;
  engagement_rate?: number | null; // 0..1 or 0..100
};

export type ExplainChangeInputs = {
  gsc7?: GscMetrics | null;
  gsc28?: GscMetrics | null;
  ga47?: Ga4Metrics | null;
  ga428?: Ga4Metrics | null;
  // daily table coverage counts for THIS page (0..7 and 0..28), computed server-side
  daysWithData7?: number | null;
  daysWithData28?: number | null;
  // baseline exists with at least one populated source
  hasBaseline?: boolean | null;
};

export type ConfidenceResult = {
  confidence_overall: "low" | "medium" | "high";
  confidenceScore: number; // 0..100
  completeness: number; // 0..100
  coveragePenalty: number; // 0..30
  lowVolumePenalty: number; // 0..25
  data_quality_notes: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function hasAllGsc(m?: GscMetrics | null) {
  if (!m) return false;
  return (
    isFiniteNumber(m.clicks) &&
    isFiniteNumber(m.impressions) &&
    isFiniteNumber(m.ctr) &&
    isFiniteNumber(m.position)
  );
}

function hasAllGa4(m?: Ga4Metrics | null) {
  if (!m) return false;
  return (
    isFiniteNumber(m.users) &&
    isFiniteNumber(m.sessions) &&
    isFiniteNumber(m.views) &&
    isFiniteNumber(m.engagement_rate)
  );
}

/**
 * Core scoring model:
 * completeness (0..100) = weighted availability
 * penalties:
 *  - coveragePenalty (0..30): missing daily rows
 *  - lowVolumePenalty (0..25): small impressions/views => noisy
 *
 * Overrides:
 *  - no 7d data => low
 *  - <=2 days coverage in 7d window => low
 *  - impressions_7d < 10 => force low
 */
export function scoreConfidence(inputs: ExplainChangeInputs): ConfidenceResult {
  const notes: string[] = [];

  const hasGSC7 = hasAllGsc(inputs.gsc7);
  const hasGSC28 = hasAllGsc(inputs.gsc28);
  const hasGA47 = hasAllGa4(inputs.ga47);
  const hasGA428 = hasAllGa4(inputs.ga428);
  const hasBaseline = Boolean(inputs.hasBaseline);

  // -------- Step 1: completeness (0..100) --------
  let completeness = 0;
  if (hasGSC7) completeness += 35;
  if (hasGSC28) completeness += 20;
  if (hasGA47) completeness += 25;
  if (hasGA428) completeness += 15;
  if (hasBaseline) completeness += 5;

  // -------- Step 2: coverage penalty (0..30) --------
  const days7 = clamp(Number(inputs.daysWithData7 ?? 0), 0, 7);
  const days28 = clamp(Number(inputs.daysWithData28 ?? 0), 0, 28);

  let coveragePenalty = 0;

  // 7-day coverage penalty: up to 20
  if (hasGSC7 || hasGA47) {
    const missing7 = 7 - days7;
    const p7 = clamp(missing7 * 4, 0, 20);
    coveragePenalty += p7;
    if (days7 < 7) notes.push(`Incomplete 7-day coverage: ${days7}/7 days present.`);
  }

  // 28-day coverage penalty: up to 10
  if (hasGSC28 || hasGA428) {
    const missing28 = 28 - days28;
    const p28 = clamp(missing28 * 0.5, 0, 10);
    coveragePenalty += p28;
    if (days28 < 28) notes.push(`Incomplete 28-day coverage: ${days28}/28 days present.`);
  }

  coveragePenalty = clamp(coveragePenalty, 0, 30);

  // -------- Step 3: low-volume penalty (0..25) --------
  let lowVolumePenalty = 0;

  const impressions7 = hasGSC7 && isFiniteNumber(inputs.gsc7?.impressions) ? inputs.gsc7!.impressions! : null;
  const clicks7 = hasGSC7 && isFiniteNumber(inputs.gsc7?.clicks) ? inputs.gsc7!.clicks! : null;
  const views7 = hasGA47 && isFiniteNumber(inputs.ga47?.views) ? inputs.ga47!.views! : null;

  if (hasGSC7 && impressions7 !== null) {
    if (impressions7 < 50) {
      lowVolumePenalty += 15;
      notes.push("Low volume: GSC impressions (7d) < 50; results may be noisy.");
    }
    if (impressions7 < 10) {
      lowVolumePenalty += 10; // additional
      notes.push("Very low volume: GSC impressions (7d) < 10; explanations are unreliable.");
    }
    if (clicks7 !== null && clicks7 < 5) {
      lowVolumePenalty += 5;
      notes.push("Low volume: GSC clicks (7d) < 5; CTR changes can be unstable.");
    }
  } else if (hasGA47 && views7 !== null) {
    if (views7 < 50) {
      lowVolumePenalty += 10;
      notes.push("Low volume: GA4 views (7d) < 50; results may be noisy.");
    }
    if (views7 < 10) {
      lowVolumePenalty += 10; // additional
      notes.push("Very low volume: GA4 views (7d) < 10; explanations are unreliable.");
    }
  } else {
    // If neither GSC7 nor GA47 is fully present, low-volume isn't computable; note data issues.
    notes.push("Volume signals unavailable (missing GSC7 and GA47).");
  }

  lowVolumePenalty = clamp(lowVolumePenalty, 0, 25);

  // -------- Step 4: raw score (0..100) --------
  const raw = completeness - coveragePenalty - lowVolumePenalty;
  const confidenceScore = clamp(raw, 0, 100);

  // -------- Step 5: map to low/medium/high --------
  let confidence_overall: "low" | "medium" | "high";
  if (confidenceScore >= 70) confidence_overall = "high";
  else if (confidenceScore >= 40) confidence_overall = "medium";
  else confidence_overall = "low";

  // -------- Overrides / guardrails --------
  // 1) No 7-day data at all => low
  if (!hasGSC7 && !hasGA47) {
    confidence_overall = "low";
    notes.push("No usable 7-day metrics available (GSC7/GA47 missing).");
  }

  // 2) <=2 days coverage in 7d window => low
  if ((hasGSC7 || hasGA47) && days7 <= 2) {
    confidence_overall = "low";
    notes.push("Only 0–2 days of data present in the last 7 days; trend explanations are unreliable.");
  }

  // 3) Extremely low impressions => force low
  if (hasGSC7 && impressions7 !== null && impressions7 < 10) {
    confidence_overall = "low";
  }

  // Helpful note when baseline missing
  if (!hasBaseline) notes.push("Baseline not available yet; deltas are computed from 7d vs 28d only.");

  return {
    confidence_overall,
    confidenceScore,
    completeness,
    coveragePenalty,
    lowVolumePenalty,
    data_quality_notes: notes.slice(0, 5) // keep it short
  };
}
