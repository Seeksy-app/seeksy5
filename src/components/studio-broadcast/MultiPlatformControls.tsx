import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Radio, Youtube, Music, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Platform {
  id: string;
  name: string;
  icon: any;
  enabled: boolean;
  isLive: boolean;
  streamKey?: string;
  viewerCount?: number;
}

interface MultiPlatformControlsProps {
  isLive: boolean;
  audioOnlyMode: boolean;
  platforms: {
    myPage: boolean;
    youtube: boolean;
    spotify: boolean;
  };
  onPlatformToggle: (platform: keyof MultiPlatformControlsProps['platforms']) => void;
  onAudioModeToggle: () => void;
  onGoLive: () => void;
  onStopBroadcast: () => void;
}

export function MultiPlatformControls({
  isLive,
  audioOnlyMode,
  platforms,
  onPlatformToggle,
  onAudioModeToggle,
  onGoLive,
  onStopBroadcast
}: MultiPlatformControlsProps) {
  const [showStreamKeys, setShowStreamKeys] = useState(false);

  const platformConfig: Platform[] = [
    {
      id: 'myPage',
      name: 'My Page',
      icon: Users,
      enabled: platforms.myPage,
      isLive: isLive && platforms.myPage,
      viewerCount: 0
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: Youtube,
      enabled: platforms.youtube,
      isLive: isLive && platforms.youtube,
      viewerCount: 0
    },
    {
      id: 'spotify',
      name: 'Spotify',
      icon: Music,
      enabled: platforms.spotify,
      isLive: isLive && platforms.spotify,
      viewerCount: 0
    }
  ];

  const totalViewers = platformConfig
    .filter(p => p.isLive)
    .reduce((sum, p) => sum + (p.viewerCount || 0), 0);

  const enabledCount = Object.values(platforms).filter(Boolean).length;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Multi-Platform Broadcasting</h3>
          <p className="text-sm text-muted-foreground">
            {enabledCount} platform{enabledCount !== 1 ? 's' : ''} selected
          </p>
        </div>
        {isLive && (
          <Badge variant="destructive" className="animate-pulse">
            <Radio className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
        )}
      </div>

      {/* Platform Toggles */}
      <div className="space-y-3">
        {platformConfig.map((platform) => {
          const Icon = platform.icon;
          return (
            <div
              key={platform.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                platform.enabled ? "bg-primary/5 border-primary/20" : "border-border"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  platform.enabled ? "bg-primary/10" : "bg-muted"
                )}>
                  <Icon className={cn(
                    "h-5 w-5",
                    platform.enabled ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{platform.name}</span>
                    {platform.isLive && (
                      <Badge variant="outline" className="h-5">
                        <Radio className="h-2 w-2 mr-1 text-red-500" />
                        Live
                      </Badge>
                    )}
                  </div>
                  {platform.isLive && platform.viewerCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {platform.viewerCount} viewer{platform.viewerCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <Switch
                checked={platform.enabled}
                onCheckedChange={() => onPlatformToggle(platform.id as keyof typeof platforms)}
                disabled={isLive}
              />
            </div>
          );
        })}
      </div>

      {/* Audio Only Mode */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <Music className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label htmlFor="audio-only">Audio Only Mode</Label>
            <p className="text-xs text-muted-foreground">Stream audio without video</p>
          </div>
        </div>
        <Switch
          id="audio-only"
          checked={audioOnlyMode}
          onCheckedChange={onAudioModeToggle}
          disabled={isLive}
        />
      </div>

      {/* Stream Keys (expandable) */}
      {!isLive && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowStreamKeys(!showStreamKeys)}
        >
          {showStreamKeys ? 'Hide' : 'Show'} Stream Keys
        </Button>
      )}

      {showStreamKeys && !isLive && (
        <div className="space-y-3 pt-2 border-t border-border">
          {platformConfig.filter(p => p.enabled && p.id !== 'myPage').map((platform) => (
            <div key={platform.id} className="space-y-2">
              <Label className="text-xs">{platform.name} Stream Key</Label>
              <Input
                type="password"
                placeholder={`Enter ${platform.name} stream key...`}
                className="font-mono text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {/* Go Live / Stop Controls */}
      <div className="pt-2 border-t border-border space-y-2">
        {!isLive ? (
          <Button
            onClick={onGoLive}
            disabled={enabledCount === 0}
            className="w-full bg-red-600 hover:bg-red-700"
            size="lg"
          >
            <Radio className="h-5 w-5 mr-2" />
            GO LIVE
          </Button>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-red-600 animate-pulse" />
                <span className="text-sm font-medium">Broadcasting Live</span>
              </div>
              <Badge variant="outline">
                <Globe className="h-3 w-3 mr-1" />
                {totalViewers} viewers
              </Badge>
            </div>
            <Button
              onClick={onStopBroadcast}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              STOP BROADCAST
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
