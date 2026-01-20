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
import {
  Type, Music, Image, Palette, Wand2, Download, Share2, ChevronRight,
  Loader2, Youtube, Instagram, Linkedin, Twitter
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClipEditorProps {
  clip: ClipData | null;
  sourceMedia: SourceMedia;
  onUpdate: (updates: Partial<ClipData>) => void;
}

const captionStyles = [
  { id: "karaoke", name: "Karaoke", preview: "Word by word highlight" },
  { id: "minimal", name: "Minimal", preview: "Clean & simple" },
  { id: "beasty", name: "Beasty", preview: "Bold & punchy" },
  { id: "neon", name: "Neon", preview: "Glowing effect" },
  { id: "popline", name: "Popline", preview: "Two-color pop" },
  { id: "mozi", name: "Mozi", preview: "Modern gradient" },
];

const destinations = [
  { id: "tiktok", label: "TikTok", icon: "📱", color: "bg-pink-500" },
  { id: "youtube", label: "Shorts", icon: Youtube, color: "bg-red-500" },
  { id: "instagram", label: "Reels", icon: Instagram, color: "bg-purple-500" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-blue-600" },
  { id: "twitter", label: "X", icon: Twitter, color: "bg-black" },
];

export function ClipEditor({ clip, sourceMedia, onUpdate }: ClipEditorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("captions");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState("karaoke");
  
  // AI Enhancement toggles
  const [removeFiller, setRemoveFiller] = useState(true);
  const [removePauses, setRemovePauses] = useState(true);
  const [aiKeywords, setAiKeywords] = useState(false);
  const [aiEmojis, setAiEmojis] = useState(false);
  const [autoBroll, setAutoBroll] = useState(false);
  const [autoTransitions, setAutoTransitions] = useState(false);

  const handleExport = async () => {
    if (!clip) return;
    
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-shotstack-render", {
        body: {
          clipId: clip.id,
          cloudflareDownloadUrl: sourceMedia.file_url,
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

  if (!clip) {
    return (
      <div className="w-80 border-l bg-card/50 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Select a clip to edit</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-card/50 flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full bg-transparent border-b rounded-none p-0 h-12 grid grid-cols-4">
          <TabsTrigger 
            value="captions" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs h-12"
          >
            <Type className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="music"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs h-12"
          >
            <Music className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="broll"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs h-12"
          >
            <Image className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="brand"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs h-12"
          >
            <Palette className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="captions" className="m-0 p-4 space-y-6">
            {/* Caption styles */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Caption Style
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {captionStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedCaptionStyle(style.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      selectedCaptionStyle === style.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <p className="text-sm font-medium">{style.name}</p>
                    <p className="text-[10px] text-muted-foreground">{style.preview}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Caption text */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Caption Text
              </h3>
              <Textarea
                value={clip.suggested_caption || ""}
                onChange={(e) => onUpdate({ suggested_caption: e.target.value })}
                placeholder="Enter caption..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <Separator />

            {/* AI Enhancements */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                AI Enhancements
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="filler" className="text-sm">Remove filler words</Label>
                  <Switch id="filler" checked={removeFiller} onCheckedChange={setRemoveFiller} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pauses" className="text-sm">Remove pauses</Label>
                  <Switch id="pauses" checked={removePauses} onCheckedChange={setRemovePauses} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="keywords" className="text-sm">AI keywords highlighter</Label>
                  <Switch id="keywords" checked={aiKeywords} onCheckedChange={setAiKeywords} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emojis" className="text-sm">AI emojis</Label>
                  <Switch id="emojis" checked={aiEmojis} onCheckedChange={setAiEmojis} />
                </div>
                <div className="flex items-center justify-between opacity-50">
                  <Label htmlFor="broll" className="text-sm">Auto generate B-Roll</Label>
                  <Switch id="broll" checked={autoBroll} onCheckedChange={setAutoBroll} disabled />
                </div>
                <div className="flex items-center justify-between opacity-50">
                  <Label htmlFor="transitions" className="text-sm">Auto transitions</Label>
                  <Switch id="transitions" checked={autoTransitions} onCheckedChange={setAutoTransitions} disabled />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="music" className="m-0 p-4 space-y-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Background Music
            </h3>
            <p className="text-sm text-muted-foreground">
              Add royalty-free music to your clip
            </p>
            
            <div className="space-y-2">
              {["Upbeat Energy", "Chill Vibes", "Corporate", "Dramatic", "Inspirational"].map((track) => (
                <button
                  key={track}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Music className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{track}</p>
                    <p className="text-xs text-muted-foreground">Royalty-free</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            <Badge variant="outline" className="w-full justify-center py-2">
              Coming Soon
            </Badge>
          </TabsContent>

          <TabsContent value="broll" className="m-0 p-4 space-y-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              B-Roll & Stock
            </h3>
            
            <Button variant="outline" className="w-full gap-2">
              <Wand2 className="h-4 w-4" />
              AI Suggest B-Roll
            </Button>

            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-video rounded-lg bg-muted border border-border hover:border-primary/50 cursor-pointer flex items-center justify-center"
                >
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              ))}
            </div>

            <Badge variant="outline" className="w-full justify-center py-2">
              Coming Soon
            </Badge>
          </TabsContent>

          <TabsContent value="brand" className="m-0 p-4 space-y-4">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Overlay (Logo, CTA)
              </h3>
              <Button variant="outline" className="w-full justify-between">
                Add overlay
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Intro/Outro
              </h3>
              <Button variant="outline" className="w-full justify-between">
                Add intro/outro
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Clip Title
              </h3>
              <Input
                value={clip.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Enter title..."
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Export Section */}
      <div className="border-t p-4 space-y-4">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Export To
          </h3>
          <div className="flex flex-wrap gap-2">
            {destinations.map((dest) => {
              const Icon = typeof dest.icon === 'string' ? null : dest.icon;
              return (
                <Badge
                  key={dest.id}
                  className={cn(
                    "cursor-pointer border-0 gap-1",
                    dest.color,
                    "text-white hover:opacity-90"
                  )}
                >
                  {typeof dest.icon === 'string' ? dest.icon : Icon && <Icon className="h-3 w-3" />}
                  {dest.label}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
          <Button className="gap-2">
            <Share2 className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
