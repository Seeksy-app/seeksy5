import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Stethoscope, CheckCircle, ArrowRight } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('tricare_coverage_finder')!;

interface TRICAREResult {
  eligiblePlans: string[];
  primaryRecommendation: string;
}

const SAMPLE_RESULTS: TRICAREResult = {
  eligiblePlans: ['TRICARE Prime', 'TRICARE Select', 'TRICARE For Life'],
  primaryRecommendation: 'As a retiree, TRICARE Prime or Select are your main options. TRICARE For Life becomes available at age 65 with Medicare.',
};

function findTRICARECoverage(input: {
  status: string;
  zipCode?: string;
  isOver65: boolean;
}): TRICAREResult {
  const { status, isOver65 } = input;
  
  const eligiblePlans: string[] = [];
  let primaryRecommendation = '';

  switch (status) {
    case 'Active Duty':
      eligiblePlans.push('TRICARE Prime (no cost)');
      primaryRecommendation = 'Active duty service members are automatically enrolled in TRICARE Prime at no cost.';
      break;
    case 'Reserve/Guard':
      eligiblePlans.push('TRICARE Reserve Select');
      eligiblePlans.push('TRICARE Retired Reserve (if qualified)');
      primaryRecommendation = 'Reserve/Guard members can enroll in TRICARE Reserve Select for affordable coverage. When on orders for 30+ days, you\'re covered by TRICARE Prime.';
      break;
    case 'Retired':
      eligiblePlans.push('TRICARE Prime');
      eligiblePlans.push('TRICARE Select');
      if (isOver65) {
        eligiblePlans.push('TRICARE For Life (with Medicare)');
        primaryRecommendation = 'At 65+, TRICARE For Life works alongside Medicare for comprehensive coverage. Enroll in Medicare Parts A and B to maintain eligibility.';
      } else {
        primaryRecommendation = 'Military retirees can choose between TRICARE Prime (lower cost, assigned PCM) or Select (more flexibility, higher costs). Compare based on your healthcare needs.';
      }
      break;
    case 'Family Member':
      eligiblePlans.push('TRICARE Prime');
      eligiblePlans.push('TRICARE Select');
      eligiblePlans.push('TRICARE Young Adult (for adult children)');
      primaryRecommendation = 'Family members are covered under the sponsor\'s plan. Adult children 21-26 may qualify for TRICARE Young Adult.';
      break;
    case 'Survivor':
      eligiblePlans.push('TRICARE Select');
      if (isOver65) {
        eligiblePlans.push('TRICARE For Life (with Medicare)');
      }
      primaryRecommendation = 'Surviving family members of deceased service members/retirees maintain TRICARE eligibility. Contact your regional contractor for enrollment.';
      break;
    default:
      primaryRecommendation = 'Please select your status to see available TRICARE options.';
  }

  return { eligiblePlans, primaryRecommendation };
}

export default function TRICARECalculator() {
  const [status, setStatus] = useState<string>('Retired');
  const [zipCode, setZipCode] = useState("");
  const [isOver65, setIsOver65] = useState(false);
  const [results, setResults] = useState<TRICAREResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const handleCalculate = () => {
    const result = findTRICARECoverage({
      status,
      zipCode: zipCode || undefined,
      isOver65,
    });
    setResults(result);
  };

  const handleReset = () => {
    setResults(null);
    setShowSample(false);
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;
  const inputs = { status, zipCode, isOver65 };
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
      resultSummary={displayResults ? `${displayResults.eligiblePlans.length} plan(s) available` : undefined}
      hasResults={!!displayResults}
      onReset={handleReset}
    >
      {!displayResults ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Find Your TRICARE Options
              </CardTitle>
              <Button variant="outline" onClick={() => setShowSample(true)}>
                View Sample Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Your Military Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active Duty">Active Duty</SelectItem>
                  <SelectItem value="Reserve/Guard">Reserve/Guard</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                  <SelectItem value="Family Member">Family Member</SelectItem>
                  <SelectItem value="Survivor">Survivor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                For finding your regional TRICARE contractor.
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

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="over65">Age 65 or Older?</Label>
                <p className="text-sm text-muted-foreground">
                  Affects eligibility for TRICARE For Life.
                </p>
              </div>
              <Switch
                id="over65"
                checked={isOver65}
                onCheckedChange={setIsOver65}
              />
            </div>

            <Button onClick={handleCalculate} size="lg" className="w-full">
              Find Coverage Options
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 dark:to-cyan-900/10 border-cyan-200 dark:border-cyan-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-cyan-600" />
                Your TRICARE Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{displayResults.primaryRecommendation}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {displayResults.eligiblePlans.map((plan, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium">{plan}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Visit tricare.mil to compare plans in detail</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Find your regional contractor using your ZIP code</span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Enroll online, by phone, or at a military ID card office</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </CalculatorLayout>
  );
}
