import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calculator, DollarSign, TrendingUp, Percent } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateFERSPension, FERSPensionResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('fers_pension_estimator')!;

const SAMPLE_RESULTS: FERSPensionResult = {
  annualPension: 44000,
  monthlyPension: 3666.67,
  multiplierUsed: '1.1% per year',
};

export default function FERSPensionCalculator() {
  const [formData, setFormData] = useState({
    high3Salary: '',
    yearsOfService: '',
    retiringAt62PlusWith20: false,
  });
  const [results, setResults] = useState<FERSPensionResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const result = calculateFERSPension({
      high3Salary: parseFloat(formData.high3Salary),
      yearsOfService: parseFloat(formData.yearsOfService),
      retiringAt62PlusWith20: formData.retiringAt62PlusWith20,
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
      resultSummary={displayResults ? `$${displayResults.monthlyPension.toLocaleString()}/mo` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Enter Your Information
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="high3Salary">High-3 Average Salary</Label>
                <Input
                  type="number"
                  id="high3Salary"
                  value={formData.high3Salary}
                  onChange={(e) => handleChange("high3Salary", e.target.value)}
                  placeholder="e.g., 100000"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Average of your highest 3 consecutive years of salary
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsOfService">Years of Creditable Service</Label>
                <Input
                  type="number"
                  id="yearsOfService"
                  value={formData.yearsOfService}
                  onChange={(e) => handleChange("yearsOfService", e.target.value)}
                  placeholder="e.g., 25"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Include military buy-back time if applicable
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="age62">Age 62+ with 20+ Years?</Label>
                  <p className="text-sm text-muted-foreground">
                    This qualifies you for the higher 1.1% multiplier
                  </p>
                </div>
                <Switch
                  id="age62"
                  checked={formData.retiringAt62PlusWith20}
                  onCheckedChange={(v) => handleChange("retiringAt62PlusWith20", v)}
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Calculate Pension
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                Your FERS Pension Estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Calculated using the {displayResults.multiplierUsed} multiplier
              </p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Monthly</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  ${displayResults.monthlyPension.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Annual</span>
                </div>
                <p className="text-3xl font-bold text-primary">
                  ${displayResults.annualPension.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Percent className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Multiplier</span>
                </div>
                <p className="text-xl font-bold text-muted-foreground">
                  {displayResults.multiplierUsed}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </CalculatorLayout>
  );
}
