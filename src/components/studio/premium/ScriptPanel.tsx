import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, RefreshCw, Sparkles, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdScript {
  id: string;
  type: "pre-roll" | "mid-roll" | "post-roll";
  brand: string;
  duration: string;
  script: string;
  variations?: string[];
  completed?: boolean;
}

const sampleScripts: AdScript[] = [
  {
    id: "1",
    type: "pre-roll",
    brand: "Seeksy Pro",
    duration: "30s",
    script: "Hey creators! Before we dive in, I want to tell you about Seeksy Pro — the all-in-one platform that helps you record, edit, and publish your content faster than ever. Use code PODCAST20 for 20% off your first month.",
    variations: [
      "What's up everyone! Quick shoutout to our sponsor Seeksy Pro...",
      "Before we get started, let me tell you about something that's changed how I create..."
    ]
  },
  {
    id: "2",
    type: "mid-roll",
    brand: "AudioGear Co",
    duration: "45s",
    script: "Speaking of quality, let me tell you about AudioGear Co. They make the microphone I'm using right now, and honestly, it's been a game-changer for my audio quality. Head to audiogear.co/seeksy for an exclusive 15% discount.",
  },
  {
    id: "3",
    type: "post-roll",
    brand: "Creator Academy",
    duration: "20s",
    script: "Thanks for listening! If you want to level up your content game, check out Creator Academy — link in the description. See you next time!",
  },
];

interface ScriptPanelProps {
  onMarkComplete: (scriptId: string) => void;
  onGenerateVariation: (scriptId: string) => void;
}

export function ScriptPanel({ onMarkComplete, onGenerateVariation }: ScriptPanelProps) {
  const [scripts, setScripts] = useState<AdScript[]>(sampleScripts);
  const [activeTab, setActiveTab] = useState("all");
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const handleMarkComplete = (scriptId: string) => {
    setScripts(prev => prev.map(s => 
      s.id === scriptId ? { ...s, completed: !s.completed } : s
    ));
    onMarkComplete(scriptId);
  };

  const handleGenerateVariation = async (scriptId: string) => {
    setGeneratingFor(scriptId);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGeneratingFor(null);
    onGenerateVariation(scriptId);
  };

  const filteredScripts = activeTab === "all" 
    ? scripts 
    : scripts.filter(s => s.type === activeTab);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "pre-roll": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "mid-roll": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "post-roll": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default: return "bg-white/10 text-white/60";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Ad Scripts</h3>
        <Badge variant="outline" className="bg-white/5 border-white/10 text-white/60">
          {scripts.filter(s => !s.completed).length} remaining
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-4">
          <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white/10">All</TabsTrigger>
          <TabsTrigger value="pre-roll" className="text-xs data-[state=active]:bg-white/10">Pre</TabsTrigger>
          <TabsTrigger value="mid-roll" className="text-xs data-[state=active]:bg-white/10">Mid</TabsTrigger>
          <TabsTrigger value="post-roll" className="text-xs data-[state=active]:bg-white/10">Post</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {filteredScripts.map((script) => (
              <Card
                key={script.id}
                className={cn(
                  "p-4 bg-white/5 border-white/10 transition-all",
                  script.completed && "opacity-50"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[10px] uppercase tracking-wider", getTypeColor(script.type))}>
                      {script.type}
                    </Badge>
                    <span className="text-sm font-medium text-white">{script.brand}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/40">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{script.duration}</span>
                  </div>
                </div>

                <p className={cn(
                  "text-sm text-white/70 leading-relaxed mb-4",
                  script.completed && "line-through"
                )}>
                  {script.script}
                </p>

                {script.variations && script.variations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-white/40 mb-2">AI Variations:</p>
                    <div className="space-y-2">
                      {script.variations.map((variation, i) => (
                        <div 
                          key={i}
                          className="text-xs text-white/50 p-2 rounded bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                        >
                          {variation.substring(0, 80)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkComplete(script.id)}
                    className={cn(
                      "h-8 px-3 text-xs",
                      script.completed 
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <Check className="w-3 h-3 mr-1.5" />
                    {script.completed ? "Completed" : "Mark Done"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenerateVariation(script.id)}
                    disabled={generatingFor === script.id}
                    className="h-8 px-3 text-xs bg-white/5 text-white/60 hover:bg-white/10"
                  >
                    {generatingFor === script.id ? (
                      <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1.5" />
                    )}
                    AI Variation
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
