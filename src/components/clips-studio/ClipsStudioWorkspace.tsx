import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { ClipsGallery } from "./ClipsGallery";
import { ClipDetailPanel } from "./ClipDetailPanel";
import { ClipVideoPreview } from "./ClipVideoPreview";
import { ExportQueue, QueuedClip } from "./ExportQueue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, RefreshCw, Download, Sparkles, 
  LayoutGrid, List
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClipsStudioWorkspaceProps {
  sourceMedia: SourceMedia;
  clips: ClipData[];
  setClips: (clips: ClipData[]) => void;
  onReanalyze: () => void;
  onBack: () => void;
}

export function ClipsStudioWorkspace({
  sourceMedia,
  clips,
  setClips,
  onReanalyze,
  onBack,
}: ClipsStudioWorkspaceProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedClipId, setSelectedClipId] = useState<string | null>(
    clips[0]?.id || null
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [queuedClips, setQueuedClips] = useState<QueuedClip[]>([]);
  const [enableCertification, setEnableCertification] = useState(false);

  const selectedClip = clips.find(c => c.id === selectedClipId) || null;

  const handleClipUpdate = (clipId: string, updates: Partial<ClipData>) => {
    setClips(clips.map(c => 
      c.id === clipId ? { ...c, ...updates } : c
    ));
  };

  const handleAddToQueue = (clipId: string, clipTitle: string, format: string, thumbnailUrl?: string) => {
    // Check if already in queue
    const exists = queuedClips.some(q => q.clipId === clipId && q.format === format);
    if (exists) {
      // Remove from queue
      setQueuedClips(prev => prev.filter(q => !(q.clipId === clipId && q.format === format)));
      toast({ title: "Removed from queue", description: `${clipTitle} (${format}) removed` });
    } else {
      // Add to queue
      setQueuedClips(prev => [...prev, { clipId, clipTitle, format, thumbnailUrl }]);
      toast({ title: "Added to queue", description: `${clipTitle} (${format}) added` });
    }
  };

  const isInQueue = (clipId: string, format: string) => {
    return queuedClips.some(q => q.clipId === clipId && q.format === format);
  };

  const handleRemoveFromQueue = (clipId: string, format: string) => {
    setQueuedClips(prev => prev.filter(q => !(q.clipId === clipId && q.format === format)));
  };

  const handleClearQueue = () => {
    setQueuedClips([]);
    toast({ title: "Queue cleared" });
  };

  const handlePublish = () => {
    // Navigate to media detail page for publishing
    navigate(`/studio/media/${sourceMedia.id}`);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const averageViralityScore = clips.length > 0 
    ? Math.round(clips.reduce((acc, c) => acc + (c.virality_score || 0), 0) / clips.length)
    : 0;

  return (
    <div className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] bg-background flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 border-b bg-card/80 backdrop-blur-sm z-30">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-lg">
                  {sourceMedia.file_name.replace(/\.[^/.]+$/, "")}
                </h1>
                <Badge className="bg-[#2C6BED]/20 text-[#2C6BED] border-[#2C6BED]/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {clips.length} clips
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{formatDuration(sourceMedia.duration_seconds)} source</span>
                <span>•</span>
                <span>Avg. virality: {averageViralityScore}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Re-analyze button - more visible */}
            <Button 
              variant="default" 
              size="sm" 
              onClick={onReanalyze}
              className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
            
            {/* View mode toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", viewMode === 'grid' && "bg-background shadow-sm")}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", viewMode === 'list' && "bg-background shadow-sm")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel - Clips Gallery (scrollable independently) */}
        <ClipsGallery
          clips={clips}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          sourceMedia={sourceMedia}
          viewMode={viewMode}
        />

        {/* Center - Video Preview (fixed, no scroll) */}
        <ClipVideoPreview
          clip={selectedClip}
          sourceMedia={sourceMedia}
          onAddToQueue={handleAddToQueue}
          isInQueue={isInQueue}
        />

        {/* Right Panel - Clip Details & Editor (scrollable independently) */}
        <ClipDetailPanel
          clip={selectedClip}
          sourceMedia={sourceMedia}
          onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
        />
      </div>

      {/* Export Queue - Bottom Strip */}
      <ExportQueue
        queuedClips={queuedClips}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        onPublish={handlePublish}
        enableCertification={enableCertification}
        onCertificationChange={setEnableCertification}
      />
    </div>
  );
}
