import { Slider } from '@/components/ui/slider';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CFOSliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: 'percent' | 'currency' | 'multiplier' | 'months' | 'none';
  helperText?: string;
  tooltip?: string;
  className?: string;
}

const formatValue = (value: number, unit: CFOSliderControlProps['unit']): string => {
  switch (unit) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'currency':
      if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
      if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    case 'multiplier':
      return `${value.toFixed(1)}x`;
    case 'months':
      return `${value} mo`;
    default:
      return value.toString();
  }
};

export function CFOSliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = 'none',
  helperText,
  tooltip,
  className,
}: CFOSliderControlProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-foreground">{label}</label>
          {tooltip && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
          {formatValue(value, unit)}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

interface CollapsibleSliderSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CollapsibleSliderSection({
  title,
  isOpen,
  onToggle,
  children,
}: CollapsibleSliderSectionProps) {
  return (
    <div className="border rounded-lg mt-4 bg-muted/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t">
          {children}
        </div>
      )}
    </div>
  );
}