import { Card } from "@/components/ui/card";
import { LucideIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModuleTooltip } from "./ModuleTooltip";

export interface ModuleCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: "active" | "available" | "coming_soon" | "activated";
  recommendedWith?: string[];
  route?: string;
  onClick?: () => void;
  onPreview?: () => void;
  compact?: boolean;
  tooltipData?: {
    description: string;
    bestFor: string;
    unlocks: string[];
    creditEstimate: number;
  };
}

export function ModuleCard({
  id,
  name,
  description,
  icon: Icon,
  status,
  recommendedWith,
  onClick,
  onPreview,
  compact = false,
  tooltipData,
}: ModuleCardProps) {
  const isDisabled = status === "coming_soon";
  const isActivated = status === "activated";

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) return;
    if (onPreview) {
      onPreview();
    } else if (onClick) {
      onClick();
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "activated":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" />
            Activated
          </span>
        );
      case "coming_soon":
        return <span className="text-[10px] font-medium text-muted-foreground/70">Coming Soon</span>;
      default:
        return <span className="text-[10px] font-medium text-muted-foreground">Available</span>;
    }
  };

  const cardContent = compact ? (
    <Card
      className={cn(
        "group relative p-4 transition-all duration-200 border-border/50",
        !isDisabled && "cursor-pointer hover:shadow-md hover:border-primary/30",
        isDisabled && "opacity-60 cursor-not-allowed",
        isActivated && "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/20"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          isActivated 
            ? "bg-emerald-100 dark:bg-emerald-900/50 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900" 
            : "bg-primary/10 group-hover:bg-primary/15"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            isActivated ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
          )} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-medium text-sm truncate">{name}</h3>
            {getStatusLabel()}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
        </div>
      </div>
    </Card>
  ) : (
    <Card
      className={cn(
        "group relative p-5 transition-all duration-200 border-border/50 flex flex-col",
        !isDisabled && "cursor-pointer hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
        isDisabled && "opacity-60 cursor-not-allowed",
        isActivated && "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/20"
      )}
      onClick={handleClick}
    >
      {/* Status Label - Top Right */}
      <div className="absolute top-4 right-4">
        {getStatusLabel()}
      </div>

      {/* Icon */}
      <div className="mb-4">
        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center transition-colors",
          isActivated 
            ? "bg-emerald-100 dark:bg-emerald-900/50 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900" 
            : "bg-primary/10 group-hover:bg-primary/15"
        )}>
          <Icon className={cn(
            "h-5 w-5",
            isActivated ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
          )} />
        </div>
      </div>

      {/* Name */}
      <h3 className="font-semibold text-base mb-1.5 pr-16">{name}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
        {description}
      </p>

      {/* Recommended With Pills */}
      {recommendedWith && recommendedWith.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {recommendedWith.slice(0, 2).map((rec) => (
            <span
              key={rec}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
            >
              + {rec}
            </span>
          ))}
        </div>
      )}
    </Card>
  );

  // Wrap with tooltip
  return (
    <ModuleTooltip moduleId={id} fallbackData={tooltipData}>
      {cardContent}
    </ModuleTooltip>
  );
}
