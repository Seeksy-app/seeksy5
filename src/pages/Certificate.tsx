import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ExternalLink, Copy, ArrowLeft, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CertificationBadge } from "@/components/clips/CertificationBadge";
import { CertificationSection } from "@/components/clips/CertificationSection";

export default function Certificate() {
  const { clipId } = useParams();
  const navigate = useNavigate();

  const { data: clip, isLoading } = useQuery({
    queryKey: ["certificate", clipId],
    queryFn: async () => {
      if (!clipId) throw new Error("Clip ID required");

      const { data, error } = await supabase
        .from("clips")
        .select(`
          id,
          title,
          created_at,
          cert_status,
          cert_chain,
          cert_tx_hash,
          cert_token_id,
          cert_explorer_url,
          cert_created_at,
          user_id,
          thumbnail_url
        `)
        .eq("id", clipId)
        .single();

      if (error) throw error;

      // Get creator name
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", data.user_id)
        .single();

      return { ...data, creator: profile };
    },
  });

  const handleCopyHash = () => {
    if (clip?.cert_tx_hash) {
      navigator.clipboard.writeText(clip.cert_tx_hash);
      toast.success("Transaction hash copied");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!clip) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Certificate not found</p>
            <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="border-2">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <CardTitle className="text-3xl">
                  Certified by Seeksy
                </CardTitle>
              </div>
              <CardDescription className="text-base">
                Clip Authenticity Certificate
              </CardDescription>
            </div>
            <div className="flex justify-center">
              <CertificationBadge status={clip.cert_status as any} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Clip Thumbnail */}
            {clip.thumbnail_url && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  src={clip.thumbnail_url}
                  className="w-full h-full object-contain"
                  muted
                  playsInline
                />
              </div>
            )}

            {/* Clip Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Clip Title</p>
                <p className="text-sm font-semibold">{clip.title || "Untitled Clip"}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Creator</p>
                <p className="text-sm font-semibold">
                  {clip.creator?.full_name || clip.creator?.username || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Clip ID</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">{clip.id}</code>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Created At</p>
                <p className="text-sm">
                  {format(new Date(clip.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>

              {clip.cert_created_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Certified At</p>
                  <p className="text-sm">
                    {format(new Date(clip.cert_created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
            </div>

            {/* Blockchain Information */}
            {clip.cert_status === "minted" && (
              <div className="space-y-4 p-6 border rounded-lg">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Blockchain Details
                </h3>

                {clip.cert_chain && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Chain</p>
                    <Badge variant="outline" className="capitalize">
                      {clip.cert_chain}
                    </Badge>
                  </div>
                )}

                {clip.cert_tx_hash && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Transaction Hash</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-muted px-3 py-2 rounded font-mono break-all flex-1">
                        {clip.cert_tx_hash}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyHash}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {clip.cert_token_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Token ID</p>
                    <code className="text-xs bg-muted px-3 py-2 rounded font-mono">
                      {clip.cert_token_id}
                    </code>
                  </div>
                )}

                {clip.cert_explorer_url && (
                  <Button
                    className="w-full"
                    onClick={() => window.open(clip.cert_explorer_url!, "_blank")}
                  >
                    View on Blockchain Explorer
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-6 border-t space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Seeksy uses smart contracts on the Polygon blockchain to anchor creator clip certifications.
                This certificate proves that this clip was officially certified for the wallet above at the time shown.
              </p>
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Issued by <span className="font-semibold text-foreground">Seeksy</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Verified media identity for creators
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
