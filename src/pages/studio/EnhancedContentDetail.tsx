import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SocialPublishModal } from "@/components/clips/SocialPublishModal";
import { 
  ArrowLeft, Play, Download, Share2, Scissors, BarChart3, 
  Clock, FileText, Layers, Type, Copy, ExternalLink,
  Eye, TrendingUp, Users, Heart, MessageCircle, Sparkles,
  CheckCircle2, Volume2, Mic, Zap, Palette, Calendar
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EnhancedMedia {
  id: string;
  file_name: string | null;
  file_url: string | null;
  cloudflare_download_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  edit_status: string | null;
  file_size_bytes: number | null;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

export default function EnhancedContentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [media, setMedia] = useState<EnhancedMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock analytics data - in production would come from DB
  const analytics = {
    views: 1247,
    likes: 89,
    shares: 23,
    comments: 12,
    avgWatchTime: "2:34",
    completionRate: 78,
    engagementRate: 7.2,
  };

  const enhancements = {
    fillerWordsRemoved: 30,
    pausesTrimmed: 28,
    silencesCut: 30,
    noiseReduced: 60,
    timeSaved: 25,
    chaptersDetected: 6,
    originalDuration: 300,
    enhancedDuration: 275,
  };

  useEffect(() => {
    if (!id) return;
    
    const fetchMedia = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        toast({ title: "Error loading content", variant: "destructive" });
        navigate('/studio/enhanced-content');
        return;
      }
      
      setMedia(data);
      setLoading(false);
    };
    
    fetchMedia();
  }, [id, navigate, toast]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/studio/enhanced/${id}`);
    toast({ title: "Link copied!", description: "Share link copied to clipboard" });
  };

  const handleDownload = (type: string) => {
    toast({ title: "Download started", description: `Preparing ${type} for download...` });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Content not found</p>
          <Button onClick={() => navigate('/studio/enhanced-content')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const videoUrl = media.cloudflare_download_url || media.file_url;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/studio/enhanced-content')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{media.file_name || "Enhanced Video"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Enhanced
              </Badge>
              {media.created_at && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(media.created_at), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button 
              size="sm"
              className="text-white"
              style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
              onClick={() => setShowSocialModal(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share to Social
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                {videoUrl ? (
                  <video 
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    controls
                    poster={media.thumbnail_url || undefined}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-16 w-16 text-white/30 mx-auto mb-2" />
                      <p className="text-white/50">Video preview not available</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Tabs for Details */}
            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="w-full justify-start bg-muted/50">
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="enhancements" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Enhancements
                </TabsTrigger>
                <TabsTrigger value="downloads" className="gap-2">
                  <Download className="h-4 w-4" />
                  Downloads
                </TabsTrigger>
              </TabsList>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <Eye className="h-5 w-5 mx-auto mb-2 text-[#2C6BED]" />
                        <div className="text-2xl font-bold">{analytics.views.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Total Views</div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <Heart className="h-5 w-5 mx-auto mb-2 text-rose-500" />
                        <div className="text-2xl font-bold">{analytics.likes}</div>
                        <div className="text-xs text-muted-foreground">Likes</div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <Share2 className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                        <div className="text-2xl font-bold">{analytics.shares}</div>
                        <div className="text-xs text-muted-foreground">Shares</div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <MessageCircle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                        <div className="text-2xl font-bold">{analytics.comments}</div>
                        <div className="text-xs text-muted-foreground">Comments</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Avg. Watch Time</span>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xl font-bold">{analytics.avgWatchTime}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Completion Rate</span>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xl font-bold">{analytics.completionRate}%</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Engagement Rate</span>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xl font-bold">{analytics.engagementRate}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Enhancements Tab */}
              <TabsContent value="enhancements" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 border rounded-lg">
                        <Mic className="h-5 w-5 mx-auto mb-2 text-rose-500" />
                        <div className="text-2xl font-bold text-emerald-600">{enhancements.fillerWordsRemoved}</div>
                        <div className="text-xs text-muted-foreground">Filler Words Removed</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Zap className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                        <div className="text-2xl font-bold text-emerald-600">{enhancements.pausesTrimmed}</div>
                        <div className="text-xs text-muted-foreground">Pauses Trimmed</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Volume2 className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                        <div className="text-2xl font-bold text-emerald-600">{enhancements.noiseReduced}%</div>
                        <div className="text-xs text-muted-foreground">Noise Reduced</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Clock className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold text-emerald-600">{enhancements.timeSaved}s</div>
                        <div className="text-xs text-muted-foreground">Time Saved</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Layers className="h-5 w-5 mx-auto mb-2 text-indigo-500" />
                        <div className="text-2xl font-bold">{enhancements.chaptersDetected}</div>
                        <div className="text-xs text-muted-foreground">Chapters Detected</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Palette className="h-5 w-5 mx-auto mb-2 text-pink-500" />
                        <div className="text-2xl font-bold flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div className="text-xs text-muted-foreground">Color Corrected</div>
                      </div>
                    </div>

                    {/* Duration Comparison */}
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          Original: {formatDuration(enhancements.originalDuration)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          Enhanced: {formatDuration(enhancements.enhancedDuration)}
                        </span>
                      </div>
                      <Badge className="bg-emerald-500 text-white">
                        {Math.round((1 - enhancements.enhancedDuration / enhancements.originalDuration) * 100)}% shorter
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Downloads Tab */}
              <TabsContent value="downloads" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-auto py-6 flex-col gap-3 hover:border-[#2C6BED] hover:bg-[#2C6BED]/5"
                        onClick={() => handleDownload('Enhanced Video')}
                      >
                        <Download className="h-8 w-8 text-[#2C6BED]" />
                        <div className="text-center">
                          <div className="font-medium">Enhanced Video</div>
                          <div className="text-xs text-muted-foreground">MP4 • HD</div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto py-6 flex-col gap-3 hover:border-[#2C6BED] hover:bg-[#2C6BED]/5"
                        onClick={() => handleDownload('Transcript')}
                      >
                        <FileText className="h-8 w-8 text-[#2C6BED]" />
                        <div className="text-center">
                          <div className="font-medium">Transcript</div>
                          <div className="text-xs text-muted-foreground">TXT</div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto py-6 flex-col gap-3 hover:border-[#2C6BED] hover:bg-[#2C6BED]/5"
                        onClick={() => handleDownload('Chapters')}
                      >
                        <Layers className="h-8 w-8 text-[#2C6BED]" />
                        <div className="text-center">
                          <div className="font-medium">Chapters</div>
                          <div className="text-xs text-muted-foreground">JSON</div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto py-6 flex-col gap-3 hover:border-[#2C6BED] hover:bg-[#2C6BED]/5"
                        onClick={() => handleDownload('Captions')}
                      >
                        <Type className="h-8 w-8 text-[#2C6BED]" />
                        <div className="text-center">
                          <div className="font-medium">Captions</div>
                          <div className="text-xs text-muted-foreground">SRT</div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start text-white"
                  style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
                  onClick={() => navigate(`/studio/clips?media=${id}`)}
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  Generate AI Clips
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowSocialModal(true)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Publish to Social
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleDownload('video')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground"
                  onClick={handleCopyLink}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Shareable Link
                </Button>
              </CardContent>
            </Card>

            {/* Video Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Video Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{formatDuration(media.duration_seconds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size</span>
                  <span className="font-medium">{formatFileSize(media.file_size_bytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    Enhanced
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {media.created_at ? format(new Date(media.created_at), "MMM d, yyyy") : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card className="border-[#2C6BED]/30 bg-[#2C6BED]/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2C6BED]/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-[#2C6BED]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Pro Tip</h4>
                    <p className="text-xs text-muted-foreground">
                      Generate AI clips from this video to create viral short-form content for TikTok, Instagram Reels, and YouTube Shorts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Social Publish Modal */}
      <SocialPublishModal
        open={showSocialModal}
        onOpenChange={setShowSocialModal}
        clip={{
          id: media.id,
          title: media.file_name || "Enhanced Video",
          thumbnail_url: media.thumbnail_url,
          file_url: videoUrl,
          duration_seconds: media.duration_seconds,
        }}
      />
    </div>
  );
}
