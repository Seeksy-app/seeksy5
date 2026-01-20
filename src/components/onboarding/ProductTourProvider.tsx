/**
 * ProductTourProvider Component
 * Provides product tour functionality throughout the app
 */

import { createContext, useContext, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useProductTour, ProductTourState, TourCompletion } from '@/hooks/useProductTour';
import { ProductTourOverlay } from './ProductTourOverlay';
import { SeeMoreTipsModal } from './SeeMoreTipsModal';
import { PageTourKey, getPageTour } from '@/onboarding/tourConfig';

interface ProductTourContextType {
  startBasicTour: (pageKey?: PageTourKey) => void;
  startAdvancedTour: (pageKey?: PageTourKey) => void;
  isActive: boolean;
  tourState: ProductTourState;
  isLoading: boolean;
  getCompletionStatus: (pageKey: PageTourKey) => TourCompletion;
  resetTour: (pageKey?: PageTourKey) => Promise<void>;
}

const ProductTourContext = createContext<ProductTourContextType | null>(null);

export function useProductTourContext() {
  const context = useContext(ProductTourContext);
  if (!context) {
    throw new Error('useProductTourContext must be used within ProductTourProvider');
  }
  return context;
}

interface ProductTourProviderProps {
  children: ReactNode;
}

export function ProductTourProvider({ children }: ProductTourProviderProps) {
  const {
    isActive,
    currentStep,
    currentTip,
    totalSteps,
    isShowingAdvanced,
    showMorePrompt,
    pageKey,
    
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
  } = useProductTour();

  // Tours are temporarily disabled - context still available but overlays don't render
  const disabledStartBasicTour = () => {
    // No-op - tours disabled
  };
  
  const disabledStartAdvancedTour = () => {
    // No-op - tours disabled
  };

  return (
    <ProductTourContext.Provider
      value={{
        startBasicTour: disabledStartBasicTour,
        startAdvancedTour: disabledStartAdvancedTour,
        isActive: false, // Always false while disabled
        tourState,
        isLoading,
        getCompletionStatus,
        resetTour,
      }}
    >
      {children}
      {/* Tour overlays disabled - remove AnimatePresence and tour UI */}
    </ProductTourContext.Provider>
  );
}
