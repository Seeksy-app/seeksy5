import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Target, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScenarioConfig {
  id: string;
  scenario_name: string;
  revenue_growth_multiplier: number;
  impressions_multiplier: number;
  cpm_multiplier: number;
  fill_rate_multiplier: number;
  churn_multiplier: number;
  cac_multiplier: number;
  description: string | null;
}

interface ScenarioSwitcherProps {
  scenarios: ScenarioConfig[];
  selectedScenario: string;
  onScenarioChange: (scenarioId: string) => void;
  isLoading?: boolean;
}

const SCENARIO_ICONS = {
  conservative: TrendingDown,
  base: Target,
  aggressive: TrendingUp,
};

const SCENARIO_COLORS = {
  conservative: 'border-amber-500 bg-amber-50',
  base: 'border-blue-500 bg-blue-50',
  aggressive: 'border-emerald-500 bg-emerald-50',
};

const SCENARIO_BADGE_COLORS = {
  conservative: 'bg-amber-100 text-amber-700 border-amber-200',
  base: 'bg-blue-100 text-blue-700 border-blue-200',
  aggressive: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function ScenarioSwitcher({ 
  scenarios, 
  selectedScenario, 
  onScenarioChange,
  isLoading 
}: ScenarioSwitcherProps) {
  const getScenarioKey = (name: string): keyof typeof SCENARIO_ICONS => {
    if (name.toLowerCase().includes('conservative')) return 'conservative';
    if (name.toLowerCase().includes('aggressive')) return 'aggressive';
    return 'base';
  };

  const formatMultiplier = (value: number, key: string) => {
    const percent = ((value - 1) * 100).toFixed(0);
    // Show "(Baseline)" for 0% on Base scenario
    if (key === 'base' && percent === '0') {
      return '0% (Baseline)';
    }
    return value >= 1 ? `+${percent}%` : `${percent}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {scenarios.map((scenario) => {
        const key = getScenarioKey(scenario.scenario_name);
        const Icon = SCENARIO_ICONS[key];
        const isSelected = selectedScenario === scenario.id;
        
        return (
          <Card
            key={scenario.id}
            className={cn(
              'cursor-pointer transition-all duration-200 border-2',
              isSelected 
                ? SCENARIO_COLORS[key]
                : 'border-transparent hover:border-muted-foreground/20',
              isLoading && 'opacity-50 pointer-events-none'
            )}
            onClick={() => onScenarioChange(scenario.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn(
                    'h-5 w-5',
                    key === 'conservative' && 'text-amber-600',
                    key === 'base' && 'text-blue-600',
                    key === 'aggressive' && 'text-emerald-600'
                  )} />
                  <span className="font-semibold">
                    {key === 'base' ? 'Base (CFO Baseline)' : scenario.scenario_name}
                  </span>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>

              {/* Helper text for Base scenario */}
              {key === 'base' ? (
                <p className="text-xs text-muted-foreground mb-3" title="Base uses your CFO assumptions exactly, with no additional multipliers.">
                  Pure CFO assumptions — no multipliers applied
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">
                  {scenario.description || 'Scenario projections based on R&D benchmarks'}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue:</span>
                  <Badge variant="outline" className={cn('text-xs', SCENARIO_BADGE_COLORS[key])}>
                    {formatMultiplier(scenario.revenue_growth_multiplier, key)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impressions:</span>
                  <Badge variant="outline" className={cn('text-xs', SCENARIO_BADGE_COLORS[key])}>
                    {formatMultiplier(scenario.impressions_multiplier, key)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPM:</span>
                  <Badge variant="outline" className={cn('text-xs', SCENARIO_BADGE_COLORS[key])}>
                    {formatMultiplier(scenario.cpm_multiplier, key)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fill Rate:</span>
                  <Badge variant="outline" className={cn('text-xs', SCENARIO_BADGE_COLORS[key])}>
                    {formatMultiplier(scenario.fill_rate_multiplier, key)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
