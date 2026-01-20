import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, Wand2, Copy, Play, Flag, 
  ChevronDown, Plus, Clock, Check
} from "lucide-react";

interface AdScript {
  id: string;
  brand: string;
  script: string;
  duration: string;
  marked: boolean;
  timestamp?: number;
}

interface HostReadScriptDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkScript?: (scriptId: string, timestamp: number) => void;
  currentTime?: number;
}

export function HostReadScriptDrawer({ 
  open, 
  onOpenChange, 
  onMarkScript,
  currentTime = 0 
}: HostReadScriptDrawerProps) {
  const [scripts, setScripts] = useState<AdScript[]>([
    {
      id: "1",
      brand: "Athletic Greens",
      script: "This episode is brought to you by Athletic Greens. AG1 is the daily foundational nutrition supplement that supports whole body health. With 75 vitamins, minerals, and whole food-sourced ingredients, you'll be starting your day off right. Head to athleticgreens.com/seeksy for a free one-year supply of vitamin D and 5 free travel packs with your first purchase.",
      duration: "45s",
      marked: false
    },
    {
      id: "2",
      brand: "Squarespace",
      script: "Today's episode is sponsored by Squarespace. Squarespace is the all-in-one website platform for entrepreneurs to stand out and succeed online. Whether you're just starting out or managing a growing brand, Squarespace makes it easy. Use code SEEKSY at checkout for 10% off your first website or domain.",
      duration: "30s",
      marked: false
    }
  ]);

  const [customScript, setCustomScript] = useState("");
  const [showAddScript, setShowAddScript] = useState(false);
  const [teleprompterMode, setTeleprompterMode] = useState(false);
  const [activeScript, setActiveScript] = useState<AdScript | null>(null);

  const handleMarkScript = (script: AdScript) => {
    setScripts(scripts.map(s => 
      s.id === script.id 
        ? { ...s, marked: true, timestamp: currentTime }
        : s
    ));
    onMarkScript?.(script.id, currentTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[450px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Host-Read Scripts
          </SheetTitle>
          <SheetDescription>
            Ad scripts and teleprompter for your recording
          </SheetDescription>
        </SheetHeader>

        {teleprompterMode && activeScript ? (
          // Teleprompter Mode
          <div className="flex-1 flex flex-col bg-black">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <Badge variant="outline" className="text-white border-white/20">
                {activeScript.brand}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/10"
                onClick={() => setTeleprompterMode(false)}
              >
                Exit Teleprompter
              </Button>
            </div>
            <ScrollArea className="flex-1 p-8">
              <p className="text-2xl leading-relaxed text-white font-medium">
                {activeScript.script}
              </p>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-white/60 text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {activeScript.duration}
              </span>
              <Button 
                onClick={() => {
                  handleMarkScript(activeScript);
                  setTeleprompterMode(false);
                }}
                className="gap-2"
              >
                <Flag className="w-4 h-4" />
                Mark as Read
              </Button>
            </div>
          </div>
        ) : (
          // Script List Mode
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {/* Scripts List */}
              {scripts.map((script) => (
                <div
                  key={script.id}
                  className={`p-4 rounded-xl border transition-all ${
                    script.marked 
                      ? "border-green-500/50 bg-green-500/5" 
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{script.brand}</h3>
                      {script.marked && (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-500/50">
                          <Check className="w-3 h-3" />
                          Read at {formatTime(script.timestamp || 0)}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {script.duration}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {script.script}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => {
                        setActiveScript(script);
                        setTeleprompterMode(true);
                      }}
                    >
                      <Play className="w-3.5 h-3.5" />
                      Teleprompter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => navigator.clipboard.writeText(script.script)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </Button>
                    {!script.marked && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1.5"
                        onClick={() => handleMarkScript(script)}
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Mark
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Custom Script */}
              {showAddScript ? (
                <div className="p-4 rounded-xl border border-border bg-card">
                  <h3 className="font-medium mb-3">Add Custom Script</h3>
                  <Textarea
                    placeholder="Paste or type your ad script here..."
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                    className="min-h-[120px] mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      Generate with AI
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowAddScript(false)}>
                        Cancel
                      </Button>
                      <Button size="sm">Save Script</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full gap-2 border-dashed"
                  onClick={() => setShowAddScript(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Script
                </Button>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
