import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Brain,
  HelpCircle,
  Target,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { useFinancialCalculationEngine } from '@/hooks/useFinancialCalculationEngine';
import { useCFOMasterModel } from '@/hooks/useCFOMasterModel';
import { cn } from '@/lib/utils';

// KPI Scorecard Types
type HealthStatus = 'green' | 'yellow' | 'red';

interface KPIScore {
  name: string;
  value: string;
  status: HealthStatus;
  trend?: 'up' | 'down' | 'stable';
  insight?: string;
}

interface BoardQuestion {
  question: string;
  context: string;
  urgency: 'high' | 'medium' | 'low';
}

interface BoardCTA {
  action: string;
  rationale: string;
  priority: 'critical' | 'important' | 'recommended';
}

interface TrendItem {
  trend: string;
  direction: 'positive' | 'negative' | 'neutral';
  magnitude: string;
}

// Format currency helper
const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export default function BoardStateOfCompany() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiOverview, setAiOverview] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { projections, drivers } = useFinancialCalculationEngine();
  const { assumptions, currentScenarioData, selectedScenario } = useCFOMasterModel();
  const { metrics } = currentScenarioData;
  
  // Generate AI Overview based on real data
  const generateAIOverview = useMemo(() => {
    const y1Rev = projections.yearlyRevenue[0];
    const y3Rev = projections.yearlyRevenue[2];
    const revenueGrowth = y1Rev > 0 ? ((y3Rev - y1Rev) / y1Rev) * 100 : 0;
    
    const y1Ebitda = projections.yearlyEbitda[0];
    const y3Ebitda = projections.yearlyEbitda[2];
    const ebitdaTrend = y3Ebitda > y1Ebitda ? 'improving' : 'declining';
    
    const grossMarginAvg = projections.yearlyGrossMargin.reduce((a, b) => a + b, 0) / 3;
    const marginHealth = grossMarginAvg >= 70 ? 'healthy' : grossMarginAvg >= 50 ? 'moderate' : 'concerning';
    
    const runwayStatus = projections.runwayMonths >= 18 ? 'comfortable' : projections.runwayMonths >= 12 ? 'adequate' : 'limited';
    const breakEvenText = projections.breakEvenMonth 
      ? `Month ${projections.breakEvenMonth} (${projections.breakEvenMonth <= 18 ? 'on track' : 'extended timeline'})`
      : 'Not yet projected within 36 months';
    
    return `
## Company Health Overview

**Revenue Trajectory**: Seeksy is projecting **${formatCurrency(y3Rev)}** in Year 3 revenue, representing **${revenueGrowth.toFixed(0)}%** growth from Year 1. This growth is driven primarily by subscription revenue and expanding advertising marketplace monetization.

**Profitability Path**: EBITDA is ${ebitdaTrend} across the forecast period, moving from **${formatCurrency(y1Ebitda)}** in Year 1 to **${formatCurrency(y3Ebitda)}** by Year 3. ${y3Ebitda > 0 ? 'The business is on track for operational profitability.' : 'Additional focus on cost structure or revenue acceleration is needed.'}

**Unit Economics**: LTV:CAC ratio of **${projections.ltvCacRatio.toFixed(1)}x** ${projections.ltvCacRatio >= 3 ? 'exceeds the 3× target, indicating efficient customer acquisition.' : 'is below the 3× target, suggesting opportunities to improve acquisition efficiency or reduce churn.'}

**Gross Margin**: At **${grossMarginAvg.toFixed(1)}%**, gross margins are ${marginHealth}. ${marginHealth === 'healthy' ? 'This positions the company well for scaling.' : 'Focus on reducing COGS (hosting, AI inference) could improve margins.'}

**Cash Position**: With **${projections.runwayMonths.toFixed(0)} months** of runway, the cash position is ${runwayStatus}. Break-even is projected at ${breakEvenText}.

**Key Improvements**:
- Creator growth rate of **${assumptions.monthlyCreatorGrowth}%** monthly is ${assumptions.monthlyCreatorGrowth >= 8 ? 'strong' : 'requires acceleration'}
- Identity verification adoption at **${drivers.identityVerificationAdoption}%** ${drivers.identityVerificationAdoption >= 30 ? 'shows good traction' : 'has room for growth'}
- Advertising fill rate of **${assumptions.adFillRate}%** ${assumptions.adFillRate >= 60 ? 'is healthy' : 'needs improvement'}

**Emerging Risks**:
${assumptions.churnRate >= 6 ? '- Elevated churn rate may impact LTV projections\n' : ''}${projections.runwayMonths < 12 ? '- Limited runway requires near-term capital planning\n' : ''}${grossMarginAvg < 60 ? '- Gross margin compression warrants COGS review\n' : ''}${projections.ltvCacRatio < 3 ? '- CAC efficiency needs improvement\n' : ''}${!assumptions.churnRate && '- No significant risks identified at current trajectory'}
    `.trim();
  }, [projections, assumptions, drivers]);
  
  // Generate Board Questions based on model data
  const boardQuestions = useMemo((): BoardQuestion[] => {
    const questions: BoardQuestion[] = [];
    
    // Churn analysis
    if (assumptions.churnRate >= 5) {
      questions.push({
        question: 'What retention initiatives are planned to address the current churn rate?',
        context: `Current churn of ${assumptions.churnRate}% is impacting LTV projections. A 1% reduction would add ~${formatCurrency(projections.yearlyRevenue[2] * 0.05)} to Year 3 revenue.`,
        urgency: assumptions.churnRate >= 7 ? 'high' : 'medium',
      });
    }
    
    // CAC efficiency
    if (projections.ltvCacRatio < 3) {
      questions.push({
        question: 'How will the team improve CAC efficiency to reach the 3× LTV:CAC target?',
        context: `Current ratio of ${projections.ltvCacRatio.toFixed(1)}× indicates marketing spend may need optimization or pricing adjustments.`,
        urgency: projections.ltvCacRatio < 2 ? 'high' : 'medium',
      });
    }
    
    // AI costs
    if (assumptions.aiUsageMultiplier >= 1.2) {
      questions.push({
        question: 'What strategies are being implemented to optimize AI inference costs?',
        context: 'AI usage multiplier indicates higher-than-baseline usage. Cloud optimization or model efficiency could reduce COGS.',
        urgency: 'medium',
      });
    }
    
    // Revenue mix
    const adRevenuePercent = projections.yearlyRevenue[2] > 0 
      ? (currentScenarioData.revenue.advertisingMarketplace[2] / projections.yearlyRevenue[2]) * 100 
      : 0;
    if (adRevenuePercent < 30) {
      questions.push({
        question: 'What is the strategy for scaling advertising revenue?',
        context: `Advertising represents ${adRevenuePercent.toFixed(0)}% of Year 3 revenue. Increasing fill rate or CPMs could significantly impact margins.`,
        urgency: 'medium',
      });
    }
    
    // Break-even timeline
    if (projections.breakEvenMonth && projections.breakEvenMonth > 24) {
      questions.push({
        question: 'What levers can accelerate the path to break-even?',
        context: `Current projections show break-even at Month ${projections.breakEvenMonth}. Revenue acceleration or cost optimization could improve this timeline.`,
        urgency: 'high',
      });
    }
    
    // Identity verification
    if (drivers.identityVerificationAdoption < 30) {
      questions.push({
        question: 'How will identity verification adoption be accelerated?',
        context: `At ${drivers.identityVerificationAdoption}% adoption, verified creators represent a growth opportunity for premium pricing and advertiser trust.`,
        urgency: 'low',
      });
    }
    
    // Creator growth vs infrastructure
    if (assumptions.monthlyCreatorGrowth >= 10) {
      questions.push({
        question: 'Is infrastructure scaling keeping pace with creator growth?',
        context: `At ${assumptions.monthlyCreatorGrowth}% monthly growth, ensure hosting and AI capacity planning is ahead of demand.`,
        urgency: 'medium',
      });
    }
    
    // EBITDA trajectory
    if (projections.yearlyEbitda[2] < projections.yearlyEbitda[1]) {
      questions.push({
        question: 'What is driving the EBITDA trajectory concern, and how will it be addressed?',
        context: 'EBITDA is projected to decline between Year 2 and Year 3. Review cost structure and growth assumptions.',
        urgency: 'high',
      });
    }
    
    // Add generic strategic questions if we have room
    if (questions.length < 5) {
      questions.push({
        question: 'What are the top 3 strategic priorities for the next quarter?',
        context: 'Align board understanding with management focus areas.',
        urgency: 'low',
      });
    }
    
    return questions.slice(0, 10);
  }, [assumptions, projections, currentScenarioData, drivers]);
  
  // Generate Board CTAs based on model data
  const boardCTAs = useMemo((): BoardCTA[] => {
    const ctas: BoardCTA[] = [];
    
    // CPM weakness
    if (assumptions.advertisingCPM < 20) {
      ctas.push({
        action: 'Introduce advertising agencies for early campaigns',
        rationale: 'CPM weakness detected. Agency partnerships can improve ad inventory pricing and fill rates.',
        priority: 'important',
      });
    }
    
    // Headcount/delivery concerns
    if (assumptions.headcountProductivity < 0.9) {
      ctas.push({
        action: 'Approve headcount shifts to improve delivery timeline',
        rationale: 'Productivity metrics suggest team restructuring or additional hiring could accelerate product delivery.',
        priority: 'important',
      });
    }
    
    // Pricing optimization
    if (assumptions.pricingSensitivity === 0 && assumptions.avgRevenuePerCreator < 50) {
      ctas.push({
        action: 'Provide strategic guidance on pricing',
        rationale: 'ARPU is flat vs forecast. Consider premium tier introduction or pricing optimization.',
        priority: 'recommended',
      });
    }
    
    // AI cost optimization
    if (assumptions.aiInferenceCostPerMin > 0.005) {
      ctas.push({
        action: 'Support infrastructure budget increase',
        rationale: 'AI inference cost trending upward. Investment in optimization or bulk pricing could improve margins.',
        priority: 'recommended',
      });
    }
    
    // Creator acquisition
    if (assumptions.monthlyCreatorGrowth < 6) {
      ctas.push({
        action: 'Engage in partnership outreach',
        rationale: 'Creator acquisition slowing. Podcast network partnerships could accelerate growth.',
        priority: 'critical',
      });
    }
    
    // Runway concerns
    if (projections.runwayMonths < 15) {
      ctas.push({
        action: 'Initiate capital raise planning',
        rationale: `With ${projections.runwayMonths.toFixed(0)} months runway, beginning fundraising process is prudent.`,
        priority: 'critical',
      });
    }
    
    // Fill rate improvement
    if (assumptions.adFillRate < 50) {
      ctas.push({
        action: 'Approve programmatic advertising integration',
        rationale: 'Fill rate below 50%. Programmatic demand sources can improve inventory utilization.',
        priority: 'important',
      });
    }
    
    return ctas;
  }, [assumptions, projections]);
  
  // KPI Scorecards with RAG status
  const kpiScores = useMemo((): KPIScore[] => {
    const getStatus = (condition: boolean, warningCondition: boolean): HealthStatus => {
      if (condition) return 'green';
      if (warningCondition) return 'yellow';
      return 'red';
    };
    
    return [
      {
        name: 'Revenue Health',
        value: formatCurrency(projections.yearlyRevenue[2]),
        status: getStatus(
          projections.yearlyRevenue[2] >= projections.yearlyRevenue[0] * 3,
          projections.yearlyRevenue[2] >= projections.yearlyRevenue[0] * 2
        ),
        trend: 'up',
        insight: `Year 3 revenue with ${((projections.yearlyRevenue[2] / projections.yearlyRevenue[0] - 1) * 100).toFixed(0)}% growth`,
      },
      {
        name: 'Gross Margin',
        value: `${projections.yearlyGrossMargin[2].toFixed(1)}%`,
        status: getStatus(projections.yearlyGrossMargin[2] >= 70, projections.yearlyGrossMargin[2] >= 55),
        trend: projections.yearlyGrossMargin[2] > projections.yearlyGrossMargin[0] ? 'up' : 'down',
        insight: 'Target: 70%+',
      },
      {
        name: 'EBITDA Trend',
        value: formatCurrency(projections.yearlyEbitda[2]),
        status: getStatus(projections.yearlyEbitda[2] > 0, projections.yearlyEbitda[1] > projections.yearlyEbitda[0]),
        trend: projections.yearlyEbitda[2] > projections.yearlyEbitda[0] ? 'up' : 'down',
        insight: projections.yearlyEbitda[2] > 0 ? 'Profitable by Year 3' : 'Pre-profit',
      },
      {
        name: 'Runway',
        value: `${projections.runwayMonths.toFixed(0)} mo`,
        status: getStatus(projections.runwayMonths >= 18, projections.runwayMonths >= 12),
        trend: 'stable',
        insight: projections.runwayMonths >= 18 ? 'Comfortable' : 'Monitor closely',
      },
      {
        name: 'Creator Growth',
        value: `${assumptions.monthlyCreatorGrowth}%/mo`,
        status: getStatus(assumptions.monthlyCreatorGrowth >= 8, assumptions.monthlyCreatorGrowth >= 5),
        trend: 'stable',
        insight: 'Monthly acquisition rate',
      },
      {
        name: 'Churn',
        value: `${assumptions.churnRate}%`,
        status: getStatus(assumptions.churnRate <= 4, assumptions.churnRate <= 6),
        trend: 'stable',
        insight: 'Target: <5%',
      },
      {
        name: 'LTV:CAC Ratio',
        value: `${projections.ltvCacRatio.toFixed(1)}x`,
        status: getStatus(projections.ltvCacRatio >= 3, projections.ltvCacRatio >= 2),
        trend: 'stable',
        insight: 'Target: 3x+',
      },
      {
        name: 'Verification Adoption',
        value: `${drivers.identityVerificationAdoption}%`,
        status: getStatus(drivers.identityVerificationAdoption >= 40, drivers.identityVerificationAdoption >= 20),
        trend: 'up',
        insight: 'Identity verification rate',
      },
      {
        name: 'Product Velocity',
        value: assumptions.headcountProductivity >= 1 ? 'On Track' : 'Behind',
        status: getStatus(assumptions.headcountProductivity >= 1, assumptions.headcountProductivity >= 0.8),
        trend: 'stable',
        insight: 'Delivery vs plan',
      },
    ];
  }, [projections, assumptions, drivers]);
  
  // Trend Analysis items
  const trendItems = useMemo((): TrendItem[] => {
    const items: TrendItem[] = [];
    
    // Revenue vs baseline
    const baselineRev = 2400000; // Year 3 baseline
    const revDelta = ((projections.yearlyRevenue[2] - baselineRev) / baselineRev) * 100;
    items.push({
      trend: `Subscription revenue ${revDelta >= 0 ? 'exceeded' : 'below'} model baseline by ${Math.abs(revDelta).toFixed(0)}%`,
      direction: revDelta >= 0 ? 'positive' : 'negative',
      magnitude: `${formatCurrency(Math.abs(projections.yearlyRevenue[2] - baselineRev))}`,
    });
    
    // AI cost trends
    if (assumptions.aiUsageMultiplier !== 1) {
      const aiDelta = (assumptions.aiUsageMultiplier - 1) * 100;
      items.push({
        trend: `AI inference cost ${aiDelta >= 0 ? 'increased' : 'decreased'} ${Math.abs(aiDelta).toFixed(0)}% from baseline`,
        direction: aiDelta >= 0 ? 'negative' : 'positive',
        magnitude: `${Math.abs(aiDelta).toFixed(0)}%`,
      });
    }
    
    // Creator growth vs capacity
    if (assumptions.monthlyCreatorGrowth >= 10) {
      items.push({
        trend: 'Creator growth outpacing initial capacity planning assumptions',
        direction: 'neutral',
        magnitude: `${assumptions.monthlyCreatorGrowth}%/mo`,
      });
    }
    
    // Break-even shift
    const baselineBreakeven = 18;
    if (projections.breakEvenMonth && projections.breakEvenMonth !== baselineBreakeven) {
      const shift = projections.breakEvenMonth - baselineBreakeven;
      items.push({
        trend: `Break-even ${shift > 0 ? 'extended' : 'accelerated'} from Month ${baselineBreakeven} to Month ${projections.breakEvenMonth}`,
        direction: shift > 0 ? 'negative' : 'positive',
        magnitude: `${Math.abs(shift)} months`,
      });
    }
    
    // Fill rate trends
    if (assumptions.adFillRate !== 65) {
      const fillDelta = assumptions.adFillRate - 65;
      items.push({
        trend: `Ad fill rate ${fillDelta >= 0 ? 'improved' : 'declined'} by ${Math.abs(fillDelta)}pp`,
        direction: fillDelta >= 0 ? 'positive' : 'negative',
        magnitude: `Now at ${assumptions.adFillRate}%`,
      });
    }
    
    return items;
  }, [projections, assumptions]);
  
  // Simulate AI generation
  const handleRefresh = async () => {
    setIsGenerating(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAiOverview(generateAIOverview);
    setLastUpdated(new Date());
    setIsGenerating(false);
  };
  
  // Auto-generate on mount
  useEffect(() => {
    if (!aiOverview) {
      setAiOverview(generateAIOverview);
      setLastUpdated(new Date());
    }
  }, [generateAIOverview, aiOverview]);
  
  const statusColors: Record<HealthStatus, string> = {
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    yellow: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  };
  
  const priorityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    important: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    recommended: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  
  const urgencyColors: Record<string, string> = {
    high: 'text-red-600 dark:text-red-400',
    medium: 'text-amber-600 dark:text-amber-400',
    low: 'text-muted-foreground',
  };
  
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-md">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">State of the Company</h1>
              <p className="text-muted-foreground">
                AI-generated executive summary powered by CFO model data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-violet-100 text-violet-700 border-violet-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Analysis
            </Badge>
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              Refresh Analysis
            </Button>
          </div>
        </div>
        
        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted border border-border p-1">
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="w-4 h-4" />
              AI Overview
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              Board Questions
            </TabsTrigger>
            <TabsTrigger value="ctas" className="gap-2">
              <Target className="w-4 h-4" />
              Board CTAs
            </TabsTrigger>
            <TabsTrigger value="scorecard" className="gap-2">
              <Activity className="w-4 h-4" />
              KPI Scorecard
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trend Analysis
            </TabsTrigger>
          </TabsList>
          
          {/* AI Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  AI-Generated Company Overview
                </CardTitle>
                <CardDescription>
                  Plain-language summary generated from the {selectedScenario === 'base' ? 'Base (CFO Baseline)' : selectedScenario} scenario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {aiOverview.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.replace('## ', '')}</h2>;
                      }
                      if (line.startsWith('**') && line.endsWith('**:')) {
                        return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.replace(/\*\*/g, '').replace(':', '')}</h3>;
                      }
                      if (line.startsWith('- ')) {
                        return <li key={i} className="ml-4">{line.replace('- ', '')}</li>;
                      }
                      if (line.trim() === '') {
                        return <br key={i} />;
                      }
                      return <p key={i} className="text-muted-foreground">{line.replace(/\*\*/g, '')}</p>;
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Board Questions Tab */}
          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  Questions the Board Should Ask the CEO
                </CardTitle>
                <CardDescription>
                  Dynamically generated questions based on current model assumptions and projections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {boardQuestions.map((q, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{q.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">{q.context}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-xs shrink-0', urgencyColors[q.urgency])}
                        >
                          {q.urgency.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Board CTAs Tab */}
          <TabsContent value="ctas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Board Calls to Action
                </CardTitle>
                <CardDescription>
                  Recommended board actions based on model-detected needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {boardCTAs.length > 0 ? boardCTAs.map((cta, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            <p className="font-medium text-foreground">{cta.action}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{cta.rationale}</p>
                        </div>
                        <Badge className={cn('text-xs shrink-0', priorityColors[cta.priority])}>
                          {cta.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <Alert>
                      <CheckCircle2 className="w-4 h-4" />
                      <AlertDescription>
                        No critical actions required at this time. The model shows healthy trajectory across key metrics.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* KPI Scorecard Tab */}
          <TabsContent value="scorecard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  KPI Health Scorecard
                </CardTitle>
                <CardDescription>
                  Red / Yellow / Green status based on data-driven thresholds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kpiScores.map((kpi, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-4 rounded-lg border',
                        statusColors[kpi.status]
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{kpi.name}</span>
                        {kpi.trend && (
                          <span>
                            {kpi.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                            {kpi.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                            {kpi.trend === 'stable' && <Activity className="w-4 h-4" />}
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold">{kpi.value}</div>
                      {kpi.insight && (
                        <p className="text-xs mt-1 opacity-80">{kpi.insight}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Trend Analysis Tab */}
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                  Trend Analysis
                </CardTitle>
                <CardDescription>
                  Auto-generated insights from forecast deltas and assumption changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="shrink-0">
                        {item.direction === 'positive' && (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        )}
                        {item.direction === 'negative' && (
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                        {item.direction === 'neutral' && (
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.trend}</p>
                        <p className="text-xs text-muted-foreground">Impact: {item.magnitude}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
