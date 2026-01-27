import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Video, Image as ImageIcon, Sparkles } from "lucide-react";

const CATEGORIES = [
  'Creator Tools',
  'Advertiser Tools',
  'Monetization',
  'Onboarding',
  'AI Features',
  'Platform Overview',
];

interface DemoVideoUploadProps {
  onSuccess?: () => void;
}

export function DemoVideoUpload({ onSuccess }: DemoVideoUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Platform Overview");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Auto-generate thumbnail from video
  const generateThumbnail = useCallback(async () => {
    if (!videoFile) return;
    
    setIsGeneratingThumbnail(true);
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      const videoUrl = URL.createObjectURL(videoFile);
      video.src = videoUrl;
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          // Seek to 2 seconds or 10% of video, whichever is smaller
          video.currentTime = Math.min(2, video.duration * 0.1);
        };
        video.onseeked = resolve;
        video.onerror = reject;
      });
      
      // Create canvas and draw frame
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setGeneratedThumbnail(thumbnailDataUrl);
      }
      
      URL.revokeObjectURL(videoUrl);
      toast({
        title: "Thumbnail Generated",
        description: "Auto-generated thumbnail from video frame",
      });
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      toast({
        variant: "destructive",
        title: "Thumbnail Generation Failed",
        description: "Could not auto-generate thumbnail",
      });
    } finally {
      setIsGeneratingThumbnail(false);
    }
  }, [videoFile, toast]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!videoFile || !title) {
        throw new Error("Video file and title are required");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload video file
      const videoFileName = `${Date.now()}_${videoFile.name}`;
      const { error: videoError, data: videoData } = await supabase.storage
        .from('demo-videos')
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('demo-videos')
        .getPublicUrl(videoFileName);

      // Upload thumbnail - use manual file, generated thumbnail, or nothing
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const thumbnailFileName = `thumb_${Date.now()}_${thumbnailFile.name}`;
        const { error: thumbError } = await supabase.storage
          .from('demo-videos')
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbError) throw thumbError;

        const { data: { publicUrl } } = supabase.storage
          .from('demo-videos')
          .getPublicUrl(thumbnailFileName);

        thumbnailUrl = publicUrl;
      } else if (generatedThumbnail) {
        // Convert base64 to blob and upload
        const response = await fetch(generatedThumbnail);
        const blob = await response.blob();
        const thumbnailFileName = `thumb_${Date.now()}_auto.jpg`;
        
        const { error: thumbError } = await supabase.storage
          .from('demo-videos')
          .upload(thumbnailFileName, blob, { contentType: 'image/jpeg' });

        if (thumbError) throw thumbError;

        const { data: { publicUrl } } = supabase.storage
          .from('demo-videos')
          .getPublicUrl(thumbnailFileName);

        thumbnailUrl = publicUrl;
      }

      // Create database entry
      const result = await (supabase as any)
        .from('demo_videos')
        .insert({
          title,
          description: description || null,
          category,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          order_index: orderIndex,
          is_featured: isFeatured,
          created_by: user.id,
        });

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast({
        title: "Video Uploaded",
        description: "Demo video has been uploaded successfully",
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("Platform Overview");
      setVideoFile(null);
      setThumbnailFile(null);
      setOrderIndex(0);
      setIsFeatured(false);
      setGeneratedThumbnail(null);

      // Refresh videos list for both Demo Videos and Board Portal
      queryClient.invalidateQueries({ queryKey: ['demo-videos'] });
      queryClient.invalidateQueries({ queryKey: ['boardVideos'] });
      
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Demo Video</CardTitle>
        <CardDescription>
          Add a new board-ready demo video to the library
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Video Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., AI Clip Generator Demo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this demo showcases..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featured">Featured?</Label>
                  <Select value={isFeatured ? "yes" : "no"} onValueChange={(v) => setIsFeatured(v === "yes")}>
                    <SelectTrigger id="featured">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video">Video File *</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                  <input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="hidden"
                    required
                  />
                  <label htmlFor="video" className="cursor-pointer block">
                    {videoFile ? (
                      <div className="space-y-2">
                        <Video className="h-10 w-10 mx-auto text-primary" />
                        <p className="text-sm font-medium">{videoFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Video className="h-10 w-10 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload video</p>
                        <p className="text-xs text-muted-foreground">MP4, MOV, or WebM</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="thumbnail">Thumbnail</Label>
                  {videoFile && !thumbnailFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateThumbnail}
                      disabled={isGeneratingThumbnail}
                      className="text-xs"
                    >
                      {isGeneratingThumbnail ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Auto-Generate
                    </Button>
                  )}
                </div>
                
                {generatedThumbnail && !thumbnailFile ? (
                  <div className="border-2 border-primary rounded-lg p-2 bg-primary/5">
                    <img 
                      src={generatedThumbnail} 
                      alt="Generated thumbnail" 
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">Auto-generated</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGeneratedThumbnail(null)}
                        className="text-xs h-6"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                    <input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setThumbnailFile(e.target.files?.[0] || null);
                        setGeneratedThumbnail(null);
                      }}
                      className="hidden"
                    />
                    <label htmlFor="thumbnail" className="cursor-pointer block">
                      {thumbnailFile ? (
                        <div className="space-y-2">
                          <ImageIcon className="h-10 w-10 mx-auto text-primary" />
                          <p className="text-sm font-medium">{thumbnailFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(thumbnailFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                          <p className="text-sm font-medium">Click to upload thumbnail</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, or WebP</p>
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTitle("");
                setDescription("");
                setVideoFile(null);
                setThumbnailFile(null);
                setGeneratedThumbnail(null);
              }}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={uploadMutation.isPending || !videoFile || !title}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}