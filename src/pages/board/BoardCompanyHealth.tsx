/**
 * Company Health Page - AI-generated State of the Company
 * Board-ready narrative with dynamic metrics
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinancialCalculationEngine } from '@/hooks/useFinancialCalculationEngine';
import { useCFOMasterModel } from '@/hooks/useCFOMasterModel';
import { useNavigate } from 'react-router-dom';
import { BoardPageHeader } from '@/components/board/BoardPageHeader';
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle2, Target, Users, DollarSign, Zap,
  ArrowUp, ArrowDown, Minus, RefreshCw,
  HelpCircle, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

type HealthStatus = 'healthy' | 'warning' | 'critical';

interface KPIScorecard {
  name: string;
  value: string;
  status: HealthStatus;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
}

export default function BoardCompanyHealth() {
  const navigate = useNavigate();
  const { projections, drivers } = useFinancialCalculationEngine();
  const { assumptions, startingCash } = useCFOMasterModel();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Calculate health metrics
  const healthData = useMemo(() => {
    const revenueGrowth = projections.yearlyRevenue[1] > 0 
      ? ((projections.yearlyRevenue[1] - projections.yearlyRevenue[0]) / projections.yearlyRevenue[0]) * 100 
      : 0;
    
    const grossMargin = projections.yearlyGrossMargin[0] || 65;
    const ebitdaMargin = projections.yearlyEbitdaMargin[0] || -10;
    const runway = projections.runwayMonths;
    const churn = drivers.churn;
    const ltvCac = projections.ltvCacRatio;
    
    return {
      revenueGrowth,
      grossMargin,
      ebitdaMargin,
      runway,
      churn,
      ltvCac,
      breakEven: projections.breakEvenMonth,
      yearlyRevenue: projections.yearlyRevenue[0],
      yearlyEbitda: projections.yearlyEbitda[0],
    };
  }, [projections, drivers]);
  
  // Generate AI narrative based on metrics
  const aiNarrative = useMemo(() => {
    const { revenueGrowth, grossMargin, ebitdaMargin, runway, churn, ltvCac, breakEven } = healthData;
    
    // Health assessment
    let overallHealth = 'strong';
    if (runway < 12 || churn > 8 || ebitdaMargin < -30) {
      overallHealth = 'concerning';
    } else if (runway < 18 || churn > 6 || ebitdaMargin < -15) {
      overallHealth = 'moderate';
    }
    
    // Generate dynamic narrative
    const narratives = {
      overview: overallHealth === 'strong' 
        ? `Seeksy is demonstrating strong fundamentals with ${revenueGrowth.toFixed(0)}% projected year-over-year revenue growth. The company maintains a healthy ${grossMargin.toFixed(0)}% gross margin and is on track to reach break-even by Month ${breakEven || 'TBD'}.`
        : overallHealth === 'moderate'
        ? `Seeksy shows promising growth potential but faces some headwinds. Revenue is projected to grow ${revenueGrowth.toFixed(0)}% YoY, though ${runway}-month runway requires attention. The ${churn}% monthly churn rate is within acceptable range but trending upward.`
        : `Immediate attention required. Key metrics show stress: ${runway}-month runway, ${churn}% churn, and ${ebitdaMargin.toFixed(0)}% EBITDA margin. Recommend accelerating fundraising timeline and implementing cost controls.`,
      
      creatorGrowth: drivers.creatorGrowth >= 8
        ? `Creator acquisition is exceeding targets with ${drivers.creatorGrowth}% monthly growth. The platform is gaining traction in the podcaster and content creator segments.`
        : `Creator growth at ${drivers.creatorGrowth}% monthly is below the 8% target. Recommend increased investment in marketing and referral programs.`,
      
      revenuePacing: revenueGrowth >= 100
        ? `Revenue pacing is excellent. On track to achieve ${formatCurrency(projections.yearlyRevenue[1])} in Year 2, driven by strong subscription conversion and advertising fill rates.`
        : `Revenue growth at ${revenueGrowth.toFixed(0)}% is below projections. Primary drivers: subscription ARPU of ${formatCurrency(drivers.arpu)} and ${drivers.marketplaceFillRate}% ad fill rate.`,
      
      risks: [
        churn > 5 && `Elevated churn (${churn}%) threatens recurring revenue base`,
        runway < 18 && `Runway of ${runway} months requires fundraising within 6 months`,
        ltvCac < 3 && `LTV/CAC ratio of ${ltvCac.toFixed(1)}x below 3x target`,
        ebitdaMargin < -20 && `Negative EBITDA margin of ${ebitdaMargin.toFixed(0)}% indicates burn concerns`,
      ].filter(Boolean),
      
      opportunities: [
        grossMargin > 65 && 'Strong gross margins enable investment in growth',
        ltvCac > 3 && 'Healthy LTV/CAC supports aggressive customer acquisition',
        revenueGrowth > 100 && 'Rapid growth trajectory positions for Series A',
        drivers.identityVerificationAdoption > 20 && 'Identity verification adoption creating premium revenue tier',
      ].filter(Boolean),
    };
    
    return { narratives, overallHealth };
  }, [healthData, drivers, projections]);
  
  // Board Questions for CEO - contextual based on current state
  const boardQuestions = useMemo(() => {
    const questions = [];
    
    if (healthData.churn > 5) {
      questions.push("What specific actions are being taken to reduce churn from the current " + healthData.churn + "%?");
    }
    if (healthData.runway < 18) {
      questions.push("What is the timeline for the next fundraise given the " + healthData.runway + "-month runway?");
    }
    if (healthData.ebitdaMargin < -15) {
      questions.push("What cost reduction measures are being considered to improve the EBITDA margin?");
    }
    if (drivers.creatorGrowth < 8) {
      questions.push("What changes to the GTM strategy will accelerate creator acquisition?");
    }
    if (projections.ltvCacRatio < 3) {
      questions.push("How will unit economics be improved to reach a 3x LTV/CAC ratio?");
    }
    
    // Always include strategic questions
    questions.push("What are the top 3 priorities for the next quarter?");
    questions.push("Are there any emerging competitive threats we should be aware of?");
    
    return questions.slice(0, 5);
  }, [healthData, drivers, projections]);
  
  // Board Actions to Support Company
  const boardActions = useMemo(() => {
    const actions = [];
    
    if (healthData.runway < 18) {
      actions.push({ action: "Facilitate warm introductions to potential investors", priority: "high" });
    }
    if (drivers.creatorGrowth < 8) {
      actions.push({ action: "Leverage personal networks to attract marquee creators", priority: "medium" });
    }
    actions.push({ action: "Review and provide feedback on Q1 strategic plan", priority: "medium" });
    actions.push({ action: "Identify potential strategic partnership opportunities", priority: "low" });
    
    return actions;
  }, [healthData, drivers]);
  
  // KPI Scorecards
  const scorecards: KPIScorecard[] = useMemo(() => {
    const getStatus = (metric: string, value: number): HealthStatus => {
      switch (metric) {
        case 'revenue': return value >= 100 ? 'healthy' : value >= 50 ? 'warning' : 'critical';
        case 'margin': return value >= 60 ? 'healthy' : value >= 40 ? 'warning' : 'critical';
        case 'ebitda': return value >= 0 ? 'healthy' : value >= -20 ? 'warning' : 'critical';
        case 'runway': return value >= 18 ? 'healthy' : value >= 12 ? 'warning' : 'critical';
        case 'churn': return value <= 5 ? 'healthy' : value <= 8 ? 'warning' : 'critical';
        case 'ltvcac': return value >= 3 ? 'healthy' : value >= 2 ? 'warning' : 'critical';
        default: return 'warning';
      }
    };
    
    return [
      { 
        name: 'Total Revenue (Y1)', 
        value: formatCurrency(healthData.yearlyRevenue),
        status: getStatus('revenue', healthData.revenueGrowth),
        trend: healthData.revenueGrowth > 80 ? 'up' : 'down',
        trendValue: `${healthData.revenueGrowth.toFixed(0)}% YoY`
      },
      { 
        name: 'EBITDA (Y1)', 
        value: formatCurrency(healthData.yearlyEbitda),
        status: getStatus('ebitda', healthData.ebitdaMargin),
        trend: healthData.ebitdaMargin > -15 ? 'up' : 'down',
        trendValue: `${healthData.ebitdaMargin.toFixed(0)}% margin`
      },
      { 
        name: 'Gross Margin', 
        value: `${healthData.grossMargin.toFixed(0)}%`,
        status: getStatus('margin', healthData.grossMargin),
        trend: 'up',
        trendValue: '+2%'
      },
      { 
        name: 'Runway', 
        value: `${healthData.runway} months`,
        status: getStatus('runway', healthData.runway),
        trend: 'flat',
        trendValue: 'Stable'
      },
      { 
        name: 'Creator Growth', 
        value: `${drivers.creatorGrowth}% MoM`,
        status: drivers.creatorGrowth >= 8 ? 'healthy' : 'warning',
        trend: drivers.creatorGrowth >= 8 ? 'up' : 'down',
        trendValue: drivers.creatorGrowth >= 8 ? 'On target' : 'Below target'
      },
      { 
        name: 'Churn', 
        value: `${healthData.churn}%`,
        status: getStatus('churn', healthData.churn),
        trend: healthData.churn <= 5 ? 'down' : 'up',
        trendValue: healthData.churn <= 5 ? 'Healthy' : 'Elevated'
      },
    ];
  }, [healthData, drivers]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };
  
  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <BoardPageHeader
        icon={<Brain className="w-5 h-5 text-white" />}
        title="Company Health"
        subtitle="AI-generated state of the company analysis"
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* Overall Health Status */}
      <Card className={cn(
        "border-2",
        aiNarrative.overallHealth === 'strong' && "border-green-500/30 bg-green-500/5",
        aiNarrative.overallHealth === 'moderate' && "border-yellow-500/30 bg-yellow-500/5",
        aiNarrative.overallHealth === 'concerning' && "border-red-500/30 bg-red-500/5"
      )}>
        <CardHeader>
          <div className="flex items-center gap-3">
            {aiNarrative.overallHealth === 'strong' && <CheckCircle2 className="w-8 h-8 text-green-500" />}
            {aiNarrative.overallHealth === 'moderate' && <AlertTriangle className="w-8 h-8 text-yellow-500" />}
            {aiNarrative.overallHealth === 'concerning' && <AlertTriangle className="w-8 h-8 text-red-500" />}
            <div>
              <CardTitle>Current Status: {aiNarrative.overallHealth.charAt(0).toUpperCase() + aiNarrative.overallHealth.slice(1)}</CardTitle>
              <CardDescription>Based on {scorecards.length} key performance indicators</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{aiNarrative.narratives.overview}</p>
        </CardContent>
      </Card>

      {/* KPI Scorecards */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Summary</CardTitle>
          <CardDescription>Real-time health indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scorecards.map((kpi, i) => (
              <div key={i} className={cn(
                "p-4 rounded-lg border",
                kpi.status === 'healthy' && "border-green-500/30 bg-green-500/5",
                kpi.status === 'warning' && "border-yellow-500/30 bg-yellow-500/5",
                kpi.status === 'critical' && "border-red-500/30 bg-red-500/5"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{kpi.name}</span>
                  <Badge variant={
                    kpi.status === 'healthy' ? 'default' :
                    kpi.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {kpi.status === 'healthy' ? '🟢' : kpi.status === 'warning' ? '🟡' : '🔴'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{kpi.value}</span>
                  <div className={cn(
                    "flex items-center text-xs",
                    kpi.trend === 'up' && "text-green-500",
                    kpi.trend === 'down' && "text-red-500",
                    kpi.trend === 'flat' && "text-muted-foreground"
                  )}>
                    {kpi.trend === 'up' && <ArrowUp className="w-3 h-3" />}
                    {kpi.trend === 'down' && <ArrowDown className="w-3 h-3" />}
                    {kpi.trend === 'flat' && <Minus className="w-3 h-3" />}
                    {kpi.trendValue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI-Generated Board Questions for CEO */}
      <Card className="border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <HelpCircle className="w-5 h-5" />
            Board Questions for CEO
          </CardTitle>
          <CardDescription>AI-generated questions based on current metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {boardQuestions.map((question, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-sm">{question}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Board Actions to Support Company */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-600">
            <Lightbulb className="w-5 h-5" />
            Board Actions to Support Company
          </CardTitle>
          <CardDescription>Recommended ways the board can help</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {boardActions.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <span className="text-sm">{item.action}</span>
                <Badge variant={
                  item.priority === 'high' ? 'destructive' :
                  item.priority === 'medium' ? 'default' : 'outline'
                }>
                  {item.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creator Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Creator Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiNarrative.narratives.creatorGrowth}
            </p>
          </CardContent>
        </Card>

        {/* Revenue Pacing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Revenue Pacing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {aiNarrative.narratives.revenuePacing}
            </p>
          </CardContent>
        </Card>

        {/* Risks */}
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Key Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiNarrative.narratives.risks.length > 0 ? (
              <ul className="space-y-2">
                {aiNarrative.narratives.risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-red-500 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No significant risks identified.</p>
            )}
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Zap className="w-5 h-5" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiNarrative.narratives.opportunities.length > 0 ? (
              <ul className="space-y-2">
                {aiNarrative.narratives.opportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-green-500 mt-0.5">•</span>
                    {opp}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Analysis in progress...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}