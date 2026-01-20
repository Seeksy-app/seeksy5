import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScenarioType, ScenarioMultipliers, getScenarioMultiplierDisplay } from '@/hooks/useCFOMasterModel';

interface ProFormaScenarioCardProps {
  scenario: ScenarioType;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  baselineValues?: {
    revenueGrowth: number;
    cpm: number;
    fillRate: number;
    churn: number;
  };
}

const SCENARIO_CONFIG: Record<ScenarioType, {
  label: string;
  description: string;
  icon: typeof Target;
  color: string;
  iconColor: string;
  badgeColor: string;
}> = {
  base: {
    label: 'Base (CFO Baseline)',
    description: 'Pure CFO assumptions — no multipliers applied',
    icon: Target,
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  conservative: {
    label: 'Growth (Conservative)',
    description: 'Downward adjustments for risk modeling',
    icon: TrendingDown,
    color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  aggressive: {
    label: 'Aggressive (Upside)',
    description: 'Upward adjustments for best-case scenario',
    icon: TrendingUp,
    color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },
};

const formatCurrency = (value: number) => `$${value.toFixed(0)}`;
const formatPercent = (value: number) => `${value.toFixed(0)}%`;

export function ProFormaScenarioCard({
  scenario,
  isSelected,
  onSelect,
  disabled = false,
  baselineValues,
}: ProFormaScenarioCardProps) {
  const config = SCENARIO_CONFIG[scenario];
  const Icon = config.icon;
  const isBase = scenario === 'base';

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 border-2',
        isSelected ? config.color : 'border-transparent hover:border-muted-foreground/20',
        disabled && 'opacity-50 pointer-events-none'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', config.iconColor)} />
            <span className="font-semibold">{config.label}</span>
          </div>
          {isSelected && <Check className="h-5 w-5 text-primary" />}
        </div>
        
        <p className="text-xs text-muted-foreground mb-3">
          {config.description}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {isBase && baselineValues ? (
            // Base scenario shows raw CFO values
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue Growth:</span>
                <Badge variant="outline" className={cn('text-xs', config.badgeColor)}>
                  {formatPercent(baselineValues.revenueGrowth)}/mo
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPM:</span>
                <Badge variant="outline" className={cn('text-xs', config.badgeColor)}>
                  {formatCurrency(baselineValues.cpm)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fill Rate:</span>
                <Badge variant="outline" className={cn('text-xs', config.badgeColor)}>
                  {formatPercent(baselineValues.fillRate)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Churn:</span>
                <Badge variant="outline" className={cn('text-xs', config.badgeColor)}>
                  {formatPercent(baselineValues.churn)}/mo
                </Badge>
              </div>
            </>
          ) : (
            // Aggressive/Conservative show only % multipliers
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue:</span>
                <Badge variant="outline" className={cn('text-xs', config.badgeColor)}>
                  {getScenarioMultiplierDisplay(scenario, 'revenueGrowth')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPM:</span>
                <Badge variant="outline" className={cn('text-xs', config.badgeColor)}>
                  {getScenarioMultiplierDisplay(scenario, 'cpm')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fill Rate:</span>
                <Badge variant="outline" className={cn('text-xs', config.badgeColor)}>
                  {getScenarioMultiplierDisplay(scenario, 'fillRate')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Churn:</span>
                <Badge variant="outline" className={cn('text-xs', config.badgeColor)}>
                  {getScenarioMultiplierDisplay(scenario, 'churn')}
                </Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
