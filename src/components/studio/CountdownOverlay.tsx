import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountdownOverlayProps {
  isActive: boolean;
  onComplete: () => void;
  duration?: number;
}

export function CountdownOverlay({ isActive, onComplete, duration = 5 }: CountdownOverlayProps) {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setCount(duration);
      return;
    }

    if (count === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(c => c - 1);
      // Play beep sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = count === 1 ? 880 : 440;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {
        // Audio not available
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isActive, count, duration, onComplete]);

  return (
    <AnimatePresence>
      {isActive && count > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="text-[200px] font-bold text-white leading-none tabular-nums">
              {count}
            </div>
            <p className="text-white/60 text-2xl mt-4">
              {count === 1 ? "Starting..." : "Get ready..."}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
