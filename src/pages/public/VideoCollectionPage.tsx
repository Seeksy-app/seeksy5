import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmailAccessGate, checkStoredAccess } from "@/components/videos/EmailAccessGate";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

interface VideoPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_private: boolean;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
}

export default function VideoCollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Fetch page data
  const { data: page, isLoading: pageLoading } = useQuery({
    queryKey: ["video-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_pages")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as VideoPage;
    },
    enabled: !!slug,
  });

  // Check stored access on mount
  useEffect(() => {
    if (page && !page.is_private) {
      setHasAccess(true);
    } else if (slug && checkStoredAccess(slug)) {
      setHasAccess(true);
    }
  }, [page, slug]);

  // Fetch videos for this page
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["video-page-videos", page?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_page_videos")
        .select(`
          display_order,
          video:demo_videos(*)
        `)
        .eq("page_id", page!.id)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []).map((item: any) => item.video as Video).filter(Boolean);
    },
    enabled: !!page?.id && hasAccess,
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-4">This video collection doesn't exist.</p>
          <Link to="/" className="text-primary hover:underline">
            Return home
          </Link>
        </div>
      </div>
    );
  }

  // Show gate if private and no access
  if (page.is_private && !hasAccess) {
    return (
      <>
        <Helmet>
          <title>{page.title} | Seeksy</title>
        </Helmet>
        <EmailAccessGate
          pageSlug={slug!}
          onAccessGranted={() => setHasAccess(true)}
        />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.title} | Seeksy</title>
        {page.description && <meta name="description" content={page.description} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              to={slug === 'platform' ? '/platform' : '/videos'}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {slug === 'platform' ? 'Back to Platform' : 'Back to Videos'}
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">{page.title}</h1>
            {page.description && (
              <p className="text-muted-foreground text-lg">{page.description}</p>
            )}
          </div>

          {/* Video Grid */}
          {videosLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No videos available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className="group text-left bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                >
                  <div className="relative aspect-video bg-muted">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-8 h-8 text-primary-foreground ml-1" />
                      </div>
                    </div>
                    {video.duration_seconds && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(video.duration_seconds)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {video.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedVideo && (
            <div className="relative">
              <video
                src={selectedVideo.video_url}
                controls
                autoPlay
                className="w-full aspect-video bg-black"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedVideo.title}
                </h2>
                {selectedVideo.description && (
                  <p className="text-muted-foreground mt-1">
                    {selectedVideo.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
