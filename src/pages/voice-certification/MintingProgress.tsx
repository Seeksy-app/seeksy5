import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2, Shield, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface MintingStep {
  label: string;
  status: "pending" | "active" | "complete";
  progress: number;
}

const MintingProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [steps, setSteps] = useState<MintingStep[]>([
    { label: "Generating signature…", status: "active", progress: 0 },
    { label: "Encrypting voice fingerprint…", status: "pending", progress: 0 },
    { label: "Writing credential to blockchain…", status: "pending", progress: 0 },
    { label: "Finalizing verification…", status: "pending", progress: 0 },
  ]);
  const [mintingError, setMintingError] = useState<string | null>(null);

  useEffect(() => {
    mintVoiceNFT();
  }, []);

  const mintVoiceNFT = async () => {
    try {
      // Step 1: Generating signature
      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[0].progress = 50;
        return newSteps;
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[0].progress = 100;
        newSteps[0].status = "complete";
        newSteps[1].status = "active";
        return newSteps;
      });

      // Step 2: Encrypting voice fingerprint
      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[1].progress = 50;
        return newSteps;
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[1].progress = 100;
        newSteps[1].status = "complete";
        newSteps[2].status = "active";
        return newSteps;
      });

      // Step 3: Writing credential to blockchain (actual minting)
      const voiceProfileId = location.state?.voiceProfileId || crypto.randomUUID();
      const voiceFingerprint = location.state?.voiceFingerprint || crypto.randomUUID();

      const { data, error } = await supabase.functions.invoke('mint-voice-nft', {
        body: {
          voiceProfileId,
          voiceFingerprint,
          metadata: {
            name: location.state?.fingerprintData?.voiceName || "Voice Profile",
            description: "Seeksy Voice Certification",
            attributes: {
              matchConfidence: location.state?.fingerprintData?.matchConfidence || 95,
              certificationDate: new Date().toISOString()
            }
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to mint voice NFT');
      }

      if (!data?.success) {
        throw new Error('Minting returned unsuccessful status');
      }

      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[2].progress = 100;
        newSteps[2].status = "complete";
        newSteps[3].status = "active";
        return newSteps;
      });

      // Step 4: Finalizing
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[3].progress = 100;
        newSteps[3].status = "complete";
        return newSteps;
      });

      // Navigate to success with transaction data
      setTimeout(() => {
        navigate("/voice-certification/success", {
          state: {
            ...location.state,
            tokenId: data.tokenId,
            blockchain: "Polygon",
            transactionHash: data.transactionHash,
            explorerUrl: data.explorerUrl,
            voiceProfileId: location.state?.voiceProfileId,
            voiceFingerprint: location.state?.voiceFingerprint
          }
        });
      }, 500);

    } catch (error) {
      console.error('Minting error:', error);
      setMintingError(error instanceof Error ? error.message : 'Unknown error occurred');
      
      // Mark all steps as failed
      setSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'complete' ? 'complete' : 'pending',
        progress: step.status === 'complete' ? 100 : 0
      })));

      toast({
        title: "Minting failed",
        description: "Please retry the certification process.",
        variant: "destructive",
        duration: 5000
      });

      // Do NOT navigate on error - stay on error screen
    }
  };

  const overallProgress = (steps.filter(s => s.status === "complete").length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <CertificationStepper 
          currentStep={6} 
          totalSteps={7} 
          stepLabel="Minting in Progress"
        />

        <Card className="p-8 md:p-12">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Shield className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold">Securing your voice on the blockchain</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We're creating a permanent, verifiable record of your voice identity. This helps prevent impersonation and protects how your voice is used on Seeksy.
            </p>
          </div>

          <Progress value={overallProgress} className="w-full h-3 mb-8" />

          {mintingError && (
            <Card className="border-destructive bg-destructive/5 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="font-medium">Minting failed</p>
                    <p className="text-sm text-destructive/80">
                      Something went wrong saving your credential. Please retry the certification process, or contact support if this continues.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/voice-certification-flow')}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  Retry Certification
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6 max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.label} className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    step.status === "complete" 
                      ? "bg-primary text-primary-foreground" 
                      : step.status === "active"
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {step.status === "complete" ? (
                      <Check className="h-6 w-6" />
                    ) : step.status === "active" ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <span className="text-lg font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-lg font-semibold ${
                        step.status === "active" ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {step.label}
                      </span>
                      {step.status !== "pending" && (
                        <span className="text-sm text-muted-foreground">{step.progress}%</span>
                      )}
                    </div>
                    {step.status !== "pending" && (
                      <Progress value={step.progress} className="h-2" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-12 mt-12 border-t">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Gasless transaction covered by Seeksy
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MintingProgress;
