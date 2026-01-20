import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings, Monitor, Timer, MousePointer, Navigation, Play } from "lucide-react";

export interface DemoRecorderSettingsData {
  scrollSpeed: number; // 1-10, 5 = medium
  resolution: "1080p" | "720p" | "480p";
  defaultDuration: number; // seconds
  hideCursor: boolean;
  hideNavigation: boolean;
  autoStartNext: boolean;
}

interface DemoRecorderSettingsProps {
  settings: DemoRecorderSettingsData;
  onSettingsChange: (settings: DemoRecorderSettingsData) => void;
}

export const defaultDemoRecorderSettings: DemoRecorderSettingsData = {
  scrollSpeed: 5,
  resolution: "1080p",
  defaultDuration: 15,
  hideCursor: false,
  hideNavigation: false,
  autoStartNext: false,
};

export function DemoRecorderSettings({ settings, onSettingsChange }: DemoRecorderSettingsProps) {
  const [open, setOpen] = useState(false);

  const handleChange = <K extends keyof DemoRecorderSettingsData>(
    key: K,
    value: DemoRecorderSettingsData[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Recording Settings
          </SheetTitle>
          <SheetDescription>
            Configure how demo videos are captured
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Scroll Speed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Auto-Scroll Speed
              </Label>
              <span className="text-sm text-muted-foreground">
                {settings.scrollSpeed === 1 ? "Very Slow" :
                 settings.scrollSpeed <= 3 ? "Slow" :
                 settings.scrollSpeed <= 6 ? "Medium" :
                 settings.scrollSpeed <= 8 ? "Fast" : "Very Fast"}
              </span>
            </div>
            <Slider
              value={[settings.scrollSpeed]}
              onValueChange={([value]) => handleChange("scrollSpeed", value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls how fast pages auto-scroll during recording
            </p>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Resolution
            </Label>
            <Select
              value={settings.resolution}
              onValueChange={(v) => handleChange("resolution", v as DemoRecorderSettingsData["resolution"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1080p">1080p (1920×1080) - Recommended</SelectItem>
                <SelectItem value="720p">720p (1280×720) - Smaller files</SelectItem>
                <SelectItem value="480p">480p (854×480) - Fastest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Default Duration
              </Label>
              <span className="text-sm text-muted-foreground">
                {settings.defaultDuration}s
              </span>
            </div>
            <Slider
              value={[settings.defaultDuration]}
              onValueChange={([value]) => handleChange("defaultDuration", value)}
              min={5}
              max={60}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Override preset-recommended durations
            </p>
          </div>

          {/* Toggle Options */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="hide-cursor" className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Hide Cursor
              </Label>
              <Switch
                id="hide-cursor"
                checked={settings.hideCursor}
                onCheckedChange={(checked) => handleChange("hideCursor", checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Remove cursor from recordings (experimental)
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="hide-nav" className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Hide Navigation
              </Label>
              <Switch
                id="hide-nav"
                checked={settings.hideNavigation}
                onCheckedChange={(checked) => handleChange("hideNavigation", checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Hide sidebar/nav during capture (coming soon)
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-next" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Auto-Start Next Scene
              </Label>
              <Switch
                id="auto-next"
                checked={settings.autoStartNext}
                onCheckedChange={(checked) => handleChange("autoStartNext", checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Automatically start recording next scene after saving
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
