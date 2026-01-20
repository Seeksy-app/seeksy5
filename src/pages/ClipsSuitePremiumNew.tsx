import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, Scissors, Type, Music, Image, Palette, 
  Download, Share2, Sparkles, Video, Square, RectangleHorizontal,
  Smartphone, Monitor, LayoutGrid, Wand2, ChevronRight,
  TrendingUp, MessageSquare, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Sample clips
const sampleClips = [
  { id: "1", title: "The key insight about...", duration: "0:32", confidence: 94, sentiment: "positive", type: "insight" },
  { id: "2", title: "When Alex mentioned...", duration: "0:45", confidence: 89, sentiment: "engaging", type: "quote" },
  { id: "3", title: "The reaction to...", duration: "0:28", confidence: 92, sentiment: "emotional", type: "reaction" },
  { id: "4", title: "Breaking down the...", duration: "0:38", confidence: 87, sentiment: "informative", type: "breakdown" },
];

// Export sizes
const exportSizes = [
  { id: "vertical", label: "9:16", icon: Smartphone, description: "TikTok, Reels, Shorts" },
  { id: "horizontal", label: "16:9", icon: Monitor, description: "YouTube, Website" },
  { id: "square", label: "1:1", icon: Square, description: "Instagram Feed" },
];

// Export destinations
const destinations = [
  { id: "tiktok", label: "TikTok", color: "bg-pink-500" },
  { id: "youtube", label: "YouTube Shorts", color: "bg-red-500" },
  { id: "reels", label: "IG Reels", color: "bg-purple-500" },
  { id: "page", label: "Seeksy Page", color: "bg-blue-500" },
  { id: "library", label: "Save to Library", color: "bg-white/20" },
];

export default function ClipsSuitePremiumNew() {
  const [selectedClip, setSelectedClip] = useState(sampleClips[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeExportSize, setActiveExportSize] = useState("vertical");
  const [editTab, setEditTab] = useState("captions");

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-500/20 text-green-400";
      case "engaging": return "bg-blue-500/20 text-blue-400";
      case "emotional": return "bg-pink-500/20 text-pink-400";
      default: return "bg-white/10 text-white/60";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0D1117] to-[#11151C] flex">
      {/* Left - Clip List */}
      <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white mb-1">AI Clips</h2>
          <p className="text-sm text-white/50">Auto-generated from your recording</p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {/* Source selector */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Source</p>
              <div className="flex gap-2">
                <Badge className="bg-violet-500/20 text-violet-400 border-0 cursor-pointer">Auto-Clips</Badge>
                <Badge className="bg-white/5 text-white/50 border-0 cursor-pointer hover:bg-white/10">Markers</Badge>
                <Badge className="bg-white/5 text-white/50 border-0 cursor-pointer hover:bg-white/10">Full Episode</Badge>
              </div>
            </div>

            {/* Clips */}
            {sampleClips.map((clip, index) => (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedClip(clip)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  selectedClip.id === clip.id
                    ? "bg-violet-500/10 border-violet-500/30"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-white line-clamp-1">{clip.title}</h3>
                  <span className="text-xs text-white/40">{clip.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-[10px]", getSentimentColor(clip.sentiment))}>
                    {clip.sentiment}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <TrendingUp className="w-3 h-3" />
                    <span>{clip.confidence}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center - Preview */}
      <div className="flex-1 flex flex-col p-6">
        {/* Preview container */}
        <div className="flex-1 flex items-center justify-center">
          <div className={cn(
            "relative bg-black/40 rounded-2xl overflow-hidden border border-white/10",
            activeExportSize === "vertical" && "w-[300px] h-[533px]",
            activeExportSize === "horizontal" && "w-[600px] h-[338px]",
            activeExportSize === "square" && "w-[400px] h-[400px]"
          )}>
            {/* Video preview placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-900/30 to-purple-900/30">
              <Video className="w-16 h-16 text-white/20" />
            </div>

            {/* Sample caption */}
            <div className="absolute bottom-8 left-4 right-4">
              <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-lg">
                <p className="text-white text-center text-sm font-medium">
                  "This is a sample caption that will appear on your clip..."
                </p>
              </div>
            </div>

            {/* Play button overlay */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Timeline scrubber */}
        <div className="mt-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <div className="flex-1">
                <Slider defaultValue={[30]} max={100} className="cursor-pointer" />
              </div>
              <span className="text-sm text-white/50 font-mono">0:12 / 0:32</span>
            </div>
          </div>
        </div>

        {/* Export sizes */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {exportSizes.map((size) => (
            <button
              key={size.id}
              onClick={() => setActiveExportSize(size.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                activeExportSize === size.id
                  ? "bg-violet-500/20 border border-violet-500/30 text-white"
                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
              )}
            >
              <size.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{size.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right - Edit Tools */}
      <div className="w-80 border-l border-white/5 bg-black/20 flex flex-col">
        <Tabs value={editTab} onValueChange={setEditTab} className="flex-1 flex flex-col">
          <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none p-0 h-12">
            <TabsTrigger 
              value="captions" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent text-xs h-12"
            >
              <Type className="w-4 h-4 mr-1.5" />
              Captions
            </TabsTrigger>
            <TabsTrigger 
              value="music"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent text-xs h-12"
            >
              <Music className="w-4 h-4 mr-1.5" />
              Music
            </TabsTrigger>
            <TabsTrigger 
              value="broll"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent text-xs h-12"
            >
              <Image className="w-4 h-4 mr-1.5" />
              B-Roll
            </TabsTrigger>
            <TabsTrigger 
              value="brand"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent text-xs h-12"
            >
              <Palette className="w-4 h-4 mr-1.5" />
              Brand
            </TabsTrigger>
          </TabsList>

          <TabsContent value="captions" className="flex-1 m-0 p-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Caption Style</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Bold", "Minimal", "Neon", "Classic"].map((style) => (
                      <button
                        key={style}
                        className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-violet-500/50 transition-all"
                      >
                        <span className="text-sm text-white">{style}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Position</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Top", "Center", "Bottom"].map((pos) => (
                      <button
                        key={pos}
                        className={cn(
                          "p-2 rounded-lg text-xs",
                          pos === "Bottom" 
                            ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" 
                            : "bg-white/5 text-white/60 border border-white/10"
                        )}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Auto-Style Captions
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="music" className="flex-1 m-0 p-4">
            <div className="space-y-3">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Suggested Tracks</p>
              {["Upbeat Energy", "Chill Vibes", "Corporate", "Dramatic"].map((track) => (
                <button
                  key={track}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Music className="w-5 h-5 text-white/40" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-white">{track}</p>
                    <p className="text-xs text-white/40">Royalty-free</p>
                  </div>
                  <Play className="w-4 h-4 text-white/40" />
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="broll" className="flex-1 m-0 p-4">
            <div className="space-y-4">
              <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Suggest B-Roll
              </Button>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-lg bg-white/5 border border-white/10 hover:border-violet-500/50 cursor-pointer flex items-center justify-center"
                  >
                    <Image className="w-6 h-6 text-white/20" />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="brand" className="flex-1 m-0 p-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Brand Kit</p>
                <button className="w-full p-4 rounded-lg bg-white/5 border border-white/10 hover:border-violet-500/50 transition-all">
                  <span className="text-sm text-white">Apply Brand Kit</span>
                </button>
              </div>
              <div>
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Layout Templates</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Podcast", "Interview", "Tutorial", "Story"].map((layout) => (
                    <button
                      key={layout}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-violet-500/50"
                    >
                      <span className="text-xs text-white">{layout}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export section */}
        <div className="border-t border-white/5 p-4">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">Export To</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {destinations.map((dest) => (
              <Badge
                key={dest.id}
                className={cn(
                  "cursor-pointer border-0",
                  dest.color,
                  dest.id !== "library" && "text-white"
                )}
              >
                {dest.label}
              </Badge>
            ))}
          </div>
          <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
            <Download className="w-4 h-4 mr-2" />
            Export Clip
          </Button>
        </div>
      </div>
    </div>
  );
}
