import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calculator, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateSeparationReadiness, SeparationReadinessResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('separation_readiness_score')!;

const SAMPLE_RESULTS: SeparationReadinessResult = {
  readinessScorePercent: 75,
  readinessLevel: 'On Track',
  recommendedActions: ['Start gathering evidence for your VA claims'],
};

export default function SeparationReadinessCalculator() {
  const [formData, setFormData] = useState({
    monthsUntilSeparation: '',
    hasIntentToFile: false,
    claimsStarted: false,
    hasTransitionCounseling: false,
    hasPostSeparationPlan: false,
  });
  const [results, setResults] = useState<SeparationReadinessResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const result = calculateSeparationReadiness({
      monthsUntilSeparation: parseInt(formData.monthsUntilSeparation),
      hasIntentToFile: formData.hasIntentToFile,
      claimsStarted: formData.claimsStarted,
      hasTransitionCounseling: formData.hasTransitionCounseling,
      hasPostSeparationPlan: formData.hasPostSeparationPlan,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Ahead': return 'text-green-600 bg-green-50 border-green-200';
      case 'On Track': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Behind': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return '';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Ahead': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'On Track': return <CheckCircle className="w-6 h-6 text-blue-600" />;
      case 'Behind': return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'Critical': return <XCircle className="w-6 h-6 text-red-600" />;
      default: return null;
    }
  };

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
      resultSummary={displayResults ? `${displayResults.readinessScorePercent}% - ${displayResults.readinessLevel}` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Answer These Questions
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="months">Months Until Separation/Retirement</Label>
                <Input
                  type="number"
                  id="months"
                  value={formData.monthsUntilSeparation}
                  onChange={(e) => handleChange("monthsUntilSeparation", e.target.value)}
                  placeholder="e.g., 12"
                  required
                />
              </div>

              {[
                { field: 'hasIntentToFile', label: 'Intent to File Submitted?', desc: 'Have you filed your Intent to File with the VA?' },
                { field: 'claimsStarted', label: 'Claims Started?', desc: 'Have you begun working on any VA claims?' },
                { field: 'hasTransitionCounseling', label: 'TAP Completed?', desc: 'Have you completed Transition Assistance Program or equivalent?' },
                { field: 'hasPostSeparationPlan', label: 'Post-Separation Plan?', desc: 'Do you have a job, school, or next-step plan in place?' },
              ].map(({ field, label, desc }) => (
                <div key={field} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor={field}>{label}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    id={field}
                    checked={formData[field as keyof typeof formData] as boolean}
                    onCheckedChange={(v) => handleChange(field, v)}
                  />
                </div>
              ))}

              <Button type="submit" size="lg" className="w-full">
                Check My Readiness
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className={getLevelColor(displayResults.readinessLevel)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getLevelIcon(displayResults.readinessLevel)}
                Your Readiness: {displayResults.readinessLevel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{displayResults.readinessScorePercent}%</div>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${displayResults.readinessScorePercent >= 75 ? 'bg-green-500' : displayResults.readinessScorePercent >= 50 ? 'bg-blue-500' : displayResults.readinessScorePercent >= 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${displayResults.readinessScorePercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {displayResults.recommendedActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recommended Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {displayResults.recommendedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </CalculatorLayout>
  );
}
