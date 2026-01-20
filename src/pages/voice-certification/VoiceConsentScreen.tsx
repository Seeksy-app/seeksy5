import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VoiceConsentScreen = () => {
  const navigate = useNavigate();
  const [consentName, setConsentName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const name = user?.user_metadata?.full_name || "";
    const email = user?.email || "";
    setConsentName(name);
    setUserEmail(email);
  };

  const handleContinue = async () => {
    if (!consentName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!consentConfirmed) {
      toast.error("Please confirm this is your voice");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Log consent to CRM
      const { error: contactError } = await supabase
        .from('contacts')
        .upsert({
          user_id: user.id,
          email: userEmail,
          name: consentName,
          notes: `Voice verification consent confirmed on ${new Date().toISOString()}`,
          lead_status: 'active',
          lead_source: 'Voice Verification'
        }, {
          onConflict: 'user_id,email'
        });

      if (contactError) {
        console.error("Error logging to CRM:", contactError);
      }

      toast.success("Consent confirmed");
      
      // Navigate to script selection with user name
      navigate("/identity/voice/script", {
        state: { displayName: consentName }
      });
    } catch (error) {
      console.error("Error processing consent:", error);
      toast.error("Failed to process consent");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/identity")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Main Card */}
        <Card className="p-8 md:p-12 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="space-y-8">
            {/* Title */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Voice Verification Consent
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Before we begin, please confirm your identity and consent to voice verification.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={consentName}
                  onChange={(e) => setConsentName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-12 text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  This will be used to personalize your verification script.
                </p>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start space-x-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <Checkbox
                  id="consent"
                  checked={consentConfirmed}
                  onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                  className="mt-1"
                />
                <Label
                  htmlFor="consent"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I confirm this is my real voice and I consent to Seeksy using this recording solely for identity verification and account security purposes.
                </Label>
              </div>

              {/* Note: Script will be shown on the next screen */}
              <p className="text-xs text-center text-muted-foreground">
                You'll see your personalized verification script on the next screen.
              </p>
            </div>

            {/* Continue Button */}
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!consentName.trim() || !consentConfirmed || isLoading}
              className="w-full h-14 text-lg font-semibold"
            >
              {isLoading ? "Processing..." : "Continue to Verification"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceConsentScreen;
