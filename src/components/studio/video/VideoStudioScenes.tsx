import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, MoreVertical, User, Users, LayoutGrid,
  Presentation, PictureInPicture
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SceneLayout = "host-only" | "side-by-side" | "grid" | "presentation" | "pip";

interface Scene {
  id: string;
  name: string;
  layout: SceneLayout;
  thumbnail?: string;
}

interface VideoStudioScenesProps {
  scenes: Scene[];
  activeSceneId: string;
  onSceneSelect: (id: string) => void;
  onAddScene: () => void;
  onSceneMenu: (id: string) => void;
}

const layoutIcons: Record<SceneLayout, typeof User> = {
  "host-only": User,
  "side-by-side": Users,
  "grid": LayoutGrid,
  "presentation": Presentation,
  "pip": PictureInPicture,
};

export function VideoStudioScenes({
  scenes,
  activeSceneId,
  onSceneSelect,
  onAddScene,
  onSceneMenu,
}: VideoStudioScenesProps) {
  return (
    <aside className="w-32 bg-[#16181c] border-r border-white/10 flex flex-col">
      {/* Add Scene Button */}
      <div className="p-2">
        <Button 
          onClick={onAddScene}
          variant="outline"
          size="sm"
          className="w-full border-white/20 text-white hover:bg-white/10 gap-1 text-xs"
        >
          <Plus className="w-3 h-3" />
          Add Scene
        </Button>
      </div>

      {/* Scene List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {scenes.map((scene) => {
          const Icon = layoutIcons[scene.layout] || User;
          const isActive = scene.id === activeSceneId;
          
          return (
            <div
              key={scene.id}
              onClick={() => onSceneSelect(scene.id)}
              className={cn(
                "relative group cursor-pointer rounded-lg overflow-hidden",
                "border-2 transition-all",
                isActive 
                  ? "border-blue-500" 
                  : "border-transparent hover:border-white/30"
              )}
            >
              {/* Scene Thumbnail */}
              <div className={cn(
                "aspect-video relative",
                "bg-gradient-to-br from-indigo-900/80 to-purple-900/80"
              )}>
                {/* Scene Name Badge */}
                <div className={cn(
                  "absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                  isActive ? "bg-blue-500 text-white" : "bg-black/50 text-white/80"
                )}>
                  {scene.name}
                </div>
                
                {/* Layout Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/40 rounded-lg p-2">
                    <Icon className="w-5 h-5 text-white/70" />
                  </div>
                </div>

                {/* Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSceneMenu(scene.id);
                  }}
                  className={cn(
                    "absolute top-1 right-1 h-5 w-5",
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    "bg-black/50 hover:bg-black/70 text-white"
                  )}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
