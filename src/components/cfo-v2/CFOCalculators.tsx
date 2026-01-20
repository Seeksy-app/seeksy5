import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Calculator, TrendingUp, Target, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Tooltip helper component
function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1">
      <Label className="text-xs">{label}</Label>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function OutputWithTooltip({ label, tooltip, children }: { label: string; tooltip: string; children: React.ReactNode }) {
  return (
    <div className="text-center">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-xs text-muted-foreground cursor-help flex items-center justify-center gap-1">
              {label}
              <Info className="w-3 h-3" />
            </p>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {children}
    </div>
  );
}

interface ROICalculatorProps {
  marketingSpend: number;
  cac: number;
  churn: number;
  arpu: number;
  onApply: (results: { roi: number; ltvCac: number; payback: number }, inputs: { marketingSpend: number; cac: number; churn: number; arpu: number }) => void;
}

export function ROICalculator({ marketingSpend, cac, churn, arpu, onApply }: ROICalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSpend, setLocalSpend] = useState(marketingSpend);
  const [localCac, setLocalCac] = useState(cac);
  const [localChurn, setLocalChurn] = useState(churn);
  const [localArpu, setLocalArpu] = useState(arpu);

  const results = useMemo(() => {
    const churnRate = localChurn / 100;
    const ltv = churnRate > 0 ? localArpu / churnRate : localArpu * 24;
    const ltvCac = localCac > 0 ? ltv / localCac : 0;
    const newCustomers = localCac > 0 ? localSpend / localCac : 0;
    const revenueFromNew = newCustomers * ltv;
    const roi = localSpend > 0 ? ((revenueFromNew - localSpend) / localSpend) * 100 : 0;
    const payback = localArpu > 0 ? localCac / localArpu : 0;
    return { roi, ltvCac, payback, ltv };
  }, [localSpend, localCac, localChurn, localArpu]);

  return (
    <Card className="bg-card/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-sm">ROI Calculator</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <LabelWithTooltip 
                label="Marketing Spend ($)" 
                tooltip="Monthly allocation to paid marketing channels used to compute blended acquisition return."
              />
              <Input
                type="number"
                value={localSpend}
                onChange={(e) => setLocalSpend(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="CAC ($)" 
                tooltip="Customer Acquisition Cost. The average cost to acquire one paying creator."
              />
              <Input
                type="number"
                value={localCac}
                onChange={(e) => setLocalCac(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="Monthly Churn (%)" 
                tooltip="Expected percentage of paying creators who cancel each month."
              />
              <Input
                type="number"
                value={localChurn}
                onChange={(e) => setLocalChurn(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="ARPU ($)" 
                tooltip="Average Revenue Per User. Revenue generated per paying creator each month."
              />
              <Input
                type="number"
                value={localArpu}
                onChange={(e) => setLocalArpu(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
            <OutputWithTooltip 
              label="ROI" 
              tooltip="Measures the financial return on marketing spend after factoring in CAC, ARPU, and churn."
            >
              <p className={cn("font-bold", results.roi >= 0 ? "text-emerald-600" : "text-red-600")}>
                {results.roi.toFixed(0)}%
              </p>
            </OutputWithTooltip>
            <OutputWithTooltip 
              label="LTV:CAC" 
              tooltip="Compares customer lifetime value to acquisition cost. Ratios above 3× are considered strong."
            >
              <p className={cn("font-bold", results.ltvCac >= 3 ? "text-emerald-600" : "text-amber-600")}>
                {results.ltvCac.toFixed(1)}x
              </p>
            </OutputWithTooltip>
            <OutputWithTooltip 
              label="Payback" 
              tooltip="Estimated time (in months) for revenue from a new creator to cover CAC."
            >
              <p className="font-bold">{results.payback.toFixed(1)} mo</p>
            </OutputWithTooltip>
          </div>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onApply(
                    { roi: results.roi, ltvCac: results.ltvCac, payback: results.payback },
                    { marketingSpend: localSpend, cac: localCac, churn: localChurn, arpu: localArpu }
                  )}
                >
                  Apply to Model
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                <p>Pushes calculator results into the CFO model.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      )}
    </Card>
  );
}

interface BreakevenCalculatorProps {
  fixedOpex: number;
  variableOpexPct: number;
  revenueGrowth: number;
  initialRevenue: number;
  onApply: (results: { breakEvenMonth: number; breakEvenRunRate: number }, inputs: { fixedOpex: number; variableOpexPct: number; revenueGrowth: number }) => void;
}

export function BreakevenCalculator({
  fixedOpex,
  variableOpexPct,
  revenueGrowth,
  initialRevenue,
  onApply,
}: BreakevenCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFixed, setLocalFixed] = useState(fixedOpex);
  const [localVariable, setLocalVariable] = useState(variableOpexPct);
  const [localGrowth, setLocalGrowth] = useState(revenueGrowth);

  const results = useMemo(() => {
    const monthlyGrowthRate = 1 + (localGrowth / 100) / 12;
    let cumulative = 0;
    let breakEvenMonth = null;
    let breakEvenRunRate = 0;
    
    for (let month = 1; month <= 36; month++) {
      const monthlyRevenue = initialRevenue / 12 * Math.pow(monthlyGrowthRate, month);
      const variableCost = monthlyRevenue * (localVariable / 100);
      const monthlyCost = localFixed / 12 + variableCost;
      const monthlyEbitda = monthlyRevenue - monthlyCost;
      cumulative += monthlyEbitda;
      
      if (cumulative > 0 && breakEvenMonth === null) {
        breakEvenMonth = month;
        breakEvenRunRate = monthlyRevenue * 12;
        break;
      }
    }
    
    return {
      breakEvenMonth: breakEvenMonth || 36,
      breakEvenRunRate: breakEvenRunRate || initialRevenue * Math.pow(monthlyGrowthRate, 36),
    };
  }, [localFixed, localVariable, localGrowth, initialRevenue]);

  return (
    <Card className="bg-card/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-sm">Breakeven Calculator</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <LabelWithTooltip 
                label="Fixed OpEx ($/yr)" 
                tooltip="Annual recurring expenses that do not change with usage or revenue."
              />
              <Input
                type="number"
                value={localFixed}
                onChange={(e) => setLocalFixed(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="Variable OpEx (%)" 
                tooltip="Percentage of expenses that scale with revenue or creator activity."
              />
              <Input
                type="number"
                value={localVariable}
                onChange={(e) => setLocalVariable(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="Revenue Growth (%)" 
                tooltip="Expected annual revenue growth rate used to calculate breakeven timing."
              />
              <Input
                type="number"
                value={localGrowth}
                onChange={(e) => setLocalGrowth(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
            <OutputWithTooltip 
              label="Breakeven Month" 
              tooltip="The month when total revenue exceeds total expenses."
            >
              <p className="font-bold text-emerald-600">Month {results.breakEvenMonth}</p>
            </OutputWithTooltip>
            <OutputWithTooltip 
              label="Run Rate at Breakeven" 
              tooltip="Annualized revenue required to sustain break-even operations."
            >
              <p className="font-bold">
                ${(results.breakEvenRunRate / 1000000).toFixed(2)}M
              </p>
            </OutputWithTooltip>
          </div>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onApply(results, { fixedOpex: localFixed, variableOpexPct: localVariable, revenueGrowth: localGrowth })}
                >
                  Apply to Model
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                <p>Updates OpEx and revenue assumptions in the CFO model.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      )}
    </Card>
  );
}

interface GrowthImpactCalculatorProps {
  baseRevenue: number[];
  baseEbitda: number[];
  onApply: (results: { deltaRevenue: number[]; deltaEbitda: number[]; deltaRunway: number }, inputs: { growthDelta: number; pricingDelta: number; cacDelta: number; churnDelta: number }) => void;
}

export function GrowthImpactCalculator({
  baseRevenue,
  baseEbitda,
  onApply,
}: GrowthImpactCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [growthDelta, setGrowthDelta] = useState(10);
  const [pricingDelta, setPricingDelta] = useState(0);
  const [cacDelta, setCacDelta] = useState(0);
  const [churnDelta, setChurnDelta] = useState(0);

  const results = useMemo(() => {
    const growthMultiplier = 1 + growthDelta / 100;
    const pricingMultiplier = 1 + pricingDelta / 100;
    const churnImpact = 1 - churnDelta / 100;
    
    const deltaRevenue = baseRevenue.map((rev, i) => 
      rev * growthMultiplier * pricingMultiplier * churnImpact - rev
    );
    
    const deltaEbitda = baseEbitda.map((eb, i) => 
      eb + deltaRevenue[i] * 0.7 // Assuming 70% flow-through
    );
    
    const currentBurn = baseEbitda[0] < 0 ? Math.abs(baseEbitda[0]) / 12 : 0;
    const newBurn = deltaEbitda[0] < 0 ? Math.abs(deltaEbitda[0]) / 12 : 0;
    const deltaRunway = currentBurn > 0 ? ((currentBurn - newBurn) / currentBurn) * 12 : 0;
    
    return { deltaRevenue, deltaEbitda, deltaRunway };
  }, [growthDelta, pricingDelta, cacDelta, churnDelta, baseRevenue, baseEbitda]);

  return (
    <Card className="bg-card/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-sm">Growth Impact Calculator</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <LabelWithTooltip 
                label="Growth Δ (%)" 
                tooltip="Adjusts overall company growth assumptions to model scenario impact."
              />
              <Input
                type="number"
                value={growthDelta}
                onChange={(e) => setGrowthDelta(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="Pricing Δ (%)" 
                tooltip="Simulates effects of raising or lowering subscription or usage pricing."
              />
              <Input
                type="number"
                value={pricingDelta}
                onChange={(e) => setPricingDelta(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="CAC Δ (%)" 
                tooltip="Models changes in acquisition efficiency or increased ad competition."
              />
              <Input
                type="number"
                value={cacDelta}
                onChange={(e) => setCacDelta(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="Churn Δ (%)" 
                tooltip="Adjusts retention assumptions to test churn sensitivity."
              />
              <Input
                type="number"
                value={churnDelta}
                onChange={(e) => setChurnDelta(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg text-xs">
            <OutputWithTooltip 
              label="ΔRevenue Y3" 
              tooltip="Projected change in Year 3 revenue from modified assumptions."
            >
              <p className={cn("font-bold", results.deltaRevenue[2] >= 0 ? "text-emerald-600" : "text-red-600")}>
                {results.deltaRevenue[2] >= 0 ? '+' : ''}{(results.deltaRevenue[2] / 1000).toFixed(0)}K
              </p>
            </OutputWithTooltip>
            <OutputWithTooltip 
              label="ΔEBITDA Y3" 
              tooltip="Projected change in Year 3 EBITDA from growth or pricing adjustments."
            >
              <p className={cn("font-bold", results.deltaEbitda[2] >= 0 ? "text-emerald-600" : "text-red-600")}>
                {results.deltaEbitda[2] >= 0 ? '+' : ''}{(results.deltaEbitda[2] / 1000).toFixed(0)}K
              </p>
            </OutputWithTooltip>
            <OutputWithTooltip 
              label="ΔRunway" 
              tooltip="Change in total runway (months) based on updated assumptions."
            >
              <p className={cn("font-bold", results.deltaRunway >= 0 ? "text-emerald-600" : "text-red-600")}>
                {results.deltaRunway >= 0 ? '+' : ''}{results.deltaRunway.toFixed(1)} mo
              </p>
            </OutputWithTooltip>
          </div>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onApply(results, { growthDelta, pricingDelta, cacDelta, churnDelta })}
                >
                  Apply to Model
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                <p>Applies scenario outcomes to the CFO model.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      )}
    </Card>
  );
}