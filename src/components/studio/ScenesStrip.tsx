import { useState } from "react";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, Reorder } from "framer-motion";

export interface Scene {
  id: string;
  name: string;
  layout: string;
  thumbnail?: string;
}

interface ScenesStripProps {
  scenes: Scene[];
  activeSceneId: string;
  onSceneSelect: (id: string) => void;
  onScenesReorder: (scenes: Scene[]) => void;
  onAddScene: () => void;
  onDeleteScene: (id: string) => void;
}

export function ScenesStrip({
  scenes,
  activeSceneId,
  onSceneSelect,
  onScenesReorder,
  onAddScene,
  onDeleteScene,
}: ScenesStripProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="h-20 border-t border-white/10 bg-black/40 flex items-center px-4 gap-3 overflow-x-auto">
      {/* Add Scene Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddScene}
        className="h-14 w-14 shrink-0 rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 flex flex-col items-center justify-center gap-1"
      >
        <Plus className="h-5 w-5 text-white/50" />
        <span className="text-[10px] text-white/50">Add</span>
      </Button>

      {/* Scenes */}
      <Reorder.Group
        axis="x"
        values={scenes}
        onReorder={onScenesReorder}
        className="flex items-center gap-3"
      >
        {scenes.map((scene, index) => (
          <Reorder.Item
            key={scene.id}
            value={scene}
            className="cursor-grab active:cursor-grabbing"
          >
            <motion.div
              onHoverStart={() => setHoveredId(scene.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => onSceneSelect(scene.id)}
              className={cn(
                "relative h-14 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                activeSceneId === scene.id
                  ? "border-blue-500 shadow-lg shadow-blue-500/30"
                  : "border-white/20 hover:border-white/40"
              )}
            >
              {/* Scene Preview */}
              <div className={cn(
                "absolute inset-0 flex items-center justify-center text-white/60",
                scene.layout === "side-by-side" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20" :
                scene.layout === "speaker-focus" ? "bg-gradient-to-r from-green-500/20 to-teal-500/20" :
                "bg-white/5"
              )}>
                <span className="text-xs font-medium">{scene.name}</span>
              </div>

              {/* Scene Number Badge */}
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                {index + 1}
              </div>

              {/* Drag Handle & Delete */}
              {hoveredId === scene.id && scenes.length > 1 && (
                <div className="absolute top-1 right-1 flex items-center gap-1">
                  <GripVertical className="h-3 w-3 text-white/40" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScene(scene.id);
                    }}
                    className="p-0.5 rounded hover:bg-red-500/30"
                  >
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </button>
                </div>
              )}

              {/* Active Indicator */}
              {activeSceneId === scene.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
              )}
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Info */}
      <div className="ml-auto shrink-0 text-xs text-white/40">
        {scenes.length} scene{scenes.length !== 1 ? "s" : ""} • Click to switch • Drag to reorder
      </div>
    </div>
  );
}
