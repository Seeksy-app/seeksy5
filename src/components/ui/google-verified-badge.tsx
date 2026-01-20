import { Shield, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleVerifiedBadgeProps {
  variant?: "inline" | "subtle" | "pill";
  className?: string;
}

export function GoogleVerifiedBadge({ variant = "inline", className }: GoogleVerifiedBadgeProps) {
  if (variant === "pill") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        "bg-green-50 text-green-700 border border-green-200",
        className
      )}>
        <Shield className="h-3 w-3" />
        Google Verified
      </span>
    );
  }

  if (variant === "subtle") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}>
        <CheckCircle className="h-3 w-3 text-green-600" />
        <span className="text-green-700">Verified</span>
      </span>
    );
  }

  // Default inline variant
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-sm text-green-700",
      className
    )}>
      <Shield className="h-4 w-4 text-green-600" />
      Google Verified
    </span>
  );
}
