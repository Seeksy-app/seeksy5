import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock, Sparkles, FileText } from "lucide-react";
import { Helmet } from "react-helmet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "react-router-dom";

interface DemoVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number | null;
  is_featured: boolean | null;
}

interface VideoPageSettings {
  page_title: string;
  page_subtitle: string | null;
  header_button_text: string | null;
  header_button_link: string | null;
  show_featured_section: boolean;
  show_categories: boolean;
  is_published: boolean;
}

interface VideoCategory {
  name: string;
  display_order: number;
  is_visible: boolean;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Generate a session ID for anonymous tracking
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("video_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("video_session_id", sessionId);
  }
  return sessionId;
};

export default function PublicVideosPage() {
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null);
  const [watchLogId, setWatchLogId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchStartRef = useRef<number>(0);

  // Fetch page settings
  const { data: settings } = useQuery({
    queryKey: ["video-page-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_page_settings")
        .select("*")
        .eq("page_key", "main")
        .maybeSingle();
      if (error) throw error;
      return data as VideoPageSettings | null;
    },
  });

  // Fetch visible categories for ordering
  const { data: categories = [] } = useQuery({
    queryKey: ["video-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_categories")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as VideoCategory[];
    },
  });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["public-demo-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_videos")
        .select("*")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DemoVideo[];
    },
  });

  // Log video watch start
  const logWatchStart = async (video: DemoVideo) => {
    const sessionId = getSessionId();
    const { data, error } = await supabase
      .from("video_watch_logs")
      .insert({
        video_id: video.id,
        session_id: sessionId,
        video_duration_seconds: video.duration_seconds,
        referrer: document.referrer || null,
      })
      .select("id")
      .single();

    if (!error && data) {
      setWatchLogId(data.id);
    }
    watchStartRef.current = Date.now();
  };

  // Update watch duration on close
  const logWatchEnd = async () => {
    if (!watchLogId) return;
    
    const watchDuration = Math.floor((Date.now() - watchStartRef.current) / 1000);
    const videoElement = videoRef.current;
    const completed = videoElement ? videoElement.currentTime >= (videoElement.duration * 0.9) : false;

    await supabase
      .from("video_watch_logs")
      .update({
        watch_duration_seconds: watchDuration,
        completed,
      })
      .eq("id", watchLogId);

    setWatchLogId(null);
  };

  const handleVideoSelect = (video: DemoVideo) => {
    setSelectedVideo(video);
    logWatchStart(video);
  };

  const handleCloseVideo = () => {
    logWatchEnd();
    setSelectedVideo(null);
  };

  // Get visible category names
  const visibleCategoryNames = categories.map(c => c.name);

  // Group videos by category, respecting visibility
  const groupedVideos = videos.reduce((acc, video) => {
    const category = video.category || "Other";
    // Only include if category is visible (or if no categories configured yet)
    if (visibleCategoryNames.length === 0 || visibleCategoryNames.includes(category)) {
      if (!acc[category]) acc[category] = [];
      acc[category].push(video);
    }
    return acc;
  }, {} as Record<string, DemoVideo[]>);

  // Sort categories by display order
  const sortedCategories = categories.length > 0
    ? categories.map(c => c.name).filter(name => groupedVideos[name])
    : Object.keys(groupedVideos);

  const featuredVideos = videos.filter((v) => v.is_featured);

  // Use settings with fallbacks
  const pageTitle = settings?.page_title || "Platform Videos";
  const pageSubtitle = settings?.page_subtitle || "Explore our collection of demo videos showcasing the Seeksy creator platform.";
  const buttonText = settings?.header_button_text || "Platform Overview";
  const buttonLink = settings?.header_button_link || "/platform";
  const showFeatured = settings?.show_featured_section ?? true;
  const showCategories = settings?.show_categories ?? true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Helmet>
        <title>{pageTitle} | Seeksy</title>
        <meta name="description" content={pageSubtitle} />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Seeksy</span>
          </div>
          {buttonText && buttonLink && (
            <Link to={buttonLink}>
              <Button variant="outline" size="sm" className="gap-2 border-white/20 text-white hover:bg-white/10">
                <FileText className="h-4 w-4" />
                {buttonText}
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {pageTitle}
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            {pageSubtitle}
          </p>
        </div>
      </section>

      {/* Featured Videos */}
      {showFeatured && featuredVideos.length > 0 && (
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-semibold text-white mb-6">Featured</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVideos.map((video) => (
                <VideoCard key={video.id} video={video} onClick={handleVideoSelect} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Videos by Category */}
      {showCategories && sortedCategories.map((category) => (
        <section key={category} className="pb-12">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold text-white mb-6">{category}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {groupedVideos[category].map((video) => (
                <VideoCard key={video.id} video={video} onClick={handleVideoSelect} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* All Videos (when categories disabled) */}
      {!showCategories && videos.length > 0 && (
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} onClick={handleVideoSelect} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && videos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-white/60">No videos available yet.</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        </div>
      )}

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && handleCloseVideo()}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0 overflow-hidden">
          {selectedVideo && (
            <div className="aspect-video">
              <video
                ref={videoRef}
                src={selectedVideo.video_url}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Seeksy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

interface VideoCardProps {
  video: DemoVideo;
  onClick: (video: DemoVideo) => void;
  featured?: boolean;
}

function VideoCard({ video, onClick, featured }: VideoCardProps) {
  return (
    <Card
      className={`group cursor-pointer overflow-hidden border-0 bg-white/5 hover:bg-white/10 transition-all duration-300 ${
        featured ? "ring-1 ring-primary/50" : ""
      }`}
      onClick={() => onClick(video)}
    >
      <div className="relative aspect-video bg-slate-800">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Play className="h-12 w-12 text-white/30" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
            <Play className="h-6 w-6 text-white ml-1" />
          </div>
        </div>

        {/* Duration badge */}
        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(video.duration_seconds)}
          </div>
        )}

        {/* Featured badge */}
        {featured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-primary rounded text-xs text-white font-medium">
            Featured
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-medium text-white line-clamp-1 mb-1">{video.title}</h3>
        {video.description && (
          <p className="text-sm text-white/60 line-clamp-2">{video.description}</p>
        )}
        <div className="mt-2">
          <span className="text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded">
            {video.category}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
