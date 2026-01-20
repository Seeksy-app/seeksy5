import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

export const StudioSettingsDrawer = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Studio Settings</SheetTitle>
          <SheetDescription>
            Configure your recording preferences
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Video Resolution */}
          <div className="space-y-2">
            <Label>Video Resolution</Label>
            <Select defaultValue="1080p">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="720p">720p HD</SelectItem>
                <SelectItem value="1080p">1080p Full HD</SelectItem>
                <SelectItem value="4k">4K Ultra HD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Camera Device */}
          <div className="space-y-2">
            <Label>Camera</Label>
            <Select defaultValue="default">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Camera</SelectItem>
                <SelectItem value="external">External Camera</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audio Source */}
          <div className="space-y-2">
            <Label>Microphone</Label>
            <Select defaultValue="default">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Microphone</SelectItem>
                <SelectItem value="external">External Microphone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Background Blur */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Background Blur</Label>
              <p className="text-xs text-muted-foreground">
                Coming soon
              </p>
            </div>
            <Switch disabled />
          </div>

          {/* Teleprompter */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Teleprompter</Label>
              <p className="text-xs text-muted-foreground">
                Coming soon
              </p>
            </div>
            <Switch disabled />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
