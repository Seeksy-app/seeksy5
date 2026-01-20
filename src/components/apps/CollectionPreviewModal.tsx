import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Check, Package, AlertCircle, Loader2, ChevronRight } from "lucide-react";
import { useCollectionInstallation } from "@/hooks/useCollectionInstallation";
import { SEEKSY_MODULES } from "@/components/modules/moduleData";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface CollectionPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  onInstallComplete?: () => void;
}

/**
 * Modal that shows which modules will be installed when installing an App Bundle.
 * User must explicitly confirm before installation proceeds.
 * Bundles NEVER auto-install.
 */
export function CollectionPreviewModal({
  open,
  onOpenChange,
  collectionId,
  onInstallComplete,
}: CollectionPreviewModalProps) {
  const { previewCollectionInstall, installCollection } = useCollectionInstallation();
  const { currentWorkspace } = useWorkspace();
  const [isInstalling, setIsInstalling] = useState(false);

  const { newModules, alreadyInstalled, collection } = previewCollectionInstall(collectionId);

  // Get module details
  const getModuleDetails = (moduleId: string) => {
    return SEEKSY_MODULES.find(m => m.id === moduleId);
  };

  const handleInstallBundle = async () => {
    setIsInstalling(true);
    try {
      const success = await installCollection(collectionId);
      if (success) {
        onOpenChange(false);
        onInstallComplete?.();
      }
    } finally {
      setIsInstalling(false);
    }
  };

  if (!collection) {
    return null;
  }

  const CollectionIcon = collection.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${collection.color}20` }}
            >
              <CollectionIcon 
                className="h-6 w-6" 
                style={{ color: collection.color }} 
              />
            </div>
            <div>
              <DialogTitle className="text-xl">{collection.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {collection.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workspace target indicator */}
          {currentWorkspace && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-sm">
                Installing to: <strong>{currentWorkspace.name}</strong>
              </span>
            </div>
          )}

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
            <Package className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">
              {newModules.length > 0 
                ? `${newModules.length} Seeksy${newModules.length > 1 ? 's' : ''} will be installed`
                : 'All Seekies from this bundle are already installed'}
            </span>
          </div>

          {/* New modules to install */}
          {newModules.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Will be installed
              </h4>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {newModules.map(moduleId => {
                    const module = getModuleDetails(moduleId);
                    if (!module) return null;
                    const ModuleIcon = module.icon;
                    return (
                      <div 
                        key={moduleId}
                        className="flex items-center gap-3 p-2 rounded-lg border bg-card"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          {ModuleIcon && <ModuleIcon className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{module.name}</p>
                          {module.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {module.description}
                            </p>
                          )}
                        </div>
                        {module.isNew && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Already installed */}
          {alreadyInstalled.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Already installed ({alreadyInstalled.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {alreadyInstalled.map(moduleId => {
                    const module = getModuleDetails(moduleId);
                    return (
                      <Badge 
                        key={moduleId} 
                        variant="outline" 
                        className="text-xs text-muted-foreground"
                      >
                        {module?.name || moduleId}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleInstallBundle} 
            disabled={isInstalling || newModules.length === 0}
            className="w-full sm:w-auto gap-2"
          >
            {isInstalling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Installing...
              </>
            ) : newModules.length === 0 ? (
              'Already Installed'
            ) : (
              <>
                Install bundle to workspace
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
