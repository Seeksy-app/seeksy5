import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateCOLA, COLAResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('cola_estimator')!;

export default function COLACalculator() {
  const [formData, setFormData] = useState({ currentBenefit: '', expectedColaPercent: '', years: '' });
  const [results, setResults] = useState<COLAResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const SAMPLE_RESULTS: COLAResult = { projectedMonthlyBenefit: 3500, projectedAnnualBenefit: 42000, totalIncreaseOverPeriod: 9000 };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setResults(calculateCOLA({ currentBenefit: parseFloat(formData.currentBenefit), expectedColaPercent: parseFloat(formData.expectedColaPercent), years: parseFloat(formData.years) }));
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;

  return (
    <CalculatorLayout calculatorId={config.id} title={config.title} description={config.description} icon={config.icon} iconColor={config.color} category={config.category} inputs={displayResults ? formData : undefined} outputs={displayResults ? { ...displayResults } : undefined} resultSummary={displayResults ? `Future: $${displayResults.projectedMonthlyBenefit}/mo` : undefined} hasResults={!!displayResults} onReset={() => { setResults(null); setShowSample(false); }}>
      {!displayResults ? (
        <Card>
          <CardHeader><div className="flex items-center justify-between flex-wrap gap-4"><CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" />Enter Details</CardTitle><Button variant="outline" onClick={() => setShowSample(true)}>View Sample</Button></div></CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="space-y-2"><Label>Current Monthly Benefit</Label><Input type="number" value={formData.currentBenefit} onChange={(e) => setFormData(p => ({ ...p, currentBenefit: e.target.value }))} required placeholder="e.g., 2500" /></div>
              <div className="space-y-2"><Label>Expected Annual COLA (%)</Label><Input type="number" value={formData.expectedColaPercent} onChange={(e) => setFormData(p => ({ ...p, expectedColaPercent: e.target.value }))} required placeholder="e.g., 3" /><p className="text-sm text-muted-foreground">Historical average is around 2-3%</p></div>
              <div className="space-y-2"><Label>Years to Project</Label><Input type="number" value={formData.years} onChange={(e) => setFormData(p => ({ ...p, years: e.target.value }))} required placeholder="e.g., 10" /></div>
              <Button type="submit" size="lg" className="w-full">Calculate</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 border-blue-200"><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-6 h-6 text-blue-600" />COLA Projection</CardTitle></CardHeader></Card>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6"><DollarSign className="w-5 h-5 mb-2" /><p className="text-sm text-muted-foreground">Future Monthly</p><p className="text-2xl font-bold text-green-600">${displayResults.projectedMonthlyBenefit.toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><Calendar className="w-5 h-5 mb-2" /><p className="text-sm text-muted-foreground">Future Annual</p><p className="text-2xl font-bold text-primary">${displayResults.projectedAnnualBenefit.toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><TrendingUp className="w-5 h-5 mb-2" /><p className="text-sm text-muted-foreground">Total Increase</p><p className="text-2xl font-bold text-blue-600">${displayResults.totalIncreaseOverPeriod.toLocaleString()}</p></CardContent></Card>
          </div>
        </div>
      )}
    </CalculatorLayout>
  );
}
