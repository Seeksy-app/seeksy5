import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AIProcessingStatusProps {
  mediaId: string;
}

export const AIProcessingStatus = ({ mediaId }: AIProcessingStatusProps) => {
  const { data: latestJob, isLoading } = useQuery({
    queryKey: ["ai-job-status", mediaId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("ai_jobs")
        .select("id, status, error_message, created_at, completed_at")
        .eq("source_media_id", mediaId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (result.error) throw result.error;
      return result.data as any;
    },
    refetchInterval: (query) => {
      // Refetch every 5 seconds if processing
      if (query.state.data?.status === "processing" || query.state.data?.status === "queued") {
        return 5000;
      }
      return false;
    },
  });

  if (isLoading || !latestJob) return null;

  if (latestJob.status === "processing" || latestJob.status === "queued") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        {latestJob.status === "queued" ? "Queued" : "Processing"}
      </Badge>
    );
  }

  if (latestJob.status === "completed") {
    return (
      <Badge variant="default" className="gap-1 bg-green-500">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </Badge>
    );
  }

  if (latestJob.status === "failed") {
    return (
      <div className="space-y-2">
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Failed
        </Badge>
        {latestJob.error_message && (
          <Alert variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription>
              {latestJob.error_message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return null;
};
