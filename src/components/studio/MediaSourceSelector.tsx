import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, FolderOpen, PlayCircle, Video, AudioWaveform, 
  Loader2, Check, AlertCircle, Clock, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaSource = 'upload' | 'library' | 'youtube' | 'zoom' | 'riverside';
export type ImportStatus = 'idle' | 'importing' | 'ready' | 'error';

interface MediaSourceSelectorProps {
  onUploadClick: () => void;
  onLibraryClick: () => void;
  onMediaSelected: (mediaId: string, source: MediaSource) => void;
  selectedMedia: {
    id: string;
    file_name: string | null;
    thumbnail_url: string | null;
    duration_seconds: number | null;
    file_type: string | null;
    source?: MediaSource;
    status?: string;
    error_message?: string | null;
  } | null;
  onClearMedia: () => void;
  importStatus?: ImportStatus;
}

interface ZoomRecording {
  id: string;
  topic: string;
  start_time: string;
  duration_seconds: number;
  thumbnail_url?: string;
  download_url?: string;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "Unknown";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function MediaSourceSelector({
  onUploadClick,
  onLibraryClick,
  onMediaSelected,
  selectedMedia,
  onClearMedia,
  importStatus = 'idle'
}: MediaSourceSelectorProps) {
  const { toast } = useToast();
  
  // Modal states
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showZoomConnectModal, setShowZoomConnectModal] = useState(false);
  const [showRiversideModal, setShowRiversideModal] = useState(false);
  
  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [isImportingYouTube, setIsImportingYouTube] = useState(false);
  const [youtubeImportStep, setYoutubeImportStep] = useState<'input' | 'fetching' | 'downloading' | 'processing' | 'analyzing' | 'complete' | 'error'>('input');
  const [youtubeImportMediaId, setYoutubeImportMediaId] = useState<string | null>(null);
  
  // Zoom state
  const [zoomRecordings, setZoomRecordings] = useState<ZoomRecording[]>([]);
  const [isLoadingZoom, setIsLoadingZoom] = useState(false);
  const [connectingZoom, setConnectingZoom] = useState(false);
  const [zoomError, setZoomError] = useState<string | null>(null);
  
  // Import polling state
  const [pollingMediaId, setPollingMediaId] = useState<string | null>(null);
  const [currentImportStatus, setCurrentImportStatus] = useState<ImportStatus>('idle');

  // Poll for import status
  useEffect(() => {
    if (!pollingMediaId) return;

    const pollStatus = async () => {
      const { data, error } = await supabase
        .from('media_files')
        .select('id, status, file_name, thumbnail_url, duration_seconds, error_message')
        .eq('id', pollingMediaId)
        .single();

      if (error) {
        console.error('Polling error:', error);
        return;
      }

      if (data.status === 'ready') {
        setCurrentImportStatus('ready');
        setPollingMediaId(null);
        toast({
          title: "Import Complete",
          description: `"${data.file_name}" is ready to use.`,
        });
      } else if (data.status === 'error') {
        setCurrentImportStatus('error');
        setPollingMediaId(null);
        toast({
          title: "Import Failed",
          description: data.error_message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [pollingMediaId, toast]);

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
    setYoutubeImportStep('fetching');
    setCurrentImportStatus('importing');
    
    try {
      // Simulate step progression for better UX
      setTimeout(() => setYoutubeImportStep('downloading'), 2000);
      
      const { data, error } = await supabase.functions.invoke('import-youtube-video', {
        body: { youtube_url: youtubeUrl }
      });
      
      if (error) throw error;
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }
      
      setYoutubeImportStep('processing');
      setYoutubeImportMediaId(data.media_file_id);
      
      // Start polling for this media (keep modal open)
      setPollingMediaId(data.media_file_id);
      onMediaSelected(data.media_file_id, 'youtube');
      
    } catch (error) {
      console.error('YouTube import error:', error);
      setCurrentImportStatus('error');
      setYoutubeImportStep('error');
      const message = error instanceof Error ? error.message : 'Could not import the YouTube video.';
      setYoutubeError(message);
    } finally {
      setIsImportingYouTube(false);
    }
  };

  // Poll YouTube import status and update modal
  useEffect(() => {
    if (!youtubeImportMediaId || youtubeImportStep === 'complete' || youtubeImportStep === 'error') return;

    const pollYouTubeStatus = async () => {
      const { data, error } = await supabase
        .from('media_files')
        .select('id, status, file_name, thumbnail_url, duration_seconds, error_message')
        .eq('id', youtubeImportMediaId)
        .single();

      if (error) {
        console.error('YouTube polling error:', error);
        return;
      }

      if (data.status === 'processing') {
        setYoutubeImportStep('analyzing');
      } else if (data.status === 'ready') {
        setYoutubeImportStep('complete');
        setCurrentImportStatus('ready');
        toast({
          title: "Import Complete!",
          description: `"${data.file_name}" is ready for AI processing.`,
        });
        // Auto-close after showing success
        setTimeout(() => {
          setShowYouTubeModal(false);
          setYoutubeUrl('');
          setYoutubeImportStep('input');
          setYoutubeImportMediaId(null);
        }, 1500);
      } else if (data.status === 'error') {
        setYoutubeImportStep('error');
        setCurrentImportStatus('error');
        setYoutubeError(data.error_message || 'Import failed. Please try again.');
      }
    };

    const interval = setInterval(pollYouTubeStatus, 2000);
    return () => clearInterval(interval);
  }, [youtubeImportMediaId, youtubeImportStep, toast]);

  const resetYouTubeModal = () => {
    setYoutubeUrl('');
    setYoutubeError('');
    setYoutubeImportStep('input');
    setYoutubeImportMediaId(null);
    setIsImportingYouTube(false);
  };

  const handleZoomClick = async () => {
    setZoomError(null);
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
      toast({
        title: "Connection Failed",
        description: "Could not connect to Zoom. Please try again.",
        variant: "destructive"
      });
    } finally {
      setConnectingZoom(false);
    }
  };

  const handleZoomRecordingSelect = async (recording: ZoomRecording) => {
    setCurrentImportStatus('importing');
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
      
      toast({
        title: "Import Started",
        description: "Your Zoom recording is being imported.",
      });
      
      setPollingMediaId(data.media_file_id);
      onMediaSelected(data.media_file_id, 'zoom');
    } catch (error) {
      console.error('Zoom import error:', error);
      setCurrentImportStatus('error');
      toast({
        title: "Import Failed",
        description: "Could not import the Zoom recording.",
        variant: "destructive"
      });
    }
  };

  const handleRiversideClick = async () => {
    try {
      const { data } = await supabase.functions.invoke('riverside-sessions');
      
      if (data?.status === 'coming_soon') {
        setShowRiversideModal(true);
      }
    } catch (error) {
      setShowRiversideModal(true);
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    const status = currentImportStatus !== 'idle' ? currentImportStatus : importStatus;
    
    switch (status) {
      case 'importing':
        return (
          <Badge className="animate-pulse" style={{ backgroundColor: '#FFC857', color: '#053877' }}>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Importing...
          </Badge>
        );
      case 'ready':
        return (
          <Badge className="bg-green-500 text-white">
            <Check className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSourceLabel = (source?: MediaSource | string) => {
    switch (source) {
      case 'upload': return 'Uploaded';
      case 'library': return 'Media Library';
      case 'youtube': return 'YouTube';
      case 'zoom': return 'Zoom';
      case 'riverside': return 'Riverside';
      case 'studio': return 'Studio';
      default: return 'Media Library';
    }
  };

  const getSourceColor = (source?: MediaSource | string) => {
    switch (source) {
      case 'youtube': return 'bg-red-100 text-red-700 border-red-200';
      case 'zoom': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'riverside': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // If media is selected, show compact view
  if (selectedMedia) {
    return (
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border" style={{ borderColor: 'rgba(5,56,119,0.18)' }}>
        <div className="w-28 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center relative shrink-0">
          {selectedMedia.thumbnail_url ? (
            <img 
              src={selectedMedia.thumbnail_url} 
              alt={selectedMedia.file_name || 'Media'}
              className="w-full h-full object-cover"
            />
          ) : selectedMedia.file_type === 'video' ? (
            <Video className="h-8 w-8 text-muted-foreground" />
          ) : (
            <AudioWaveform className="h-8 w-8 text-muted-foreground" />
          )}
          {currentImportStatus === 'importing' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{selectedMedia.file_name || 'Untitled'}</p>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {selectedMedia.duration_seconds && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDuration(selectedMedia.duration_seconds)}
              </span>
            )}
            <Badge variant="outline" className={cn("text-xs", getSourceColor(selectedMedia.source))}>
              {getSourceLabel(selectedMedia.source)}
            </Badge>
            {getStatusBadge()}
          </div>
          {selectedMedia.error_message && (
            <p className="text-xs text-destructive mt-1">{selectedMedia.error_message}</p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setCurrentImportStatus('idle');
            setPollingMediaId(null);
            onClearMedia();
          }}
          className="shrink-0"
        >
          Change Media
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Source Buttons */}
      <div 
        className="border-2 border-dashed rounded-xl p-6"
        style={{ borderColor: 'rgba(5, 56, 119, 0.18)' }}
      >
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          {/* Upload Files */}
          <Button
            onClick={onUploadClick}
            className="rounded-full px-5 py-2 h-auto gap-2 font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#FFC857', color: '#053877' }}
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>

          {/* From Media Library */}
          <Button
            onClick={onLibraryClick}
            className="rounded-full px-5 py-2 h-auto gap-2 font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#053877' }}
          >
            <FolderOpen className="h-4 w-4" />
            From Media Library
          </Button>

          {/* Import from YouTube */}
          <Button
            onClick={() => setShowYouTubeModal(true)}
            variant="outline"
            className="rounded-full px-5 py-2 h-auto gap-2 font-medium border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <PlayCircle className="h-4 w-4" />
            Import from YouTube
          </Button>

          {/* Import from Zoom */}
          <Button
            onClick={handleZoomClick}
            disabled={isLoadingZoom}
            className="rounded-full px-5 py-2 h-auto gap-2 font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2C6BED' }}
          >
            {isLoadingZoom ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Video className="h-4 w-4" />
            )}
            Import from Zoom
          </Button>

          {/* Import from Riverside */}
          <Button
            onClick={handleRiversideClick}
            variant="outline"
            className="rounded-full px-5 py-2 h-auto gap-2 font-medium bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
          >
            <AudioWaveform className="h-4 w-4" />
            Import from Riverside
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Drop your video or audio files here, or select a source above
        </p>
      </div>

      {/* YouTube Import Modal */}
      <Dialog open={showYouTubeModal} onOpenChange={(open) => {
        if (!open && youtubeImportStep !== 'input') {
          // Don't close while importing unless error
          if (youtubeImportStep === 'error' || youtubeImportStep === 'complete') {
            resetYouTubeModal();
            setShowYouTubeModal(false);
          }
          return;
        }
        setShowYouTubeModal(open);
        if (!open) resetYouTubeModal();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-red-500" />
              Import from YouTube
            </DialogTitle>
            {youtubeImportStep === 'input' && (
              <DialogDescription>
                Paste a YouTube video URL to import it for AI post-production
              </DialogDescription>
            )}
          </DialogHeader>
          
          {youtubeImportStep === 'input' ? (
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
                  Import from YouTube
                </Button>
              </div>
            </div>
          ) : youtubeImportStep === 'error' ? (
            <div className="space-y-4 pt-4">
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm text-destructive font-medium">Import Failed</p>
                <p className="text-sm text-muted-foreground text-center">{youtubeError}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => {
                  resetYouTubeModal();
                  setShowYouTubeModal(false);
                }}>
                  Close
                </Button>
                <Button onClick={resetYouTubeModal}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : youtubeImportStep === 'complete' ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-600">Import Complete!</p>
              <p className="text-sm text-muted-foreground">Your video is ready for AI processing</p>
            </div>
          ) : (
            <div className="space-y-6 pt-4 pb-2">
              {/* Progress Steps */}
              <div className="space-y-3">
                {[
                  { key: 'fetching', label: 'Fetching video info', icon: RefreshCw },
                  { key: 'downloading', label: 'Downloading video', icon: Video },
                  { key: 'processing', label: 'Processing media', icon: Clock },
                  { key: 'analyzing', label: 'Analyzing content', icon: Loader2 },
                ].map((step, index) => {
                  const stepOrder = ['fetching', 'downloading', 'processing', 'analyzing'];
                  const currentIndex = stepOrder.indexOf(youtubeImportStep);
                  const stepIndex = stepOrder.indexOf(step.key);
                  const isActive = step.key === youtubeImportStep;
                  const isComplete = stepIndex < currentIndex;
                  const isPending = stepIndex > currentIndex;

                  return (
                    <div key={step.key} className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all",
                      isActive && "bg-primary/5 border border-primary/20",
                      isComplete && "opacity-60",
                      isPending && "opacity-40"
                    )}>
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        isComplete && "bg-green-100",
                        isActive && "bg-primary/10",
                        isPending && "bg-muted"
                      )}>
                        {isComplete ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : isActive ? (
                          <step.icon className="h-4 w-4 text-primary animate-spin" />
                        ) : (
                          <step.icon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        isActive && "text-foreground",
                        isComplete && "text-muted-foreground",
                        isPending && "text-muted-foreground"
                      )}>
                        {step.label}
                        {isActive && "..."}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Please wait, this may take a few minutes...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Zoom Connect Modal */}
      <Dialog open={showZoomConnectModal} onOpenChange={setShowZoomConnectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" style={{ color: '#2C6BED' }} />
              Connect Zoom Account
            </DialogTitle>
            <DialogDescription>
              Connect your Zoom account to import cloud recordings directly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-lg border" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
              <p className="text-sm" style={{ color: '#1E40AF' }}>
                Once connected, you'll be able to browse and import your Zoom cloud recordings 
                for AI enhancement and clip generation.
              </p>
            </div>
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
                  'Connect Zoom Account'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zoom Recordings Modal */}
      <Dialog open={showZoomModal} onOpenChange={setShowZoomModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="pb-4 border-b" style={{ borderColor: 'rgba(5,56,119,0.1)' }}>
            <DialogTitle className="flex items-center gap-2" style={{ color: '#053877' }}>
              <Video className="h-5 w-5" style={{ color: '#2C6BED' }} />
              Select Zoom Recording
            </DialogTitle>
            <DialogDescription>
              Choose a cloud recording to import for AI post-production
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {isLoadingZoom ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : zoomRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Video className="h-12 w-12 mb-2 opacity-50" />
                <p className="font-medium">No cloud recordings found</p>
                <p className="text-sm">Record a meeting with cloud recording enabled to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {zoomRecordings.map((recording) => (
                  <button
                    key={recording.id}
                    onClick={() => handleZoomRecordingSelect(recording)}
                    className="w-full flex items-center gap-4 p-3 rounded-lg border hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-left"
                  >
                    <div className="w-20 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded overflow-hidden shrink-0 flex items-center justify-center">
                      {recording.thumbnail_url ? (
                        <img 
                          src={recording.thumbnail_url} 
                          alt={recording.topic}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Video className="h-6 w-6" style={{ color: '#2C6BED' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{recording.topic}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{new Date(recording.start_time).toLocaleDateString()}</span>
                        {recording.duration_seconds > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(recording.duration_seconds)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="pt-4 border-t flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setIsLoadingZoom(true);
                handleZoomClick();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setShowZoomModal(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Riverside Coming Soon Modal */}
      <Dialog open={showRiversideModal} onOpenChange={setShowRiversideModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AudioWaveform className="h-5 w-5 text-purple-600" />
              Riverside Import
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-6 bg-gradient-to-br from-purple-50 to-gray-50 rounded-lg border border-purple-200 text-center">
              <AudioWaveform className="h-12 w-12 mx-auto mb-3 text-purple-400" />
              <h4 className="font-semibold text-gray-800 mb-2">Coming Soon</h4>
              <p className="text-sm text-gray-600">
                Riverside integration is coming soon. You'll be able to pull episodes directly 
                from your Riverside studio.
              </p>
              <p className="text-sm text-gray-500 mt-3">
                For now, download from Riverside and upload to Seeksy manually.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowRiversideModal(false)}>
                Close
              </Button>
              <Button 
                variant="outline"
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                Connect Riverside
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
