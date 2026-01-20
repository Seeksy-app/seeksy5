import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { BoardDecision } from "@/hooks/useBoardDecisions";

interface ExitGuardrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  unresolvedDecisions: BoardDecision[];
  onReviewDecisions: () => void;
  onDeferAllAndEnd: (note: string) => void;
}

export function ExitGuardrailModal({
  isOpen,
  onClose,
  unresolvedDecisions,
  onReviewDecisions,
  onDeferAllAndEnd,
}: ExitGuardrailModalProps) {
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [endNote, setEndNote] = useState("");

  const handleReviewDecisions = () => {
    onClose();
    onReviewDecisions();
  };

  const handleDeferAll = () => {
    onDeferAllAndEnd(endNote || "Meeting ended - decisions deferred for follow-up");
    onClose();
  };

  const handleEndAnyway = () => {
    setShowConfirmEnd(true);
  };

  const handleConfirmEnd = () => {
    if (!endNote.trim()) return;
    setShowConfirmEnd(false);
    handleDeferAll();
  };

  return (
    <>
      <Dialog open={isOpen && !showConfirmEnd} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              You have unresolved decisions
            </DialogTitle>
            <DialogDescription>
              This meeting surfaced {unresolvedDecisions.length} decision(s) that haven't been finalized.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {unresolvedDecisions.map((decision) => (
              <div key={decision.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{decision.topic}</p>
                  {decision.decision ? (
                    <p className="text-xs text-muted-foreground truncate">{decision.decision}</p>
                  ) : (
                    <p className="text-xs text-amber-600">No decision entered</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  {decision.status === 'needs_followup' ? 'Needs Follow-up' : 'Open'}
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="default" onClick={handleReviewDecisions} className="w-full sm:w-auto">
              Review Decisions
            </Button>
            <Button variant="outline" onClick={handleDeferAll} className="w-full sm:w-auto">
              Mark All as Deferred
            </Button>
            <Button variant="ghost" onClick={handleEndAnyway} className="w-full sm:w-auto text-muted-foreground">
              End Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmEnd} onOpenChange={setShowConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End meeting without finalizing decisions?</AlertDialogTitle>
            <AlertDialogDescription>
              Unresolved decisions will be marked as Deferred and carried forward. Please add a note explaining why.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="end-note" className="text-sm font-medium">
              Required note
            </Label>
            <Input
              id="end-note"
              placeholder="e.g., Time ran out, will revisit next meeting..."
              value={endNote}
              onChange={(e) => setEndNote(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmEnd(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEnd} disabled={!endNote.trim()}>
              End Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
