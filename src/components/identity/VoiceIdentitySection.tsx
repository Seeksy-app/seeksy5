import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, ExternalLink, Shield, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VoiceIdentityAsset {
  id: string;
  cert_status: string;
  cert_explorer_url: string | null;
  cert_tx_hash: string | null;
}

interface VoiceIdentitySectionProps {
  asset: VoiceIdentityAsset | undefined;
}

export function VoiceIdentitySection({ asset }: VoiceIdentitySectionProps) {
  const navigate = useNavigate();
  const status = asset?.cert_status || "not_set";

  const statusConfig = {
    not_set: {
      color: "bg-muted text-muted-foreground",
      label: "Not set",
    },
    pending: {
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      label: "Verification in progress",
    },
    minting: {
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      label: "Certifying…",
    },
    minted: {
      color: "bg-green-500/10 text-green-600 border-green-200",
      label: "Verified",
    },
    failed: {
      color: "bg-red-500/10 text-red-600 border-red-200",
      label: "Verification failed",
    },
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_set;

  return (
    <Card className="border-2">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Voice Identity</h4>
              <Badge variant="outline" className={currentStatus.color}>
                {currentStatus.label}
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {status === "not_set" && "Upload a voice sample to protect your identity"}
          {status === "pending" && "Voice verification in progress"}
          {status === "minting" && "Minting certificate on blockchain"}
          {status === "minted" && "Voice identity certified on-chain"}
          {status === "failed" && "Verification failed - please retry"}
        </p>

        {status === "not_set" || status === "failed" ? (
          <Button 
            className="w-full" 
            onClick={() => navigate("/voice-certification-flow")}
          >
            <Mic className="h-4 w-4 mr-2" />
            {status === "failed" ? "Retry Voice Verification" : "Upload Voice Sample"}
          </Button>
        ) : status === "pending" || status === "minting" ? (
          <Button className="w-full" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Verification in progress…
          </Button>
        ) : status === "minted" && asset ? (
          <div className="space-y-2">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate(`/certificate/identity/${asset.id}`)}
            >
              <Shield className="h-4 w-4 mr-2" />
              View Voice Certificate
            </Button>
            {asset.cert_explorer_url && (
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  const url = asset.cert_explorer_url || 
                    (asset.cert_tx_hash ? `https://amoy.polygonscan.com/tx/${asset.cert_tx_hash}` : null);
                  if (url) window.open(url, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Polygon
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
