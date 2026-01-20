import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MapPin, DollarSign, Home, CheckCircle } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('state_tax_benefits_calculator')!;

interface StateTaxResult {
  estimatedIncomeTaxSavings: number;
  propertyTaxBenefitFlag: boolean;
  benefitsSummary: string[];
}

const SAMPLE_RESULTS: StateTaxResult = {
  estimatedIncomeTaxSavings: 3500,
  propertyTaxBenefitFlag: true,
  benefitsSummary: [
    'Texas has no state income tax on any income',
    'Property tax exemptions available for disabled veterans',
    '100% P&T rating = full property tax exemption',
  ],
};

// Simplified state tax info
const STATE_TAX_INFO: Record<string, { hasIncomeTax: boolean; exemptsMilitaryRetirement: boolean; hasVetPropertyExemption: boolean }> = {
  'TX': { hasIncomeTax: false, exemptsMilitaryRetirement: true, hasVetPropertyExemption: true },
  'FL': { hasIncomeTax: false, exemptsMilitaryRetirement: true, hasVetPropertyExemption: true },
  'NV': { hasIncomeTax: false, exemptsMilitaryRetirement: true, hasVetPropertyExemption: true },
  'WA': { hasIncomeTax: false, exemptsMilitaryRetirement: true, hasVetPropertyExemption: true },
  'TN': { hasIncomeTax: false, exemptsMilitaryRetirement: true, hasVetPropertyExemption: true },
  'VA': { hasIncomeTax: true, exemptsMilitaryRetirement: false, hasVetPropertyExemption: true },
  'CA': { hasIncomeTax: true, exemptsMilitaryRetirement: false, hasVetPropertyExemption: true },
  'NY': { hasIncomeTax: true, exemptsMilitaryRetirement: false, hasVetPropertyExemption: true },
  'NC': { hasIncomeTax: true, exemptsMilitaryRetirement: true, hasVetPropertyExemption: true },
  'GA': { hasIncomeTax: true, exemptsMilitaryRetirement: true, hasVetPropertyExemption: true },
};

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

function calculateStateTaxBenefits(input: {
  state: string;
  annualMilitaryRetirementIncome: number;
  vaDisabilityRating: number;
  isPropertyOwner: boolean;
}): StateTaxResult {
  const { state, annualMilitaryRetirementIncome, vaDisabilityRating, isPropertyOwner } = input;
  
  const stateInfo = STATE_TAX_INFO[state] || { hasIncomeTax: true, exemptsMilitaryRetirement: false, hasVetPropertyExemption: true };
  const benefitsSummary: string[] = [];
  let estimatedIncomeTaxSavings = 0;

  // Income tax savings
  if (!stateInfo.hasIncomeTax) {
    benefitsSummary.push(`${state} has no state income tax`);
    estimatedIncomeTaxSavings = annualMilitaryRetirementIncome * 0.05; // Estimate ~5% savings
  } else if (stateInfo.exemptsMilitaryRetirement) {
    benefitsSummary.push(`${state} exempts military retirement pay from state income tax`);
    estimatedIncomeTaxSavings = annualMilitaryRetirementIncome * 0.04;
  } else {
    benefitsSummary.push(`${state} taxes military retirement pay as regular income`);
  }

  // VA disability is always tax-free
  if (vaDisabilityRating > 0) {
    benefitsSummary.push('VA disability compensation is always federal and state tax-free');
  }

  // Property tax
  const propertyTaxBenefitFlag = isPropertyOwner && stateInfo.hasVetPropertyExemption;
  if (propertyTaxBenefitFlag) {
    if (vaDisabilityRating >= 100) {
      benefitsSummary.push('100% VA rating may qualify for full property tax exemption');
    } else if (vaDisabilityRating >= 50) {
      benefitsSummary.push('50%+ VA rating may qualify for partial property tax exemption');
    } else {
      benefitsSummary.push('Property tax exemptions may be available for veterans');
    }
  }

  return {
    estimatedIncomeTaxSavings: parseFloat(estimatedIncomeTaxSavings.toFixed(2)),
    propertyTaxBenefitFlag,
    benefitsSummary,
  };
}

export default function StateTaxBenefitsCalculator() {
  const [state, setState] = useState<string>('TX');
  const [annualMilitaryRetirementIncome, setAnnualMilitaryRetirementIncome] = useState<number>(30000);
  const [vaDisabilityRating, setVaDisabilityRating] = useState<number>(70);
  const [isPropertyOwner, setIsPropertyOwner] = useState(true);
  const [results, setResults] = useState<StateTaxResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleCalculate = () => {
    const result = calculateStateTaxBenefits({
      state,
      annualMilitaryRetirementIncome,
      vaDisabilityRating,
      isPropertyOwner,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;
  const inputs = { state, annualMilitaryRetirementIncome, vaDisabilityRating, isPropertyOwner };
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
      resultSummary={displayResults ? `~$${displayResults.estimatedIncomeTaxSavings.toLocaleString()} savings` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Estimate State Tax Benefits
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>State of Residence</Label>
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

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retirement">Military Retirement Income (Annual)</Label>
                <Input
                  id="retirement"
                  type="number"
                  min="0"
                  value={annualMilitaryRetirementIncome || ''}
                  onChange={(e) => setAnnualMilitaryRetirementIncome(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 30000"
                />
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
                  placeholder="e.g., 70"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="property">Own Property in This State?</Label>
                <p className="text-sm text-muted-foreground">
                  For property tax exemption estimates.
                </p>
              </div>
              <Switch
                id="property"
                checked={isPropertyOwner}
                onCheckedChange={setIsPropertyOwner}
              />
            </div>

            <Button onClick={handleCalculate} size="lg" className="w-full">
              Calculate Tax Benefits
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-green-600" />
                State Tax Benefits Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Based on your information for {state}.
              </p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Est. Income Tax Savings</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  ${displayResults.estimatedIncomeTaxSavings.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Per year (estimate)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Home className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Property Tax Benefits</span>
                </div>
                <p className={`text-3xl font-bold ${displayResults.propertyTaxBenefitFlag ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {displayResults.propertyTaxBenefitFlag ? 'Available' : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {displayResults.propertyTaxBenefitFlag ? 'Exemptions may apply' : 'Not applicable'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {displayResults.benefitsSummary.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Tax laws change frequently. Check your state's Department of Revenue 
                and county tax assessor for current rates and eligibility requirements. Consider consulting 
                a tax professional for personalized advice.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
