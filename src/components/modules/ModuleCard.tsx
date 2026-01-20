import { Plus, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type SeeksyModule, INTEGRATION_ICONS } from "./moduleData";
import { ModulePreview } from "./ModulePreview";

interface ModuleCardProps {
  module: SeeksyModule;
  isInstalled?: boolean;
  isInstalling?: boolean;
  onInstall: () => void;
  onOpen?: () => void;
  onBadgeClick?: (integrationId: string) => void;
  onCardClick?: () => void;
}

export function ModuleCard({ 
  module, 
  isInstalled, 
  isInstalling, 
  onInstall, 
  onOpen,
  onBadgeClick,
  onCardClick,
}: ModuleCardProps) {
  const maxVisibleBadges = 3;
  const integrations = module.integrations || [];
  const visibleIntegrations = integrations.slice(0, maxVisibleBadges);
  const remainingCount = integrations.length - maxVisibleBadges;
  
  return (
    <div 
      className={cn(
        "group relative rounded-xl border border-border/40 transition-all duration-300 bg-card overflow-hidden cursor-pointer",
        "hover:border-primary/50 hover:shadow-2xl hover:-translate-y-1.5",
        "shadow-lg shadow-black/5"
      )}
      onClick={onCardClick}
    >
      {/* Preview Area with screenshot-like pattern */}
      <ModulePreview module={module} size="md" />
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Author */}
        <div>
          <h3 
            className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-base"
          >
            {module.name}
          </h3>
          <p className="text-xs text-muted-foreground">by Seeksy</p>
        </div>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] leading-relaxed">
          {module.description}
        </p>
        
        {/* Footer with integration badges */}
        <div className="flex items-center justify-between pt-1">
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Integration Icons - clickable */}
          {integrations.length > 0 && (
            <TooltipProvider delayDuration={100}>
              <div className="flex items-center gap-1.5">
                {visibleIntegrations.map((integration, i) => {
                  const IntegrationData = INTEGRATION_ICONS[integration];
                  if (!IntegrationData) {
                    return (
                      <div 
                        key={i} 
                        className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center border border-border/50"
                      >
                        <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
                      </div>
                    );
                  }
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <button 
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-md",
                            "ring-2 ring-white/30 transition-all hover:scale-110 hover:ring-white/50",
                            IntegrationData.bg
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onBadgeClick?.(integration);
                          }}
                          aria-label={IntegrationData.name}
                        >
                          {IntegrationData.icon}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs font-medium">
                        {IntegrationData.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {remainingCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="w-7 h-7 rounded-lg bg-muted/80 flex items-center justify-center border border-border/50 ring-2 ring-white/20 hover:ring-white/40 transition-all hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardClick?.();
                        }}
                      >
                        <span className="text-[11px] font-bold text-muted-foreground">
                          +{remainingCount}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs font-medium">
                      {remainingCount} more integrations
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {isInstalled ? (
            <>
              <Badge 
                variant="secondary"
                className="gap-1 text-xs bg-emerald-50 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium px-2 py-1"
              >
                <Check className="h-3 w-3" />
                Active
              </Badge>
              {module.route && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen?.();
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  onInstall();
                }}
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <div className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Re-add
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-1.5 text-xs bg-primary hover:bg-primary/90 font-medium shadow-md shadow-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                onInstall();
              }}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add to workspace
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
