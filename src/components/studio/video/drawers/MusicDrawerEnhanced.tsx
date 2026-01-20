import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  X, Upload, ChevronDown, ChevronRight, 
  Play, Pause, Music2, Info, Volume2, VolumeX,
  Loader2, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicDrawerEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack?: (trackUrl: string | null) => void;
}

interface Track {
  id: string;
  name: string;
  genre?: string;
  duration?: number;
  url?: string;
  isAI?: boolean;
}

const defaultAIGenres = [
  { id: "chill", name: "Chill", genre: "Chill" },
  { id: "downtempo", name: "Downtempo", genre: "Downtempo" },
  { id: "chillhop", name: "Chill Hop", genre: "Chill Hop" },
  { id: "hiphop", name: "Hip hop", genre: "Hip hop" },
  { id: "lofi", name: "Lo-Fi", genre: "Lo-Fi" },
  { id: "lounge", name: "Lounge", genre: "Lounge" },
  { id: "rnb", name: "R&B", genre: "R&B" },
  { id: "minimal", name: "Minimal House", genre: "Minimal House" },
];

export function MusicDrawerEnhanced({ isOpen, onClose, onPlayTrack }: MusicDrawerEnhancedProps) {
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<string[]>(["custom", "ai"]);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState([50]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [customTracks, setCustomTracks] = useState<Track[]>([]);
  const [aiTracks, setAiTracks] = useState<Track[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume[0] / 100;
    }
  }, [volume, isMuted]);

  // Fetch AI tracks on mount
  useEffect(() => {
    if (isOpen) {
      fetchAITracks();
    }
  }, [isOpen]);

  const fetchAITracks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-get-music");
      
      if (error) throw error;
      
      if (data?.music) {
        setAiTracks(data.music.map((track: any, index: number) => ({
          id: `ai-${index}`,
          name: track.name || track.genre,
          genre: track.genre,
          isAI: true,
        })));
      } else {
        // Use default genres as fallback
        setAiTracks(defaultAIGenres.map(g => ({ ...g, isAI: true })));
      }
    } catch (error) {
      console.error("Error fetching AI tracks:", error);
      // Use default genres as fallback
      setAiTracks(defaultAIGenres.map(g => ({ ...g, isAI: true })));
    } finally {
      setIsLoading(false);
    }
  };

  const generateAITrack = async (genre: string, trackId: string) => {
    setIsGenerating(trackId);
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-generate-music", {
        body: {
          prompt: `${genre} background music, professional podcast`,
          durationSeconds: 30,
        },
      });

      if (error) throw error;

      if (data?.audioUrl) {
        // Update track with generated URL
        setAiTracks(tracks => 
          tracks.map(t => 
            t.id === trackId ? { ...t, url: data.audioUrl } : t
          )
        );
        
        toast({
          title: "Track generated!",
          description: `${genre} music is ready to play`,
        });

        // Auto-play the generated track
        playTrack(trackId, data.audioUrl);
      }
    } catch (error) {
      console.error("Error generating track:", error);
      toast({
        title: "Generation failed",
        description: "Could not generate music track",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const playTrack = (trackId: string, url?: string) => {
    if (!audioRef.current) return;

    if (playingTrack === trackId) {
      // Fade out and stop
      fadeOut(() => {
        setPlayingTrack(null);
        onPlayTrack?.(null);
      });
    } else {
      if (url) {
        audioRef.current.src = url;
        audioRef.current.volume = 0;
        audioRef.current.play();
        fadeIn();
        setPlayingTrack(trackId);
        onPlayTrack?.(url);
      } else {
        // Need to generate first
        const track = aiTracks.find(t => t.id === trackId);
        if (track?.genre) {
          generateAITrack(track.genre, trackId);
        }
      }
    }
  };

  const fadeIn = () => {
    if (!audioRef.current) return;
    const targetVolume = isMuted ? 0 : volume[0] / 100;
    let currentVol = 0;
    const fadeInterval = setInterval(() => {
      currentVol += 0.05;
      if (currentVol >= targetVolume) {
        if (audioRef.current) audioRef.current.volume = targetVolume;
        clearInterval(fadeInterval);
      } else {
        if (audioRef.current) audioRef.current.volume = currentVol;
      }
    }, 50);
  };

  const fadeOut = (callback?: () => void) => {
    if (!audioRef.current) return;
    let currentVol = audioRef.current.volume;
    const fadeInterval = setInterval(() => {
      currentVol -= 0.05;
      if (currentVol <= 0) {
        if (audioRef.current) {
          audioRef.current.volume = 0;
          audioRef.current.pause();
        }
        clearInterval(fadeInterval);
        callback?.();
      } else {
        if (audioRef.current) audioRef.current.volume = currentVol;
      }
    }, 50);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("audio")) {
      toast({
        title: "Invalid file",
        description: "Please upload an audio file",
        variant: "destructive",
      });
      return;
    }

    const newTrack: Track = {
      id: `custom-${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file),
      isAI: false,
    };

    setCustomTracks([...customTracks, newTrack]);
    toast({
      title: "Track added",
      description: newTrack.name,
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-16 bottom-0 w-[400px] bg-[#1a1d21] border-l border-white/10 flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Background Music</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Volume Control */}
          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/60 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-white/60 text-sm w-10">{volume[0]}%</span>
          </div>

          {/* Custom Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => toggleSection("custom")}
                className="flex items-center gap-2"
              >
                {expandedSections.includes("custom") ? (
                  <ChevronDown className="w-4 h-4 text-white/60" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/60" />
                )}
                <span className="text-white font-medium">My Tracks</span>
                <Info className="w-3.5 h-3.5 text-white/40" />
              </button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-400 hover:text-blue-300 gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {expandedSections.includes("custom") && (
              customTracks.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-center">
                  <Music2 className="w-8 h-8 text-white/30 mb-2" />
                  <p className="text-white font-medium">Get your music heard</p>
                  <p className="text-white/50 text-sm">Upload and play your music on the stream</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {customTracks.map(track => (
                    <button
                      key={track.id}
                      onClick={() => playTrack(track.id, track.url)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all flex items-center gap-3",
                        playingTrack === track.id
                          ? "bg-blue-500/20 border border-blue-500/50"
                          : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      {playingTrack === track.id ? (
                        <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center shrink-0">
                          <Pause className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="text-white truncate">{track.name}</span>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {/* AI Generated Section */}
          <div>
            <button
              onClick={() => toggleSection("ai")}
              className="flex items-center gap-2 w-full text-left mb-3"
            >
              {expandedSections.includes("ai") ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/60" />
              )}
              <span className="text-white font-medium">AI Generated</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </button>
            
            {expandedSections.includes("ai") && (
              isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                </div>
              ) : (
                <div className="space-y-1">
                  {aiTracks.map(track => (
                    <button
                      key={track.id}
                      onClick={() => playTrack(track.id, track.url)}
                      disabled={isGenerating === track.id}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-all flex items-center gap-3",
                        playingTrack === track.id
                          ? "bg-blue-500/20 border border-blue-500/50"
                          : "bg-white/5 hover:bg-white/10",
                        isGenerating === track.id && "opacity-50"
                      )}
                    >
                      {isGenerating === track.id ? (
                        <div className="w-8 h-8 rounded bg-purple-500/50 flex items-center justify-center shrink-0">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                      ) : playingTrack === track.id ? (
                        <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center shrink-0">
                          <Pause className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-white block truncate">{track.name}</span>
                        {!track.url && (
                          <span className="text-xs text-purple-400">Click to generate</span>
                        )}
                      </div>
                      {track.url && (
                        <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
