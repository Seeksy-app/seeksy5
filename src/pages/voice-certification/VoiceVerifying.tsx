import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VoiceVerifying = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<string>("Analyzing your voice fingerprint…");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    verifyAndMint();
  }, []);

  const verifyAndMint = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate voice hash (simplified - in production use actual audio processing)
      const audioData = location.state?.audioData || "";
      const encoder = new TextEncoder();
      const data = encoder.encode(audioData + user.id + Date.now());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const voiceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Call unified verification + minting function
      setStatus("Creating voice identity record…");
      
      const { data: result, error: verifyError } = await supabase.functions.invoke('verify-voice-and-mint', {
        body: {
          audioData,
          recordingDuration: location.state?.recordingTime || 0,
          selectedPrompt: location.state?.selectedPrompt || ""
        }
      });

      if (verifyError) throw verifyError;
      if (!result.success) throw new Error(result.error || "Verification failed");

      // Success - navigate to success page
      navigate("/identity/voice/success", {
        state: {
          voiceProfileId: result.voiceProfileId,
          voiceHash: result.voiceHash,
          tokenId: result.certificate.token_id,
          explorerUrl: result.certificate.explorer_url,
          transactionHash: result.certificate.tx_hash
        }
      });

    } catch (err) {
      console.error('Verification error:', err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      
      if (errorMsg.includes("private key")) {
        setError("Blockchain configuration error. Please contact support.");
      } else if (errorMsg.includes("transaction")) {
        setError("Blockchain minting failed. Please try again.");
      } else if (errorMsg.includes("database")) {
        setError("Database error. Please contact support.");
      }

      toast.error("Verification failed", {
        description: "Please try again or contact support."
      });
    }
  };

  const generateVoiceHash = async (audioData: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(audioData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {error && (
          <Button variant="ghost" onClick={() => navigate("/identity")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Identity
          </Button>
        )}

        <Card className="p-12">
          <div className="text-center space-y-6">
            {!error ? (
              <>
                <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                <div>
                  <h1 className="text-2xl font-bold mb-2">{status}</h1>
                  <p className="text-sm text-muted-foreground">
                    This may take 10–20 seconds.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
                <div>
                  <h1 className="text-2xl font-bold mb-2 text-destructive">Verification Failed</h1>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => navigate("/identity/voice/consent")}>
                    Try Again
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceVerifying;
