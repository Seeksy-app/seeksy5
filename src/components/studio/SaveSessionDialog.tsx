import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, LayoutTemplate, Video, Loader2 } from "lucide-react";

interface SaveSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  onSave: (options: SaveOptions) => Promise<void>;
  isLoading?: boolean;
}

export interface SaveOptions {
  name: string;
  saveAsRecording: boolean;
  saveAsTemplate: boolean;
}

export function SaveSessionDialog({
  open,
  onOpenChange,
  defaultName,
  onSave,
  isLoading = false,
}: SaveSessionDialogProps) {
  const [name, setName] = useState(defaultName);
  const [saveAsRecording, setSaveAsRecording] = useState(true);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const handleSave = async () => {
    if (!saveAsRecording && !saveAsTemplate) return;
    await onSave({
      name: name.trim() || defaultName,
      saveAsRecording,
      saveAsTemplate,
    });
  };

  const canSave = (saveAsRecording || saveAsTemplate) && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Save Your Session
          </DialogTitle>
          <DialogDescription>
            Choose how you want to save this session. You can save it as a recording, a reusable template, or both.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Session Name */}
          <div className="space-y-2">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this session"
            />
          </div>

          {/* Save Options */}
          <div className="space-y-3">
            <Label>Save Options</Label>
            
            {/* Recording Option */}
            <Card 
              className={`cursor-pointer transition-all ${saveAsRecording ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/50'}`}
              onClick={() => setSaveAsRecording(!saveAsRecording)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={saveAsRecording} 
                    onCheckedChange={(checked) => setSaveAsRecording(!!checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-red-500" />
                      <CardTitle className="text-sm font-medium">Save as Recording</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Save the captured video/audio. Appears under "Recordings" in your Studio.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Template Option */}
            <Card 
              className={`cursor-pointer transition-all ${saveAsTemplate ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/50'}`}
              onClick={() => setSaveAsTemplate(!saveAsTemplate)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={saveAsTemplate} 
                    onCheckedChange={(checked) => setSaveAsTemplate(!!checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-purple-500" />
                      <CardTitle className="text-sm font-medium">Save as Template</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Save the studio setup (branding, overlays, settings) to reuse for future sessions.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Info */}
          {!saveAsRecording && !saveAsTemplate && (
            <p className="text-sm text-destructive">
              Please select at least one save option.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
