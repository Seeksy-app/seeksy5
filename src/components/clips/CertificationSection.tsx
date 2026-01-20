import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Shield } from "lucide-react";
import { CertificationBadge } from "./CertificationBadge";
import { format } from "date-fns";
import { toast } from "sonner";

interface CertificationSectionProps {
  clipId: string;
  certStatus: string;
  certChain?: string | null;
  certTxHash?: string | null;
  certExplorerUrl?: string | null;
  certCreatedAt?: string | null;
}

export function CertificationSection({
  clipId,
  certStatus,
  certChain,
  certTxHash,
  certExplorerUrl,
  certCreatedAt,
}: CertificationSectionProps) {
  const handleCopyHash = () => {
    if (certTxHash) {
      navigator.clipboard.writeText(certTxHash);
      toast.success("Transaction hash copied to clipboard");
    }
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          🔗 Blockchain Certification
        </CardTitle>
        <CardDescription>
          Seeksy verifies authenticity through on-chain certification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
              <CertificationBadge status={certStatus as any} />
            </div>
            {certExplorerUrl && certStatus === "minted" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(certExplorerUrl, "_blank")}
              >
                View Certificate
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {certStatus === "minted" && (
            <>
              {certChain && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Chain</p>
                  <p className="text-sm capitalize">{certChain}</p>
                </div>
              )}

              {certTxHash && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {shortenHash(certTxHash)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyHash}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {certExplorerUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(certExplorerUrl, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {certCreatedAt && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Certified On</p>
                  <p className="text-sm">
                    {format(new Date(certCreatedAt), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
            </>
          )}

          {certStatus === "failed" && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Certification failed. Please try again or contact support.
              </p>
            </div>
          )}

          {(certStatus === "pending" || certStatus === "minting") && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Your clip is being certified on the blockchain. This usually takes a few seconds.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
