import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Award } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";

const ApproveAndMint = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fingerprintData = location.state?.fingerprintData || {
    matchConfidence: 98,
    voiceName: "Christy Louis"
  };

  const handleMintNFT = () => {
    navigate("/voice-certification/minting-progress", {
      state: { ...location.state }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <CertificationStepper 
          currentStep={5} 
          totalSteps={7} 
          stepLabel="Review & Approve"
        />

        <Card className="p-8 md:p-12">
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Approve & Mint Your Voice Credential</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Your verified voice identity will be minted as a secure credential on the blockchain. This protects your voice and proves ownership anywhere your audio appears.
            </p>
          </div>

          {/* Credential Preview Card */}
          <Card className="max-w-lg mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{fingerprintData.voiceName}</h3>
                <p className="text-sm text-muted-foreground">Voice Owner</p>
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Match Confidence</span>
                <span className="font-bold text-xl text-primary">{fingerprintData.matchConfidence}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Verification Status</span>
                <span className="font-semibold text-green-500">✓ Verified</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Blockchain Network</span>
                <span className="font-semibold">Polygon</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Credential Type</span>
                <span className="font-semibold">Voice Identity NFT (non-transferable)</span>
              </div>
            </div>
          </Card>

          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-8">
            <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
              What happens next?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Your voice will be minted as an NFT on the Polygon blockchain</li>
              <li>• A unique certificate of authenticity will be generated</li>
              <li>• Your credential will be visible in Voice Credentials dashboard</li>
              <li>• Transaction is gasless and covered by Seeksy</li>
            </ul>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="ghost"
              onClick={() => navigate("/voice-certification/confidence")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleMintNFT}
            >
              <Shield className="mr-2 h-5 w-5" />
              Mint Voice Credential
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ApproveAndMint;
