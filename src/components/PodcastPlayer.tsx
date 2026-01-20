import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, ChevronDown, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackAdImpression } from "@/lib/trackAdImpression";
import { toast } from "sonner";

interface Episode {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  publish_date: string;
  duration_seconds: number | null;
}

interface Podcast {
  id: string;
  title: string;
  cover_image_url: string | null;
}

interface PodcastPlayerProps {
  podcast: Podcast;
  episodes: Episode[];
  creatorId: string;
}

interface AdSlot {
  id: string;
  slot_type: string;
  position_seconds: number | null;
  manual_audio_url: string | null;
  assigned_campaign_id: string | null;
  status: string;
  cta_url: string | null;
  cta_text: string | null;
}

export const PodcastPlayer = ({ podcast, episodes, creatorId }: PodcastPlayerProps) => {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(episodes[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMoreEpisodes, setShowMoreEpisodes] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [playingAd, setPlayingAd] = useState(false);
  const [trackedAds, setTrackedAds] = useState<Set<string>>(new Set());
  const [adProgress, setAdProgress] = useState(0);
  const [adDuration, setAdDuration] = useState(0);
  const [playedMidrollPositions, setPlayedMidrollPositions] = useState<Set<number>>(new Set());
  const [currentAdType, setCurrentAdType] = useState<'pre' | 'mid' | 'post'>('pre');
  const [resumeTime, setResumeTime] = useState(0);
  const [currentAdSlot, setCurrentAdSlot] = useState<AdSlot | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const adAudioRef = useRef<HTMLAudioElement>(null);

  // Fetch ad slots for current episode
  const { data: adSlots } = useQuery({
    queryKey: ['ad-slots', currentEpisode?.id],
    queryFn: async () => {
      if (!currentEpisode) return [];
      
      const { data, error } = await supabase
        .from('ad_slots')
        .select('*')
        .eq('episode_id', currentEpisode.id)
        .eq('status', 'filled')
        .order('position_seconds', { ascending: true });
      
      if (error) throw error;
      return data as AdSlot[];
    },
    enabled: !!currentEpisode,
  });

  // Get ads by type
  const preRollAds = adSlots?.filter(slot => slot.slot_type === 'pre') || [];
  const midRollAds = adSlots?.filter(slot => slot.slot_type === 'mid') || [];
  const postRollAds = adSlots?.filter(slot => slot.slot_type === 'post') || [];
  
  // Track ad impression
  const trackImpression = async (adSlot: AdSlot) => {
    if (trackedAds.has(adSlot.id)) return; // Already tracked
    
    const result = await trackAdImpression({
      ad_slot_id: adSlot.id,
      campaign_id: adSlot.assigned_campaign_id || undefined,
      episode_id: currentEpisode!.id,
      podcast_id: podcast.id,
      creator_id: creatorId,
    });

    if (result.success && result.counted) {
      setTrackedAds(prev => new Set(prev).add(adSlot.id));
      console.log('Ad impression tracked:', adSlot.id);
    }
  };

  // Track CTA click
  const trackCtaClick = async (adSlot: AdSlot) => {
    try {
      await supabase.functions.invoke('track-ad-cta-click', {
        body: {
          ad_slot_id: adSlot.id,
          campaign_id: adSlot.assigned_campaign_id || undefined,
          episode_id: currentEpisode!.id,
          podcast_id: podcast.id,
          creator_id: creatorId,
        }
      });
      console.log('✅ CTA click tracked');
    } catch (error) {
      console.error('❌ Failed to track CTA click:', error);
    }
  };

  // Play ad
  const playAd = (adSlot: AdSlot, adType: 'pre' | 'mid' | 'post' = 'pre') => {
    if (!adAudioRef.current || !adSlot.manual_audio_url) {
      console.error('Cannot play ad - missing audio ref or URL', { 
        hasRef: !!adAudioRef.current, 
        url: adSlot.manual_audio_url 
      });
      toast.error('Ad file not found');
      return;
    }
    
    // Save current ad slot for CTA display
    setCurrentAdSlot(adSlot);
    
    // Save current playback position for mid-roll
    if (adType === 'mid' && audioRef.current) {
      setResumeTime(audioRef.current.currentTime);
    }
    
    // Pause episode audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    console.log(`🎵 Playing ${adType}-roll ad:`, adSlot.manual_audio_url);
    setPlayingAd(true);
    setIsPlaying(false);
    setCurrentAdType(adType);
    setAdProgress(0);
    setAdDuration(0);
    
    adAudioRef.current.src = adSlot.manual_audio_url;
    adAudioRef.current.load();
    
    // Try to play with error handling
    const playPromise = adAudioRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Ad playing successfully');
          toast.success(`Playing ${adType}-roll advertisement`);
          // Track impression when ad starts playing
          trackImpression(adSlot);
        })
        .catch(err => {
          console.error('❌ Failed to play ad:', err);
          toast.error(`Could not play advertisement: ${err.message}`);
          setPlayingAd(false);
          setCurrentAdSlot(null);
          // Skip to episode if ad fails
          if (audioRef.current) {
            if (adType === 'mid') {
              audioRef.current.currentTime = resumeTime;
            }
            audioRef.current.play().catch(() => {});
          }
        });
    }
  };

  // Handle ad ended
  const handleAdEnded = () => {
    console.log(`✅ ${currentAdType}-roll ad ended`);
    setPlayingAd(false);
    setCurrentAdSlot(null);
    
    if (currentAdType === 'pre') {
      // Move to next pre-roll ad or start episode
      if (preRollAds && currentAdIndex < preRollAds.length - 1) {
        setCurrentAdIndex(currentAdIndex + 1);
        playAd(preRollAds[currentAdIndex + 1], 'pre');
      } else {
        // All pre-roll ads played, start episode
        setCurrentAdIndex(0);
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } else if (currentAdType === 'mid') {
      // Resume episode from where it was paused
      if (audioRef.current) {
        audioRef.current.currentTime = resumeTime;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else if (currentAdType === 'post') {
      // Move to next post-roll ad or finish
      if (postRollAds && currentAdIndex < postRollAds.length - 1) {
        setCurrentAdIndex(currentAdIndex + 1);
        playAd(postRollAds[currentAdIndex + 1], 'post');
      } else {
        // All post-roll ads played
        setCurrentAdIndex(0);
        setIsPlaying(false);
        toast.success('Episode finished');
      }
    }
  };

  // Modified togglePlay to handle pre-roll ads
  const togglePlay = () => {
    if (!audioRef.current) return;

    // If playing ad, pause ad
    if (playingAd && adAudioRef.current) {
      adAudioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Check if we need to play pre-roll ads first (at start or restart)
      if (preRollAds.length > 0 && currentAdIndex === 0 && audioRef.current.currentTime === 0) {
        // Reset tracking for new playback session
        setTrackedAds(new Set());
        setPlayedMidrollPositions(new Set());
        playAd(preRollAds[0]);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const playEpisode = (episode: Episode) => {
    setCurrentEpisode(episode);
    setIsPlaying(false);
    setPlayingAd(false);
    setCurrentAdIndex(0);
    setTrackedAds(new Set());
    setPlayedMidrollPositions(new Set());
    setResumeTime(0);
    
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.load();
        // Will play pre-roll ads first if available
        togglePlay();
      }
    }, 100);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentEpisode) return null;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex gap-4 items-start mb-4">
          {podcast.cover_image_url && (
            <img
              src={podcast.cover_image_url}
              alt={podcast.title}
              className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{currentEpisode.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {currentEpisode.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {new Date(currentEpisode.publish_date).toLocaleDateString()}
              </Badge>
              {currentEpisode.duration_seconds && (
                <span className="text-xs text-muted-foreground">
                  {formatDuration(currentEpisode.duration_seconds)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>
          <div className="flex-1 relative">
            <audio
              ref={audioRef}
              src={currentEpisode.audio_url}
              onEnded={() => {
                console.log('📻 Episode ended, checking for post-roll ads');
                setIsPlaying(false);
                // Play post-roll ads if available
                if (postRollAds && postRollAds.length > 0) {
                  setCurrentAdIndex(0);
                  playAd(postRollAds[0], 'post');
                }
              }}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onTimeUpdate={() => {
                if (!audioRef.current || playingAd) return;
                
                const currentTime = audioRef.current.currentTime;
                
                // Check for mid-roll ads
                for (const adSlot of midRollAds) {
                  const adPosition = adSlot.position_seconds || 0;
                  // Trigger ad if we're within 0.5 seconds of the position and haven't played it yet
                  if (
                    Math.abs(currentTime - adPosition) < 0.5 && 
                    !playedMidrollPositions.has(adPosition)
                  ) {
                    console.log(`🎯 Triggering mid-roll ad at ${adPosition}s`);
                    setPlayedMidrollPositions(prev => new Set(prev).add(adPosition));
                    playAd(adSlot, 'mid');
                    break;
                  }
                }
              }}
              className="w-full"
              controls
            />
            {/* Mid-roll ad markers */}
            {midRollAds.length > 0 && currentEpisode.duration_seconds && (
              <div className="absolute -bottom-1 left-0 right-0 h-1 pointer-events-none">
                {midRollAds.map((adSlot, index) => {
                  const position = ((adSlot.position_seconds || 0) / currentEpisode.duration_seconds!) * 100;
                  return (
                    <div
                      key={adSlot.id}
                      className="absolute top-0 w-1 h-3 bg-accent rounded-full shadow-sm"
                      style={{ left: `${position}%` }}
                      title={`Ad break at ${Math.floor((adSlot.position_seconds || 0) / 60)}:${String((adSlot.position_seconds || 0) % 60).padStart(2, '0')}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
          {/* Hidden audio element for ads */}
          <audio
            ref={adAudioRef}
            onEnded={handleAdEnded}
            onPlay={() => {
              console.log('🎵 Ad onPlay event');
              setIsPlaying(true);
            }}
            onLoadedMetadata={() => {
              if (adAudioRef.current) {
                setAdDuration(adAudioRef.current.duration);
                console.log('📊 Ad duration:', adAudioRef.current.duration);
              }
            }}
            onTimeUpdate={() => {
              if (adAudioRef.current) {
                setAdProgress(adAudioRef.current.currentTime);
              }
            }}
            onError={(e) => {
              console.error('❌ Ad audio error:', e);
              toast.error('Failed to load advertisement');
            }}
            className="hidden"
          />
        </div>

        {playingAd && currentAdSlot && (
          <div className="mt-4 p-4 bg-muted rounded-lg border-2 border-primary/20 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">
                Playing {currentAdType}-roll advertisement 
                {currentAdType === 'pre' && ` (${currentAdIndex + 1}/${preRollAds.length})`}
                {currentAdType === 'post' && ` (${currentAdIndex + 1}/${postRollAds.length})`}
              </p>
              <p className="text-xs text-muted-foreground">
                {adDuration > 0 ? `${Math.ceil(adDuration - adProgress)}s remaining` : 'Loading...'}
              </p>
            </div>
            {adDuration > 0 && (
              <div className="w-full bg-muted-foreground/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-100"
                  style={{ width: `${(adProgress / adDuration) * 100}%` }}
                />
              </div>
            )}
            {currentAdSlot.cta_url && (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => {
                  trackCtaClick(currentAdSlot);
                  window.open(currentAdSlot.cta_url!, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {currentAdSlot.cta_text || 'Learn More'}
              </Button>
            )}
          </div>
        )}
      </Card>

      {episodes.length > 1 && (
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => setShowMoreEpisodes(!showMoreEpisodes)}
            className="w-full"
          >
            <span className="flex-1">
              {showMoreEpisodes ? "Hide" : "Show"} More Episodes ({episodes.length - 1})
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showMoreEpisodes ? "rotate-180" : ""}`}
            />
          </Button>

          {showMoreEpisodes && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {episodes
                .filter((ep) => ep.id !== currentEpisode.id)
                .map((episode) => (
                  <Card
                    key={episode.id}
                    className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => playEpisode(episode)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm truncate">{episode.title}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(episode.publish_date).toLocaleDateString()}
                          </span>
                          {episode.duration_seconds && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(episode.duration_seconds)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
