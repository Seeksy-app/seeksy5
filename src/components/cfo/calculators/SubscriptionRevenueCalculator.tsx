import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { RefreshCw, Save, CreditCard, Info } from 'lucide-react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { CFO_ASSUMPTIONS_SCHEMA } from '@/lib/cfo-assumptions-schema';

interface Props {
  onSave?: (data?: Record<string, any>) => void;
}

const SCHEMA = CFO_ASSUMPTIONS_SCHEMA.subscriptions;
const GROWTH_SCHEMA = CFO_ASSUMPTIONS_SCHEMA.growth;

export function SubscriptionRevenueCalculator({ onSave }: Props) {
  const { getEffectiveValue, saveMultipleAssumptions, isSaving } = useCFOAssumptions();

  // Input state with canonical schema defaults
  const [activeCreators, setActiveCreators] = useState(2400);
  const [freePct, setFreePct] = useState(60);
  const [proPct, setProPct] = useState(25);
  const [businessPct, setBusinessPct] = useState(10);
  const [enterprisePct, setEnterprisePct] = useState(5);
  const [monthlyGrowth, setMonthlyGrowth] = useState(GROWTH_SCHEMA.monthly_creator_growth_rate.default);
  const [upgradeRate, setUpgradeRate] = useState(SCHEMA.free_to_pro_conversion_rate.default);
  
  // Tier pricing from schema
  const [pricePro, setPricePro] = useState(SCHEMA.pro_arpu.default);
  const [priceBusiness, setPriceBusiness] = useState(SCHEMA.business_arpu.default);
  const [priceEnterprise, setPriceEnterprise] = useState(SCHEMA.enterprise_arpu.default);

  // Load saved values - only run once on mount
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized) return;
    const savedGrowth = getEffectiveValue('monthly_creator_growth_rate');
    const savedUpgrade = getEffectiveValue('free_to_pro_conversion_rate');
    const savedPro = getEffectiveValue('pro_arpu');
    const savedBusiness = getEffectiveValue('business_arpu');
    const savedEnterprise = getEffectiveValue('enterprise_arpu');
    
    if (savedGrowth) setMonthlyGrowth(savedGrowth);
    if (savedUpgrade) setUpgradeRate(savedUpgrade);
    if (savedPro) setPricePro(savedPro);
    if (savedBusiness) setPriceBusiness(savedBusiness);
    if (savedEnterprise) setPriceEnterprise(savedEnterprise);
    setInitialized(true);
  }, [getEffectiveValue, initialized]);

  // Calculations
  const freeCount = Math.round(activeCreators * (freePct / 100));
  const proCount = Math.round(activeCreators * (proPct / 100));
  const businessCount = Math.round(activeCreators * (businessPct / 100));
  const enterpriseCount = Math.round(activeCreators * (enterprisePct / 100));

  const monthlyProRevenue = proCount * pricePro;
  const monthlyBusinessRevenue = businessCount * priceBusiness;
  const monthlyEnterpriseRevenue = enterpriseCount * priceEnterprise;
  const totalMRR = monthlyProRevenue + monthlyBusinessRevenue + monthlyEnterpriseRevenue;

  // 3-year projection with growth
  const year1Revenue = totalMRR * 12 * (1 + (monthlyGrowth * 6) / 100);
  const year2Revenue = year1Revenue * (1 + monthlyGrowth / 100) ** 12;
  const year3Revenue = year2Revenue * (1 + monthlyGrowth / 100) ** 12;

  const handleReset = () => {
    setActiveCreators(2400);
    setFreePct(60);
    setProPct(25);
    setBusinessPct(10);
    setEnterprisePct(5);
    setMonthlyGrowth(GROWTH_SCHEMA.monthly_creator_growth_rate.default);
    setUpgradeRate(SCHEMA.free_to_pro_conversion_rate.default);
    setPricePro(SCHEMA.pro_arpu.default);
    setPriceBusiness(SCHEMA.business_arpu.default);
    setPriceEnterprise(SCHEMA.enterprise_arpu.default);
  };

  const handleSave = () => {
    saveMultipleAssumptions([
      { metric_key: 'monthly_creator_growth_rate', value: monthlyGrowth },
      { metric_key: 'free_to_pro_conversion_rate', value: upgradeRate },
      { metric_key: 'pro_arpu', value: pricePro },
      { metric_key: 'business_arpu', value: priceBusiness },
      { metric_key: 'enterprise_arpu', value: priceEnterprise },
    ]);
    onSave?.({
      activeCreators,
      freePct, proPct, businessPct, enterprisePct,
      pricePro, priceBusiness, priceEnterprise,
      monthlyGrowth, upgradeRate,
      totalMRR,
      year1Revenue, year2Revenue, year3Revenue,
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Calculate total tier percentage for validation display
  const tierTotal = freePct + proPct + businessPct + enterprisePct;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              Subscription Revenue Calculator
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust tier mix and pricing to see their impact on MRR and 3-year subscription revenue.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            MRR Model
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Active Creators Today</span>
                <span className="text-sm font-medium text-foreground">{activeCreators.toLocaleString()}</span>
              </Label>
              <Slider
                value={[activeCreators]}
                onValueChange={([v]) => setActiveCreators(v)}
                min={100}
                max={100000}
                step={100}
              />
            </div>

            {/* Tier Mix Section */}
            <div className="p-3 bg-muted rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tier Mix</span>
                <span className={`text-xs ${tierTotal === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  Total: {tierTotal}%
                </span>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center justify-between text-sm">
                  <span>Free ($0/mo)</span>
                  <span className="font-medium">{freePct}%</span>
                </Label>
                <Slider
                  value={[freePct]}
                  onValueChange={([v]) => setFreePct(v)}
                  min={0}
                  max={95}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between text-sm">
                  <span>Pro (${pricePro}/mo)</span>
                  <span className="font-medium">{proPct}%</span>
                </Label>
                <Slider
                  value={[proPct]}
                  onValueChange={([v]) => setProPct(v)}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between text-sm">
                  <span>Business (${priceBusiness}/mo)</span>
                  <span className="font-medium">{businessPct}%</span>
                </Label>
                <Slider
                  value={[businessPct]}
                  onValueChange={([v]) => setBusinessPct(v)}
                  min={0}
                  max={30}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between text-sm">
                  <span>Enterprise (${priceEnterprise}/mo)</span>
                  <span className="font-medium">{enterprisePct}%</span>
                </Label>
                <Slider
                  value={[enterprisePct]}
                  onValueChange={([v]) => setEnterprisePct(v)}
                  min={0}
                  max={15}
                  step={1}
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-3 bg-blue-50 rounded-lg space-y-4">
              <span className="text-sm font-medium text-blue-900">Tier Pricing</span>
              
              <div className="space-y-2">
                <Label className="flex items-center justify-between text-sm">
                  <span>{SCHEMA.pro_arpu.label}</span>
                  <span className="font-medium">${pricePro}/mo</span>
                </Label>
                <Slider
                  value={[pricePro]}
                  onValueChange={([v]) => setPricePro(v)}
                  min={SCHEMA.pro_arpu.min}
                  max={SCHEMA.pro_arpu.max}
                  step={SCHEMA.pro_arpu.step}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between text-sm">
                  <span>{SCHEMA.business_arpu.label}</span>
                  <span className="font-medium">${priceBusiness}/mo</span>
                </Label>
                <Slider
                  value={[priceBusiness]}
                  onValueChange={([v]) => setPriceBusiness(v)}
                  min={SCHEMA.business_arpu.min}
                  max={SCHEMA.business_arpu.max}
                  step={SCHEMA.business_arpu.step}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center justify-between text-sm">
                  <span>{SCHEMA.enterprise_arpu.label}</span>
                  <span className="font-medium">${priceEnterprise}/mo</span>
                </Label>
                <Slider
                  value={[priceEnterprise]}
                  onValueChange={([v]) => setPriceEnterprise(v)}
                  min={SCHEMA.enterprise_arpu.min}
                  max={SCHEMA.enterprise_arpu.max}
                  step={SCHEMA.enterprise_arpu.step}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{GROWTH_SCHEMA.monthly_creator_growth_rate.label}</span>
                <span className="text-sm font-medium text-foreground">{monthlyGrowth}%</span>
              </Label>
              <Slider
                value={[monthlyGrowth]}
                onValueChange={([v]) => setMonthlyGrowth(v)}
                min={GROWTH_SCHEMA.monthly_creator_growth_rate.min}
                max={GROWTH_SCHEMA.monthly_creator_growth_rate.max}
                step={GROWTH_SCHEMA.monthly_creator_growth_rate.step}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{SCHEMA.free_to_pro_conversion_rate.label}</span>
                <span className="text-sm font-medium text-foreground">{upgradeRate}%</span>
              </Label>
              <Slider
                value={[upgradeRate]}
                onValueChange={([v]) => setUpgradeRate(v)}
                min={SCHEMA.free_to_pro_conversion_rate.min}
                max={SCHEMA.free_to_pro_conversion_rate.max}
                step={SCHEMA.free_to_pro_conversion_rate.step}
              />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Current MRR</p>
                  <p className="text-4xl font-bold text-emerald-600">
                    {formatCurrency(totalMRR)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white/80 rounded-lg">
                    <p className="text-xs text-muted-foreground">Pro</p>
                    <p className="text-sm font-bold">{formatCurrency(monthlyProRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{proCount} users</p>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg">
                    <p className="text-xs text-muted-foreground">Business</p>
                    <p className="text-sm font-bold">{formatCurrency(monthlyBusinessRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{businessCount} users</p>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg">
                    <p className="text-xs text-muted-foreground">Enterprise</p>
                    <p className="text-sm font-bold">{formatCurrency(monthlyEnterpriseRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{enterpriseCount} users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Year 1', value: formatCurrency(year1Revenue) },
                { label: 'Year 2', value: formatCurrency(year2Revenue) },
                { label: 'Year 3', value: formatCurrency(year3Revenue) },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-3 bg-muted rounded-lg text-center"
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-800">Free Users</span>
                <span className="font-medium text-amber-900">{freeCount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                {upgradeRate}% upgrade rate = {Math.round(freeCount * upgradeRate / 100)} potential converts/mo
              </p>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg">
              <Info className="w-4 h-4 text-emerald-600 mt-0.5" />
              <p className="text-sm text-emerald-800">
                These values are saved as CFO assumptions and used by the AI Pro Forma.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="w-4 h-4 mr-2" />
            Save to Pro Forma
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
