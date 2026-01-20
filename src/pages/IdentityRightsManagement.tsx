import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Shield, Lock, Users, Database, FileText, ExternalLink, AlertTriangle, Mic, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";

import { IdentityLayout } from "@/components/identity/IdentityLayout";

export default function IdentityRightsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: identityStatus } = useIdentityStatus();

  // Fetch user's rights settings
  const { data: rightsSettings, isLoading } = useQuery({
    queryKey: ['identity-rights-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch identity assets with permissions
      const { data: assets } = await supabase
        .from('identity_assets')
        .select('*')
        .eq('user_id', user.id)
        .is('revoked_at', null);

      // Fetch access requests
      const { data: requests } = await supabase
        .from('identity_requests')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      return {
        assets: assets || [],
        requests: requests || [],
        faceAsset: assets?.find(a => a.type === 'face_identity'),
        voiceAsset: assets?.find(a => a.type === 'voice_identity'),
      };
    },
  });

  // Update permissions mutation
  const updatePermissions = useMutation({
    mutationFn: async ({ assetId, permissions }: { assetId: string; permissions: any }) => {
      const { error } = await supabase
        .from('identity_assets')
        .update({ permissions })
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identity-rights-settings'] });
      toast({
        title: "Permissions updated",
        description: "Your identity rights have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePermissionToggle = (assetId: string, permissionKey: string, currentValue: boolean) => {
    const asset = rightsSettings?.assets?.find(a => a.id === assetId);
    if (!asset) return;

    const updatedPermissions: any = {
      ...((asset.permissions as any) || {}),
      [permissionKey]: !currentValue,
    };

    updatePermissions.mutate({ assetId, permissions: updatedPermissions });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Shield className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }

  const facePermissions = (rightsSettings?.faceAsset?.permissions as any) || {};
  const voicePermissions = (rightsSettings?.voiceAsset?.permissions as any) || {};

  return (
    <IdentityLayout>
      {/* Seeksy Identity Promise */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Seeksy Identity Promise</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your likeness is yours. Seeksy will never sell, license, or use your face, voice, or identity without your explicit permission. 
                  Every use requires consent, recorded on-chain for transparency and security.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning if not verified */}
      {!identityStatus?.faceVerified && !identityStatus?.voiceVerified && (
        <Card className="mb-8 border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Identity Not Verified</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You must verify your identity before managing rights and permissions.
                </p>
                <div className="flex gap-3">
                  {!identityStatus?.faceVerified && (
                    <Button onClick={() => navigate("/face-verification")} size="sm">
                      Verify Face
                    </Button>
                  )}
                  {!identityStatus?.voiceVerified && (
                    <Button onClick={() => navigate("/identity/voice/consent")} size="sm" variant="outline">
                      Verify Voice
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Face Identity Permissions */}
      {rightsSettings?.faceAsset && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Face Identity Rights
                </CardTitle>
                <CardDescription>Control how your face can be used</CardDescription>
              </div>
              <Badge variant={facePermissions.clip_use ? "default" : "outline"}>
                {facePermissions.clip_use ? "Active Permissions" : "Restricted"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Clip Usage</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow use of your face in video clips and highlights
                  </p>
                </div>
                <Switch
                  checked={facePermissions.clip_use || false}
                  onCheckedChange={() => handlePermissionToggle(rightsSettings.faceAsset.id, 'clip_use', facePermissions.clip_use)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">AI Generation</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow AI systems to generate content using your face
                  </p>
                </div>
                <Switch
                  checked={facePermissions.ai_generation || false}
                  onCheckedChange={() => handlePermissionToggle(rightsSettings.faceAsset.id, 'ai_generation', facePermissions.ai_generation)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Advertiser Access</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow advertisers to request permission to use your face
                  </p>
                </div>
                <Switch
                  checked={facePermissions.advertiser_access || false}
                  onCheckedChange={() => handlePermissionToggle(rightsSettings.faceAsset.id, 'advertiser_access', facePermissions.advertiser_access)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Anonymous Training</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymous use of your identity for AI model training
                  </p>
                </div>
                <Switch
                  checked={facePermissions.anonymous_training || false}
                  onCheckedChange={() => handlePermissionToggle(rightsSettings.faceAsset.id, 'anonymous_training', facePermissions.anonymous_training)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Identity Permissions */}
      {rightsSettings?.voiceAsset && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Voice Identity Rights
                </CardTitle>
                <CardDescription>Control how your voice can be used</CardDescription>
              </div>
              <Badge variant={voicePermissions.clip_use ? "default" : "outline"}>
                {voicePermissions.clip_use ? "Active Permissions" : "Restricted"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Clip Usage</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow use of your voice in audio clips and highlights
                  </p>
                </div>
                <Switch
                  checked={voicePermissions.clip_use || false}
                  onCheckedChange={() => handlePermissionToggle(rightsSettings.voiceAsset.id, 'clip_use', voicePermissions.clip_use)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">AI Generation</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow AI systems to generate content using your voice
                  </p>
                </div>
                <Switch
                  checked={voicePermissions.ai_generation || false}
                  onCheckedChange={() => handlePermissionToggle(rightsSettings.voiceAsset.id, 'ai_generation', voicePermissions.ai_generation)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Advertiser Access</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow advertisers to request permission to use your voice
                  </p>
                </div>
                <Switch
                  checked={voicePermissions.advertiser_access || false}
                  onCheckedChange={() => handlePermissionToggle(rightsSettings.voiceAsset.id, 'advertiser_access', voicePermissions.advertiser_access)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Anonymous Training</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymous use of your voice for AI model training
                  </p>
                </div>
                <Switch
                  checked={voicePermissions.anonymous_training || false}
                  onCheckedChange={() => handlePermissionToggle(rightsSettings.voiceAsset.id, 'anonymous_training', voicePermissions.anonymous_training)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Access Requests
          </CardTitle>
          <CardDescription>Advertisers and partners requesting to use your identity</CardDescription>
        </CardHeader>
        <CardContent>
          {rightsSettings?.requests && rightsSettings.requests.length > 0 ? (
            <div className="space-y-3">
              {rightsSettings.requests.slice(0, 5).map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{request.advertiser_company}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.identity_type === 'voice' ? 'Voice' : 'Face'} Identity • {request.status}
                    </p>
                  </div>
                  <Badge variant={request.status === 'approved' ? 'default' : request.status === 'pending' ? 'secondary' : 'outline'}>
                    {request.status}
                  </Badge>
                </div>
              ))}
              <Button onClick={() => navigate("/identity")} variant="outline" className="w-full">
                View All Requests
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No access requests yet
            </p>
          )}
        </CardContent>
      </Card>
    </IdentityLayout>
  );
}
