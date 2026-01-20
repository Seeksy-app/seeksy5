import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Camera, Mic, Video, Sparkles, ExternalLink, CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface IdentityAsset {
  id: string;
  type: string;
  cert_status: string;
  permissions: {
    clip_use: boolean;
    ai_generation: boolean;
    advertiser_access: boolean;
    anonymous_training: boolean;
  };
}

interface AdvertiserAccessTabProps {
  assets: IdentityAsset[];
  username: string;
}

export function AdvertiserAccessTab({ assets, username }: AdvertiserAccessTabProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: requests = [] } = useQuery({
    queryKey: ["identity-requests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("identity_requests")
        .select("*")
        .eq("creator_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, message }: { requestId: string; status: string; message?: string }) => {
      const { error } = await supabase
        .from("identity_requests")
        .update({
          status,
          responded_at: new Date().toISOString(),
          response_message: message,
        })
        .eq("id", requestId);

      if (error) throw error;

      // Log the action to identity_access_logs
      const { data: { user } } = await supabase.auth.getUser();
      if (user && assets.length > 0) {
        await supabase.from("identity_access_logs").insert({
          identity_asset_id: assets[0].id,
          action: status === "approved" ? "access_granted" : "access_denied",
          actor_id: user.id,
          details: {
            request_id: requestId,
            status,
            message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["identity-requests"] });
      queryClient.invalidateQueries({ queryKey: ["identity-access-logs"] });
      toast.success(variables.status === "approved" ? "Request approved" : "Request rejected");
    },
    onError: (error) => {
      toast.error("Failed to update request: " + error.message);
    },
  });

  const handleApprove = (requestId: string) => {
    updateRequestMutation.mutate({ requestId, status: "approved" });
  };

  const handleReject = (requestId: string) => {
    updateRequestMutation.mutate({ requestId, status: "rejected" });
  };

  const faceIdentity = assets.find(a => a.type === "face_identity" && a.cert_status === "minted");
  const voiceIdentity = assets.find(a => a.type === "voice_identity" && a.cert_status === "minted");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-200";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "revoked":
        return "bg-gray-500/10 text-gray-600 border-gray-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* My Identity Packages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Identity Packages</CardTitle>
              <CardDescription>Certified identity assets available for licensing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Face Identity */}
            <div className={`border-2 rounded-lg p-4 ${faceIdentity ? 'border-primary/20 bg-primary/5' : 'border-muted bg-muted/30'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${faceIdentity ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Camera className={`h-5 w-5 ${faceIdentity ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">Face Identity</h4>
                    {faceIdentity && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Certified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {faceIdentity ? "Blockchain-verified face identity" : "Not certified yet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Voice Identity */}
            <div className={`border-2 rounded-lg p-4 ${voiceIdentity ? 'border-primary/20 bg-primary/5' : 'border-muted bg-muted/30'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${voiceIdentity ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Mic className={`h-5 w-5 ${voiceIdentity ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">Voice Identity</h4>
                    {voiceIdentity && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Certified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {voiceIdentity ? "Blockchain-verified voice identity" : "Not certified yet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Clips */}
            <div className="border-2 rounded-lg p-4 border-muted bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Video className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Certified Clips</h4>
                  <p className="text-xs text-muted-foreground">
                    Clips using your certified identity
                  </p>
                </div>
              </div>
            </div>

            {/* AI Likeness */}
            <div className={`border-2 rounded-lg p-4 ${assets.some(a => a.permissions.ai_generation) ? 'border-primary/20 bg-primary/5' : 'border-muted bg-muted/30'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${assets.some(a => a.permissions.ai_generation) ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Sparkles className={`h-5 w-5 ${assets.some(a => a.permissions.ai_generation) ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">AI Likeness</h4>
                  <p className="text-xs text-muted-foreground">
                    {assets.some(a => a.permissions.ai_generation) ? "AI generation enabled (with approval)" : "AI generation restricted"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Button */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`/creator/${username}/identity`, "_blank")}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview What Advertisers See
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advertiser Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Advertiser Requests</CardTitle>
          <CardDescription>
            Brands requesting permission to use your identity in campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No advertiser requests yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                When brands request to use your identity, they'll appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Advertiser</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Rights Requested</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.advertiser_company}</p>
                        <p className="text-xs text-muted-foreground">{request.advertiser_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{request.campaign_name || "—"}</p>
                        {request.budget_range && (
                          <p className="text-xs text-muted-foreground">{request.budget_range}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(request.rights_requested as string[]).map((right, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {right}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {request.duration_days ? `${request.duration_days} days` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={updateRequestMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            disabled={updateRequestMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {request.responded_at && format(new Date(request.responded_at), "MMM d, yyyy")}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
