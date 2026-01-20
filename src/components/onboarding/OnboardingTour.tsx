/**
 * OnboardingTour Component - Anchor-Based Guided Tours
 * 
 * Features:
 * - Tooltips anchor to specific UI elements with arrows pointing at target
 * - Highlight/glow around target element with dimmed backdrop
 * - Auto-scroll to elements that are out of view
 * - 4-step basic tour + optional 4-step advanced tour per page
 */

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingTip, PageKey, getPageTips } from '@/onboarding/tips';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';

interface OnboardingTourProps {
  pageKey: PageKey;
  onComplete: () => void;
  onSkip: () => void;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

const TOOLTIP_WIDTH = 340;
const TOOLTIP_HEIGHT = 200;
const ARROW_SIZE = 12;
const PADDING = 16;
const SCROLL_PADDING = 100;

export function OnboardingTour({ pageKey, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [showMorePrompt, setShowMorePrompt] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const { completeOnboarding } = useOnboarding();
  const { toast } = useToast();

  const pageTips = getPageTips(pageKey);
  const tips = showAdvanced 
    ? [...(pageTips?.primaryTips || []), ...(pageTips?.advancedTips || [])]
    : pageTips?.primaryTips || [];

  const currentTip = tips[currentStep];
  const isLastPrimaryTip = !showAdvanced && currentStep === (pageTips?.primaryTips.length || 0) - 1;
  const isLastTip = currentStep === tips.length - 1;

  // Find target element and scroll into view
  const findAndScrollToTarget = useCallback(async (tip: OnboardingTip) => {
    const element = document.querySelector(tip.target) as HTMLElement;
    
    if (!element) {
      setTargetElement(null);
      setTargetRect(null);
      return;
    }

    setTargetElement(element);

    // Check if element is in viewport
    const rect = element.getBoundingClientRect();
    const isInViewport = 
      rect.top >= SCROLL_PADDING &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight - SCROLL_PADDING &&
      rect.right <= window.innerWidth;

    if (!isInViewport) {
      setIsScrolling(true);
      
      // Scroll element into view with smooth behavior
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });

      // Wait for scroll to complete
      await new Promise(resolve => setTimeout(resolve, 400));
      setIsScrolling(false);
    }

    // Update rect after potential scroll
    const updatedRect = element.getBoundingClientRect();
    setTargetRect(updatedRect);
  }, []);

  // Calculate optimal tooltip position anchored to target
  const calculateTooltipPosition = useCallback((rect: DOMRect, preferredPosition?: string): TooltipPosition => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Determine best position based on available space
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    let position: 'top' | 'bottom' | 'left' | 'right' = 
      (preferredPosition as 'top' | 'bottom' | 'left' | 'right') || 'bottom';
    
    // Override preferred position if not enough space
    if (position === 'bottom' && spaceBelow < TOOLTIP_HEIGHT + ARROW_SIZE + PADDING) {
      position = spaceAbove > spaceBelow ? 'top' : 'right';
    }
    if (position === 'top' && spaceAbove < TOOLTIP_HEIGHT + ARROW_SIZE + PADDING) {
      position = spaceBelow > spaceAbove ? 'bottom' : 'right';
    }
    if (position === 'right' && spaceRight < TOOLTIP_WIDTH + ARROW_SIZE + PADDING) {
      position = spaceLeft > spaceRight ? 'left' : 'bottom';
    }
    if (position === 'left' && spaceLeft < TOOLTIP_WIDTH + ARROW_SIZE + PADDING) {
      position = spaceRight > spaceLeft ? 'right' : 'bottom';
    }

    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = rect.bottom + ARROW_SIZE + 8;
        left = Math.max(PADDING, Math.min(
          rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2,
          viewportWidth - TOOLTIP_WIDTH - PADDING
        ));
        break;
      case 'top':
        top = rect.top - TOOLTIP_HEIGHT - ARROW_SIZE - 8;
        left = Math.max(PADDING, Math.min(
          rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2,
          viewportWidth - TOOLTIP_WIDTH - PADDING
        ));
        break;
      case 'right':
        top = Math.max(PADDING, Math.min(
          rect.top + rect.height / 2 - TOOLTIP_HEIGHT / 2,
          viewportHeight - TOOLTIP_HEIGHT - PADDING
        ));
        left = Math.min(rect.right + ARROW_SIZE + 8, viewportWidth - TOOLTIP_WIDTH - PADDING);
        break;
      case 'left':
        top = Math.max(PADDING, Math.min(
          rect.top + rect.height / 2 - TOOLTIP_HEIGHT / 2,
          viewportHeight - TOOLTIP_HEIGHT - PADDING
        ));
        left = Math.max(PADDING, rect.left - TOOLTIP_WIDTH - ARROW_SIZE - 8);
        break;
    }

    return { top, left, arrowPosition: position };
  }, []);

  // Update target position on step change
  useEffect(() => {
    if (currentTip && !showMorePrompt) {
      findAndScrollToTarget(currentTip);
    }
  }, [currentTip, showMorePrompt, findAndScrollToTarget]);

  // Update tooltip position when target rect changes
  useLayoutEffect(() => {
    if (targetRect && !isScrolling) {
      const pos = calculateTooltipPosition(targetRect, currentTip?.position);
      setTooltipPosition(pos);
    }
  }, [targetRect, isScrolling, calculateTooltipPosition, currentTip?.position]);

  // Set up resize observer and scroll/resize listeners
  useEffect(() => {
    const updatePosition = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    // Resize observer for target element
    if (targetElement) {
      observerRef.current = new ResizeObserver(updatePosition);
      observerRef.current.observe(targetElement);
    }

    // Window events
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetElement]);

  const handleNext = async () => {
    if (isLastPrimaryTip && !showAdvanced) {
      setShowMorePrompt(true);
    } else if (isLastTip) {
      await completeOnboarding(pageKey, tips.length);
      toast({
        title: "Tour Completed! 🎉",
        description: `You've completed the ${pageTips?.pageName} tour.`,
      });
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleShowMore = () => {
    setShowAdvanced(true);
    setShowMorePrompt(false);
    setCurrentStep(prev => prev + 1);
  };

  const handleDeclineMore = async () => {
    await completeOnboarding(pageKey, pageTips?.primaryTips.length || 4);
    toast({
      title: "Tour Completed! 🎉",
      description: `You've completed the ${pageTips?.pageName} tour.`,
    });
    onComplete();
  };

  const handleSkip = async () => {
    await completeOnboarding(pageKey, currentStep + 1);
    onSkip();
  };

  if (!currentTip) return null;

  // Calculate arrow position relative to tooltip
  const getArrowStyles = (): React.CSSProperties => {
    if (!targetRect || !tooltipPosition) return { display: 'none' };

    const arrowOffset = ARROW_SIZE / 2;
    
    switch (tooltipPosition.arrowPosition) {
      case 'bottom': // Arrow points up (tooltip is below target)
        return {
          position: 'absolute',
          top: -ARROW_SIZE + 2,
          left: Math.max(20, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipPosition.left - arrowOffset,
            TOOLTIP_WIDTH - 40
          )),
          transform: 'rotate(45deg)',
        };
      case 'top': // Arrow points down (tooltip is above target)
        return {
          position: 'absolute',
          bottom: -ARROW_SIZE + 2,
          left: Math.max(20, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipPosition.left - arrowOffset,
            TOOLTIP_WIDTH - 40
          )),
          transform: 'rotate(45deg)',
        };
      case 'right': // Arrow points left (tooltip is to the right)
        return {
          position: 'absolute',
          left: -ARROW_SIZE + 2,
          top: Math.max(20, Math.min(
            targetRect.top + targetRect.height / 2 - tooltipPosition.top - arrowOffset,
            TOOLTIP_HEIGHT - 40
          )),
          transform: 'rotate(45deg)',
        };
      case 'left': // Arrow points right (tooltip is to the left)
        return {
          position: 'absolute',
          right: -ARROW_SIZE + 2,
          top: Math.max(20, Math.min(
            targetRect.top + targetRect.height / 2 - tooltipPosition.top - arrowOffset,
            TOOLTIP_HEIGHT - 40
          )),
          transform: 'rotate(45deg)',
        };
      default:
        return { display: 'none' };
    }
  };

  return (
    <>
      {/* Dark backdrop overlay with spotlight cutout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] pointer-events-auto"
        onClick={handleSkip}
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
        }}
      />

      {/* Spotlight highlight around target element */}
      {targetRect && !isScrolling && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: 12,
            boxShadow: `
              0 0 0 9999px rgba(0, 0, 0, 0.7),
              0 0 0 3px hsl(var(--primary)),
              0 0 20px 4px hsl(var(--primary) / 0.4),
              inset 0 0 0 2px hsl(var(--primary) / 0.2)
            `,
            background: 'transparent',
          }}
        />
      )}

      {/* Pulsing glow effect on target */}
      {targetRect && !isScrolling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="fixed z-[9998] pointer-events-none"
          style={{
            top: targetRect.top - 12,
            left: targetRect.left - 12,
            width: targetRect.width + 24,
            height: targetRect.height + 24,
            borderRadius: 16,
            background: 'transparent',
            boxShadow: '0 0 30px 8px hsl(var(--primary) / 0.3)',
          }}
        />
      )}

      {/* "See more tips?" prompt */}
      <AnimatePresence>
        {showMorePrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[10001] inset-0 flex items-center justify-center pointer-events-auto"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm mx-4 text-center">
              <h3 className="text-lg font-semibold mb-2">See more tips?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                There are {pageTips?.advancedTips.length} more advanced tips for this page.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleDeclineMore}>
                  Not now
                </Button>
                <Button onClick={handleShowMore}>
                  Yes, show me
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anchored tooltip card */}
      {!showMorePrompt && tooltipPosition && !isScrolling && (
        <motion.div
          ref={tooltipRef}
          key={`${currentTip.id}-${currentStep}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[10001] bg-card border border-border rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: TOOLTIP_WIDTH,
            minHeight: TOOLTIP_HEIGHT,
          }}
        >
          {/* Arrow pointing to target */}
          <div
            className="w-3 h-3 bg-card border-l border-t border-border"
            style={getArrowStyles()}
          />

          {/* Progress bar */}
          <div className="h-1.5 bg-muted">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / tips.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-base pr-4 leading-tight">{currentTip.title}</h4>
              <button
                onClick={handleSkip}
                className="p-1.5 rounded-full hover:bg-muted transition-colors flex-shrink-0 -mt-1 -mr-1"
                title="Skip tour"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              {currentTip.content}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground font-medium">
                Step {currentStep + 1} of {tips.length}
                {showAdvanced && <span className="text-primary ml-1.5">(Advanced)</span>}
              </span>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs h-8 px-2"
                >
                  <SkipForward className="h-3.5 w-3.5 mr-1" />
                  Skip
                </Button>
                
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-8 px-3"
                >
                  {isLastTip ? 'Done' : isLastPrimaryTip ? 'Continue' : 'Next'}
                  {!isLastTip && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading state while scrolling */}
      {isScrolling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-[10001] inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-muted-foreground">
            Scrolling to element...
          </div>
        </motion.div>
      )}
    </>
  );
}
