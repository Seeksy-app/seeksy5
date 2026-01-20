import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Users, Youtube, Music, Radio, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Platform {
  enabled: boolean;
  paired: boolean;
  title: string;
  icon: string;
}

interface ChannelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platforms: Record<string, Platform>;
  onPlatformToggle: (platform: string) => void;
  onPlatformPair: (platform: string) => void;
  onToggleAll: () => void;
}

const iconMap = {
  Users,
  Youtube,
  Music,
  Radio
};

export function ChannelsDialog({
  open,
  onOpenChange,
  platforms,
  onPlatformToggle,
  onPlatformPair,
  onToggleAll
}: ChannelsDialogProps) {
  const activeCount = Object.values(platforms).filter(p => p.enabled).length;
  const totalCount = Object.values(platforms).length;
  const allEnabled = activeCount === totalCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Add channels</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose destinations and customize stream details.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                <span className="font-semibold">{activeCount}</span> of{" "}
                <span className="font-semibold">{totalCount}</span> active.
              </span>
              <Button variant="link" size="sm" className="p-0 h-auto text-blue-600">
                ✏️ Update Titles
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Toggle all</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleAll}
                className={cn(
                  "font-semibold",
                  allEnabled ? "text-foreground" : "text-muted-foreground"
                )}
              >
                OFF
              </Button>
              <span className="text-muted-foreground">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleAll}
                className={cn(
                  "font-semibold",
                  allEnabled ? "text-blue-600" : "text-muted-foreground"
                )}
              >
                ON
              </Button>
            </div>
          </div>

          {/* Channel List */}
          <div className="space-y-3">
            {Object.entries(platforms).map(([key, platform]) => {
              const Icon = iconMap[platform.icon as keyof typeof iconMap] || Radio;
              const isPaired = platform.paired;

              return (
                <div
                  key={key}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{platform.title}</h3>
                      {key !== 'myPage' && !isPaired && (
                        <Badge variant="outline" className="text-xs">
                          Not paired
                        </Badge>
                      )}
                      {isPaired && key !== 'myPage' && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isPaired || key === 'myPage'
                        ? `Live with Seeksy, ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                        : "Channel doesn't support custom titles."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {key !== 'myPage' && !isPaired && (
                      <Button
                        onClick={() => onPlatformPair(key)}
                        variant="outline"
                        size="sm"
                      >
                        Pair
                      </Button>
                    )}
                    {key !== 'myPage' && isPaired && (
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        Edit
                      </Button>
                    )}
                    <Switch
                      checked={platform.enabled}
                      onCheckedChange={() => onPlatformToggle(key)}
                      disabled={key !== 'myPage' && !isPaired}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Channels Button */}
          <Button
            variant="outline"
            className="w-full border-2 border-dashed border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Channels
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
