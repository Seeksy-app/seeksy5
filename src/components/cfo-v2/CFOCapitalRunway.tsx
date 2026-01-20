import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  DollarSign, TrendingUp, Calendar, Plus, Trash2, AlertTriangle, 
  CheckCircle, XCircle, Wallet, Clock, Landmark, Info
} from 'lucide-react';
import { CollapsibleSliderSection } from './CFOSliderControl';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Tooltip helper for labels
function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1">
      <Label className="text-sm">{label}</Label>
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

export interface CapitalInfusion {
  id: string;
  type: 'seed' | 'safe' | 'convertible' | 'equity' | 'grant';
  amount: number;
  year: number;
  month: number;
  source?: string;
}

export interface CapitalSettings {
  startingCash: number;
  minimumCashTarget: number;
  burnRateChangePercent: number;
  hiringFreezeEnabled: boolean;
  opexCompression: number;
  revenueShock: number;
  cashToEbitdaConversion: number;
  scenario: 'base' | 'best' | 'worst';
}

export interface CapitalOutputs {
  monthlyBurn: number[];
  cashBalanceByMonth: number[];
  runwayMonths: number;
  nextRaiseDate: string | null;
  survives2025: boolean;
  survives2026: boolean;
  survives2027: boolean;
}

interface CFOCapitalRunwayProps {
  settings: CapitalSettings;
  infusions: CapitalInfusion[];
  onSettingsChange: (settings: CapitalSettings) => void;
  onInfusionsChange: (infusions: CapitalInfusion[]) => void;
  ebitda: number[];
  years: number[];
}

const formatCurrency = (value: number, compact = true) => {
  if (compact) {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const INFUSION_TYPES = [
  { value: 'seed', label: 'Seed / Friends & Family' },
  { value: 'safe', label: 'SAFE' },
  { value: 'convertible', label: 'Convertible Note' },
  { value: 'equity', label: 'Equity (Series A/B/C)' },
  { value: 'grant', label: 'Grant / Non-Dilutive' },
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function CFOCapitalRunway({
  settings,
  infusions,
  onSettingsChange,
  onInfusionsChange,
  ebitda,
  years,
}: CFOCapitalRunwayProps) {
  const [sliderOpen, setSliderOpen] = useState(true);

  // Calculate capital outputs
  const outputs = useMemo<CapitalOutputs>(() => {
    // Apply scenario multipliers
    const scenarioMultiplier = settings.scenario === 'best' ? 0.8 : settings.scenario === 'worst' ? 1.3 : 1.0;
    const revenueMultiplier = 1 - (settings.revenueShock / 100);
    const opexMultiplier = 1 - (settings.opexCompression / 100);
    const burnChangeMultiplier = 1 + (settings.burnRateChangePercent / 100);

    // Calculate monthly burn from EBITDA
    const baseBurnByYear = ebitda.map(e => Math.max(0, -e / 12));
    
    // Apply modifiers
    const monthlyBurn: number[] = [];
    const cashBalanceByMonth: number[] = [];
    let currentCash = settings.startingCash;

    // Add initial infusions
    infusions.filter(inf => inf.year === years[0] && inf.month === 1).forEach(inf => {
      currentCash += inf.amount;
    });

    for (let yearIdx = 0; yearIdx < 3; yearIdx++) {
      for (let month = 1; month <= 12; month++) {
        const monthIndex = yearIdx * 12 + month - 1;
        
        // Get monthly burn rate with modifiers
        let burn = baseBurnByYear[yearIdx] * scenarioMultiplier * burnChangeMultiplier;
        
        // Apply revenue shock (increases burn)
        burn = burn / revenueMultiplier;
        
        // Apply opex compression (reduces burn)
        burn = burn * opexMultiplier;
        
        // Apply hiring freeze (reduces burn by ~30%)
        if (settings.hiringFreezeEnabled) {
          burn = burn * 0.7;
        }
        
        monthlyBurn.push(burn);
        
        // Add any infusions for this month
        infusions.filter(inf => inf.year === years[yearIdx] && inf.month === month).forEach(inf => {
          currentCash += inf.amount;
        });
        
        // Apply cash-to-EBITDA conversion (positive EBITDA adds to cash)
        const monthlyEbitda = ebitda[yearIdx] / 12;
        if (monthlyEbitda > 0) {
          currentCash += monthlyEbitda * (settings.cashToEbitdaConversion / 100);
        }
        
        // Subtract burn
        currentCash -= burn;
        cashBalanceByMonth.push(Math.max(0, currentCash));
      }
    }

    // Calculate runway
    let runwayMonths = 0;
    for (let i = 0; i < cashBalanceByMonth.length; i++) {
      if (cashBalanceByMonth[i] > settings.minimumCashTarget) {
        runwayMonths = i + 1;
      } else {
        break;
      }
    }
    if (runwayMonths === 36) runwayMonths = 36; // Cap at 36 months

    // Next raise date
    let nextRaiseDate: string | null = null;
    const raiseBuffer = 6; // Raise 6 months before running out
    if (runwayMonths < 36) {
      const raiseMonthIdx = Math.max(0, runwayMonths - raiseBuffer);
      const raiseYear = years[Math.floor(raiseMonthIdx / 12)];
      const raiseMonth = (raiseMonthIdx % 12) + 1;
      nextRaiseDate = `${MONTHS[raiseMonth - 1]} ${raiseYear}`;
    }

    // Survival checks
    const survives2025 = cashBalanceByMonth[11] > settings.minimumCashTarget;
    const survives2026 = cashBalanceByMonth[23] > settings.minimumCashTarget;
    const survives2027 = cashBalanceByMonth[35] > settings.minimumCashTarget;

    return {
      monthlyBurn,
      cashBalanceByMonth,
      runwayMonths,
      nextRaiseDate,
      survives2025,
      survives2026,
      survives2027,
    };
  }, [settings, infusions, ebitda, years]);

  const addInfusion = () => {
    onInfusionsChange([
      ...infusions,
      {
        id: crypto.randomUUID(),
        type: 'safe',
        amount: 250000,
        year: years[0],
        month: 6,
        source: '',
      },
    ]);
  };

  const updateInfusion = (id: string, field: keyof CapitalInfusion, value: any) => {
    onInfusionsChange(
      infusions.map(inf => inf.id === id ? { ...inf, [field]: value } : inf)
    );
  };

  const removeInfusion = (id: string) => {
    onInfusionsChange(infusions.filter(inf => inf.id !== id));
  };

  const totalInfusions = infusions.reduce((sum, inf) => sum + inf.amount, 0);

  return (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Scenario Selection
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  <p>Switch between Base, Best, and Worst Case financial scenarios.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(['base', 'best', 'worst'] as const).map(scenario => (
              <Button
                key={scenario}
                variant={settings.scenario === scenario ? 'default' : 'outline'}
                onClick={() => onSettingsChange({ ...settings, scenario })}
                className={cn(
                  "flex-1",
                  settings.scenario === scenario && scenario === 'best' && "bg-emerald-600 hover:bg-emerald-700",
                  settings.scenario === scenario && scenario === 'worst' && "bg-red-600 hover:bg-red-700"
                )}
              >
                {scenario === 'base' && 'Base'}
                {scenario === 'best' && 'Growth'}
                {scenario === 'worst' && 'Aggressive'}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {settings.scenario === 'base' && 'Using current assumptions without adjustments'}
            {settings.scenario === 'best' && 'Growth: 20% lower burn, steady growth trajectory'}
            {settings.scenario === 'worst' && 'Aggressive: Accelerated spend, higher revenue targets'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Cash Inputs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Cash Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <LabelWithTooltip 
                label="Starting Cash on Hand" 
                tooltip="Total available cash at the beginning of the forecast period."
              />
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={settings.startingCash}
                  onChange={(e) => onSettingsChange({ ...settings, startingCash: Number(e.target.value) })}
                  className="pl-7"
                />
              </div>
            </div>
            <div>
              <LabelWithTooltip 
                label="Minimum Cash Target" 
                tooltip="Threshold for minimum liquidity. Alerts trigger when projected cash falls below this level."
              />
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={settings.minimumCashTarget}
                  onChange={(e) => onSettingsChange({ ...settings, minimumCashTarget: Number(e.target.value) })}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Triggers runway alerts when cash falls below this</p>
            </div>
          </CardContent>
        </Card>

        {/* Outputs Summary */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Runway & Cash Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-background rounded-lg border cursor-help">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Current Monthly Burn <Info className="w-3 h-3" />
                      </p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(outputs.monthlyBurn[0])}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p>Net monthly cash outflow after revenue, COGS, and OpEx.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-background rounded-lg border cursor-help">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Cash Runway <Info className="w-3 h-3" />
                      </p>
                      <p className={cn("text-xl font-bold", outputs.runwayMonths >= 18 ? "text-emerald-600" : outputs.runwayMonths >= 12 ? "text-amber-600" : "text-red-600")}>
                        {outputs.runwayMonths} months
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p>Months until cash reaches zero or the minimum threshold.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-background rounded-lg border cursor-help">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Total Infusions Planned <Info className="w-3 h-3" />
                      </p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(totalInfusions)}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p>Funds added to the business. Includes amount, date, and type (SAFE, equity, debt, grant).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-background rounded-lg border cursor-help">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Next Raise Needed <Info className="w-3 h-3" />
                      </p>
                      <p className="text-xl font-bold">{outputs.nextRaiseDate || 'N/A'}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p>Projected date the company will require additional capital.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Survival Indicators */}
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Survival Through...</p>
              <div className="flex gap-3">
                {[
                  { year: 2025, survives: outputs.survives2025 },
                  { year: 2026, survives: outputs.survives2026 },
                  { year: 2027, survives: outputs.survives2027 },
                ].map(({ year, survives }) => (
                  <Badge
                    key={year}
                    variant={survives ? 'default' : 'destructive'}
                    className={cn(
                      "flex items-center gap-1",
                      survives && "bg-emerald-600"
                    )}
                  >
                    {survives ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {year}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capital Infusions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Capital Infusions
            </CardTitle>
            <Button size="sm" onClick={addInfusion}>
              <Plus className="w-4 h-4 mr-1" />
              Add Raise
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {infusions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No capital raises planned</p>
              <p className="text-sm">Click "Add Raise" to model a funding round</p>
            </div>
          ) : (
            <div className="space-y-3">
              {infusions.map((infusion, idx) => (
                <div key={infusion.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground w-6">{idx + 1}</span>
                  
                  <Select
                    value={infusion.type}
                    onValueChange={(v) => updateInfusion(infusion.id, 'type', v)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INFUSION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      value={infusion.amount}
                      onChange={(e) => updateInfusion(infusion.id, 'amount', Number(e.target.value))}
                      className="pl-7"
                      placeholder="Amount"
                    />
                  </div>

                  <Select
                    value={infusion.month.toString()}
                    onValueChange={(v) => updateInfusion(infusion.id, 'month', parseInt(v))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, idx) => (
                        <SelectItem key={idx} value={(idx + 1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={infusion.year.toString()}
                    onValueChange={(v) => updateInfusion(infusion.id, 'year', parseInt(v))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={infusion.source || ''}
                    onChange={(e) => updateInfusion(infusion.id, 'source', e.target.value)}
                    placeholder="Source (optional)"
                    className="w-32"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInfusion(infusion.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Burn & Runway Controls */}
      <CollapsibleSliderSection
        title="Burn & Runway Controls"
        isOpen={sliderOpen}
        onToggle={() => setSliderOpen(!sliderOpen)}
      >
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {/* Burn Rate Change */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Label className="text-sm">Burn Rate Change</Label>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p>Models higher or lower burn due to hiring, pricing, or macro factors.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-medium">{settings.burnRateChangePercent >= 0 ? '+' : ''}{settings.burnRateChangePercent}%</span>
            </div>
            <Slider
              value={[settings.burnRateChangePercent]}
              onValueChange={([v]) => onSettingsChange({ ...settings, burnRateChangePercent: v })}
              min={-50}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">Total monthly cash consumption.</p>
          </div>

          {/* OpEx Compression */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Label className="text-sm">OpEx Compression</Label>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p>Simulates company-wide cost reductions or automation efficiencies.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-medium">-{settings.opexCompression}%</span>
            </div>
            <Slider
              value={[settings.opexCompression]}
              onValueChange={([v]) => onSettingsChange({ ...settings, opexCompression: v })}
              min={0}
              max={40}
              step={5}
            />
            <p className="text-xs text-muted-foreground">Models reduced operational spend.</p>
          </div>

          {/* Revenue Shock */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Label className="text-sm">Revenue Shock</Label>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p>Stress-test scenario for sudden revenue decline.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-medium text-red-600">-{settings.revenueShock}%</span>
            </div>
            <Slider
              value={[settings.revenueShock]}
              onValueChange={([v]) => onSettingsChange({ ...settings, revenueShock: v })}
              min={0}
              max={50}
              step={5}
            />
            <p className="text-xs text-muted-foreground">Simulate sudden revenue decreases.</p>
          </div>

          {/* Cash-to-EBITDA Conversion */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Label className="text-sm">Cash-to-EBITDA Conversion</Label>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p>How much EBITDA converts to actual cash inflows.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-medium">{settings.cashToEbitdaConversion}%</span>
            </div>
            <Slider
              value={[settings.cashToEbitdaConversion]}
              onValueChange={([v]) => onSettingsChange({ ...settings, cashToEbitdaConversion: v })}
              min={50}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">Percentage of positive EBITDA that becomes cash.</p>
          </div>

          {/* Hiring Freeze Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Label className="text-sm">Hiring Freeze</Label>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p>Pauses planned headcount growth to reduce future expenses.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={settings.hiringFreezeEnabled}
                onCheckedChange={(v) => onSettingsChange({ ...settings, hiringFreezeEnabled: v })}
              />
            </div>
            <p className="text-xs text-muted-foreground">Stops all planned hiring to slow burn.</p>
          </div>
        </div>
      </CollapsibleSliderSection>

      {/* Monthly Cash Burn Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Monthly Cash Forecast (First 12 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Month</th>
                  {MONTHS.map(m => (
                    <th key={m} className="text-right py-2 px-2 font-medium text-muted-foreground">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-2 px-2 font-medium">Burn</td>
                  {outputs.monthlyBurn.slice(0, 12).map((burn, i) => (
                    <td key={i} className="py-2 px-2 text-right text-red-600">({formatCurrency(burn)})</td>
                  ))}
                </tr>
                <tr className="bg-muted/30">
                  <td className="py-2 px-2 font-semibold">Cash Balance</td>
                  {outputs.cashBalanceByMonth.slice(0, 12).map((cash, i) => (
                    <td key={i} className={cn(
                      "py-2 px-2 text-right font-semibold",
                      cash < settings.minimumCashTarget ? "text-red-600" : "text-emerald-600"
                    )}>
                      {formatCurrency(cash)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          
          {outputs.runwayMonths < 12 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Warning: Cash runway is less than 12 months. Consider a capital raise or cost reduction.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Capital Summary Card for Financial Statements (read-only)
export interface CapitalSummaryData {
  settings: CapitalSettings;
  infusions: CapitalInfusion[];
  outputs: CapitalOutputs;
  forecastMode: 'ai' | 'custom';
  years: number[];
}

export function CFOCapitalSummaryCard({ data }: { data: CapitalSummaryData }) {
  const { settings, infusions, outputs, forecastMode, years } = data;

  const totalInfusions = infusions.reduce((sum, inf) => sum + inf.amount, 0);
  const cashAfterInfusions = settings.startingCash + totalInfusions;

  // Ending cash per year
  const endingCashByYear = years.map((_, i) => {
    const monthIdx = (i + 1) * 12 - 1;
    return outputs.cashBalanceByMonth[monthIdx] || 0;
  });

  // Sort infusions chronologically
  const sortedInfusions = [...infusions].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TYPE_LABELS: Record<string, string> = {
    seed: 'Seed',
    safe: 'SAFE',
    convertible: 'Conv. Note',
    equity: 'Equity',
    grant: 'Grant',
  };

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            Capital & Runway Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {settings.scenario === 'base' && 'Base'}
              {settings.scenario === 'best' && 'Growth'}
              {settings.scenario === 'worst' && 'Aggressive'}
            </Badge>
            <Badge variant="secondary">
              {forecastMode === 'ai' ? 'AI Forecast' : 'Custom Mode'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cash Position */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Cash Position</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground"></th>
                {years.map(year => (
                  <th key={year} className="text-right py-2 font-medium text-muted-foreground">{year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2">Starting Cash</td>
                <td className="py-2 text-right">{formatCurrency(settings.startingCash)}</td>
                <td className="py-2 text-right">{formatCurrency(endingCashByYear[0])}</td>
                <td className="py-2 text-right">{formatCurrency(endingCashByYear[1])}</td>
              </tr>
              <tr className="border-b hover:bg-muted/30">
                <td className="py-2">+ Capital Infusions</td>
                <td className="py-2 text-right text-emerald-600">+{formatCurrency(infusions.filter(i => i.year === years[0]).reduce((s, i) => s + i.amount, 0))}</td>
                <td className="py-2 text-right text-emerald-600">+{formatCurrency(infusions.filter(i => i.year === years[1]).reduce((s, i) => s + i.amount, 0))}</td>
                <td className="py-2 text-right text-emerald-600">+{formatCurrency(infusions.filter(i => i.year === years[2]).reduce((s, i) => s + i.amount, 0))}</td>
              </tr>
              <tr className="bg-muted/30 font-semibold">
                <td className="py-2">Ending Cash</td>
                {endingCashByYear.map((cash, i) => (
                  <td key={i} className={cn("py-2 text-right", cash > 0 ? "text-emerald-600" : "text-red-600")}>
                    {formatCurrency(cash)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Burn & Runway */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Burn & Runway</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Avg Monthly Burn</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(outputs.monthlyBurn.reduce((a, b) => a + b, 0) / 36)}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Cash Runway</p>
              <p className={cn(
                "text-lg font-bold",
                outputs.runwayMonths >= 18 ? "text-emerald-600" : outputs.runwayMonths >= 12 ? "text-amber-600" : "text-red-600"
              )}>
                {outputs.runwayMonths} months
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Runway Ends</p>
              <p className="text-lg font-bold">
                {outputs.runwayMonths >= 36 ? 'Beyond Y3' : outputs.nextRaiseDate || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Capital Events Timeline */}
        {sortedInfusions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Capital Events Timeline</h4>
            <div className="space-y-2">
              {sortedInfusions.map((inf) => (
                <div key={inf.id} className="flex items-center gap-3 p-2 bg-muted/20 rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground w-20">{MONTHS_SHORT[inf.month - 1]} {inf.year}</span>
                  <Badge variant="outline">{TYPE_LABELS[inf.type] || inf.type}</Badge>
                  <span className="text-sm font-semibold text-emerald-600">{formatCurrency(inf.amount)}</span>
                  {inf.source && <span className="text-xs text-muted-foreground">({inf.source})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
