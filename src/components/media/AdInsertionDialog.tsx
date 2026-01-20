import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

interface AdSlot {
  id: string;
  slotType: 'pre_roll' | 'mid_roll' | 'post_roll';
  positionSeconds?: number;
  adFileUrl: string;
  adDuration: number;
  adName: string;
}

interface AdInsertionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaFile: {
    id: string;
    title: string;
    duration_seconds: number;
  };
  availableAds: Array<{
    id: string;
    script: string;
    audio_url: string;
    duration_seconds: number;
    campaign_name?: string;
  }>;
  onInsertAds: (adSlots: AdSlot[]) => void;
}

export const AdInsertionDialog = ({
  open,
  onOpenChange,
  mediaFile,
  availableAds,
  onInsertAds,
}: AdInsertionDialogProps) => {
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);

  const addAdSlot = () => {
    setAdSlots([
      ...adSlots,
      {
        id: crypto.randomUUID(),
        slotType: 'pre_roll',
        adFileUrl: '',
        adDuration: 0,
        adName: '',
      },
    ]);
  };

  const removeAdSlot = (id: string) => {
    setAdSlots(adSlots.filter(slot => slot.id !== id));
  };

  const updateAdSlot = (id: string, updates: Partial<AdSlot>) => {
    setAdSlots(adSlots.map(slot => 
      slot.id === id ? { ...slot, ...updates } : slot
    ));
  };

  const selectAd = (slotId: string, adId: string) => {
    const ad = availableAds.find(a => a.id === adId);
    if (ad && ad.audio_url) {
      updateAdSlot(slotId, {
        adFileUrl: ad.audio_url,
        adDuration: ad.duration_seconds || 30,
        adName: ad.campaign_name || ad.script.substring(0, 50),
      });
    }
  };

  const handleSubmit = () => {
    // Validate
    const invalidSlots = adSlots.filter(slot => !slot.adFileUrl);
    if (invalidSlots.length > 0) {
      toast.error("Please select an ad for all slots");
      return;
    }

    const midRollsWithoutPosition = adSlots.filter(
      slot => slot.slotType === 'mid_roll' && !slot.positionSeconds
    );
    if (midRollsWithoutPosition.length > 0) {
      toast.error("Please specify position for mid-roll ads");
      return;
    }

    onInsertAds(adSlots);
    setAdSlots([]);
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Insert Ads - {mediaFile.title}</DialogTitle>
          <DialogDescription>
            Add advertising slots to your video. Video duration: {formatTime(mediaFile.duration_seconds)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {adSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No ad slots added yet. Click "Add Ad Slot" to begin.
            </div>
          ) : (
            <div className="space-y-4">
              {adSlots.map((slot, index) => (
                <div key={slot.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Ad Slot {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAdSlot(slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select
                        value={slot.slotType}
                        onValueChange={(value: any) => updateAdSlot(slot.id, { slotType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pre_roll">Pre-roll (Before video)</SelectItem>
                          <SelectItem value="mid_roll">Mid-roll (During video)</SelectItem>
                          <SelectItem value="post_roll">Post-roll (After video)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {slot.slotType === 'mid_roll' && (
                      <div className="space-y-2">
                        <Label>Time (seconds)</Label>
                        <Input
                          type="number"
                          min="0"
                          max={mediaFile.duration_seconds}
                          value={slot.positionSeconds || ''}
                          onChange={(e) => updateAdSlot(slot.id, { 
                            positionSeconds: parseFloat(e.target.value) 
                          })}
                          placeholder="e.g., 120"
                        />
                      </div>
                    )}

                    <div className="space-y-2 col-span-2">
                      <Label>Select Ad</Label>
                      <Select
                        value={slot.adFileUrl ? 'selected' : ''}
                        onValueChange={(adId) => selectAd(slot.id, adId)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an ad...">
                            {slot.adName || "Choose an ad..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableAds.map((ad) => (
                            <SelectItem key={ad.id} value={ad.id}>
                              {ad.campaign_name || ad.script.substring(0, 50)} 
                              {ad.duration_seconds && ` (${ad.duration_seconds}s)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {slot.adFileUrl && (
                      <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Play className="h-4 w-4" />
                        Duration: {slot.adDuration}s
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={addAdSlot} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Ad Slot
          </Button>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={adSlots.length === 0}>
            Process Video with Ads
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};