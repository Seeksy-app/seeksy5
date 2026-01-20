import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, ArrowLeft, Calendar, Download, FileSpreadsheet,
  Sparkles, Target, TrendingDown, Check, Loader2, Save, Share2, Lock, Shield, Sliders, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProFormaForecast, ScenarioKey, ForecastResult } from '@/hooks/useProFormaForecast';
import { useProFormaVersions, ProFormaVersion } from '@/hooks/useProFormaVersions';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { useCFOLockStatus } from '@/hooks/useCFOLockStatus';
import { CFOAssumptionsReadOnlyPanel } from '@/components/cfo/proforma/CFOAssumptionsReadOnlyPanel';
import { AdRevenueBreakdown } from '@/components/cfo/proforma/AdRevenueBreakdown';
import { ProFormaSummary } from '@/components/cfo/proforma/ProFormaSummary';
import { SaveVersionDialog } from '@/components/board/SaveVersionDialog';
import { VersionSelector } from '@/components/board/VersionSelector';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

const SCENARIO_STYLES = {
  conservative: {
    icon: TrendingDown,
    color: 'border-amber-500 bg-amber-50',
    iconColor: 'text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  base: {
    icon: Target,
    color: 'border-blue-500 bg-blue-50',
    iconColor: 'text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  aggressive: {
    icon: TrendingUp,
    color: 'border-emerald-500 bg-emerald-50',
    iconColor: 'text-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function CFOProForma() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(2025);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<ProFormaVersion | null>(null);
  
  const { rdCount, cfoOverrideCount, hasCFOAssumptions, dataSource, lastCFOUpdate, getEffectiveValue } = useCFOAssumptions();
  const { isLocked, lockedAt } = useCFOLockStatus();
  
  const {
    selectedScenario,
    setSelectedScenario,
    cfoOverrides,
    scenarios,
    benchmarks,
    storedForecasts,
    generatedForecast,
    isLoading,
    isGenerating,
    generateForecast,
    updateCfoOverride,
    clearCfoOverrides,
  } = useProFormaForecast();

  // Get key CFO baseline values for display
  const baselineValues = useMemo(() => ({
    revenueGrowth: getEffectiveValue('monthly_creator_growth_rate', 4),
    cpm: getEffectiveValue('audio_cpm_hostread', 22),
    fillRate: getEffectiveValue('audio_fill_rate', 65),
    churn: getEffectiveValue('creator_monthly_churn_rate', 5),
  }), [getEffectiveValue]);

  const {
    versions,
    saveVersion,
    deleteVersion,
    isSaving,
  } = useProFormaVersions();

  // Determine if we're in live mode (no historical version selected)
  const isLiveMode = viewingVersion === null;

  // Parse forecast data for display - prefer viewed version, then generated, then stored
  const forecastData = useMemo(() => {
    // If viewing a historical version
    if (viewingVersion?.forecast_payload?.years) {
      return viewingVersion.forecast_payload.years.map((y) => ({
        year: y.year,
        revenue: y.revenue,
        expenses: y.expenses,
        adBreakdown: y.revenue?.advertising,
        summary: {
          ebitda: y.ebitda,
          ebitdaMargin: y.ebitdaMargin,
          creatorCount: y.creatorCount,
          subscriberCount: y.subscriberCount,
          churnRate: y.churnRate,
          cac: y.cac,
          ltv: y.ltv,
        },
        commentary: viewingVersion.forecast_payload.commentary,
      }));
    }

    // If we have a freshly generated forecast, use it directly
    if (generatedForecast?.years) {
      return generatedForecast.years.map((y) => ({
        year: y.year,
        revenue: y.revenue,
        expenses: y.expenses,
        adBreakdown: y.revenue?.advertising,
        summary: {
          ebitda: y.ebitda,
          ebitdaMargin: y.ebitdaMargin,
          creatorCount: y.creatorCount,
          subscriberCount: y.subscriberCount,
          churnRate: y.churnRate,
          cac: y.cac,
          ltv: y.ltv,
        },
        commentary: generatedForecast.commentary,
      }));
    }
    
    // Fall back to stored forecasts from database
    if (!storedForecasts || storedForecasts.length === 0) {
      return null;
    }
    
    const yearlyData = storedForecasts.map((f: any) => ({
      year: f.forecast_year,
      revenue: f.revenue_data,
      expenses: f.expense_data,
      adBreakdown: f.ad_revenue_breakdown,
      summary: f.summary_metrics,
      commentary: f.ai_commentary,
    }));
    
    return yearlyData;
  }, [storedForecasts, generatedForecast, viewingVersion]);

  // Get current year data
  const currentYearData = useMemo(() => {
    if (!forecastData) return null;
    return forecastData.find((d: any) => d.year === selectedYear);
  }, [forecastData, selectedYear]);

  // Build ad channel data for breakdown component
  const adChannelData = useMemo(() => {
    if (!currentYearData?.adBreakdown) return [];
    const ad = currentYearData.adBreakdown;
    
    return [
      {
        channel: 'Audio Host-Read',
        impressions: ad.hostReadAudio?.impressions || 0,
        cpm: ad.hostReadAudio?.cpm || 0,
        fillRate: ad.hostReadAudio?.fillRate || 0,
        grossRevenue: ad.hostReadAudio?.revenue || 0,
        platformShare: ad.hostReadAudio?.platformShare || 0,
        creatorShare: (ad.hostReadAudio?.revenue || 0) - (ad.hostReadAudio?.platformShare || 0),
      },
      {
        channel: 'Audio Programmatic',
        impressions: ad.programmaticAudio?.impressions || 0,
        cpm: ad.programmaticAudio?.cpm || 0,
        fillRate: ad.programmaticAudio?.fillRate || 0,
        grossRevenue: ad.programmaticAudio?.revenue || 0,
        platformShare: ad.programmaticAudio?.platformShare || 0,
        creatorShare: (ad.programmaticAudio?.revenue || 0) - (ad.programmaticAudio?.platformShare || 0),
      },
      {
        channel: 'Video Pre/Mid-Roll',
        impressions: (ad.videoPreroll?.impressions || 0) + (ad.videoMidroll?.impressions || 0),
        cpm: ((ad.videoPreroll?.cpm || 0) + (ad.videoMidroll?.cpm || 0)) / 2,
        fillRate: ad.videoPreroll?.fillRate || ad.videoMidroll?.fillRate || 0,
        grossRevenue: (ad.videoPreroll?.revenue || 0) + (ad.videoMidroll?.revenue || 0),
        platformShare: (ad.videoPreroll?.platformShare || 0) + (ad.videoMidroll?.platformShare || 0),
        creatorShare: ((ad.videoPreroll?.revenue || 0) + (ad.videoMidroll?.revenue || 0)) - 
                      ((ad.videoPreroll?.platformShare || 0) + (ad.videoMidroll?.platformShare || 0)),
      },
      {
        channel: 'Newsletter/Email',
        impressions: ad.newsletter?.impressions || 0,
        cpm: ad.newsletter?.cpm || 0,
        fillRate: 0.8,
        grossRevenue: ad.newsletter?.revenue || 0,
        platformShare: ad.newsletter?.platformShare || 0,
        creatorShare: (ad.newsletter?.revenue || 0) - (ad.newsletter?.platformShare || 0),
      },
      {
        channel: 'Display',
        impressions: ad.display?.impressions || 0,
        cpm: ad.display?.cpm || 0,
        fillRate: 0.7,
        grossRevenue: ad.display?.revenue || 0,
        platformShare: ad.display?.platformShare || 0,
        creatorShare: (ad.display?.revenue || 0) - (ad.display?.platformShare || 0),
      },
      {
        channel: 'Brand Deals',
        impressions: ad.brandDeals?.deals || 0,
        cpm: ad.brandDeals?.avgValue || 0,
        fillRate: 1,
        grossRevenue: ad.brandDeals?.revenue || 0,
        platformShare: ad.brandDeals?.platformShare || 0,
        creatorShare: (ad.brandDeals?.revenue || 0) - (ad.brandDeals?.platformShare || 0),
      },
    ];
  }, [currentYearData]);

  // Summary metrics for ProFormaSummary
  const summaryMetrics = useMemo(() => {
    if (!currentYearData) return {
      totalRevenue: 0,
      subscriptionRevenue: 0,
      adRevenue: 0,
      eventsRevenue: 0,
      totalExpenses: 0,
      ebitda: 0,
      adRevenuePercent: 0,
      subscriptionRevenuePercent: 0,
      breakEvenMonth: null,
      grossMargin: 0,
    };

    const rev = currentYearData.revenue;
    const totalRev = rev?.totalRevenue || 0;
    const subRev = rev?.subscriptions?.total || 0;
    const adRev = rev?.advertising?.totalPlatformRevenue || 0;
    const eventsRev = rev?.events?.total || 0;
    
    return {
      totalRevenue: totalRev,
      subscriptionRevenue: subRev,
      adRevenue: adRev,
      eventsRevenue: eventsRev,
      totalExpenses: currentYearData.expenses?.total || 0,
      ebitda: currentYearData.summary?.ebitda || 0,
      adRevenuePercent: totalRev > 0 ? (adRev / totalRev) * 100 : 0,
      subscriptionRevenuePercent: totalRev > 0 ? (subRev / totalRev) * 100 : 0,
      breakEvenMonth: currentYearData.summary?.breakEvenMonth || null,
      grossMargin: currentYearData.summary?.ebitdaMargin || 0,
    };
  }, [currentYearData]);

  // Revenue trend chart data
  const revenueTrendData = useMemo(() => {
    if (!forecastData) return [];
    return forecastData.map((d: any) => ({
      year: d.year,
      subscriptions: d.revenue?.subscriptions?.total || 0,
      advertising: d.revenue?.advertising?.totalPlatformRevenue || 0,
      events: d.revenue?.events?.total || 0,
      total: d.revenue?.totalRevenue || 0,
      ebitda: d.summary?.ebitda || 0,
    }));
  }, [forecastData]);

  const handleGenerateForecast = () => {
    setViewingVersion(null); // Switch to live mode
    generateForecast({
      scenarioKey: selectedScenario,
      years: [2025, 2026, 2027],
      overrides: cfoOverrides,
    });
  };

  const handleSaveVersion = ({ label, summary }: { label: string; summary: string }) => {
    if (!generatedForecast) return;
    
    saveVersion({
      scenario_key: selectedScenario,
      label,
      summary,
      forecast: generatedForecast,
      assumptions: cfoOverrides,
    });
    setSaveDialogOpen(false);
  };

  const handleExportCSV = () => {
    if (!forecastData) return;
    
    const headers = ['Year', 'Subscriptions', 'Advertising', 'Events', 'Total Revenue', 'EBITDA'];
    const rows = forecastData.map((d: any) => [
      d.year,
      d.revenue?.subscriptions?.total || 0,
      d.revenue?.advertising?.totalPlatformRevenue || 0,
      d.revenue?.events?.total || 0,
      d.revenue?.totalRevenue || 0,
      d.summary?.ebitda || 0,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seeksy-proforma-${selectedScenario}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportAdBreakdown = () => {
    if (!adChannelData.length) return;
    
    const headers = ['Channel', 'Impressions', 'CPM', 'Fill Rate', 'Gross Revenue', 'Platform Share', 'Creator Share'];
    const rows = adChannelData.map(d => [
      d.channel,
      d.impressions,
      d.cpm.toFixed(2),
      (d.fillRate * 100).toFixed(0) + '%',
      d.grossRevenue.toFixed(2),
      d.platformShare.toFixed(2),
      d.creatorShare.toFixed(2),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seeksy-ad-breakdown-${selectedScenario}-${selectedYear}.csv`;
    a.click();
  };

  const currentScenarioConfig = scenarios?.find((s: any) => s.scenario_key === selectedScenario);

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Back Button - Goes to CFO Assumption Studio */}
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate('/cfo/assumptions')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to CFO Assumption Studio
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI-Powered 3-Year Pro Forma</h1>
              <p className="text-muted-foreground">
                {hasCFOAssumptions 
                  ? `Previewing with ${cfoOverrideCount} CFO assumption${cfoOverrideCount !== 1 ? 's' : ''} and ${rdCount} R&D benchmarks.`
                  : 'No CFO assumptions saved yet — using R&D benchmark defaults.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* CFO Model Badge */}
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              CFO Preview Mode
            </Badge>
            {hasCFOAssumptions && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                {cfoOverrideCount} CFO Overrides
              </Badge>
            )}
            <VersionSelector
              versions={versions}
              selectedVersion={viewingVersion}
              onSelectVersion={setViewingVersion}
              onDeleteVersion={deleteVersion}
              isLiveMode={isLiveMode}
            />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {lastCFOUpdate 
                  ? `Updated: ${new Date(lastCFOUpdate).toLocaleDateString()}`
                  : `Updated: ${new Date().toLocaleDateString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* CFO Preview Info Notice */}
        <Alert className="border-indigo-200 bg-indigo-50">
          <Info className="w-4 h-4 text-indigo-600" />
          <AlertDescription className="text-indigo-800">
            <strong>CFO Preview Mode</strong> — Base scenario uses your CFO assumptions exactly, with no additional multipliers. 
            Aggressive and Conservative apply percentage adjustments on top of the CFO baseline (e.g., +30% revenue or −25% churn).
          </AlertDescription>
        </Alert>

        {/* Historical Version Banner */}
        {!isLiveMode && viewingVersion && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800 flex items-center justify-between">
              <span>
                <strong>Viewing Saved Version:</strong> {viewingVersion.label}
                {viewingVersion.summary && ` — ${viewingVersion.summary}`}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setViewingVersion(null)}
              >
                Return to Live Mode
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Scenario Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios?.map((scenario: any) => {
            const key = scenario.scenario_key as ScenarioKey;
            const style = SCENARIO_STYLES[key] || SCENARIO_STYLES.base;
            const Icon = style.icon;
            const isSelected = selectedScenario === key;
            
            return (
              <Card
                key={scenario.scenario_key}
                className={cn(
                  'cursor-pointer transition-all duration-200 border-2',
                  isSelected ? style.color : 'border-transparent hover:border-muted-foreground/20',
                  isLoading && 'opacity-50 pointer-events-none'
                )}
                onClick={() => setSelectedScenario(key)}
              >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-5 w-5', style.iconColor)} />
                    <span className="font-semibold">
                      {key === 'base' ? 'Base (CFO Baseline)' : scenario.label}
                    </span>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </div>
                
                {/* Baseline badge for Base scenario */}
                {key === 'base' && (
                  <p className="text-xs text-muted-foreground mb-3" title="Base uses your CFO assumptions exactly, with no additional multipliers.">
                    Pure CFO assumptions — no multipliers applied
                  </p>
                )}
                
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue Growth:</span>
                      <Badge variant="outline" className={cn('text-xs', style.badgeColor)}>
                        {key === 'base' 
                          ? `${baselineValues.revenueGrowth}%/mo` 
                          : `${((scenario.revenue_growth_multiplier - 1) * 100) >= 0 ? '+' : ''}${((scenario.revenue_growth_multiplier - 1) * 100).toFixed(0)}%`}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPM:</span>
                      <Badge variant="outline" className={cn('text-xs', style.badgeColor)}>
                        {key === 'base' 
                          ? `$${baselineValues.cpm}` 
                          : `${((scenario.cpm_multiplier - 1) * 100) >= 0 ? '+' : ''}${((scenario.cpm_multiplier - 1) * 100).toFixed(0)}%`}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fill Rate:</span>
                      <Badge variant="outline" className={cn('text-xs', style.badgeColor)}>
                        {key === 'base' 
                          ? `${baselineValues.fillRate}%` 
                          : `${((scenario.fill_rate_multiplier - 1) * 100) >= 0 ? '+' : ''}${((scenario.fill_rate_multiplier - 1) * 100).toFixed(0)}%`}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Churn:</span>
                      <Badge variant="outline" className={cn('text-xs', style.badgeColor)}>
                        {key === 'base' 
                          ? `${baselineValues.churn}%/mo` 
                          : `${((scenario.churn_multiplier - 1) * 100) >= 0 ? '+' : ''}${((scenario.churn_multiplier - 1) * 100).toFixed(0)}%`}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Generate Button */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleGenerateForecast} 
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate {currentScenarioConfig?.label || 'Base'} Forecast
              </>
            )}
          </Button>
          
          {generatedForecast && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setSaveDialogOpen(true)}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save Version
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </>
          )}
        </div>

        {/* Main Content Tabs */}
        {forecastData && (
          <Tabs defaultValue="summary" className="space-y-6">
            <TabsList className="bg-muted border border-border p-1">
              <TabsTrigger value="summary" className="data-[state=active]:bg-background">
                Summary & AI Analysis
              </TabsTrigger>
              <TabsTrigger value="ads" className="data-[state=active]:bg-background">
                Ad Revenue Breakdown
              </TabsTrigger>
              <TabsTrigger value="trends" className="data-[state=active]:bg-background">
                3-Year Trends
              </TabsTrigger>
              <TabsTrigger value="assumptions" className="data-[state=active]:bg-background">
                CFO Assumptions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              {/* Year Selector */}
              <div className="flex gap-2">
                {[2025, 2026, 2027].map((year) => (
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

              <ProFormaSummary
                metrics={summaryMetrics}
                scenario={currentScenarioConfig?.label || 'Base'}
                aiCommentary={currentYearData?.commentary}
                isGenerating={isGenerating}
                year={selectedYear}
              />
            </TabsContent>

            <TabsContent value="ads" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Advertising Revenue by Channel — {selectedYear}</h3>
                <Button variant="outline" size="sm" onClick={handleExportAdBreakdown} className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Breakdown
                </Button>
              </div>
              <AdRevenueBreakdown 
                data={adChannelData} 
                scenario={currentScenarioConfig?.label || 'Base'} 
                year={selectedYear} 
              />
            </TabsContent>

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
                      <Bar dataKey="subscriptions" name="Subscriptions" fill="hsl(var(--primary))" />
                      <Bar dataKey="advertising" name="Advertising" fill="hsl(220, 70%, 50%)" />
                      <Bar dataKey="events" name="Events" fill="hsl(150, 60%, 50%)" />
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
            </TabsContent>

            <TabsContent value="assumptions">
              <CFOAssumptionsReadOnlyPanel />
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!forecastData && !isGenerating && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Forecast Generated Yet</h3>
              <p className="text-muted-foreground mb-4">
                Select a scenario above and click "Generate Forecast" to see your 3-year projections.
              </p>
              <Button onClick={handleGenerateForecast} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Forecast
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold mb-2">Generating AI Forecast...</h3>
              <p className="text-muted-foreground">
                Analyzing CFO assumptions and calculating projections for 2025–2027
              </p>
            </CardContent>
          </Card>
        )}

        {/* Save Version Dialog */}
        <SaveVersionDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          onSave={handleSaveVersion}
          scenarioLabel={currentScenarioConfig?.label || 'Base'}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
