import { useState } from "react";
import { ArrowLeft, Plus, Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type SeeksyModule, INTEGRATION_ICONS, SEEKSY_MODULES } from "./moduleData";
import { ModulePreview } from "./ModulePreview";

interface ModuleDetailDrawerProps {
  module: SeeksyModule | null;
  isOpen: boolean;
  onClose: () => void;
  isInstalled?: boolean;
  isInstalling?: boolean;
  onInstall: () => void;
  onOpen?: () => void;
}

export function ModuleDetailDrawer({
  module,
  isOpen,
  onClose,
  isInstalled,
  isInstalling,
  onInstall,
  onOpen,
}: ModuleDetailDrawerProps) {
  if (!isOpen || !module) return null;

  // Get related modules data
  const relatedModules = (module.integrations || [])
    .map(id => SEEKSY_MODULES.find(m => m.id === id))
    .filter(Boolean) as SeeksyModule[];

  return (
    <div className="fixed inset-0 z-[110]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-background shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold">{module.name}</h2>
              <p className="text-sm text-muted-foreground">by Seeksy</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Integration badges */}
            <TooltipProvider delayDuration={100}>
              <div className="flex items-center gap-1.5">
                {(module.integrations || []).slice(0, 5).map((integration, i) => {
                  const IntegrationData = INTEGRATION_ICONS[integration];
                  if (!IntegrationData) return null;
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-md cursor-pointer",
                            "ring-2 ring-white/30 transition-transform hover:scale-110",
                            IntegrationData.bg
                          )}
                        >
                          {IntegrationData.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs font-medium">
                        {IntegrationData.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            {/* Action buttons */}
            {isInstalled ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-0 dark:bg-emerald-900/30 dark:text-emerald-400"
                  disabled
                >
                  <Check className="h-4 w-4" />
                  Added
                </Button>
                {module.route && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={onOpen}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </Button>
                )}
              </>
            ) : (
              <Button
                size="sm"
                className="gap-1.5 shadow-md"
                onClick={onInstall}
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add to workspace
                  </>
                )}
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* Large Preview */}
            <div className="rounded-xl overflow-hidden border border-border/50 shadow-lg">
              <ModulePreview module={module} size="lg" />
            </div>
            
            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">About this module</h3>
              <p className="text-muted-foreground leading-relaxed">
                {module.description}
              </p>
            </div>
            
            {/* Benefits */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Key Benefits</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="text-muted-foreground">Seamlessly integrates with your existing Seeksy modules</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="text-muted-foreground">Real-time sync across all connected tools</span>
                </li>
                {module.isAIPowered && (
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">✨</span>
                    </div>
                    <span className="text-muted-foreground">AI-powered automation saves hours of manual work</span>
                  </li>
                )}
              </ul>
            </div>
            
            {/* Integrates with */}
            {relatedModules.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Integrates with</h3>
                <div className="grid grid-cols-2 gap-3">
                  {relatedModules.map((relatedModule) => {
                    const Icon = relatedModule.icon;
                    return (
                      <div 
                        key={relatedModule.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", relatedModule.bgGradient || "bg-muted")}>
                          <Icon className={cn("h-5 w-5", relatedModule.iconColor || "text-primary")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{relatedModule.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{relatedModule.category}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Category & Tags */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Category</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="capitalize">
                  {module.category.replace(/-/g, ' ')}
                </Badge>
                {module.primaryGroup && (
                  <Badge variant="outline" className="capitalize">
                    {module.primaryGroup.replace(/-/g, ' ')} Group
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}