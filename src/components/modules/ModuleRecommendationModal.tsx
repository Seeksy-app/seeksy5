import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ModuleRecommendation } from "@/config/moduleRecommendations";
import { Sparkles } from "lucide-react";

interface ModuleRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  installedModuleName: string;
  recommendations: ModuleRecommendation[];
  onAddSelected: (moduleIds: string[]) => void;
  onSkip: () => void;
  isAdding?: boolean;
}

/**
 * Modal shown after installing a module that has recommended companions.
 * User can select which recommendations to add, or skip.
 */
export function ModuleRecommendationModal({
  isOpen,
  onClose,
  installedModuleName,
  recommendations,
  onAddSelected,
  onSkip,
  isAdding = false,
}: ModuleRecommendationModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelection = (moduleId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleAddSelected = () => {
    if (selected.size > 0) {
      onAddSelected(Array.from(selected));
    }
  };

  const handleSkip = () => {
    setSelected(new Set());
    onSkip();
  };

  const handleClose = () => {
    setSelected(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {installedModuleName} works well with...
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            These Seekies complement your installation. Add any that look useful.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {recommendations.map((rec) => {
            const Icon = rec.moduleIcon;
            const isChecked = selected.has(rec.moduleId);
            
            return (
              <label
                key={rec.moduleId}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  isChecked 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleSelection(rec.moduleId)}
                  className="mt-0.5"
                />
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    isChecked ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      isChecked ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{rec.moduleName}</p>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            disabled={isAdding}
          >
            Skip for now
          </Button>
          <Button 
            onClick={handleAddSelected}
            disabled={selected.size === 0 || isAdding}
          >
            {isAdding ? "Adding..." : `Add ${selected.size > 0 ? selected.size : ''} selected`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
