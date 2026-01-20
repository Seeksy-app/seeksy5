/**
 * OnboardingProvider Component
 * Wraps the app to provide onboarding functionality
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { OnboardingTour } from './OnboardingTour';
import { PageKey, getPageKeyFromRoute, getPageTips } from '@/onboarding/tips';
import { useOnboarding, PageOnboardingState } from '@/hooks/useOnboarding';

interface OnboardingContextType {
  startTour: (pageKey?: PageKey) => void;
  isActive: boolean;
  currentPageKey: PageKey | null;
  pageProgress: PageOnboardingState | null;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const location = useLocation();
  const { 
    isOnboardingActive, 
    currentPageKey, 
    pageProgress,
    startOnboarding,
    shouldAutoTrigger,
    isLoading,
    resetOnboarding,
  } = useOnboarding();
  
  const [showTour, setShowTour] = useState(false);
  const [activePageKey, setActivePageKey] = useState<PageKey | null>(null);
  const [hasAutoTriggered, setHasAutoTriggered] = useState<Set<string>>(new Set());

  // Auto-trigger onboarding DISABLED - tours temporarily off
  // useEffect removed to prevent any auto-triggering

  // Reset when navigating to different page
  useEffect(() => {
    if (showTour && activePageKey && currentPageKey !== activePageKey) {
      setShowTour(false);
      setActivePageKey(null);
    }
  }, [location.pathname, showTour, activePageKey, currentPageKey]);

  // startTour is now a no-op while tours are disabled
  const startTour = useCallback(async (pageKey?: PageKey) => {
    // Tours temporarily disabled - no-op
  }, []);

  const handleComplete = useCallback(() => {
    setShowTour(false);
    setActivePageKey(null);
  }, []);

  const handleSkip = useCallback(() => {
    setShowTour(false);
    setActivePageKey(null);
  }, []);

  return (
    <OnboardingContext.Provider 
      value={{ 
        startTour, 
        isActive: false, // Always false while disabled
        currentPageKey,
        pageProgress,
      }}
    >
      {children}
      {/* Tour UI disabled - AnimatePresence and OnboardingTour removed */}
    </OnboardingContext.Provider>
  );
}
