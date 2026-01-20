import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, DollarSign, TrendingUp, PiggyBank } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateBRSComparison, BRSComparisonResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('brs_vs_legacy_comparison')!;

const SAMPLE_RESULTS: BRSComparisonResult = {
  legacyPensionEstimate: 42000,
  brsPensionEstimate: 33600,
  brsTspProjectedBalance: 485000,
  highLevelComparisonSummary: 'BRS appears more favorable when combining pension and TSP growth.',
};

export default function BRSComparisonCalculator() {
  const [yearsOfServiceAtSeparation, setYearsOfServiceAtSeparation] = useState<number>(20);
  const [basePayAtSeparation, setBasePayAtSeparation] = useState<number>(7000);
  const [tspContributionPercent, setTspContributionPercent] = useState<number>(5);
  const [expectedReturnRate, setExpectedReturnRate] = useState<number>(7);
  const [results, setResults] = useState<BRSComparisonResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleCalculate = () => {
    const result = calculateBRSComparison({
      yearsOfServiceAtSeparation,
      basePayAtSeparation,
      tspContributionPercent,
      expectedReturnRate,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;
  const inputs = { yearsOfServiceAtSeparation, basePayAtSeparation, tspContributionPercent, expectedReturnRate };
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
      resultSummary={displayResults ? `${yearsOfServiceAtSeparation} years comparison` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Compare BRS vs Legacy
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="years">Years of Service at Retirement</Label>
                <Input
                  id="years"
                  type="number"
                  min="0"
                  max="40"
                  value={yearsOfServiceAtSeparation || ''}
                  onChange={(e) => setYearsOfServiceAtSeparation(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePay">Base Pay at Separation (Monthly)</Label>
                <Input
                  id="basePay"
                  type="number"
                  min="0"
                  value={basePayAtSeparation || ''}
                  onChange={(e) => setBasePayAtSeparation(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 7000"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tspContrib">Your TSP Contribution (%)</Label>
                <p className="text-sm text-muted-foreground">
                  What percentage of base pay you contribute.
                </p>
                <Input
                  id="tspContrib"
                  type="number"
                  min="0"
                  max="100"
                  value={tspContributionPercent || ''}
                  onChange={(e) => setTspContributionPercent(parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnRate">Expected Annual TSP Return (%)</Label>
                <p className="text-sm text-muted-foreground">
                  Historical average is around 7%.
                </p>
                <Input
                  id="returnRate"
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  value={expectedReturnRate || ''}
                  onChange={(e) => setExpectedReturnRate(parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 7"
                />
              </div>
            </div>

            <Button onClick={handleCalculate} size="lg" className="w-full">
              Compare Systems
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-6 h-6 text-blue-600" />
                Retirement System Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{displayResults.highLevelComparisonSummary}</p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Legacy Pension</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  ${displayResults.legacyPensionEstimate.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Annual (2.5%/year)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">BRS Pension</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  ${displayResults.brsPensionEstimate.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Annual (2.0%/year)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <PiggyBank className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">BRS + TSP Balance</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  ${displayResults.brsTspProjectedBalance.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Projected at retirement</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Legacy provides a higher immediate pension but no TSP matching. BRS offers 
                5% matching and continuation pay, making it better for those who may leave before 20 years. 
                This is a simplified estimate—consult a financial advisor for personalized guidance.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
