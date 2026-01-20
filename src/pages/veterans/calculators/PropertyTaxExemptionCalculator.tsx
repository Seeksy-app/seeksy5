import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, DollarSign, Percent, CheckCircle, ArrowRight } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('property_tax_exemption_calculator');

interface PropertyTaxResult {
  estimatedAnnualSavings: number;
  exemptionPercentage: number;
  qualifies: boolean;
  notes: string[];
}

const SAMPLE_RESULTS: PropertyTaxResult = {
  estimatedAnnualSavings: 4500,
  exemptionPercentage: 100,
  qualifies: true,
  notes: [
    '100% P&T rating qualifies for full property tax exemption in Texas',
    'Exemption applies to primary residence only',
    'Must file with county tax assessor',
  ],
};

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

function calculatePropertyTaxExemption(input: {
  state: string;
  homeValue: number;
  currentPropertyTax: number;
  vaDisabilityRating: number;
}): PropertyTaxResult {
  const { state, homeValue, currentPropertyTax, vaDisabilityRating } = input;
  
  const notes: string[] = [];
  let exemptionPercentage = 0;
  let qualifies = false;

  // Simplified exemption logic by state type
  if (vaDisabilityRating >= 100) {
    // Many states offer 100% exemption for P&T
    exemptionPercentage = 100;
    qualifies = true;
    notes.push(`With 100% VA rating, ${state} likely offers full property tax exemption`);
    notes.push('Exemption typically applies to primary residence only');
    notes.push('You may need to prove Permanent & Total (P&T) status');
  } else if (vaDisabilityRating >= 70) {
    exemptionPercentage = 50;
    qualifies = true;
    notes.push(`With ${vaDisabilityRating}% rating, you may qualify for partial exemption`);
    notes.push('Many states offer 25-75% exemption for ratings 50%+');
  } else if (vaDisabilityRating >= 50) {
    exemptionPercentage = 25;
    qualifies = true;
    notes.push('Partial property tax exemption may be available');
    notes.push('Check with your county tax assessor for specific amounts');
  } else {
    qualifies = false;
    notes.push('Most property tax exemptions require 50%+ VA disability rating');
    notes.push('Some states offer small exemptions for all veterans');
  }

  const estimatedAnnualSavings = currentPropertyTax * (exemptionPercentage / 100);
  notes.push('Must file application with county tax assessor');

  return {
    estimatedAnnualSavings: parseFloat(estimatedAnnualSavings.toFixed(2)),
    exemptionPercentage,
    qualifies,
    notes,
  };
}

export default function PropertyTaxExemptionCalculator() {
  const [state, setState] = useState<string>('TX');
  const [homeValue, setHomeValue] = useState<number>(350000);
  const [currentPropertyTax, setCurrentPropertyTax] = useState<number>(6000);
  const [vaDisabilityRating, setVaDisabilityRating] = useState<number>(100);
  const [results, setResults] = useState<PropertyTaxResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleCalculate = () => {
    const result = calculatePropertyTaxExemption({
      state,
      homeValue,
      currentPropertyTax,
      vaDisabilityRating,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;
  const inputs = { state, homeValue, currentPropertyTax, vaDisabilityRating };
  const outputs = displayResults ? { ...displayResults } : undefined;

  return (
    <CalculatorLayout
      calculatorId={config?.id || 'property_tax_exemption_calculator'}
      title={config?.title || 'Property Tax Exemption Calculator'}
      description={config?.description || 'Estimate property tax savings based on your VA disability rating.'}
      icon={config?.icon || 'Home'}
      iconColor={config?.color || 'text-green-500'}
      category={config?.category || 'Taxes'}
      inputs={displayResults ? inputs : undefined}
      outputs={outputs}
      resultSummary={displayResults ? `~$${displayResults.estimatedAnnualSavings.toLocaleString()}/year` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Estimate Property Tax Savings
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vaRating">VA Disability Rating (%)</Label>
                <Input
                  id="vaRating"
                  type="number"
                  min="0"
                  max="100"
                  step="10"
                  value={vaDisabilityRating || ''}
                  onChange={(e) => setVaDisabilityRating(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 100"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeValue">Home Value</Label>
                <Input
                  id="homeValue"
                  type="number"
                  min="0"
                  value={homeValue || ''}
                  onChange={(e) => setHomeValue(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 350000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyTax">Current Annual Property Tax</Label>
                <Input
                  id="propertyTax"
                  type="number"
                  min="0"
                  value={currentPropertyTax || ''}
                  onChange={(e) => setCurrentPropertyTax(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 6000"
                />
              </div>
            </div>

            <Button onClick={handleCalculate} size="lg" className="w-full">
              Calculate Exemption
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className={`bg-gradient-to-br ${displayResults.qualifies 
            ? 'from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800'
            : 'from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-6 h-6 text-green-600" />
                {displayResults.qualifies ? 'You May Qualify!' : 'Limited Eligibility'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Based on your {vaDisabilityRating}% VA rating in {state}.
              </p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Estimated Annual Savings</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  ${displayResults.estimatedAnnualSavings.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Per year</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Percent className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Exemption Level</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {displayResults.exemptionPercentage}%
                </p>
                <p className="text-sm text-muted-foreground">Of property tax</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Important Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {displayResults.notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {displayResults.qualifies ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0 mt-1" />
                    )}
                    <span className="text-sm">{note}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Next Step:</strong> Contact your county tax assessor's office to apply. 
                You'll typically need your VA rating letter and proof of homeownership. 
                Many counties allow online applications.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
