import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Film, Clock, Monitor } from "lucide-react";

interface SceneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectScene: (type: 'camera' | 'media' | 'countdown' | 'screen') => void;
}

export function SceneDialog({ open, onOpenChange, onSelectScene }: SceneDialogProps) {
  const sceneTypes = [
    {
      id: 'camera',
      icon: Camera,
      label: 'Camera',
      description: 'Add your camera as a scene'
    },
    {
      id: 'media',
      icon: Film,
      label: 'Media',
      description: 'Add video, slides, or images'
    },
    {
      id: 'countdown',
      icon: Clock,
      label: 'Countdown',
      description: 'Add a countdown timer'
    },
    {
      id: 'screen',
      icon: Monitor,
      label: 'Screen',
      description: 'Share your screen'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Scene</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {sceneTypes.map((scene) => {
            const Icon = scene.icon;
            return (
              <Card
                key={scene.id}
                className="p-6 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => {
                  onSelectScene(scene.id as any);
                  onOpenChange(false);
                }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{scene.label}</h3>
                    <p className="text-xs text-muted-foreground">{scene.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
