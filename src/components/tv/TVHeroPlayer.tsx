import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, 
  Info, Plus, ChevronLeft, ChevronRight 
} from "lucide-react";

interface FeaturedContent {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  video_url: string | null;
  category: string;
  channel_name: string;
  duration_seconds: number;
  is_live?: boolean;
}

interface TVHeroPlayerProps {
  featuredItems: FeaturedContent[];
  onPlay: (id: string) => void;
}

export function TVHeroPlayer({ featuredItems, onPlay }: TVHeroPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoRotateRef = useRef<NodeJS.Timeout>();

  const current = featuredItems[currentIndex];

  useEffect(() => {
    // Auto-rotate every 8 seconds if not playing
    if (!isPlaying && featuredItems.length > 1) {
      autoRotateRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
      }, 8000);
    }
    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [isPlaying, featuredItems.length]);

  const handlePlayToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
  };

  if (!current) return null;

  return (
    <section className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
      {/* Background Video/Image */}
      <div className="absolute inset-0">
        {current.video_url && isPlaying ? (
          <video
            ref={videoRef}
            src={current.video_url}
            className="w-full h-full object-cover"
            muted={isMuted}
            loop
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center transition-all duration-700"
            style={{ 
              backgroundImage: current.thumbnail_url 
                ? `url(${current.thumbnail_url})` 
                : 'linear-gradient(135deg, hsl(208 93% 24%), hsl(207 100% 50%))' 
            }}
          />
        )}
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a14]/95 via-[#0a0a14]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-[#0a0a14]/40" />
        
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      </div>

      {/* Navigation Arrows */}
      {featuredItems.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Content Info */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16 z-10 transition-all duration-500 ${
          showInfo ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="container mx-auto">
          <div className="max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {current.is_live && (
                <Badge className="bg-red-600 text-white px-3 py-1 animate-pulse">
                  <span className="mr-2">●</span> LIVE
                </Badge>
              )}
              <Badge variant="outline" className="border-amber-400/50 text-amber-400 bg-amber-400/10">
                {current.category}
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white/80 bg-white/5">
                {current.channel_name}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg leading-tight">
              {current.title}
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white/80 mb-8 line-clamp-3 drop-shadow-md max-w-xl">
              {current.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Button 
                size="lg" 
                className="bg-amber-500 hover:bg-amber-600 text-white gap-2 px-8 py-6 text-lg font-semibold shadow-lg shadow-amber-500/30"
                onClick={() => onPlay(current.id)}
              >
                <Play className="h-6 w-6 fill-current" />
                Watch Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/40 text-white bg-white/10 hover:bg-white/20 gap-2 px-6 py-6 backdrop-blur-sm"
              >
                <Plus className="h-5 w-5" />
                My List
              </Button>
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-white hover:bg-white/10 gap-2 px-6 py-6"
              >
                <Info className="h-5 w-5" />
                More Info
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
        {current.video_url && (
          <>
            <button
              onClick={handlePlayToggle}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </>
        )}
      </div>

      {/* Slide Indicators */}
      {featuredItems.length > 1 && (
        <div className="absolute bottom-8 right-8 md:right-16 z-20 flex items-center gap-2">
          {featuredItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? 'w-8 bg-amber-500' 
                  : 'w-4 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
