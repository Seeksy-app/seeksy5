import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Calculator, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Users, 
  CheckCircle,
  ArrowRight,
  Download,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function VeteranBenefitsOpportunity() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const handleGenerateSamplePacket = async () => {
    setIsGenerating(true);
    
    try {
      // Create a demo lead entry
      const { error } = await supabase
        .from("veteran_leads")
        .insert({
          full_name: "Demo Investor Lead",
          email: "demo@example.com",
          source: "investor-demo",
          branch: "Army",
          intent_type: "new_claim",
          status: "prepared"
        });

      if (error) throw error;

      // Simulate PDF generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPdfGenerated(true);
      toast.success("Sample claim packet generated! Demo lead logged.");
    } catch (error) {
      console.error("Error generating sample:", error);
      toast.error("Failed to generate sample. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">
            Seeksy Sales Opportunity
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Veteran Benefits Platform
          </h1>
          <p className="text-xl text-orange-100 max-w-2xl mb-8">
            AI-powered VA claims assistance that helps veterans understand their benefits 
            and file Intent to File in minutes, not months.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to="/yourbenefits">
              <Button size="lg" className="bg-white text-orange-700 hover:bg-orange-50">
                View Live Demo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/yourbenefits/claims-agent">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Try AI Claims Agent
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Key Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Veterans Underserved", value: "22M+", icon: Users },
            { label: "Avg. Claims Backlog", value: "6-12 mo", icon: FileText },
            { label: "Miss Intent to File", value: "70%", icon: TrendingUp },
            { label: "Lost Benefits (Annual)", value: "$Billions", icon: Shield }
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <stat.icon className="w-5 h-5 text-orange-500" />
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Product Overview */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-bold mb-4">The Problem</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>• Most veterans don't file claims until situations become severe</p>
              <p>• They don't understand the benefits they're entitled to</p>
              <p>• The VA claims process is confusing and overwhelming</p>
              <p>• 70% miss Intent to File, which preserves retro pay</p>
              <p>• No mobile-friendly, conversational way to start</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Solution</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                AI Claims Agent guides veterans conversationally
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Files Intent to File in minutes
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Generates structured claims packets
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Connects to professional filing partners
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Drives high-quality inbound leads
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Product Features */}
        <h2 className="text-2xl font-bold mb-6">Platform Components</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Calculator className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle>Benefit Calculators</CardTitle>
              <CardDescription>
                Three specialized calculators for Military Buy-Back, MRA retirement, and Sick Leave conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/yourbenefits/calculators/military-buyback">
                <Button variant="outline" size="sm" className="w-full">
                  Try Calculator Demo
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle>AI Claims Agent</CardTitle>
              <CardDescription>
                Conversational AI that guides veterans through benefits eligibility and Intent to File
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/yourbenefits/claims-agent">
                <Button variant="outline" size="sm" className="w-full">
                  Try Claims Agent Demo
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle>Claims Packet Generator</CardTitle>
              <CardDescription>
                Automatically generates structured packets for partner company handoff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleGenerateSamplePacket}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : pdfGenerated ? (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Sample Generated
                  </>
                ) : (
                  "Generate Sample Packet"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Model */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Revenue Model</CardTitle>
            <CardDescription>
              Multiple monetization pathways for the Veteran Benefits Platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Lead Generation</h4>
                <p className="text-sm text-muted-foreground">
                  High-quality leads to claims filing partners. CPL model with premium pricing for pre-qualified veterans.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">White-Label Licensing</h4>
                <p className="text-sm text-muted-foreground">
                  License the platform to veteran service organizations, law firms, and claims companies.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Enterprise Partnerships</h4>
                <p className="text-sm text-muted-foreground">
                  Strategic partnerships with VA-accredited agents and attorneys for referral revenue.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold mb-4">Interested in learning more?</h3>
          <p className="text-muted-foreground mb-6">
            Contact us to discuss partnership opportunities or investment.
          </p>
          <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
            Schedule a Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
