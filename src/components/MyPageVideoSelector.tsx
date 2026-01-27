import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Video, DollarSign, Play, Phone, MessageSquare } from "lucide-react";

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  duration_seconds: number | null;
}

interface AdVideo {
  id: string;
  script: string;
  campaign_name: string | null;
  audio_url: string;
  duration_seconds: number | null;
  advertiser_id: string;
  advertisers?: {
    company_name: string;
  };
}

export function MyPageVideoSelector() {
  const [videoType, setVideoType] = useState<'own' | 'ad' | 'both' | 'none'>('none');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedAdId, setSelectedAdId] = useState<string>('');
  const [loopVideo, setLoopVideo] = useState(true);
  const [ownVideos, setOwnVideos] = useState<MediaFile[]>([]);
  const [adVideos, setAdVideos] = useState<AdVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  
  // CTA Configuration
  const [showCtaDialog, setShowCtaDialog] = useState(false);
  const [ctaButtonText, setCtaButtonText] = useState<'Tip' | 'Donate' | 'Funds'>('Tip');
  const [ctaPhoneNumber, setCtaPhoneNumber] = useState('');
  const [ctaTextKeyword, setCtaTextKeyword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch current settings
      const { data: profile } = await supabase
        .from('profiles')
        .select('my_page_video_type, my_page_video_id, my_page_ad_id, my_page_video_loop, my_page_cta_button_text, my_page_cta_phone_number, my_page_cta_text_keyword')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentSettings(profile);
        setVideoType((profile.my_page_video_type as any) || 'none');
        setSelectedVideoId(profile.my_page_video_id || '');
        setSelectedAdId((profile as any).my_page_ad_id || '');
        setLoopVideo(profile.my_page_video_loop !== false);
        setCtaButtonText((profile as any).my_page_cta_button_text || 'Tip');
        setCtaPhoneNumber((profile as any).my_page_cta_phone_number || '');
        setCtaTextKeyword((profile as any).my_page_cta_text_keyword || '');
      }

      // Fetch user's own videos
      const { data: media } = await supabase
        .from('media_files')
        .select('id, file_name, file_url, duration_seconds')
        .eq('user_id', user.id)
        .eq('file_type', 'video')
        .order('created_at', { ascending: false });

      setOwnVideos(media || []);

      // Fetch available ad videos from Ad Library (audio_ads table)
      const { data: ads } = await supabase
        .from('audio_ads')
        .select(`
          id, 
          script, 
          campaign_name,
          audio_url, 
          duration_seconds, 
          advertiser_id
        `)
        .in('status', ['completed', 'ready'])
        .not('audio_url', 'is', null)
        .order('created_at', { ascending: false });

      // Filter to only video ads (mp4, webm) and transform to AdVideo type
      const videoAds = (ads || [])
        .filter(ad => 
          ad.audio_url?.toLowerCase().endsWith('.mp4') || 
          ad.audio_url?.toLowerCase().endsWith('.webm')
        )
        .map(ad => ({
          ...ad,
          advertisers: undefined // We're not joining advertisers table
        })) as AdVideo[];

      setAdVideos(videoAds);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load video options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureAndSave = () => {
    // Show CTA dialog first if video is selected
    if (videoType !== 'none') {
      setShowCtaDialog(true);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: any = {
        my_page_video_type: videoType === 'none' ? null : videoType,
        my_page_video_id: (videoType === 'none' || videoType === 'ad') ? null : selectedVideoId || null,
        my_page_ad_id: (videoType === 'none' || videoType === 'own') ? null : selectedAdId || null,
        my_page_video_loop: loopVideo,
        my_page_cta_button_text: ctaButtonText,
        my_page_cta_phone_number: ctaPhoneNumber || null,
        my_page_cta_text_keyword: ctaTextKeyword || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setShowCtaDialog(false);

      if (videoType === 'none') {
        toast.success('Video removed from My Page');
      } else if (videoType === 'ad' || videoType === 'both') {
        toast.success('Video will loop on your page! 🎬', {
          description: 'Your selected video will play continuously until stopped. Check your ad revenue in Monetization.',
          duration: 5000,
        });
      } else {
        toast.success('Video settings saved! 🎬', {
          description: 'Video will appear on your My Page',
        });
      }

      setCurrentSettings(updates);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save video settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewUrl = () => {
    if (videoType === 'own') {
      return ownVideos.find(v => v.id === selectedVideoId)?.file_url;
    } else if (videoType === 'ad') {
      return adVideos.find(v => v.id === selectedAdId)?.audio_url;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Page Video Display</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose a video to display on your public profile page
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video Source Selection */}
        <div className="space-y-3">
          <Label>Video Source</Label>
          <RadioGroup value={videoType} onValueChange={(value: any) => {
            setVideoType(value);
            setSelectedVideoId('');
          }}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none" className="font-normal cursor-pointer">
                No video
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="own" id="own" />
              <Label htmlFor="own" className="font-normal cursor-pointer flex items-center gap-2">
                <Video className="h-4 w-4" />
                My own video
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ad" id="ad" />
              <Label htmlFor="ad" className="font-normal cursor-pointer flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Sponsored ad video
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="both" />
              <Label htmlFor="both" className="font-normal cursor-pointer flex items-center gap-2">
                <Video className="h-4 w-4" />
                <DollarSign className="h-4 w-4" />
                Both (My video + Ad)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Video Selection */}
        {videoType === 'own' && (
          <div className="space-y-3">
            <Label>Select Your Video</Label>
            {ownVideos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No videos available. Upload videos to your Media Library first.
              </p>
            ) : (
              <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a video..." />
                </SelectTrigger>
                <SelectContent>
                  {ownVideos.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.file_name}
                      {video.duration_seconds && ` (${Math.floor(video.duration_seconds / 60)}:${String(video.duration_seconds % 60).padStart(2, '0')})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {(videoType === 'ad' || videoType === 'both') && (
          <div className="space-y-3">
            <Label>Select Ad Video</Label>
            {adVideos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No ad videos available. Contact sales team for sponsored video opportunities.
              </p>
            ) : (
              <Select value={selectedAdId} onValueChange={setSelectedAdId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an ad video..." />
                </SelectTrigger>
                <SelectContent>
                  {adVideos.map((video) => {
                    // Better fallback logic for ad names
                    let title = video.campaign_name;
                    
                    if (!title && video.script && video.script !== 'Uploaded pre-made ad') {
                      title = video.script.substring(0, 50) + (video.script.length > 50 ? '...' : '');
                    }
                    
                    if (!title && video.advertisers?.company_name) {
                      title = `${video.advertisers.company_name} Video Ad`;
                    }
                    
                    if (!title) {
                      title = 'Video Ad';
                    }
                    
                    return (
                      <SelectItem key={video.id} value={video.id}>
                        {title}
                        {video.duration_seconds && ` (${Math.floor(video.duration_seconds / 60)}:${String(video.duration_seconds % 60).padStart(2, '0')})`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {videoType === 'both' && (
          <div className="space-y-3">
            <Label>Select Your Video</Label>
            {ownVideos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No videos available. Upload videos to your Media Library first.
              </p>
            ) : (
              <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your video..." />
                </SelectTrigger>
                <SelectContent>
                  {ownVideos.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.file_name}
                      {video.duration_seconds && ` (${Math.floor(video.duration_seconds / 60)}:${String(video.duration_seconds % 60).padStart(2, '0')})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Loop Setting */}
        {videoType !== 'none' && (
          <div className="flex items-center justify-between">
            <Label htmlFor="loop-video" className="cursor-pointer">
              Loop video continuously
            </Label>
            <Switch
              id="loop-video"
              checked={loopVideo}
              onCheckedChange={setLoopVideo}
            />
          </div>
        )}

        {/* Preview */}
        {getPreviewUrl() && (
          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={getPreviewUrl()}
                controls
                loop={loopVideo}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button 
          onClick={handleConfigureAndSave} 
          disabled={isSaving || (videoType === 'own' && !selectedVideoId) || (videoType === 'ad' && !selectedAdId) || (videoType === 'both' && (!selectedVideoId || !selectedAdId))}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Save Video Settings
            </>
          )}
        </Button>

        {/* CTA Configuration Dialog */}
        <Dialog open={showCtaDialog} onOpenChange={setShowCtaDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Configure Call-to-Action</DialogTitle>
              <DialogDescription>
                Set up how viewers can support you or take action on your video
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Button Text Selection */}
              <div className="space-y-3">
                <Label>Button Text</Label>
                <RadioGroup value={ctaButtonText} onValueChange={(value: any) => setCtaButtonText(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Tip" id="tip" />
                    <Label htmlFor="tip" className="font-normal cursor-pointer flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Tip
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Donate" id="donate" />
                    <Label htmlFor="donate" className="font-normal cursor-pointer flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Donate
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Funds" id="funds" />
                    <Label htmlFor="funds" className="font-normal cursor-pointer flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Funds
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Phone Number */}
              <div className="space-y-3">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={ctaPhoneNumber}
                  onChange={(e) => setCtaPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Allow viewers to call or text you
                </p>
              </div>

              {/* Text Keyword */}
              {ctaPhoneNumber && (
                <div className="space-y-3">
                  <Label htmlFor="keyword" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Text Keyword (Optional)
                  </Label>
                  <Input
                    id="keyword"
                    type="text"
                    placeholder="e.g., INFO, HELP, JOIN"
                    value={ctaTextKeyword}
                    onChange={(e) => setCtaTextKeyword(e.target.value.toUpperCase())}
                  />
                  <p className="text-xs text-muted-foreground">
                    Keyword viewers text to {ctaPhoneNumber}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCtaDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}