import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, Users, LayoutGrid, Monitor, Presentation, Maximize } from "lucide-react";

export type ScenePreset = 
  | "host-only" 
  | "interview" 
  | "side-by-side" 
  | "grid" 
  | "presentation" 
  | "spotlight";

interface SceneConfig {
  id: ScenePreset;
  label: string;
  icon: React.ElementType;
  description: string;
}

const scenes: SceneConfig[] = [
  { id: "host-only", label: "Host Only", icon: User, description: "Single speaker view" },
  { id: "interview", label: "Interview", icon: Users, description: "Host + Guest layout" },
  { id: "side-by-side", label: "Side by Side", icon: LayoutGrid, description: "Equal split view" },
  { id: "grid", label: "Grid", icon: Maximize, description: "Multiple speakers" },
  { id: "presentation", label: "Presentation", icon: Presentation, description: "Screen share focus" },
  { id: "spotlight", label: "Spotlight", icon: Monitor, description: "Active speaker" },
];

interface ScenePresetsProps {
  currentScene: ScenePreset;
  onSceneChange: (scene: ScenePreset) => void;
  participantCount: number;
}

export function ScenePresets({ currentScene, onSceneChange, participantCount }: ScenePresetsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Scene Layout</h4>
        <span className="text-xs text-white/50">{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => onSceneChange(scene.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
              currentScene === scene.id
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:border-white/10"
            )}
          >
            <scene.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{scene.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
