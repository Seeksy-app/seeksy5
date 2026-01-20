import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { motion } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  Users,
  TrendingUp,
  Bot,
  RefreshCw,
  Database,
} from 'lucide-react';

export default function BoardROICalculator() {
  const { isDemo } = useBoardDataMode();
  const { getEffectiveValue, cfoOverrideCount, rdCount } = useCFOAssumptions();

  // Initialize from CFO assumptions
  const defaultCac = getEffectiveValue('creator_cac_paid', 45);
  const defaultArpu = getEffectiveValue('pro_arpu', 29);
  const defaultChurn = getEffectiveValue('creator_monthly_churn_rate', 5);

  // Input state - seeded from CFO assumptions
  const [monthlyBudget, setMonthlyBudget] = useState(10000);
  const [cac, setCac] = useState(defaultCac);
  const [arpu, setArpu] = useState(defaultArpu);
  const [churnRate, setChurnRate] = useState(defaultChurn);
  const [timeHorizon, setTimeHorizon] = useState(12);

  // Sync with CFO assumptions when they load
  useEffect(() => {
    setCac(defaultCac);
    setArpu(defaultArpu);
    setChurnRate(defaultChurn);
  }, [defaultCac, defaultArpu, defaultChurn]);

  // Calculations
  const newCustomersPerMonth = Math.floor(monthlyBudget / cac);
  const ltv = arpu * (1 / (churnRate / 100));
  const ltvCacRatio = (ltv / cac).toFixed(2);
  const totalCustomersYear = newCustomersPerMonth * timeHorizon;
  const totalRevenue = totalCustomersYear * ltv;
  const totalCost = monthlyBudget * timeHorizon;
  const netROI = ((totalRevenue - totalCost) / totalCost * 100).toFixed(1);
  const paybackMonths = (cac / arpu).toFixed(1);

  const handleAskAI = () => {
    const prompt = `Analyze these ROI assumptions and suggest 2–3 key insights to present to the Board.

ROI Scenario for Seeksy:
- Monthly Budget: $${monthlyBudget.toLocaleString()}
- CAC: $${cac}
- ARPU: $${arpu}/mo
- Churn Rate: ${churnRate}%
- Time Horizon: ${timeHorizon} months

Calculated Results:
- LTV/CAC Ratio: ${ltvCacRatio}x
- Net ROI: ${netROI}%
- Payback Period: ${paybackMonths} months
- New Customers/Month: ${newCustomersPerMonth}
- Customer LTV: $${Math.round(ltv).toLocaleString()}

Provide insights on:
1. Is this ROI sustainable?
2. What levers should we pull to improve?
3. Industry benchmarks comparison`;

    // Dispatch event to open Spark panel with pre-filled prompt
    window.dispatchEvent(new CustomEvent('openSparkChat', { 
      detail: { prompt } 
    }));
  };

  const resetDefaults = () => {
    setMonthlyBudget(10000);
    setCac(50);
    setArpu(35);
    setChurnRate(4);
    setTimeHorizon(12);
  };

  return (
    <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ROI Calculator</h1>
            <p className="text-sm text-slate-500 mt-1">
              Model customer acquisition ROI and unit economics
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDemo && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Demo mode
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={resetDefaults} className="gap-1.5">
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                Input Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Monthly Marketing Budget</span>
                  <span className="text-sm font-medium text-slate-900">${monthlyBudget.toLocaleString()}</span>
                </Label>
                <Slider
                  value={[monthlyBudget]}
                  onValueChange={([v]) => setMonthlyBudget(v)}
                  min={1000}
                  max={100000}
                  step={1000}
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Customer Acquisition Cost (CAC)</span>
                  <span className="text-sm font-medium text-slate-900">${cac}</span>
                </Label>
                <Slider
                  value={[cac]}
                  onValueChange={([v]) => setCac(v)}
                  min={10}
                  max={200}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Average Revenue Per User (ARPU)</span>
                  <span className="text-sm font-medium text-slate-900">${arpu}/mo</span>
                </Label>
                <Slider
                  value={[arpu]}
                  onValueChange={([v]) => setArpu(v)}
                  min={5}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Monthly Churn Rate</span>
                  <span className="text-sm font-medium text-slate-900">{churnRate}%</span>
                </Label>
                <Slider
                  value={[churnRate]}
                  onValueChange={([v]) => setChurnRate(v)}
                  min={1}
                  max={20}
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Time Horizon</span>
                  <span className="text-sm font-medium text-slate-900">{timeHorizon} months</span>
                </Label>
                <Slider
                  value={[timeHorizon]}
                  onValueChange={([v]) => setTimeHorizon(v)}
                  min={3}
                  max={36}
                  step={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-500">Net ROI</p>
                  <p className={`text-4xl font-bold ${Number(netROI) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netROI}%
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white/80 rounded-lg">
                    <p className="text-xs text-slate-500">LTV/CAC Ratio</p>
                    <p className={`text-xl font-bold ${Number(ltvCacRatio) >= 3 ? 'text-emerald-600' : Number(ltvCacRatio) >= 2 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {ltvCacRatio}x
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/80 rounded-lg">
                    <p className="text-xs text-slate-500">Payback Period</p>
                    <p className="text-xl font-bold text-slate-900">{paybackMonths} mo</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'New Customers/Month', value: newCustomersPerMonth.toLocaleString(), icon: Users },
                { label: 'Customer LTV', value: `$${Math.round(ltv).toLocaleString()}`, icon: DollarSign },
                { label: 'Total Customers (Year)', value: totalCustomersYear.toLocaleString(), icon: Users },
                { label: 'Total Revenue', value: `$${Math.round(totalRevenue).toLocaleString()}`, icon: TrendingUp },
              ].map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="border-slate-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{metric.label}</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900">{metric.value}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <Button
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={handleAskAI}
            >
              <Bot className="w-4 h-4" />
              Analyze with Board AI
            </Button>
          </div>
        </div>

        {/* Benchmark Note */}
        <Card className="border-slate-200 shadow-sm bg-slate-50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Database className="w-4 h-4" />
              <span>Using {cfoOverrideCount} CFO assumptions and {rdCount} R&D benchmarks</span>
            </div>
            <p className="text-sm text-slate-600">
              <strong>Industry Benchmarks:</strong> SaaS companies typically target LTV/CAC ratio of 3:1 or higher.
              Payback period under 12 months is considered healthy. Churn rates below 5% monthly indicate strong retention.
            </p>
          </CardContent>
        </Card>
    </div>
  );
}