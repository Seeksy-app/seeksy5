import { Shield } from "lucide-react";

interface ComplianceFooterProps {
  variant?: "default" | "minimal" | "card";
  className?: string;
}

export function ComplianceFooter({ variant = "default", className = "" }: ComplianceFooterProps) {
  const text = "We help prepare benefit claims and connect users with accredited representatives. Final submission must be completed by you through official government systems.";

  if (variant === "minimal") {
    return (
      <p className={`text-xs text-muted-foreground text-center ${className}`}>
        {text}
      </p>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-4 rounded-lg bg-muted/50 border ${className}`}>
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            {text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-t bg-muted/30 py-4 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <p>{text}</p>
        </div>
      </div>
    </div>
  );
}
