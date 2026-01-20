import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const UploadReadyAd = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaText, setCtaText] = useState("Learn More");
  const [adDescription, setAdDescription] = useState("");

  // Fetch current user's advertiser profile
  const { data: advertiser, error: advertiserError } = useQuery({
    queryKey: ['current-advertiser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('advertisers')
        .select('*')
        .eq('owner_profile_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('No advertiser account found. Please create an advertiser account first.');
      }
      return data;
    },
  });

  // Show error if no advertiser account
  if (advertiserError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Advertiser Account Required</h2>
          <p className="text-muted-foreground mb-4">
            {advertiserError.message || 'You need to create an advertiser account before uploading ads.'}
          </p>
          <Button onClick={() => navigate('/advertiser/signup')}>
            Create Advertiser Account
          </Button>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio (MP3, WAV, OGG) or video (MP4, WEBM) file",
          variant: "destructive",
        });
        return;
      }
      setAudioFile(file);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!audioFile || !advertiser) {
        throw new Error('Missing required data');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      console.log('=== STARTING AD UPLOAD ===');
      console.log(`File: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log('Advertiser ID:', advertiser.id);

      // Get duration and generate thumbnail for videos
      let duration = 0;
      let thumbnailUrl = null;

      if (audioFile.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(audioFile);
        
        await new Promise<void>((resolve) => {
          video.addEventListener('loadedmetadata', () => {
            duration = Math.round(video.duration);
            resolve();
          });
        });

        // Generate thumbnail from first frame
        await new Promise<void>((resolve) => {
          video.currentTime = 1;
          video.addEventListener('seeked', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            URL.revokeObjectURL(video.src);
            resolve();
          }, { once: true });
        });
      } else {
        const audio = new Audio(URL.createObjectURL(audioFile));
        duration = await new Promise<number>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            resolve(Math.round(audio.duration));
          });
        });
      }

      // Upload via edge function (handles CORS and R2 upload)
      console.log('Uploading to R2 via edge function...');
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('advertiserId', advertiser.id);
      formData.append('adDescription', adDescription);
      formData.append('ctaUrl', ctaUrl);
      formData.append('ctaText', ctaText);
      formData.append('duration', duration.toString());
      if (thumbnailUrl) formData.append('thumbnailUrl', thumbnailUrl);

      const uploadResponse = await supabase.functions.invoke('r2-upload-ad', {
        body: formData,
      });

      if (uploadResponse.error) {
        throw new Error(`Upload failed: ${uploadResponse.error.message}`);
      }

      if (!uploadResponse.data?.success) {
        throw new Error(uploadResponse.data?.error || 'Upload failed');
      }

      console.log('=== UPLOAD COMPLETE ===');
      return uploadResponse.data.audioAd;
    },
    onSuccess: () => {
      toast({
        title: "Ad uploaded successfully!",
        description: "Your ad is ready to use in campaigns.",
      });
      queryClient.invalidateQueries({ queryKey: ['audio-ads'] });
      navigate('/advertiser/ads');
    },
    onError: (error: Error) => {
      console.error('Upload mutation error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Please check the console for details and try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/advertiser/campaigns/create-type")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Ad Types
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Upload Ready Ad</h1>
        <p className="text-muted-foreground">
          Upload your pre-made audio or video advertisement
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="audio-file">Audio/Video File *</Label>
            <div className="mt-2">
              <Input
                id="audio-file"
                type="file"
                accept="audio/*,video/mp4,video/webm"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
              />
              {audioFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          {uploadMutation.isPending && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div>
            <Label htmlFor="description">Ad Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your ad..."
              value={adDescription}
              onChange={(e) => setAdDescription(e.target.value)}
              disabled={uploadMutation.isPending}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="cta-url">Call-to-Action URL (Optional)</Label>
            <Input
              id="cta-url"
              type="url"
              placeholder="https://yourwebsite.com"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              disabled={uploadMutation.isPending}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Where should listeners go when they click on your ad?
            </p>
          </div>

          <div>
            <Label htmlFor="cta-text">Call-to-Action Text</Label>
            <Input
              id="cta-text"
              placeholder="Learn More"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              disabled={uploadMutation.isPending}
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!audioFile || uploadMutation.isPending}
              className="flex-1"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadProgress > 0 ? `Uploading ${Math.round(uploadProgress)}%` : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Ad
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/advertiser/campaigns/create-type')}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UploadReadyAd;
