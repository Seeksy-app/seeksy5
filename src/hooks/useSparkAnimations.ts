/**
 * useSparkAnimations Hook
 * Manages all Spark mascot animations with precise control
 */

import { useState, useEffect, useRef } from "react";

interface SparkAnimationState {
  welcomeBounce: boolean;
  hatWiggle: boolean;
  blinkSparkle: boolean;
  idleFloat: boolean;
}

export const useSparkAnimations = () => {
  const [animations, setAnimations] = useState<SparkAnimationState>({
    welcomeBounce: false,
    hatWiggle: false,
    blinkSparkle: false,
    idleFloat: false,
  });

  const isHovering = useRef(false);
  const hoverCount = useRef(0);
  const idleTimer = useRef<NodeJS.Timeout>();
  const lastActivityTime = useRef(Date.now());
  const hasPlayedWelcome = useRef(false);

  // 1A: Welcome bounce - once per session
  useEffect(() => {
    const welcomePlayed = sessionStorage.getItem("spark_welcome_played");
    
    if (!welcomePlayed && !hasPlayedWelcome.current) {
      hasPlayedWelcome.current = true;
      
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        setAnimations(prev => ({ ...prev, welcomeBounce: true }));
        sessionStorage.setItem("spark_welcome_played", "true");
        
        // Reset after animation completes
        setTimeout(() => {
          setAnimations(prev => ({ ...prev, welcomeBounce: false }));
        }, 1250);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, []);

  // H: Idle float - every 30-45s when not hovering
  useEffect(() => {
    const scheduleIdleFloat = () => {
      const delay = 30000 + Math.random() * 15000; // 30-45s random
      
      idleTimer.current = setTimeout(() => {
        if (!isHovering.current && Date.now() - lastActivityTime.current > 30000) {
          setAnimations(prev => ({ ...prev, idleFloat: true }));
          
          setTimeout(() => {
            setAnimations(prev => ({ ...prev, idleFloat: false }));
            scheduleIdleFloat(); // Schedule next float
          }, 1500);
        } else {
          scheduleIdleFloat(); // Reschedule if hovering
        }
      }, delay);
    };

    scheduleIdleFloat();

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  // Reset activity timer on any animation
  const resetActivity = () => {
    lastActivityTime.current = Date.now();
  };

  // Handle hover enter - trigger hat wiggle
  const handleHoverEnter = () => {
    isHovering.current = true;
    hoverCount.current += 1;
    resetActivity();

    // 2D: Hat wiggle
    setAnimations(prev => ({ ...prev, hatWiggle: true }));
    
    setTimeout(() => {
      setAnimations(prev => ({ ...prev, hatWiggle: false }));
      
      // 2E: Blink + sparkle (every second hover or immediately)
      const shouldBlink = hoverCount.current % 2 === 0 || hoverCount.current === 1;
      
      if (shouldBlink) {
        setAnimations(prev => ({ ...prev, blinkSparkle: true }));
        
        setTimeout(() => {
          setAnimations(prev => ({ ...prev, blinkSparkle: false }));
        }, 500);
      }
    }, 300);
  };

  // Handle hover leave
  const handleHoverLeave = () => {
    isHovering.current = false;
    resetActivity();
  };

  return {
    animations,
    handleHoverEnter,
    handleHoverLeave,
  };
};
