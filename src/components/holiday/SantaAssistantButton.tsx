/**
 * Santa Assistant Button
 * Floating bottom-right button when Holiday Mode is enabled
 */

import { useState, useEffect } from "react";
import { SantaAssistantPopup } from "./SantaAssistantPopup";

export const SantaAssistantButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasWaved, setHasWaved] = useState(false);
  
  // Hide button if welcome modal hasn't been seen yet
  const hasSeenWelcome = localStorage.getItem("holiday_welcome_seen");
  if (!hasSeenWelcome) return null;

  // One-time wave animation on first appearance
  useEffect(() => {
    const timer = setTimeout(() => setHasWaved(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 hover:scale-110 transition-all duration-200"
        aria-label="Open Santa Assistant"
      >
        <img 
          src="/spark/holiday/spark-santa-waving.png" 
          alt="Santa Spark"
          className={`w-full h-full object-contain ${!hasWaved ? 'animate-[wave_1.2s_ease-in-out]' : ''}`}
        />
      </button>

      <SantaAssistantPopup open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};
