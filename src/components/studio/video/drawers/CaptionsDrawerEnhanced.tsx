import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { 
  X, Plus, ChevronDown, ChevronRight, 
  Gauge, Info, GripVertical, Trash2, Edit2, Check, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptionsDrawerEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onShowLowerThird?: (item: LowerThird | null) => void;
  onShowTicker?: (item: Ticker | null, speed: number) => void;
}

interface LowerThird {
  id: string;
  title: string;
  subtitle?: string;
}

interface Ticker {
  id: string;
  text: string;
}

export function CaptionsDrawerEnhanced({ 
  isOpen, 
  onClose, 
  onShowLowerThird,
  onShowTicker 
}: CaptionsDrawerEnhancedProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["lowerthird", "ticker"]);
  const [activeLowerThird, setActiveLowerThird] = useState<string | null>(null);
  const [activeTicker, setActiveTicker] = useState<string | null>(null);
  const [tickerSpeed, setTickerSpeed] = useState([50]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({ title: "", subtitle: "", text: "" });

  const [lowerThirds, setLowerThirds] = useState<LowerThird[]>([
    { id: "1", title: "Greg Bernard", subtitle: "On-Air Personality" },
    { id: "2", title: "Jane Smith", subtitle: "Co-Host" },
    { id: "3", title: "Special Guest", subtitle: "Expert Analyst" },
  ]);

  const [tickers, setTickers] = useState<Ticker[]>([
    { id: "1", text: "Follow us @SeeksyPodcast for more content!" },
    { id: "2", text: "New episodes every Tuesday and Thursday" },
    { id: "3", text: "Visit seeksy.com for exclusive content" },
  ]);

  const handleAddLowerThird = () => {
    const newItem: LowerThird = { 
      id: `lt-${Date.now()}`, 
      title: "New Title", 
      subtitle: "Subtitle" 
    };
    setLowerThirds([...lowerThirds, newItem]);
    setEditingId(newItem.id);
    setEditValue({ title: newItem.title, subtitle: newItem.subtitle || "", text: "" });
  };

  const handleAddTicker = () => {
    const newItem: Ticker = { id: `tk-${Date.now()}`, text: "New ticker text..." };
    setTickers([...tickers, newItem]);
    setEditingId(newItem.id);
    setEditValue({ title: "", subtitle: "", text: newItem.text });
  };

  const handleDeleteLowerThird = (id: string) => {
    setLowerThirds(lowerThirds.filter(lt => lt.id !== id));
    if (activeLowerThird === id) {
      setActiveLowerThird(null);
      onShowLowerThird?.(null);
    }
  };

  const handleDeleteTicker = (id: string) => {
    setTickers(tickers.filter(t => t.id !== id));
    if (activeTicker === id) {
      setActiveTicker(null);
      onShowTicker?.(null, tickerSpeed[0]);
    }
  };

  const handleSaveEdit = (type: "lowerthird" | "ticker", id: string) => {
    if (type === "lowerthird") {
      setLowerThirds(items => 
        items.map(item => 
          item.id === id 
            ? { ...item, title: editValue.title, subtitle: editValue.subtitle }
            : item
        )
      );
    } else {
      setTickers(items =>
        items.map(item =>
          item.id === id
            ? { ...item, text: editValue.text }
            : item
        )
      );
    }
    setEditingId(null);
  };

  const toggleLowerThird = (item: LowerThird) => {
    if (activeLowerThird === item.id) {
      setActiveLowerThird(null);
      onShowLowerThird?.(null);
    } else {
      setActiveLowerThird(item.id);
      onShowLowerThird?.(item);
    }
  };

  const toggleTicker = (item: Ticker) => {
    if (activeTicker === item.id) {
      setActiveTicker(null);
      onShowTicker?.(null, tickerSpeed[0]);
    } else {
      setActiveTicker(item.id);
      onShowTicker?.(item, tickerSpeed[0]);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-16 bottom-0 w-[400px] bg-[#1a1d21] border-l border-white/10 flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white">Captions</h3>
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
          {/* Lower Third Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => toggleSection("lowerthird")}
                className="flex items-center gap-2"
              >
                {expandedSections.includes("lowerthird") ? (
                  <ChevronDown className="w-4 h-4 text-white/60" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/60" />
                )}
                <span className="text-white font-medium">Lower Third</span>
                <Info className="w-3.5 h-3.5 text-white/40" />
              </button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-400 hover:text-blue-300 gap-1"
                onClick={handleAddLowerThird}
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            
            {expandedSections.includes("lowerthird") && (
              <div className="space-y-2">
                {lowerThirds.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-lg transition-all",
                      activeLowerThird === item.id
                        ? "bg-blue-500/20 border border-blue-500/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    )}
                  >
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editValue.title}
                          onChange={(e) => setEditValue({ ...editValue, title: e.target.value })}
                          placeholder="Title"
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <Input
                          value={editValue.subtitle}
                          onChange={(e) => setEditValue({ ...editValue, subtitle: e.target.value })}
                          placeholder="Subtitle (optional)"
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveEdit("lowerthird", item.id)}
                            className="gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-white/30 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-white/60 text-sm truncate">{item.subtitle}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/50 hover:text-white"
                            onClick={() => toggleLowerThird(item)}
                          >
                            {activeLowerThird === item.id ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/50 hover:text-white"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditValue({ title: item.title, subtitle: item.subtitle || "", text: "" });
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/50 hover:text-red-400"
                            onClick={() => handleDeleteLowerThird(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticker Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => toggleSection("ticker")}
                className="flex items-center gap-2"
              >
                {expandedSections.includes("ticker") ? (
                  <ChevronDown className="w-4 h-4 text-white/60" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/60" />
                )}
                <span className="text-white font-medium">Ticker</span>
                <Info className="w-3.5 h-3.5 text-white/40" />
              </button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-400 hover:text-blue-300 gap-1"
                onClick={handleAddTicker}
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>

            {/* Ticker Speed Control */}
            {expandedSections.includes("ticker") && (
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg mb-3">
                <Gauge className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-sm">Speed</span>
                <Slider
                  value={tickerSpeed}
                  onValueChange={setTickerSpeed}
                  min={10}
                  max={100}
                  step={10}
                  className="flex-1"
                />
                <span className="text-white/60 text-sm w-8">
                  {tickerSpeed[0] < 40 ? "Slow" : tickerSpeed[0] > 70 ? "Fast" : "Med"}
                </span>
              </div>
            )}
            
            {expandedSections.includes("ticker") && (
              <div className="space-y-2">
                {tickers.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-lg transition-all",
                      activeTicker === item.id
                        ? "bg-blue-500/20 border border-blue-500/50"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    )}
                  >
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editValue.text}
                          onChange={(e) => setEditValue({ ...editValue, text: e.target.value })}
                          placeholder="Ticker text..."
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveEdit("ticker", item.id)}
                            className="gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-white/30 cursor-grab shrink-0" />
                        <div className="text-white text-sm flex-1 truncate">{item.text}</div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/50 hover:text-white"
                            onClick={() => toggleTicker(item)}
                          >
                            {activeTicker === item.id ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/50 hover:text-white"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditValue({ title: "", subtitle: "", text: item.text });
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/50 hover:text-red-400"
                            onClick={() => handleDeleteTicker(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
