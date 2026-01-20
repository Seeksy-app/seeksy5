import { useMemo, useCallback } from 'react';
import { RANK_TO_POINTS, WIPNeed, WIPValue, WIPRound, WIPScoreResult } from '@/types/wip';

interface RoundResponse {
  roundIndex: number;
  rankedNeedIds: string[];
}

interface NeedAppearanceMap {
  [needId: string]: number; // count of appearances
}

/**
 * O*NET Work Importance Profiler Scoring Engine
 * 
 * Scoring flow:
 * 1. Accumulate raw points from rankings (RANK_TO_POINTS: 1→+4, 2→+2, 3→0, 4→-2, 5→-4)
 * 2. Normalize relative scores across all 21 needs to [-1, +1] range (min-max normalization)
 * 3. Scale to raw_score_scaled [-4, +4] range (multiply by 4)
 * 4. Convert to standardized_0_100 for UI display
 * 5. Aggregate into 6 Work Values (mean of underlying needs' standardized scores)
 */
export function useWIPScoring(
  needs: WIPNeed[],
  values: WIPValue[],
  rounds: WIPRound[]
) {
  // Build need appearance map from rounds configuration
  const needAppearanceMap = useMemo<NeedAppearanceMap>(() => {
    const map: NeedAppearanceMap = {};
    rounds.forEach((round) => {
      if (round.is_active) {
        round.need_ids.forEach((needId) => {
          map[needId] = (map[needId] || 0) + 1;
        });
      }
    });
    return map;
  }, [rounds]);

  // Compute min/max possible raw scores per need based on appearances
  // With -4 to +4 scale: min = -4 * appearances, max = +4 * appearances
  const getNeedMinMax = useCallback(
    (needId: string): { min: number; max: number } => {
      const appearances = needAppearanceMap[needId] || 0;
      return {
        min: appearances * RANK_TO_POINTS[5], // -4 per appearance
        max: appearances * RANK_TO_POINTS[1], // +4 per appearance
      };
    },
    [needAppearanceMap]
  );

  /**
   * O*NET-style scoring calculation
   * 
   * Step 1: Get relative_score_raw from rankings (sum of RANK_TO_POINTS)
   * Step 2: Normalize to [-1, +1] using min-max across all 21 needs
   * Step 3: Scale to raw_score_scaled [-4, +4]
   * Step 4: Convert to standardized_0_100: ((raw + 4) / 8) * 100
   */
  const calculateScores = useCallback(
    (responses: RoundResponse[]): WIPScoreResult => {
      // Step 1: Accumulate raw points from rankings
      const needRawScores: Record<string, number> = {};
      const needAppearances: Record<string, number> = {};
      
      needs.forEach((need) => {
        needRawScores[need.id] = 0;
        needAppearances[need.id] = 0;
      });

      responses.forEach((response) => {
        response.rankedNeedIds.forEach((needId, index) => {
          const rank = index + 1; // 0-indexed to 1-indexed (1-5)
          const points = RANK_TO_POINTS[rank] || 0;
          needRawScores[needId] = (needRawScores[needId] || 0) + points;
          needAppearances[needId] = (needAppearances[needId] || 0) + 1;
        });
      });

      // Step 2: Find min/max across all 21 needs for normalization
      const rawScoreValues = Object.values(needRawScores);
      const minRaw = Math.min(...rawScoreValues);
      const maxRaw = Math.max(...rawScoreValues);

      // Step 3 & 4: Build need scores with proper O*NET normalization
      const needScores = needs.map((need) => {
        const relativeScoreRaw = needRawScores[need.id] || 0;
        const appearances = needAppearances[need.id] || needAppearanceMap[need.id] || 0;

        // Normalize to [-1, +1] using min-max across all needs
        let relativeScoreNorm = 0;
        if (maxRaw !== minRaw) {
          relativeScoreNorm = 2 * ((relativeScoreRaw - minRaw) / (maxRaw - minRaw)) - 1;
        }

        // Scale to [-4, +4] (importance_multiplier = 1 for all since we skip that step)
        const rawScoreScaled = relativeScoreNorm * 4;

        // Convert to 0-100 standardized score: ((raw + 4) / 8) * 100
        const stdScore = ((rawScoreScaled + 4) / 8) * 100;

        return {
          need,
          rawScore: relativeScoreRaw,  // Original accumulated points
          rawScoreScaled,              // O*NET -4 to +4 scaled score
          stdScore,                    // 0-100 standardized
          appearances,
          relativeScoreNorm,           // -1 to +1 normalized
        };
      });

      // Group needs by value for aggregation
      const needsByValue: Record<string, typeof needScores> = {};
      needScores.forEach((ns) => {
        const valueId = ns.need.value_id;
        if (!needsByValue[valueId]) {
          needsByValue[valueId] = [];
        }
        needsByValue[valueId].push(ns);
      });

      // Step 5: Calculate Work Value scores (mean of underlying needs' standardized scores)
      const valueScores = values.map((value) => {
        const valueNeeds = needsByValue[value.id] || [];
        const rawSum = valueNeeds.reduce((sum, ns) => sum + ns.rawScore, 0);
        const rawMean = valueNeeds.length > 0 ? rawSum / valueNeeds.length : 0;

        // Work Value standardized score = mean of underlying needs' stdScore
        const stdScore = valueNeeds.length > 0
          ? valueNeeds.reduce((sum, ns) => sum + ns.stdScore, 0) / valueNeeds.length
          : 50;

        return {
          value,
          rawSum,
          rawMean,
          stdScore,
          needCount: valueNeeds.length,
        };
      });

      return { needScores, valueScores };
    },
    [needs, values, needAppearanceMap]
  );

  // Calculate partial/live scores (for real-time UI updates during assessment)
  const calculatePartialScores = useCallback(
    (responses: RoundResponse[]): WIPScoreResult => {
      return calculateScores(responses);
    },
    [calculateScores]
  );

  // Get top N values by standardized score
  const getTopValues = useCallback(
    (valueScores: WIPScoreResult['valueScores'], n: number = 3) => {
      return [...valueScores]
        .sort((a, b) => b.stdScore - a.stdScore)
        .slice(0, n);
    },
    []
  );

  // Get top N needs by standardized score
  const getTopNeeds = useCallback(
    (needScores: WIPScoreResult['needScores'], n: number = 5) => {
      return [...needScores]
        .sort((a, b) => b.stdScore - a.stdScore)
        .slice(0, n);
    },
    []
  );

  return {
    needAppearanceMap,
    getNeedMinMax,
    calculateScores,
    calculatePartialScores,
    getTopValues,
    getTopNeeds,
  };
}

/**
 * Pearson correlation coefficient calculation for occupation matching
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}
