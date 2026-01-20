import { useState, useRef, useEffect, useMemo } from "react";
import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Pause, SkipBack, SkipForward, Maximize2, Volume2, VolumeX,
  Smartphone, Monitor, Square, RectangleHorizontal, Scissors, AlertCircle, Youtube,
  Plus, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ClipVideoPreviewProps {
  clip: ClipData | null;
  sourceMedia: SourceMedia;
  onAddToQueue?: (clipId: string, clipTitle: string, format: string, thumbnailUrl?: string) => void;
  isInQueue?: (clipId: string, format: string) => boolean;
}

// Interface for transcript word timing
interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

const aspectRatios = [
  { id: "9:16", label: "9:16", icon: Smartphone, platforms: "TikTok, Reels, Shorts" },
  { id: "1:1", label: "1:1", icon: Square, platforms: "Instagram Feed" },
  { id: "16:9", label: "16:9", icon: Monitor, platforms: "YouTube, Website" },
  { id: "4:5", label: "4:5", icon: RectangleHorizontal, platforms: "Instagram Portrait" },
];

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extract words with timing from transcript
function getTranscriptWords(sourceMedia: SourceMedia, clip: ClipData): TranscriptWord[] {
  const transcript = sourceMedia.edit_transcript;
  if (!transcript?.words || !Array.isArray(transcript.words)) return [];
  
  // Filter words that fall within the clip's time range
  return transcript.words.filter((word: TranscriptWord) => 
    word.start >= clip.start_seconds && word.end <= clip.end_seconds
  );
}

// Get current caption text based on video time
function getCurrentCaption(words: TranscriptWord[], currentTime: number, clipStartTime: number): string {
  if (words.length === 0) return "";
  
  const absoluteTime = clipStartTime + currentTime;
  
  // Find words within a 2-second window around current time for subtitle display
  const windowStart = absoluteTime - 0.5;
  const windowEnd = absoluteTime + 1.5;
  
  const visibleWords = words.filter(word => 
    word.start >= windowStart && word.start <= windowEnd
  );
  
  if (visibleWords.length === 0) return "";
  
  // Highlight the current word
  return visibleWords.map(word => {
    const isCurrentWord = absoluteTime >= word.start && absoluteTime <= word.end;
    return isCurrentWord ? word.word.toUpperCase() : word.word;
  }).join(" ");
}

export function ClipVideoPreview({ clip, sourceMedia, onAddToQueue, isInQueue }: ClipVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState("9:16");
  const [showTrimHandles, setShowTrimHandles] = useState(false);
  const [currentCaption, setCurrentCaption] = useState("");

  const clipDuration = clip ? (clip.end_seconds - clip.start_seconds) : 0;

  // Get transcript words for this clip
  const transcriptWords = useMemo(() => {
    if (!clip) return [];
    return getTranscriptWords(sourceMedia, clip);
  }, [sourceMedia, clip]);

  const isYouTubeSource = sourceMedia.source === 'youtube' || 
    (sourceMedia.file_url && sourceMedia.file_url.includes('youtube.com'));
  const youtubeVideoId = useMemo(() => 
    isYouTubeSource ? getYouTubeVideoId(sourceMedia.file_url) : null,
    [sourceMedia.file_url, isYouTubeSource]
  );
  
  const hasPlayableVideo = !!sourceMedia.cloudflare_download_url || 
    (sourceMedia.file_url && !isYouTubeSource);

  useEffect(() => {
    if (videoRef.current && clip && hasPlayableVideo) {
      videoRef.current.currentTime = clip.start_seconds;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [clip?.id, hasPlayableVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clip || !hasPlayableVideo) return;

    const handleTimeUpdate = () => {
      const relativeTime = video.currentTime - clip.start_seconds;
      setCurrentTime(Math.max(0, Math.min(relativeTime, clipDuration)));
      
      // Update caption based on current position in transcript
      if (transcriptWords.length > 0) {
        const caption = getCurrentCaption(transcriptWords, relativeTime, clip.start_seconds);
        setCurrentCaption(caption);
      }
      
      if (video.currentTime >= clip.end_seconds) {
        video.currentTime = clip.start_seconds;
        if (!isPlaying) {
          video.pause();
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [clip, clipDuration, isPlaying, hasPlayableVideo, transcriptWords]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !clip) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.currentTime < clip.start_seconds || video.currentTime >= clip.end_seconds) {
        video.currentTime = clip.start_seconds;
      }
      video.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

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

  // Larger dimensions for better preview, optimized to fit viewport
  const getPreviewDimensions = () => {
    switch (selectedRatio) {
      case "9:16": return { width: 320, height: 568 };
      case "1:1": return { width: 400, height: 400 };
      case "16:9": return { width: 560, height: 315 };
      case "4:5": return { width: 360, height: 450 };
      default: return { width: 320, height: 568 };
    }
  };

  // No clip selected - show black placeholder
  if (!clip) {
    return (
      <div className="flex-1 flex flex-col bg-muted/5">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div 
              className="bg-black rounded-xl mx-auto flex items-center justify-center mb-4"
              style={{ width: 240, height: 426 }}
            >
              <div className="text-center">
                <Scissors className="h-12 w-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/50 font-medium">Select a clip to preview</p>
                <p className="text-white/30 text-sm mt-1">Choose from the clips on the left</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dimensions = getPreviewDimensions();

  return (
    <div className="flex-1 flex flex-col bg-muted/5 overflow-hidden min-h-0">
      {/* Video Preview - Fixed area, no scroll */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0">
        <motion.div 
          className="relative"
          layout
          transition={{ duration: 0.3 }}
        >
          <div 
            className="relative bg-black overflow-hidden rounded-xl shadow-2xl"
            style={{ width: dimensions.width, height: dimensions.height }}
          >
            {isYouTubeSource && youtubeVideoId ? (
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?start=${clip.start_seconds}&end=${clip.end_seconds}&autoplay=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
                    <Youtube className="h-3 w-3 text-red-500" />
                    <span>YouTube • {formatTime(clip.start_seconds)} - {formatTime(clip.end_seconds)}</span>
                  </div>
                  {clip.suggested_caption && (
                    <p className="text-white text-xs font-medium line-clamp-2">{clip.suggested_caption}</p>
                  )}
                </div>
              </div>
            ) : hasPlayableVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={sourceMedia.cloudflare_download_url || sourceMedia.file_url}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  playsInline
                  onClick={togglePlay}
                  poster={sourceMedia.thumbnail_url}
                />
                
                {/* Dynamic caption overlay - shows transcript text like Opus Clips */}
                {(currentCaption || clip.transcript_snippet) && (
                  <div className="absolute bottom-12 left-3 right-3">
                    <div className="bg-black/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10">
                      <p className="text-white text-center text-sm font-bold leading-relaxed tracking-wide uppercase">
                        {currentCaption || clip.transcript_snippet?.split(' ').slice(0, 8).join(' ')}
                      </p>
                    </div>
                  </div>
                )}

                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-0.5" fill="white" />
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                <AlertCircle className="h-12 w-12 text-yellow-500 mb-3" />
                <p className="text-white font-medium mb-1">Video not playable</p>
                <p className="text-white/60 text-sm">Download required for rendering.</p>
              </div>
            )}

            {hasPlayableVideo && clip.scenes && clip.scenes.length > 0 && (
              <div className="absolute top-3 right-3 space-y-1">
                {clip.scenes.slice(0, 2).map((scene, i) => (
                  <Badge 
                    key={i}
                    className={cn(
                      "text-xs px-2 py-0.5",
                      scene.type === 'hook' && "bg-yellow-500/80 text-black",
                      scene.type === 'key_point' && "bg-blue-500/80 text-white",
                      scene.type === 'cta' && "bg-green-500/80 text-white"
                    )}
                  >
                    {scene.type === 'hook' ? '⚡' : scene.type === 'key_point' ? '💡' : scene.type === 'cta' ? '🎯' : scene.type}
                  </Badge>
                ))}
              </div>
            )}

            <Badge className="absolute top-3 left-3 bg-black/60 text-white border-0 text-xs px-2 py-0.5">
              PREVIEW
            </Badge>

            {!isYouTubeSource && hasPlayableVideo && (
              <div className="absolute top-10 left-3 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono">
                {formatTime(currentTime)} / {formatTime(clipDuration)}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Controls - Fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-card/90 backdrop-blur-sm p-3 space-y-2">
        {/* Playback controls */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={skipBack} className="h-9 w-9">
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-[#F5C242] hover:bg-[#F5C242]/90 text-black"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" fill="currentColor" />}
          </Button>
          
          <Button variant="ghost" size="icon" onClick={skipForward} className="h-9 w-9">
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="flex-1 px-2">
            <Slider 
              value={[clipDuration > 0 ? (currentTime / clipDuration) * 100 : 0]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(clipDuration)}
          </span>

          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="h-8 w-8">
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setShowTrimHandles(!showTrimHandles)} className={cn("h-8 w-8", showTrimHandles && "bg-muted")}>
            <Scissors className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Aspect ratio selector with Add to Queue */}
        <div className="flex items-center justify-center gap-2">
          {aspectRatios.map((ratio) => {
            const inQueue = clip && isInQueue?.(clip.id, ratio.id);
            return (
              <button
                key={ratio.id}
                onClick={() => setSelectedRatio(ratio.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm",
                  selectedRatio === ratio.id
                    ? "bg-[#053877] text-white shadow-lg"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground",
                  inQueue && "ring-2 ring-green-500"
                )}
              >
                <ratio.icon className="h-4 w-4" />
                <span className="font-medium">{ratio.label}</span>
                {inQueue && <Check className="h-3 w-3 text-green-400" />}
              </button>
            );
          })}
          
          {/* Add to Queue button */}
          {clip && onAddToQueue && (
            <Button
              size="sm"
              className={cn(
                "ml-2",
                isInQueue?.(clip.id, selectedRatio)
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-[#F5C242] hover:bg-[#F5C242]/90 text-black"
              )}
              onClick={() => onAddToQueue(
                clip.id, 
                clip.title || "Untitled Clip", 
                selectedRatio,
                clip.thumbnail_url || sourceMedia.thumbnail_url || undefined
              )}
            >
              {isInQueue?.(clip.id, selectedRatio) ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Queue
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
