/**
 * SeeMoreTipsModal Component
 * Light modal prompting user to continue with advanced tips
 */

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

interface SeeMoreTipsModalProps {
  advancedCount: number;
  onAccept: () => void;
  onDecline: () => void;
}

export function SeeMoreTipsModal({
  advancedCount,
  onAccept,
  onDecline,
}: SeeMoreTipsModalProps) {
  return (
    <>
      {/* Light backdrop - very subtle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/10"
        onClick={onDecline}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed z-[10001] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] bg-white dark:bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Header decoration */}
        <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

        <div className="p-5 relative">
          {/* Close button */}
          <button
            onClick={onDecline}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          {/* Content */}
          <h3 className="text-base font-semibold mb-1.5 text-foreground">See more tips?</h3>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            There are {advancedCount} more pro tips for this page that can help you get even more out of it.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onDecline}
              className="flex-1 h-9 text-sm"
            >
              Not now
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 h-9 text-sm"
            >
              Yes, show me
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
