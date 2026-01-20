import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdSlot {
  slotType: 'pre_roll' | 'mid_roll' | 'post_roll';
  positionSeconds?: number;
  adFileUrl: string;
  adDuration: number;
}

export const useVideoProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processVideo = async (
    mediaFileId: string,
    jobType: 'ai_edit' | 'ad_insertion' | 'full_process',
    config?: { adSlots?: AdSlot[] }
  ) => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-video', {
        body: {
          mediaFileId,
          jobType,
          config,
        },
      });

      if (error) throw error;

      toast({
        title: "Video processing started",
        description: "You'll be notified when processing is complete",
      });

      return data;
    } catch (error) {
      console.error("Video processing error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      toast({
        title: "AI enhancement failed",
        description: `${errorMessage}. Please try again or contact support if this persists.`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const getProcessingStatus = async (jobId: string) => {
    const { data, error } = await supabase
      .from("media_processing_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) throw error;
    return data;
  };

  const getMediaVersions = async (mediaFileId: string) => {
    const { data, error } = await supabase
      .from("media_versions")
      .select("*")
      .eq("original_media_id", mediaFileId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  };

  return {
    processVideo,
    getProcessingStatus,
    getMediaVersions,
    isProcessing,
  };
};