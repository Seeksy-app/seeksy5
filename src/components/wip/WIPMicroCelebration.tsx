import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';

interface WIPMicroCelebrationProps {
  show: boolean;
  milestone: number;
  onComplete?: () => void;
}

export function WIPMicroCelebration({ show, milestone, onComplete }: WIPMicroCelebrationProps) {
  useEffect(() => {
    if (show && milestone === 21) {
      // Trigger confetti only on final completion
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'],
      });

      // Auto-dismiss after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, milestone, onComplete]);

  // Only celebrate on final completion (round 21)
  if (milestone !== 21) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
            className="bg-background/95 backdrop-blur-sm border-2 border-primary rounded-2xl p-6 shadow-2xl text-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Trophy className="h-12 w-12 mx-auto text-primary mb-3" />
            </motion.div>
            <p className="text-lg font-semibold text-foreground">All done! Calculating your results...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
