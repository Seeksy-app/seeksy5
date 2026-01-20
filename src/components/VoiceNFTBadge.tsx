import { Award, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface VoiceNFTBadgeProps {
  tokenId: string;
  transactionHash: string;
  className?: string;
  showLink?: boolean;
}

export const VoiceNFTBadge = ({ 
  tokenId, 
  transactionHash,
  className,
  showLink = true
}: VoiceNFTBadgeProps) => {
  const polygonscanUrl = `https://amoy.polygonscan.com/tx/${transactionHash}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center gap-2", className)}>
            <Badge 
              variant="outline"
              className="bg-gradient-to-r from-brand-gold/20 to-primary/20 border-brand-gold/30 text-brand-gold font-semibold"
            >
              <Award className="h-3 w-3 mr-1" />
              Voice NFT
            </Badge>
            {showLink && (
              <a
                href={polygonscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-brand-gold">🏆 Blockchain-Certified Voice NFT</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">Token ID:</span> {tokenId}</p>
              <p><span className="font-medium">Network:</span> Polygon (MATIC)</p>
              <p><span className="font-medium">Status:</span> Minted & Verified</p>
              <p className="pt-1 border-t">
                This voice is permanently registered on the blockchain, proving authentic ownership.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
