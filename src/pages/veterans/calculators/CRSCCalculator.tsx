import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Award, CheckCircle, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('crsc_screening_tool')!;

interface CRSCResult {
  eligibilityFlag: boolean;
  summaryMessage: string;
  recommendedEvidenceList: string[];
}

const SAMPLE_RESULTS: CRSCResult = {
  eligibilityFlag: true,
  summaryMessage: 'You may qualify for Combat-Related Special Compensation based on your military retirement status and combat-related conditions.',
  recommendedEvidenceList: [
    'DD-214 showing combat awards or hazardous duty',
    'VA rating decision letters',
    'Medical records linking conditions to combat/hazardous duty',
    'Unit deployment orders or combat zone documentation',
  ],
};

function checkCRSCEligibility(input: {
  isMilitaryRetiree: boolean;
  hasDoDRetiredPayOffset: boolean;
  hasCombatRelatedConditions: boolean;
}): CRSCResult {
  const { isMilitaryRetiree, hasDoDRetiredPayOffset, hasCombatRelatedConditions } = input;
  
  const recommendedEvidenceList: string[] = [];
  
  if (!isMilitaryRetiree) {
    return {
      eligibilityFlag: false,
      summaryMessage: 'CRSC is only available to military retirees receiving retired pay. If you\'re not yet retired, this benefit will apply after retirement.',
      recommendedEvidenceList: ['Retirement orders when available'],
    };
  }

  if (!hasCombatRelatedConditions) {
    return {
      eligibilityFlag: false,
      summaryMessage: 'CRSC requires at least one disability to be combat-related (from armed conflict, hazardous duty, training simulating combat, or instrumentality of war).',
      recommendedEvidenceList: [
        'Review your conditions to identify any that may qualify as combat-related',
        'Consult with a VSO to evaluate your disabilities',
      ],
    };
  }

  // Likely eligible
  recommendedEvidenceList.push('DD-214 showing combat awards, decorations, or hazardous duty');
  recommendedEvidenceList.push('VA rating decision letters for each condition');
  recommendedEvidenceList.push('Medical records or service records linking conditions to combat/hazardous duty');
  recommendedEvidenceList.push('Purple Heart documentation (if applicable)');
  recommendedEvidenceList.push('Deployment orders or combat zone verification');

  return {
    eligibilityFlag: true,
    summaryMessage: hasDoDRetiredPayOffset 
      ? 'You may qualify for CRSC to restore retired pay reduced by VA compensation. This could put money back in your pocket each month.'
      : 'You may qualify for CRSC. Even without current VA offset, documenting combat-related conditions protects future benefits.',
    recommendedEvidenceList,
  };
}

export default function CRSCCalculator() {
  const [isMilitaryRetiree, setIsMilitaryRetiree] = useState(true);
  const [hasDoDRetiredPayOffset, setHasDoDRetiredPayOffset] = useState(true);
  const [hasCombatRelatedConditions, setHasCombatRelatedConditions] = useState(true);
  const [results, setResults] = useState<CRSCResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleCalculate = () => {
    const result = checkCRSCEligibility({
      isMilitaryRetiree,
      hasDoDRetiredPayOffset,
      hasCombatRelatedConditions,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;
  const inputs = { isMilitaryRetiree, hasDoDRetiredPayOffset, hasCombatRelatedConditions };
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
      resultSummary={displayResults ? (displayResults.eligibilityFlag ? 'May Qualify' : 'Not Eligible') : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                CRSC Eligibility Screener
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="retiree">Receiving Military Retired Pay?</Label>
                <p className="text-sm text-muted-foreground">
                  You must be a military retiree to qualify.
                </p>
              </div>
              <Switch
                id="retiree"
                checked={isMilitaryRetiree}
                onCheckedChange={setIsMilitaryRetiree}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="offset">Retired Pay Reduced by VA Compensation?</Label>
                <p className="text-sm text-muted-foreground">
                  Is your DoD retired pay being offset (reduced) due to VA disability pay?
                </p>
              </div>
              <Switch
                id="offset"
                checked={hasDoDRetiredPayOffset}
                onCheckedChange={setHasDoDRetiredPayOffset}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="combat">Combat-Related or Hazardous Duty Conditions?</Label>
                <p className="text-sm text-muted-foreground">
                  Conditions from combat, hazardous duty, training simulating combat, or instrumentality of war.
                </p>
              </div>
              <Switch
                id="combat"
                checked={hasCombatRelatedConditions}
                onCheckedChange={setHasCombatRelatedConditions}
              />
            </div>

            <Button onClick={handleCalculate} size="lg" className="w-full">
              Screen for CRSC
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className={`bg-gradient-to-br ${displayResults.eligibilityFlag 
            ? 'from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800'
            : 'from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {displayResults.eligibilityFlag ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                {displayResults.eligibilityFlag ? 'Potential CRSC Eligibility' : 'Not Currently Eligible'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{displayResults.summaryMessage}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Recommended Evidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {displayResults.recommendedEvidenceList.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> CRSC applications go to your branch of service, not the VA. 
                Processing times vary by branch. Consider working with a VSO to strengthen your application.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
