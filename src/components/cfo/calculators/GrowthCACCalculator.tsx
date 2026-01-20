import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Calculator, Users, DollarSign, TrendingUp, RefreshCw, Save, Info } from 'lucide-react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { CFO_ASSUMPTIONS_SCHEMA } from '@/lib/cfo-assumptions-schema';

interface Props {
  onSave?: (data?: Record<string, any>) => void;
}

const SCHEMA = CFO_ASSUMPTIONS_SCHEMA.growth;
const SUB_SCHEMA = CFO_ASSUMPTIONS_SCHEMA.subscriptions;

export function GrowthCACCalculator({ onSave }: Props) {
  const { getEffectiveValue, saveMultipleAssumptions, isSaving } = useCFOAssumptions();

  // Input state with canonical schema defaults
  const [monthlyBudget, setMonthlyBudget] = useState(10000);
  const [cac, setCac] = useState(SCHEMA.creator_cac_paid.default);
  const [arpu, setArpu] = useState(SUB_SCHEMA.pro_arpu.default);
  const [churnRate, setChurnRate] = useState(SCHEMA.creator_monthly_churn_rate.default);
  const [timeHorizon, setTimeHorizon] = useState(12);

  // Update from saved values when loaded - only run once on mount
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized) return;
    const savedCac = getEffectiveValue('creator_cac_paid');
    const savedArpu = getEffectiveValue('pro_arpu');
    const savedChurn = getEffectiveValue('creator_monthly_churn_rate');
    if (savedCac) setCac(savedCac);
    if (savedArpu) setArpu(savedArpu);
    if (savedChurn) setChurnRate(savedChurn);
    setInitialized(true);
  }, [getEffectiveValue, initialized]);

  // Calculations
  const newCustomersPerMonth = Math.floor(monthlyBudget / cac);
  const ltv = arpu * (1 / (churnRate / 100));
  const ltvCacRatio = (ltv / cac).toFixed(2);
  const paybackMonths = (cac / arpu).toFixed(1);
  const totalCustomersYear = newCustomersPerMonth * timeHorizon;
  const totalRevenue = totalCustomersYear * ltv;
  const totalCost = monthlyBudget * timeHorizon;
  const netROI = ((totalRevenue - totalCost) / totalCost * 100).toFixed(1);

  const handleReset = () => {
    setMonthlyBudget(10000);
    setCac(SCHEMA.creator_cac_paid.default);
    setArpu(SUB_SCHEMA.pro_arpu.default);
    setChurnRate(SCHEMA.creator_monthly_churn_rate.default);
    setTimeHorizon(12);
  };

  const handleSave = () => {
    saveMultipleAssumptions([
      { metric_key: 'creator_cac_paid', value: cac },
      { metric_key: 'pro_arpu', value: arpu },
      { metric_key: 'creator_monthly_churn_rate', value: churnRate },
    ]);
    onSave?.({
      monthlyBudget,
      cac,
      arpu,
      churnRate,
      timeHorizon,
      newCustomersPerMonth,
      ltv,
      ltvCacRatio,
      paybackMonths,
      totalCustomersYear,
      netROI,
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-500" />
              Growth & CAC Calculator
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust these sliders to update CFO assumptions. Click 'Save to Pro Forma' to apply them to all board forecasts.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Unit Economics
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Monthly Marketing Budget</span>
                <span className="text-sm font-medium text-foreground">${monthlyBudget.toLocaleString()}</span>
              </Label>
              <Slider
                value={[monthlyBudget]}
                onValueChange={([v]) => setMonthlyBudget(v)}
                min={1000}
                max={100000}
                step={1000}
              />
              <p className="text-xs text-muted-foreground">Total monthly spend on paid marketing across all channels.</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{SCHEMA.creator_cac_paid.label}</span>
                <span className="text-sm font-medium text-foreground">${cac}</span>
              </Label>
              <Slider
                value={[cac]}
                onValueChange={([v]) => setCac(v)}
                min={SCHEMA.creator_cac_paid.min}
                max={SCHEMA.creator_cac_paid.max}
                step={SCHEMA.creator_cac_paid.step}
              />
              <p className="text-xs text-muted-foreground">{SCHEMA.creator_cac_paid.description}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{SUB_SCHEMA.pro_arpu.label}</span>
                <span className="text-sm font-medium text-foreground">${arpu}/mo</span>
              </Label>
              <Slider
                value={[arpu]}
                onValueChange={([v]) => setArpu(v)}
                min={SUB_SCHEMA.pro_arpu.min}
                max={SUB_SCHEMA.pro_arpu.max}
                step={SUB_SCHEMA.pro_arpu.step}
              />
              <p className="text-xs text-muted-foreground">{SUB_SCHEMA.pro_arpu.description}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{SCHEMA.creator_monthly_churn_rate.label}</span>
                <span className="text-sm font-medium text-foreground">{churnRate}%</span>
              </Label>
              <Slider
                value={[churnRate]}
                onValueChange={([v]) => setChurnRate(v)}
                min={SCHEMA.creator_monthly_churn_rate.min}
                max={SCHEMA.creator_monthly_churn_rate.max}
                step={SCHEMA.creator_monthly_churn_rate.step}
              />
              <p className="text-xs text-muted-foreground">{SCHEMA.creator_monthly_churn_rate.description}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Time Horizon</span>
                <span className="text-sm font-medium text-foreground">{timeHorizon} months</span>
              </Label>
              <Slider
                value={[timeHorizon]}
                onValueChange={([v]) => setTimeHorizon(v)}
                min={3}
                max={36}
                step={1}
              />
              <p className="text-xs text-muted-foreground">How far out to model ROI and payback.</p>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Net ROI</p>
                  <p className={`text-4xl font-bold ${Number(netROI) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netROI}%
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white/80 rounded-lg">
                    <p className="text-xs text-muted-foreground">LTV/CAC Ratio</p>
                    <p className={`text-xl font-bold ${Number(ltvCacRatio) >= 3 ? 'text-emerald-600' : Number(ltvCacRatio) >= 2 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {ltvCacRatio}x
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/80 rounded-lg">
                    <p className="text-xs text-muted-foreground">Payback Period</p>
                    <p className={`text-xl font-bold ${Number(paybackMonths) <= 12 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {paybackMonths} mo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'New Customers/Month', value: newCustomersPerMonth.toLocaleString(), icon: Users },
                { label: 'Customer LTV', value: `$${Math.round(ltv).toLocaleString()}`, icon: DollarSign },
                { label: 'Total Customers', value: totalCustomersYear.toLocaleString(), icon: Users },
                { label: 'Total Revenue', value: `$${Math.round(totalRevenue).toLocaleString()}`, icon: TrendingUp },
              ].map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Icon className="w-3 h-3" />
                      <span className="text-xs">{metric.label}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{metric.value}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* KPI Explanations */}
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="space-y-1.5 text-sm">
                  <p className="text-blue-800"><strong>LTV/CAC:</strong> Target &gt;3x is considered healthy.</p>
                  <p className="text-blue-800"><strong>Payback period:</strong> Under 12 months is typically considered strong.</p>
                  <p className="text-blue-800"><strong>Churn:</strong> Below 5% monthly indicates strong retention.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benchmark & Actions */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Industry Benchmarks:</strong> SaaS companies target LTV/CAC of 3:1+. Payback under 12 months is healthy. Churn below 5% indicates strong retention.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save to Pro Forma
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
