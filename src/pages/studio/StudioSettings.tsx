import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Mic, Video, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudioSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    autoSave: true,
    notifications: true,
    quality: "high",
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your Studio preferences have been updated",
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container max-w-4xl mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Studio Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your recording preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              <CardTitle>Audio Settings</CardTitle>
            </div>
            <CardDescription>
              Configure microphone and audio recording preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-save">Auto-save recordings</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save recordings every 5 minutes
                </p>
              </div>
              <Switch
                id="auto-save"
                checked={settings.autoSave}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoSave: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Recording Quality</Label>
              <Select
                value={settings.quality}
                onValueChange={(value) =>
                  setSettings({ ...settings, quality: value })
                }
              >
                <SelectTrigger id="quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (128 kbps)</SelectItem>
                  <SelectItem value="high">High (256 kbps)</SelectItem>
                  <SelectItem value="studio">Studio (320 kbps)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <CardTitle>Video Settings</CardTitle>
            </div>
            <CardDescription>
              Configure video recording preferences (coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Video recording settings will be available when video features launch.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Manage Studio notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Enable notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for recording status and errors
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notifications: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <SettingsIcon className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
