import { cn } from '@/lib/utils';
import { IP_LIKERT_SCALE } from '@/types/interestProfiler';

interface IPLikertScaleProps {
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// Creative gradient-based scale instead of smiley faces
// Uses a heat/energy metaphor: cold/low → neutral → warm/high
export function IPLikertScale({ value, onChange, disabled }: IPLikertScaleProps) {
  return (
    <div className="w-full">
      {/* Labels row */}
      <div className="flex justify-between mb-2 px-1">
        <span className="text-xs text-muted-foreground">Strongly Dislike</span>
        <span className="text-xs text-muted-foreground">Strongly Like</span>
      </div>
      
      {/* Scale buttons */}
      <div className="flex gap-2 w-full">
        {IP_LIKERT_SCALE.map((option) => {
          const isSelected = value === option.value;
          
          // Gradient colors: deep blue (dislike) → gray (neutral) → warm orange/gold (like)
          const getButtonStyle = (val: number, selected: boolean) => {
            const baseStyles = "flex-1 py-4 px-2 rounded-lg font-medium text-sm transition-all duration-200 border-2 relative overflow-hidden";
            
            if (!selected) {
              return cn(baseStyles, "bg-muted/30 border-border/50 text-muted-foreground hover:border-border hover:bg-muted/50");
            }
            
            // Selected state with unique colors per level
            switch (val) {
              case 0: // Strongly Dislike
                return cn(baseStyles, "bg-gradient-to-br from-blue-600 to-blue-800 border-blue-500 text-white shadow-lg shadow-blue-500/30");
              case 1: // Dislike
                return cn(baseStyles, "bg-gradient-to-br from-blue-400 to-blue-500 border-blue-400 text-white shadow-lg shadow-blue-400/25");
              case 2: // Unsure
                return cn(baseStyles, "bg-gradient-to-br from-gray-400 to-gray-500 border-gray-400 text-white shadow-lg shadow-gray-400/25");
              case 3: // Like
                return cn(baseStyles, "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400 text-white shadow-lg shadow-amber-400/30");
              case 4: // Strongly Like
                return cn(baseStyles, "bg-gradient-to-br from-orange-500 to-red-500 border-orange-500 text-white shadow-lg shadow-orange-500/30");
              default:
                return baseStyles;
            }
          };

          // Visual indicator bars (instead of faces)
          const getIndicatorBars = (val: number, selected: boolean) => {
            const bars = [];
            const totalBars = 5;
            const filledBars = val + 1; // 0 = 1 bar, 4 = 5 bars
            
            for (let i = 0; i < totalBars; i++) {
              const isFilled = i < filledBars;
              bars.push(
                <div
                  key={i}
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-200",
                    i < 2 ? "h-2" : i === 2 ? "h-3" : i === 3 ? "h-4" : "h-5",
                    isFilled 
                      ? selected ? "bg-white/90" : "bg-current opacity-40"
                      : selected ? "bg-white/30" : "bg-current opacity-15"
                  )}
                />
              );
            }
            return bars;
          };

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={getButtonStyle(option.value, isSelected)}
              aria-label={option.label}
            >
              <div className="flex flex-col items-center gap-2">
                {/* Visual bars indicator */}
                <div className="flex items-end gap-0.5 h-6">
                  {getIndicatorBars(option.value, isSelected)}
                </div>
                
                {/* Short label */}
                <span className="text-xs font-medium whitespace-nowrap">
                  {option.shortLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
