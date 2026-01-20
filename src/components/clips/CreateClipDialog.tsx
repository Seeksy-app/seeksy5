import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CertificationToggle } from "./CertificationToggle";
import { Sparkles } from "lucide-react";

interface CreateClipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (enableCertification: boolean) => void;
  isCreating: boolean;
}

export function CreateClipDialog({
  open,
  onOpenChange,
  onConfirm,
  isCreating,
}: CreateClipDialogProps) {
  const [enableCertification, setEnableCertification] = useState(false);

  const handleConfirm = () => {
    onConfirm(enableCertification);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Demo Clip
          </DialogTitle>
          <DialogDescription>
            Configure your clip settings before generation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <CertificationToggle
            enabled={enableCertification}
            onChange={setEnableCertification}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isCreating}>
            {isCreating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Clip
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
