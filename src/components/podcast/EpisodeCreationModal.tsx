import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Upload, FolderOpen } from "lucide-react";

interface EpisodeCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  podcastId: string;
  podcastTitle: string;
}

export const EpisodeCreationModal = ({
  open,
  onOpenChange,
  podcastId,
  podcastTitle,
}: EpisodeCreationModalProps) => {
  const navigate = useNavigate();

  const handleRecordInStudio = () => {
    // Navigate to Master Studio with podcast context
    navigate(`/studio?podcastId=${podcastId}&podcastTitle=${encodeURIComponent(podcastTitle)}`);
    onOpenChange(false);
  };

  const handleUploadExisting = () => {
    // Navigate to episode creation form with upload mode
    navigate(`/podcasts/${podcastId}/episodes/new`, { 
      state: { mode: 'upload' } 
    });
    onOpenChange(false);
  };

  const handleUseFromLibrary = () => {
    // Navigate to episode creation form with library selection mode
    navigate(`/podcasts/${podcastId}/episodes/new`, { 
      state: { mode: 'library' } 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Episode</DialogTitle>
          <DialogDescription>
            Recording for podcast: <span className="font-semibold text-foreground">{podcastTitle}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Card 
            className="p-6 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary"
            onClick={handleRecordInStudio}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Record in Studio</h3>
                <p className="text-sm text-muted-foreground">
                  Record audio or video directly in Master Studio with professional tools
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary"
            onClick={handleUploadExisting}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Upload Existing Recording</h3>
                <p className="text-sm text-muted-foreground">
                  Upload an audio or video file from your device
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary"
            onClick={handleUseFromLibrary}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Use Recording from Media Library</h3>
                <p className="text-sm text-muted-foreground">
                  Select an existing file from your Media Library
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
