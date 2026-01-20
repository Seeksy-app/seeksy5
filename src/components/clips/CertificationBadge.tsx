import { Shield, Clock, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CertStatus = "minted" | "pending" | "minting" | "failed" | "not_requested";

interface CertificationBadgeProps {
  status: CertStatus;
  mini?: boolean;
  className?: string;
}

const statusConfig = {
  minted: {
    label: "✓ Certified On-Chain",
    miniLabel: "Certified",
    bgColor: "bg-[#053877]",
    textColor: "text-white",
    icon: Shield,
  },
  pending: {
    label: "⌛ Certification Pending",
    miniLabel: "Pending",
    bgColor: "bg-[#d1a300]",
    textColor: "text-black",
    icon: Clock,
  },
  minting: {
    label: "⏳ Certifying…",
    miniLabel: "Certifying",
    bgColor: "bg-[#5BA1FF]",
    textColor: "text-black",
    icon: Loader2,
  },
  failed: {
    label: "⚠️ Certification Failed",
    miniLabel: "Failed",
    bgColor: "bg-[#C62828]",
    textColor: "text-white",
    icon: AlertTriangle,
  },
  not_requested: {
    label: "",
    miniLabel: "",
    bgColor: "",
    textColor: "",
    icon: Shield,
  },
};

export function CertificationBadge({ status, mini = false, className }: CertificationBadgeProps) {
  // Don't render anything for not_requested
  if (status === "not_requested") return null;

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      className={cn(
        "gap-1.5 font-medium shadow-sm",
        config.bgColor,
        config.textColor,
        mini ? "h-[26px] text-xs px-2" : "h-8 text-sm px-3",
        className
      )}
    >
      <Icon className={cn("flex-shrink-0", mini ? "h-3 w-3" : "h-4 w-4", status === "minting" && "animate-spin")} />
      <span>{mini ? config.miniLabel : config.label}</span>
    </Badge>
  );
}
