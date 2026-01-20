import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calculator, DollarSign, Users, Calendar } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateVACompensation, VACompensationResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('va_compensation_estimator')!;

const SAMPLE_RESULTS: VACompensationResult = {
  estimatedMonthlyCompensation: 2013.01,
  dependencyBreakdown: 'Married veteran rate, 2 child(ren)',
  annualCompensation: 24156.12,
};

export default function VACompensationCalculator() {
  const [formData, setFormData] = useState({
    combinedRating: '',
    maritalStatus: '',
    hasDependentParents: false,
    childCount: '',
  });
  const [results, setResults] = useState<VACompensationResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const result = calculateVACompensation({
      combinedRating: parseInt(formData.combinedRating),
      maritalStatus: formData.maritalStatus as 'Single' | 'Married',
      hasDependentParents: formData.hasDependentParents,
      childCount: parseInt(formData.childCount) || 0,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  // Handle loading saved result
  const handleLoadSaved = useCallback((inputs: Record<string, any>, outputs: Record<string, any>) => {
    setFormData({
      combinedRating: inputs.combinedRating?.toString() || '',
      maritalStatus: inputs.maritalStatus || '',
      hasDependentParents: inputs.hasDependentParents || false,
      childCount: inputs.childCount?.toString() || '',
    });
    setResults(outputs as VACompensationResult);
  }, []);

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
      resultSummary={displayResults ? `$${displayResults.estimatedMonthlyCompensation.toLocaleString()}/mo` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
      onLoadSaved={handleLoadSaved}
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
                <Label htmlFor="combinedRating">Combined VA Rating (%)</Label>
                <Select value={formData.combinedRating} onValueChange={(v) => handleChange("combinedRating", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(r => (
                      <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Your official combined disability rating</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Select value={formData.maritalStatus} onValueChange={(v) => handleChange("maritalStatus", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="parents">Dependent Parent(s)?</Label>
                  <p className="text-sm text-muted-foreground">
                    Do you have parents who depend on you financially?
                  </p>
                </div>
                <Switch
                  id="parents"
                  checked={formData.hasDependentParents}
                  onCheckedChange={(v) => handleChange("hasDependentParents", v)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="childCount">Number of Dependent Children</Label>
                <Input
                  type="number"
                  id="childCount"
                  min="0"
                  max="10"
                  value={formData.childCount}
                  onChange={(e) => handleChange("childCount", e.target.value)}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">Children under 18 or in school</p>
              </div>

              <Button type="submit" size="lg" className="w-full">
                Calculate Compensation
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                Your Estimated VA Compensation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Based on 2024 VA compensation rates</p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Monthly Payment</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  ${displayResults.estimatedMonthlyCompensation.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Tax-free</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Annual Total</span>
                </div>
                <p className="text-3xl font-bold text-primary">
                  ${displayResults.annualCompensation.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Per year</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Rate Includes</span>
              </div>
              <p className="font-medium">{displayResults.dependencyBreakdown}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
