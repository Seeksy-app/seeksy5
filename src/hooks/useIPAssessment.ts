import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  RIASECCode, 
  IPAssessment, 
  IPResponse, 
  RIASEC_TYPES, 
  IP_SCORING,
  IPScoreResult 
} from '@/types/interestProfiler';
import { IP_ITEM_BANK } from '@/data/ipItemBank';
import { toast } from 'sonner';

export interface IPAssessmentState {
  assessment: IPAssessment | null;
  responses: Map<number, number>; // display_order -> value
  currentItemIndex: number;
  isLoading: boolean;
  isSaving: boolean;
}

export function useIPAssessment() {
  const { user } = useAuth();
  const [state, setState] = useState<IPAssessmentState>({
    assessment: null,
    responses: new Map(),
    currentItemIndex: 0,
    isLoading: false,
    isSaving: false,
  });

  // Seed items to database if not already present
  const seedItems = useCallback(async () => {
    try {
      const { data: existingItems, error: checkError } = await supabase
        .from('ip_items')
        .select('id')
        .limit(1);

      if (checkError) throw checkError;

      if (!existingItems || existingItems.length === 0) {
        const itemsToInsert = IP_ITEM_BANK.map(item => ({
          riasec_code: item.riasec_code,
          prompt: item.prompt,
          display_order: item.display_order,
          version: '1.0',
          is_active: true,
        }));

        const { error: insertError } = await supabase
          .from('ip_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
        console.log('IP items seeded successfully');
      }
    } catch (error) {
      console.error('Error seeding IP items:', error);
    }
  }, []);

  // Start a new assessment
  const startAssessment = useCallback(async (mode: 'short' | 'standard' = 'standard') => {
    if (!user) {
      toast.error('Please sign in to take the assessment');
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await seedItems();

      const { data, error } = await supabase
        .from('ip_assessments')
        .insert({
          user_id: user.id,
          mode,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;

      const assessment: IPAssessment = {
        id: data.id,
        user_id: data.user_id,
        status: data.status as IPAssessment['status'],
        mode: data.mode as IPAssessment['mode'],
        started_at: data.started_at,
        completed_at: data.completed_at,
        top_code_3: data.top_code_3,
        scores_json: data.scores_json as Record<RIASECCode, number> | null,
        scoring_version: data.scoring_version,
        metadata: (data.metadata || {}) as Record<string, unknown>,
      };

      setState({
        assessment,
        responses: new Map(),
        currentItemIndex: 0,
        isLoading: false,
        isSaving: false,
      });

      return assessment;
    } catch (error) {
      console.error('Error starting IP assessment:', error);
      toast.error('Failed to start assessment');
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [user, seedItems]);

  // Resume an existing assessment
  const resumeAssessment = useCallback(async (assessmentId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Get assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('ip_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Get existing responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('ip_responses')
        .select('*, ip_items!inner(display_order)')
        .eq('assessment_id', assessmentId);

      if (responsesError) throw responsesError;

      const responses = new Map<number, number>();
      let maxIndex = 0;

      responsesData?.forEach((r: any) => {
        const displayOrder = r.ip_items.display_order;
        responses.set(displayOrder, r.value);
        if (displayOrder > maxIndex) maxIndex = displayOrder;
      });

      const assessment: IPAssessment = {
        id: assessmentData.id,
        user_id: assessmentData.user_id,
        status: assessmentData.status as IPAssessment['status'],
        mode: assessmentData.mode as IPAssessment['mode'],
        started_at: assessmentData.started_at,
        completed_at: assessmentData.completed_at,
        top_code_3: assessmentData.top_code_3,
        scores_json: assessmentData.scores_json as Record<RIASECCode, number> | null,
        scoring_version: assessmentData.scoring_version,
        metadata: (assessmentData.metadata || {}) as Record<string, unknown>,
      };

      setState({
        assessment,
        responses,
        currentItemIndex: maxIndex > 0 ? maxIndex - 1 : 0,
        isLoading: false,
        isSaving: false,
      });

      return assessment;
    } catch (error) {
      console.error('Error resuming IP assessment:', error);
      toast.error('Failed to resume assessment');
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, []);

  // Save a response
  const saveResponse = useCallback(async (displayOrder: number, value: number) => {
    if (!state.assessment) return;

    const item = IP_ITEM_BANK.find(i => i.display_order === displayOrder);
    if (!item) return;

    // Update local state immediately
    setState(prev => {
      const newResponses = new Map(prev.responses);
      newResponses.set(displayOrder, value);
      return { ...prev, responses: newResponses, isSaving: true };
    });

    try {
      // Get the item ID from database
      const { data: itemData, error: itemError } = await supabase
        .from('ip_items')
        .select('id')
        .eq('display_order', displayOrder)
        .eq('is_active', true)
        .single();

      if (itemError) throw itemError;

      // Upsert the response
      const { error } = await supabase
        .from('ip_responses')
        .upsert({
          assessment_id: state.assessment.id,
          item_id: itemData.id,
          riasec_code: item.riasec_code,
          value,
        }, {
          onConflict: 'assessment_id,item_id',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving response:', error);
      // Revert on error
      setState(prev => {
        const newResponses = new Map(prev.responses);
        newResponses.delete(displayOrder);
        return { ...prev, responses: newResponses };
      });
      toast.error('Failed to save response');
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  }, [state.assessment]);

  // Navigate to next item
  const nextItem = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentItemIndex: Math.min(prev.currentItemIndex + 1, IP_ITEM_BANK.length - 1),
    }));
  }, []);

  // Navigate to previous item
  const prevItem = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentItemIndex: Math.max(prev.currentItemIndex - 1, 0),
    }));
  }, []);

  // Go to specific item
  const goToItem = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      currentItemIndex: Math.max(0, Math.min(index, IP_ITEM_BANK.length - 1)),
    }));
  }, []);

  // Calculate scores
  const calculateScores = useCallback((): IPScoreResult | null => {
    if (state.responses.size < IP_SCORING.TOTAL_ITEMS) return null;

    const rawScores: Record<RIASECCode, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // Sum responses by RIASEC type
    IP_ITEM_BANK.forEach(item => {
      const value = state.responses.get(item.display_order) || 0;
      rawScores[item.riasec_code] += value;
    });

    // Create score array
    const scores = Object.entries(rawScores).map(([code, rawScore]) => {
      const typeInfo = RIASEC_TYPES[code as RIASECCode];
      const normalizedScore = Math.round(
        ((rawScore - IP_SCORING.MIN_PER_TYPE) / 
         (IP_SCORING.MAX_PER_TYPE - IP_SCORING.MIN_PER_TYPE)) * 100
      );
      return {
        code: code as RIASECCode,
        name: typeInfo.name,
        tagline: typeInfo.tagline,
        rawScore,
        normalizedScore,
        color: typeInfo.color,
      };
    });

    // Sort by raw score descending (ties keep R,I,A,S,E,C order)
    const sortedScores = [...scores].sort((a, b) => {
      if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
      return 'RIASEC'.indexOf(a.code) - 'RIASEC'.indexOf(b.code);
    });

    const topThree = sortedScores.slice(0, 3).map(s => ({
      code: s.code,
      name: s.name,
      rawScore: s.rawScore,
      normalizedScore: s.normalizedScore,
    }));

    const bottomThree = sortedScores.slice(3).map(s => ({
      code: s.code,
      name: s.name,
      rawScore: s.rawScore,
      normalizedScore: s.normalizedScore,
    }));

    const topCode3 = topThree.map(s => s.code).join('');

    return {
      scores,
      topCode3,
      topThree,
      bottomThree,
    };
  }, [state.responses]);

  // Complete the assessment
  const completeAssessment = useCallback(async (): Promise<IPScoreResult | null> => {
    if (!state.assessment) return null;

    const scoreResult = calculateScores();
    if (!scoreResult) {
      toast.error('Please answer all questions before completing');
      return null;
    }

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      // Save scores to ip_scores table
      const scoreInserts = scoreResult.scores.map(s => ({
        assessment_id: state.assessment!.id,
        riasec_code: s.code,
        raw_score: s.rawScore,
        normalized_score: s.normalizedScore,
      }));

      const { error: scoresError } = await supabase
        .from('ip_scores')
        .insert(scoreInserts);

      if (scoresError) throw scoresError;

      // Update assessment
      const scoresJson = Object.fromEntries(
        scoreResult.scores.map(s => [s.code, s.rawScore])
      );

      const { error: updateError } = await supabase
        .from('ip_assessments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          top_code_3: scoreResult.topCode3,
          scores_json: scoresJson,
        })
        .eq('id', state.assessment.id);

      if (updateError) throw updateError;

      setState(prev => ({
        ...prev,
        assessment: prev.assessment ? {
          ...prev.assessment,
          status: 'completed',
          completed_at: new Date().toISOString(),
          top_code_3: scoreResult.topCode3,
          scores_json: scoresJson as Record<RIASECCode, number>,
        } : null,
        isSaving: false,
      }));

      return scoreResult;
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast.error('Failed to save results');
      setState(prev => ({ ...prev, isSaving: false }));
      return null;
    }
  }, [state.assessment, calculateScores]);

  // Get current item
  const currentItem = IP_ITEM_BANK[state.currentItemIndex] || null;
  const currentResponse = currentItem 
    ? state.responses.get(currentItem.display_order) 
    : undefined;
  
  const progress = (state.responses.size / IP_ITEM_BANK.length) * 100;
  const isComplete = state.responses.size === IP_ITEM_BANK.length;

  return {
    ...state,
    currentItem,
    currentResponse,
    progress,
    isComplete,
    totalItems: IP_ITEM_BANK.length,
    startAssessment,
    resumeAssessment,
    saveResponse,
    nextItem,
    prevItem,
    goToItem,
    calculateScores,
    completeAssessment,
  };
}
