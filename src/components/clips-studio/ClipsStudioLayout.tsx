import { useState } from "react";
import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { ClipsList } from "./ClipsList";
import { ClipPreview } from "./ClipPreview";
import { ClipEditor } from "./ClipEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Download } from "lucide-react";

interface ClipsStudioLayoutProps {
  sourceMedia: SourceMedia;
  clips: ClipData[];
  setClips: (clips: ClipData[]) => void;
  onReanalyze: () => void;
  onBack: () => void;
}

export function ClipsStudioLayout({
  sourceMedia,
  clips,
  setClips,
  onReanalyze,
  onBack,
}: ClipsStudioLayoutProps) {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(
    clips[0]?.id || null
  );

  const selectedClip = clips.find(c => c.id === selectedClipId) || null;

  const handleClipUpdate = (clipId: string, updates: Partial<ClipData>) => {
    setClips(clips.map(c => 
      c.id === clipId ? { ...c, ...updates } : c
    ));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-sm">
                {sourceMedia.file_name.replace(/\.[^/.]+$/, "")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {clips.length} clips detected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onReanalyze}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Clips List */}
        <ClipsList
          clips={clips}
          selectedClipId={selectedClipId}
          onSelectClip={setSelectedClipId}
          sourceMedia={sourceMedia}
        />

        {/* Center - Preview */}
        <ClipPreview
          clip={selectedClip}
          sourceMedia={sourceMedia}
        />

        {/* Right Panel - Editor */}
        <ClipEditor
          clip={selectedClip}
          sourceMedia={sourceMedia}
          onUpdate={(updates) => selectedClip && handleClipUpdate(selectedClip.id, updates)}
        />
      </div>
    </div>
  );
}
