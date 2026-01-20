import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Star, MessageSquareQuote, TrendingUp, Flame, Laugh, Pin, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarkerType {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  shortcut?: string;
}

export const markerTypes: MarkerType[] = [
  { id: "highlight", label: "Highlight", icon: Star, color: "text-amber-400", shortcut: "1" },
  { id: "quote", label: "Great Quote", icon: MessageSquareQuote, color: "text-blue-400", shortcut: "2" },
  { id: "ad-break", label: "Ad Break", icon: TrendingUp, color: "text-green-400", shortcut: "3" },
  { id: "viral", label: "Viral Moment", icon: Flame, color: "text-orange-400", shortcut: "4" },
  { id: "funny", label: "Funny Moment", icon: Laugh, color: "text-pink-400", shortcut: "5" },
  { id: "topic", label: "Topic Change", icon: Pin, color: "text-purple-400", shortcut: "6" },
];

interface MarkerButtonProps {
  onAddMarker: (type: MarkerType, timestamp: number) => void;
  currentTime: number;
  disabled?: boolean;
}

export function MarkerButton({ onAddMarker, currentTime, disabled }: MarkerButtonProps) {
  const [open, setOpen] = useState(false);

  const handleAddMarker = (marker: MarkerType) => {
    onAddMarker(marker, currentTime);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-10 px-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
            "text-white/80 hover:text-white transition-all"
          )}
        >
          <Bookmark className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Mark</span>
          <kbd className="hidden md:inline ml-2 px-1.5 py-0.5 text-[10px] bg-white/10 rounded text-white/50">M</kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-2 bg-[#1a1f2e]/95 backdrop-blur-xl border-white/10"
        align="center"
        side="top"
      >
        <div className="space-y-1">
          <p className="text-xs text-white/50 px-2 pb-2">Add marker at current time</p>
          {markerTypes.map((marker) => (
            <button
              key={marker.id}
              onClick={() => handleAddMarker(marker)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "hover:bg-white/10 transition-colors text-left group"
              )}
            >
              <marker.icon className={cn("w-4 h-4", marker.color)} />
              <span className="flex-1 text-sm text-white/80 group-hover:text-white">
                {marker.label}
              </span>
              {marker.shortcut && (
                <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 rounded text-white/40">
                  {marker.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
