import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, DollarSign, TrendingUp, CheckCircle2, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdSlot {
  id: string;
  slot_type: 'pre_roll' | 'mid_roll' | 'post_roll' | 'host_read';
  timestamp_seconds: number;
  duration_seconds: number;
  host_read_script?: string;
  assigned_campaign?: {
    id: string;
    name: string;
    cpm_bid: number;
  };
  impressions_delivered: number;
  script_displayed: boolean;
  read_completed: boolean;
}

interface AdIntegrationPanelProps {
  broadcastId: string;
  adSlots: AdSlot[];
  currentTime: number;
  onDisplayScript: (slotId: string) => void;
  onCompleteRead: (slotId: string) => void;
  onSeekToAd: (timestamp: number) => void;
}

export function AdIntegrationPanel({
  broadcastId,
  adSlots,
  currentTime,
  onDisplayScript,
  onCompleteRead,
  onSeekToAd
}: AdIntegrationPanelProps) {
  const [selectedSlot, setSelectedSlot] = useState<AdSlot | null>(null);
  const [showScriptDialog, setShowScriptDialog] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const upcomingAd = adSlots.find(
    slot => slot.timestamp_seconds > currentTime && !slot.read_completed
  );

  const nextAdIn = upcomingAd 
    ? Math.max(0, upcomingAd.timestamp_seconds - currentTime)
    : null;

  const totalRevenue = adSlots.reduce((sum, slot) => {
    if (!slot.assigned_campaign) return sum;
    return sum + (slot.impressions_delivered * slot.assigned_campaign.cpm_bid / 1000);
  }, 0);

  const hostReadSlots = adSlots.filter(slot => slot.slot_type === 'host_read');
  const programmaticSlots = adSlots.filter(slot => slot.slot_type !== 'host_read');

  const handleScriptClick = (slot: AdSlot) => {
    setSelectedSlot(slot);
    setShowScriptDialog(true);
    if (!slot.script_displayed) {
      onDisplayScript(slot.id);
    }
  };

  const handleCompleteRead = () => {
    if (selectedSlot) {
      onCompleteRead(selectedSlot.id);
      setShowScriptDialog(false);
    }
  };

  return (
    <>
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Ad Integration</h3>
          </div>
          <Badge variant="outline" className="gap-1">
            <DollarSign className="h-3 w-3" />
            ${totalRevenue.toFixed(2)}
          </Badge>
        </div>

        {/* Next Ad Alert */}
        {upcomingAd && nextAdIn !== null && nextAdIn < 60 && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <span className="text-sm font-medium">
                  {upcomingAd.slot_type === 'host_read' ? 'Host Read Ad' : 'Ad Slot'} Coming Up
                </span>
              </div>
              <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/50">
                {Math.floor(nextAdIn)}s
              </Badge>
            </div>
            {upcomingAd.slot_type === 'host_read' && (
              <Button
                size="sm"
                onClick={() => handleScriptClick(upcomingAd)}
                className="w-full"
              >
                View Script
              </Button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted space-y-1">
            <div className="text-xs text-muted-foreground">Total Slots</div>
            <div className="text-xl font-bold">{adSlots.length}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted space-y-1">
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="text-xl font-bold">
              {adSlots.filter(s => s.read_completed).length}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted space-y-1">
            <div className="text-xs text-muted-foreground">Impressions</div>
            <div className="text-xl font-bold">
              {adSlots.reduce((sum, s) => sum + s.impressions_delivered, 0)}
            </div>
          </div>
        </div>

        {/* Host Read Ads */}
        {hostReadSlots.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Host-Read Ads</h4>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {hostReadSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent",
                      slot.read_completed ? "border-green-500/30 bg-green-50 dark:bg-green-950/20" : "border-border"
                    )}
                    onClick={() => onSeekToAd(slot.timestamp_seconds)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {slot.assigned_campaign?.name || 'Unassigned Slot'}
                          </span>
                          {slot.read_completed && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          At {formatTime(slot.timestamp_seconds)} • {slot.duration_seconds}s
                        </div>
                        {slot.assigned_campaign && (
                          <Badge variant="outline" className="text-xs">
                            ${slot.assigned_campaign.cpm_bid} CPM
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScriptClick(slot);
                        }}
                      >
                        Script
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Programmatic Ads */}
        {programmaticSlots.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Programmatic Ads</h4>
            <div className="space-y-1">
              {programmaticSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-2 rounded border border-border hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => onSeekToAd(slot.timestamp_seconds)}
                >
                  <div className="flex items-center gap-2">
                    <Play className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">
                      {slot.slot_type.replace('_', ' ')} • {formatTime(slot.timestamp_seconds)}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {slot.impressions_delivered}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Script Display Dialog */}
      <Dialog open={showScriptDialog} onOpenChange={setShowScriptDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Host-Read Ad Script</DialogTitle>
            <DialogDescription>
              {selectedSlot?.assigned_campaign?.name || 'Ad Script'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedSlot && (
              <>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline">
                    {formatTime(selectedSlot.timestamp_seconds)}
                  </Badge>
                  <Badge variant="outline">
                    {selectedSlot.duration_seconds}s duration
                  </Badge>
                  {selectedSlot.assigned_campaign && (
                    <Badge variant="outline">
                      ${selectedSlot.assigned_campaign.cpm_bid} CPM
                    </Badge>
                  )}
                </div>

                <ScrollArea className="h-64 w-full rounded-md border p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-base leading-relaxed">
                      {selectedSlot.host_read_script || 'No script available'}
                    </p>
                  </div>
                </ScrollArea>

                {!selectedSlot.read_completed && (
                  <div className="p-3 rounded-lg bg-muted space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark this ad as completed after reading</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScriptDialog(false)}>
              Close
            </Button>
            {selectedSlot && !selectedSlot.read_completed && (
              <Button onClick={handleCompleteRead}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
