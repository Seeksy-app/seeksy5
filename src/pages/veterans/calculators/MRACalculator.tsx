import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Clock, Calendar, Award, Info, CalendarDays, User } from "lucide-react";
import { Link } from "react-router-dom";
import { calculateMRA, MRAResult } from "@/lib/veteranCalculators";
import { format } from "date-fns";

// Sample results for demonstration
const SAMPLE_RESULTS: MRAResult = {
  minimumRetirementAge: 57,
  mraYears: 57,
  mraMonths: 0,
  retirementEligibilityDate: new Date('2035-06-14'),
  yearsOfServiceNeeded: 30,
  monthsOfServiceNeeded: 0,
  canRetireAt: "You can retire at age 57 with 30 years of service for a full unreduced annuity, or at age 62 with just 5 years of service.",
  specialProvisionAge: 50
};

export default function MRACalculator() {
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    startDate: "",
    hasMilitaryService: "no",
    hasSpecialProvisions: false,
  });
  const [results, setResults] = useState<MRAResult | null>(null);
  const [showSampleResults, setShowSampleResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const calculated = calculateMRA({
      dateOfBirth: new Date(formData.dateOfBirth),
      startDate: new Date(formData.startDate),
      hasMilitaryService: formData.hasMilitaryService === "yes",
      hasSpecialProvisions: formData.hasSpecialProvisions,
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
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 px-4 py-2 rounded-full mb-4">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">MRA Calculator</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Find Your Minimum Retirement Age
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-balance">
            Discover when you are eligible for federal retirement based on your birth&nbsp;year
          </p>
        </div>

        {!displayResults ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Enter Your Information
                  </CardTitle>
                  <CardDescription className="mt-1">
                    We'll calculate your MRA based on OPM FERS retirement rules
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
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input 
                      type="date" 
                      id="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Federal Service Start Date</Label>
                    <Input 
                      type="date" 
                      id="startDate"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Do you have creditable military service?</Label>
                  <RadioGroup 
                    value={formData.hasMilitaryService}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, hasMilitaryService: v }))}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="military-yes" />
                      <Label htmlFor="military-yes" className="font-normal">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="military-no" />
                      <Label htmlFor="military-no" className="font-normal">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="specialProvisions"
                    checked={formData.hasSpecialProvisions}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSpecialProvisions: !!checked }))}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="specialProvisions" className="font-normal cursor-pointer">
                      Special Provisions (6c) Employee
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Law Enforcement Officers, Firefighters, Air Traffic Controllers
                    </p>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full text-lg bg-[#1a5490] hover:bg-[#154578]">
                  Calculate My MRA
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Main Result Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="w-6 h-6 text-[#1a5490]" />
                  Your Retirement Eligibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Minimum Retirement Age (MRA)</p>
                    <p className="text-5xl font-bold text-[#1a5490]">
                      {displayResults.mraYears}
                    </p>
                    <p className="text-lg text-muted-foreground">
                      years {displayResults.mraMonths > 0 ? `${displayResults.mraMonths} months` : '0 months'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Eligible to Retire On</p>
                    <p className="text-3xl font-bold text-[#1a5490]">
                      {format(displayResults.retirementEligibilityDate, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service & Special Provisions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Service Required</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">{displayResults.yearsOfServiceNeeded} years</p>
                  <p className="text-lg text-[#1a5490]">{displayResults.monthsOfServiceNeeded} months</p>
                  <p className="text-sm text-muted-foreground mt-1">Total service needed at MRA</p>
                </CardContent>
              </Card>

              {displayResults.specialProvisionAge && (
                <Card className="border-emerald-300 bg-emerald-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium">Special Provision</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600">Age {displayResults.specialProvisionAge}</p>
                    <p className="text-sm text-muted-foreground mt-1">Early retirement with 20 years of service</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Retirement Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Retirement Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">{displayResults.canRetireAt}</p>
                
                <div className="space-y-2 text-sm border-t pt-4">
                  <p><strong className="text-[#1a5490]">MRA + 30 years:</strong> Full unreduced annuity</p>
                  <p><strong className="text-[#1a5490]">Age 60 + 20 years:</strong> Full unreduced annuity</p>
                  <p><strong className="text-[#1a5490]">Age 62 + 5 years:</strong> Full unreduced annuity</p>
                  <p><strong className="text-[#1a5490]">MRA + 10 years:</strong> Reduced annuity (5% per year under age 62)</p>
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
