import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, ShieldCheck, ShieldX, Clock, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

export const MatchesAlertsTab = () => {
  const queryClient = useQueryClient();

  const { data: matches, isLoading } = useQuery({
    queryKey: ["content-matches"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("content_matches")
        .select("*")
        .eq("user_id", user.id)
        .order("detected_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: string; status: string }) => {
      const { error } = await supabase
        .from("content_matches")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", matchId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-matches"] });
      const message = variables.status === "authorized" 
        ? "Marked as authorized use" 
        : "Marked as unauthorized - you may take action";
      toast.success(message);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unauthorized":
        return <ShieldX className="h-4 w-4 text-red-500" />;
      case "authorized":
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "unauthorized":
        return "Unauthorized";
      case "authorized":
        return "Authorized";
      default:
        return "Pending Review";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unauthorized":
        return "bg-red-500/10 text-red-600 border-red-200";
      case "authorized":
        return "bg-green-500/10 text-green-600 border-green-200";
      default:
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "youtube":
        return "bg-red-500/10 text-red-600";
      case "spotify":
        return "bg-green-500/10 text-green-600";
      case "instagram":
        return "bg-pink-500/10 text-pink-600";
      case "facebook":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Matches & Alerts</h2>
        <p className="text-sm text-muted-foreground">
          Review detected content matches and mark as authorized or unauthorized
        </p>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-muted-foreground">
          <strong>How it works:</strong> Our system detects when your content appears on other platforms. 
          Review each match and mark it as <strong>Authorized</strong> (you gave permission) or 
          <strong> Unauthorized</strong> (potential infringement). Unauthorized matches can be used as evidence for takedown requests.
        </p>
      </Card>

      {matches && matches.length > 0 ? (
        <div className="grid gap-4">
          {matches.map((match) => (
            <Card key={match.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {getStatusIcon(match.status)}
                    <h3 className="font-medium">{match.external_title || "Unknown Content"}</h3>
                    <Badge className={getPlatformColor(match.platform)}>
                      {match.platform}
                    </Badge>
                    <Badge className={getStatusColor(match.status)}>
                      {getStatusLabel(match.status)}
                    </Badge>
                  </div>

                  {match.external_channel_name && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Channel: {match.external_channel_url ? (
                        <a href={match.external_channel_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {match.external_channel_name}
                        </a>
                      ) : match.external_channel_name}
                    </p>
                  )}

                  <a 
                    href={match.external_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-primary hover:underline mb-2 block break-all"
                  >
                    {match.external_url}
                  </a>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>Similarity: {match.similarity_score || "N/A"}%</span>
                    <span>Type: {match.match_type}</span>
                    <span>Detected: {new Date(match.detected_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <a href={match.external_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </a>
                  </Button>

                  {match.status === "pending_review" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => updateStatusMutation.mutate({ matchId: match.id, status: "authorized" })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Authorized
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => updateStatusMutation.mutate({ matchId: match.id, status: "unauthorized" })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Unauthorized
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatusMutation.mutate({ matchId: match.id, status: "pending_review" })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No Matches Found</h3>
          <p className="text-sm text-muted-foreground">
            We haven't detected any use of your content on external platforms yet.
            Register your content in "My Proofs" to start monitoring.
          </p>
        </Card>
      )}
    </div>
  );
};
