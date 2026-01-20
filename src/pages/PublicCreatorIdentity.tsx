import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Camera, Mic, Video, Sparkles, Send, ExternalLink } from "lucide-react";
import { IdentityRequestModal } from "@/components/identity/IdentityRequestModal";

const PublicCreatorIdentity = () => {
  const { username } = useParams();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-creator-profile", username],
    queryFn: async () => {
      if (!username) throw new Error("No username provided");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const { data: identityAssets = [] } = useQuery({
    queryKey: ["public-creator-identity", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("identity_assets")
        .select("*")
        .eq("user_id", profile.id)
        .eq("cert_status", "minted")
        .is("revoked_at", null);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">Loading creator identity...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Creator not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const faceIdentity = identityAssets.find(a => a.type === "face_identity");
  const voiceIdentity = identityAssets.find(a => a.type === "voice_identity");
  
  // Type-safe permission check
  const getPermission = (asset: any, key: string): boolean => {
    if (!asset.permissions || typeof asset.permissions !== 'object') return false;
    return (asset.permissions as any)[key] === true;
  };
  
  const advertiserAccessEnabled = identityAssets.some(a => getPermission(a, 'advertiser_access'));

  return (
    <>
      <div className="container max-w-4xl py-8 space-y-6">
        {/* Creator Header */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {profile.account_full_name?.charAt(0) || profile.username?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">{profile.account_full_name || profile.username}</CardTitle>
                <p className="text-sm text-muted-foreground mb-3">@{profile.username}</p>
                <div className="flex flex-wrap gap-2">
                  {faceIdentity && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                      <Camera className="h-3 w-3 mr-1" />
                      Face Verified
                    </Badge>
                  )}
                  {voiceIdentity && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                      <Mic className="h-3 w-3 mr-1" />
                      Voice Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Identity Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Verified Identity Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Face Identity */}
              {faceIdentity && (
                <div className="border-2 border-primary/20 bg-primary/5 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">Face Identity</h4>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Blockchain-verified on Polygon
                      </p>
                      {faceIdentity.cert_explorer_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => window.open(faceIdentity.cert_explorer_url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Certificate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Voice Identity */}
              {voiceIdentity && (
                <div className="border-2 border-primary/20 bg-primary/5 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mic className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">Voice Identity</h4>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Blockchain-verified on Polygon
                      </p>
                      {voiceIdentity.cert_explorer_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => window.open(voiceIdentity.cert_explorer_url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Certificate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Identity Usage Rights */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-sm mb-3">Identity Usage Rights</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className={identityAssets.some(a => getPermission(a, 'clip_use')) ? "text-foreground" : "text-muted-foreground"}>
                    Clips: {identityAssets.some(a => getPermission(a, 'clip_use')) ? "Available" : "Restricted"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className={identityAssets.some(a => getPermission(a, 'ai_generation')) ? "text-foreground" : "text-muted-foreground"}>
                    AI Likeness: {identityAssets.some(a => getPermission(a, 'ai_generation')) ? "Available (with approval)" : "Restricted"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Permission */}
        {advertiserAccessEnabled && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Request Permission to Use This Identity</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit a request to license {profile.account_full_name || profile.username}'s verified identity for your campaign
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => setIsRequestModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Request Permission
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!advertiserAccessEnabled && identityAssets.length > 0 && (
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                This creator has not enabled advertiser access for their identity.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seeksy Identity Promise - Footer */}
        {identityAssets.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold">Seeksy Identity Promise</p>
                <p className="text-xs text-muted-foreground">
                  Seeksy will never sell, license, or use {profile.account_full_name || profile.username}'s identity without explicit permission. Every use requires consent, recorded on-chain for transparency and security.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {profile && (
        <IdentityRequestModal
          open={isRequestModalOpen}
          onOpenChange={setIsRequestModalOpen}
          creatorId={profile.id}
          creatorUsername={profile.username || ""}
        />
      )}
    </>
  );
};

export default PublicCreatorIdentity;
