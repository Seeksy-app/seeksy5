import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, DollarSign, Calendar, TrendingDown } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateLeaveSellBack, LeaveSellBackResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('leave_sellback_calculator')!;

const SAMPLE_RESULTS: LeaveSellBackResult = {
  grossSellBackAmount: 4000,
  estimatedTaxes: 880,
  netSellBackAmount: 3120,
};

export default function LeaveSellBackCalculator() {
  const [formData, setFormData] = useState({
    unusedLeaveDays: '',
    basePayPerMonth: '',
    federalTaxRate: '',
  });
  const [results, setResults] = useState<LeaveSellBackResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const result = calculateLeaveSellBack({
      unusedLeaveDays: parseFloat(formData.unusedLeaveDays),
      basePayPerMonth: parseFloat(formData.basePayPerMonth),
      federalTaxRate: parseFloat(formData.federalTaxRate) || 22,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;

  return (
    <CalculatorLayout
      calculatorId={config.id}
      title={config.title}
      description={config.description}
      icon={config.icon}
      iconColor={config.color}
      category={config.category}
      inputs={displayResults ? formData : undefined}
      outputs={displayResults ? { ...displayResults } : undefined}
      resultSummary={displayResults ? `Net: $${displayResults.netSellBackAmount.toLocaleString()}` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Enter Your Leave Details
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="unusedLeaveDays">Unused Leave Days</Label>
                <Input
                  type="number"
                  id="unusedLeaveDays"
                  value={formData.unusedLeaveDays}
                  onChange={(e) => handleChange("unusedLeaveDays", e.target.value)}
                  placeholder="e.g., 45"
                  required
                />
                <p className="text-sm text-muted-foreground">Maximum of 60 days can be sold back</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePayPerMonth">Monthly Base Pay</Label>
                <Input
                  type="number"
                  id="basePayPerMonth"
                  value={formData.basePayPerMonth}
                  onChange={(e) => handleChange("basePayPerMonth", e.target.value)}
                  placeholder="e.g., 4000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="federalTaxRate">Estimated Federal Tax Rate (%)</Label>
                <Input
                  type="number"
                  id="federalTaxRate"
                  value={formData.federalTaxRate}
                  onChange={(e) => handleChange("federalTaxRate", e.target.value)}
                  placeholder="22"
                />
                <p className="text-sm text-muted-foreground">Default is 22% if left blank</p>
              </div>

              <Button type="submit" size="lg" className="w-full">
                Calculate Sell-Back
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-amber-600" />
                Your Leave Sell-Back Estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Based on current tax rates</p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Gross Amount</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  ${displayResults.grossSellBackAmount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Before taxes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingDown className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Est. Taxes</span>
                </div>
                <p className="text-2xl font-bold text-red-500">
                  -${displayResults.estimatedTaxes.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Net Amount</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${displayResults.netSellBackAmount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">You'll receive</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </CalculatorLayout>
  );
}
