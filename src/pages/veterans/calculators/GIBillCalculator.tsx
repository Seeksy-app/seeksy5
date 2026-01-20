import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, DollarSign, BookOpen, Home } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateGIBill, GIBillResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('gi_bill_estimator')!;

const SAMPLE_RESULTS: GIBillResult = {
  tuitionCoveragePercent: 100,
  estimatedMonthlyHousingAllowance: 1800,
  booksStipendEstimate: 1000,
};

export default function GIBillCalculator() {
  const [serviceTimeMonths, setServiceTimeMonths] = useState<number>(36);
  const [schoolType, setSchoolType] = useState<'Public' | 'Private' | 'Foreign' | 'Online'>('Public');
  const [zipCode, setZipCode] = useState("");
  const [results, setResults] = useState<GIBillResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleCalculate = () => {
    const result = calculateGIBill({
      serviceTimeMonths,
      schoolType,
      zipCode: zipCode || undefined,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;
  const inputs = { serviceTimeMonths, schoolType, zipCode };
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
      resultSummary={displayResults ? `${displayResults.tuitionCoveragePercent}% coverage` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Estimate Your GI Bill Benefits
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serviceTime">Qualifying Active-Duty Months</Label>
              <p className="text-sm text-muted-foreground">
                Total months of qualifying active-duty service after 9/10/2001.
              </p>
              <Input
                id="serviceTime"
                type="number"
                min="0"
                value={serviceTimeMonths || ''}
                onChange={(e) => setServiceTimeMonths(parseInt(e.target.value) || 0)}
                placeholder="e.g., 36"
              />
            </div>

            <div className="space-y-2">
              <Label>School Type</Label>
              <p className="text-sm text-muted-foreground">
                Type of school you plan to attend.
              </p>
              <Select value={schoolType} onValueChange={(v) => setSchoolType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public School</SelectItem>
                  <SelectItem value="Private">Private School</SelectItem>
                  <SelectItem value="Foreign">Foreign School</SelectItem>
                  <SelectItem value="Online">Online Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">School ZIP Code (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                For a more accurate housing estimate.
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

            <Button onClick={handleCalculate} size="lg" className="w-full">
              Calculate Benefits
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-purple-600" />
                Your GI Bill Estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Based on {serviceTimeMonths} months of service attending a {schoolType.toLowerCase()} school.
              </p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Tuition Coverage</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">{displayResults.tuitionCoveragePercent}%</p>
                <p className="text-sm text-muted-foreground">Of eligible tuition</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Home className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Monthly Housing</span>
                </div>
                <p className="text-3xl font-bold text-green-600">${displayResults.estimatedMonthlyHousingAllowance.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">E-5 BAH estimate</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Books & Supplies</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">${displayResults.booksStipendEstimate.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Annual stipend</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> These are estimates based on 2024 rates. Actual benefits depend on your specific service history and enrollment status.
                Online-only students receive 50% of the housing allowance.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
