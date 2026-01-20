import { Card, CardContent } from "@/components/ui/card";
import { Shield, Award, Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockchainExplainerProps {
  tokenId?: string;
  transactionHash?: string;
  showDetails?: boolean;
}

export const BlockchainExplainer = ({ 
  tokenId, 
  transactionHash,
  showDetails = true 
}: BlockchainExplainerProps) => {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-2xl font-bold mb-2">Your Voice is on the Blockchain!</h3>
          <p className="text-muted-foreground">
            Think of blockchain like a permanent, public notebook that nobody can erase or change.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Permanent Ownership Proof</p>
              <p className="text-xs text-muted-foreground">
                Your NFT certificate proves YOU own this voice forever
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
            <Lock className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Can't Be Faked</p>
              <p className="text-xs text-muted-foreground">
                Even AI deepfakes can't copy your blockchain certificate
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
            <Award className="h-5 w-5 text-brand-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Free for You!</p>
              <p className="text-xs text-muted-foreground">
                We pay the blockchain fees (called "gas"). You pay $0.
              </p>
            </div>
          </div>
        </div>

        {showDetails && tokenId && transactionHash && (
          <div className="space-y-3 pt-4 border-t">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Your NFT Token ID</p>
              <p className="text-sm font-mono break-all">{tokenId}</p>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              asChild
            >
              <a 
                href={`https://amoy.polygonscan.com/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Polygonscan (Public Blockchain Explorer)
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
