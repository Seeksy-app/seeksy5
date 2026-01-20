import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, MoreVertical, User, Users, 
  LayoutGrid, Monitor, Eye, GripVertical,
  Video, Image, Timer, ChevronDown, Pencil, Check, X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SceneLayout = "host-only" | "host-guest" | "side-by-side" | "grid" | "speaker" | "screen-share" | "media" | "countdown";
export type SceneType = "camera" | "media" | "countdown";

export interface Scene {
  id: string;
  name: string;
  layout: SceneLayout;
  sceneType?: SceneType;
  thumbnail?: string;
  mediaId?: string;
  countdownSeconds?: number;
}

interface VideoStudioScenesResizableProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  onAddScene: (type?: SceneType) => void;
  onSceneMenu: (sceneId: string) => void;
  onDeleteScene?: (sceneId: string) => void;
  onRenameScene?: (sceneId: string, name: string) => void;
  onReorderScenes?: (scenes: Scene[]) => void;
}

const layoutIcons: Record<SceneLayout, typeof User> = {
  "host-only": User,
  "host-guest": Users,
  "side-by-side": LayoutGrid,
  "grid": LayoutGrid,
  "speaker": Eye,
  "screen-share": Monitor,
  "media": Image,
  "countdown": Timer,
};

const sceneTypeIcons: Record<SceneType, typeof Video> = {
  camera: Video,
  media: Image,
  countdown: Timer,
};

export function VideoStudioScenesResizable({
  scenes,
  activeSceneId,
  onSceneSelect,
  onAddScene,
  onSceneMenu,
  onDeleteScene,
  onRenameScene,
  onReorderScenes,
}: VideoStudioScenesResizableProps) {
  const [width, setWidth] = useState(220);
  const [isResizing, setIsResizing] = useState(false);
  const [draggedScene, setDraggedScene] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = width;
    
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 180), 320);
      setWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    setDraggedScene(sceneId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetSceneId: string) => {
    e.preventDefault();
    if (!draggedScene || draggedScene === targetSceneId) return;
    
    const draggedIndex = scenes.findIndex(s => s.id === draggedScene);
    const targetIndex = scenes.findIndex(s => s.id === targetSceneId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newScenes = [...scenes];
    const [removed] = newScenes.splice(draggedIndex, 1);
    newScenes.splice(targetIndex, 0, removed);
    
    onReorderScenes?.(newScenes);
    setDraggedScene(null);
  };

  const handleDragEnd = () => {
    setDraggedScene(null);
  };

  const startEditing = (sceneId: string, currentName: string) => {
    setEditingSceneId(sceneId);
    setEditingName(currentName);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveEdit = () => {
    if (editingSceneId && editingName.trim()) {
      onRenameScene?.(editingSceneId, editingName.trim());
    }
    setEditingSceneId(null);
    setEditingName("");
  };

  const cancelEdit = () => {
    setEditingSceneId(null);
    setEditingName("");
  };

  const getSceneTypeColor = (type?: SceneType) => {
    switch (type) {
      case "camera": return "from-indigo-600/40 to-purple-600/40";
      case "media": return "from-green-600/40 to-emerald-600/40";
      case "countdown": return "from-orange-600/40 to-red-600/40";
      default: return "from-indigo-600/40 to-purple-600/40";
    }
  };

  return (
    <div 
      className="bg-[#16181c] border-r border-white/10 flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10",
          isResizing && "bg-primary"
        )}
      />

      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Scenes</span>
          <span className="text-[10px] text-white/40">{scenes.length} total</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white h-9"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Scene
              </span>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-52 bg-[#1a1d21] border-white/10"
          >
            <DropdownMenuItem 
              onClick={() => onAddScene("camera")}
              className="flex items-center gap-3 py-2.5 cursor-pointer text-white hover:bg-white/10 focus:bg-white/10"
            >
              <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center">
                <Video className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="font-medium text-sm">Camera</div>
                <div className="text-[10px] text-white/50">Live video source</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddScene("media")}
              className="flex items-center gap-3 py-2.5 cursor-pointer text-white hover:bg-white/10 focus:bg-white/10"
            >
              <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                <Image className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <div className="font-medium text-sm">Media</div>
                <div className="text-[10px] text-white/50">Video, image, or GIF</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAddScene("countdown")}
              className="flex items-center gap-3 py-2.5 cursor-pointer text-white hover:bg-white/10 focus:bg-white/10"
            >
              <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center">
                <Timer className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <div className="font-medium text-sm">Countdown</div>
                <div className="text-[10px] text-white/50">Timer overlay</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Scene List */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {scenes.map((scene, index) => {
          const isActive = scene.id === activeSceneId;
          const LayoutIcon = layoutIcons[scene.layout] || User;
          const TypeIcon = scene.sceneType ? sceneTypeIcons[scene.sceneType] : Video;
          const isEditing = editingSceneId === scene.id;

          return (
            <div
              key={scene.id}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, scene.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, scene.id)}
              onDragEnd={handleDragEnd}
              onClick={() => !isEditing && onSceneSelect(scene.id)}
              className={cn(
                "group relative rounded-lg overflow-hidden cursor-pointer transition-all",
                isActive 
                  ? "ring-2 ring-primary shadow-lg shadow-primary/20" 
                  : "hover:ring-1 hover:ring-white/30",
                draggedScene === scene.id && "opacity-50 scale-95"
              )}
            >
              {/* Scene Number Badge */}
              <div className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded bg-black/60 flex items-center justify-center text-[10px] font-bold text-white/80">
                {index + 1}
              </div>

              {/* Scene Thumbnail */}
              <div className={cn(
                "aspect-video bg-gradient-to-br relative",
                getSceneTypeColor(scene.sceneType)
              )}>
                {/* Drag Handle */}
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab z-10">
                  <GripVertical className="w-4 h-4 text-white/60" />
                </div>

                {/* Scene Type Icon Badge */}
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white/80 flex items-center gap-1">
                  <TypeIcon className="w-3 h-3" />
                  <span className="capitalize">{scene.sceneType || "camera"}</span>
                </div>

                {/* Layout Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-3 rounded-xl bg-black/30 backdrop-blur-sm">
                    <LayoutIcon className="w-6 h-6 text-white/50" />
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-1.5 right-7 flex items-center gap-1 px-1.5 py-0.5 bg-green-500/80 rounded text-[9px] font-semibold text-white">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                )}

                {/* Menu Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-1.5 right-1.5 p-1 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <MoreVertical className="w-3.5 h-3.5 text-white" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1d21] border-white/10">
                    <DropdownMenuItem 
                      className="text-white hover:bg-white/10 cursor-pointer gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(scene.id, scene.name);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-white hover:bg-white/10 cursor-pointer gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSceneMenu(scene.id);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-400 hover:bg-white/10 cursor-pointer gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScene?.(scene.id);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Scene Name */}
              <div className="p-2 bg-black/50">
                {isEditing ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      ref={inputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="h-6 text-xs bg-white/10 border-white/20 text-white px-1.5"
                    />
                    <button onClick={saveEdit} className="p-0.5 hover:bg-white/10 rounded">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    </button>
                    <button onClick={cancelEdit} className="p-0.5 hover:bg-white/10 rounded">
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white font-medium truncate flex-1">{scene.name}</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(scene.id, scene.name);
                      }}
                      className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-opacity"
                    >
                      <Pencil className="w-3 h-3 text-white/50" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
