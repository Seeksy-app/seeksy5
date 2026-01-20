import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ExternalLink, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Benchmark {
  id: string;
  metric_key: string;
  value: number;
  unit: string | null;
  time_window: string | null;
  source_notes: string | null;
  confidence: string;
}

export function CFOAssumptionsPanel() {
  const [scenario, setScenario] = useState('base');
  const [notes, setNotes] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Revenue inputs state
  const [revenueInputs, setRevenueInputs] = useState({
    avgRevenuePerCreator: 5000,
    monetizationRate: 45,
    creatorGrowthPerMonth: 20,
    advertiserSpendGrowth: 15,
    inventoryFillRate: 65,
  });

  // Fetch benchmarks from R&D
  const { data: benchmarks, isLoading: benchmarksLoading } = useQuery({
    queryKey: ['rdBenchmarks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rd_benchmarks' as any)
        .select('*')
        .order('metric_key');

      if (error) return [];
      return (data as unknown) as Benchmark[];
    },
  });

  const getBenchmarkValue = (key: string) => {
    return benchmarks?.find(b => b.metric_key === key);
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    // Simulate AI forecast regeneration
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRegenerating(false);
    toast.success('Forecast regenerated with updated assumptions');
  };

  const formatBenchmarkValue = (benchmark: Benchmark | undefined) => {
    if (!benchmark) return '—';
    const value = benchmark.value;
    if (benchmark.unit === 'USD') return `$${value.toFixed(2)}`;
    if (benchmark.unit === 'percent') return `${value}%`;
    return value.toString();
  };

  return (
    <div className="space-y-6">
      {/* Revenue Inputs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Revenue Inputs
          </CardTitle>
          <CardDescription>Editable assumptions for financial modeling</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="avgRevenue">Avg Revenue per Creator</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="avgRevenue"
                type="number"
                className="pl-7"
                value={revenueInputs.avgRevenuePerCreator}
                onChange={(e) => setRevenueInputs({ ...revenueInputs, avgRevenuePerCreator: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="monetizationRate">Monetization Rate %</Label>
            <div className="relative mt-1.5">
              <Input
                id="monetizationRate"
                type="number"
                className="pr-7"
                value={revenueInputs.monetizationRate}
                onChange={(e) => setRevenueInputs({ ...revenueInputs, monetizationRate: Number(e.target.value) })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>

          <div>
            <Label htmlFor="creatorGrowth">Creator Growth per Month</Label>
            <Input
              id="creatorGrowth"
              type="number"
              className="mt-1.5"
              value={revenueInputs.creatorGrowthPerMonth}
              onChange={(e) => setRevenueInputs({ ...revenueInputs, creatorGrowthPerMonth: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="advertiserGrowth">Advertiser Spend Growth %</Label>
            <div className="relative mt-1.5">
              <Input
                id="advertiserGrowth"
                type="number"
                className="pr-7"
                value={revenueInputs.advertiserSpendGrowth}
                onChange={(e) => setRevenueInputs({ ...revenueInputs, advertiserSpendGrowth: Number(e.target.value) })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>

          <div>
            <Label htmlFor="fillRate">Inventory Fill Rate %</Label>
            <div className="relative mt-1.5">
              <Input
                id="fillRate"
                type="number"
                className="pr-7"
                value={revenueInputs.inventoryFillRate}
                onChange={(e) => setRevenueInputs({ ...revenueInputs, inventoryFillRate: Number(e.target.value) })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Inputs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Benchmark Inputs (Pulled from R&D)
          </CardTitle>
          <CardDescription>Market benchmarks from research intelligence feeds</CardDescription>
        </CardHeader>
        <CardContent>
          {benchmarksLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <BenchmarkCard
                label="Podcast CPM (Mid-roll, US)"
                benchmark={getBenchmarkValue('podcast_cpm_midroll_us')}
                getConfidenceBadgeColor={getConfidenceBadgeColor}
                formatValue={formatBenchmarkValue}
              />
              <BenchmarkCard
                label="Podcast CPM (Pre-roll)"
                benchmark={getBenchmarkValue('podcast_cpm_preroll')}
                getConfidenceBadgeColor={getConfidenceBadgeColor}
                formatValue={formatBenchmarkValue}
              />
              <BenchmarkCard
                label="Creator Sponsorship Rate (Avg)"
                benchmark={getBenchmarkValue('creator_sponsorship_rate_avg')}
                getConfidenceBadgeColor={getConfidenceBadgeColor}
                formatValue={formatBenchmarkValue}
              />
              <BenchmarkCard
                label="Ad Conversion Benchmarks"
                benchmark={getBenchmarkValue('ad_conversion_benchmark')}
                getConfidenceBadgeColor={getConfidenceBadgeColor}
                formatValue={formatBenchmarkValue}
              />
              <BenchmarkCard
                label="Creator Category Growth Rates"
                benchmark={getBenchmarkValue('creator_category_growth_rate')}
                getConfidenceBadgeColor={getConfidenceBadgeColor}
                formatValue={formatBenchmarkValue}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scenario Controls Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Scenario Controls
          </CardTitle>
          <CardDescription>Select scenario and regenerate forecasts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Scenario</Label>
            <Select value={scenario} onValueChange={setScenario}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="upside">Upside</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Model Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this forecast scenario..."
              className="mt-1.5 min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="w-full"
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Regenerating Forecast...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Forecast
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BenchmarkCard({
  label,
  benchmark,
  getConfidenceBadgeColor,
  formatValue,
}: {
  label: string;
  benchmark: Benchmark | undefined;
  getConfidenceBadgeColor: (confidence: string) => string;
  formatValue: (benchmark: Benchmark | undefined) => string;
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/50 border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold mt-1">{formatValue(benchmark)}</p>
        </div>
        {benchmark && (
          <Badge variant="outline" className={getConfidenceBadgeColor(benchmark.confidence)}>
            {benchmark.confidence}
          </Badge>
        )}
      </div>
      {benchmark?.source_notes && (
        <p className="text-xs text-muted-foreground mt-2">{benchmark.source_notes}</p>
      )}
      <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-xs">
        <ExternalLink className="w-3 h-3 mr-1" />
        View underlying sources
      </Button>
    </div>
  );
}
