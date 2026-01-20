import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type VerifyVoiceAndMintPayload = {
  audioData: string;
  recordingDuration: number;
  selectedPrompt: string;
};

type VerifyVoiceAndMintError = {
  ok: false;
  error: 'MISSING_FIELD' | 'INVALID_AUDIO' | 'BLOCKCHAIN_ERROR' | 'DATABASE_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  field?: string;
};

type VerifyVoiceAndMintSuccess = {
  success: true;
  voiceProfileId: string;
  voiceHash: string;
  certificate: {
    token_id: string;
    tx_hash: string;
    explorer_url: string;
    contract_address: string;
  };
};

function mapVoiceError(e: VerifyVoiceAndMintError): string {
  switch (e.error) {
    case "MISSING_FIELD":
      return "Something went wrong with your recording. Please try again.";
    case "INVALID_AUDIO":
      return "We couldn't verify your voice from this recording. Try again from a quiet place and read the full sentence on screen.";
    case "BLOCKCHAIN_ERROR":
      return "Your voice was verified, but the blockchain network had an issue. Please try again in a moment.";
    case "DATABASE_ERROR":
      return "We hit a server issue saving your verification. Please try again, or contact support if this continues.";
    default:
      return "Verification failed. Please try again, or contact support if the issue continues.";
  }
}

const VoiceProcessing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { audioBlob, recordingTime, selectedPrompt, displayName } = location.state || {};

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Processing your voice sample...");
  const [waveformData] = useState<number[]>(
    Array.from({ length: 60 }, () => Math.random() * 0.6 + 0.2)
  );

  useEffect(() => {
    if (!audioBlob || !selectedPrompt) {
      navigate("/identity/voice/consent");
      return;
    }

    processVerification();
  }, []);

  const processVerification = async () => {
    if (!audioBlob) return;

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    // Update status text
    setTimeout(() => setStatusText("Analyzing voice patterns..."), 2000);
    setTimeout(() => setStatusText("Generating voice hash..."), 4000);
    setTimeout(() => setStatusText("Minting certificate on blockchain..."), 6000);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const payload: VerifyVoiceAndMintPayload = {
          audioData: base64Audio,
          recordingDuration: recordingTime,
          selectedPrompt: selectedPrompt
        };

        const { data, error: invokeError } = await supabase.functions.invoke<VerifyVoiceAndMintSuccess | VerifyVoiceAndMintError>(
          'verify-voice-and-mint',
          { body: payload }
        );

        clearInterval(progressInterval);
        setProgress(100);

        if (invokeError) {
          throw new Error(invokeError.message || "Failed to verify voice");
        }

        if (data && 'ok' in data && data.ok === false) {
          const errorResponse = data as VerifyVoiceAndMintError;
          toast.error("Verification failed", {
            description: mapVoiceError(errorResponse)
          });
          setTimeout(() => {
            navigate("/identity/voice/script", { state: { displayName } });
          }, 2000);
          return;
        }

        if (data && 'success' in data && data.success) {
          const successResponse = data as VerifyVoiceAndMintSuccess;

          // Invalidate all identity queries
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['creator_voice_profiles'] }),
            queryClient.invalidateQueries({ queryKey: ['voice_blockchain_certificates'] }),
            queryClient.invalidateQueries({ queryKey: ['voice-identity-status'] }),
            queryClient.invalidateQueries({ queryKey: ['identity-status'] }),
            queryClient.invalidateQueries({ queryKey: ['identity-status-widget'] }),
            queryClient.invalidateQueries({ queryKey: ['identity-assets'] }),
            queryClient.invalidateQueries({ queryKey: ['face-identity-status'] }),
            queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] }),
            queryClient.invalidateQueries({ queryKey: ['identity-activity-logs'] }),
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
            queryClient.invalidateQueries({ queryKey: ['identity'] }),
            queryClient.invalidateQueries({ queryKey: ['voiceCertificate'] }),
            queryClient.invalidateQueries({ queryKey: ['creatorVoiceProfile'] })
          ]);

          setTimeout(() => {
            navigate("/identity/voice/success", {
              state: {
                voiceProfileId: successResponse.voiceProfileId,
                voiceHash: successResponse.voiceHash,
                tokenId: successResponse.certificate.token_id,
                explorerUrl: successResponse.certificate.explorer_url,
                transactionHash: successResponse.certificate.tx_hash
              }
            });
          }, 500);
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error: any) {
      console.error("Error verifying voice:", error);
      clearInterval(progressInterval);
      toast.error("Verification failed", {
        description: error.message || "An unexpected error occurred"
      });
      setTimeout(() => {
        navigate("/identity/voice/script", { state: { displayName } });
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="p-8 md:p-12 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Verifying Your Voice
              </h1>
              <p className="text-lg text-muted-foreground">
                {statusText}
              </p>
            </div>

            <div className="space-y-4">
              <Progress value={progress} className="h-3" />
              <p className="text-center text-sm text-muted-foreground">
                {progress}% complete
              </p>
            </div>

            <div className="flex items-end justify-center gap-1 h-24 opacity-30">
              {waveformData.map((value, i) => (
                <div
                  key={i}
                  className="w-2 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${value * 100}%`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>• Analyzing your unique voice signature</p>
              <p>• Creating cryptographic hash</p>
              <p>• Minting certificate on Polygon blockchain</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceProcessing;
