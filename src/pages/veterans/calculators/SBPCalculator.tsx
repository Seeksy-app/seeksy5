import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Shield, DollarSign, Heart } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateSBP, SBPResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('sbp_calculator')!;

export default function SBPCalculator() {
  const [formData, setFormData] = useState({ grossRetiredPay: '', coverageBasePercent: '100', sbpPremiumRatePercent: '6.5' });
  const [results, setResults] = useState<SBPResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const SAMPLE_RESULTS: SBPResult = { monthlyPremium: 195, monthlySurvivorBenefit: 1650, annualPremium: 2340 };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setResults(calculateSBP({
      grossRetiredPay: parseFloat(formData.grossRetiredPay),
      coverageBasePercent: parseFloat(formData.coverageBasePercent),
      sbpPremiumRatePercent: parseFloat(formData.sbpPremiumRatePercent),
    }));
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;

  return (
    <CalculatorLayout calculatorId={config.id} title={config.title} description={config.description} icon={config.icon} iconColor={config.color} category={config.category} inputs={displayResults ? formData : undefined} outputs={displayResults ? { ...displayResults } : undefined} resultSummary={displayResults ? `Premium: $${displayResults.monthlyPremium}/mo` : undefined} hasResults={!!displayResults} onReset={() => { setResults(null); setShowSample(false); }}>
      {!displayResults ? (
        <Card>
          <CardHeader><div className="flex items-center justify-between flex-wrap gap-4"><CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" />Enter Your Details</CardTitle><Button variant="outline" onClick={() => setShowSample(true)}>View Sample</Button></div></CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="space-y-2"><Label>Gross Retired Pay (monthly)</Label><Input type="number" value={formData.grossRetiredPay} onChange={(e) => setFormData(p => ({ ...p, grossRetiredPay: e.target.value }))} required placeholder="e.g., 3000" /></div>
              <div className="space-y-2"><Label>Coverage Base (%)</Label><Input type="number" value={formData.coverageBasePercent} onChange={(e) => setFormData(p => ({ ...p, coverageBasePercent: e.target.value }))} placeholder="100" /><p className="text-sm text-muted-foreground">Usually 100% for full coverage</p></div>
              <div className="space-y-2"><Label>SBP Premium Rate (%)</Label><Input type="number" value={formData.sbpPremiumRatePercent} onChange={(e) => setFormData(p => ({ ...p, sbpPremiumRatePercent: e.target.value }))} placeholder="6.5" /></div>
              <Button type="submit" size="lg" className="w-full">Calculate</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/20 border-pink-200"><CardHeader><CardTitle className="flex items-center gap-2"><Heart className="w-6 h-6 text-pink-600" />Your SBP Estimate</CardTitle></CardHeader></Card>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3 mb-2"><DollarSign className="w-5 h-5" /><span className="text-sm font-medium">Monthly Premium</span></div><p className="text-2xl font-bold text-red-500">${displayResults.monthlyPremium}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3 mb-2"><Shield className="w-5 h-5" /><span className="text-sm font-medium">Survivor Benefit</span></div><p className="text-2xl font-bold text-green-600">${displayResults.monthlySurvivorBenefit}/mo</p></CardContent></Card>
          </div>
        </div>
      )}
    </CalculatorLayout>
  );
}
