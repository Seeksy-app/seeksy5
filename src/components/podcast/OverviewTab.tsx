import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPodcastRevenue } from "@/lib/api/financialApis";
import { 
  Mic, 
  Radio, 
  Share2, 
  TrendingUp, 
  Users, 
  MapPin, 
  DollarSign,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { EpisodeCreationModal } from "./EpisodeCreationModal";

interface OverviewTabProps {
  podcastId: string;
  userId: string;
}

export const OverviewTab = ({ podcastId, userId }: OverviewTabProps) => {
  const navigate = useNavigate();
  const [showCreationModal, setShowCreationModal] = useState(false);

  const { data: podcast, isLoading: podcastLoading } = useQuery({
    queryKey: ["podcast", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", podcastId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ["podcast-episodes", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("podcast_id", podcastId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: episodeCount } = useQuery({
    queryKey: ["podcast-episodes-count", podcastId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("episodes")
        .select("*", { count: 'exact', head: true })
        .eq("podcast_id", podcastId);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: directories } = useQuery({
    queryKey: ["podcast-directories", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcast_directories")
        .select("*")
        .eq("podcast_id", podcastId);
      if (error) throw error;
      return data;
    },
  });

  const { data: revenue } = useQuery({
    queryKey: ["podcast-revenue", podcastId],
    queryFn: () => getPodcastRevenue(podcastId),
  });

  const handleShare = () => {
    if (!podcast?.rss_feed_url) return;
    navigator.clipboard.writeText(podcast.rss_feed_url);
  };

  if (podcastLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const appleStatus = directories?.find(d => d.directory_name === "Apple Podcasts");
  const spotifyStatus = directories?.find(d => d.directory_name === "Spotify");
  const amazonStatus = directories?.find(d => d.directory_name === "Amazon Music");

  return (
    <div className="space-y-6">
      {/* Hero Band */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {podcast?.cover_image_url && (
              <img 
                src={podcast.cover_image_url} 
                alt={podcast.title}
                className="w-28 h-28 rounded-xl object-cover shadow-lg ring-2 ring-primary/20"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">Your Podcast</span>
              </div>
              <h2 className="text-3xl font-bold mb-1">{podcast?.title}</h2>
              <p className="text-muted-foreground mb-4">
                Hosted by {podcast?.author || "Not specified"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowCreationModal(true)} size="lg" className="gap-2">
                  <Mic className="w-4 h-4" />
                  Create Episode
                </Button>
                <Button variant="outline" onClick={handleShare} size="lg" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                {podcast?.rss_feed_url && (
                  <Button variant="ghost" asChild size="lg" className="gap-2">
                    <a href={podcast.rss_feed_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      RSS Feed
                    </a>
                  </Button>
                )}
              </div>
              
              <EpisodeCreationModal 
                open={showCreationModal}
                onOpenChange={setShowCreationModal}
                podcastId={podcastId}
                podcastTitle={podcast?.title || ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{episodeCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Published episodes</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listens</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue?.total_impressions?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All-time plays</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenue?.total_revenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total earnings</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue?.total_ad_reads?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total ad reads</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Episodes & Distribution Status */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Episodes</CardTitle>
          </CardHeader>
          <CardContent>
            {episodesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : episodes && episodes.length > 0 ? (
              <div className="space-y-2">
                {episodes.map((episode) => (
                  <div key={episode.id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50 hover:bg-card transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{episode.title}</p>
                      <p className="text-sm text-muted-foreground">
                      {episode.created_at && format(new Date(episode.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant={episode.is_published ? "default" : "secondary"}>
                      {episode.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No episodes yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Distribution Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="font-medium">Apple Podcasts</span>
              {appleStatus?.status === "listed" ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Listed
                </Badge>
              ) : appleStatus?.status === "submitted" ? (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              ) : (
                <Badge variant="outline">Not Submitted</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="font-medium">Spotify</span>
              {spotifyStatus?.status === "listed" ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Listed
                </Badge>
              ) : spotifyStatus?.status === "submitted" ? (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              ) : (
                <Badge variant="outline">Not Submitted</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="font-medium">Amazon Music</span>
              {amazonStatus?.status === "listed" ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Listed
                </Badge>
              ) : amazonStatus?.status === "submitted" ? (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              ) : (
                <Badge variant="outline">Not Submitted</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="font-medium">RSS Feed</span>
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
