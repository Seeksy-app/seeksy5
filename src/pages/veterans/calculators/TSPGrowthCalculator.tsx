import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, DollarSign, PiggyBank } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateTSPGrowth, TSPGrowthResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('tsp_growth_calculator')!;

const SAMPLE_RESULTS: TSPGrowthResult = {
  projectedBalanceAtRetirement: 892456.23,
  totalContributions: 420000,
  totalGrowth: 472456.23,
};

export default function TSPGrowthCalculator() {
  const [formData, setFormData] = useState({
    currentBalance: '',
    monthlyContribution: '',
    employerMatchPercent: '',
    annualReturnRate: '',
    yearsUntilRetirement: '',
  });
  const [results, setResults] = useState<TSPGrowthResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const result = calculateTSPGrowth({
      currentBalance: parseFloat(formData.currentBalance) || 0,
      monthlyContribution: parseFloat(formData.monthlyContribution),
      employerMatchPercent: parseFloat(formData.employerMatchPercent) || 0,
      annualReturnRate: parseFloat(formData.annualReturnRate),
      yearsUntilRetirement: parseFloat(formData.yearsUntilRetirement),
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
      resultSummary={displayResults ? `$${Math.round(displayResults.projectedBalanceAtRetirement).toLocaleString()}` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Enter Your TSP Details
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentBalance">Current TSP Balance (optional)</Label>
                <Input
                  type="number"
                  id="currentBalance"
                  value={formData.currentBalance}
                  onChange={(e) => handleChange("currentBalance", e.target.value)}
                  placeholder="e.g., 50000"
                />
                <p className="text-sm text-muted-foreground">Leave blank if starting fresh</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
                <Input
                  type="number"
                  id="monthlyContribution"
                  value={formData.monthlyContribution}
                  onChange={(e) => handleChange("monthlyContribution", e.target.value)}
                  placeholder="e.g., 500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employerMatchPercent">Employer Match (% of salary)</Label>
                <Input
                  type="number"
                  id="employerMatchPercent"
                  value={formData.employerMatchPercent}
                  onChange={(e) => handleChange("employerMatchPercent", e.target.value)}
                  placeholder="e.g., 5"
                />
                <p className="text-sm text-muted-foreground">Federal agencies typically match up to 5%</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualReturnRate">Expected Annual Return (%)</Label>
                <Input
                  type="number"
                  id="annualReturnRate"
                  value={formData.annualReturnRate}
                  onChange={(e) => handleChange("annualReturnRate", e.target.value)}
                  placeholder="e.g., 7"
                  required
                />
                <p className="text-sm text-muted-foreground">Historical average is around 7%</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsUntilRetirement">Years Until Retirement</Label>
                <Input
                  type="number"
                  id="yearsUntilRetirement"
                  value={formData.yearsUntilRetirement}
                  onChange={(e) => handleChange("yearsUntilRetirement", e.target.value)}
                  placeholder="e.g., 20"
                  required
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Calculate Growth
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-6 h-6 text-green-600" />
                Your TSP Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Based on your contribution schedule and expected returns</p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Projected Balance</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${displayResults.projectedBalanceAtRetirement.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">At retirement</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Your Contributions</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  ${displayResults.totalContributions.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Growth Earned</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  ${displayResults.totalGrowth.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </CalculatorLayout>
  );
}
