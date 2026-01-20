import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Stethoscope, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('champva_eligibility_checker')!;

interface CHAMPVAResult {
  eligibilityLikely: boolean;
  programType: string;
  nextSteps: string[];
}

const SAMPLE_RESULTS: CHAMPVAResult = {
  eligibilityLikely: true,
  programType: 'CHAMPVA',
  nextSteps: [
    'Gather VA documentation showing 100% P&T rating',
    'Complete VA Form 10-10d',
    'Submit marriage/birth certificates for dependents',
  ],
};

function checkCHAMPVAEligibility(input: {
  relationship: string;
  vaDisabilityRating: number;
  isDiedInLineOrServiceConnected: boolean;
}): CHAMPVAResult {
  const { relationship, vaDisabilityRating, isDiedInLineOrServiceConnected } = input;
  
  let eligibilityLikely = false;
  let programType = 'Unknown';
  const nextSteps: string[] = [];

  if (relationship === 'Veteran') {
    if (vaDisabilityRating >= 50) {
      eligibilityLikely = true;
      programType = 'VA Healthcare';
      nextSteps.push('You may qualify for VA healthcare as a veteran');
      nextSteps.push('Enroll through VA.gov or your local VA facility');
    } else {
      nextSteps.push('Veterans with lower ratings should apply for VA healthcare enrollment');
      nextSteps.push('Income-based eligibility may apply');
    }
  } else if (['Spouse', 'Child', 'Caregiver'].includes(relationship)) {
    if (vaDisabilityRating >= 100 || isDiedInLineOrServiceConnected) {
      eligibilityLikely = true;
      programType = 'CHAMPVA';
      nextSteps.push('Gather VA documentation showing 100% P&T rating or death certificate');
      nextSteps.push('Complete VA Form 10-10d (CHAMPVA Application)');
      nextSteps.push('Submit relationship documentation (marriage/birth certificate)');
    } else {
      programType = 'Likely Not Eligible';
      nextSteps.push('CHAMPVA requires veteran to be rated 100% P&T or deceased due to service');
      nextSteps.push('Consider TRICARE if active duty or retired military family');
    }
  }

  return { eligibilityLikely, programType, nextSteps };
}

export default function CHAMPVACalculator() {
  const [relationship, setRelationship] = useState<string>('Spouse');
  const [vaDisabilityRating, setVaDisabilityRating] = useState<number>(100);
  const [isDiedInLineOrServiceConnected, setIsDiedInLineOrServiceConnected] = useState(false);
  const [results, setResults] = useState<CHAMPVAResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleCalculate = () => {
    const result = checkCHAMPVAEligibility({
      relationship,
      vaDisabilityRating,
      isDiedInLineOrServiceConnected,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;
  const inputs = { relationship, vaDisabilityRating, isDiedInLineOrServiceConnected };
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
      resultSummary={displayResults ? (displayResults.eligibilityLikely ? 'Likely Eligible' : 'May Not Qualify') : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Check CHAMPVA Eligibility
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Your Relationship to the Veteran</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Veteran">I am the Veteran</SelectItem>
                  <SelectItem value="Spouse">Spouse</SelectItem>
                  <SelectItem value="Child">Child/Dependent</SelectItem>
                  <SelectItem value="Caregiver">Caregiver</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Veteran's VA Disability Rating (%)</Label>
              <p className="text-sm text-muted-foreground">
                Enter 100 if the veteran is rated 100% Permanent & Total (P&T).
              </p>
              <Input
                id="rating"
                type="number"
                min="0"
                max="100"
                step="10"
                value={vaDisabilityRating || ''}
                onChange={(e) => setVaDisabilityRating(parseInt(e.target.value) || 0)}
                placeholder="e.g., 100"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="died">Veteran Deceased (Service-Connected)?</Label>
                <p className="text-sm text-muted-foreground">
                  Check if the veteran died in the line of duty or from a service-connected condition.
                </p>
              </div>
              <Switch
                id="died"
                checked={isDiedInLineOrServiceConnected}
                onCheckedChange={setIsDiedInLineOrServiceConnected}
              />
            </div>

            <Button onClick={handleCalculate} size="lg" className="w-full">
              Check Eligibility
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className={`bg-gradient-to-br ${displayResults.eligibilityLikely 
            ? 'from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800'
            : 'from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {displayResults.eligibilityLikely ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                {displayResults.eligibilityLikely ? 'Likely Eligible' : 'May Not Qualify'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium mb-2">Program: {displayResults.programType}</p>
              <p className="text-muted-foreground">
                {displayResults.eligibilityLikely 
                  ? 'Based on the information provided, you likely qualify for this program.'
                  : 'You may not meet the eligibility requirements based on current information.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {displayResults.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-cyan-200 bg-cyan-50/50 dark:border-cyan-800 dark:bg-cyan-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a screening tool only. Final eligibility is determined by the VA.
                CHAMPVA beneficiaries cannot have Medicare Part D or be eligible for TRICARE.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
