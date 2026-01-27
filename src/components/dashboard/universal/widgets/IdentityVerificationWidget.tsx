import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Mic, Camera, CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VerificationStatus {
  voice: "pending" | "verified" | "failed" | "none";
  face: "pending" | "verified" | "failed" | "none";
}

export function IdentityVerificationWidget() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>({
    voice: "none",
    face: "none",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let voiceVerified = false;
      let faceStatus = "none";

      // Check voice verification
      try {
        const result = await (supabase as any)
          .from("creator_voice_profiles")
          .select("is_verified")
          .eq("creator_id", user.id)
          .limit(1)
          .single();
        voiceVerified = result?.data?.is_verified || false;
      } catch {
        // Table might not exist or no data
      }

      // Check face verification from identity_assets  
      try {
        const result = await (supabase as any)
          .from("identity_assets")
          .select("cert_status")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        if (result?.data?.cert_status === "minted") faceStatus = "verified";
        else if (result?.data?.cert_status === "pending") faceStatus = "pending";
      } catch {
        // Table might not exist or no data
      }

      setStatus({
        voice: voiceVerified ? "verified" : "none",
        face: faceStatus as "pending" | "verified" | "failed" | "none",
      });
    } catch (error) {
      console.error("Error loading verification status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statusType: "pending" | "verified" | "failed" | "none") => {
    switch (statusType) {
      case "verified":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 gap-1">
            <XCircle className="h-3 w-3" />
            Retry
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            Not Started
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-16 bg-muted/50 rounded-lg" />
        <div className="h-16 bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-3">
        Protect your content with verified identity credentials
      </p>
      
      {/* Voice Verification */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">Voice Verification</p>
            <p className="text-xs text-muted-foreground">Protect your voice identity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(status.voice)}
          {status.voice !== "verified" && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate("/my-voice-identity")}
            >
              Verify
            </Button>
          )}
        </div>
      </div>

      {/* Face Verification */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">Face Verification</p>
            <p className="text-xs text-muted-foreground">Secure your likeness</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(status.face)}
          {status.face !== "verified" && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate("/identity")}
            >
              Verify
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <p className="text-xs font-medium text-primary">Why verify?</p>
            <p className="text-xs text-muted-foreground">
              Verified creators get priority in marketplaces, copyright protection, and monetization opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
