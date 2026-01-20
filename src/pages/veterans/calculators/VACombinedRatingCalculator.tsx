import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Calculator, Shield, TrendingUp } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateVACombinedRating, VACombinedRatingResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('va_combined_rating')!;

const SAMPLE_RESULTS: VACombinedRatingResult = {
  combinedRatingPercent: 72.2,
  roundedCombinedRating: 70,
  bilateralFactorApplied: true,
  explanation: 'Using VA\'s "whole person" method, your combined rating is 72.2%, rounded to 70%.',
};

export default function VACombinedRatingCalculator() {
  const [ratings, setRatings] = useState<number[]>([0]);
  const [hasBilateralFactor, setHasBilateralFactor] = useState(false);
  const [results, setResults] = useState<VACombinedRatingResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const addRating = () => setRatings([...ratings, 0]);
  const removeRating = (index: number) => setRatings(ratings.filter((_, i) => i !== index));
  const updateRating = (index: number, value: number) => {
    const updated = [...ratings];
    updated[index] = Math.min(100, Math.max(0, value));
    setRatings(updated);
  };

  const handleCalculate = () => {
    const validRatings = ratings.filter(r => r > 0);
    if (validRatings.length === 0) return;
    
    const result = calculateVACombinedRating({
      ratings: validRatings,
      hasBilateralFactor,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;
  const inputs = { ratings: ratings.filter(r => r > 0), hasBilateralFactor };
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
      resultSummary={displayResults ? `Combined: ${displayResults.roundedCombinedRating}%` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Enter Your Ratings
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Individual Disability Ratings (%)</Label>
              <p className="text-sm text-muted-foreground">
                Enter each of your service-connected disability percentages. For example: 30, 20, 10.
              </p>
              
              {ratings.map((rating, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="10"
                    value={rating || ''}
                    onChange={(e) => updateRating(index, parseInt(e.target.value) || 0)}
                    placeholder="e.g., 30"
                    className="flex-1"
                  />
                  {ratings.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeRating(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={addRating} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Rating
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="bilateral">Bilateral Conditions?</Label>
                <p className="text-sm text-muted-foreground">
                  Check if you have conditions affecting both sides (e.g., both knees)
                </p>
              </div>
              <Switch
                id="bilateral"
                checked={hasBilateralFactor}
                onCheckedChange={setHasBilateralFactor}
              />
            </div>

            <Button onClick={handleCalculate} size="lg" className="w-full">
              Calculate Combined Rating
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-600" />
                Your Combined VA Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{displayResults.explanation}</p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Actual Combined</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{displayResults.combinedRatingPercent}%</p>
                <p className="text-sm text-muted-foreground">Before rounding</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Official Rating</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{displayResults.roundedCombinedRating}%</p>
                <p className="text-sm text-muted-foreground">Rounded to nearest 10%</p>
              </CardContent>
            </Card>
          </div>

          {displayResults.bilateralFactorApplied && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  ✓ Bilateral Factor Applied (+10%)
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </CalculatorLayout>
  );
}
