import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceFingerprintOptions {
  audioData: string;
  recordingSource?: "studio" | "upload" | "import";
}

export const useVoiceFingerprint = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateFingerprint = async ({ 
    audioData, 
    recordingSource = "studio" 
  }: VoiceFingerprintOptions) => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-voice-fingerprint",
        {
          body: {
            audioData,
            recordingSource,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Voice Fingerprint Created",
        description: "Your voice has been cryptographically verified and secured.",
      });

      return data;
    } catch (error) {
      console.error("Error generating voice fingerprint:", error);
      toast({
        title: "Fingerprint Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateFingerprint,
    isGenerating,
  };
};
