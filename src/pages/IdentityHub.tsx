import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Mic, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";
import { IdentityLayout } from "@/components/identity/IdentityLayout";
import { IdentityPromiseBanner } from "@/components/identity/IdentityPromiseBanner";
import { IdentityActivityLog } from "@/components/identity/IdentityActivityLog";
import { ImpersonationScanner } from "@/components/identity/ImpersonationScanner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { useState } from "react";
import { PersonaDialog } from "@/components/ai/PersonaDialog";

export default function IdentityHub() {
  const navigate = useNavigate();
  const { data: identityStatus } = useIdentityStatus();
  const [lexDialogOpen, setLexDialogOpen] = useState(false);
  const [lexPrompt, setLexPrompt] = useState("");

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["identity-activity-logs"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data } = await (supabase as any)
        .from("identity_access_logs")
        .select("id, action, created_at, details")
        .eq("actor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);

      return data || [];
    },
  });

  const voiceVerified = identityStatus?.voiceVerified || false;
  const faceVerified = identityStatus?.faceVerified || false;

  return (
    <IdentityLayout>
      <div className="space-y-6">
        {/* Identity Cards Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Face Identity Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Camera className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">FACE IDENTITY</h3>
                  <Badge 
                    variant="outline" 
                    className={faceVerified ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950" : ""}
                  >
                    {faceVerified ? (
                      <>
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Not verified
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {faceVerified 
                  ? "Your face is verified and secured on-chain"
                  : "Upload 3–5 clear photos to verify your face identity"
                }
              </p>

              <div className="space-y-2">
                {faceVerified ? (
                  <>
                    <Button 
                      onClick={() => navigate(`/certificate/identity/${identityStatus?.faceAssetId}`)}
                      variant="default"
                      className="w-full"
                    >
                      View Certificate
                    </Button>
                    {identityStatus?.faceExplorerUrl && (
                      <Button 
                        onClick={() => window.open(identityStatus.faceExplorerUrl!, '_blank')}
                        variant="outline"
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Polygon
                      </Button>
                    )}
                    <Button 
                      onClick={() => navigate("/face-verification")}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      Reverify
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => navigate("/face-verification")}
                    className="w-full"
                  >
                    Verify
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Voice Identity Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Mic className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">VOICE IDENTITY</h3>
                  <Badge 
                    variant="outline" 
                    className={voiceVerified ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950" : ""}
                  >
                    {voiceVerified ? (
                      <>
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Not verified
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {voiceVerified 
                  ? "Your voice is verified and secured on-chain"
                  : "Record at least 10 seconds to verify your voice identity"
                }
              </p>

              <div className="space-y-2">
                {voiceVerified ? (
                  <>
                    <Button 
                      onClick={() => navigate("/identity/voice")}
                      variant="default"
                      className="w-full"
                    >
                      View Voice Identity
                    </Button>
                    {identityStatus?.voiceExplorerUrl && (
                      <Button 
                        onClick={() => window.open(identityStatus.voiceExplorerUrl!, '_blank')}
                        variant="outline"
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Polygon
                      </Button>
                    )}
                    <Button 
                      onClick={() => navigate("/identity/voice/consent")}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      Reset Voice Identity
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => navigate("/identity/voice/consent")}
                    className="w-full"
                  >
                    Verify
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Impersonation Detection - Only show if face is verified */}
        {faceVerified && (
          <ImpersonationScanner />
        )}

        {/* Seeksy Identity Promise */}
        <IdentityPromiseBanner />

        {/* Activity Log */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Identity Activity & Access Log</h3>
          <AskAIButton
            persona="Lex"
            onClick={() => {
              setLexPrompt("Explain my identity verification status and what blockchain certificates mean");
              setLexDialogOpen(true);
            }}
          >
            Explain My Status
          </AskAIButton>
        </div>
        <IdentityActivityLog logs={activityLogs} />

        <PersonaDialog
          open={lexDialogOpen}
          onOpenChange={setLexDialogOpen}
          persona="Lex"
          prompt={lexPrompt}
          context={{ 
            faceVerified, 
            voiceVerified, 
            overallStatus: identityStatus?.overallStatus 
          }}
          placeholder="Ask Lex about identity verification, rights, or certificates"
        />
      </div>
    </IdentityLayout>
  );
}
