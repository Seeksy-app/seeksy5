/**
 * useProductTour Hook
 * Manages product tour state, navigation, and persistence
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  PageTourKey, 
  getPageTour, 
  getPageTourKeyFromRoute,
  TourStep 
} from '@/onboarding/tourConfig';

export type TourCompletion = 'none' | 'basic' | 'both';

export interface ProductTourState {
  has_completed_global_onboarding: boolean;
  completed_tours: Partial<Record<PageTourKey, TourCompletion>>;
}

interface UseProductTourReturn {
  // State
  isActive: boolean;
  currentStep: number;
  currentTip: TourStep | null;
  totalSteps: number;
  isShowingAdvanced: boolean;
  showMorePrompt: boolean;
  pageKey: PageTourKey | null;
  pageName: string | null;
  
  // Actions
  startBasicTour: (pageKey?: PageTourKey) => void;
  startAdvancedTour: (pageKey?: PageTourKey) => void;
  goNext: () => void;
  goPrev: () => void;
  skip: () => Promise<void>;
  complete: () => Promise<void>;
  acceptAdvanced: () => void;
  declineAdvanced: () => Promise<void>;
  resetTour: (pageKey?: PageTourKey) => Promise<void>;
  
  // Tour state
  tourState: ProductTourState;
  isLoading: boolean;
  getCompletionStatus: (pageKey: PageTourKey) => TourCompletion;
}

const DEFAULT_STATE: ProductTourState = {
  has_completed_global_onboarding: false,
  completed_tours: {},
};

export function useProductTour(): UseProductTourReturn {
  const location = useLocation();
  const [tourState, setTourState] = useState<ProductTourState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Active tour state
  const [isActive, setIsActive] = useState(false);
  const [activePageKey, setActivePageKey] = useState<PageTourKey | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isShowingAdvanced, setIsShowingAdvanced] = useState(false);
  const [showMorePrompt, setShowMorePrompt] = useState(false);

  const currentPageKey = getPageTourKeyFromRoute(location.pathname);
  const pageTour = activePageKey ? getPageTour(activePageKey) : null;
  
  // Get current tips array
  const tips = pageTour 
    ? (isShowingAdvanced ? [...pageTour.basic, ...pageTour.advanced] : pageTour.basic)
    : [];
  
  const currentTip = tips[currentStep] || null;
  const totalSteps = tips.length;
  const isLastBasicStep = !isShowingAdvanced && currentStep === (pageTour?.basic.length || 0) - 1;
  const isLastStep = currentStep === totalSteps - 1;

  // Load tour state from database (using onboarding_progress column)
  useEffect(() => {
    const loadTourState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        setUserId(user.id);

        const { data, error } = await supabase
          .from('user_preferences')
          .select('onboarding_progress')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading tour state:', error);
        }

        // Extract product_tour_state from onboarding_progress if it exists
        if (data?.onboarding_progress) {
          const progress = data.onboarding_progress as Record<string, unknown>;
          if (progress.product_tour_state) {
            setTourState(progress.product_tour_state as unknown as ProductTourState);
          }
        }
      } catch (error) {
        console.error('Error in loadTourState:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTourState();
  }, []);

  // Save tour state to database (nested inside onboarding_progress)
  const saveTourState = useCallback(async (newState: ProductTourState) => {
    if (!userId) return;

    setTourState(newState);

    try {
      // First get current onboarding_progress
      const { data: currentData } = await supabase
        .from('user_preferences')
        .select('onboarding_progress')
        .eq('user_id', userId)
        .single();

      const currentProgress = (currentData?.onboarding_progress as Record<string, unknown>) || {};
      
      // Merge product_tour_state into onboarding_progress
      const updatedProgress = {
        ...currentProgress,
        product_tour_state: newState as unknown,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('user_preferences')
        .update({
          onboarding_progress: updatedProgress as any,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error saving tour state:', error);
      }
    } catch (error) {
      console.error('Error in saveTourState:', error);
    }
  }, [userId]);

  // Start basic tour
  const startBasicTour = useCallback((pageKey?: PageTourKey) => {
    const key = pageKey || currentPageKey;
    if (!key || !getPageTour(key)) return;
    
    setActivePageKey(key);
    setCurrentStep(0);
    setIsShowingAdvanced(false);
    setShowMorePrompt(false);
    setIsActive(true);
  }, [currentPageKey]);

  // Start advanced tour (includes basic)
  const startAdvancedTour = useCallback((pageKey?: PageTourKey) => {
    const key = pageKey || currentPageKey;
    if (!key || !getPageTour(key)) return;
    
    setActivePageKey(key);
    setCurrentStep(0);
    setIsShowingAdvanced(true);
    setShowMorePrompt(false);
    setIsActive(true);
  }, [currentPageKey]);

  // Go to next step
  const goNext = useCallback(() => {
    if (isLastBasicStep && !isShowingAdvanced) {
      setShowMorePrompt(true);
    } else if (isLastStep) {
      // Will be handled by complete()
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastBasicStep, isShowingAdvanced, isLastStep]);

  // Go to previous step
  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Skip tour
  const skip = useCallback(async () => {
    if (!activePageKey) return;
    
    const newState: ProductTourState = {
      ...tourState,
      completed_tours: {
        ...tourState.completed_tours,
        [activePageKey]: isShowingAdvanced ? 'both' : 'basic',
      },
    };
    
    await saveTourState(newState);
    setIsActive(false);
    setActivePageKey(null);
    setCurrentStep(0);
    setIsShowingAdvanced(false);
    setShowMorePrompt(false);
  }, [activePageKey, isShowingAdvanced, tourState, saveTourState]);

  // Complete tour
  const complete = useCallback(async () => {
    if (!activePageKey) return;
    
    const completion: TourCompletion = isShowingAdvanced ? 'both' : 'basic';
    const newState: ProductTourState = {
      ...tourState,
      has_completed_global_onboarding: true,
      completed_tours: {
        ...tourState.completed_tours,
        [activePageKey]: completion,
      },
    };
    
    await saveTourState(newState);
    setIsActive(false);
    setActivePageKey(null);
    setCurrentStep(0);
    setIsShowingAdvanced(false);
    setShowMorePrompt(false);
  }, [activePageKey, isShowingAdvanced, tourState, saveTourState]);

  // Accept advanced tips
  const acceptAdvanced = useCallback(() => {
    setIsShowingAdvanced(true);
    setShowMorePrompt(false);
    setCurrentStep(prev => prev + 1);
  }, []);

  // Decline advanced tips
  const declineAdvanced = useCallback(async () => {
    if (!activePageKey) return;
    
    const newState: ProductTourState = {
      ...tourState,
      completed_tours: {
        ...tourState.completed_tours,
        [activePageKey]: 'basic',
      },
    };
    
    await saveTourState(newState);
    setIsActive(false);
    setActivePageKey(null);
    setCurrentStep(0);
    setShowMorePrompt(false);
  }, [activePageKey, tourState, saveTourState]);

  // Reset tour for a page
  const resetTour = useCallback(async (pageKey?: PageTourKey) => {
    const key = pageKey || activePageKey;
    if (!key) return;
    
    const newCompletedTours = { ...tourState.completed_tours };
    delete newCompletedTours[key];
    
    const newState: ProductTourState = {
      ...tourState,
      completed_tours: newCompletedTours,
    };
    
    await saveTourState(newState);
  }, [activePageKey, tourState, saveTourState]);

  // Get completion status for a page
  const getCompletionStatus = useCallback((pageKey: PageTourKey): TourCompletion => {
    return tourState.completed_tours[pageKey] || 'none';
  }, [tourState.completed_tours]);

  return {
    isActive,
    currentStep,
    currentTip,
    totalSteps,
    isShowingAdvanced,
    showMorePrompt,
    pageKey: activePageKey,
    pageName: pageTour?.pageName || null,
    
    startBasicTour,
    startAdvancedTour,
    goNext,
    goPrev,
    skip,
    complete,
    acceptAdvanced,
    declineAdvanced,
    resetTour,
    
    tourState,
    isLoading,
    getCompletionStatus,
  };
}
