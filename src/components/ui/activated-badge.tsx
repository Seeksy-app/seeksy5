/**
 * ActivatedBadge Component
 * Reusable green badge for indicating activated modules/tools
 */

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ActivatedBadgeProps {
  variant?: "default" | "subtle" | "compact";
  showIcon?: boolean;
  className?: string;
}

export function ActivatedBadge({ 
  variant = "default", 
  showIcon = true,
  className 
}: ActivatedBadgeProps) {
  const baseStyles = "inline-flex items-center gap-1 font-medium rounded-full transition-colors";
  
  const variantStyles = {
    default: "bg-emerald-500 text-white px-2.5 py-0.5 text-xs",
    subtle: "bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
    compact: "bg-emerald-500 text-white px-2 py-0.5 text-[10px]",
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], className)}>
      {showIcon && <Check className={cn("flex-shrink-0", variant === "compact" ? "h-2.5 w-2.5" : "h-3 w-3")} />}
      <span>Activated</span>
    </span>
  );
}

export function StatusBadge({ 
  status 
}: { 
  status: "active" | "available" | "coming_soon" | "activated" 
}) {
  if (status === "active" || status === "activated") {
    return <ActivatedBadge variant="subtle" />;
  }
  
  if (status === "available") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border">
        Available
      </span>
    );
  }
  
  if (status === "coming_soon") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground/70 border border-border/50">
        Coming Soon
      </span>
    );
  }
  
  return null;
}
