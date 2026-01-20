import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Video, Sparkles, Users, Database } from "lucide-react";

interface IdentityAsset {
  id: string;
  permissions: {
    clip_use: boolean;
    ai_generation: boolean;
    advertiser_access: boolean;
    anonymous_training: boolean;
  };
}

interface IdentityPermissionsPanelProps {
  assets: IdentityAsset[];
}

export function IdentityPermissionsPanel({ assets }: IdentityPermissionsPanelProps) {
  const queryClient = useQueryClient();

  // Get aggregated permissions (if ANY asset has permission enabled, show as enabled)
  const permissions = {
    clip_use: Array.isArray(assets) && assets.some(a => a?.permissions?.clip_use),
    ai_generation: Array.isArray(assets) && assets.some(a => a?.permissions?.ai_generation),
    advertiser_access: Array.isArray(assets) && assets.some(a => a?.permissions?.advertiser_access),
    anonymous_training: Array.isArray(assets) && assets.some(a => a?.permissions?.anonymous_training),
  };

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ permission, enabled }: { permission: string; enabled: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update all user's identity assets
      const updates = assets
        .filter(asset => asset?.id && asset?.permissions)
        .map(asset => {
          const newPermissions = {
            ...asset.permissions,
            [permission]: enabled,
          };
          return supabase
            .from("identity_assets")
            .update({ permissions: newPermissions })
            .eq("id", asset.id);
        });

      await Promise.all(updates);

      // Log permission change
      await Promise.all(
        assets
          .filter(asset => asset?.id)
          .map(asset =>
            supabase.from("identity_access_logs").insert({
              identity_asset_id: asset.id,
              action: "permission_changed",
              actor_id: user.id,
              details: {
                permission,
              enabled,
              changed_at: new Date().toISOString(),
            },
          })
        )
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["identity-assets"] });
      toast.success(`${variables.permission.replace('_', ' ')} ${variables.enabled ? 'enabled' : 'disabled'}`);
    },
    onError: (error) => {
      toast.error("Failed to update permissions: " + error.message);
    },
  });

  const handleToggle = (permission: string, currentValue: boolean) => {
    updatePermissionsMutation.mutate({
      permission,
      enabled: !currentValue,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 mb-6">
        <h3 className="text-lg font-semibold">Clip Usage Permissions</h3>
        <p className="text-sm text-muted-foreground">Control how your certified clips appear on Seeksy</p>
      </div>

      <div className="flex items-start justify-between gap-4 pb-6 border-b">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="clip-use-face" className="text-base font-medium">
              Allow my verified face to appear in Seeksy-certified clips
            </Label>
            <p className="text-sm text-muted-foreground">
              Allows certified clips with your face to appear in Seeksy features (discovery, thumbnails). Does NOT allow third-party licensing without approval.
            </p>
          </div>
        </div>
        <Switch
          id="clip-use-face"
          checked={permissions.clip_use}
          onCheckedChange={() => handleToggle('clip_use', permissions.clip_use)}
          disabled={updatePermissionsMutation.isPending}
        />
      </div>

      <div className="space-y-1 mb-6 mt-6">
        <h3 className="text-lg font-semibold">AI Generation Permissions</h3>
        <p className="text-sm text-muted-foreground">Control AI-generated content using your likeness</p>
      </div>

      <div className="flex items-start justify-between gap-4 pb-6 border-b">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ai-generation" className="text-base font-medium">
              Allow AI to generate my likeness (face/voice)
            </Label>
            <p className="text-sm text-muted-foreground">
              Allows AI-generated content using your face or voice. Each use requires explicit approval. Default: OFF.
            </p>
          </div>
        </div>
        <Switch
          id="ai-generation"
          checked={permissions.ai_generation}
          onCheckedChange={() => handleToggle('ai_generation', permissions.ai_generation)}
          disabled={updatePermissionsMutation.isPending}
        />
      </div>

      <div className="space-y-1 mb-6 mt-6">
        <h3 className="text-lg font-semibold">Advertiser Access Permissions</h3>
        <p className="text-sm text-muted-foreground">Control brand requests and licensing</p>
      </div>

      <div className="flex items-start justify-between gap-4 pb-6 border-b">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="advertiser-access" className="text-base font-medium">
              Allow advertisers to request use of my verified identity
            </Label>
            <p className="text-sm text-muted-foreground">
              Enables brands to send usage requests. You must approve each campaign individually. OFF = no advertiser requests.
            </p>
          </div>
        </div>
        <Switch
          id="advertiser-access"
          checked={permissions.advertiser_access}
          onCheckedChange={() => handleToggle('advertiser_access', permissions.advertiser_access)}
          disabled={updatePermissionsMutation.isPending}
        />
      </div>

      <div className="space-y-1 mb-6 mt-6">
        <h3 className="text-lg font-semibold">Safety & Privacy</h3>
      </div>

      <div className="flex items-start justify-between gap-4 pb-6 border-b">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="anonymous-training" className="text-base font-medium">
              Allow anonymous training (face embeddings only, no identity reveal)
            </Label>
            <p className="text-sm text-muted-foreground">
              De-identified data helps improve Seeksy features. No personal identity is shared or stored.
            </p>
          </div>
        </div>
        <Switch
          id="anonymous-training"
          checked={permissions.anonymous_training}
          onCheckedChange={() => handleToggle('anonymous_training', permissions.anonymous_training)}
          disabled={updatePermissionsMutation.isPending}
        />
      </div>

      <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm font-semibold mb-2">Seeksy Identity Promise</p>
        <p className="text-sm font-medium mb-1">Your likeness is yours.</p>
        <p className="text-sm text-muted-foreground mb-2">
          Seeksy will never sell, license, or use your face, voice, or identity without your explicit permission.
        </p>
        <p className="text-sm text-muted-foreground">
          Every use of your identity — whether in clips, AI generation, or advertising — requires your consent, recorded on-chain for transparency and security.
        </p>
      </div>
    </div>
  );
}