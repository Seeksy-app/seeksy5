import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FileVideo, RefreshCw, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FastForwardVideoPlayerProps {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  youTubeEmbedUrl: string | null;
  isYouTube: boolean;
  isProcessing: boolean;
  currentStep: number;
  totalSteps: number;
  stepProgress: number;
  processingStatus: string;
  StepIcon: React.ComponentType<{ className?: string }>;
}

export function FastForwardVideoPlayer({
  videoUrl,
  thumbnailUrl,
  youTubeEmbedUrl,
  isYouTube,
  isProcessing,
  currentStep,
  totalSteps,
  stepProgress,
  processingStatus,
  StepIcon,
}: FastForwardVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(4);
  const [fakeProgress, setFakeProgress] = useState(0);

  // Start fast-forward playback when processing begins OR when video loads
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    // Configure playback
    video.playbackRate = isProcessing ? playbackSpeed : 1;
    video.muted = true;
    video.loop = true;
    
    // Always try to play the video
    const playVideo = () => {
      video.play().catch(err => {
        console.log('Auto-play prevented, will play on user interaction', err);
      });
    };
    
    // Try immediately
    playVideo();
    
    // Also try when metadata/data is loaded
    video.addEventListener('loadeddata', playVideo);
    video.addEventListener('canplay', playVideo);

    return () => {
      video.removeEventListener('loadeddata', playVideo);
      video.removeEventListener('canplay', playVideo);
    };
  }, [isProcessing, playbackSpeed, videoUrl]);

  // Sync fake progress bar with video playback and step progress
  useEffect(() => {
    if (!isProcessing) {
      setFakeProgress(0);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        // Calculate progress based on current time and overall step progress
        const videoProgress = (video.currentTime / video.duration) * 100;
        // Weight towards step progress more as steps complete
        const overallProgress = (currentStep / totalSteps) * 100 + (stepProgress / totalSteps);
        const blendedProgress = (videoProgress * 0.3 + overallProgress * 0.7);
        setFakeProgress(Math.min(100, blendedProgress));
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [isProcessing, currentStep, totalSteps, stepProgress]);

  // Jump scrubber when steps complete
  useEffect(() => {
    if (isProcessing && stepProgress === 0 && currentStep > 0) {
      // Step just completed, jump video forward
      const video = videoRef.current;
      if (video && video.duration) {
        const targetProgress = Math.min(0.95, (currentStep / totalSteps));
        video.currentTime = video.duration * targetProgress;
      }
    }
  }, [currentStep, stepProgress, isProcessing, totalSteps]);

  const handleVideoError = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => setVideoError(false), 2000);
    } else {
      setVideoError(true);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setVideoError(false);
  };

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {/* YouTube embed for YouTube videos */}
      {isYouTube && youTubeEmbedUrl && (
        <iframe
          src={youTubeEmbedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video preview"
        />
      )}
      
      {/* Fast-forward video element for non-YouTube sources */}
      {!isYouTube && videoUrl && !videoError && (
        <video 
          ref={videoRef}
          src={videoUrl} 
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            isProcessing && "scale-[1.02]"
          )}
          autoPlay={isProcessing}
          muted 
          loop 
          playsInline
          onError={handleVideoError}
        />
      )}
      
      {/* Fallback when no video */}
      {!isYouTube && (!videoUrl || videoError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt="Video thumbnail" 
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <>
              <FileVideo className="h-16 w-16 text-white/20 mb-2" />
              <p className="text-white/50 text-sm">
                {retryCount > 0 && retryCount < 3 ? 'Retrying preview...' : 'Preview not available'}
              </p>
            </>
          )}
          {retryCount >= 3 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-white/70"
              onClick={handleRetry}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          )}
        </div>
      )}
      
      {/* Processing overlay with fast-forward indicator */}
      {isProcessing && !isYouTube && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle scan line effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2C6BED]/5 to-transparent animate-scan opacity-50" />
          
          {/* Top gradient fade */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />
          
          {/* Bottom gradient with progress */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
          
          {/* Fast-forward speed indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            <Gauge className="h-3.5 w-3.5 text-[#2C6BED]" />
            <span className="text-xs font-bold text-white">{playbackSpeed}×</span>
          </div>
          
          {/* Center processing icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#2C6BED]/40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <StepIcon className="h-7 w-7 text-[#2C6BED] animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-[#2C6BED]/50 animate-ping" />
              
              {/* Rotating ring */}
              <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] animate-spin-slow" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  strokeDasharray="100 200"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2C6BED" stopOpacity="0" />
                    <stop offset="50%" stopColor="#2C6BED" stopOpacity="1" />
                    <stop offset="100%" stopColor="#2C6BED" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="mt-3 text-white font-medium drop-shadow-md">{processingStatus}</p>
            <p className="text-white/70 text-sm drop-shadow-md">Step {currentStep + 1} of {totalSteps}</p>
          </div>
          
          {/* Video scrubber bar at bottom */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#2C6BED] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${fakeProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-white/60">
              <span>AI Analyzing</span>
              <span>{Math.round(fakeProgress)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
