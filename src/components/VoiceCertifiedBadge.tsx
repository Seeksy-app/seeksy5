import { CheckCircle2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VoiceCertifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const VoiceCertifiedBadge = ({ 
  className, 
  size = "md",
  showText = true 
}: VoiceCertifiedBadgeProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
        "bg-primary/10 border border-primary/30",
        "text-primary font-medium",
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-sm",
        size === "lg" && "text-base px-4 py-2",
        className
      )}
    >
      <CheckCircle2 className={sizeClasses[size]} />
      {showText && <span>Certified Voice</span>}
      <Shield className={cn(sizeClasses[size], "opacity-70")} />
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">Voice Tag Certified</p>
            <p className="text-xs text-muted-foreground">
              This content has been cryptographically verified and blockchain-certified 
              to prove authentic creator ownership and licensing.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
