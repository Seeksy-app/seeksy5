import { ScrollArea } from "@/components/ui/scroll-area";
import { Scene, StudioScenes } from "./StudioScenes";

interface StudioLeftSidebarProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSceneChange: (sceneId: string) => void;
  onScenesUpdate: (scenes: Scene[]) => void;
  mediaFiles: any[];
}

export function StudioLeftSidebar({
  scenes,
  activeSceneId,
  onSceneChange,
  onScenesUpdate,
  mediaFiles,
}: StudioLeftSidebarProps) {
  return (
    <div className="w-full border-r border-border/50 bg-background/50 backdrop-blur-sm flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <StudioScenes
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSceneChange={onSceneChange}
          onScenesUpdate={onScenesUpdate}
          mediaFiles={mediaFiles}
        />
      </ScrollArea>
    </div>
  );
}
