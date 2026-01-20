import { ScenesPanel } from "@/components/studio/video/ScenesPanel";
import { RecordingStatusHeader } from "@/components/studio/video/RecordingStatusHeader";
import { StudioSettingsDrawer } from "@/components/studio/video/StudioSettingsDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, Square, Video, Wifi } from "lucide-react";

export default function LiveStudio() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Radio className="w-6 h-6 text-red-500" />
              <div>
                <h1 className="text-xl font-bold">Live Streaming Studio</h1>
                <p className="text-sm text-muted-foreground">
                  Broadcast to multiple platforms simultaneously
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RecordingStatusHeader />
              <StudioSettingsDrawer />
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Sidebar - Scenes */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <ScenesPanel />
          
          {/* Stream Destinations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stream Destinations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">YouTube</span>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">Twitch</span>
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Add Destination
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Center - Video Preview */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Video Canvas */}
          <div className="flex-1 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-pink-500/5" />
            <div className="relative text-center space-y-4">
              <Radio className="w-16 h-16 text-muted-foreground/50 mx-auto" />
              <div>
                <p className="text-lg font-medium text-muted-foreground">Live Preview</p>
                <p className="text-sm text-muted-foreground/70">
                  Your live stream will appear here
                </p>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon">
                <Wifi className="w-5 h-5" />
              </Button>
              <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700">
                <Radio className="w-5 h-5" />
                Go Live
              </Button>
              <Button variant="outline">
                <Square className="w-4 h-4 mr-2" />
                End Stream
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Stream Info */}
        <div className="w-80 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stream Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Stream Title</Label>
                <Input placeholder="Enter stream title..." />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Enter description..." />
              </div>
              <div className="space-y-2">
                <Label>RTMP URL</Label>
                <Input placeholder="rtmp://..." />
              </div>
              <div className="space-y-2">
                <Label>Stream Key</Label>
                <Input type="password" placeholder="Enter stream key..." />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
