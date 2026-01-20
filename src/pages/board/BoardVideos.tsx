import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Lock, Check, Play, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useVideoProgress, useAllVideoProgress } from '@/hooks/useVideoProgress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BoardPageHeader } from '@/components/board/BoardPageHeader';

// Video Player component with loading state
function VideoPlayer({ videoRef, video }: { videoRef: React.RefObject<HTMLVideoElement>; video: DemoVideo }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading video...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        key={video.id}
        src={video.video_url}
        controls
        className="w-full h-full"
        poster={video.thumbnail_url || undefined}
        onLoadedData={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
      />
    </div>
  );
}

interface DemoVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  category: string;
}

// Empty placeholder - will use DB videos
const placeholderVideos: DemoVideo[] = [];

const categoryColors: Record<string, string> = {
  Overview: 'bg-blue-100 text-blue-700',
  Product: 'bg-purple-100 text-purple-700',
  Financials: 'bg-emerald-100 text-emerald-700',
  GTM: 'bg-amber-100 text-amber-700',
};

export default function BoardVideos() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const { allProgress, isVideoUnlocked } = useAllVideoProgress();

  // Fetch board-specific videos
  const { data: dbVideos, isLoading } = useQuery({
    queryKey: ['boardVideos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .order('order_index');

      if (error) throw error;
      return data as DemoVideo[];
    },
  });

  // Use database videos if available, otherwise use placeholders
  const videos = dbVideos && dbVideos.length > 0 ? dbVideos : placeholderVideos;
  const hasRealVideos = dbVideos && dbVideos.length > 0;

  // Video progress for selected video
  const {
    progress,
    updateProgress,
    isUnlocked,
    UNLOCK_THRESHOLD_SECONDS,
  } = useVideoProgress(selectedVideo?.id || '');

  // Set first video as selected
  useEffect(() => {
    if (videos && videos.length > 0 && !selectedVideo) {
      setSelectedVideo(videos[0]);
    }
  }, [videos, selectedVideo]);

  // Track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedVideo) return;

    const handleTimeUpdate = () => {
      const time = Math.floor(video.currentTime);
      setCurrentTime(time);
      
      // Update progress every 5 seconds
      if (time > 0 && time % 5 === 0) {
        updateProgress(time);
      }
    };

    const handleEnded = () => {
      if (selectedVideo) {
        updateProgress(video.duration);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [selectedVideo, updateProgress]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSelect = (video: DemoVideo, index: number) => {
    // For placeholder videos without URLs, just select them
    if (!video.video_url) {
      setSelectedVideo(video);
      setCurrentTime(0);
      return;
    }

    // Check if previous video is unlocked (watched 30+ seconds)
    if (index > 0 && hasRealVideos) {
      const prevVideo = videos?.[index - 1];
      if (prevVideo) {
        const prevProgress = allProgress?.find(p => p.video_id === prevVideo.id);
        if (!prevProgress || prevProgress.seconds_watched < UNLOCK_THRESHOLD_SECONDS) {
          return; // Don't allow selection
        }
      }
    }
    setSelectedVideo(video);
    setCurrentTime(0);
  };

  const getVideoStatus = (videoId: string, index: number) => {
    if (index === 0) return 'unlocked';
    if (!hasRealVideos) return 'unlocked'; // All placeholders unlocked
    
    // Check if previous video has been watched for 30+ seconds
    const prevVideo = videos?.[index - 1];
    if (prevVideo) {
      const prevProgress = allProgress?.find(p => p.video_id === prevVideo.id);
      if (prevProgress && prevProgress.seconds_watched >= UNLOCK_THRESHOLD_SECONDS) {
        return 'unlocked';
      }
    }
    return 'locked';
  };

  return (
    <div className="w-full space-y-6">
        {/* Sticky Header */}
        <BoardPageHeader
          icon={<Video className="w-5 h-5 text-white" />}
          title="Platform Videos"
          subtitle="Product demos & presentations"
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <div className="aspect-video bg-slate-900 relative">
                {selectedVideo?.video_url ? (
                  <VideoPlayer
                    videoRef={videoRef}
                    video={selectedVideo}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Play className="w-16 h-16 mb-4" />
                    <p className="text-sm">No video available yet</p>
                    {selectedVideo && (
                      <p className="text-xs mt-1 text-slate-300">
                        {selectedVideo.title}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {selectedVideo?.title || 'Select a video'}
                  </h3>
                  {selectedVideo?.category && (
                    <Badge className={cn('text-xs', categoryColors[selectedVideo.category] || 'bg-slate-100 text-slate-600')}>
                      {selectedVideo.category}
                    </Badge>
                  )}
                </div>
                <p className="text-slate-500">
                  {selectedVideo?.description || 'Choose a video from the playlist to begin.'}
                </p>
                
                {/* Progress indicator - only show for real videos */}
                {selectedVideo?.video_url && hasRealVideos && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                      <span>Watch progress</span>
                      <span>{currentTime >= UNLOCK_THRESHOLD_SECONDS ? 'Next video unlocked!' : `${UNLOCK_THRESHOLD_SECONDS - currentTime}s to unlock next`}</span>
                    </div>
                    <Progress 
                      value={Math.min((currentTime / UNLOCK_THRESHOLD_SECONDS) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Playlist */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Playlist</h3>
            <div className="space-y-3">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <Card key={i} className="bg-white border-slate-200 animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                videos?.map((video, index) => {
                  const status = getVideoStatus(video.id, index);
                  const isSelected = selectedVideo?.id === video.id;
                  const videoProgress = allProgress?.find(p => p.video_id === video.id);
                  const isCompleted = hasRealVideos && videoProgress && videoProgress.seconds_watched >= UNLOCK_THRESHOLD_SECONDS;
                  const isPlaceholder = !video.video_url;

                    return (
                      <Card
                        key={video.id}
                        className={cn(
                          'border transition-all cursor-pointer overflow-hidden',
                          isSelected
                            ? 'bg-blue-50 border-blue-300 shadow-sm'
                            : status === 'locked'
                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        )}
                        onClick={() => handleVideoSelect(video, index)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Thumbnail */}
                            <div className="relative w-24 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900">
                              {video.thumbnail_url ? (
                                <img 
                                  src={video.thumbnail_url} 
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="w-6 h-6 text-white/70" />
                              </div>
                              {/* Play overlay */}
                              <div className={cn(
                                'absolute inset-0 flex items-center justify-center',
                                isCompleted ? 'bg-emerald-500/20' : status === 'locked' ? 'bg-slate-900/50' : 'bg-black/20'
                              )}>
                                {isCompleted ? (
                                  <Check className="w-5 h-5 text-white" />
                                ) : status === 'locked' ? (
                                  <Lock className="w-5 h-5 text-white" />
                                ) : isSelected ? (
                                  <Play className="w-5 h-5 text-white" />
                                ) : null}
                              </div>
                              {/* Duration badge */}
                              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                                {formatDuration(video.duration_seconds)}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={cn(
                                'font-medium text-sm leading-tight line-clamp-2',
                                isSelected ? 'text-blue-700' : 'text-slate-900'
                              )}>
                                {video.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge className={cn('text-[10px] px-1.5 py-0', categoryColors[video.category] || 'bg-slate-100 text-slate-600')}>
                                  {video.category}
                                </Badge>
                              </div>
                              {videoProgress && hasRealVideos && (
                                <span className="text-xs text-slate-400 mt-1 block">
                                  {formatDuration(videoProgress.seconds_watched)} watched
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                })
              )}
            </div>

            {/* Empty state message */}
            {!hasRealVideos && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  No investor videos are available yet.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Once videos are published, they'll appear here in the playlist.
                </p>
                <p className="text-xs text-slate-500 mt-2 italic">
                  Admin can manage videos from the internal tools.
                </p>
              </div>
            )}

            {hasRealVideos && (
              <p className="text-xs text-slate-400 mt-4 text-center">
                Watch at least 30 seconds to unlock the next video
              </p>
            )}
          </div>
        </div>
    </div>
  );
}
