import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { 
  X, Upload, ChevronDown, ChevronRight, 
  Play, Pause, Music2, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const aiGenres = [
  { id: "chill", name: "Chill", icon: "🌊" },
  { id: "downtempo", name: "Downtempo", icon: "▶️" },
  { id: "chillhop", name: "Chill Hop", icon: "▶️" },
  { id: "hiphop", name: "Hip hop", icon: "🎵" },
  { id: "lofi", name: "Lo-Fi", icon: "▶️" },
  { id: "lounge", name: "Lounge", icon: "🎵" },
  { id: "rnb", name: "R&B", icon: "🎵" },
  { id: "minimal", name: "Minimal House", icon: "🎵" },
];

export function MusicDrawer({ isOpen, onClose }: MusicDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["custom", "ai"]);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState([50]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const togglePlay = (trackId: string) => {
    setPlayingTrack(playingTrack === trackId ? null : trackId);
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
            <Music2 className="w-5 h-5 text-white/60" />
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-white/60 text-sm w-8">{volume[0]}%</span>
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
                <span className="text-white font-medium">Custom</span>
                <Info className="w-3.5 h-3.5 text-white/40" />
              </button>
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 gap-1">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
            
            {expandedSections.includes("custom") && (
              <div className="p-8 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center text-center">
                <Music2 className="w-8 h-8 text-white/30 mb-2" />
                <p className="text-white font-medium">Get your music heard</p>
                <p className="text-white/50 text-sm">Upload and play your music on the stream</p>
              </div>
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
            </button>
            
            {expandedSections.includes("ai") && (
              <div className="space-y-1">
                {aiGenres.map(genre => (
                  <button
                    key={genre.id}
                    onClick={() => togglePlay(genre.id)}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-all flex items-center gap-3",
                      playingTrack === genre.id
                        ? "bg-blue-500/20 border border-blue-500/50"
                        : "bg-white/5 hover:bg-white/10"
                    )}
                  >
                    {playingTrack === genre.id ? (
                      <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
                        <Pause className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-white">{genre.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
