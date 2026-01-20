import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Play, Clock, Upload, Sparkles, ChevronUp, ChevronDown, ImageIcon, 
  Loader2, Trash2, Video, ArrowLeft, Pencil, RefreshCw
} from "lucide-react";
import { DemoVideoUpload } from "@/components/demo-videos/DemoVideoUpload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DemoVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  is_featured: boolean;
  created_at: string;
}

// Video Player component with loading state
function VideoPlayer({ 
  videoRef, 
  video 
}: { 
  videoRef: React.RefObject<HTMLVideoElement>; 
  video: DemoVideo;
}) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading video...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        key={video.id}
        src={video.video_url}
        controls
        className="w-full h-full"
        poster={video.thumbnail_url || undefined}
        onLoadedData={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
      />
    </div>
  );
}

const categoryColors: Record<string, string> = {
  'Creator Tools': 'bg-blue-100 text-blue-700',
  'Advertiser Tools': 'bg-purple-100 text-purple-700',
  'Monetization': 'bg-green-100 text-green-700',
  'Onboarding': 'bg-amber-100 text-amber-700',
  'AI Features': 'bg-pink-100 text-pink-700',
  'Platform Overview': 'bg-cyan-100 text-cyan-700',
};

const CATEGORY_OPTIONS = [
  'Platform Overview',
  'Creator Tools',
  'Advertiser Tools',
  'Monetization',
  'Onboarding',
  'AI Features',
];

export default function DemoVideos() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [generatingThumbnailId, setGeneratingThumbnailId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<DemoVideo | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '', is_featured: false });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['demo-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DemoVideo[];
    },
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Auto-select first video if none selected
  useEffect(() => {
    if (!selectedVideo && videos.length > 0) {
      setSelectedVideo(videos[0]);
    }
  }, [videos, selectedVideo]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ videoId, direction }: { videoId: string; direction: 'up' | 'down' }) => {
      const currentIndex = videos.findIndex(v => v.id === videoId);
      if (currentIndex === -1) return;
      
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= videos.length) return;

      const currentVideo = videos[currentIndex];
      const swapVideo = videos[swapIndex];

      await supabase.from('demo_videos').update({ order_index: swapVideo.order_index }).eq('id', currentVideo.id);
      await supabase.from('demo_videos').update({ order_index: currentVideo.order_index }).eq('id', swapVideo.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-videos'] });
      queryClient.invalidateQueries({ queryKey: ['boardVideos'] });
      toast({ title: "Order updated" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase.from('demo_videos').delete().eq('id', videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-videos'] });
      queryClient.invalidateQueries({ queryKey: ['boardVideos'] });
      toast({ title: "Video deleted" });
      setSelectedVideo(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string; category: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from('demo_videos')
        .update({
          title: data.title,
          description: data.description,
          category: data.category,
          is_featured: data.is_featured,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-videos'] });
      queryClient.invalidateQueries({ queryKey: ['boardVideos'] });
      toast({ title: "Video updated" });
      setEditingVideo(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to update video" });
    },
  });

  const openEditModal = (video: DemoVideo) => {
    setEditForm({
      title: video.title,
      description: video.description || '',
      category: video.category,
      is_featured: video.is_featured,
    });
    setEditingVideo(video);
  };

  const handleSaveEdit = () => {
    if (!editingVideo) return;
    updateMutation.mutate({
      id: editingVideo.id,
      ...editForm,
    });
  };

  // Generate thumbnail from video
  const generateThumbnail = useCallback(async (video: DemoVideo) => {
    setGeneratingThumbnailId(video.id);
    try {
      const videoEl = document.createElement('video');
      videoEl.crossOrigin = 'anonymous';
      videoEl.preload = 'metadata';
      videoEl.muted = true;
      videoEl.src = video.video_url;

      await new Promise((resolve, reject) => {
        videoEl.onloadedmetadata = () => {
          videoEl.currentTime = Math.min(2, videoEl.duration * 0.1);
        };
        videoEl.onseeked = resolve;
        videoEl.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
        });

        const fileName = `thumb_${Date.now()}_${video.id}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('demo-videos')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('demo-videos')
          .getPublicUrl(fileName);

        await supabase.from('demo_videos').update({ thumbnail_url: publicUrl }).eq('id', video.id);
        
        queryClient.invalidateQueries({ queryKey: ['demo-videos'] });
        queryClient.invalidateQueries({ queryKey: ['boardVideos'] });
        toast({ title: "Thumbnail generated!" });
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      toast({ variant: "destructive", title: "Failed to generate thumbnail" });
    } finally {
      setGeneratingThumbnailId(null);
    }
  }, [queryClient, toast]);

  // Upload custom thumbnail
  const handleThumbnailUpload = useCallback(async (file: File) => {
    if (!editingVideo) return;
    
    setUploadingThumbnail(true);
    try {
      const fileName = `thumb_${Date.now()}_${editingVideo.id}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('demo-videos')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('demo-videos')
        .getPublicUrl(fileName);

      await supabase.from('demo_videos').update({ thumbnail_url: publicUrl }).eq('id', editingVideo.id);
      
      // Update local state
      setEditingVideo({ ...editingVideo, thumbnail_url: publicUrl });
      
      queryClient.invalidateQueries({ queryKey: ['demo-videos'] });
      queryClient.invalidateQueries({ queryKey: ['boardVideos'] });
      toast({ title: "Thumbnail uploaded!" });
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      toast({ variant: "destructive", title: "Failed to upload thumbnail" });
    } finally {
      setUploadingThumbnail(false);
    }
  }, [editingVideo, queryClient, toast]);

  // Regenerate thumbnail for editing video
  const regenerateThumbnailForEdit = useCallback(async () => {
    if (!editingVideo) return;
    
    setUploadingThumbnail(true);
    try {
      const videoEl = document.createElement('video');
      videoEl.crossOrigin = 'anonymous';
      videoEl.preload = 'metadata';
      videoEl.muted = true;
      videoEl.src = editingVideo.video_url;

      await new Promise((resolve, reject) => {
        videoEl.onloadedmetadata = () => {
          videoEl.currentTime = Math.min(2, videoEl.duration * 0.1);
        };
        videoEl.onseeked = resolve;
        videoEl.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
        });

        const fileName = `thumb_${Date.now()}_${editingVideo.id}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('demo-videos')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('demo-videos')
          .getPublicUrl(fileName);

        await supabase.from('demo_videos').update({ thumbnail_url: publicUrl }).eq('id', editingVideo.id);
        
        // Update local state
        setEditingVideo({ ...editingVideo, thumbnail_url: publicUrl });
        
        queryClient.invalidateQueries({ queryKey: ['demo-videos'] });
        queryClient.invalidateQueries({ queryKey: ['boardVideos'] });
        toast({ title: "Thumbnail regenerated!" });
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      toast({ variant: "destructive", title: "Failed to generate thumbnail" });
    } finally {
      setUploadingThumbnail(false);
    }
  }, [editingVideo, queryClient, toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Breadcrumb */}
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground mb-6 -ml-2"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <Video className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Demo Video Library</h1>
              <p className="text-muted-foreground">Board-ready product demos and feature showcases</p>
            </div>
          </div>
          {user && (
            <Button
              onClick={() => setShowUpload(!showUpload)}
              size="lg"
              variant={showUpload ? "outline" : "default"}
            >
              <Upload className="mr-2 h-4 w-4" />
              {showUpload ? "Hide Upload" : "Upload Video"}
            </Button>
          )}
        </div>

        {/* Upload Section (Admin Only) */}
        {showUpload && user && (
          <div className="mb-6">
            <DemoVideoUpload onSuccess={() => setShowUpload(false)} />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading demo videos...</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Play className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No demo videos yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Upload your first board-ready demo video to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player - Board style */}
            <div className="lg:col-span-2">
              <Card className="border-border shadow-sm overflow-hidden">
                <div className="aspect-video bg-slate-900 relative">
                  {selectedVideo?.video_url ? (
                    <VideoPlayer
                      videoRef={videoRef}
                      video={selectedVideo}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <Play className="w-16 h-16 mb-4" />
                      <p className="text-sm">Select a video to play</p>
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold">
                      {selectedVideo?.title || 'Select a video'}
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedVideo?.category && (
                        <Badge className={cn('text-xs', categoryColors[selectedVideo.category] || 'bg-slate-100 text-slate-600')}>
                          {selectedVideo.category}
                        </Badge>
                      )}
                      {user && selectedVideo && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this video?')) {
                              deleteMutation.mutate(selectedVideo.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    {selectedVideo?.description || 'Choose a video from the playlist to begin.'}
                  </p>
                  {selectedVideo?.duration_seconds && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDuration(selectedVideo.duration_seconds)}
                      {selectedVideo.is_featured && (
                        <Badge variant="default" className="gap-1 ml-2">
                          <Sparkles className="h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Playlist - Board style horizontal cards */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Playlist</h3>
              <div className="space-y-3">
                {videos.map((video, index) => {
                  const isSelected = selectedVideo?.id === video.id;
                  
                  return (
                    <Card
                      key={video.id}
                      className={cn(
                        'border transition-all cursor-pointer overflow-hidden',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-sm'
                          : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                      )}
                      onClick={() => setSelectedVideo(video)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Thumbnail */}
                          <div className="relative w-24 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900">
                            {video.thumbnail_url ? (
                              <img 
                                src={video.thumbnail_url} 
                                alt={video.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null}
                            {/* Play overlay */}
                            <div className={cn(
                              'absolute inset-0 flex items-center justify-center',
                              isSelected ? 'bg-blue-500/30' : 'bg-black/30'
                            )}>
                              <Play className={cn(
                                "w-5 h-5",
                                isSelected ? "text-white" : "text-white/70"
                              )} />
                            </div>
                            {/* Duration badge */}
                            {video.duration_seconds && (
                              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                                {formatDuration(video.duration_seconds)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              'font-medium text-sm leading-tight line-clamp-2',
                              isSelected ? 'text-blue-700 dark:text-blue-300' : ''
                            )}>
                              {video.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge className={cn('text-[10px] px-1.5 py-0', categoryColors[video.category] || 'bg-slate-100 text-slate-600')}>
                                {video.category}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Admin controls */}
                        {user && (
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderMutation.mutate({ videoId: video.id, direction: 'up' });
                                }}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderMutation.mutate({ videoId: video.id, direction: 'down' });
                                }}
                                disabled={index === videos.length - 1}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(video);
                                }}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              {!video.thumbnail_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateThumbnail(video);
                                  }}
                                  disabled={generatingThumbnailId === video.id}
                                >
                                  {generatingThumbnailId === video.id ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <ImageIcon className="h-3 w-3 mr-1" />
                                  )}
                                  Gen Thumb
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {videos.length > 0 && (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {videos.length} {videos.length === 1 ? 'video' : 'videos'} in playlist
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Video Modal */}
      <Dialog open={!!editingVideo} onOpenChange={(open) => !open && setEditingVideo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Video title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Video description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-featured">Featured Video</Label>
              <Switch
                id="edit-featured"
                checked={editForm.is_featured}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_featured: checked }))}
              />
            </div>
            
            {/* Thumbnail Management */}
            <div className="space-y-3 pt-2 border-t">
              <Label>Thumbnail</Label>
              {editingVideo?.thumbnail_url && (
                <div className="relative w-full aspect-video rounded-md overflow-hidden bg-slate-100">
                  <img 
                    src={editingVideo.thumbnail_url} 
                    alt="Current thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={thumbnailInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleThumbnailUpload(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={uploadingThumbnail}
                >
                  {uploadingThumbnail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={regenerateThumbnailForEdit}
                  disabled={uploadingThumbnail}
                >
                  {uploadingThumbnail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Regenerate
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVideo(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
