import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Save, X, ArrowRight } from "lucide-react";

interface AIEditCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalEdits: number;
  onSaveEdits: () => void;
  onKeepOriginal: () => void;
  onSaveBoth: () => void;
}

export const AIEditCompletionDialog = ({ 
  open, 
  onOpenChange,
  totalEdits,
  onSaveEdits,
  onKeepOriginal,
  onSaveBoth
}: AIEditCompletionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            AI Processing Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-8">
          {/* Success Message */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-2">
              <Sparkles className="h-10 w-10 text-green-500" />
            </div>
            <p className="text-xl">
              I've successfully prepared <span className="font-bold text-primary">{totalEdits} edits</span> for your video
            </p>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              Do you want to keep editing or save now?
            </p>
          </div>

          {/* Next Steps Info */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-base">
              <ArrowRight className="h-5 w-5 text-primary" />
              What happens next?
            </h4>
            <div className="space-y-4">
              <div className="flex gap-4 items-start p-4 rounded-lg bg-background border border-primary/10">
                <Badge className="shrink-0 px-3 py-1">Option 1</Badge>
                <div>
                  <p className="font-medium text-foreground mb-1.5">Save Edits Only</p>
                  <p className="text-sm text-muted-foreground">Keep AI changes and discard the original</p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-background border border-muted">
                <Badge variant="outline" className="shrink-0 px-3 py-1">Option 2</Badge>
                <div>
                  <p className="font-medium text-foreground mb-1.5">Keep Editing</p>
                  <p className="text-sm text-muted-foreground">Continue editing without saving yet</p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-lg bg-secondary/50 border border-secondary">
                <Badge variant="secondary" className="shrink-0 px-3 py-1">Option 3</Badge>
                <div>
                  <p className="font-medium text-foreground mb-1.5">Save Both Versions</p>
                  <p className="text-sm text-muted-foreground">Keep both the original and AI-edited video</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 pt-4">
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => {
                onKeepOriginal();
                onOpenChange(false);
              }}
              className="h-12"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Keep Editing
            </Button>
            <Button
              onClick={() => {
                onSaveEdits();
                onOpenChange(false);
              }}
              className="h-12"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Edits
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              onSaveBoth();
              onOpenChange(false);
            }}
            className="w-full h-12"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Both Versions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
