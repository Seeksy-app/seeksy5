import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ScenarioType = 'base' | 'best' | 'worst';

interface ScenarioConfig {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const SCENARIO_CONFIGS: Record<ScenarioType, ScenarioConfig> = {
  base: {
    label: 'Base',
    description: 'Realistic operating expectations using historical trends and steady adoption.',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  best: {
    label: 'Growth',
    description: 'Faster adoption, improved retention, higher ARPU, lower CAC, and efficient OpEx.',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  worst: {
    label: 'Aggressive',
    description: 'Higher growth targets, accelerated spend, premium positioning.',
    icon: TrendingDown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
};

interface CFOScenarioSummaryProps {
  scenario: ScenarioType;
  className?: string;
  compact?: boolean;
}

export function CFOScenarioSummary({ scenario, className, compact = false }: CFOScenarioSummaryProps) {
  const config = SCENARIO_CONFIGS[scenario];
  const Icon = config.icon;
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", config.bgColor, config.borderColor, className)}>
        <Icon className={cn("w-4 h-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
        <span className="text-xs text-muted-foreground">— {config.description}</span>
      </div>
    );
  }
  
  return (
    <Card className={cn("border", config.bgColor, config.borderColor, className)}>
      <CardContent className="py-4 px-5">
        <div className="flex items-start gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor)}>
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn("font-semibold", config.color)}>{config.label}</h3>
              <Badge variant="outline" className={cn("text-xs", config.color, config.borderColor)}>
                Active Scenario
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          <Sparkles className="w-4 h-4 text-primary/40" />
        </div>
      </CardContent>
    </Card>
  );
}

// Summary export section for Board/Investor presentations
interface ScenarioSummaryExportProps {
  scenario: ScenarioType;
  className?: string;
}

export function ScenarioSummaryExport({ scenario, className }: ScenarioSummaryExportProps) {
  const config = SCENARIO_CONFIGS[scenario];
  
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-semibold text-lg">Scenario Summary</h3>
      <div className={cn("p-4 rounded-lg border", config.bgColor, config.borderColor)}>
        <div className="flex items-center gap-2 mb-2">
          <config.icon className={cn("w-5 h-5", config.color)} />
          <span className={cn("font-semibold", config.color)}>{config.label}</span>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-sm">
        {Object.entries(SCENARIO_CONFIGS).map(([key, cfg]) => (
          <div 
            key={key} 
            className={cn(
              "p-3 rounded-lg border",
              key === scenario ? cn(cfg.bgColor, cfg.borderColor) : "bg-muted/30"
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <cfg.icon className={cn("w-3.5 h-3.5", key === scenario ? cfg.color : "text-muted-foreground")} />
              <span className={cn("font-medium text-xs", key === scenario ? cfg.color : "text-muted-foreground")}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{cfg.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
