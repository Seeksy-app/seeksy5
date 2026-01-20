import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WIPValue, WIPNeed, WIPRound, WIPAssessment, WIPNeedScore, WIPValueScore } from '@/types/wip';
import { useWIPScoring } from './useWIPScoring';
import { toast } from 'sonner';

interface RoundResponse {
  roundIndex: number;
  rankedNeedIds: string[];
}

export function useWIPAssessment(audiencePath: 'civilian' | 'military' | 'reentry' = 'civilian') {
  const queryClient = useQueryClient();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(1);
  const [responses, setResponses] = useState<RoundResponse[]>([]);

  // Fetch values
  const { data: values = [], isLoading: valuesLoading } = useQuery({
    queryKey: ['wip-values'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wip_value')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as WIPValue[];
    },
  });

  // Fetch needs
  const { data: needs = [], isLoading: needsLoading } = useQuery({
    queryKey: ['wip-needs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wip_need')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as WIPNeed[];
    },
  });

  // Fetch rounds
  const { data: rounds = [], isLoading: roundsLoading } = useQuery({
    queryKey: ['wip-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wip_round')
        .select('*')
        .eq('is_active', true)
        .order('round_index');
      if (error) throw error;
      return data as WIPRound[];
    },
  });

  // Scoring engine
  const {
    calculateScores,
    calculatePartialScores,
    getTopValues,
    getTopNeeds,
  } = useWIPScoring(needs, values, rounds);

  // Create assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('wip_assessment')
        .insert({
          user_id: user?.id || null,
          audience_path: audiencePath,
          version: 'v1',
        })
        .select()
        .single();
      if (error) throw error;
      return data as WIPAssessment;
    },
    onSuccess: (data) => {
      setAssessmentId(data.id);
    },
  });

  // Save round response mutation
  const saveRoundResponseMutation = useMutation({
    mutationFn: async ({ roundIndex, rankedNeedIds }: RoundResponse) => {
      if (!assessmentId) throw new Error('No assessment started');
      const { error } = await supabase
        .from('wip_round_response')
        .upsert({
          assessment_id: assessmentId,
          round_index: roundIndex,
          ranked_need_ids: rankedNeedIds,
        }, {
          onConflict: 'assessment_id,round_index',
        });
      if (error) throw error;
    },
  });

  // Complete assessment mutation
  const completeAssessmentMutation = useMutation({
    mutationFn: async () => {
      if (!assessmentId) throw new Error('No assessment started');
      
      // Calculate final scores using O*NET scoring algorithm
      const scores = calculateScores(responses);

      // Save need scores with O*NET scoring values
      const needScoreInserts = scores.needScores.map((ns) => {
        // Get the theoretical min/max for this need based on appearances
        const appearances = ns.appearances;
        const minPossible = appearances * -4; // If always ranked 5th
        const maxPossible = appearances * 4;  // If always ranked 1st
        
        return {
          assessment_id: assessmentId,
          need_id: ns.need.id,
          raw_score: ns.rawScore,              // Original accumulated points
          std_score_0_100: ns.stdScore,        // O*NET standardized 0-100
          appearances: ns.appearances,
          min_possible: minPossible,
          max_possible: maxPossible,
        };
      });

      const { error: needError } = await supabase
        .from('wip_need_score')
        .insert(needScoreInserts);
      if (needError) throw needError;

      // Save value scores (mean of underlying needs' standardized scores)
      const valueScoreInserts = scores.valueScores.map((vs) => ({
        assessment_id: assessmentId,
        value_id: vs.value.id,
        raw_sum: vs.rawSum,
        raw_mean: vs.rawMean,
        std_score_0_100: vs.stdScore,          // Mean of underlying needs' stdScores
        min_possible: 0,
        max_possible: 100,
      }));

      const { error: valueError } = await supabase
        .from('wip_value_score')
        .insert(valueScoreInserts);
      if (valueError) throw valueError;

      // Mark assessment as completed
      const { error: updateError } = await supabase
        .from('wip_assessment')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', assessmentId);
      if (updateError) throw updateError;

      return scores;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wip-assessment', assessmentId] });
      toast.success('Assessment completed!');
    },
  });

  // Start a new assessment
  const startAssessment = useCallback(async () => {
    setResponses([]);
    setCurrentRoundIndex(1);
    await createAssessmentMutation.mutateAsync();
  }, [createAssessmentMutation]);

  // Submit a round response
  const submitRound = useCallback(
    async (rankedNeedIds: string[]) => {
      const response: RoundResponse = {
        roundIndex: currentRoundIndex,
        rankedNeedIds,
      };

      console.log('[WIP] Submitting round:', currentRoundIndex, 'of', rounds.length);

      try {
        // Save to database
        await saveRoundResponseMutation.mutateAsync(response);

        // Update local state
        setResponses((prev) => {
          const existing = prev.findIndex((r) => r.roundIndex === currentRoundIndex);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = response;
            return updated;
          }
          return [...prev, response];
        });

        // Move to next round (or past last round to trigger isComplete)
        const nextRound = currentRoundIndex + 1;
        console.log('[WIP] Moving to round:', nextRound, 'isComplete will be:', nextRound > rounds.length);
        setCurrentRoundIndex(nextRound);
      } catch (error) {
        console.error('[WIP] Error submitting round:', error);
        toast.error('Failed to save response. Please try again.');
      }
    },
    [currentRoundIndex, rounds.length, saveRoundResponseMutation]
  );

  // Go back to previous round
  const goBack = useCallback(() => {
    if (currentRoundIndex > 1) {
      setCurrentRoundIndex((prev) => prev - 1);
    }
  }, [currentRoundIndex]);

  // Go forward to next round (for navigating to already-completed rounds)
  const goForward = useCallback(() => {
    // Can only go forward if we have a response for the current round
    const hasResponse = responses.some(r => r.roundIndex === currentRoundIndex);
    if (hasResponse && currentRoundIndex < rounds.length) {
      setCurrentRoundIndex((prev) => prev + 1);
    }
  }, [currentRoundIndex, responses, rounds.length]);

  // Get response for a specific round
  const getResponseForRound = useCallback((roundIndex: number) => {
    return responses.find(r => r.roundIndex === roundIndex) || null;
  }, [responses]);

  // Check if current round has been completed
  const hasCompletedCurrentRound = useCallback(() => {
    return responses.some(r => r.roundIndex === currentRoundIndex);
  }, [responses, currentRoundIndex]);

  // Complete the assessment
  const completeAssessment = useCallback(async () => {
    return await completeAssessmentMutation.mutateAsync();
  }, [completeAssessmentMutation]);

  // Get current round data
  const getCurrentRound = useCallback(() => {
    const round = rounds.find((r) => r.round_index === currentRoundIndex);
    if (!round) return null;

    const roundNeeds = round.need_ids
      .map((id) => needs.find((n) => n.id === id))
      .filter(Boolean) as WIPNeed[];

    return {
      ...round,
      needs: roundNeeds,
    };
  }, [rounds, currentRoundIndex, needs]);

  // Get live/partial scores for real-time display
  const getLiveScores = useCallback(() => {
    if (responses.length === 0) return null;
    return calculatePartialScores(responses);
  }, [responses, calculatePartialScores]);

  // Check if assessment is complete
  const isComplete = currentRoundIndex > rounds.length;
  const isLoading = valuesLoading || needsLoading || roundsLoading;
  const totalRounds = rounds.length;
  const progress = totalRounds > 0 ? ((currentRoundIndex - 1) / totalRounds) * 100 : 0;

  return {
    // Data
    values,
    needs,
    rounds,
    assessmentId,
    currentRoundIndex,
    totalRounds,
    progress,
    isComplete,
    isLoading,

    // Actions
    startAssessment,
    submitRound,
    goBack,
    goForward,
    completeAssessment,
    getCurrentRound,
    getLiveScores,
    getResponseForRound,
    hasCompletedCurrentRound,
    getTopValues,
    getTopNeeds,

    // Mutation states
    isStarting: createAssessmentMutation.isPending,
    isSaving: saveRoundResponseMutation.isPending,
    isCompleting: completeAssessmentMutation.isPending,
  };
}
