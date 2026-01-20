import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ExternalLink, ArrowLeft, Camera, Mic, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { toast } from "sonner";

const IdentityCertificateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: identity, isLoading } = useQuery({
    queryKey: ["identity-certificate", id],
    queryFn: async () => {
      if (!id) throw new Error("No certificate ID provided");

      const { data, error } = await supabase
        .from("identity_assets")
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            account_full_name,
            avatar_url
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">Loading certificate...</div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="container max-w-4xl py-8">
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

  const profile = identity.profiles as any;
  const isFace = identity.type === "face_identity";
  const TypeIcon = isFace ? Camera : Mic;
  const typeLabel = isFace ? "Face Identity" : "Voice Identity";
  const hash = identity.face_hash || "N/A";
  const permissions = identity.permissions as any;

  const shortenHash = (hash: string) => {
    if (!hash || hash === "N/A") return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/identity")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Identity & Rights
      </Button>

      {/* Certificate Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Seeksy Identity Certificate</h1>
        <Badge className="bg-green-500/10 text-green-600 border-green-200">
          <Shield className="h-3 w-3 mr-1" />
          {typeLabel} Verified
        </Badge>
      </div>

      {/* Creator Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                {profile?.account_full_name?.charAt(0) || profile?.username?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{profile?.account_full_name || profile?.username}</p>
              <p className="text-sm text-muted-foreground">@{profile?.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain & Metadata Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <TypeIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{typeLabel}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Blockchain-Verified Identity
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Identity Hash */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{isFace ? "Face Hash" : "Voice Hash"}</p>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-3 py-2 rounded flex-1 break-all">
                {shortenHash(hash)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(hash, "hash")}
              >
                {copiedField === "hash" ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Creator Wallet */}
          {identity.user_id && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Creator ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-3 py-2 rounded flex-1">
                  {shortenHash(identity.user_id)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(identity.user_id, "wallet")}
                >
                  {copiedField === "wallet" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Network */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Network</p>
            <p className="text-lg">Polygon (MATIC)</p>
          </div>

          {/* Transaction Hash */}
          {identity.cert_tx_hash && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Transaction Hash</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-3 py-2 rounded flex-1">
                  {shortenHash(identity.cert_tx_hash)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(identity.cert_tx_hash, "tx")}
                >
                  {copiedField === "tx" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Certified On */}
          {identity.cert_created_at && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Certified On</p>
              <p className="text-lg">
                {format(new Date(identity.cert_created_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          )}

          {/* Token ID */}
          {identity.cert_token_id && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Token ID</p>
              <p className="text-lg">#{identity.cert_token_id}</p>
            </div>
          )}

          {/* Polygonscan Link */}
          {identity.cert_explorer_url && (
            <div className="pt-4 border-t">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => window.open(identity.cert_explorer_url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Polygonscan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rights Snapshot Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Rights Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Likeness in Ads</span>
              <Badge variant={permissions?.advertiser_access ? "default" : "outline"}>
                {permissions?.advertiser_access ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">AI Generation</span>
              <Badge variant={permissions?.ai_generation ? "default" : "outline"}>
                {permissions?.ai_generation ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Clip Usage</span>
              <Badge variant={permissions?.clip_use ? "default" : "outline"}>
                {permissions?.clip_use ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Anonymous Training</span>
              <Badge variant={permissions?.anonymous_training ? "default" : "outline"}>
                {permissions?.anonymous_training ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            These permissions reflect the creator's current settings and can be modified at any time.
          </p>
        </CardContent>
      </Card>

      {/* Seeksy Identity Promise Footer */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Seeksy Identity Promise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-base font-semibold">Your likeness is yours.</p>
          <p className="text-sm text-muted-foreground">
            Seeksy will never sell, license, or use your face, voice, or identity without your explicit permission. Every use is tied to permissions you control and recorded for transparency.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default IdentityCertificateDetail;
