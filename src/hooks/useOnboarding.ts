/**
 * useOnboarding Hook
 * Manages onboarding state, persistence, and tip progression
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageKey, getPageKeyFromRoute, getPageTips } from '@/onboarding/tips';

export interface PageOnboardingState {
  completed: boolean;
  shownTips: number;
  lastShownAt?: string;
}

export interface OnboardingProgress {
  [key: string]: PageOnboardingState;
}

interface UseOnboardingReturn {
  isOnboardingActive: boolean;
  currentPageKey: PageKey | null;
  pageProgress: PageOnboardingState | null;
  startOnboarding: (pageKey?: PageKey) => void;
  completeOnboarding: (pageKey: PageKey, shownTips: number) => Promise<void>;
  resetOnboarding: (pageKey?: PageKey) => Promise<void>;
  shouldAutoTrigger: boolean;
  isLoading: boolean;
}

export function useOnboarding(): UseOnboardingReturn {
  const location = useLocation();
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>({});
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [globalOnboardingCompleted, setGlobalOnboardingCompleted] = useState(false);

  const currentPageKey = getPageKeyFromRoute(location.pathname);

  // Fetch onboarding progress from database
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        setUserId(user.id);

        const { data, error } = await supabase
          .from('user_preferences')
          .select('onboarding_progress, onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching onboarding progress:', error);
        }

        if (data?.onboarding_progress) {
          setOnboardingProgress(data.onboarding_progress as unknown as OnboardingProgress);
        }
        
        // Check global onboarding_completed flag
        setGlobalOnboardingCompleted(data?.onboarding_completed ?? false);
      } catch (error) {
        console.error('Error in fetchProgress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, []);

  // Get current page's progress
  const pageProgress = currentPageKey ? onboardingProgress[currentPageKey] || null : null;

  // Check if we should auto-trigger onboarding for this page
  // IMPORTANT: Never auto-trigger if global onboarding is completed
  const shouldAutoTrigger = !isLoading && 
    currentPageKey !== null && 
    !pageProgress?.completed && 
    !isOnboardingActive &&
    !globalOnboardingCompleted;

  // Start onboarding for a page
  const startOnboarding = useCallback((pageKey?: PageKey) => {
    const key = pageKey || currentPageKey;
    if (key && getPageTips(key)) {
      setIsOnboardingActive(true);
    }
  }, [currentPageKey]);

  // Complete onboarding for a page
  const completeOnboarding = useCallback(async (pageKey: PageKey, shownTips: number) => {
    if (!userId) return;

    const newProgress: OnboardingProgress = {
      ...onboardingProgress,
      [pageKey]: {
        completed: true,
        shownTips,
        lastShownAt: new Date().toISOString(),
      },
    };

    setOnboardingProgress(newProgress);
    setIsOnboardingActive(false);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('user_preferences')
        .update({
          onboarding_progress: newProgress as any,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error saving onboarding progress:', error);
      }
    } catch (error) {
      console.error('Error in completeOnboarding:', error);
    }
  }, [userId, onboardingProgress]);

  // Reset onboarding for a page (or all pages)
  const resetOnboarding = useCallback(async (pageKey?: PageKey) => {
    if (!userId) return;

    let newProgress: OnboardingProgress;
    
    if (pageKey) {
      // Reset specific page
      newProgress = {
        ...onboardingProgress,
        [pageKey]: {
          completed: false,
          shownTips: 0,
        },
      };
    } else {
      // Reset all pages
      newProgress = {};
    }

    setOnboardingProgress(newProgress);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('user_preferences')
        .update({
          onboarding_progress: newProgress as any,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting onboarding progress:', error);
      }
    } catch (error) {
      console.error('Error in resetOnboarding:', error);
    }
  }, [userId, onboardingProgress]);

  return {
    isOnboardingActive,
    currentPageKey,
    pageProgress,
    startOnboarding,
    completeOnboarding,
    resetOnboarding,
    shouldAutoTrigger,
    isLoading,
  };
}
