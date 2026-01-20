import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Volume2, VolumeX, Maximize, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IVSPlayerProps {
  playbackUrl: string;
  channelName?: string;
  viewerCount?: number;
  isLive?: boolean;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
}

export function IVSPlayer({
  playbackUrl,
  channelName,
  viewerCount = 0,
  isLive = false,
  className,
  autoPlay = true,
  muted = false,
}: IVSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;

    // Load IVS player script dynamically
    const loadIvsPlayer = async () => {
      try {
        // For HLS streams, we can use native HLS.js or the video element
        if (playbackUrl.includes('.m3u8')) {
          // Check if native HLS is supported (Safari)
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = playbackUrl;
          } else {
            // Use HLS.js for other browsers
            const Hls = (await import('hls.js')).default;
            if (Hls.isSupported()) {
              const hls = new Hls({
                lowLatencyMode: true,
                enableWorker: true,
              });
              hls.loadSource(playbackUrl);
              hls.attachMedia(video);
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoPlay) video.play().catch(() => {});
              });
              hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                  setError('Stream unavailable');
                  setIsLoading(false);
                }
              });
            }
          }
        } else {
          video.src = playbackUrl;
        }

        video.muted = isMuted;
        if (autoPlay) {
          video.play().catch(() => setIsMuted(true));
        }
      } catch (err) {
        console.error('Error loading player:', err);
        setError('Failed to load stream');
      }
    };

    loadIvsPlayer();
  }, [playbackUrl, autoPlay, isMuted]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-lg overflow-hidden group',
        className
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        onLoadedData={() => setIsLoading(false)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setError('Stream unavailable');
          setIsLoading(false);
        }}
      />

      {/* Loading state */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <p className="text-white/70">{error}</p>
        </div>
      )}

      {/* Overlay controls */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            )}
            {channelName && (
              <span className="text-white font-medium text-sm">{channelName}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Users className="h-4 w-4" />
            <span className="text-sm">{viewerCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleMuteToggle}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleFullscreen}
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
