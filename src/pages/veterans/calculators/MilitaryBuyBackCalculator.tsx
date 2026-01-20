import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calculator, DollarSign, Calendar, TrendingUp, Clock, CheckCircle, Plus, Trash2, CalendarDays, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { calculateMilitaryBuyBack, MilitaryBuyBackResult, GradePeriod } from "@/lib/veteranCalculators";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const BRANCHES = ["Army", "Navy", "Air Force", "Marine Corps", "Coast Guard", "Space Force"];
const GRADES = [
  "E-1", "E-2", "E-3", "E-4", "E-5", "E-6", "E-7", "E-8", "E-9",
  "W-1", "W-2", "W-3", "W-4", "W-5",
  "O-1", "O-2", "O-3", "O-4", "O-5", "O-6", "O-7", "O-8", "O-9", "O-10"
];

// Sample results for demonstration
const SAMPLE_RESULTS: MilitaryBuyBackResult = {
  totalMilitaryService: 3.75,
  depositAmount: 36175,
  baseDeposit: 33101,
  monthlyPaymentOption: 201,
  interestAmount: 3074,
  annuityIncrease: 33225,
  breakEvenYears: 1.1,
  lifetimeBenefit: 664500,
  recommendation: "Buying back your military time is highly recommended. You'll recover your investment in just 1.1 years of retirement and gain over $664,000 in lifetime benefits."
};

export default function MilitaryBuyBackCalculator() {
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  const [showSampleResults, setShowSampleResults] = useState(false);
  const [formData, setFormData] = useState({
    branch: "",
    payEntryDate: "",
    separationDate: "",
    separationGrade: "",
    fedStartDate: "",
    retirementPlan: "",
    yearsToRetirement: "",
    annualBasePay: "",
  });
  const [gradePeriods, setGradePeriods] = useState<{ grade: string; fromDate: string; toDate: string }[]>([
    { grade: "", fromDate: "", toDate: "" }
  ]);
  const [results, setResults] = useState<MilitaryBuyBackResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let input: any = {
      branch: formData.branch,
      payEntryDate: new Date(formData.payEntryDate),
      separationDate: new Date(formData.separationDate),
      separationGrade: formData.separationGrade.replace("-", ""),
      fedStartDate: new Date(formData.fedStartDate),
      retirementPlan: formData.retirementPlan as 'fers' | 'csrs',
      yearsToRetirement: parseInt(formData.yearsToRetirement),
      annualBasePay: parseFloat(formData.annualBasePay),
    };

    // Add grade periods for advanced mode
    if (mode === 'advanced' && gradePeriods.length > 0 && gradePeriods[0].grade) {
      input.gradePeriods = gradePeriods.map(p => ({
        grade: p.grade.replace("-", ""),
        fromDate: new Date(p.fromDate),
        toDate: new Date(p.toDate)
      }));
    }
    
    const calculated = calculateMilitaryBuyBack(input);
    setResults(calculated);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addGradePeriod = () => {
    setGradePeriods([...gradePeriods, { grade: "", fromDate: "", toDate: "" }]);
  };

  const removeGradePeriod = (index: number) => {
    setGradePeriods(gradePeriods.filter((_, i) => i !== index));
  };

  const updateGradePeriod = (index: number, field: string, value: string) => {
    const updated = [...gradePeriods];
    updated[index] = { ...updated[index], [field]: value };
    setGradePeriods(updated);
  };

  const displayResults = showSampleResults ? SAMPLE_RESULTS : results;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/yourbenefits" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Benefits Home
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full mb-4">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Military Time Buy Back Calculator</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Calculate Your Military Service Deposit
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-balance">
            See how buying back your military time can increase your federal retirement&nbsp;annuity
          </p>
        </div>

        {!displayResults ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Enter Your Information
                  </CardTitle>
                  <CardDescription className="mt-1">
                    All fields are required for an accurate calculation
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  className="text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setShowSampleResults(true)}
                >
                  View Sample Results
                </Button>
              </div>
              
              {/* Basic/Advanced Toggle */}
              <div className="flex gap-2 mt-4">
                <Button 
                  variant={mode === 'basic' ? 'default' : 'outline'}
                  onClick={() => setMode('basic')}
                  className={mode === 'basic' ? 'bg-destructive hover:bg-destructive/90' : ''}
                >
                  Basic
                </Button>
                <Button 
                  variant={mode === 'advanced' ? 'default' : 'outline'}
                  onClick={() => setMode('advanced')}
                  className={mode === 'advanced' ? 'bg-primary' : ''}
                >
                  Advanced
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Branch - always shown */}
                <div className="space-y-2">
                  <Label htmlFor="branch" className="flex items-center gap-1">
                    Branch <Info className="w-3 h-3 text-muted-foreground" />
                  </Label>
                  <Select value={formData.branch} onValueChange={(v) => handleChange("branch", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANCHES.map(b => (
                        <SelectItem key={b} value={b.toLowerCase()}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {mode === 'basic' ? (
                  <>
                    {/* Basic Mode Fields */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="payEntryDate" className="flex items-center gap-1">
                          Pay Entry Base Date <Info className="w-3 h-3 text-muted-foreground" />
                        </Label>
                        <Input 
                          type="date" 
                          id="payEntryDate"
                          value={formData.payEntryDate}
                          onChange={(e) => handleChange("payEntryDate", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="separationDate" className="flex items-center gap-1">
                          Separation Date <Info className="w-3 h-3 text-muted-foreground" />
                        </Label>
                        <Input 
                          type="date" 
                          id="separationDate"
                          value={formData.separationDate}
                          onChange={(e) => handleChange("separationDate", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="separationGrade" className="flex items-center gap-1">
                        Separation Grade <Info className="w-3 h-3 text-muted-foreground" />
                      </Label>
                      <Select value={formData.separationGrade} onValueChange={(v) => handleChange("separationGrade", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES.map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Advanced Mode - Multiple Grade Periods */}
                    {gradePeriods.map((period, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="font-semibold flex items-center gap-1">
                            Grade {index + 1} <Info className="w-3 h-3 text-muted-foreground" />
                          </Label>
                          {gradePeriods.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeGradePeriod(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <Select 
                          value={period.grade} 
                          onValueChange={(v) => updateGradePeriod(index, 'grade', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADES.map(g => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              From Date <Info className="w-3 h-3 text-muted-foreground" />
                            </Label>
                            <Input 
                              type="date"
                              value={period.fromDate}
                              onChange={(e) => updateGradePeriod(index, 'fromDate', e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              To Date <Info className="w-3 h-3 text-muted-foreground" />
                            </Label>
                            <Input 
                              type="date"
                              value={period.toDate}
                              onChange={(e) => updateGradePeriod(index, 'toDate', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={addGradePeriod}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Grade Period
                    </Button>
                  </>
                )}

                {/* Common fields for both modes */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fedStartDate" className="flex items-center gap-1">
                      Federal Employment Start Date <Info className="w-3 h-3 text-muted-foreground" />
                    </Label>
                    <Input 
                      type="date" 
                      id="fedStartDate"
                      value={formData.fedStartDate}
                      onChange={(e) => handleChange("fedStartDate", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retirementPlan" className="flex items-center gap-1">
                      Federal Retirement Plan <Info className="w-3 h-3 text-muted-foreground" />
                    </Label>
                    <Select value={formData.retirementPlan} onValueChange={(v) => handleChange("retirementPlan", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fers">FERS</SelectItem>
                        <SelectItem value="csrs">CSRS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearsToRetirement" className="flex items-center gap-1">
                      Estimated Years to Retirement <Info className="w-3 h-3 text-muted-foreground" />
                    </Label>
                    <Input 
                      type="number" 
                      id="yearsToRetirement"
                      placeholder=""
                      value={formData.yearsToRetirement}
                      onChange={(e) => handleChange("yearsToRetirement", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annualBasePay" className="flex items-center gap-1">
                      Current Annual Base Rate of Pay <Info className="w-3 h-3 text-muted-foreground" />
                    </Label>
                    <Input 
                      type="number" 
                      id="annualBasePay"
                      placeholder=""
                      value={formData.annualBasePay}
                      onChange={(e) => handleChange("annualBasePay", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full text-lg bg-[#1a5490] hover:bg-[#154578]">
                  Calculate
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Recommendation Card */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                  Your Military Buy Back Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{displayResults.recommendation}</p>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <CalendarDays className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Military Service</span>
                  </div>
                  <p className="text-3xl font-bold text-[#1a5490]">{displayResults.totalMilitaryService.toFixed(2)} years</p>
                  <p className="text-sm text-muted-foreground">Total creditable service time</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Deposit</span>
                  </div>
                  <p className="text-3xl font-bold text-destructive">${displayResults.depositAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-sm text-muted-foreground">Including ${displayResults.interestAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} interest</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Annual Increase</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">${displayResults.annuityIncrease.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-sm text-muted-foreground">Added to your annual pension</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Options */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-1">Lump Sum Payment</h4>
                    <p className="text-2xl font-bold text-[#1a5490]">${displayResults.depositAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    <p className="text-sm text-muted-foreground">Pay the full amount upfront</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-1">Monthly Installments</h4>
                    <p className="text-2xl font-bold text-[#1a5490]">${displayResults.monthlyPaymentOption.toLocaleString('en-US', { maximumFractionDigits: 0 })}/month</p>
                    <p className="text-sm text-muted-foreground">Spread over your remaining federal service</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Break-Even Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Break-Even Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">You'll recoup your investment after:</p>
                    <p className="text-4xl font-bold text-[#1a5490]">{displayResults.breakEvenYears.toFixed(1)} years</p>
                    <p className="text-sm text-muted-foreground">of retirement</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Lifetime benefit increase (20 yrs):</p>
                    <p className="text-4xl font-bold text-emerald-600">${displayResults.lifetimeBenefit.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Consultation CTA */}
            <Card className="border-destructive/30 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">Schedule Your Free Consultation</h3>
                    <p className="text-muted-foreground mb-4">
                      Want to discuss your retirement timeline and options? Book a free 30-minute consultation with one of our federal benefits specialists.
                    </p>
                    <Button className="bg-[#1a5490] hover:bg-[#154578]">
                      Schedule Consultation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center">
              <Button 
                onClick={() => { setResults(null); setShowSampleResults(false); }} 
                variant="outline" 
                className="min-w-[200px]"
              >
                Calculate Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
