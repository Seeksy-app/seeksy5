import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CertifyClipBannerProps {
  clipId: string;
  onCertified: () => void;
  onDismiss: () => void;
}

export function CertifyClipBanner({ clipId, onCertified, onDismiss }: CertifyClipBannerProps) {
  const [isCertifying, setIsCertifying] = useState(false);

  const handleCertify = async () => {
    setIsCertifying(true);
    try {
      toast.loading("Certifying clip...", { id: "certify-clip" });

      const { error } = await supabase.functions.invoke("mint-clip-certificate", {
        body: { clipId },
      });

      if (error) throw error;

      toast.success("Clip certified successfully!", { 
        id: "certify-clip",
        description: "Blockchain certificate has been created"
      });
      onCertified();
    } catch (error) {
      console.error("Certification error:", error);
      toast.error("Failed to certify clip", {
        id: "certify-clip",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCertifying(false);
    }
  };

  return (
    <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/80 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className="p-2 rounded-full bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">Certify this clip?</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Add a "Certified by Seeksy" badge, on-chain certificate, and authenticity marker.
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCertify}
              disabled={isCertifying}
            >
              {isCertifying ? (
                <>
                  <Shield className="mr-2 h-3 w-3 animate-pulse" />
                  Certifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-3 w-3" />
                  Certify On-Chain
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
            >
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
