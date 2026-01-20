import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Shield, DollarSign, TrendingUp } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateInsuranceNeeds, InsuranceNeedsResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('insurance_needs_estimator')!;

const SAMPLE_RESULTS: InsuranceNeedsResult = {
  recommendedTotalCoverage: 650000,
  additionalCoverageNeeded: 250000,
};

export default function InsuranceNeedsCalculator() {
  const [annualIncome, setAnnualIncome] = useState<number>(75000);
  const [yearsOfIncomeReplacement, setYearsOfIncomeReplacement] = useState<number>(10);
  const [outstandingDebt, setOutstandingDebt] = useState<number>(15000);
  const [mortgageBalance, setMortgageBalance] = useState<number>(200000);
  const [currentCoverage, setCurrentCoverage] = useState<number>(400000);
  const [results, setResults] = useState<InsuranceNeedsResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleCalculate = () => {
    const result = calculateInsuranceNeeds({
      annualIncome,
      yearsOfIncomeReplacement,
      outstandingDebt,
      mortgageBalance,
      currentCoverage,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;
  const inputs = { annualIncome, yearsOfIncomeReplacement, outstandingDebt, mortgageBalance, currentCoverage };
  const outputs = displayResults ? { ...displayResults } : undefined;

  return (
    <CalculatorLayout
      calculatorId={config.id}
      title={config.title}
      description={config.description}
      icon={config.icon}
      iconColor={config.color}
      category={config.category}
      inputs={displayResults ? inputs : undefined}
      outputs={outputs}
      resultSummary={displayResults ? `Need: $${(displayResults.additionalCoverageNeeded / 1000).toFixed(0)}k more` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Calculate Your Insurance Needs
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualIncome">Annual Income</Label>
                <Input
                  id="annualIncome"
                  type="number"
                  min="0"
                  value={annualIncome || ''}
                  onChange={(e) => setAnnualIncome(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 75000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsReplace">Years of Income to Replace</Label>
                <Input
                  id="yearsReplace"
                  type="number"
                  min="1"
                  max="30"
                  value={yearsOfIncomeReplacement || ''}
                  onChange={(e) => setYearsOfIncomeReplacement(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debt">Outstanding Debt (excl. mortgage)</Label>
                <Input
                  id="debt"
                  type="number"
                  min="0"
                  value={outstandingDebt || ''}
                  onChange={(e) => setOutstandingDebt(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 15000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mortgage">Mortgage Balance</Label>
                <Input
                  id="mortgage"
                  type="number"
                  min="0"
                  value={mortgageBalance || ''}
                  onChange={(e) => setMortgageBalance(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 200000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current">Current Life Insurance Coverage</Label>
              <p className="text-sm text-muted-foreground">
                Include SGLI, VGLI, FEGLI, or any private policies.
              </p>
              <Input
                id="current"
                type="number"
                min="0"
                value={currentCoverage || ''}
                onChange={(e) => setCurrentCoverage(parseInt(e.target.value) || 0)}
                placeholder="e.g., 400000"
              />
            </div>

            <Button onClick={handleCalculate} size="lg" className="w-full">
              Calculate Insurance Needs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/20 dark:to-pink-900/10 border-pink-200 dark:border-pink-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-pink-600" />
                Your Insurance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Based on protecting {yearsOfIncomeReplacement} years of income and paying off debts.
              </p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Recommended</span>
                </div>
                <p className="text-3xl font-bold text-pink-600">
                  ${displayResults.recommendedTotalCoverage.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total coverage needed</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Additional Needed</span>
                </div>
                <p className={`text-3xl font-bold ${displayResults.additionalCoverageNeeded > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  ${displayResults.additionalCoverageNeeded.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {displayResults.additionalCoverageNeeded > 0 ? 'Gap to fill' : 'You\'re covered!'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-pink-200 bg-pink-50/50 dark:border-pink-800 dark:bg-pink-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> When transitioning from SGLI, you have 240 days to convert to VGLI without a health exam.
                Compare VGLI, FEGLI, and private term policies for the best rates.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
