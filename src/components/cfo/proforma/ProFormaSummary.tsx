import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, TrendingUp, DollarSign, PieChart, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryMetrics {
  totalRevenue: number;
  subscriptionRevenue: number;
  adRevenue: number;
  eventsRevenue: number;
  totalExpenses: number;
  ebitda: number;
  adRevenuePercent: number;
  subscriptionRevenuePercent: number;
  breakEvenMonth: number | null;
  grossMargin: number;
}

interface ProFormaSummaryProps {
  metrics: SummaryMetrics;
  scenario: string;
  aiCommentary: string | null;
  isGenerating?: boolean;
  year: number;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export function ProFormaSummary({ 
  metrics, 
  scenario, 
  aiCommentary, 
  isGenerating,
  year 
}: ProFormaSummaryProps) {
  const isPositiveEbitda = metrics.ebitda > 0;

  return (
    <div className="space-y-4">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              Total Revenue
            </div>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(metrics.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Year {year}</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-l-4",
          isPositiveEbitda ? "border-l-emerald-500" : "border-l-red-500"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              EBITDA
            </div>
            <p className={cn(
              "text-xl font-bold",
              isPositiveEbitda ? "text-emerald-600" : "text-red-600"
            )}>
              {formatCurrency(metrics.ebitda)}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.grossMargin.toFixed(0)}% margin
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <PieChart className="h-3 w-3" />
              Revenue Mix
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Ads</span>
                <span className="font-semibold">{metrics.adRevenuePercent.toFixed(0)}%</span>
              </div>
              <Progress value={metrics.adRevenuePercent} className="h-1" />
              <div className="flex justify-between text-xs">
                <span>Subs</span>
                <span className="font-semibold">{metrics.subscriptionRevenuePercent.toFixed(0)}%</span>
              </div>
              <Progress value={metrics.subscriptionRevenuePercent} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              Break-Even
            </div>
            <p className="text-xl font-bold text-amber-600">
              {metrics.breakEvenMonth ? `Month ${metrics.breakEvenMonth}` : 'TBD'}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.breakEvenMonth ? `~${Math.ceil(metrics.breakEvenMonth / 12)} year(s)` : 'Not yet projected'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Revenue Breakdown</h4>
            <Badge variant="outline">{scenario}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(metrics.subscriptionRevenue)}</p>
              <p className="text-xs text-muted-foreground">Subscriptions</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(metrics.adRevenue)}</p>
              <p className="text-xs text-muted-foreground">Advertising</p>
            </div>
            <div>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(metrics.eventsRevenue)}</p>
              <p className="text-xs text-muted-foreground">Events & Awards</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Commentary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            AI Analysis
            <Badge variant="secondary" className="text-xs">GPT-Powered</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              Generating analysis...
            </div>
          ) : aiCommentary ? (
            <p className="text-sm text-slate-700 leading-relaxed">{aiCommentary}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              AI commentary will appear here after generating forecasts.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          <strong>Demo / R&D Data:</strong> These projections are powered by industry benchmarks and AI modeling. 
          They represent estimates based on R&D research and do not reflect actual platform performance.
        </p>
      </div>
    </div>
  );
}
