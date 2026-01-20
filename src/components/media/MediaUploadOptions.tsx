import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { 
  Upload, FolderOpen, PlayCircle, Video, AudioWaveform, 
  Loader2, RefreshCw, ThumbsUp, ThumbsDown, CloudDownload
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DropboxImportDialog } from "@/components/tv/DropboxImportDialog";

interface ZoomRecording {
  id: string;
  topic: string;
  start_time: string;
  duration_seconds: number;
  thumbnail_url?: string;
  download_url?: string;
}

interface MediaUploadOptionsProps {
  onUploadClick: () => void;
  onImportComplete?: () => void;
  showLibraryButton?: boolean;
  onLibraryClick?: () => void;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "Unknown";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Vote popup component for coming soon features
function ComingSoonVotePopover({ 
  name, 
  children 
}: { 
  name: string; 
  children: React.ReactNode;
}) {
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);
  const [open, setOpen] = useState(false);

  const handleVote = async (vote: 'yes' | 'no') => {
    setVoted(vote);
    toast.success(
      vote === 'yes' 
        ? `Thanks! We'll prioritize ${name} integration.` 
        : `Got it! We'll note your feedback.`,
      { duration: 2000 }
    );
    setTimeout(() => setOpen(false), 1500);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="center">
        <div className="space-y-3">
          <div className="text-center">
            <p className="font-medium text-sm text-foreground">Coming Soon</p>
            <p className="text-xs text-muted-foreground mt-1">
              Would you like us to add {name} integration?
            </p>
          </div>
          {voted ? (
            <p className="text-center text-sm text-primary font-medium">
              Thanks for your feedback!
            </p>
          ) : (
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => handleVote('yes')}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Yes please!
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground"
                onClick={() => handleVote('no')}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                Not now
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function MediaUploadOptions({
  onUploadClick,
  onImportComplete,
  showLibraryButton = false,
  onLibraryClick,
  className,
  layout = 'horizontal'
}: MediaUploadOptionsProps) {
  const { toast: toastHook } = useToast();
  
  // Modal states
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showZoomConnectModal, setShowZoomConnectModal] = useState(false);
  const [showRiversideModal, setShowRiversideModal] = useState(false);
  const [showDropboxModal, setShowDropboxModal] = useState(false);
  
  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [isImportingYouTube, setIsImportingYouTube] = useState(false);
  
  // Zoom state
  const [zoomRecordings, setZoomRecordings] = useState<ZoomRecording[]>([]);
  const [isLoadingZoom, setIsLoadingZoom] = useState(false);
  const [connectingZoom, setConnectingZoom] = useState(false);

  // Validate YouTube URL
  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const handleYouTubeImport = async () => {
    if (!youtubeUrl.trim()) {
      setYoutubeError('Please enter a YouTube URL');
      return;
    }
    
    if (!validateYouTubeUrl(youtubeUrl)) {
      setYoutubeError('Please enter a valid YouTube URL (e.g., youtube.com/watch?v=...)');
      return;
    }
    
    setYoutubeError('');
    setIsImportingYouTube(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-youtube-video', {
        body: { youtube_url: youtubeUrl }
      });
      
      if (error) throw error;
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      toast.success("Import Started", {
        description: "Your YouTube video is being imported. This may take a few minutes.",
      });
      
      setShowYouTubeModal(false);
      setYoutubeUrl('');
      onImportComplete?.();
    } catch (error) {
      console.error('YouTube import error:', error);
      const message = error instanceof Error ? error.message : 'Could not import the YouTube video.';
      setYoutubeError(message);
      toast.error("Import Failed", {
        description: message,
      });
    } finally {
      setIsImportingYouTube(false);
    }
  };

  const handleZoomClick = async () => {
    setIsLoadingZoom(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('zoom-list-recordings');
      
      if (error) throw error;
      
      if (data.status === 'not_connected' || data.status === 'needs_reconnect') {
        setIsLoadingZoom(false);
        setShowZoomConnectModal(true);
        return;
      }
      
      if (data.status === 'ok') {
        setZoomRecordings(data.recordings || []);
        setShowZoomModal(true);
      } else {
        throw new Error(data.message || 'Failed to load recordings');
      }
    } catch (error) {
      console.error('Zoom error:', error);
      setShowZoomConnectModal(true);
    } finally {
      setIsLoadingZoom(false);
    }
  };

  const handleConnectZoom = async () => {
    setConnectingZoom(true);
    try {
      const { data, error } = await supabase.functions.invoke('zoom-auth');
      
      if (error) throw error;
      
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL received');
      }
    } catch (error) {
      console.error('Zoom connect error:', error);
      toast.error("Connection Failed", {
        description: "Could not connect to Zoom. Please try again.",
      });
    } finally {
      setConnectingZoom(false);
    }
  };

  const handleZoomRecordingSelect = async (recording: ZoomRecording) => {
    setShowZoomModal(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-zoom-recording', {
        body: {
          zoom_recording_id: recording.id,
          topic: recording.topic,
          download_url: recording.download_url,
          duration_seconds: recording.duration_seconds,
          thumbnail_url: recording.thumbnail_url,
        }
      });
      
      if (error) throw error;
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      toast.success("Import Started", {
        description: "Your Zoom recording is being imported.",
      });
      
      onImportComplete?.();
    } catch (error) {
      console.error('Zoom import error:', error);
      toast.error("Import Failed", {
        description: "Could not import the Zoom recording.",
      });
    }
  };

  const handleRiversideClick = async () => {
    setShowRiversideModal(true);
  };

  const buttonClass = layout === 'vertical' 
    ? "w-full justify-start" 
    : "rounded-full px-4 py-2 h-auto gap-2 font-medium";

  // Coming soon button - grey with vote popup
  const comingSoonButtonClass = cn(
    buttonClass,
    "bg-muted text-muted-foreground border-muted hover:bg-muted/80 cursor-pointer"
  );

  return (
    <>
      <div className={cn(
        layout === 'vertical' 
          ? "flex flex-col gap-2" 
          : "flex flex-col gap-3 items-center",
        className
      )}>
        {/* Row 1: Upload, Media Library, YouTube */}
        <div className={cn(layout === 'vertical' ? "flex flex-col gap-2 w-full" : "flex flex-wrap gap-3 justify-center")}>
          {/* Upload Files - solid yellow */}
          <Button
            onClick={onUploadClick}
            className={cn(buttonClass, "bg-amber-500 text-white hover:bg-amber-600 border-0")}
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>

          {/* From Media Library - optional - solid blue */}
          {showLibraryButton && onLibraryClick && (
            <Button
              onClick={onLibraryClick}
              className={cn(buttonClass, "bg-primary text-white hover:bg-primary/90 border-0")}
            >
              <FolderOpen className="h-4 w-4" />
              From Media Library
            </Button>
          )}

          {/* Import from YouTube - solid red */}
          <Button
            onClick={() => setShowYouTubeModal(true)}
            className={cn(buttonClass, "bg-red-600 text-white hover:bg-red-700 border-0")}
          >
            <PlayCircle className="h-4 w-4" />
            Import from YouTube
          </Button>
        </div>

        {/* Row 2: Zoom, Riverside, Descript */}
        <div className={cn(layout === 'vertical' ? "flex flex-col gap-2 w-full" : "flex flex-wrap gap-3 justify-center")}>
          {/* Import from Zoom - solid blue */}
          <Button
            onClick={handleZoomClick}
            disabled={isLoadingZoom}
            className={cn(buttonClass, "bg-blue-600 text-white hover:bg-blue-700 border-0")}
          >
            {isLoadingZoom ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Video className="h-4 w-4" />
            )}
            Import from Zoom
          </Button>

          {/* Import from Riverside - solid purple */}
          <Button
            onClick={handleRiversideClick}
            className={cn(buttonClass, "bg-purple-600 text-white hover:bg-purple-700 border-0")}
          >
            <AudioWaveform className="h-4 w-4" />
            Import from Riverside
          </Button>

          {/* Import from Dropbox - solid blue */}
          <Button
            onClick={() => setShowDropboxModal(true)}
            className={cn(buttonClass, "bg-blue-500 text-white hover:bg-blue-600 border-0")}
          >
            <CloudDownload className="h-4 w-4" />
            Import from Dropbox
          </Button>

          {/* Import from Descript - Coming Soon (grey with vote) */}
          <ComingSoonVotePopover name="Descript">
            <Button
              variant="outline"
              className={comingSoonButtonClass}
            >
              <AudioWaveform className="h-4 w-4" />
              Import from Descript
            </Button>
          </ComingSoonVotePopover>
        </div>

        {/* Row 3: Squadcast, Zencastr, Google Drive */}
        <div className={cn(layout === 'vertical' ? "flex flex-col gap-2 w-full" : "flex flex-wrap gap-3 justify-center")}>
          {/* Import from Squadcast - Coming Soon (grey with vote) */}
          <ComingSoonVotePopover name="Squadcast">
            <Button
              variant="outline"
              className={comingSoonButtonClass}
            >
              <AudioWaveform className="h-4 w-4" />
              Import from Squadcast
            </Button>
          </ComingSoonVotePopover>

          {/* Import from Zencastr - Coming Soon (grey with vote) */}
          <ComingSoonVotePopover name="Zencastr">
            <Button
              variant="outline"
              className={comingSoonButtonClass}
            >
              <AudioWaveform className="h-4 w-4" />
              Import from Zencastr
            </Button>
          </ComingSoonVotePopover>

          {/* Import from Google Drive - Coming Soon (grey with vote) */}
          <ComingSoonVotePopover name="Google Drive">
            <Button
              variant="outline"
              className={comingSoonButtonClass}
            >
              <FolderOpen className="h-4 w-4" />
              Import from Google Drive
            </Button>
          </ComingSoonVotePopover>
        </div>
      </div>

      {/* YouTube Import Modal */}
      <Dialog open={showYouTubeModal} onOpenChange={setShowYouTubeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-red-500" />
              Import from YouTube
            </DialogTitle>
            <DialogDescription>
              Paste a YouTube video URL to import it to your media library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setYoutubeError('');
                }}
                className={cn(youtubeError && "border-destructive")}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isImportingYouTube) {
                    handleYouTubeImport();
                  }
                }}
              />
              {youtubeError && (
                <p className="text-sm text-destructive">{youtubeError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This may take a few minutes while we fetch your video.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowYouTubeModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleYouTubeImport}
                disabled={isImportingYouTube}
                className="bg-red-600 hover:bg-red-700"
              >
                {isImportingYouTube ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Video'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zoom Recordings Modal */}
      <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              Select Zoom Recording
            </DialogTitle>
            <DialogDescription>
              Choose a recording to import from your Zoom account
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {zoomRecordings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No recordings found in your Zoom account</p>
              </div>
            ) : (
              <div className="space-y-2 p-1">
                {zoomRecordings.map((recording) => (
                  <div
                    key={recording.id}
                    onClick={() => handleZoomRecordingSelect(recording)}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="w-20 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                      {recording.thumbnail_url ? (
                        <img src={recording.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Video className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{recording.topic}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(recording.start_time).toLocaleDateString()} • {formatDuration(recording.duration_seconds)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Zoom Connect Modal */}
      <Dialog open={showZoomConnectModal} onOpenChange={setShowZoomConnectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              Connect to Zoom
            </DialogTitle>
            <DialogDescription>
              Connect your Zoom account to import podcast recordings directly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Many podcasters use Zoom to record their shows. Connect your account to easily import recordings.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowZoomConnectModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConnectZoom}
                disabled={connectingZoom}
                style={{ backgroundColor: '#2C6BED' }}
                className="text-white"
              >
                {connectingZoom ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Zoom'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Riverside Coming Soon Modal */}
      <Dialog open={showRiversideModal} onOpenChange={setShowRiversideModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AudioWaveform className="h-5 w-5 text-purple-500" />
              Riverside Integration
            </DialogTitle>
            <DialogDescription>
              Import recordings from Riverside.fm
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <AudioWaveform className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-lg font-semibold mb-2">Coming Soon!</p>
              <p className="text-sm text-muted-foreground">
                We're working on Riverside integration. You'll soon be able to import your podcast recordings directly.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setShowRiversideModal(false)}
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dropbox Import Modal */}
      <DropboxImportDialog
        open={showDropboxModal}
        onOpenChange={setShowDropboxModal}
        onImportComplete={() => {
          onImportComplete?.();
        }}
      />
    </>
  );
}
