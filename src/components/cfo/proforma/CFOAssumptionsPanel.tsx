import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Settings, ChevronDown, ChevronUp, RefreshCw, Database, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Benchmark {
  metric_key: string;
  value: number;
  unit: string;
  source_notes: string;
  confidence: string;
}

interface CFOAssumptionsPanelProps {
  benchmarks: Benchmark[];
  overrides: Record<string, number>;
  onOverrideChange: (key: string, value: number) => void;
  onClearOverrides: () => void;
  useCustomOverrides: boolean;
  onToggleOverrides: (value: boolean) => void;
  isLoading?: boolean;
}

const BENCHMARK_CATEGORIES = {
  'Audio CPMs': ['audio_hostread_preroll_cpm_low', 'audio_hostread_preroll_cpm_high', 'audio_hostread_midroll_cpm_low', 'audio_hostread_midroll_cpm_high', 'audio_programmatic_cpm_low', 'audio_programmatic_cpm_high'],
  'Video CPMs': ['video_preroll_cpm_low', 'video_preroll_cpm_high', 'video_midroll_cpm_low', 'video_midroll_cpm_high'],
  'Other Ads': ['newsletter_cpm_avg', 'display_cpm_avg', 'livestream_cpm_blended'],
  'Fill Rates': ['audio_fill_rate', 'video_fill_rate', 'newsletter_fill_rate', 'display_fill_rate', 'livestream_fill_rate'],
  'Revenue Shares': ['hostread_creator_share', 'hostread_platform_share', 'programmatic_creator_share', 'programmatic_platform_share'],
  'Ad Load': ['audio_ad_slots_per_episode', 'video_ad_slots_per_video', 'livestream_ad_slots_per_hour'],
  'Unit Economics': ['creator_cac_organic', 'creator_cac_paid', 'creator_monthly_churn', 'advertiser_monthly_churn'],
  'Subscriptions': ['creator_subscription_arpu_pro', 'creator_subscription_arpu_business', 'creator_subscription_arpu_enterprise'],
};

const CONFIDENCE_COLORS = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-700',
};

export function CFOAssumptionsPanel({
  benchmarks,
  overrides,
  onOverrideChange,
  onClearOverrides,
  useCustomOverrides,
  onToggleOverrides,
  isLoading,
}: CFOAssumptionsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Audio CPMs', 'Fill Rates']);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const getBenchmarksByCategory = (keys: string[]) => {
    return benchmarks.filter(b => keys.includes(b.metric_key));
  };

  const formatMetricLabel = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/cpm/gi, 'CPM')
      .replace(/arpu/gi, 'ARPU')
      .replace(/cac/gi, 'CAC')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            CFO Assumptions
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">R&D Benchmarks</span>
              <Switch
                checked={useCustomOverrides}
                onCheckedChange={onToggleOverrides}
              />
              <Edit3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Custom</span>
            </div>
            {hasOverrides && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearOverrides}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {useCustomOverrides 
            ? 'Edit values below to override R&D benchmarks' 
            : 'Using R&D benchmark data. Toggle to customize.'}
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        {Object.entries(BENCHMARK_CATEGORIES).map(([category, keys]) => {
          const categoryBenchmarks = getBenchmarksByCategory(keys);
          const isExpanded = expandedCategories.includes(category);
          
          if (categoryBenchmarks.length === 0) return null;

          return (
            <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="text-sm font-medium">{category}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {categoryBenchmarks.length} metrics
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-2 pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {categoryBenchmarks.map((benchmark) => {
                    const currentValue = overrides[benchmark.metric_key] ?? benchmark.value;
                    const isOverridden = benchmark.metric_key in overrides;
                    
                    return (
                      <div key={benchmark.metric_key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            {formatMetricLabel(benchmark.metric_key)}
                          </Label>
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-[10px] px-1',
                                CONFIDENCE_COLORS[benchmark.confidence as keyof typeof CONFIDENCE_COLORS] || CONFIDENCE_COLORS.medium
                              )}
                            >
                              {benchmark.confidence}
                            </Badge>
                            {isOverridden && (
                              <Badge variant="secondary" className="text-[10px] px-1">
                                Custom
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={currentValue}
                            onChange={(e) => onOverrideChange(benchmark.metric_key, parseFloat(e.target.value) || 0)}
                            disabled={!useCustomOverrides || isLoading}
                            className={cn(
                              'h-8 text-sm',
                              isOverridden && 'border-blue-300 bg-blue-50'
                            )}
                          />
                          <span className="text-xs text-muted-foreground min-w-[40px]">
                            {benchmark.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground italic">
            💡 All projections are powered by R&D benchmarks and are estimates, not actual platform data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
