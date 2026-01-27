import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface AIJobsDebugPanelProps {
  mediaId?: string;
}

export function AIJobsDebugPanel({ mediaId }: AIJobsDebugPanelProps) {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["ai-jobs", mediaId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("ai_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (mediaId) {
        query = query.eq("source_media_id", mediaId);
      } else {
        query = query.limit(20);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
      queued: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Jobs Debug Panel</CardTitle>
        <CardDescription>
          {mediaId ? "Jobs for this media asset" : "Recent AI processing jobs"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!jobs || jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No AI jobs found
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Job Type</TableHead>
                <TableHead>Engine</TableHead>
                <TableHead>Edits</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job: any) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      {getStatusBadge(job.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{job.job_type}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {job.engine}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {job.ai_edit_events?.length || 0} edits
                  </TableCell>
                  <TableCell>
                    {job.ai_edited_assets?.length || 0} assets
                  </TableCell>
                  <TableCell>
                    {job.processing_time_seconds 
                      ? `${job.processing_time_seconds.toFixed(2)}s`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(job.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {job.error_message && (
                      <span className="text-xs text-destructive line-clamp-2">
                        {job.error_message}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}