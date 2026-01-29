import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdSlot {
  slotType: 'pre_roll' | 'mid_roll' | 'post_roll';
  positionSeconds?: number;
  adFileUrl: string;
  adDuration: number;
}

interface MediaProcessingJob {
  id: string;
  user_id: string | null;
  job_type: string;
  status: string | null;
  input_data: any;
  output_data: any;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface MediaVersion {
  id: string;
  original_media_id: string;
  version_type: string;
  file_url: string;
  file_size: number | null;
  duration_seconds: number | null;
  metadata: any;
  created_at: string | null;
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
    const result = await (supabase as any)
      .from("media_processing_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (result.error) throw result.error;
    return result.data as MediaProcessingJob;
  };

  const getMediaVersions = async (mediaFileId: string) => {
    const result = await (supabase as any)
      .from("media_versions")
      .select("*")
      .eq("original_media_id", mediaFileId)
      .order("created_at", { ascending: false });

    if (result.error) throw result.error;
    return result.data as MediaVersion[];
  };

  return {
    processVideo,
    getProcessingStatus,
    getMediaVersions,
    isProcessing,
  };
};
