import { Button } from "@/components/ui/button";
import { RotateCcw, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomizeModeBarProps {
  isVisible: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function CustomizeModeBar({
  isVisible,
  isSaving,
  onSave,
  onCancel,
  onReset,
}: CustomizeModeBarProps) {
  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl",
        "transform transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">
            Customize Mode Active — Drag sections and widgets to rearrange
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to default
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Done
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
