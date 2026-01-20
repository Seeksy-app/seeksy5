import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, Calendar, Download, FileSpreadsheet,
  Sparkles, Info, Sliders, BarChart3, PieChart, Users,
  TrendingUp, DollarSign, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useCFOMasterModel, ScenarioType } from '@/hooks/useCFOMasterModel';
import { ProFormaScenarioCard } from '@/components/cfo/proforma/ProFormaScenarioCard';
import { ProFormaDetailTabs } from '@/components/cfo/proforma/ProFormaDetailTabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart as RechartsPie, Pie, Cell,
} from 'recharts';

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const SCENARIO_LABELS: Record<ScenarioType, string> = {
  base: 'Base (CFO Baseline)',
  conservative: 'Growth (Conservative)',
  aggressive: 'Aggressive (Upside)',
};

const COLORS = {
  subscriptions: 'hsl(var(--primary))',
  aiTools: 'hsl(220, 70%, 60%)',
  advertising: 'hsl(150, 60%, 50%)',
  enterprise: 'hsl(280, 60%, 60%)',
};

export default function CFOProFormaV2() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(2025);
  
  const {
    assumptions,
    revenue,
    cogs,
    opex,
    headcount,
    selectedScenario,
    setSelectedScenario,
    currentScenarioData,
    baseMetrics,
    allScenarios,
    years,
  } = useCFOMasterModel();

  const { metrics } = currentScenarioData;

  // Build chart data
  const revenueTrendData = useMemo(() => {
    return years.map((year, i) => ({
      year,
      subscriptions: currentScenarioData.revenue.saasSubscriptions[i],
      aiTools: currentScenarioData.revenue.aiProductionTools[i],
      advertising: currentScenarioData.revenue.advertisingMarketplace[i],
      enterprise: currentScenarioData.revenue.enterpriseLicensing[i],
      total: metrics.totalRevenue[i],
      ebitda: metrics.ebitda[i],
    }));
  }, [currentScenarioData, metrics, years]);

  // Revenue mix for selected year
  const yearIndex = years.indexOf(selectedYear);
  const revenueMix = useMemo(() => {
    const total = metrics.totalRevenue[yearIndex];
    if (total === 0) return [];
    return [
      { name: 'Subscriptions', value: currentScenarioData.revenue.saasSubscriptions[yearIndex], color: COLORS.subscriptions },
      { name: 'AI Tools', value: currentScenarioData.revenue.aiProductionTools[yearIndex], color: COLORS.aiTools },
      { name: 'Advertising', value: currentScenarioData.revenue.advertisingMarketplace[yearIndex], color: COLORS.advertising },
      { name: 'Enterprise', value: currentScenarioData.revenue.enterpriseLicensing[yearIndex], color: COLORS.enterprise },
    ].filter(d => d.value > 0);
  }, [currentScenarioData, metrics, yearIndex]);

  // Summary metrics for the selected year
  const summaryMetrics = useMemo(() => {
    const total = metrics.totalRevenue[yearIndex];
    const subRev = currentScenarioData.revenue.saasSubscriptions[yearIndex];
    const adRev = currentScenarioData.revenue.advertisingMarketplace[yearIndex];
    
    return {
      totalRevenue: total,
      ebitda: metrics.ebitda[yearIndex],
      grossMargin: metrics.grossMargin[yearIndex],
      subscriptionPercent: total > 0 ? (subRev / total) * 100 : 0,
      adPercent: total > 0 ? (adRev / total) * 100 : 0,
      breakEvenMonth: metrics.breakEvenMonth,
      ltvCacRatio: metrics.ltvCacRatio,
      runway: metrics.runway,
    };
  }, [currentScenarioData, metrics, yearIndex]);

  const handleExportCSV = () => {
    const headers = ['Year', 'Subscriptions', 'AI Tools', 'Advertising', 'Enterprise', 'Total Revenue', 'EBITDA'];
    const rows = years.map((year, i) => [
      year,
      currentScenarioData.revenue.saasSubscriptions[i],
      currentScenarioData.revenue.aiProductionTools[i],
      currentScenarioData.revenue.advertisingMarketplace[i],
      currentScenarioData.revenue.enterpriseLicensing[i],
      metrics.totalRevenue[i],
      metrics.ebitda[i],
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seeksy-proforma-${selectedScenario}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate('/cfo/studio-v2')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to CFO Studio
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI-Powered 3-Year Pro Forma</h1>
              <p className="text-muted-foreground">
                Unified financial model powered by CFO Studio assumptions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              CFO Master Model
            </Badge>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{new Date().toLocaleDateString()}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30">
          <Info className="w-4 h-4 text-indigo-600" />
          <AlertDescription className="text-indigo-800 dark:text-indigo-200">
            <strong>CFO Master Model</strong> — Base scenario uses your CFO assumptions exactly. 
            Aggressive and Conservative apply percentage multipliers (e.g., +30% revenue or −25% churn) on top of the baseline.
          </AlertDescription>
        </Alert>

        {/* Scenario Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['base', 'conservative', 'aggressive'] as ScenarioType[]).map((scenario) => (
            <ProFormaScenarioCard
              key={scenario}
              scenario={scenario}
              isSelected={selectedScenario === scenario}
              onSelect={() => setSelectedScenario(scenario)}
              baselineValues={scenario === 'base' ? {
                revenueGrowth: assumptions.monthlyCreatorGrowth,
                cpm: assumptions.advertisingCPM,
                fillRate: assumptions.adFillRate,
                churn: assumptions.churnRate,
              } : undefined}
            />
          ))}
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                Total Revenue ({selectedYear})
              </div>
              <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                EBITDA ({selectedYear})
              </div>
              <div className={cn("text-2xl font-bold", summaryMetrics.ebitda >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {formatCurrency(summaryMetrics.ebitda)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <PieChart className="w-3.5 h-3.5" />
                Gross Margin
              </div>
              <div className="text-2xl font-bold">{summaryMetrics.grossMargin.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Users className="w-3.5 h-3.5" />
                LTV:CAC Ratio
              </div>
              <div className="text-2xl font-bold">{summaryMetrics.ltvCacRatio.toFixed(1)}x</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Target className="w-3.5 h-3.5" />
                Break-Even
              </div>
              <div className="text-2xl font-bold">
                {summaryMetrics.breakEvenMonth ? `Month ${summaryMetrics.breakEvenMonth}` : 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BarChart3 className="w-3.5 h-3.5" />
                Runway
              </div>
              <div className="text-2xl font-bold">{summaryMetrics.runway.toFixed(0)} mo</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="bg-muted border border-border p-1">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="trends">3-Year Trends</TabsTrigger>
            <TabsTrigger value="details">Financial Details</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            {/* Year Selector */}
            <div className="flex gap-2">
              {years.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Mix Pie */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Mix — {selectedYear}</CardTitle>
                  <CardDescription>Breakdown by revenue stream</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={revenueMix}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {revenueMix.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Key Metrics Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics — {selectedYear}</CardTitle>
                  <CardDescription>{SCENARIO_LABELS[selectedScenario]} scenario</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                      <div className="text-xl font-bold">{formatCurrency(summaryMetrics.totalRevenue)}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">EBITDA</div>
                      <div className={cn("text-xl font-bold", summaryMetrics.ebitda >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {formatCurrency(summaryMetrics.ebitda)}
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Subscription Revenue</div>
                      <div className="text-xl font-bold">{summaryMetrics.subscriptionPercent.toFixed(0)}%</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Ad Revenue</div>
                      <div className="text-xl font-bold">{summaryMetrics.adPercent.toFixed(0)}%</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Blended CAC</span>
                      <span className="font-medium">${metrics.cac.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Customer LTV</span>
                      <span className="font-medium">${metrics.ltv.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">LTV:CAC Ratio</span>
                      <span className={cn("font-medium", metrics.ltvCacRatio >= 3 ? 'text-emerald-600' : 'text-amber-600')}>
                        {metrics.ltvCacRatio.toFixed(1)}x
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cash Runway</span>
                      <span className="font-medium">{metrics.runway.toFixed(0)} months</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth (2025–2027)</CardTitle>
                <CardDescription>Projected revenue by stream across the forecast period</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="subscriptions" name="Subscriptions" stackId="a" fill={COLORS.subscriptions} />
                    <Bar dataKey="aiTools" name="AI Tools" stackId="a" fill={COLORS.aiTools} />
                    <Bar dataKey="advertising" name="Advertising" stackId="a" fill={COLORS.advertising} />
                    <Bar dataKey="enterprise" name="Enterprise" stackId="a" fill={COLORS.enterprise} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>EBITDA Trajectory</CardTitle>
                <CardDescription>Profitability growth across forecast years</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Line 
                      type="monotone" 
                      dataKey="ebitda" 
                      name="EBITDA" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Scenario Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Scenario Comparison — Year 3</CardTitle>
                <CardDescription>Compare outcomes across all scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Metric</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Conservative</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Base</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Aggressive</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-2">Total Revenue</td>
                      <td className="py-2 text-right">{formatCurrency(allScenarios.conservative.metrics.totalRevenue[2])}</td>
                      <td className="py-2 text-right font-semibold">{formatCurrency(allScenarios.base.metrics.totalRevenue[2])}</td>
                      <td className="py-2 text-right">{formatCurrency(allScenarios.aggressive.metrics.totalRevenue[2])}</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-2">EBITDA</td>
                      <td className={cn("py-2 text-right", allScenarios.conservative.metrics.ebitda[2] >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {formatCurrency(allScenarios.conservative.metrics.ebitda[2])}
                      </td>
                      <td className={cn("py-2 text-right font-semibold", allScenarios.base.metrics.ebitda[2] >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {formatCurrency(allScenarios.base.metrics.ebitda[2])}
                      </td>
                      <td className={cn("py-2 text-right", allScenarios.aggressive.metrics.ebitda[2] >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {formatCurrency(allScenarios.aggressive.metrics.ebitda[2])}
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-2">Gross Margin</td>
                      <td className="py-2 text-right">{allScenarios.conservative.metrics.grossMargin[2].toFixed(1)}%</td>
                      <td className="py-2 text-right font-semibold">{allScenarios.base.metrics.grossMargin[2].toFixed(1)}%</td>
                      <td className="py-2 text-right">{allScenarios.aggressive.metrics.grossMargin[2].toFixed(1)}%</td>
                    </tr>
                    <tr className="hover:bg-muted/30">
                      <td className="py-2">LTV:CAC Ratio</td>
                      <td className="py-2 text-right">{allScenarios.conservative.metrics.ltvCacRatio.toFixed(1)}x</td>
                      <td className="py-2 text-right font-semibold">{allScenarios.base.metrics.ltvCacRatio.toFixed(1)}x</td>
                      <td className="py-2 text-right">{allScenarios.aggressive.metrics.ltvCacRatio.toFixed(1)}x</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab - Financial Statements, Revenue, OpEx, Headcount, Assumptions */}
          <TabsContent value="details">
            <ProFormaDetailTabs
              revenue={currentScenarioData.revenue}
              cogs={currentScenarioData.cogs}
              opex={currentScenarioData.opex}
              headcount={headcount}
              assumptions={assumptions}
              metrics={metrics}
              years={years}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
