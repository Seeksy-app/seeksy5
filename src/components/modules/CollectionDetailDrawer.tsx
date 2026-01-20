import { ArrowLeft, Plus, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type SeeksyCollection } from "./collectionData";
import { SEEKSY_MODULES } from "./moduleData";

interface CollectionDetailDrawerProps {
  collection: SeeksyCollection | null;
  isOpen: boolean;
  onClose: () => void;
  installedModuleIds: Set<string>;
  isInstalling?: boolean;
  onInstallCollection: () => void;
  onInstallApp: (moduleId: string) => void;
}

export function CollectionDetailDrawer({
  collection,
  isOpen,
  onClose,
  installedModuleIds,
  isInstalling,
  onInstallCollection,
  onInstallApp,
}: CollectionDetailDrawerProps) {
  if (!isOpen || !collection) return null;

  const Icon = collection.icon;
  
  // Get all included modules
  const includedModules = collection.includedApps
    .map(id => SEEKSY_MODULES.find(m => m.id === id))
    .filter(Boolean);
  
  // Check if all apps in collection are installed
  const allAppsInstalled = collection.includedApps.every(id => installedModuleIds.has(id));
  const installedCount = collection.includedApps.filter(id => installedModuleIds.has(id)).length;

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
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: collection.color }}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{collection.name}</h2>
                <p className="text-sm text-muted-foreground">by Seeksy • {collection.includedApps.length} apps</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {allAppsInstalled ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 px-3 py-1">
                <Check className="h-3.5 w-3.5 mr-1" />
                All Apps Added
              </Badge>
            ) : (
              <Button
                size="sm"
                className="gap-1.5 shadow-md"
                onClick={onInstallCollection}
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
                    Add All Apps
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
            {/* Collection Preview */}
            <div className={cn("h-40 rounded-xl relative overflow-hidden", collection.bgGradient)}>
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="h-20 w-20 text-white/20" />
              </div>
              {collection.isPopular && (
                <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-0 shadow-lg">
                  ⭐ Popular Collection
                </Badge>
              )}
              <div className="absolute bottom-4 right-4 text-sm font-medium text-white/80 bg-black/20 px-3 py-1 rounded-full">
                {installedCount}/{collection.includedApps.length} apps added
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">About this collection</h3>
              <p className="text-muted-foreground leading-relaxed">
                {collection.description}
              </p>
            </div>
            
            {/* Included Apps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Apps in this collection</h3>
                <span className="text-sm text-muted-foreground">
                  {installedCount} of {collection.includedApps.length} added
                </span>
              </div>
              
              <div className="space-y-2">
                {includedModules.map((module) => {
                  if (!module) return null;
                  const ModuleIcon = module.icon;
                  const isInstalled = installedModuleIds.has(module.id);
                  
                  return (
                    <div 
                      key={module.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                        isInstalled 
                          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20" 
                          : "border-border/50 hover:border-border hover:bg-muted/30"
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", module.bgGradient || "bg-muted")}>
                        <ModuleIcon className={cn("h-6 w-6", module.iconColor || "text-primary")} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{module.name}</h4>
                          {module.isAIPowered && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              ✨ AI
                            </Badge>
                          )}
                          {module.isNew && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 py-0">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{module.description}</p>
                      </div>
                      
                      {isInstalled ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Added
                          </Badge>
                          {module.route && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 shrink-0"
                          onClick={() => onInstallApp(module.id)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
