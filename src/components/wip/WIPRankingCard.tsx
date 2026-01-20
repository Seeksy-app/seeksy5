import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WIPNeed } from '@/types/wip';

interface WIPRankingCardProps {
  needs: WIPNeed[];
  onComplete: (rankedNeedIds: string[]) => void;
  isSubmitting?: boolean;
}

interface RankedNeed {
  need: WIPNeed;
  rank: number;
}

export function WIPRankingCard({ needs, onComplete, isSubmitting }: WIPRankingCardProps) {
  const [rankedNeeds, setRankedNeeds] = useState<RankedNeed[]>([]);
  const [unrankedNeeds, setUnrankedNeeds] = useState<WIPNeed[]>(needs);

  // Reset when needs change (new round)
  useEffect(() => {
    setRankedNeeds([]);
    setUnrankedNeeds(needs);
  }, [needs]);

  const handleSelectNeed = useCallback((need: WIPNeed) => {
    const nextRank = rankedNeeds.length + 1;
    if (nextRank > 5) return;

    setRankedNeeds(prev => [...prev, { need, rank: nextRank }]);
    setUnrankedNeeds(prev => prev.filter(n => n.id !== need.id));
  }, [rankedNeeds.length]);

  const handleRemoveRank = useCallback((needId: string) => {
    const removedNeed = rankedNeeds.find(r => r.need.id === needId);
    if (!removedNeed) return;

    // Remove the need and reorder remaining ranks
    const remaining = rankedNeeds.filter(r => r.need.id !== needId);
    const reordered = remaining.map((r, idx) => ({ ...r, rank: idx + 1 }));
    
    setRankedNeeds(reordered);
    setUnrankedNeeds(prev => [...prev, removedNeed.need]);
  }, [rankedNeeds]);

  const handleSubmit = useCallback(() => {
    const rankedIds = rankedNeeds.map(r => r.need.id);
    onComplete(rankedIds);
  }, [rankedNeeds, onComplete]);

  const getRankLabel = (rank: number) => {
    switch (rank) {
      case 1: return 'Most Important';
      case 2: return '2nd';
      case 3: return '3rd';
      case 4: return '4th';
      case 5: return 'Least Important';
      default: return `${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
      case 2: return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case 3: return 'bg-muted/50 border-border text-muted-foreground';
      case 4: return 'bg-orange-500/10 border-orange-500/30 text-orange-300';
      case 5: return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      default: return 'bg-muted border-border';
    }
  };

  const isComplete = rankedNeeds.length === 5;

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground text-center">
        Click items in order of importance • Click ranked items to remove
      </div>

      {/* Ranked Items */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Your Ranking ({rankedNeeds.length}/5)
        </div>
        <div className="min-h-[200px] space-y-2">
          <AnimatePresence mode="popLayout">
            {rankedNeeds.map((item) => (
              <motion.div
                key={item.need.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  onClick={() => handleRemoveRank(item.need.id)}
                  className={cn(
                    'p-3 border-2 cursor-pointer transition-all duration-200 hover:scale-[0.98]',
                    getRankColor(item.rank)
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-background flex items-center justify-center text-sm font-bold">
                      {item.rank}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground leading-relaxed">
                        {item.need.description || item.need.label}
                      </div>
                    </div>

                    {/* Rank Label */}
                    <div className="hidden sm:block text-xs font-medium px-2 py-1 rounded bg-background/50">
                      {getRankLabel(item.rank)}
                    </div>

                    {/* Remove hint */}
                    <X className="h-4 w-4 opacity-40 hover:opacity-100 transition-opacity" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty slots */}
          {Array.from({ length: 5 - rankedNeeds.length }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="p-3 border-2 border-dashed border-border/50 rounded-lg flex items-center gap-3 opacity-40"
            >
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                {rankedNeeds.length + idx + 1}
              </div>
              <div className="text-sm text-muted-foreground">
                Click an item below to rank
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unranked Items */}
      {unrankedNeeds.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Available Items
          </div>
          <div className="grid gap-2">
            <AnimatePresence mode="popLayout">
              {unrankedNeeds.map((need) => (
                <motion.div
                  key={need.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, x: -20 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card
                    onClick={() => handleSelectNeed(need)}
                    className={cn(
                      'p-3 border cursor-pointer transition-all duration-200',
                      'hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02]',
                      'bg-card'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <Check className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-sm text-foreground leading-relaxed">
                        {need.description || need.label}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!isComplete || isSubmitting}
        className="w-full mt-6"
        size="lg"
      >
        {isSubmitting ? 'Saving...' : isComplete ? 'Continue' : `Rank ${5 - rankedNeeds.length} more`}
      </Button>
    </div>
  );
}
