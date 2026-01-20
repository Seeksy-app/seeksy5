import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Car, DollarSign, Calendar } from "lucide-react";
import { CalculatorLayout } from "@/components/veterans/calculators/CalculatorLayout";
import { calculateVATravel, VATravelResult } from "@/lib/veteranCalculatorsExtended";
import { getCalculatorById } from "@/lib/veteranCalculatorRegistry";

const config = getCalculatorById('va_travel_reimbursement')!;

export default function VATravelCalculator() {
  const [formData, setFormData] = useState({ oneWayMiles: '', roundTripsPerMonth: '', mileageRate: '' });
  const [results, setResults] = useState<VATravelResult | null>(null);
  const [showSample, setShowSample] = useState(false);

  const SAMPLE_RESULTS: VATravelResult = { reimbursementPerTrip: 41.50, reimbursementPerMonth: 166, reimbursementPerYear: 1992 };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setResults(calculateVATravel({ oneWayMiles: parseFloat(formData.oneWayMiles), roundTripsPerMonth: parseFloat(formData.roundTripsPerMonth) || 1, mileageRate: parseFloat(formData.mileageRate) || undefined }));
  };

  const displayResults = showSample ? SAMPLE_RESULTS : results;

  return (
    <CalculatorLayout calculatorId={config.id} title={config.title} description={config.description} icon={config.icon} iconColor={config.color} category={config.category} inputs={displayResults ? formData : undefined} outputs={displayResults ? { ...displayResults } : undefined} resultSummary={displayResults ? `$${displayResults.reimbursementPerYear}/year` : undefined} hasResults={!!displayResults} onReset={() => { setResults(null); setShowSample(false); }}>
      {!displayResults ? (
        <Card>
          <CardHeader><div className="flex items-center justify-between flex-wrap gap-4"><CardTitle className="flex items-center gap-2"><Calculator className="w-5 h-5" />Enter Trip Details</CardTitle><Button variant="outline" onClick={() => setShowSample(true)}>View Sample</Button></div></CardHeader>
          <CardContent>
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="space-y-2"><Label>One-Way Distance (miles)</Label><Input type="number" value={formData.oneWayMiles} onChange={(e) => setFormData(p => ({ ...p, oneWayMiles: e.target.value }))} required placeholder="e.g., 50" /></div>
              <div className="space-y-2"><Label>Round Trips Per Month</Label><Input type="number" value={formData.roundTripsPerMonth} onChange={(e) => setFormData(p => ({ ...p, roundTripsPerMonth: e.target.value }))} placeholder="e.g., 4" /></div>
              <div className="space-y-2"><Label>Mileage Rate (optional)</Label><Input type="number" step="0.001" value={formData.mileageRate} onChange={(e) => setFormData(p => ({ ...p, mileageRate: e.target.value }))} placeholder="0.415" /><p className="text-sm text-muted-foreground">2024 VA rate is $0.415/mile</p></div>
              <Button type="submit" size="lg" className="w-full">Calculate</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 border-cyan-200"><CardHeader><CardTitle className="flex items-center gap-2"><Car className="w-6 h-6 text-cyan-600" />Travel Reimbursement</CardTitle></CardHeader></Card>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-6"><DollarSign className="w-5 h-5 mb-2" /><p className="text-sm text-muted-foreground">Per Trip</p><p className="text-2xl font-bold text-primary">${displayResults.reimbursementPerTrip}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><Calendar className="w-5 h-5 mb-2" /><p className="text-sm text-muted-foreground">Per Month</p><p className="text-2xl font-bold text-primary">${displayResults.reimbursementPerMonth}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><Calendar className="w-5 h-5 mb-2" /><p className="text-sm text-muted-foreground">Per Year</p><p className="text-2xl font-bold text-green-600">${displayResults.reimbursementPerYear}</p></CardContent></Card>
          </div>
        </div>
      )}
    </CalculatorLayout>
  );
}
