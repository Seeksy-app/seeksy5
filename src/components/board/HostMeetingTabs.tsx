import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MonitorPlay, 
  Film, 
  StickyNote,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Move,
  X,
  Upload,
  Library,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface HostMeetingTabsProps {
  meetingId: string;
  isHost: boolean;
  onMediaPlayStateChange?: (isPlaying: boolean) => void;
  disabled?: boolean;
  onScreenShareChange?: (isSharing: boolean, stream?: MediaStream) => void;
  onClose?: () => void;
}

interface WhiteboardBlock {
  id: string;
  type: 'text' | 'heading' | 'bullet';
  content: string;
  x: number;
  y: number;
}

interface MediaItem {
  id: string;
  title: string;
  media_type: string;
  url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  size_bytes?: number;
  created_at: string;
}

export function HostMeetingTabs({ 
  meetingId, 
  isHost, 
  onMediaPlayStateChange,
  disabled = false,
  onScreenShareChange,
  onClose,
}: HostMeetingTabsProps) {
  const [activeTab, setActiveTab] = useState("screen");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isMediaPlaying, setIsMediaPlaying] = useState(false);
  const [whiteboardBlocks, setWhiteboardBlocks] = useState<WhiteboardBlock[]>([]);
  const [newBlockContent, setNewBlockContent] = useState("");
  const [mediaSource, setMediaSource] = useState<'library' | 'upload'>('library');
  const [mediaSearch, setMediaSearch] = useState("");
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<MediaItem | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const { activeTenantId } = useTenant();

  // Fetch media library
  const { data: mediaLibrary = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['admin-media-library', activeTenantId, mediaSearch],
    queryFn: async () => {
      let query = supabase
        .from('media_files')
        .select('id, title, media_type, file_url, thumbnail_url, duration, file_size, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (mediaSearch) {
        query = query.ilike('title', `%${mediaSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching media library:', error);
        return [];
      }
      
      return (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled',
        media_type: item.media_type || 'video',
        url: item.file_url,
        thumbnail_url: item.thumbnail_url,
        duration_seconds: item.duration,
        size_bytes: item.file_size,
        created_at: item.created_at,
      }));
    },
    enabled: mediaSource === 'library',
  });

  // Attach screen share stream to video element
  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Screen sharing
  const handleStartScreenShare = async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      setScreenStream(stream);
      setIsScreenSharing(true);
      onScreenShareChange?.(true, stream);
      toast.success("Screen sharing started");
      
      // Handle when user stops sharing via browser controls
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setScreenStream(null);
        onScreenShareChange?.(false);
        toast.info("Screen sharing stopped");
      };
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error("Failed to start screen sharing");
      }
    }
  };

  const handleStopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    setIsScreenSharing(false);
    setScreenStream(null);
    onScreenShareChange?.(false);
    toast.info("Screen sharing stopped");
  };

  // Media playback
  const handleMediaPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsMediaPlaying(true);
      onMediaPlayStateChange?.(true);
    }
  };

  const handleMediaPause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsMediaPlaying(false);
      onMediaPlayStateChange?.(false);
    }
  };

  const handleMediaEnded = () => {
    setIsMediaPlaying(false);
    onMediaPlayStateChange?.(false);
  };

  const handleLibrarySelect = (item: MediaItem) => {
    setSelectedLibraryItem(item);
    setSelectedMedia(item.url);
  };

  const handleClearMedia = () => {
    handleMediaPause();
    setSelectedMedia(null);
    setSelectedLibraryItem(null);
  };

  // Whiteboard
  const addWhiteboardBlock = (type: WhiteboardBlock['type']) => {
    if (!newBlockContent.trim() || disabled) return;
    
    const newBlock: WhiteboardBlock = {
      id: crypto.randomUUID(),
      type,
      content: newBlockContent,
      x: 50 + Math.random() * 200,
      y: 50 + whiteboardBlocks.length * 60,
    };
    
    setWhiteboardBlocks([...whiteboardBlocks, newBlock]);
    setNewBlockContent("");
  };

  const removeBlock = (id: string) => {
    if (disabled) return;
    setWhiteboardBlocks(whiteboardBlocks.filter(b => b.id !== id));
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (!isHost) {
    // Non-host view - show what host is presenting
    return (
      <div className="space-y-4">
        {isScreenSharing && (
          <Card>
            <CardContent className="p-6 text-center">
              <MonitorPlay className="w-12 h-12 mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground">Host is sharing their screen</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-3 ${disabled ? 'opacity-50' : ''}`}>
          <TabsTrigger value="screen" className="flex items-center gap-1" disabled={disabled}>
            <MonitorPlay className="w-4 h-4" />
            <span className="hidden sm:inline">Screen</span>
            {isScreenSharing && <Badge variant="default" className="ml-1 h-4 px-1 text-xs">Live</Badge>}
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-1" disabled={disabled}>
            <Film className="w-4 h-4" />
            <span className="hidden sm:inline">Media</span>
            {isMediaPlaying && <Badge variant="default" className="ml-1 h-4 px-1 text-xs">▶</Badge>}
          </TabsTrigger>
          <TabsTrigger value="whiteboard" className="flex items-center gap-1" disabled={disabled}>
            <StickyNote className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="screen" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Screen Share</CardTitle>
            </CardHeader>
            <CardContent>
              {!isScreenSharing ? (
                <div className="text-center py-8">
                  <MonitorPlay className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Share your screen with meeting participants
                  </p>
                  <Button onClick={handleStartScreenShare} disabled={disabled}>
                    <MonitorPlay className="w-4 h-4 mr-2" />
                    Start Screen Share
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show local preview of screen share */}
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={screenVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                      <MonitorPlay className="h-3 w-3" />
                      Your Screen (Preview)
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge variant="default" className="mb-4 animate-pulse">
                      Screen Sharing Active
                    </Badge>
                    <p className="text-muted-foreground mb-4">
                      Participants can see your screen
                    </p>
                    <Button variant="destructive" onClick={handleStopScreenShare}>
                      <Square className="w-4 h-4 mr-2" />
                      Stop Sharing
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Media Player</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedMedia ? (
                <div className="space-y-4">
                  {/* Media source selector */}
                  <div className="flex gap-2">
                    <Button
                      variant={mediaSource === 'library' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaSource('library')}
                      disabled={disabled}
                      className="flex-1"
                    >
                      <Library className="w-4 h-4 mr-2" />
                      Library
                    </Button>
                    <Button
                      variant={mediaSource === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaSource('upload')}
                      disabled={disabled}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>

                  {mediaSource === 'library' ? (
                    <div className="space-y-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search media library..."
                          value={mediaSearch}
                          onChange={(e) => setMediaSearch(e.target.value)}
                          className="pl-10"
                          disabled={disabled}
                        />
                      </div>
                      
                      {/* Library items */}
                      <ScrollArea className="h-[200px]">
                        {mediaLoading ? (
                          <p className="text-center text-muted-foreground py-4">Loading...</p>
                        ) : mediaLibrary.length === 0 ? (
                          <div className="text-center py-8">
                            <Film className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-muted-foreground text-sm">No media in library</p>
                            <p className="text-xs text-muted-foreground mt-1">Upload a file instead</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {mediaLibrary.map((item) => (
                              <div
                                key={item.id}
                                className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                                  selectedLibraryItem?.id === item.id ? 'border-primary bg-primary/5' : ''
                                }`}
                                onClick={() => !disabled && handleLibrarySelect(item)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                    {item.thumbnail_url ? (
                                      <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover rounded" />
                                    ) : (
                                      <Film className="w-6 h-6 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span className="capitalize">{item.media_type}</span>
                                      {item.duration_seconds && <span>• {formatDuration(item.duration_seconds)}</span>}
                                      {item.size_bytes && <span>• {formatSize(item.size_bytes)}</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>

                      {selectedLibraryItem && (
                        <Button onClick={() => setSelectedMedia(selectedLibraryItem.url)} disabled={disabled} className="w-full">
                          <Play className="w-4 h-4 mr-2" />
                          Play "{selectedLibraryItem.title}"
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Upload a video or audio file to play for participants
                      </p>
                      <Input
                        type="file"
                        accept="video/*,audio/*"
                        onChange={(e) => {
                          if (disabled) return;
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedMedia(URL.createObjectURL(file));
                          }
                        }}
                        className="max-w-xs mx-auto"
                        disabled={disabled}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    src={selectedMedia}
                    className="w-full rounded-lg bg-black"
                    onEnded={handleMediaEnded}
                    onPause={() => {
                      setIsMediaPlaying(false);
                      onMediaPlayStateChange?.(false);
                    }}
                    onPlay={() => {
                      setIsMediaPlaying(true);
                      onMediaPlayStateChange?.(true);
                    }}
                  />
                  <div className="flex items-center justify-center gap-2">
                    {!isMediaPlaying ? (
                      <Button onClick={handleMediaPlay} disabled={disabled}>
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </Button>
                    ) : (
                      <Button onClick={handleMediaPause} disabled={disabled}>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleClearMedia} disabled={disabled}>
                      <Square className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    AI capture is {isMediaPlaying ? "paused" : "active"} during media playback
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whiteboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add new block */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a note..."
                    value={newBlockContent}
                    onChange={(e) => setNewBlockContent(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addWhiteboardBlock('text')}
                    disabled={disabled}
                  />
                  <Button
                    size="sm"
                    onClick={() => addWhiteboardBlock('text')}
                    disabled={!newBlockContent.trim() || disabled}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Block type buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addWhiteboardBlock('heading')}
                    disabled={!newBlockContent.trim() || disabled}
                  >
                    Heading
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addWhiteboardBlock('bullet')}
                    disabled={!newBlockContent.trim() || disabled}
                  >
                    Bullet
                  </Button>
                </div>

                {/* Blocks display */}
                <div className="min-h-[200px] bg-muted/30 rounded-lg p-4 space-y-2">
                  {whiteboardBlocks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No notes yet. Add your first note above.
                    </p>
                  ) : (
                    whiteboardBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="flex items-start gap-2 p-2 bg-background rounded border group"
                      >
                        <Move className="w-4 h-4 mt-1 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1">
                          {block.type === 'heading' ? (
                            <h4 className="font-semibold">{block.content}</h4>
                          ) : block.type === 'bullet' ? (
                            <p className="pl-4 relative before:content-['•'] before:absolute before:left-0">
                              {block.content}
                            </p>
                          ) : (
                            <p>{block.content}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBlock(block.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={disabled}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}