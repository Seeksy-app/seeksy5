import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface StudioExitConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
  onCancel: () => void;
}

export function StudioExitConfirmModal({
  open,
  onOpenChange,
  onSaveAndExit,
  onExitWithoutSaving,
  onCancel,
}: StudioExitConfirmModalProps) {
  const [autoSave, setAutoSave] = useState(false);

  const handleSaveAndExit = () => {
    if (autoSave) {
      localStorage.setItem("studio_auto_save", "true");
    }
    onSaveAndExit();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes in your Studio setup. Would you like to save before exiting?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="auto-save"
            checked={autoSave}
            onCheckedChange={(checked) => setAutoSave(checked === true)}
          />
          <label
            htmlFor="auto-save"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Always auto-save my Studio settings
          </label>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onExitWithoutSaving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Exit Without Saving
          </AlertDialogAction>
          <AlertDialogAction onClick={handleSaveAndExit}>
            Save & Exit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
