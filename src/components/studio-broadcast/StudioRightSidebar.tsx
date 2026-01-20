import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { IntroOutroLibrary } from "./IntroOutroLibrary";
import { VideoAdsPanel } from "./VideoAdsPanel";
import { supabase } from "@/integrations/supabase/client";
import { 
  Palette, MessageSquare, Music, QrCode, StickyNote, 
  Image, Video, FileText, X, Upload, Sparkles, Play,
  DollarSign, FileAudio, Loader2
} from "lucide-react";

interface StudioRightSidebarProps {
  broadcastId: string;
  sessionId: string;
  onAddMedia: (type: 'logo' | 'overlay' | 'video' | 'background') => void;
  onAddCaption: (type: 'lowerThird' | 'ticker') => void;
  onThemeChange: (theme: string) => void;
  onVideoAdSelect?: (ad: any) => void;
  onIntroOutroSelect?: (item: any) => void;
}

export function StudioRightSidebar({ 
  broadcastId,
  sessionId,
  onAddMedia,
  onAddCaption,
  onThemeChange,
  onVideoAdSelect,
  onIntroOutroSelect
}: StudioRightSidebarProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [selectedVideoAd, setSelectedVideoAd] = useState(null);

  const sidebarItems = [
    { id: "graphics", icon: Palette, label: "Graphics" },
    { id: "captions", icon: FileText, label: "Captions" },
    { id: "video-ads", icon: DollarSign, label: "Video Ads" },
    { id: "intro-outro", icon: FileAudio, label: "Intro/Outro" },
    { id: "qr", icon: QrCode, label: "QR Codes" },
    { id: "notes", icon: StickyNote, label: "Notes" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "music", icon: Music, label: "Music" },
    { id: "theme", icon: Sparkles, label: "Theme" }
  ];

  const togglePanel = (panelId: string) => {
    setActivePanel(activePanel === panelId ? null : panelId);
  };

  const getPanelTitle = (panelId: string) => {
    return sidebarItems.find(item => item.id === panelId)?.label || "";
  };

  return (
    <>
      {/* Icon Navigation Bar - Right Side */}
      <div className="w-20 bg-background/95 backdrop-blur-sm border-l border-border/50 flex flex-col items-center py-6 gap-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => togglePanel(item.id)}
              className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                activePanel === item.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-medium text-center leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Slide-out Panel - From Right */}
      <Sheet open={activePanel !== null} onOpenChange={() => setActivePanel(null)}>
        <SheetContent side="right" className="w-[420px] p-0 border-l border-border/50 mr-20">
          <SheetHeader className="px-6 py-4 border-b border-border/50">
            <SheetTitle className="text-lg font-semibold">
              {getPanelTitle(activePanel || "")}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-73px)]">
            <div className="p-6">
              {activePanel === "graphics" && <GraphicsPanel onAddMedia={onAddMedia} />}
              {activePanel === "captions" && <CaptionsPanel onAddCaption={onAddCaption} />}
              {activePanel === "video-ads" && (
                <VideoAdsPanel 
                  onAdSelect={(ad) => {
                    setSelectedVideoAd(ad);
                    onVideoAdSelect?.(ad);
                  }}
                  selectedAd={selectedVideoAd}
                />
              )}
              {activePanel === "intro-outro" && (
                <IntroOutroLibrary
                  sessionId={sessionId}
                  onSelect={(item) => onIntroOutroSelect?.(item)}
                />
              )}
              {activePanel === "qr" && <QRCodesPanel />}
              {activePanel === "notes" && <NotesPanel broadcastId={broadcastId} />}
              {activePanel === "chat" && <ChatPanel broadcastId={broadcastId} />}
              {activePanel === "music" && <MusicPanel />}
              {activePanel === "theme" && <ThemePanel onThemeChange={onThemeChange} />}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

function GraphicsPanel({ onAddMedia }: { onAddMedia: (type: any) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Add logos, overlays, videos, and backgrounds to your stream
      </p>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Logo</span>
            <Button size="sm" variant="outline" onClick={() => onAddMedia('logo')}>
              <Upload className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded border border-border hover:border-primary cursor-pointer transition-colors" />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overlay</span>
            <Button size="sm" variant="outline" onClick={() => onAddMedia('overlay')}>
              <Upload className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="aspect-video bg-muted rounded border border-border hover:border-primary cursor-pointer transition-colors" />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Video Clips</span>
            <Button size="sm" variant="outline" onClick={() => onAddMedia('video')}>
              <Upload className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video bg-muted rounded border border-border hover:border-primary cursor-pointer transition-colors flex items-center justify-center">
                <Play className="h-6 w-6 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Background</span>
            <Button size="sm" variant="outline" onClick={() => onAddMedia('background')}>
              <Upload className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video bg-muted rounded border border-border hover:border-primary cursor-pointer transition-colors" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CaptionsPanel({ onAddCaption }: { onAddCaption: (type: any) => void }) {
  const [lowerThirds, setLowerThirds] = useState([
    "#behooves you",
    "Army National Guard",
    "Air National Guard, Tech Sgt.",
    "Greg Bernard - On-Air Personality"
  ]);

  const [tickers, setTickers] = useState([
    "@Paradedeck @TommysFigz @dupreegod @HIM",
    "ParadeDeck.com",
    "#AnimeNYC #ParadeDeck #SideStage1 #HIM"
  ]);

  return (
    <div className="space-y-6">

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Lower Third</span>
            <Button size="sm" variant="outline" onClick={() => onAddCaption('lowerThird')}>
              + Add
            </Button>
          </div>
          <div className="space-y-2">
            {lowerThirds.map((text, i) => (
              <div key={i} className="p-3 bg-muted rounded hover:bg-accent cursor-pointer transition-colors">
                <p className="text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Ticker</span>
            <Button size="sm" variant="outline" onClick={() => onAddCaption('ticker')}>
              + Add
            </Button>
          </div>
          <div className="space-y-2">
            {tickers.map((text, i) => (
              <div key={i} className="p-3 bg-muted rounded hover:bg-accent cursor-pointer transition-colors">
                <p className="text-xs font-mono">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QRCodesPanel() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Generate QR codes for your stream
      </p>

      <Button className="w-full" variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Create QR Code
      </Button>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded border border-border flex items-center justify-center">
            <QrCode className="h-12 w-12 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesPanel({ broadcastId }: { broadcastId: string }) {
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Keep track of important points during your stream
      </p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes here..."
        className="w-full h-64 p-3 bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function ChatPanel({ broadcastId }: { broadcastId: string }) {
  const [showOnStream, setShowOnStream] = useState(false);

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between p-3 bg-muted rounded">
        <span className="text-sm">Show on stream</span>
        <Switch checked={showOnStream} onCheckedChange={setShowOnStream} />
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">
            R
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Restream.io 21:07:41</p>
            <p className="text-sm mt-1">Never miss a comment! Click on a chat message to display it on screen.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MusicPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [tracks, setTracks] = useState([
    { name: "Chill", icon: "👑", genre: "Chill" },
    { name: "Downtempo", icon: "▶", genre: "Downtempo" },
    { name: "Chill Hop", icon: "▶", genre: "Chill Hop" },
    { name: "Hip hop", icon: "👑", genre: "Hip hop" },
    { name: "Lo-Fi", icon: "▶", genre: "Lo-Fi" },
    { name: "Lounge", icon: "👑", genre: "Lounge" },
    { name: "R&B", icon: "👑", genre: "R&B" }
  ]);

  useEffect(() => {
    loadMusicTracks();
  }, []);

  const loadMusicTracks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('elevenlabs-get-music');
      
      if (!error && data?.music && Array.isArray(data.music) && data.music.length > 0) {
        setTracks(data.music);
      }
    } catch (error) {
      console.error('Error loading music tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Custom</span>
            <Button size="sm" variant="outline">
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
          </div>
          <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
            <Music className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Get your music heard</p>
            <p className="text-xs text-muted-foreground">Upload and play your music on the stream</p>
          </div>
        </div>

        <div>
          <span className="text-sm font-medium mb-3 block">AI Generated</span>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-muted rounded hover:bg-accent cursor-pointer transition-colors"
                >
                  <span className="text-lg">{track.icon}</span>
                  <span className="text-sm font-medium flex-1">{track.name}</span>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemePanel({ onThemeChange }: { onThemeChange: (theme: string) => void }) {
  const [selectedTheme, setSelectedTheme] = useState("base");
  const [primaryColor, setPrimaryColor] = useState("#266EFF");

  const themes = [
    { id: "air", name: "Air" },
    { id: "base", name: "Base" },
    { id: "news", name: "News" },
    { id: "round", name: "Round" }
  ];

  return (
    <div className="space-y-6">

      <div>
        <span className="text-sm font-medium mb-3 block">Theme</span>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setSelectedTheme(theme.id);
                onThemeChange(theme.id);
              }}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedTheme === theme.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-sm font-medium">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-sm font-medium mb-3 block">Primary color</span>
        <div className="flex items-center gap-2">
          <div 
            className="w-12 h-12 rounded border border-border cursor-pointer"
            style={{ backgroundColor: primaryColor }}
            onClick={() => {}}
          />
          <Input 
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      <div>
        <span className="text-sm font-medium mb-3 block">Font</span>
        <select className="w-full p-2 bg-muted rounded border border-border">
          <option>Default</option>
          <option>Arial</option>
          <option>Helvetica</option>
          <option>Times New Roman</option>
        </select>
      </div>
    </div>
  );
}
