import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FileText, Users, Sparkles, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CFOBriefProps {
  variant: 'board' | 'investor';
  metrics: {
    arr: number[];
    ebitda: number[];
    grossMargin: number[];
    burnRate: number[];
    runway: number;
    cac: number;
    ltv: number;
    breakEvenMonth: number | null;
  };
  forecastMode: 'ai' | 'custom';
  scenario?: 'base' | 'best' | 'worst';
  years?: number[];
}

const formatCurrency = (value: number, compact = true) => {
  if (compact) {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export function CFOBrief({ variant, metrics, forecastMode, scenario = 'base', years = [2025, 2026, 2027] }: CFOBriefProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Calculate derived metrics
  const arrGrowthY1Y2 = metrics.arr[0] > 0 ? ((metrics.arr[1] - metrics.arr[0]) / metrics.arr[0]) * 100 : 0;
  const arrGrowthY2Y3 = metrics.arr[1] > 0 ? ((metrics.arr[2] - metrics.arr[1]) / metrics.arr[1]) * 100 : 0;
  const ltvCacRatio = metrics.cac > 0 ? metrics.ltv / metrics.cac : 0;
  const isEbitdaPositiveY3 = metrics.ebitda[2] >= 0;
  const isBurning = metrics.burnRate[0] > 0;
  const marginTrend = metrics.grossMargin[2] > metrics.grossMargin[0] ? 'improving' : 'stable';

  // Generate Board Brief (5W Format - Internal/Operational)
  const generateBoardBrief = () => {
    const scenarioLabel = scenario === 'best' ? 'Growth' : scenario === 'worst' ? 'Aggressive' : 'Base';
    const modeLabel = forecastMode === 'ai' ? 'AI-Generated' : 'Custom Assumptions';

    return {
      what: `We are projecting ${formatCurrency(metrics.arr[2])} ARR by ${years[2]}, with EBITDA of ${formatCurrency(metrics.ebitda[2])}. Current model reflects ${modeLabel} under ${scenarioLabel} scenario.`,
      
      why: `Revenue growth trajectory shows ${formatPercent(arrGrowthY1Y2)} Y1→Y2 and ${formatPercent(arrGrowthY2Y3)} Y2→Y3. Gross margins are ${marginTrend} at ${formatPercent(metrics.grossMargin[2])} by ${years[2]}. ${isEbitdaPositiveY3 ? 'We reach EBITDA profitability in the forecast period.' : 'Additional capital may be required to reach profitability.'}`,
      
      who: `Unit economics show LTV:CAC of ${ltvCacRatio.toFixed(1)}x with CAC of ${formatCurrency(metrics.cac, false)} and LTV of ${formatCurrency(metrics.ltv)}. ${ltvCacRatio >= 3 ? 'Healthy ratio supports scaled acquisition.' : 'CAC efficiency improvements are a priority.'}`,
      
      when: metrics.breakEvenMonth 
        ? `Breakeven projected at Month ${metrics.breakEvenMonth}. ${isBurning ? `Current burn rate is ${formatCurrency(metrics.burnRate[0])}/month with ${Math.round(metrics.runway)} months runway.` : 'Currently cash-flow positive.'}`
        : `Breakeven extends beyond ${years[2]}. ${isBurning ? `Current burn rate is ${formatCurrency(metrics.burnRate[0])}/month with ${Math.round(metrics.runway)} months runway. Capital planning required.` : 'Model assumptions may need adjustment.'}`,
      
      where: `Key focus areas: ${metrics.grossMargin[0] < 60 ? 'COGS optimization, ' : ''}${ltvCacRatio < 3 ? 'CAC efficiency, ' : ''}${isBurning && metrics.runway < 18 ? 'runway extension, ' : ''}revenue acceleration and operational scaling.`.replace(/, $/, '.'),
    };
  };

  // Generate Investor Brief (External/Traction-Focused)
  const generateInvestorBrief = () => {
    return {
      summary: `Seeksy is building the operating system for creators with a clear path to ${formatCurrency(metrics.arr[2])} ARR by ${years[2]}. Our model demonstrates strong unit economics with ${ltvCacRatio.toFixed(1)}x LTV:CAC ratio and ${formatPercent(metrics.grossMargin[2])} gross margins.`,
      
      traction: `Revenue growth accelerates from ${formatCurrency(metrics.arr[0])} (${years[0]}) to ${formatCurrency(metrics.arr[1])} (${years[1]}) to ${formatCurrency(metrics.arr[2])} (${years[2]}), representing ${formatPercent(arrGrowthY1Y2)} and ${formatPercent(arrGrowthY2Y3)} year-over-year growth respectively.`,
      
      economics: `Customer acquisition cost of ${formatCurrency(metrics.cac, false)} yields lifetime value of ${formatCurrency(metrics.ltv)}, delivering ${ltvCacRatio.toFixed(1)}x return on acquisition spend. ${ltvCacRatio >= 3 ? 'This ratio supports aggressive growth investment.' : 'We continue optimizing CAC efficiency as we scale.'}`,
      
      profitability: isEbitdaPositiveY3
        ? `The model projects EBITDA profitability of ${formatCurrency(metrics.ebitda[2])} by ${years[2]}${metrics.breakEvenMonth ? `, with breakeven at Month ${metrics.breakEvenMonth}` : ''}. Gross margins reach ${formatPercent(metrics.grossMargin[2])}, demonstrating scalable unit economics.`
        : `Current projections show ${formatCurrency(Math.abs(metrics.ebitda[2]))} EBITDA burn by ${years[2]} as we prioritize growth. Gross margins of ${formatPercent(metrics.grossMargin[2])} provide path to profitability with scale.`,
      
      runway: isBurning
        ? `Current runway of ${Math.round(metrics.runway)} months at ${formatCurrency(metrics.burnRate[0])}/month burn provides adequate time to execute on growth milestones.`
        : `Cash-flow positive operations provide flexibility for strategic investments and opportunistic growth.`,
    };
  };

  const boardBrief = generateBoardBrief();
  const investorBrief = generateInvestorBrief();

  if (variant === 'board') {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">CFO Brief (Board Summary)</CardTitle>
                    <p className="text-sm text-muted-foreground">Auto-generated 5W executive summary</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {forecastMode === 'ai' ? 'AI Mode' : 'Custom'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs capitalize">{scenario}</Badge>
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid gap-4">
                <BriefSection icon={Target} title="WHAT" color="blue">
                  {boardBrief.what}
                </BriefSection>
                <BriefSection icon={TrendingUp} title="WHY" color="emerald">
                  {boardBrief.why}
                </BriefSection>
                <BriefSection icon={Users} title="WHO" color="purple">
                  {boardBrief.who}
                </BriefSection>
                <BriefSection icon={AlertTriangle} title="WHEN" color="amber">
                  {boardBrief.when}
                </BriefSection>
                <BriefSection icon={Target} title="WHERE" color="indigo">
                  {boardBrief.where}
                </BriefSection>
              </div>
              <p className="text-xs text-muted-foreground italic pt-2 border-t">
                This brief updates automatically based on current model assumptions and forecast mode.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Investor variant (for PDF export)
  return (
    <Card className="border-emerald-200 dark:border-emerald-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">CFO Brief</CardTitle>
            <p className="text-sm text-muted-foreground">Financial Overview for Investors</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <InvestorSection title="Executive Summary">
            {investorBrief.summary}
          </InvestorSection>
          <InvestorSection title="Revenue Traction">
            {investorBrief.traction}
          </InvestorSection>
          <InvestorSection title="Unit Economics">
            {investorBrief.economics}
          </InvestorSection>
          <InvestorSection title="Path to Profitability">
            {investorBrief.profitability}
          </InvestorSection>
          <InvestorSection title="Capital Position">
            {investorBrief.runway}
          </InvestorSection>
        </div>
      </CardContent>
    </Card>
  );
}

function BriefSection({ 
  icon: Icon, 
  title, 
  color, 
  children 
}: { 
  icon: any; 
  title: string; 
  color: 'blue' | 'emerald' | 'purple' | 'amber' | 'indigo'; 
  children: React.ReactNode;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  return (
    <div className="flex gap-3">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClasses[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function InvestorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">{title}</h4>
      <p className="text-sm text-foreground leading-relaxed">{children}</p>
    </div>
  );
}

// Export function to generate investor brief text for PDF
export function generateInvestorBriefText(metrics: CFOBriefProps['metrics'], years: number[] = [2025, 2026, 2027]): string {
  const formatCurrency = (value: number, compact = true) => {
    if (compact) {
      if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const arrGrowthY1Y2 = metrics.arr[0] > 0 ? ((metrics.arr[1] - metrics.arr[0]) / metrics.arr[0]) * 100 : 0;
  const arrGrowthY2Y3 = metrics.arr[1] > 0 ? ((metrics.arr[2] - metrics.arr[1]) / metrics.arr[1]) * 100 : 0;
  const ltvCacRatio = metrics.cac > 0 ? metrics.ltv / metrics.cac : 0;
  const isEbitdaPositiveY3 = metrics.ebitda[2] >= 0;
  const isBurning = metrics.burnRate[0] > 0;

  return `
CFO BRIEF - INVESTOR SUMMARY

EXECUTIVE SUMMARY
Seeksy is building the operating system for creators with a clear path to ${formatCurrency(metrics.arr[2])} ARR by ${years[2]}. Our model demonstrates strong unit economics with ${ltvCacRatio.toFixed(1)}x LTV:CAC ratio and ${formatPercent(metrics.grossMargin[2])} gross margins.

REVENUE TRACTION
Revenue growth accelerates from ${formatCurrency(metrics.arr[0])} (${years[0]}) to ${formatCurrency(metrics.arr[1])} (${years[1]}) to ${formatCurrency(metrics.arr[2])} (${years[2]}), representing ${formatPercent(arrGrowthY1Y2)} and ${formatPercent(arrGrowthY2Y3)} year-over-year growth respectively.

UNIT ECONOMICS
Customer acquisition cost of ${formatCurrency(metrics.cac, false)} yields lifetime value of ${formatCurrency(metrics.ltv)}, delivering ${ltvCacRatio.toFixed(1)}x return on acquisition spend. ${ltvCacRatio >= 3 ? 'This ratio supports aggressive growth investment.' : 'We continue optimizing CAC efficiency as we scale.'}

PATH TO PROFITABILITY
${isEbitdaPositiveY3
  ? `The model projects EBITDA profitability of ${formatCurrency(metrics.ebitda[2])} by ${years[2]}${metrics.breakEvenMonth ? `, with breakeven at Month ${metrics.breakEvenMonth}` : ''}. Gross margins reach ${formatPercent(metrics.grossMargin[2])}, demonstrating scalable unit economics.`
  : `Current projections show ${formatCurrency(Math.abs(metrics.ebitda[2]))} EBITDA burn by ${years[2]} as we prioritize growth. Gross margins of ${formatPercent(metrics.grossMargin[2])} provide path to profitability with scale.`}

CAPITAL POSITION
${isBurning
  ? `Current runway of ${Math.round(metrics.runway)} months at ${formatCurrency(metrics.burnRate[0])}/month burn provides adequate time to execute on growth milestones.`
  : `Cash-flow positive operations provide flexibility for strategic investments and opportunistic growth.`}
`.trim();
}
