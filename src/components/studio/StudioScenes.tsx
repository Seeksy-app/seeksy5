import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, User, Film, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type SceneLayout = "both-speakers" | "single-speaker" | "play-video" | "screen-share";

export interface Scene {
  id: string;
  name: string;
  layout: SceneLayout;
  videoUrl?: string;
  speakerPosition?: "left" | "right";
}

interface StudioScenesProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSceneChange: (sceneId: string) => void;
  onScenesUpdate: (scenes: Scene[]) => void;
  mediaFiles: any[];
}

export function StudioScenes({ 
  scenes, 
  activeSceneId, 
  onSceneChange, 
  onScenesUpdate,
  mediaFiles 
}: StudioScenesProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneLayout, setNewSceneLayout] = useState<SceneLayout>("both-speakers");
  const [newSceneVideo, setNewSceneVideo] = useState("");
  const [newSceneSpeakerPosition, setNewSceneSpeakerPosition] = useState<"left" | "right">("left");

  const getLayoutIcon = (layout: SceneLayout) => {
    switch (layout) {
      case "both-speakers": return <Users className="h-4 w-4" />;
      case "single-speaker": return <User className="h-4 w-4" />;
      case "play-video": return <Film className="h-4 w-4" />;
      default: return null;
    }
  };

  const getLayoutLabel = (layout: SceneLayout) => {
    switch (layout) {
      case "both-speakers": return "Both Speakers";
      case "single-speaker": return "Single Speaker";
      case "play-video": return "Play Video";
      case "screen-share": return "Screen Share";
      default: return layout;
    }
  };

  const handleCreateScene = () => {
    if (!newSceneName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the scene",
        variant: "destructive",
      });
      return;
    }

    if (newSceneLayout === "play-video" && !newSceneVideo) {
      toast({
        title: "Video required",
        description: "Please select a video for this scene",
        variant: "destructive",
      });
      return;
    }

    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: newSceneName.trim(),
      layout: newSceneLayout,
      videoUrl: newSceneLayout === "play-video" ? newSceneVideo : undefined,
      speakerPosition: newSceneLayout === "single-speaker" ? newSceneSpeakerPosition : undefined,
    };

    onScenesUpdate([...scenes, newScene]);
    setShowCreateDialog(false);
    setNewSceneName("");
    setNewSceneLayout("both-speakers");
    setNewSceneVideo("");
    setNewSceneSpeakerPosition("left");

    toast({
      title: "Scene created",
      description: `"${newScene.name}" is ready to use`,
    });
  };

  const handleDeleteScene = (sceneId: string) => {
    onScenesUpdate(scenes.filter(s => s.id !== sceneId));
    toast({
      title: "Scene deleted",
      description: "The scene has been removed",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Scenes</CardTitle>
        <Button 
          size="sm" 
          onClick={() => setShowCreateDialog(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 h-8"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {scenes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No scenes created yet. Create your first scene to get started.
          </p>
        ) : (
          scenes.map(scene => (
            <div
              key={scene.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer hover:border-primary/50 ${
                activeSceneId === scene.id 
                  ? "border-primary bg-primary/10" 
                  : "border-border/50 bg-muted/30"
              }`}
              onClick={() => onSceneChange(scene.id)}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  {getLayoutIcon(scene.layout)}
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-sm truncate block">{scene.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {getLayoutLabel(scene.layout)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteScene(scene.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Scene</DialogTitle>
            <DialogDescription>
              Set up a scene layout that you can switch to during your stream
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scene-name">Scene Name</Label>
              <Input
                id="scene-name"
                placeholder="e.g., Opening, Interview, Outro"
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Layout Type</Label>
              <Select value={newSceneLayout} onValueChange={(v) => setNewSceneLayout(v as SceneLayout)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both-speakers">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Both Speakers
                    </div>
                  </SelectItem>
                  <SelectItem value="single-speaker">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Single Speaker
                    </div>
                  </SelectItem>
                  <SelectItem value="play-video">
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4" />
                      Play Video
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newSceneLayout === "single-speaker" && (
              <div className="space-y-2">
                <Label>Speaker Position</Label>
                <Select value={newSceneSpeakerPosition} onValueChange={(v) => setNewSceneSpeakerPosition(v as "left" | "right")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left Side</SelectItem>
                    <SelectItem value="right">Right Side</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {newSceneLayout === "play-video" && (
              <div className="space-y-2">
                <Label>Select Video</Label>
                <Select value={newSceneVideo} onValueChange={setNewSceneVideo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from Media Library" />
                  </SelectTrigger>
                  <SelectContent>
                    {mediaFiles.map(file => (
                      <SelectItem key={file.id} value={file.file_url}>
                        {file.file_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateScene} className="flex-1">
                Create Scene
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
