/**
 * ProductTourOverlay Component
 * Light, pointer-based callout tooltip for product tours
 * 
 * Features:
 * - Light bright tooltip with subtle shadow
 * - Soft glow spotlight on target (no heavy dark backdrop)
 * - Arrow pointing to target element
 * - Auto-scroll to elements out of view
 * - Non-blocking - users can still interact with page
 */

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TourStep } from '@/onboarding/tourConfig';

interface ProductTourOverlayProps {
  tip: TourStep;
  stepIndex: number;
  totalSteps: number;
  isAdvanced: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isLastStep: boolean;
  isLastBasicStep: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
}

const TOOLTIP_WIDTH = 320;
const TOOLTIP_MIN_HEIGHT = 140;
const ARROW_SIZE = 10;
const PADDING = 16;
const SCROLL_PADDING = 100;

export function ProductTourOverlay({
  tip,
  stepIndex,
  totalSteps,
  isAdvanced,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  isLastStep,
  isLastBasicStep,
}: ProductTourOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Find target element using selector (supports multiple selectors with comma)
  const findAndScrollToTarget = useCallback(async (selector: string) => {
    const selectors = selector.split(',').map(s => s.trim());
    let element: HTMLElement | null = null;

    for (const sel of selectors) {
      element = document.querySelector(sel) as HTMLElement;
      if (element) break;
    }

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
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
      await new Promise(resolve => setTimeout(resolve, 350));
      setIsScrolling(false);
    }

    const updatedRect = element.getBoundingClientRect();
    setTargetRect(updatedRect);
  }, []);

  // Calculate tooltip position
  const calculateTooltipPosition = useCallback((rect: DOMRect, preferredPosition?: string): TooltipPosition => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    let position: 'top' | 'bottom' | 'left' | 'right' =
      (preferredPosition as 'top' | 'bottom' | 'left' | 'right') || 'bottom';

    // Override if not enough space
    if (position === 'bottom' && spaceBelow < TOOLTIP_MIN_HEIGHT + ARROW_SIZE + PADDING) {
      position = spaceAbove > spaceBelow ? 'top' : 'right';
    }
    if (position === 'top' && spaceAbove < TOOLTIP_MIN_HEIGHT + ARROW_SIZE + PADDING) {
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
        top = rect.top - TOOLTIP_MIN_HEIGHT - ARROW_SIZE - 8;
        left = Math.max(PADDING, Math.min(
          rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2,
          viewportWidth - TOOLTIP_WIDTH - PADDING
        ));
        break;
      case 'right':
        top = Math.max(PADDING, Math.min(
          rect.top + rect.height / 2 - TOOLTIP_MIN_HEIGHT / 2,
          viewportHeight - TOOLTIP_MIN_HEIGHT - PADDING
        ));
        left = Math.min(rect.right + ARROW_SIZE + 8, viewportWidth - TOOLTIP_WIDTH - PADDING);
        break;
      case 'left':
        top = Math.max(PADDING, Math.min(
          rect.top + rect.height / 2 - TOOLTIP_MIN_HEIGHT / 2,
          viewportHeight - TOOLTIP_MIN_HEIGHT - PADDING
        ));
        left = Math.max(PADDING, rect.left - TOOLTIP_WIDTH - ARROW_SIZE - 8);
        break;
    }

    return { top, left, arrowPosition: position };
  }, []);

  // Find target on mount and step change
  useEffect(() => {
    if (tip.selector) {
      findAndScrollToTarget(tip.selector);
    }
  }, [tip.selector, findAndScrollToTarget]);

  // Update tooltip position when target rect changes
  useLayoutEffect(() => {
    if (targetRect && !isScrolling) {
      const pos = calculateTooltipPosition(targetRect, tip.placement);
      setTooltipPosition(pos);
    } else if (!targetRect && !isScrolling) {
      // Centered fallback
      setTooltipPosition({
        top: window.innerHeight / 2 - TOOLTIP_MIN_HEIGHT / 2,
        left: window.innerWidth / 2 - TOOLTIP_WIDTH / 2,
        arrowPosition: 'bottom',
      });
    }
  }, [targetRect, isScrolling, calculateTooltipPosition, tip.placement]);

  // Set up resize observer and listeners
  useEffect(() => {
    const updatePosition = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    if (targetElement) {
      observerRef.current = new ResizeObserver(updatePosition);
      observerRef.current.observe(targetElement);
    }

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetElement]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  // Arrow styles based on position
  const getArrowStyles = (): React.CSSProperties => {
    if (!targetRect || !tooltipPosition) return { display: 'none' };

    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
    };

    const arrowColor = 'white';
    const borderColor = 'hsl(var(--border))';

    switch (tooltipPosition.arrowPosition) {
      case 'bottom':
        return {
          ...baseStyles,
          top: -ARROW_SIZE,
          left: Math.max(20, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipPosition.left,
            TOOLTIP_WIDTH - 40
          )),
          borderLeft: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid ${arrowColor}`,
          filter: 'drop-shadow(0 -1px 0 hsl(var(--border) / 0.2))',
        };
      case 'top':
        return {
          ...baseStyles,
          bottom: -ARROW_SIZE,
          left: Math.max(20, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipPosition.left,
            TOOLTIP_WIDTH - 40
          )),
          borderLeft: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid transparent`,
          borderTop: `${ARROW_SIZE}px solid ${arrowColor}`,
          filter: 'drop-shadow(0 1px 0 hsl(var(--border) / 0.2))',
        };
      case 'right':
        return {
          ...baseStyles,
          left: -ARROW_SIZE,
          top: Math.max(20, Math.min(
            targetRect.top + targetRect.height / 2 - tooltipPosition.top,
            TOOLTIP_MIN_HEIGHT - 40
          )),
          borderTop: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid ${arrowColor}`,
          filter: 'drop-shadow(-1px 0 0 hsl(var(--border) / 0.2))',
        };
      case 'left':
        return {
          ...baseStyles,
          right: -ARROW_SIZE,
          top: Math.max(20, Math.min(
            targetRect.top + targetRect.height / 2 - tooltipPosition.top,
            TOOLTIP_MIN_HEIGHT - 40
          )),
          borderTop: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid transparent`,
          borderLeft: `${ARROW_SIZE}px solid ${arrowColor}`,
          filter: 'drop-shadow(1px 0 0 hsl(var(--border) / 0.2))',
        };
      default:
        return { display: 'none' };
    }
  };

  return (
    <>
      {/* Very subtle page dim - 5% opacity, non-blocking */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9997] pointer-events-none"
        style={{ background: 'rgba(0, 0, 0, 0.05)' }}
      />

      {/* Soft spotlight glow on target element */}
      {targetRect && !isScrolling && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[9998] pointer-events-none rounded-lg"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: `
              0 0 0 2px hsl(var(--primary) / 0.5),
              0 0 12px 4px hsl(var(--primary) / 0.2),
              0 0 24px 8px hsl(var(--primary) / 0.1)
            `,
            background: 'transparent',
          }}
        />
      )}

      {/* Light tooltip card */}
      {tooltipPosition && !isScrolling && (
        <motion.div
          key={tip.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed z-[10001] bg-white dark:bg-card rounded-xl shadow-lg border border-border/50 pointer-events-auto"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: TOOLTIP_WIDTH,
            minHeight: TOOLTIP_MIN_HEIGHT,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Arrow */}
          {targetRect && <div style={getArrowStyles()} />}

          {/* Progress bar - thin blue */}
          <div className="h-1 bg-muted/50 rounded-t-xl overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm text-foreground pr-3 leading-snug">
                {tip.title}
              </h4>
              <button
                onClick={onSkip}
                className="p-1 rounded-full hover:bg-muted/80 transition-colors flex-shrink-0 -mt-0.5 -mr-1"
                title="Close"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Content - max 2 sentences */}
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {tip.body}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                {stepIndex + 1}/{totalSteps}
                {isAdvanced && <span className="text-primary/70 ml-1">(Pro tip)</span>}
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  Skip
                </Button>

                {stepIndex > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrev}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-7 px-3 text-xs"
                >
                  {isLastStep ? 'Done' : isLastBasicStep ? 'Continue' : 'Next'}
                  {!isLastStep && <ChevronRight className="h-3.5 w-3.5 ml-0.5" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {isScrolling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-[10001] inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-white/90 dark:bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground shadow-sm">
            Scrolling...
          </div>
        </motion.div>
      )}
    </>
  );
}
