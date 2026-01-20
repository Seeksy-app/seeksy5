import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, CheckCircle, TrendingUp } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";

const MatchConfidence = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fingerprintData = location.state?.fingerprintData || {
    matchConfidence: 98,
    voiceName: "Christy Louis"
  };

  const handleApproveAndMint = () => {
    navigate("/voice-certification/approve-mint", {
      state: { ...location.state }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <CertificationStepper 
          currentStep={4} 
          totalSteps={7} 
          stepLabel="Verification Results"
        />

        <Card className="p-8 md:p-12">
          <div className="text-center space-y-6 mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>

            <h2 className="text-3xl font-bold">Voice Identity Match</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              We compare your new sample to your voice fingerprint to confirm that the voice belongs to you.
            </p>
          </div>

          {/* Match Confidence Display */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <div className="text-center mb-6">
                <div className="text-7xl font-bold text-primary mb-2">
                  {fingerprintData.matchConfidence}%
                </div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Match Confidence Score
                </p>
              </div>

              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-1000"
                  style={{ width: `${fingerprintData.matchConfidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 border-2">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Match Confidence Score</span>
              </div>
              <p className="text-lg font-semibold">{fingerprintData.matchConfidence}%</p>
            </Card>

            <Card className="p-4 border-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Voice Similarity Analysis</span>
              </div>
              <p className="text-lg font-semibold text-green-500">Verified</p>
            </Card>

            <Card className="p-4 border-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Anti-Fraud Audio Checks</span>
              </div>
              <p className="text-lg font-semibold">Passed</p>
            </Card>
          </div>

          {/* Security note */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security note
            </h3>
            <p className="text-sm text-muted-foreground">
              This process ensures no one can impersonate your voice across Seeksy.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="ghost"
              onClick={() => navigate("/voice-certification/fingerprint")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleApproveAndMint}
            >
              <Shield className="mr-2 h-5 w-5" />
              Approve & Continue
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MatchConfidence;
