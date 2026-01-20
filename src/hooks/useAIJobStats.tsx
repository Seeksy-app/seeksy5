import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AIJobStats {
  totalEdits: number;
  lastJobStatus: string | null;
  lastJobError: string | null;
  hasAIJob: boolean;
}

export const useAIJobStats = (mediaId: string) => {
  return useQuery({
    queryKey: ["ai-job-stats", mediaId],
    queryFn: async (): Promise<AIJobStats> => {
      // Get the most recent completed AI job for this media
      const { data: jobs, error: jobsError } = await supabase
        .from("ai_jobs")
        .select("id, status, error_message")
        .eq("source_media_id", mediaId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1);

      if (jobsError) throw jobsError;

      if (!jobs || jobs.length === 0) {
        return {
          totalEdits: 0,
          lastJobStatus: null,
          lastJobError: null,
          hasAIJob: false,
        };
      }

      const latestJob = jobs[0];

      // Count edit events for this job
      const { count, error: countError } = await supabase
        .from("ai_edit_events")
        .select("*", { count: "exact", head: true })
        .eq("ai_job_id", latestJob.id);

      if (countError) throw countError;

      return {
        totalEdits: count || 0,
        lastJobStatus: latestJob.status,
        lastJobError: latestJob.error_message,
        hasAIJob: true,
      };
    },
    enabled: !!mediaId,
  });
};
