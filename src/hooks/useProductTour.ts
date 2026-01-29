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
  isActive: boolean;
  currentStep: number;
  currentTip: TourStep | null;
  totalSteps: number;
  isShowingAdvanced: boolean;
  showMorePrompt: boolean;
  pageKey: PageTourKey | null;
  pageName: string | null;
  startBasicTour: (pageKey?: PageTourKey) => void;
  startAdvancedTour: (pageKey?: PageTourKey) => void;
  goNext: () => void;
  goPrev: () => void;
  skip: () => Promise<void>;
  complete: () => Promise<void>;
  acceptAdvanced: () => void;
  declineAdvanced: () => Promise<void>;
  resetTour: (pageKey?: PageTourKey) => Promise<void>;
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
  
  const [isActive, setIsActive] = useState(false);
  const [activePageKey, setActivePageKey] = useState<PageTourKey | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isShowingAdvanced, setIsShowingAdvanced] = useState(false);
  const [showMorePrompt, setShowMorePrompt] = useState(false);

  const currentPageKey = getPageTourKeyFromRoute(location.pathname);
  const pageTour = activePageKey ? getPageTour(activePageKey) : null;
  
  const tips = pageTour ? (isShowingAdvanced ? [...pageTour.basic, ...pageTour.advanced] : pageTour.basic) : [];
  const currentTip = tips[currentStep] || null;
  const totalSteps = tips.length;
  const isLastBasicStep = !isShowingAdvanced && currentStep === (pageTour?.basic.length || 0) - 1;
  const isLastStep = currentStep === totalSteps - 1;

  useEffect(() => {
    const loadTourState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsLoading(false); return; }
        setUserId(user.id);

        const result = await (supabase as any).from('user_preferences').select('preferences').eq('user_id', user.id).single();
        if (result.error && result.error.code !== 'PGRST116') console.error('Error loading tour state:', result.error);

        const data = result.data as any;
        const prefs = data?.preferences as Record<string, any> || {};
        if (prefs.product_tour_state) setTourState(prefs.product_tour_state as ProductTourState);
      } catch (error) { console.error('Error in loadTourState:', error); }
      finally { setIsLoading(false); }
    };
    loadTourState();
  }, []);

  const saveTourState = useCallback(async (newState: ProductTourState) => {
    if (!userId) return;
    setTourState(newState);
    try {
      const currentResult = await (supabase as any).from('user_preferences').select('preferences').eq('user_id', userId).single();
      const currentPrefs = (currentResult.data as any)?.preferences || {};
      const updatedPrefs = { ...currentPrefs, product_tour_state: newState };
      await (supabase as any).from('user_preferences').update({ preferences: updatedPrefs, updated_at: new Date().toISOString() }).eq('user_id', userId);
    } catch (error) { console.error('Error in saveTourState:', error); }
  }, [userId]);

  const startBasicTour = useCallback((pageKey?: PageTourKey) => {
    const key = pageKey || currentPageKey;
    if (!key || !getPageTour(key)) return;
    setActivePageKey(key); setCurrentStep(0); setIsShowingAdvanced(false); setShowMorePrompt(false); setIsActive(true);
  }, [currentPageKey]);

  const startAdvancedTour = useCallback((pageKey?: PageTourKey) => {
    const key = pageKey || currentPageKey;
    if (!key || !getPageTour(key)) return;
    setActivePageKey(key); setCurrentStep(0); setIsShowingAdvanced(true); setShowMorePrompt(false); setIsActive(true);
  }, [currentPageKey]);

  const goNext = useCallback(() => {
    if (isLastBasicStep && !isShowingAdvanced) setShowMorePrompt(true);
    else if (!isLastStep) setCurrentStep(prev => prev + 1);
  }, [isLastBasicStep, isShowingAdvanced, isLastStep]);

  const goPrev = useCallback(() => { if (currentStep > 0) setCurrentStep(prev => prev - 1); }, [currentStep]);

  const skip = useCallback(async () => {
    if (!activePageKey) return;
    const newState: ProductTourState = { ...tourState, completed_tours: { ...tourState.completed_tours, [activePageKey]: isShowingAdvanced ? 'both' : 'basic' } };
    await saveTourState(newState);
    setIsActive(false); setActivePageKey(null); setCurrentStep(0); setIsShowingAdvanced(false); setShowMorePrompt(false);
  }, [activePageKey, isShowingAdvanced, tourState, saveTourState]);

  const complete = useCallback(async () => {
    if (!activePageKey) return;
    const completion: TourCompletion = isShowingAdvanced ? 'both' : 'basic';
    const newState: ProductTourState = { ...tourState, has_completed_global_onboarding: true, completed_tours: { ...tourState.completed_tours, [activePageKey]: completion } };
    await saveTourState(newState);
    setIsActive(false); setActivePageKey(null); setCurrentStep(0); setIsShowingAdvanced(false); setShowMorePrompt(false);
  }, [activePageKey, isShowingAdvanced, tourState, saveTourState]);

  const acceptAdvanced = useCallback(() => { setIsShowingAdvanced(true); setShowMorePrompt(false); setCurrentStep(prev => prev + 1); }, []);

  const declineAdvanced = useCallback(async () => {
    if (!activePageKey) return;
    const newState: ProductTourState = { ...tourState, completed_tours: { ...tourState.completed_tours, [activePageKey]: 'basic' } };
    await saveTourState(newState);
    setIsActive(false); setActivePageKey(null); setCurrentStep(0); setShowMorePrompt(false);
  }, [activePageKey, tourState, saveTourState]);

  const resetTour = useCallback(async (pageKey?: PageTourKey) => {
    const key = pageKey || activePageKey;
    if (!key) return;
    const newCompletedTours = { ...tourState.completed_tours };
    delete newCompletedTours[key];
    await saveTourState({ ...tourState, completed_tours: newCompletedTours });
  }, [activePageKey, tourState, saveTourState]);

  const getCompletionStatus = useCallback((pageKey: PageTourKey): TourCompletion => tourState.completed_tours[pageKey] || 'none', [tourState.completed_tours]);

  return { isActive, currentStep, currentTip, totalSteps, isShowingAdvanced, showMorePrompt, pageKey: activePageKey, pageName: pageTour?.pageName || null, startBasicTour, startAdvancedTour, goNext, goPrev, skip, complete, acceptAdvanced, declineAdvanced, resetTour, tourState, isLoading, getCompletionStatus };
}
