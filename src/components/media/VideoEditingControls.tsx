import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wand2, 
  Scissors, 
  Crop, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2,
  Video
} from "lucide-react";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";

interface VideoEditingControlsProps {
  mediaFile: {
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
  };
  onProcessingComplete?: () => void;
}

export const VideoEditingControls = ({ mediaFile, onProcessingComplete }: VideoEditingControlsProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editType, setEditType] = useState<'ai_edit' | 'ad_insertion' | 'full_process'>('ai_edit');
  const [editConfig, setEditConfig] = useState({
    instructions: "",
    startTime: 0,
    endTime: 0,
    watermarkText: "",
    watermarkPosition: "bottom-right",
  });

  const { processVideo, isProcessing } = useVideoProcessing();

  const handleStartEdit = (type: 'ai_edit' | 'ad_insertion' | 'full_process') => {
    setEditType(type);
    setEditDialogOpen(true);
  };

  const handleSubmitEdit = async () => {
    try {
      const config: any = {
        instructions: editConfig.instructions
      };

      // Add specific configurations based on edit type
      if (editType === 'ai_edit') {
        config.features = {
          smartTrim: true,
          qualityEnhancement: true,
          autoCaptions: true
        };
      } else if (editType === 'ad_insertion') {
        // User can configure ad slots if needed
        config.adSlots = [];
      } else if (editType === 'full_process') {
        config.features = {
          smartTrim: true,
          qualityEnhancement: true,
          autoCaptions: true,
          adOptimization: true
        };
      }

      await processVideo(mediaFile.id, editType, config);
      setEditDialogOpen(false);
      onProcessingComplete?.();
    } catch (error) {
      console.error("Error processing video:", error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Post-Production Editing
          </CardTitle>
          <CardDescription>
            AI-powered and manual video editing tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleStartEdit('ai_edit')}
              disabled={isProcessing}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Wand2 className="h-6 w-6" />
              <div>
                <p className="font-medium">AI Edit</p>
                <p className="text-xs text-muted-foreground">Smart editing</p>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleStartEdit('ad_insertion')}
              disabled={isProcessing}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Video className="h-6 w-6" />
              <div>
                <p className="font-medium">Ad Insertion</p>
                <p className="text-xs text-muted-foreground">Insert ads</p>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleStartEdit('full_process')}
              disabled={isProcessing}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <CheckCircle2 className="h-6 w-6" />
              <div>
                <p className="font-medium">Full Process</p>
                <p className="text-xs text-muted-foreground">Complete workflow</p>
              </div>
            </Button>
          </div>

          {isProcessing && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div className="flex-1">
                <p className="font-medium">Processing video...</p>
                <p className="text-sm text-muted-foreground">This may take a few minutes</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editType === 'ai_edit' && 'AI-Powered Edit'}
              {editType === 'ad_insertion' && 'Ad Insertion'}
              {editType === 'full_process' && 'Full Process'}
            </DialogTitle>
            <DialogDescription>
              Configure your video editing parameters
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">Editing Instructions</Label>
              <Textarea
                id="instructions"
                placeholder={
                  editType === 'ai_edit' 
                    ? "E.g., Remove filler words like 'um' and 'uh', improve pacing, enhance audio quality..."
                    : editType === 'ad_insertion'
                    ? "E.g., Insert ads at natural breaks, avoid mid-sentence placements..."
                    : "E.g., Full AI enhancement with smart trim, quality boost, captions, and ad optimization..."
                }
                value={editConfig.instructions}
                onChange={(e) => setEditConfig({ ...editConfig, instructions: e.target.value })}
                rows={5}
              />
              <p className="text-sm text-muted-foreground">
                {editType === 'ai_edit' && "AI will analyze for filler words, quality issues, and suggest improvements"}
                {editType === 'ad_insertion' && "AI will find optimal timestamps for ad placement"}
                {editType === 'full_process' && "Complete AI-powered video enhancement pipeline"}
              </p>
            </div>

            {/* Feature preview for current edit type */}
            <div className="rounded-lg bg-primary/5 p-3 space-y-2">
              <p className="text-sm font-medium">Included Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {editType === 'ai_edit' && (
                  <>
                    <li>✓ Smart trim - removes filler words and pauses</li>
                    <li>✓ Quality enhancement - improves lighting and audio</li>
                    <li>✓ Auto-captions - generates accurate subtitles</li>
                  </>
                )}
                {editType === 'ad_insertion' && (
                  <>
                    <li>✓ AI-suggested ad break timestamps</li>
                    <li>✓ Natural scene transition detection</li>
                    <li>✓ Viewer engagement optimization</li>
                  </>
                )}
                {editType === 'full_process' && (
                  <>
                    <li>✓ Smart trim + quality enhancement</li>
                    <li>✓ Auto-captions with timestamps</li>
                    <li>✓ Optimal ad placement suggestions</li>
                    <li>✓ Complete video analysis report</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmitEdit} disabled={isProcessing} className="flex-1">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Start Edit
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
