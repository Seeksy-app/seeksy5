import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

const IdentityCertificatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: asset, isLoading } = useQuery({
    queryKey: ["identity-certificate", id],
    queryFn: async () => {
      if (!id) throw new Error("No certificate ID");
      const { data, error } = await (supabase as any)
        .from("identity_assets")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading certificate...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="p-12 max-w-md">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Certificate not found</p>
            <Button onClick={() => navigate("/identity")}>
              Back to Identity
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const typeLabel = asset.type === "face_identity" ? "Face" : "Voice";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/identity")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Identity Hub
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/my-voice-identity")}>
            <Shield className="h-4 w-4 mr-2" />
            Voice Identity
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/identity/rights")}>
            <Shield className="h-4 w-4 mr-2" />
            Rights
          </Button>
        </div>

        <Card className="p-12">
          <div className="text-center space-y-6">
            <Shield className="h-16 w-16 mx-auto text-primary" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Identity Certificate</h1>
              <p className="text-muted-foreground">
                This identity has been verified and stored on the blockchain.
              </p>
            </div>

            {/* Details Table */}
            <Card className="border-2">
              <CardContent className="pt-6 space-y-4 text-left">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <p className="text-muted-foreground">Verification Type</p>
                  <p className="font-medium">{typeLabel}</p>

                  <p className="text-muted-foreground">Wallet</p>
                  <p className="font-mono text-xs">{asset.user_id?.slice(0, 8)}...{asset.user_id?.slice(-6)}</p>

                  {asset.cert_tx_hash && (
                    <>
                      <p className="text-muted-foreground">Transaction</p>
                      <p className="font-mono text-xs">{asset.cert_tx_hash.slice(0, 10)}...{asset.cert_tx_hash.slice(-8)}</p>
                    </>
                  )}

                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="text-xs">
                    {format(new Date(asset.created_at), "MMM d, yyyy – HH:mm")} UTC
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              {asset.cert_explorer_url && (
                <Button 
                  onClick={() => window.open(asset.cert_explorer_url!, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Polygon
                </Button>
              )}
              <Button 
                onClick={() => navigate("/identity")}
                variant="outline"
                className="w-full"
              >
                Back to Identity
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IdentityCertificatePage;
