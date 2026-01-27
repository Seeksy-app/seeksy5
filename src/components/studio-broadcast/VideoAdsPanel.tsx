import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Upload, DollarSign, Play } from "lucide-react";
import { toast } from "sonner";

interface VideoAdsPanelProps {
  onAdSelect: (ad: any) => void;
  selectedAd: any;
}

export function VideoAdsPanel({ onAdSelect, selectedAd }: VideoAdsPanelProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Fetch available video ads
  const { data: videoAds, isLoading, refetch } = useQuery({
    queryKey: ['video-ads-inventory'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('ad_videos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;
      return (result.data as any[]) || [];
    }
  });

  // Fetch user's uploaded video ads
  const { data: myVideoAds } = useQuery({
    queryKey: ['my-video-ads'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const result = await (supabase as any)
        .from('ad_videos')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;
      return (result.data as any[]) || [];
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a video file");
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size must be under 100MB");
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `video-ads/${user.id}/${Date.now()}-${file.name}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      // Create ad_videos record
      const insertResult = await (supabase as any)
        .from('ad_videos')
        .insert({
          created_by_user_id: user.id,
          title: file.name.replace(/\.[^/.]+$/, ""),
          video_url: publicUrl,
          is_active: true
        });

      if (insertResult.error) throw insertResult.error;

      toast.success("Video ad uploaded successfully!");
      refetch();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectAd = (ad: any) => {
    onAdSelect(ad);
    toast.success(`Selected: ${ad.title}`);
  };

  const renderVideoAdsList = (ads: any[]) => {
    if (ads.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No video ads available</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {ads.map((ad) => (
          <Card 
            key={ad.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedAd?.id === ad.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleSelectAd(ad)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{ad.title}</h4>
                  {ad.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {ad.description}
                    </p>
                  )}
                </div>
                {ad.duration_seconds && (
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {ad.duration_seconds}s
                  </Badge>
                )}
              </div>

              {ad.thumbnail_url && (
                <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                  <img 
                    src={ad.thumbnail_url} 
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Video Ads</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Insert video ads into your My Page stream
        </p>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-4">
            <ScrollArea className="h-[350px] pr-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading video ads...
                </div>
              ) : (
                renderVideoAdsList(videoAds || [])
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-medium mb-2">Upload Your Video Ad</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  MP4, MOV, or WebM • Max 100MB
                </p>
                <div className="relative">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="opacity-0 absolute inset-0 cursor-pointer"
                  />
                  <Button variant="outline" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Choose File'}
                  </Button>
                </div>
              </div>

              {myVideoAds && myVideoAds.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">Your Uploads</Label>
                  <ScrollArea className="h-[250px] pr-4">
                    {renderVideoAdsList(myVideoAds)}
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {selectedAd && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs font-medium text-primary">
              Selected: {selectedAd.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click marker button to insert this video ad
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}