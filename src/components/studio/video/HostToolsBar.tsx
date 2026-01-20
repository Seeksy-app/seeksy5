import { Button } from "@/components/ui/button";
import { FileText, Scissors, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface HostToolsBarProps {
  activeDrawer: "script" | "clip" | "ad" | null;
  onOpenScript: () => void;
  onAddClipMarker: () => void;
  onAddAdMarker: () => void;
}

export function HostToolsBar({
  activeDrawer,
  onOpenScript,
  onAddClipMarker,
  onAddAdMarker,
}: HostToolsBarProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 bg-[#1a1d21]/80 backdrop-blur-sm rounded-xl border border-white/10">
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenScript}
        className={cn(
          "h-11 px-5 rounded-lg gap-2.5 transition-all font-medium",
          activeDrawer === "script"
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-[#2a3441] text-white hover:bg-[#3a4451] border border-white/10"
        )}
      >
        <FileText className="w-4 h-4" />
        Host Script
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddClipMarker}
        className="h-11 px-5 rounded-lg gap-2.5 bg-green-600/90 text-white hover:bg-green-600 border border-green-500/30 font-medium"
      >
        <Scissors className="w-4 h-4" />
        Clip Marker
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddAdMarker}
        className="h-11 px-5 rounded-lg gap-2.5 bg-amber-500/90 text-black hover:bg-amber-500 border border-amber-400/30 font-medium"
      >
        <Tag className="w-4 h-4" />
        Ad Marker
      </Button>
    </div>
  );
}
