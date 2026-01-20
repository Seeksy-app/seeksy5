import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Podcast, Calendar, Clock, TrendingUp, Globe, MoreVertical, Upload, ExternalLink, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function PodcastDashboard() {
  const { podcastId } = useParams();

  const { data: podcast, isLoading } = useQuery({
    queryKey: ['podcast', podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('id', podcastId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!podcastId,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ['podcast-episodes', podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('podcast_id', podcastId)
        .order('publish_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!podcastId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9] dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Podcast className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading podcast...</p>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9] dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Podcast className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Podcast Not Found</h2>
          <p className="text-muted-foreground mb-4">This podcast doesn't exist or you don't have access.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const totalEpisodes = episodes.length;
  const importedEpisodes = episodes.filter(ep => ep.source === 'rss').length;
  const totalDuration = episodes.reduce((acc, ep) => acc + (ep.duration_seconds || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9] dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex gap-4">
              {podcast.cover_image_url && (
                <img 
                  src={podcast.cover_image_url} 
                  alt={podcast.title}
                  className="w-24 h-24 rounded-xl object-cover shadow-lg"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold mb-2">{podcast.title}</h1>
                <p className="text-muted-foreground max-w-2xl">{podcast.description}</p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>More options: Settings, Export, Archive</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="hover:shadow-lg transition-all cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalEpisodes}</div>
                    <p className="text-xs text-muted-foreground">All published episodes</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Total number of episodes in your podcast feed, including both imported and newly created episodes</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="hover:shadow-lg transition-all cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalMinutes} min</div>
                    <p className="text-xs text-muted-foreground">Combined length</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Total listening time across all episodes - helps you understand your content volume</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="hover:shadow-lg transition-all cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Imported Episodes</CardTitle>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{importedEpisodes}</div>
                    <p className="text-xs text-muted-foreground">From RSS feeds</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Episodes brought in from external RSS feeds (Buzzsprout, Anchor, etc.) - tracked separately for migration tracking</p>
              </TooltipContent>
            </Tooltip>

            <Card className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Distribution</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">Apple</Badge>
                  <Badge variant="outline" className="text-xs">Spotify</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Active platforms</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your podcast and episodes</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button>
                <Podcast className="h-4 w-4 mr-2" />
                Create Episode
              </Button>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Episode
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Migrate RSS
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Move your podcast from another host with 301 redirects - keeps your subscribers seamlessly</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">
                    <Globe className="h-4 w-4 mr-2" />
                    Publish to Directories
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Submit your podcast to Apple Podcasts, Spotify, Amazon Music, and other directories</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          {/* Recent Episodes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Episodes</CardTitle>
              <CardDescription>Latest published episodes from your podcast</CardDescription>
            </CardHeader>
            <CardContent>
              {episodes.length === 0 ? (
                <div className="text-center py-12">
                  <Podcast className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Episodes Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first episode to start building your podcast
                  </p>
                  <Button>Create Episode</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {episodes.slice(0, 5).map((episode) => (
                    <div key={episode.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{episode.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(episode.publish_date || episode.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.floor((episode.duration_seconds || 0) / 60)} min
                          </span>
                          {episode.source === 'rss' && (
                            <Badge variant="outline" className="text-xs">Imported</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}