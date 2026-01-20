import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Play, Pause, Download, Share2, Sparkles, Type, Music,
  Image, Palette, Layout, ZoomIn, Subtitles, MoreVertical,
  CheckCircle2, Clock, ChevronRight, Instagram, Youtube, Video
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Clip {
  id: string;
  title: string;
  duration: string;
  source: "auto" | "marked" | "full";
  status: "ready" | "processing" | "exported";
  thumbnail?: string;
}

const sampleClips: Clip[] = [
  { id: "1", title: "The moment AI changed everything", duration: "0:32", source: "auto", status: "ready" },
  { id: "2", title: "Key insight on creator economy", duration: "0:45", source: "auto", status: "ready" },
  { id: "3", title: "Funny reaction moment", duration: "0:18", source: "marked", status: "exported" },
  { id: "4", title: "Introduction segment", duration: "1:20", source: "full", status: "processing" },
];

const exportDestinations = [
  { id: "tiktok", name: "TikTok", icon: Video },
  { id: "youtube", name: "YouTube Shorts", icon: Youtube },
  { id: "reels", name: "Instagram Reels", icon: Instagram },
  { id: "seeksy", name: "Seeksy Page", icon: Sparkles },
];

const layoutTemplates = [
  { id: "vertical", name: "Vertical (9:16)", aspect: "9/16" },
  { id: "square", name: "Square (1:1)", aspect: "1/1" },
  { id: "horizontal", name: "Horizontal (16:9)", aspect: "16/9" },
];

export default function ClipsSuitePremium() {
  const [selectedClip, setSelectedClip] = useState<Clip | null>(sampleClips[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editTab, setEditTab] = useState("captions");
  const [selectedLayout, setSelectedLayout] = useState("vertical");
  
  // Edit settings
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [autoZoom, setAutoZoom] = useState(true);
  const [musicVolume, setMusicVolume] = useState(30);

  const getSourceColor = (source: Clip["source"]) => {
    switch (source) {
      case "auto": return "bg-violet-500/20 text-violet-400";
      case "marked": return "bg-amber-500/20 text-amber-400";
      case "full": return "bg-blue-500/20 text-blue-400";
    }
  };

  const getStatusIcon = (status: Clip["status"]) => {
    switch (status) {
      case "ready": return null;
      case "processing": return <Clock className="w-3 h-3 animate-spin" />;
      case "exported": return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 h-screen flex">
        {/* Left Panel - Clip List */}
        <aside className="w-80 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white mb-1">AI Clips Suite</h2>
            <p className="text-xs text-white/50">{sampleClips.length} clips ready</p>
          </div>

          {/* Source filter */}
          <Tabs defaultValue="all" className="px-4 pt-4">
            <TabsList className="w-full bg-white/5 border border-white/10">
              <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
              <TabsTrigger value="auto" className="flex-1 text-xs">Auto</TabsTrigger>
              <TabsTrigger value="marked" className="flex-1 text-xs">Marked</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Clip list */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {sampleClips.map((clip) => (
                <Card
                  key={clip.id}
                  onClick={() => setSelectedClip(clip)}
                  className={cn(
                    "p-3 cursor-pointer transition-all border-white/10",
                    "bg-white/5 hover:bg-white/10",
                    selectedClip?.id === clip.id && "bg-white/10 border-white/20"
                  )}
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 text-white/40" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate mb-1">
                        {clip.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-[10px] border-0", getSourceColor(clip.source))}>
                          {clip.source === "auto" && <Sparkles className="w-2.5 h-2.5 mr-1" />}
                          {clip.source}
                        </Badge>
                        <span className="text-xs text-white/40">{clip.duration}</span>
                        {getStatusIcon(clip.status)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Center - Preview */}
        <main className="flex-1 flex flex-col p-6">
          <div className="flex-1 flex items-center justify-center">
            {selectedClip ? (
              <div className="relative">
                {/* Video preview with selected aspect ratio */}
                <div 
                  className={cn(
                    "bg-gradient-to-br from-white/5 to-white/10 rounded-2xl overflow-hidden border border-white/10",
                    "flex items-center justify-center"
                  )}
                  style={{
                    aspectRatio: layoutTemplates.find(l => l.id === selectedLayout)?.aspect,
                    width: selectedLayout === "horizontal" ? "600px" : selectedLayout === "square" ? "400px" : "280px"
                  }}
                >
                  <div className="text-center">
                    <Play className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">{selectedClip.title}</p>
                    <p className="text-white/30 text-xs mt-1">{selectedClip.duration}</p>
                  </div>

                  {/* Captions preview */}
                  {captionsEnabled && (
                    <div className="absolute bottom-8 left-4 right-4">
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-center">
                        <p className="text-white text-sm font-medium">
                          Sample caption text appears here
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Play controls */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <Button
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Sparkles className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">Select a clip to preview</p>
              </div>
            )}
          </div>

          {/* Layout templates */}
          <div className="flex items-center justify-center gap-3 mt-20">
            {layoutTemplates.map((layout) => (
              <Button
                key={layout.id}
                variant="ghost"
                onClick={() => setSelectedLayout(layout.id)}
                className={cn(
                  "px-4 py-2 rounded-xl transition-all",
                  selectedLayout === layout.id
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                )}
              >
                <Layout className="w-4 h-4 mr-2" />
                {layout.name}
              </Button>
            ))}
          </div>
        </main>

        {/* Right Panel - Edit Tools */}
        <aside className="w-80 border-l border-white/10 flex flex-col">
          <Tabs value={editTab} onValueChange={setEditTab} className="flex-1 flex flex-col">
            <TabsList className="flex-shrink-0 bg-transparent border-b border-white/10 rounded-none h-12 p-0">
              <TabsTrigger value="captions" className="flex-1 rounded-none text-xs">
                <Subtitles className="w-4 h-4 mr-1.5" />
                Captions
              </TabsTrigger>
              <TabsTrigger value="style" className="flex-1 rounded-none text-xs">
                <Palette className="w-4 h-4 mr-1.5" />
                Style
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex-1 rounded-none text-xs">
                <Music className="w-4 h-4 mr-1.5" />
                Audio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="captions" className="flex-1 p-4 m-0 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <Label className="text-sm text-white/70">Auto Captions</Label>
                  <Switch checked={captionsEnabled} onCheckedChange={setCaptionsEnabled} />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm text-white/70">Caption Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Bold", "Subtle", "Neon", "Classic"].map((style) => (
                      <Button
                        key={style}
                        variant="ghost"
                        className="bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <Label className="text-sm text-white/70">Auto Zoom on Speaker</Label>
                  <Switch checked={autoZoom} onCheckedChange={setAutoZoom} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="flex-1 p-4 m-0 overflow-y-auto">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm text-white/70">Brand Kit</Label>
                  <Button variant="ghost" className="w-full justify-between bg-white/5 border border-white/10 text-white/70">
                    Default Brand
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm text-white/70">B-Roll</Label>
                  <Button variant="ghost" className="w-full justify-start bg-white/5 border border-white/10 text-white/70">
                    <Image className="w-4 h-4 mr-2" />
                    Add B-Roll
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="flex-1 p-4 m-0 overflow-y-auto">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-sm text-white/70">Background Music</Label>
                    <span className="text-xs text-white/40">{musicVolume}%</span>
                  </div>
                  <Slider
                    value={[musicVolume]}
                    onValueChange={(v) => setMusicVolume(v[0])}
                    max={100}
                    className="cursor-pointer"
                  />
                </div>

                <Button variant="ghost" className="w-full justify-start bg-white/5 border border-white/10 text-white/70">
                  <Music className="w-4 h-4 mr-2" />
                  Choose Track
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Export section */}
          <div className="p-4 border-t border-white/10">
            <h4 className="text-sm font-medium text-white mb-3">Export To</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {exportDestinations.map((dest) => (
                <Button
                  key={dest.id}
                  variant="ghost"
                  className="h-auto py-3 bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white flex-col gap-1"
                >
                  <dest.icon className="w-5 h-5" />
                  <span className="text-xs">{dest.name}</span>
                </Button>
              ))}
            </div>
            <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white">
              <Download className="w-4 h-4 mr-2" />
              Export Clip
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
