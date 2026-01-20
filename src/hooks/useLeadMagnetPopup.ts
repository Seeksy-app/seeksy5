import { useState, useEffect, useCallback, useRef } from "react";

interface UseLeadMagnetPopupOptions {
  scrollThreshold?: number; // Percentage (0-100)
  timeDelay?: number; // Seconds
  enabled?: boolean;
  storageKey?: string;
}

export function useLeadMagnetPopup(options: UseLeadMagnetPopupOptions = {}) {
  const {
    scrollThreshold = 60,
    timeDelay = 45,
    enabled = true,
    storageKey = "seeksy_lead_magnet_shown",
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if already shown in this session
  const hasBeenShown = useCallback(() => {
    if (typeof window === "undefined") return false;
    const shown = sessionStorage.getItem(storageKey);
    return shown === "true";
  }, [storageKey]);

  // Mark as shown
  const markAsShown = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, "true");
    }
  }, [storageKey]);

  // Open the modal
  const openModal = useCallback(() => {
    if (!hasTriggered && !hasBeenShown()) {
      setIsOpen(true);
      setHasTriggered(true);
      markAsShown();
    }
  }, [hasTriggered, hasBeenShown, markAsShown]);

  // Close the modal
  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Manual trigger (e.g., from a button click)
  const triggerManually = useCallback(() => {
    setIsOpen(true);
    setHasTriggered(true);
    markAsShown();
  }, [markAsShown]);

  // Reset (for testing)
  const reset = useCallback(() => {
    setHasTriggered(false);
    setIsOpen(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Scroll handler
  useEffect(() => {
    if (!enabled || hasTriggered || hasBeenShown()) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (window.scrollY / scrollHeight) * 100;

      if (scrollPercent >= scrollThreshold) {
        openModal();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled, hasTriggered, hasBeenShown, scrollThreshold, openModal]);

  // Time delay handler
  useEffect(() => {
    if (!enabled || hasTriggered || hasBeenShown()) return;

    timeoutRef.current = setTimeout(() => {
      openModal();
    }, timeDelay * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, hasTriggered, hasBeenShown, timeDelay, openModal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    openModal: triggerManually,
    closeModal,
    reset,
    hasTriggered,
  };
}
