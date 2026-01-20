import { useState, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClipJobOptions {
  autoHookDetection: boolean;
  speakerDetection: boolean;
  highEnergyMoments: boolean;
  exportFormats: string[];
}

export interface ClipJob {
  id: string;
  user_id: string;
  source_media_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  options: any; // JSONB from database
  total_clips: number;
  error_message: string | null;
  progress_percent: number;
  current_step: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface Clip {
  id: string;
  user_id: string;
  source_media_id: string;
  clip_job_id: string | null;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number | null;
  storage_path: string | null;
  vertical_url: string | null;
  thumbnail_url: string | null;
  title: string | null;
  suggested_caption: string | null;
  virality_score: number | null;
  hook_score: number | null;
  aspect_ratio: string | null;
  template_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export function useClipGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<ClipJob | null>(null);
  const [generatedClips, setGeneratedClips] = useState<Clip[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const generateClips = useCallback(async (
    sourceMediaId: string,
    options: ClipJobOptions
  ) => {
    setIsGenerating(true);
    setGeneratedClips([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-clips", {
        body: {
          sourceMediaId,
          options,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to start clip generation");
      }

      if (!data.jobId) {
        throw new Error("No job ID returned");
      }

      // Start polling for job status
      startPolling(data.jobId, sourceMediaId);

      toast({
        title: "Clip generation started",
        description: "We're analyzing your video for viral moments...",
      });

      return data;
    } catch (error) {
      console.error("Clip generation error:", error);
      setIsGenerating(false);
      
      toast({
        title: "Failed to start clip generation",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast]);

  const startPolling = useCallback((jobId: string, sourceMediaId: string) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const pollJob = async () => {
      try {
        // Fetch job status
        const { data: job, error: jobError } = await supabase
          .from("clip_jobs")
          .select("*")
          .eq("id", jobId)
          .single();

        if (jobError) {
          console.error("Error fetching job:", jobError);
          return;
        }

        setCurrentJob(job as unknown as ClipJob);

        if (job.status === "completed") {
          // Fetch generated clips
          const { data: clips } = await supabase
            .from("clips")
            .select("*")
            .eq("clip_job_id", jobId)
            .eq("status", "ready")
            .order("virality_score", { ascending: false });

          setGeneratedClips((clips || []) as Clip[]);
          setIsGenerating(false);
          
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ["clips"] });
          queryClient.invalidateQueries({ queryKey: ["media-files"] });

          toast({
            title: "Clips generated!",
            description: `${job.total_clips} clips are ready to view and download.`,
          });
        } else if (job.status === "failed") {
          setIsGenerating(false);
          
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }

          toast({
            title: "Clip generation failed",
            description: job.error_message || "Please try again",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Initial fetch
    pollJob();

    // Poll every 2 seconds
    pollingRef.current = setInterval(pollJob, 2000);
  }, [queryClient, toast]);

  const fetchClipsForMedia = useCallback(async (sourceMediaId: string) => {
    const { data: clips, error } = await supabase
      .from("clips")
      .select("*")
      .eq("source_media_id", sourceMediaId)
      .eq("status", "ready")
      .is("deleted_at", null)
      .order("virality_score", { ascending: false });

    if (error) {
      console.error("Error fetching clips:", error);
      return [];
    }

    return (clips || []) as Clip[];
  }, []);

  const getJobStatus = useCallback(async (jobId: string) => {
    const { data, error } = await supabase
      .from("clip_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error) throw error;
    return data as unknown as ClipJob;
  }, []);

  const cancelPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsGenerating(false);
    setCurrentJob(null);
  }, []);

  return {
    generateClips,
    fetchClipsForMedia,
    getJobStatus,
    cancelPolling,
    isGenerating,
    currentJob,
    generatedClips,
  };
}
