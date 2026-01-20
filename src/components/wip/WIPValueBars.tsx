import { motion } from 'framer-motion';
import { WIPScoreResult } from '@/types/wip';

interface WIPValueBarsProps {
  scores: WIPScoreResult | null;
  compact?: boolean;
}

const VALUE_COLORS: Record<string, string> = {
  ACHIEVEMENT: 'bg-emerald-500',
  RECOGNITION: 'bg-amber-500',
  INDEPENDENCE: 'bg-blue-500',
  WORKING_CONDITIONS: 'bg-purple-500',
  RELATIONSHIPS: 'bg-pink-500',
  SUPPORT: 'bg-cyan-500',
};

export function WIPValueBars({ scores, compact = false }: WIPValueBarsProps) {
  if (!scores) {
    return (
      <div className="space-y-2">
        {['Achievement', 'Recognition', 'Independence', 'Working Conditions', 'Relationships', 'Support'].map((label) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-muted-foreground">--</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-0 bg-primary/30 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sortedValues = [...scores.valueScores].sort(
    (a, b) => a.value.sort_order - b.value.sort_order
  );

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-3'}>
      {sortedValues.map((vs) => {
        const colorClass = VALUE_COLORS[vs.value.code] || 'bg-primary';
        
        return (
          <div key={vs.value.id} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={compact ? 'text-muted-foreground truncate' : 'text-foreground font-medium'}>
                {vs.value.label}
              </span>
              <span className="text-muted-foreground font-mono ml-2">
                {vs.stdScore.toFixed(2)}
              </span>
            </div>
            <div className={`${compact ? 'h-1.5' : 'h-2.5'} bg-muted rounded-full overflow-hidden`}>
              <motion.div
                className={`h-full ${colorClass} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, vs.stdScore))}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
