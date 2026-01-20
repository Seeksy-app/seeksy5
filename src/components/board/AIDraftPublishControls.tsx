import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles, Check, ArrowRight, FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AIDraftPublishControlsProps {
  meetingId: string;
  hasAIDraft: boolean;
  isPublished: boolean;
  onPublish: () => Promise<void>;
  onRegenerate?: (includeNewInputs: boolean) => Promise<void>;
  draftSummary?: string | null;
  draftDecisions?: any[] | null;
  draftActionItems?: any[] | null;
}

export function AIDraftPublishControls({
  meetingId,
  hasAIDraft,
  isPublished,
  onPublish,
  onRegenerate,
  draftSummary,
  draftDecisions,
  draftActionItems,
}: AIDraftPublishControlsProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [includeNewInputs, setIncludeNewInputs] = useState(true);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
      toast.success("AI notes published to meeting record");
    } catch (error) {
      console.error("Failed to publish AI notes:", error);
      toast.error("Failed to publish AI notes");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    
    setShowRegenerateModal(false);
    setIsRegenerating(true);
    try {
      await onRegenerate(includeNewInputs);
      toast.success("New AI draft ready. Review and publish when you're ready.");
    } catch (error) {
      console.error("Failed to regenerate AI draft:", error);
      toast.error("Failed to regenerate AI draft");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!hasAIDraft) {
    return null;
  }

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Generated Notes
            {isPublished ? (
              <Badge variant="default" className="ml-auto bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                Published
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-auto border-amber-500 text-amber-600">
                AI Draft (Not published)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 text-sm">
            {/* Preview of draft content */}
            <div className="text-muted-foreground">
              {draftSummary && (
                <p className="line-clamp-2">{draftSummary}</p>
              )}
              {draftDecisions && draftDecisions.length > 0 && (
                <p className="mt-1">{draftDecisions.length} decision(s) detected</p>
              )}
              {draftActionItems && draftActionItems.length > 0 && (
                <p>{draftActionItems.length} action item(s) detected</p>
              )}
            </div>

            {/* Status text while regenerating */}
            {isRegenerating && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Regenerating AI draft…</span>
              </div>
            )}

            {!isPublished && !isRegenerating && (
              <div className="pt-2 border-t space-y-3">
                <p className="text-xs text-muted-foreground">
                  Publishing replaces the current published pack with this draft.
                </p>
                
                <div className="flex gap-2">
                  {onRegenerate && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setShowRegenerateModal(true)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Regenerate AI Pack
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Refreshes the AI draft using the latest agenda + questions + notes.</p>
                          <p className="mt-1">Your manual edits are not overwritten.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <Button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    size="sm"
                    className="gap-2 flex-1"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Publish to Notes
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Confirmation Modal */}
      <Dialog open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate AI Pack?</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                This will create a new AI draft for the memo, agenda recap, decisions, 
                and next steps using the latest meeting inputs.
              </p>
              <p>
                Your published content and manual edits stay intact.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-start gap-3 py-2">
            <Checkbox
              id="include-new-inputs"
              checked={includeNewInputs}
              onCheckedChange={(checked) => setIncludeNewInputs(checked === true)}
            />
            <label
              htmlFor="include-new-inputs"
              className="text-sm leading-tight cursor-pointer"
            >
              Include new member questions and agenda changes (recommended)
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRegenerate}>
              Regenerate Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
