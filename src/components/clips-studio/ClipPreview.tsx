import { useState, useRef, useEffect } from "react";
import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Pause, SkipBack, SkipForward, Maximize2, Volume2, VolumeX,
  Smartphone, Monitor, Square, RectangleHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClipPreviewProps {
  clip: ClipData | null;
  sourceMedia: SourceMedia;
}

const aspectRatios = [
  { id: "9:16", label: "9:16", icon: Smartphone, description: "TikTok, Reels, Shorts" },
  { id: "1:1", label: "1:1", icon: Square, description: "Instagram Feed" },
  { id: "16:9", label: "16:9", icon: Monitor, description: "YouTube, Website" },
  { id: "4:5", label: "4:5", icon: RectangleHorizontal, description: "Instagram Portrait" },
];

export function ClipPreview({ clip, sourceMedia }: ClipPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState("9:16");

  const clipDuration = clip ? (clip.end_seconds - clip.start_seconds) : 0;

  useEffect(() => {
    if (videoRef.current && clip) {
      videoRef.current.currentTime = clip.start_seconds;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [clip?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clip) return;

    const handleTimeUpdate = () => {
      const relativeTime = video.currentTime - clip.start_seconds;
      setCurrentTime(Math.max(0, Math.min(relativeTime, clipDuration)));
      
      // Loop within clip bounds
      if (video.currentTime >= clip.end_seconds) {
        video.currentTime = clip.start_seconds;
        if (!isPlaying) {
          video.pause();
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [clip, clipDuration, isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !clip) return;

    if (isPlaying) {
      video.pause();
    } else {
      if (video.currentTime < clip.start_seconds || video.currentTime >= clip.end_seconds) {
        video.currentTime = clip.start_seconds;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video || !clip) return;
    
    const seekTime = clip.start_seconds + (value[0] / 100) * clipDuration;
    video.currentTime = seekTime;
    setCurrentTime(value[0] / 100 * clipDuration);
  };

  const skipBack = () => {
    const video = videoRef.current;
    if (!video || !clip) return;
    video.currentTime = Math.max(clip.start_seconds, video.currentTime - 5);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video || !clip) return;
    video.currentTime = Math.min(clip.end_seconds, video.currentTime + 5);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPreviewDimensions = () => {
    switch (selectedRatio) {
      case "9:16": return "w-[280px] h-[498px]";
      case "1:1": return "w-[360px] h-[360px]";
      case "16:9": return "w-[560px] h-[315px]";
      case "4:5": return "w-[320px] h-[400px]";
      default: return "w-[280px] h-[498px]";
    }
  };

  if (!clip) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <p className="text-muted-foreground">Select a clip to preview</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-muted/10 overflow-hidden">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative">
          {/* Aspect ratio preview container */}
          <div className={cn(
            "relative bg-black rounded-2xl overflow-hidden shadow-2xl",
            getPreviewDimensions()
          )}>
            <video
              ref={videoRef}
              src={sourceMedia.file_url}
              className="w-full h-full object-cover"
              muted={isMuted}
              playsInline
            />
            
            {/* Caption overlay preview */}
            {clip.suggested_caption && (
              <div className="absolute bottom-8 left-4 right-4">
                <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-white text-center text-sm font-medium">
                    {clip.suggested_caption}
                  </p>
                </div>
              </div>
            )}

            {/* Play button overlay */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/40"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </button>
            )}

            {/* Low-res preview badge */}
            <Badge className="absolute top-3 left-3 bg-black/60 text-white border-0 text-[10px]">
              LOW-RES PREVIEW
            </Badge>

            {/* Time indicator */}
            <div className="absolute top-3 right-3 bg-black/60 px-2 py-0.5 rounded text-xs text-white font-mono">
              {formatTime(currentTime)} / {formatTime(clipDuration)}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t bg-card/80 backdrop-blur-sm p-4 space-y-4">
        {/* Timeline */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={skipBack}>
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePlay}
            className="w-10 h-10"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          <Button variant="ghost" size="icon" onClick={skipForward}>
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <Slider 
              value={[clipDuration > 0 ? (currentTime / clipDuration) * 100 : 0]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          <span className="text-xs text-muted-foreground font-mono w-24 text-right">
            {formatTime(currentTime)} / {formatTime(clipDuration)}
          </span>

          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          <Button variant="ghost" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Aspect ratio selector */}
        <div className="flex items-center justify-center gap-2">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => setSelectedRatio(ratio.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                selectedRatio === ratio.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              <ratio.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{ratio.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
