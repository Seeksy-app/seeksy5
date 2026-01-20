import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ClipboardCheck, Users, DollarSign, AlertCircle } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('va_health_means_test_tool')!;

interface VAMeansTestResult {
  approximatePriorityGroup: string;
  meansTestFlag: boolean;
  notes: string;
}

const SAMPLE_RESULTS: VAMeansTestResult = {
  approximatePriorityGroup: 'Group 5',
  meansTestFlag: true,
  notes: 'Based on income and household size, you may be in Priority Group 5. Service-connected veterans (Groups 1-3) receive priority enrollment regardless of income.',
};

// Simplified 2024 income thresholds (national average)
const INCOME_THRESHOLDS: Record<number, number> = {
  1: 38000,
  2: 45000,
  3: 52000,
  4: 59000,
  5: 66000,
  6: 73000,
};

function checkVAMeansTest(input: {
  householdIncome: number;
  householdSize: number;
  zipCode?: string;
  isServiceConnected: boolean;
}): VAMeansTestResult {
  const { householdIncome, householdSize, isServiceConnected } = input;
  
  if (isServiceConnected) {
    return {
      approximatePriorityGroup: 'Group 1-3 (Service-Connected)',
      meansTestFlag: false,
      notes: 'Veterans with service-connected disabilities are placed in Priority Groups 1-3 based on their rating. No financial means test is required. Higher ratings receive priority.',
    };
  }

  const threshold = INCOME_THRESHOLDS[Math.min(householdSize, 6)] || 73000;
  
  if (householdIncome <= threshold) {
    return {
      approximatePriorityGroup: 'Group 5 (Below Threshold)',
      meansTestFlag: true,
      notes: `Your household income appears to be below the national threshold of $${threshold.toLocaleString()} for a household of ${householdSize}. You may qualify for free or low-cost VA healthcare. Actual thresholds vary by location.`,
    };
  } else if (householdIncome <= threshold * 1.5) {
    return {
      approximatePriorityGroup: 'Group 7 (Above Threshold)',
      meansTestFlag: true,
      notes: 'Your income is above the basic threshold but may still qualify for VA healthcare with copays. Geographic income limits can be higher in expensive areas.',
    };
  } else {
    return {
      approximatePriorityGroup: 'Group 8 (High Income)',
      meansTestFlag: true,
      notes: 'Based on income, you may be in Priority Group 8 with standard copays. However, you should still apply—enrollment criteria can change, and previous combat service may provide additional benefits.',
    };
  }
}

export default function VAMeansTestCalculator() {
  const [householdIncome, setHouseholdIncome] = useState<number>(55000);
  const [householdSize, setHouseholdSize] = useState<number>(3);
  const [zipCode, setZipCode] = useState("");
  const [isServiceConnected, setIsServiceConnected] = useState(false);
  const [results, setResults] = useState<VAMeansTestResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleCalculate = () => {
    const result = checkVAMeansTest({
      householdIncome,
      householdSize,
      zipCode: zipCode || undefined,
      isServiceConnected,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;
  const inputs = { householdIncome, householdSize, zipCode, isServiceConnected };
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
      resultSummary={displayResults ? displayResults.approximatePriorityGroup : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                VA Healthcare Priority Screener
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="serviceConnected">Service-Connected Disability?</Label>
                <p className="text-sm text-muted-foreground">
                  Any VA-rated disability exempts you from income requirements.
                </p>
              </div>
              <Switch
                id="serviceConnected"
                checked={isServiceConnected}
                onCheckedChange={setIsServiceConnected}
              />
            </div>

            {!isServiceConnected && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="income">Annual Household Income</Label>
                    <Input
                      id="income"
                      type="number"
                      min="0"
                      value={householdIncome || ''}
                      onChange={(e) => setHouseholdIncome(parseInt(e.target.value) || 0)}
                      placeholder="e.g., 55000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Household Size</Label>
                    <Input
                      id="size"
                      type="number"
                      min="1"
                      max="10"
                      value={householdSize || ''}
                      onChange={(e) => setHouseholdSize(parseInt(e.target.value) || 1)}
                      placeholder="e.g., 3"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    For location-specific income limits.
                  </p>
                  <Input
                    id="zipCode"
                    type="text"
                    maxLength={5}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="e.g., 22030"
                  />
                </div>
              </>
            )}

            <Button onClick={handleCalculate} size="lg" className="w-full">
              Check Priority Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 dark:to-cyan-900/10 border-cyan-200 dark:border-cyan-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-6 h-6 text-cyan-600" />
                Estimated Priority Group
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-cyan-700 mb-2">
                {displayResults.approximatePriorityGroup}
              </p>
              <p className="text-muted-foreground">{displayResults.notes}</p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Household Size</span>
                </div>
                <p className="text-3xl font-bold">{householdSize}</p>
                <p className="text-sm text-muted-foreground">People in household</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Means Test</span>
                </div>
                <p className="text-3xl font-bold">
                  {displayResults.meansTestFlag ? 'Required' : 'Exempt'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {displayResults.meansTestFlag ? 'Income verification needed' : 'Service-connected'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> This is an estimate only. Actual priority group assignment 
                depends on many factors including combat service, special circumstances, and current VA 
                capacity. Apply for enrollment at VA.gov or your local VA facility.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
