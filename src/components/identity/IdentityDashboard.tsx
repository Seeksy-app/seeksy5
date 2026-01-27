import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, Mic, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { IdentityAssetCard } from "./IdentityAssetCard";
import { IdentityPermissionsPanel } from "./IdentityPermissionsPanel";
import { AdvertiserAccessRequests } from "./AdvertiserAccessRequests";

interface IdentityAsset {
  id: string;
  user_id: string;
  type: 'face_identity' | 'voice_identity';
  title: string;
  file_url: string;
  thumbnail_url?: string;
  cert_status: string;
  cert_chain?: string;
  cert_tx_hash?: string;
  cert_explorer_url?: string;
  consent_version: string;
  permissions: {
    clip_use: boolean;
    ai_generation: boolean;
    advertiser_access: boolean;
    anonymous_training: boolean;
  };
  revoked_at?: string;
  created_at: string;
}

interface AccessRequest {
  id: string;
  identity_asset_id: string;
  advertiser_id: string;
  request_reason: string | null;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  approved_at: string | null;
  denied_at: string | null;
  identity_assets: {
    title: string;
    type: string;
  } | null;
}

export function IdentityDashboard() {
  const [selectedTab, setSelectedTab] = useState<"overview" | "face" | "voice" | "access">("overview");
  const queryClient = useQueryClient();

  // Fetch identity assets
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["identity-assets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const result = await (supabase as any)
        .from("identity_assets")
        .select("*")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .order("created_at", { ascending: false });

      if (result.error) throw result.error;
      return ((result.data as any[]) || []).map((asset: any) => ({
        ...asset,
        permissions: asset.permissions as {
          clip_use: boolean;
          ai_generation: boolean;
          advertiser_access: boolean;
          anonymous_training: boolean;
        },
      })) as IdentityAsset[];
    },
  });

  // Fetch access requests
  const { data: accessRequests = [] } = useQuery({
    queryKey: ["identity-access-requests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const assetIds = assets.map(a => a.id);
      if (assetIds.length === 0) return [];

      const result = await (supabase as any)
        .from("identity_access_requests")
        .select("*, identity_assets(title, type)")
        .in("identity_asset_id", assetIds)
        .order("requested_at", { ascending: false });

      if (result.error) throw result.error;
      return ((result.data as any[]) || []) as AccessRequest[];
    },
    enabled: assets.length > 0,
  });

  const faceAssets = assets.filter(a => a.type === 'face_identity');
  const voiceAssets = assets.filter(a => a.type === 'voice_identity');
  const certifiedCount = assets.filter(a => a.cert_status === 'minted').length;
  const pendingRequests = accessRequests.filter(r => r.status === 'pending').length;

  // Revoke identity mutation
  const revokeIdentityMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const result = await (supabase as any)
        .from("identity_assets")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", assetId);

      if (result.error) throw result.error;

      // Log revocation
      await (supabase as any).from("identity_access_logs").insert({
        identity_asset_id: assetId,
        action: "revoked",
        details: { reason: "User requested revocation" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["identity-assets"] });
      toast.success("Identity revoked successfully");
    },
    onError: (error) => {
      toast.error("Failed to revoke identity: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Identity & Rights Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your verified identity assets and control permissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Identities</CardDescription>
            <CardTitle className="text-3xl">{assets.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Blockchain Certified</CardDescription>
            <CardTitle className="text-3xl text-green-600">{certifiedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Requests</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{pendingRequests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Protections</CardDescription>
            <CardTitle className="text-xl">
              {assets.some(a => !a.permissions.anonymous_training) && (
                <Badge className="mr-1">No Training</Badge>
              )}
              {assets.some(a => a.cert_status === 'minted') && (
                <Badge className="bg-green-600">On-chain</Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="face">
            <User className="h-4 w-4 mr-2" />
            Face ({faceAssets.length})
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Mic className="h-4 w-4 mr-2" />
            Voice ({voiceAssets.length})
          </TabsTrigger>
          <TabsTrigger value="access">
            Access Requests ({pendingRequests})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {assets.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Identity Assets</CardTitle>
                <CardDescription>
                  Upload and certify your face or voice identity to protect your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button>
                    <User className="h-4 w-4 mr-2" />
                    Add Face Identity
                  </Button>
                  <Button variant="outline">
                    <Mic className="h-4 w-4 mr-2" />
                    Add Voice Identity
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Permissions Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Global Permissions
                  </CardTitle>
                  <CardDescription>
                    Control how your identity assets can be used across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IdentityPermissionsPanel assets={assets} />
                </CardContent>
              </Card>

              {/* Recent Assets */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Identity Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.slice(0, 6).map((asset) => (
                      <IdentityAssetCard
                        key={asset.id}
                        asset={asset}
                        onRevoke={() => revokeIdentityMutation.mutate(asset.id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="face" className="space-y-4">
          {faceAssets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No face identity assets. Upload one to get started.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {faceAssets.map((asset) => (
                <IdentityAssetCard
                  key={asset.id}
                  asset={asset}
                  onRevoke={() => revokeIdentityMutation.mutate(asset.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          {voiceAssets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No voice identity assets. Upload one to get started.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voiceAssets.map((asset) => (
                <IdentityAssetCard
                  key={asset.id}
                  asset={asset}
                  onRevoke={() => revokeIdentityMutation.mutate(asset.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="access">
          <AdvertiserAccessRequests requests={accessRequests} />
        </TabsContent>
      </Tabs>
    </div>
  );
}