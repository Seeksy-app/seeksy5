import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Mic, FileText, Scissors, FolderOpen, Plus, Radio, Upload, RefreshCw, Podcast } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function ContentHub() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("podcasts"); // Default to podcasts

  // Check URL hash to set active tab
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['recent', 'podcasts', 'videos', 'clips', 'drafts'].includes(hash)) {
      setActiveTab(hash);
    } else {
      // Default to podcasts if no valid hash
      setActiveTab("podcasts");
    }
  }, [location.hash]);

  // Fetch user's podcasts
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcasts = [], isLoading: podcastsLoading } = useQuery({
    queryKey: ["podcasts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Count total episodes across all podcasts
  const { data: episodeCount = 0 } = useQuery({
    queryKey: ["total-episodes", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const podcastIds = podcasts.map(p => p.id);
      if (podcastIds.length === 0) return 0;

      const { count, error } = await supabase
        .from("episodes")
        .select("*", { count: "exact", head: true })
        .in("podcast_id", podcastIds);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id && podcasts.length > 0,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Video className="h-8 w-8" />
              Content & Media
            </h1>
            <p className="text-muted-foreground mt-1">
              All your creation tools, media library, and content in one place
            </p>
          </div>
          <Button asChild>
            <Link to="/studio">
              <Plus className="h-4 w-4 mr-2" />
              Create Content
            </Link>
          </Button>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/studio">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Podcast Studio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Record, edit, and publish podcast episodes
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/studio/video">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Studio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and edit video content
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/clips">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  AI Clips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate social-ready clips with AI
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/media/library">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Media Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Browse and manage all your media files
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="clips">Clips</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Content</CardTitle>
                <CardDescription>
                  Your most recently created and edited content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent content. Start creating!</p>
                  <Button className="mt-4" asChild>
                    <Link to="/studio">Go to Studio</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="podcasts" className="space-y-4">
            {/* Analytics Row */}
            {podcasts.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{podcasts.length}</div>
                    <p className="text-xs text-muted-foreground">Total Podcasts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{episodeCount}</div>
                    <p className="text-xs text-muted-foreground">Total Episodes</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Empty State */}
            {!podcastsLoading && podcasts.length === 0 && (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-primary/10 p-6">
                        <Podcast className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Welcome to Podcast Studio</h3>
                      <p className="text-muted-foreground">
                        Start a podcast or import your existing one.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button asChild>
                        <Link to="/podcasts/create">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Podcast
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/podcasts">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Import via RSS
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/podcasts">
                          <Upload className="h-4 w-4 mr-2" />
                          Migrate from Another Platform
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to="/studio">
                          <Mic className="h-4 w-4 mr-2" />
                          Open Podcast Studio
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Podcast Cards Grid */}
            {!podcastsLoading && podcasts.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your Podcasts</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {podcasts.map((podcast) => (
                    <Card key={podcast.id} className="overflow-hidden hover:border-primary transition-colors">
                      <div className="aspect-square bg-muted relative">
                        {podcast.cover_image_url ? (
                          <img 
                            src={podcast.cover_image_url} 
                            alt={podcast.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Podcast className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        {podcast.is_published && (
                          <Badge className="absolute top-2 right-2">Published</Badge>
                        )}
                        {!podcast.is_published && (
                          <Badge variant="secondary" className="absolute top-2 right-2">Draft</Badge>
                        )}
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base line-clamp-2">{podcast.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {/* Episode count would need a separate query per podcast or join */}
                          {podcast.description?.substring(0, 60)}...
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button asChild className="w-full" size="sm">
                          <Link to={`/podcasts/${podcast.id}`}>
                            Manage Podcast
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons Below Cards */}
                <div className="flex gap-3 pt-4">
                  <Button asChild>
                    <Link to="/podcasts/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Podcast
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/podcasts">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Import via RSS
                    </Link>
                  </Button>
                </div>
              </>
            )}

            {/* Loading State */}
            {podcastsLoading && (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center text-muted-foreground">
                    <p>Loading podcasts...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Video Content</CardTitle>
                <CardDescription>
                  All your video recordings and uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>Video library coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Social Clips</CardTitle>
                <CardDescription>
                  AI-generated clips ready for social media
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>Clips library coming soon</p>
                  <Button className="mt-4" variant="outline" asChild>
                    <Link to="/clips">Create Clips</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Drafts</CardTitle>
                <CardDescription>
                  Unfinished content and work in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>No drafts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
