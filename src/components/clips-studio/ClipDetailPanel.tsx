import { useState } from "react";
import { ClipData, SourceMedia } from "@/pages/ClipsStudio";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Type, Music, Image, Palette, Wand2, Download, Share2, ChevronRight,
  Loader2, Sparkles, Zap, TrendingUp, BarChart3, Flame, FileText,
  Smartphone, Instagram, Youtube, Twitter, Linkedin, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ClipDetailPanelProps {
  clip: ClipData | null;
  sourceMedia: SourceMedia;
  onUpdate: (updates: Partial<ClipData>) => void;
}

const captionStyles = [
  { id: "karaoke", name: "Karaoke", preview: "Word-by-word highlight", popular: true },
  { id: "minimal", name: "Minimal", preview: "Clean & simple", popular: false },
  { id: "beasty", name: "Beasty", preview: "Bold & punchy", popular: true },
  { id: "neon", name: "Neon", preview: "Glowing effect", popular: false },
  { id: "popline", name: "Popline", preview: "Two-color pop", popular: false },
  { id: "mozi", name: "Mozi", preview: "Modern gradient", popular: false },
];

const platforms = [
  { id: "tiktok", label: "TikTok", icon: Smartphone, color: "bg-pink-500 hover:bg-pink-600" },
  { id: "reels", label: "Reels", icon: Instagram, color: "bg-purple-500 hover:bg-purple-600" },
  { id: "shorts", label: "Shorts", icon: Youtube, color: "bg-red-500 hover:bg-red-600" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-blue-600 hover:bg-blue-700" },
  { id: "twitter", label: "X", icon: Twitter, color: "bg-black hover:bg-zinc-800" },
];

const musicTracks = [
  { id: "upbeat", name: "Upbeat Energy", duration: "2:30", bpm: 128 },
  { id: "chill", name: "Chill Vibes", duration: "3:15", bpm: 90 },
  { id: "corporate", name: "Corporate", duration: "2:45", bpm: 110 },
  { id: "dramatic", name: "Dramatic", duration: "3:00", bpm: 100 },
  { id: "inspirational", name: "Inspirational", duration: "2:50", bpm: 120 },
];

export function ClipDetailPanel({ clip, sourceMedia, onUpdate }: ClipDetailPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState("karaoke");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["tiktok", "reels", "shorts"]);
  
  // AI Enhancement toggles
  const [removeFiller, setRemoveFiller] = useState(true);
  const [removePauses, setRemovePauses] = useState(true);
  const [aiKeywords, setAiKeywords] = useState(false);
  const [aiEmojis, setAiEmojis] = useState(false);
  const [autoBroll, setAutoBroll] = useState(false);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleExport = async () => {
    if (!clip) return;
    
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-shotstack-render", {
        body: {
          clipId: clip.id,
          cloudflareDownloadUrl: sourceMedia.cloudflare_download_url || sourceMedia.file_url,
          length: clip.end_seconds - clip.start_seconds,
          templateName: `vertical_template_1`,
          enableCertification: false,
        },
      });

      if (error) throw error;

      toast({
        title: "Export started!",
        description: "Your clip is being rendered. This may take 30-60 seconds.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not start clip export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-yellow-500";
    if (score >= 60) return "text-orange-500";
    return "text-red-500";
  };

  if (!clip) {
    return (
      <div className="w-72 border-l bg-card/30 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Select a clip to edit</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Customize captions, music & more</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-l bg-card/30 flex flex-col overflow-hidden min-h-0">
      {/* Clip score summary */}
      <div className="p-4 border-b bg-gradient-to-r from-[#053877]/10 to-[#2C6BED]/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Virality Analysis</h3>
          <Badge className="bg-[#2C6BED] text-white text-lg px-3 py-1">
            {clip.virality_score || 0}%
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-xl bg-background/50">
            <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
            <p className={cn("text-sm font-bold", getScoreColor(clip.hook_score || clip.virality_score || 0))}>
              {clip.hook_score || clip.virality_score || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Hook</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-background/50">
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className={cn("text-sm font-bold", getScoreColor(clip.flow_score || clip.virality_score || 0))}>
              {clip.flow_score || clip.virality_score || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Flow</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-background/50">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className={cn("text-sm font-bold", getScoreColor(clip.value_score || clip.virality_score || 0))}>
              {clip.value_score || clip.virality_score || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Value</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-background/50">
            <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
            <p className={cn("text-sm font-bold", getScoreColor(clip.trend_score || clip.virality_score || 0))}>
              {clip.trend_score || clip.virality_score || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Trend</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full bg-transparent border-b rounded-none p-0 h-12 grid grid-cols-4">
          <TabsTrigger 
            value="details" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2C6BED] data-[state=active]:bg-transparent text-xs h-12"
          >
            <FileText className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="captions" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2C6BED] data-[state=active]:bg-transparent text-xs h-12"
          >
            <Type className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="music"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2C6BED] data-[state=active]:bg-transparent text-xs h-12"
          >
            <Music className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="ai"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2C6BED] data-[state=active]:bg-transparent text-xs h-12"
          >
            <Wand2 className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Details Tab */}
          <TabsContent value="details" className="m-0 p-4 space-y-5">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Clip Title
              </Label>
              <Input
                value={clip.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Enter title..."
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Caption / Hook Text
              </Label>
              <Textarea
                value={clip.suggested_caption || ""}
                onChange={(e) => onUpdate({ suggested_caption: e.target.value })}
                placeholder="Enter caption..."
                className="mt-2 min-h-[100px] resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {(clip.suggested_caption || "").length}/150 characters
                </p>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <Wand2 className="h-3 w-3" />
                  AI Rewrite
                </Button>
              </div>
            </div>

            {clip.transcript_snippet && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Transcript
                </Label>
                <Card className="mt-2 bg-muted/30">
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      "{clip.transcript_snippet}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Scene Analysis section removed per user request */}
          </TabsContent>

          {/* Captions Tab */}
          <TabsContent value="captions" className="m-0 p-4 space-y-5">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                Caption Style
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {captionStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedCaptionStyle(style.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-left transition-all relative",
                      selectedCaptionStyle === style.id
                        ? "border-[#2C6BED] bg-[#2C6BED]/10"
                        : "border-border hover:border-[#2C6BED]/50"
                    )}
                  >
                    {style.popular && (
                      <Badge className="absolute -top-2 -right-2 bg-[#F5C242] text-[#053877] text-[9px] px-1.5">
                        Popular
                      </Badge>
                    )}
                    <p className="text-sm font-semibold">{style.name}</p>
                    <p className="text-[10px] text-muted-foreground">{style.preview}</p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                Caption Enhancements
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="keywords" className="text-sm">AI keyword highlighter</Label>
                  <Switch id="keywords" checked={aiKeywords} onCheckedChange={setAiKeywords} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emojis" className="text-sm">Auto emojis</Label>
                  <Switch id="emojis" checked={aiEmojis} onCheckedChange={setAiEmojis} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="m-0 p-4 space-y-4">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Background Music
            </Label>
            
            <div className="space-y-2">
              {musicTracks.map((track) => (
                <button
                  key={track.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-[#2C6BED]/50 hover:bg-muted/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#053877] to-[#2C6BED] flex items-center justify-center">
                    <Music className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{track.name}</p>
                    <p className="text-xs text-muted-foreground">{track.duration} • {track.bpm} BPM</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              ))}
            </div>

            <Badge variant="outline" className="w-full justify-center py-2 text-muted-foreground">
              More tracks coming soon
            </Badge>
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="m-0 p-4 space-y-5">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                AI Enhancements
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-yellow-600" />
                    </div>
                    <Label htmlFor="filler" className="text-sm font-medium">Remove filler words</Label>
                  </div>
                  <Switch id="filler" checked={removeFiller} onCheckedChange={setRemoveFiller} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <Label htmlFor="pauses" className="text-sm font-medium">Remove dead pauses</Label>
                  </div>
                  <Switch id="pauses" checked={removePauses} onCheckedChange={setRemovePauses} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Image className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <Label htmlFor="broll" className="text-sm font-medium">Auto B-Roll</Label>
                      <p className="text-[10px] text-muted-foreground">Coming soon</p>
                    </div>
                  </div>
                  <Switch id="broll" checked={autoBroll} onCheckedChange={setAutoBroll} disabled />
                </div>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Simple Publish Button - navigates to Media Detail */}
      <div className="border-t p-4 bg-card/50">
        <Button 
          className="w-full gap-2 bg-[#053877] hover:bg-[#053877]/90"
          onClick={() => {
            // Navigate to media detail page
            if (sourceMedia?.id) {
              window.location.href = `/studio/media/${sourceMedia.id}`;
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          Publish to Media Library
        </Button>
      </div>
    </div>
  );
}
