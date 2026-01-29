import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateShotstackClipParams {
  clipId: string;
  cloudflareDownloadUrl: string;
  start?: number;
  length: number;
  orientation?: 'vertical' | 'horizontal';
  templateName?: string;
  enableCertification?: boolean;
}

interface RenderWithCaptionsParams {
  clipId: string;
  sourceVideoUrl: string;
  startTime: number;
  duration: number;
  title?: string;
  existingTranscript?: string;
  orientation?: 'vertical' | 'horizontal';
  captionStyle?: {
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
    highlightColor?: string;
    position?: 'bottom' | 'center' | 'top';
    animation?: 'pop' | 'fade' | 'bounce' | 'none';
  };
  enableCertification?: boolean;
}

interface ClipStatus {
  id: string;
  status: string;
  shotstack_status?: string;
  vertical_url?: string;
  thumbnail_url?: string;
  error_message?: string;
}

export const useShotstackClips = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();

  /**
   * Submit a basic Shotstack render (legacy method)
   */
  const submitShotstackRender = async (params: CreateShotstackClipParams) => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-shotstack-render', {
        body: params,
      });

      if (error) throw error;

      toast({
        title: "Clip render started",
        description: "Your clip is being processed. You'll be notified when it's ready.",
      });

      return data;
    } catch (error) {
      console.error("Shotstack render submission error:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      toast({
        title: "Render failed",
        description: `${errorMessage}. Please try again or contact support.`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * NEW: Render clip with word-by-word animated captions (OpusClip-style)
   * Uses Whisper for transcription + Shotstack for rendering
   */
  const renderWithDynamicCaptions = async (params: RenderWithCaptionsParams) => {
    setIsProcessing(true);
    setIsTranscribing(true);

    try {
      toast({
        title: "Processing clip",
        description: "Transcribing audio and generating animated captions...",
      });

      const { data, error } = await supabase.functions.invoke('render-clip-with-captions', {
        body: params,
      });

      if (error) throw error;

      setIsTranscribing(false);

      toast({
        title: "Clip rendering",
        description: `Generating clip with ${data.captionSegments || 0} caption segments...`,
      });

      return data;
    } catch (error) {
      console.error("Render with captions error:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      toast({
        title: "Caption render failed",
        description: `${errorMessage}. Falling back to basic render...`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
      setIsTranscribing(false);
    }
  };

  /**
   * Transcribe audio using Whisper with word-level timestamps
   */
  const transcribeWithWhisper = async (audioUrl: string, mediaId?: string, clipId?: string) => {
    setIsTranscribing(true);

    try {
      const { data, error } = await supabase.functions.invoke('transcribe-whisper', {
        body: {
          audio_url: audioUrl,
          media_id: mediaId,
          clip_id: clipId,
          language: 'en',
        },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Whisper transcription error:", error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  const getClipStatus = async (clipId: string): Promise<ClipStatus> => {
    const result = await (supabase as any)
      .from("clips")
      .select("id, status, shotstack_status, vertical_url, thumbnail_url, error_message")
      .eq("id", clipId)
      .single();

    if (result.error) throw result.error;
    return result.data as ClipStatus;
  };

  const pollClipStatus = async (
    clipId: string,
    onStatusChange?: (status: string) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<ClipStatus> => {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;

        try {
          const clip = await getClipStatus(clipId);

          if (onStatusChange) {
            onStatusChange(clip.status);
          }

          // Check if render is complete
          if (clip.status === "ready" && clip.vertical_url) {
            clearInterval(interval);
            resolve(clip);
            return;
          }

          // Check if render failed
          if (clip.status === "failed") {
            clearInterval(interval);
            reject(new Error(clip.error_message || "Render failed"));
            return;
          }

          // Check if max attempts reached
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            reject(new Error("Polling timeout - render is taking longer than expected"));
            return;
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, intervalMs);
    });
  };

  return {
    // Legacy method
    submitShotstackRender,
    // NEW: Word-by-word captions
    renderWithDynamicCaptions,
    transcribeWithWhisper,
    // Status methods
    getClipStatus,
    pollClipStatus,
    // State
    isProcessing,
    isTranscribing,
  };
};
