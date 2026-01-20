import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { useQueryClient } from "@tanstack/react-query";
import { refetchUserIdentity } from "@/lib/identity/refetchIdentity";

const VoiceSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { voiceHash, tokenId, explorerUrl, transactionHash } = location.state || {};

  useEffect(() => {
    // Force immediate refetch using centralized utility
    const refetchIdentity = async () => {
      console.log('[VoiceSuccess] Force refetching all identity queries...');
      await refetchUserIdentity(queryClient);
      console.log('[VoiceSuccess] All identity queries refetched');
    };
    
    refetchIdentity().catch(err => {
      console.error('[VoiceSuccess] Refetch error (non-critical):', err);
    });
    
    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        colors: ['#2C6BED', '#10B981', '#F59E0B', '#EC4899']
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const truncateHash = (hash: string) => {
    if (!hash) return "";
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="p-8 md:p-12 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="space-y-8">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Voice Verified
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Your voice identity has been confirmed and stored on-chain.
              </p>
            </div>

            {/* Certificate Details */}
            <div className="space-y-4 bg-muted/30 p-6 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Voice Hash</span>
                <span className="text-sm font-mono text-foreground">
                  {truncateHash(voiceHash)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Token ID</span>
                <span className="text-sm font-mono text-foreground">{tokenId}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Transaction</span>
                <span className="text-sm font-mono text-foreground">
                  {truncateHash(transactionHash)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm text-foreground">Polygon Amoy Testnet</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open(explorerUrl, '_blank')}
                className="w-full h-14 text-lg font-semibold"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                View on Blockchain
              </Button>
              <Button
                size="lg"
                onClick={() => navigate("/identity")}
                className="w-full h-14 text-lg font-semibold"
              >
                Return to Identity Hub
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="flex gap-3">
                <Button
                  size="sm"
                  onClick={() => navigate("/my-voice-identity")}
                  variant="outline"
                  className="flex-1"
                >
                  Voice Identity
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/identity/rights")}
                  variant="outline"
                  className="flex-1"
                >
                  Rights Management
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceSuccess;
