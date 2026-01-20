import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Radio, ChevronLeft, Edit2 } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VideoLayoutSelector, VideoLayout } from "@/components/studio/VideoLayoutSelector";

interface StudioTopBarProps {
  sessionName: string;
  onSessionNameChange: (name: string) => void;
  isLiveOnProfile: boolean;
  onGoLive: () => void;
  onBack: () => void;
  videoLayout: VideoLayout;
  onVideoLayoutChange: (layout: VideoLayout) => void;
  participantCount: number;
  isMeetingLive: boolean;
  onToggleMeetingLive: () => void;
}

export function StudioTopBar({
  sessionName,
  onSessionNameChange,
  isLiveOnProfile,
  onGoLive,
  onBack,
  videoLayout,
  onVideoLayoutChange,
  participantCount,
  isMeetingLive,
  onToggleMeetingLive,
}: StudioTopBarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <Input
              value={sessionName}
              onChange={(e) => onSessionNameChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
              }}
              className="h-8 w-64 text-lg font-semibold"
              autoFocus
            />
          ) : (
            <>
              <h1 className="text-lg font-semibold">{sessionName}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTitle(true)}
                className="h-6 w-6 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isMeetingLive ? (
          <Button
            onClick={onToggleMeetingLive}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            STOP MEETING
          </Button>
        ) : (
          <Button
            onClick={onToggleMeetingLive}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            START MEETING
          </Button>
        )}
        
        <div className="h-6 w-px bg-border" />
        
        {/* My Page Streaming Toggle */}
        {isLiveOnProfile ? (
          <Button
            onClick={onGoLive}
            size="sm"
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2"
          >
            <Radio className="h-4 w-4 animate-pulse" />
            LIVE on My Page
          </Button>
        ) : (
          <Button
            onClick={onGoLive}
            size="sm"
            className="bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold flex items-center gap-2"
          >
            <Radio className="h-4 w-4" />
            Go Live on My Page
          </Button>
        )}
        
        <div className="h-6 w-px bg-border" />
        
        <VideoLayoutSelector
          currentLayout={videoLayout}
          onLayoutChange={onVideoLayoutChange}
          participantCount={participantCount}
        />
        
        <div className="h-6 w-px bg-border" />
        
        <ThemeToggle />
      </div>
    </div>
  );
}
