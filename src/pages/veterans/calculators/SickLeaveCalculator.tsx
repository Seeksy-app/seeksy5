import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Heart, Clock, Calendar, TrendingUp, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { calculateSickLeave, SickLeaveResult } from "@/lib/veteranCalculators";

// Sample results for demonstration
const SAMPLE_RESULTS: SickLeaveResult = {
  totalHours: 2080,
  daysEquivalent: 260,
  monthsCredit: 2,
  yearsCredit: 1,
  pensionIncrease: "1.00%",
  estimatedAnnualBenefit: 4850,
  description: "Your 2,080 hours of unused sick leave will significantly boost your retirement benefits!"
};

export default function SickLeaveCalculator() {
  const [sickLeaveHours, setSickLeaveHours] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [results, setResults] = useState<SickLeaveResult | null>(null);
  const [showSampleResults, setShowSampleResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const calculated = calculateSickLeave({
      unusedSickLeaveHours: parseInt(sickLeaveHours),
      currentSalary: currentSalary ? parseFloat(currentSalary) : undefined,
    });
    
    setResults(calculated);
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
          <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 px-4 py-2 rounded-full mb-4">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Sick Leave Calculator</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Convert Sick Leave to Service Credit
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-balance">
            See how your unused sick leave hours boost your retirement&nbsp;annuity
          </p>
        </div>

        {!displayResults ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Enter Your Sick Leave Balance
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Find your sick leave hours on your pay stub or leave statement
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
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sickLeaveHours">Unused Sick Leave Hours</Label>
                  <Input 
                    type="number" 
                    id="sickLeaveHours"
                    placeholder="e.g., 1840"
                    value={sickLeaveHours}
                    onChange={(e) => setSickLeaveHours(e.target.value)}
                    className="text-lg h-14"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Full-time employees earn about 4 hours per pay period (104 hours/year)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentSalary">Current Annual Salary (optional)</Label>
                  <Input 
                    type="number" 
                    id="currentSalary"
                    placeholder="e.g., 85000"
                    value={currentSalary}
                    onChange={(e) => setCurrentSalary(e.target.value)}
                    className="text-lg h-14"
                  />
                  <p className="text-sm text-muted-foreground">
                    Adding salary helps estimate your annual benefit increase
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full text-lg bg-[#1a5490] hover:bg-[#154578]">
                  Calculate My Credit
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Main Result */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Heart className="w-6 h-6 text-emerald-600" />
                  Your Sick Leave Credit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{displayResults.description}</p>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Hours</span>
                  </div>
                  <p className="text-3xl font-bold text-[#1a5490]">{displayResults.totalHours.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Unused sick leave hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Days Equivalent</span>
                  </div>
                  <p className="text-3xl font-bold text-[#1a5490]">{displayResults.daysEquivalent}</p>
                  <p className="text-sm text-muted-foreground">Work days (8 hrs/day)</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Service Credit</span>
                  </div>
                  {displayResults.yearsCredit > 0 ? (
                    <>
                      <p className="text-3xl font-bold text-emerald-600">
                        {displayResults.yearsCredit} yr
                      </p>
                      <p className="text-lg font-semibold text-[#1a5490]">{displayResults.monthsCredit} mo</p>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-emerald-600">{displayResults.monthsCredit} months</p>
                  )}
                  <p className="text-sm text-muted-foreground">Added to service time</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Pension Boost</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">+{displayResults.estimatedAnnualBenefit > 0 ? displayResults.estimatedAnnualBenefit.toLocaleString() : displayResults.pensionIncrease}</p>
                  <p className="text-sm text-muted-foreground">Estimated increase</p>
                </CardContent>
              </Card>
            </div>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#1a5490] flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-white">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Conversion to Service Credit</h4>
                    <p className="text-sm text-muted-foreground">
                      Your unused sick leave is converted to additional service time. For every 2,087 hours of sick leave, you receive 1 full year of service credit.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#1a5490] flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-white">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Pension Calculation Impact</h4>
                    <p className="text-sm text-muted-foreground">
                      The additional service time is included in your total years of service when calculating your retirement annuity, increasing your monthly pension payment.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#1a5490] flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-white">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Automatic at Retirement</h4>
                    <p className="text-sm text-muted-foreground">
                      When you retire, your unused sick leave balance is automatically applied. No special forms or applications are needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Official Source Note */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-sm text-center">
                  <strong className="text-destructive">Official Formula:</strong> This calculator uses the OPM-approved conversion rate of 2,087 hours = 1 year of service credit, as specified in 5 USC §8415 for computing basic annuity.
                </p>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  <strong>Tip:</strong> Sick leave is one of the most valuable benefits for federal employees planning for retirement. Your unused sick leave balance is automatically applied when you retire—no forms needed!
                </p>
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
