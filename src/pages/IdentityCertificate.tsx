import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ExternalLink, ArrowLeft, Camera, Mic, Video } from "lucide-react";
import { format } from "date-fns";

const IdentityCertificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: asset, isLoading, error: queryError } = useQuery({
    queryKey: ["identity-certificate", id],
    queryFn: async () => {
      if (!id) throw new Error("No certificate ID provided");

      console.log("[IdentityCertificate] Fetching asset with ID:", id);
      const { data, error } = await supabase
        .from("identity_assets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("[IdentityCertificate] Query error:", error);
        throw error;
      }
      
      console.log("[IdentityCertificate] Asset data:", data);
      return data;
    },
    enabled: !!id,
  });

  if (queryError) {
    console.error("[IdentityCertificate] React Query error:", queryError);
  }

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-8">
        <div className="text-center">Loading certificate...</div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container max-w-3xl py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Certificate not found</p>
            <Button onClick={() => navigate("/identity")} className="mt-4">
              Return to Identity & Rights
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "face_identity":
        return Camera;
      case "voice_identity":
        return Mic;
      case "clip":
        return Video;
      default:
        return Shield;
    }
  };

  const TypeIcon = getTypeIcon(asset.type);
  const typeLabel = asset.type === "face_identity" ? "Face Identity" : 
                    asset.type === "voice_identity" ? "Voice Identity" : "Clip";

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/identity")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Identity & Rights
      </Button>

      {/* Certificate Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <TypeIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Seeksy Identity Certificate</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Officially Verified by Seeksy
                </p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-600 border-green-200">
              ✓ Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Certificate Details */}
          <div className="grid gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Certificate Type</p>
              <p className="text-lg font-semibold">{typeLabel}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Issued On</p>
              <p className="text-lg">
                {format(new Date(asset.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Blockchain</p>
              <p className="text-lg">Polygon (MATIC)</p>
            </div>

            {asset.cert_tx_hash && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {asset.cert_tx_hash.slice(0, 10)}...{asset.cert_tx_hash.slice(-8)}
                  </code>
                  {asset.cert_explorer_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(asset.cert_explorer_url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {asset.face_hash && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Face Hash</p>
                <code className="text-sm bg-muted px-2 py-1 rounded block">
                  {asset.face_hash.slice(0, 16)}...{asset.face_hash.slice(-16)}
                </code>
              </div>
            )}
          </div>

          {/* Explorer Link */}
          {asset.cert_explorer_url && (
            <div className="pt-4 border-t">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.open(asset.cert_explorer_url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Polygonscan
              </Button>
            </div>
          )}

          {/* Verification Badge */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Badge: Officially Verified by Seeksy</p>
                <p className="text-sm text-muted-foreground">
                  This certificate proves authenticity and ownership on the blockchain.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seeksy Identity Promise */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Seeksy Identity Promise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base font-semibold">Your likeness is yours.</p>
          <p className="text-sm text-muted-foreground">
            Seeksy will never sell, license, or use your face, voice, or identity without your explicit permission.
          </p>
          <p className="text-sm text-muted-foreground">
            Every use of your identity — whether in clips, AI generation, or advertising — requires your consent, recorded on-chain for transparency and security.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default IdentityCertificate;
