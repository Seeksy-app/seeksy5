import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, ArrowLeft, Calendar, Download, FileSpreadsheet,
  Sparkles, Target, TrendingDown, Check, Loader2, Save, Share2, Lock, Shield
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProFormaForecast, ScenarioKey, ForecastResult } from '@/hooks/useProFormaForecast';
import { useProFormaVersions, ProFormaVersion } from '@/hooks/useProFormaVersions';
import { useCFOProFormaVersions, CFOProFormaVersion } from '@/hooks/useCFOProFormaVersions';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { useCFOLockStatus } from '@/hooks/useCFOLockStatus';
import { CFOAssumptionsReadOnlyPanel } from '@/components/cfo/proforma/CFOAssumptionsReadOnlyPanel';
import { AdRevenueBreakdown } from '@/components/cfo/proforma/AdRevenueBreakdown';
import { ProFormaSummary } from '@/components/cfo/proforma/ProFormaSummary';
import { SaveVersionDialog } from '@/components/board/SaveVersionDialog';
import { VersionSelector } from '@/components/board/VersionSelector';
import { CFOVersionSelector } from '@/components/cfo/CFOVersionSelector';
import { ShareWithInvestorsDialog } from '@/components/board/ShareWithInvestorsDialog';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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

export default function BoardProFormaAI() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedYear, setSelectedYear] = useState(2025);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<ProFormaVersion | null>(null);
  const [viewingCFOVersion, setViewingCFOVersion] = useState<CFOProFormaVersion | null>(null);
  
  const { rdCount, cfoOverrideCount, hasCFOAssumptions, dataSource, lastCFOUpdate } = useCFOAssumptions();
  const { isLocked, lockedAt } = useCFOLockStatus();
  
  // CFO Pro Forma Versions (the new system)
  const { 
    versions: cfoVersions, 
    latestVersion: latestCFOVersion,
    isLoading: cfoVersionsLoading 
  } = useCFOProFormaVersions();
  
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

  const {
    versions,
    saveVersion,
    deleteVersion,
    isSaving,
  } = useProFormaVersions();

  // Handle navigation state for viewing a specific version
  useEffect(() => {
    if (location.state?.viewVersion) {
      setViewingCFOVersion(location.state.viewVersion);
      // Clear state to avoid re-setting on future navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Determine if we're in live mode (no historical version selected)
  const isLiveMode = viewingVersion === null && viewingCFOVersion === null;

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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">AI-Powered 3-Year Pro Forma</h1>
            <p className="text-slate-500">
              {hasCFOAssumptions 
                ? `CFO-controlled model with ${cfoOverrideCount} assumption${cfoOverrideCount !== 1 ? 's' : ''}. Base scenario = pure CFO values.`
                : 'No CFO assumptions yet — using R&D benchmark defaults.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Data Source Status Badge - only show CFO badge when assumptions exist */}
          {hasCFOAssumptions && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              CFO-Controlled Model
            </Badge>
          )}
          {isLocked && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Locked by CFO
            </Badge>
          )}
          
          {/* CFO Version Selector */}
          <CFOVersionSelector
            versions={cfoVersions}
            selectedVersion={viewingCFOVersion}
            latestVersion={latestCFOVersion}
            onSelectVersion={(version) => {
              setViewingCFOVersion(version);
              setViewingVersion(null); // Clear old version selector
            }}
            isLiveMode={isLiveMode}
          />
          
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {latestCFOVersion 
                ? `Latest: ${formatDistanceToNow(new Date(latestCFOVersion.created_at), { addSuffix: true })}`
                : lastCFOUpdate 
                  ? `Updated: ${new Date(lastCFOUpdate).toLocaleDateString()}`
                  : `Updated: ${new Date().toLocaleDateString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* CFO Version Banner - when viewing a saved CFO version */}
      {viewingCFOVersion && (
        <Alert className="border-indigo-200 bg-indigo-50">
          <AlertDescription className="text-indigo-800 flex items-center justify-between">
            <div>
              <strong>Forecast Version:</strong> {viewingCFOVersion.name}
              <span className="text-indigo-600 ml-2">
                (saved {formatDistanceToNow(new Date(viewingCFOVersion.created_at), { addSuffix: true })})
              </span>
              {viewingCFOVersion.notes && (
                <span className="ml-2 text-indigo-600 italic">— {viewingCFOVersion.notes}</span>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewingCFOVersion(null)}
            >
              Return to Live Mode
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Historical Version Banner (legacy) */}
      {!isLiveMode && viewingVersion && !viewingCFOVersion && (
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

      {/* CFO-Controlled Status Notice - only show if CFO assumptions exist and NOT viewing a version */}
      {hasCFOAssumptions && isLiveMode && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <Shield className="w-4 h-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            <strong>CFO-Controlled Financial Model</strong> — Base scenario uses pure CFO assumptions. 
            Conservative and Aggressive scenarios apply percentage multipliers on top of Base.
            {isLocked && lockedAt && (
              <span className="ml-2 text-emerald-600">
                Locked on {new Date(lockedAt).toLocaleDateString()}
              </span>
            )}
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
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-5 w-5', style.iconColor)} />
                    <span className="font-semibold">
                      {key === 'base' && hasCFOAssumptions ? 'Base (CFO Baseline)' : scenario.label}
                    </span>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue:</span>
                    <Badge variant="outline" className={cn('text-xs', style.badgeColor)}>
                      {((scenario.revenue_growth_multiplier - 1) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPM:</span>
                    <Badge variant="outline" className={cn('text-xs', style.badgeColor)}>
                      {((scenario.cpm_multiplier - 1) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fill Rate:</span>
                    <Badge variant="outline" className={cn('text-xs', style.badgeColor)}>
                      {((scenario.fill_rate_multiplier - 1) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impressions:</span>
                    <Badge variant="outline" className={cn('text-xs', style.badgeColor)}>
                      {((scenario.impressions_multiplier - 1) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Button 
          onClick={handleGenerateForecast} 
          disabled={isGenerating || !scenarios || !isLiveMode}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating {selectedScenario === 'base' && hasCFOAssumptions ? 'CFO Baseline' : currentScenarioConfig?.label} Forecast...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate {selectedScenario === 'base' && hasCFOAssumptions ? 'CFO Baseline' : (currentScenarioConfig?.label || 'Base')} Forecast
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSaveDialogOpen(true)} 
          disabled={!generatedForecast || !isLiveMode}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Version
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!forecastData}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleExportAdBreakdown} disabled={!adChannelData.length}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Ad Breakdown
        </Button>
        
        <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
          <Share2 className="w-4 h-4 mr-2" />
          Share with Investors
        </Button>
      </div>

      {/* Year Selector with Scenario Label */}
      {forecastData && (
        <div className="flex items-center justify-center gap-2">
          {[2025, 2026, 2027].map((year) => {
            const scenarioLabel = viewingVersion?.scenario_key || selectedScenario;
            const displayLabel = scenarioLabel === 'base' && hasCFOAssumptions 
              ? 'CFO Baseline' 
              : (currentScenarioConfig?.label || 'Base');
            
            return (
              <Button
                key={year}
                variant={selectedYear === year ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedYear(year)}
                className="gap-2"
              >
                {year}
                {selectedYear === year && (
                  <Badge variant="secondary" className="text-xs">
                    {displayLabel}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="bg-slate-100 border border-slate-200">
          <TabsTrigger value="summary" className="data-[state=active]:bg-white">
            Summary & AI Analysis
          </TabsTrigger>
          <TabsTrigger value="advertising" className="data-[state=active]:bg-white">
            Advertising Breakdown
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-white">
            3-Year Trends
          </TabsTrigger>
          <TabsTrigger value="assumptions" className="data-[state=active]:bg-white">
            CFO Assumptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {forecastData ? (
            <ProFormaSummary
              metrics={summaryMetrics}
              scenario={
                (viewingVersion?.scenario_key || selectedScenario) === 'base' && hasCFOAssumptions
                  ? 'Base (CFO Baseline)'
                  : (viewingVersion?.scenario_key || currentScenarioConfig?.label || 'Base')
              }
              aiCommentary={currentYearData?.commentary || null}
              isGenerating={isGenerating}
              year={selectedYear}
            />
          ) : (
            <Card className="p-8 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Forecast Generated</h3>
              <p className="text-muted-foreground mb-4">
                Select a scenario and click "Generate Forecast" to create AI-powered projections.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="advertising">
          {adChannelData.length > 0 ? (
            <AdRevenueBreakdown
              data={adChannelData}
              scenario={viewingVersion?.scenario_key || currentScenarioConfig?.label || 'Base'}
              year={selectedYear}
              isLoading={isGenerating}
            />
          ) : (
            <Card className="p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Ad Data Available</h3>
              <p className="text-muted-foreground">
                Generate a forecast to see the advertising revenue breakdown.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends">
          {revenueTrendData.length > 0 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Revenue by Source (3-Year)
                  </CardTitle>
                  <CardDescription>
                    Stacked view of subscription, advertising, and events revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueTrendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Legend />
                        <Bar dataKey="subscriptions" name="Subscriptions" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="advertising" name="Advertising" stackId="a" fill="#10b981" />
                        <Bar dataKey="events" name="Events" stackId="a" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs EBITDA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Legend />
                        <Line type="monotone" dataKey="total" name="Total Revenue" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Yearly Summary Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Year-by-Year Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Metric</th>
                          {revenueTrendData.map((d: any) => (
                            <th key={d.year} className="text-right p-2">
                              {d.year}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {viewingVersion?.scenario_key || currentScenarioConfig?.label || 'Base'}
                              </Badge>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Total Revenue</td>
                          {revenueTrendData.map((d: any) => (
                            <td key={d.year} className="text-right p-2">{formatCurrency(d.total)}</td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Subscriptions</td>
                          {revenueTrendData.map((d: any) => (
                            <td key={d.year} className="text-right p-2">{formatCurrency(d.subscriptions)}</td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Advertising</td>
                          {revenueTrendData.map((d: any) => (
                            <td key={d.year} className="text-right p-2">{formatCurrency(d.advertising)}</td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-medium">Events</td>
                          {revenueTrendData.map((d: any) => (
                            <td key={d.year} className="text-right p-2">{formatCurrency(d.events)}</td>
                          ))}
                        </tr>
                        <tr className="bg-muted/30">
                          <td className="p-2 font-semibold">EBITDA</td>
                          {revenueTrendData.map((d: any) => (
                            <td key={d.year} className={cn(
                              "text-right p-2 font-semibold",
                              d.ebitda >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {formatCurrency(d.ebitda)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trend Data</h3>
              <p className="text-muted-foreground">
                Generate a forecast to see 3-year trends.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assumptions">
          <CFOAssumptionsReadOnlyPanel />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SaveVersionDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveVersion}
        scenarioLabel={currentScenarioConfig?.label || 'Base'}
        isSaving={isSaving}
      />
      
      <ShareWithInvestorsDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </div>
  );
}
