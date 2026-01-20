import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { 
  Building2, Users, DollarSign, TrendingDown, RefreshCw, Save, 
  Calculator, Percent, Server, CreditCard, Megaphone, Info
} from 'lucide-react';
import { useCFOExpenses } from '@/hooks/useCFOExpenses';
import { CFO_EXPENSES_SCHEMA, CATEGORY_LABELS, formatExpenseValue } from '@/lib/cfo-expenses-schema';

interface Props {
  onSave?: (data?: Record<string, any>) => void;
}

export function ExpenseCalculator({ onSave }: Props) {
  const { effectiveExpenses, summary, saveMultipleExpenses, isSaving, getExpenseValue } = useCFOExpenses();

  // Local state for all expenses
  const [localExpenses, setLocalExpenses] = useState<Record<string, number>>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize from saved values
  useEffect(() => {
    if (initialized) return;
    const initial: Record<string, number> = {};
    Object.keys(effectiveExpenses).forEach(key => {
      initial[key] = effectiveExpenses[key].value;
    });
    setLocalExpenses(initial);
    setInitialized(true);
  }, [effectiveExpenses, initialized]);

  const updateExpense = (key: string, value: number) => {
    setLocalExpenses(prev => ({ ...prev, [key]: value }));
  };

  // Calculate totals from local state
  const calculateLocalSummary = () => {
    let fixed = 0;
    let variable = 0;
    let marketing = 0;

    Object.entries(localExpenses).forEach(([key, value]) => {
      const expense = effectiveExpenses[key];
      if (expense?.unit === 'USD') {
        switch (expense.category) {
          case 'fixed': fixed += value; break;
          case 'variable': variable += value; break;
          case 'marketing': marketing += value; break;
        }
      }
    });

    return {
      fixedCosts: fixed,
      variableCosts: variable,
      marketingCosts: marketing,
      totalMonthly: fixed + variable + marketing,
      totalAnnual: (fixed + variable + marketing) * 12
    };
  };

  const localSummary = calculateLocalSummary();

  const handleReset = () => {
    const defaults: Record<string, number> = {};
    Object.values(CFO_EXPENSES_SCHEMA).flat().forEach(config => {
      defaults[config.key] = config.default;
    });
    setLocalExpenses(defaults);
  };

  const handleSave = () => {
    const updates = Object.entries(localExpenses).map(([key, value]) => ({
      expense_key: key,
      value
    }));
    saveMultipleExpenses(updates);
    onSave?.({
      ...localExpenses,
      ...localSummary,
    });
  };

  const categoryIcons = {
    fixed: Building2,
    variable: Server,
    marketing: Megaphone
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-rose-500" />
              Expense Engine
            </CardTitle>
            <CardDescription>
              Configure fixed, variable, and marketing costs for EBITDA and runway calculations
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
            Operating Expenses
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          {/* Left: Expense Inputs */}
          <div>
            <Tabs defaultValue="fixed" className="space-y-4">
              <TabsList className="bg-muted border border-border p-1">
                <TabsTrigger value="fixed" className="gap-2 data-[state=active]:bg-background">
                  <Building2 className="w-4 h-4" />
                  Fixed Costs
                </TabsTrigger>
                <TabsTrigger value="variable" className="gap-2 data-[state=active]:bg-background">
                  <Server className="w-4 h-4" />
                  Variable
                </TabsTrigger>
                <TabsTrigger value="marketing" className="gap-2 data-[state=active]:bg-background">
                  <Megaphone className="w-4 h-4" />
                  Marketing
                </TabsTrigger>
              </TabsList>

              {(['fixed', 'variable', 'marketing'] as const).map(category => (
                <TabsContent key={category} value={category} className="space-y-4">
                  {CFO_EXPENSES_SCHEMA[category].map(config => (
                    <div key={config.key} className="space-y-2">
                      <Label className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {config.label}
                          {config.unit === 'percent' && <Percent className="w-3 h-3 text-muted-foreground" />}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {formatExpenseValue(localExpenses[config.key] ?? config.default, config.unit)}
                          {config.isMonthly && config.unit === 'USD' && '/mo'}
                        </span>
                      </Label>
                      <Slider
                        value={[localExpenses[config.key] ?? config.default]}
                        onValueChange={([v]) => updateExpense(config.key, v)}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                      />
                      {config.description && (
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      )}
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-rose-50 to-orange-50 border-0">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Total Monthly Expenses</p>
                  <p className="text-4xl font-bold text-rose-600">
                    ${localSummary.totalMonthly.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ${localSummary.totalAnnual.toLocaleString()}/year
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {[
                { label: 'Fixed Costs', value: localSummary.fixedCosts, icon: Building2, color: 'text-blue-600' },
                { label: 'Variable Costs', value: localSummary.variableCosts, icon: Server, color: 'text-purple-600' },
                { label: 'Marketing', value: localSummary.marketingCosts, icon: Megaphone, color: 'text-emerald-600' },
              ].map((item, idx) => {
                const Icon = item.icon;
                const percentage = localSummary.totalMonthly > 0 
                  ? ((item.value / localSummary.totalMonthly) * 100).toFixed(0)
                  : 0;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          ${item.value.toLocaleString()}/mo
                        </p>
                        <p className="text-xs text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p><strong>Variable costs</strong> (% values) are applied to revenue during forecast generation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700">
            <Save className="w-4 h-4 mr-2" />
            Save to Pro Forma
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}