import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, Pause, Volume2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface MusicTrack {
  music_asset_id: string;
  name: string;
  duration_seconds: number;
  genres: string[];
}

export function StudioMusicPanel() {
  const { toast } = useToast();
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [trackVolumes, setTrackVolumes] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMusicTracks();
  }, []);

  const fetchMusicTracks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-get-music', {
        body: { page_size: 30 }
      });

      if (error) {
        console.error('Music fetch error:', error);
        throw error;
      }
      
      if (data?.music) {
        setMusicTracks(data.music);
        // Initialize volumes
        const volumes: Record<string, number> = {};
        data.music.forEach((track: MusicTrack) => {
          volumes[track.music_asset_id] = 50;
        });
        setTrackVolumes(volumes);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error fetching music:', error);
      toast({
        title: "Music Library",
        description: error.message || "Failed to load music library. Please try again.",
        variant: "destructive",
      });
      // Set empty array to prevent repeated errors
      setMusicTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackPlayPause = (trackId: string) => {
    setPlayingTrack(prev => prev === trackId ? null : trackId);
    
    toast({
      title: playingTrack === trackId ? "Paused" : "Playing",
      description: "Track playback toggled",
      duration: 1500,
    });
  };

  const handleVolumeChange = (trackId: string, volume: number) => {
    setTrackVolumes(prev => ({ ...prev, [trackId]: volume }));
  };

  const filteredTracks = musicTracks.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Music Library</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Browse and play music from ElevenLabs Music Directory
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search by name or genre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={fetchMusicTracks}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isLoading && musicTracks.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {filteredTracks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tracks found
            </p>
          ) : (
            filteredTracks.map((track) => (
              <Card key={track.music_asset_id} className="border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3 mb-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0 shrink-0"
                      onClick={() => handleTrackPlayPause(track.music_asset_id)}
                    >
                      {playingTrack === track.music_asset_id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {track.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(track.duration_seconds)}s
                      </p>
                      {track.genres && track.genres.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {track.genres.slice(0, 2).map((genre, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Slider
                      value={[trackVolumes[track.music_asset_id] || 50]}
                      onValueChange={(value) => handleVolumeChange(track.music_asset_id, value[0])}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                      {trackVolumes[track.music_asset_id] || 50}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
