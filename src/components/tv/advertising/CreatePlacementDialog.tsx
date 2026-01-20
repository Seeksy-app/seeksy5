import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, Radio, Video } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays } from "date-fns";

interface Ad {
  id: string;
  title: string;
  type: string;
  status: string;
}

interface CreatePlacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ads: Ad[];
  onSuccess: () => void;
}

export function CreatePlacementDialog({ open, onOpenChange, ads, onSuccess }: CreatePlacementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ad_id: '',
    target_type: 'channel' as 'channel' | 'video',
    channel_id: '',
    video_id: '',
    position: 'pre' as 'pre' | 'post' | 'both',
    cpm: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    priority: '0'
  });

  // Fetch channels
  const { data: channels } = useQuery({
    queryKey: ['tv-channels-for-placement'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch videos
  const { data: videos } = useQuery({
    queryKey: ['tv-content-for-placement'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_content')
        .select('id, title')
        .eq('is_published', true)
        .order('title');
      if (error) throw error;
      return data;
    }
  });

  const activeAds = ads.filter(a => a.status === 'active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ad_id || !formData.cpm || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.target_type === 'channel' && !formData.channel_id) {
      toast.error('Please select a channel');
      return;
    }

    if (formData.target_type === 'video' && !formData.video_id) {
      toast.error('Please select a video');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('seeksy_tv_ad_placements')
        .insert({
          ad_id: formData.ad_id,
          target_type: formData.target_type,
          channel_id: formData.target_type === 'channel' ? formData.channel_id : null,
          video_id: formData.target_type === 'video' ? formData.video_id : null,
          position: formData.position,
          cpm: parseFloat(formData.cpm),
          start_date: formData.start_date,
          end_date: formData.end_date,
          priority: parseInt(formData.priority) || 0,
          status: 'active',
          created_by: user?.id
        });

      if (error) throw error;

      toast.success('Placement created successfully');
      setFormData({
        ad_id: '',
        target_type: 'channel',
        channel_id: '',
        video_id: '',
        position: 'pre',
        cpm: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        priority: '0'
      });
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create placement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create Placement
          </DialogTitle>
          <DialogDescription>
            Configure where and when an ad should appear
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Ad *</Label>
            <Select
              value={formData.ad_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, ad_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an ad from inventory" />
              </SelectTrigger>
              <SelectContent>
                {activeAds.map((ad) => (
                  <SelectItem key={ad.id} value={ad.id}>
                    {ad.title} ({ad.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeAds.length === 0 && (
              <p className="text-xs text-muted-foreground">No active ads available. Create an ad first.</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Target Type *</Label>
            <RadioGroup
              value={formData.target_type}
              onValueChange={(value: 'channel' | 'video') => setFormData(prev => ({ ...prev, target_type: value, channel_id: '', video_id: '' }))}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="channel" id="channel" />
                <Label htmlFor="channel" className="flex items-center gap-1 cursor-pointer">
                  <Radio className="h-4 w-4" />
                  Channel
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="flex items-center gap-1 cursor-pointer">
                  <Video className="h-4 w-4" />
                  Specific Video
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.target_type === 'channel' && (
            <div className="space-y-2">
              <Label>Channel *</Label>
              <Select
                value={formData.channel_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, channel_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels?.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.target_type === 'video' && (
            <div className="space-y-2">
              <Label>Video *</Label>
              <Select
                value={formData.video_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, video_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a video" />
                </SelectTrigger>
                <SelectContent>
                  {videos?.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Position *</Label>
            <Select
              value={formData.position}
              onValueChange={(value: 'pre' | 'post' | 'both') => setFormData(prev => ({ ...prev, position: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre">Pre-roll (before video)</SelectItem>
                <SelectItem value="post">Post-roll (after video)</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpm">CPM ($) *</Label>
              <Input
                id="cpm"
                type="number"
                step="0.01"
                value={formData.cpm}
                onChange={(e) => setFormData(prev => ({ ...prev, cpm: e.target.value }))}
                placeholder="18.00"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Higher = more priority</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || activeAds.length === 0}>
              {loading ? 'Creating...' : 'Create Placement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
