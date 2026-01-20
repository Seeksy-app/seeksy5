import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, Sparkles, Tv, Image, Video, Check, RefreshCw, 
  Trash2, Eye, Radio, Scissors, Star, Users, Play,
  ExternalLink, Database, Zap
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function TVContentSeeder() {
  const [generateThumbnails, setGenerateThumbnails] = useState(true);
  const [seedProgress, setSeedProgress] = useState(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch current TV stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["tv-seeder-stats"],
    queryFn: async () => {
      const [channelsRes, contentRes] = await Promise.all([
        supabase.from("tv_channels").select("id, name, category, avatar_url, is_active", { count: "exact" }),
        supabase.from("tv_content").select("id, title, content_type, thumbnail_url, is_published, view_count", { count: "exact" }),
      ]);
      
      const activeChannels = channelsRes.data?.filter(c => c.is_active) || [];
      const publishedContent = contentRes.data?.filter(c => c.is_published) || [];
      const contentWithThumbnails = contentRes.data?.filter(c => c.thumbnail_url) || [];
      const contentByType = contentRes.data?.reduce((acc, c) => {
        acc[c.content_type || "unknown"] = (acc[c.content_type || "unknown"] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      const totalViews = contentRes.data?.reduce((sum, c) => sum + (c.view_count || 0), 0) || 0;

      return {
        channels: channelsRes.count || 0,
        activeChannels: activeChannels.length,
        content: contentRes.count || 0,
        publishedContent: publishedContent.length,
        withThumbnails: contentWithThumbnails.length,
        byType: contentByType,
        totalViews,
        channelsList: channelsRes.data || [],
        contentList: contentRes.data || [],
      };
    },
  });

  // Seed mutation
  const seedMutation = useMutation({
    mutationFn: async (action: string) => {
      setSeedProgress(10);
      const { data, error } = await supabase.functions.invoke("seed-tv-content", {
        body: { action, generateThumbnails },
      });
      setSeedProgress(100);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Content seeded successfully!");
      queryClient.invalidateQueries({ queryKey: ["tv-seeder-stats"] });
      setTimeout(() => setSeedProgress(0), 2000);
    },
    onError: (error: Error) => {
      toast.error(`Seeding failed: ${error.message}`);
      setSeedProgress(0);
    },
  });

  // Clear mutation
  const clearMutation = useMutation({
    mutationFn: async (table: "channels" | "content" | "all") => {
      if (table === "all" || table === "content") {
        await supabase.from("tv_content").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }
      if (table === "all" || table === "channels") {
        await supabase.from("tv_channels").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }
    },
    onSuccess: () => {
      toast.success("Content cleared successfully!");
      queryClient.invalidateQueries({ queryKey: ["tv-seeder-stats"] });
    },
    onError: (error: Error) => {
      toast.error(`Clear failed: ${error.message}`);
    },
  });

  const StatCard = ({ icon: Icon, label, value, subValue, color = "primary" }: any) => (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 p-6 border border-border/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-4xl font-bold">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg bg-${color}/20 flex items-center justify-center`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <Tv className="h-6 w-6 text-white" />
            </div>
            Seeksy TV Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage TV content, generate AI thumbnails, and seed demo data
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/tv')}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          View TV
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={Radio} 
          label="Channels" 
          value={stats?.channels || 0}
          subValue={`${stats?.activeChannels || 0} active`}
          color="amber-500"
        />
        <StatCard 
          icon={Video} 
          label="Content Items" 
          value={stats?.content || 0}
          subValue={`${stats?.publishedContent || 0} published`}
          color="blue-500"
        />
        <StatCard 
          icon={Image} 
          label="With Thumbnails" 
          value={stats?.withThumbnails || 0}
          subValue={`${Math.round((stats?.withThumbnails || 0) / (stats?.content || 1) * 100)}% coverage`}
          color="green-500"
        />
        <StatCard 
          icon={Eye} 
          label="Total Views" 
          value={stats?.totalViews?.toLocaleString() || 0}
          subValue="across all content"
          color="purple-500"
        />
      </div>

      {/* Content Type Breakdown */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Content by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.byType).map(([type, count]) => (
                <Badge 
                  key={type} 
                  variant="secondary" 
                  className="text-sm px-4 py-2 flex items-center gap-2"
                >
                  {type === "episode" && <Radio className="h-4 w-4 text-blue-500" />}
                  {type === "clip" && <Scissors className="h-4 w-4 text-purple-500" />}
                  {type === "spotlight" && <Star className="h-4 w-4 text-amber-500" />}
                  <span className="capitalize">{type}</span>
                  <span className="font-bold">{count as number}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="seed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="seed" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Seed Content
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-2">
            <Database className="h-4 w-4" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Seed Tab */}
        <TabsContent value="seed" className="space-y-6">
          {/* Progress Bar */}
          {seedProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Seeding content...</span>
                <span>{seedProgress}%</span>
              </div>
              <Progress value={seedProgress} className="h-2" />
            </div>
          )}

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Generation Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="generate-thumbnails" className="text-base font-medium">Generate AI Thumbnails</Label>
                  <p className="text-sm text-muted-foreground">
                    Use Lovable AI to generate unique thumbnails (slower but visually impressive)
                  </p>
                </div>
                <Switch
                  id="generate-thumbnails"
                  checked={generateThumbnails}
                  onCheckedChange={setGenerateThumbnails}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seed Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="relative overflow-hidden group hover:border-amber-500/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Seed Everything
                </CardTitle>
                <CardDescription>
                  Creates 8 channels + 22 content items with AI thumbnails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => seedMutation.mutate("seed_all")}
                  disabled={seedMutation.isPending}
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  size="lg"
                >
                  {seedMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Seed All Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:border-blue-500/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Channels Only
                </CardTitle>
                <CardDescription>
                  Creates 8 creator channels with avatars and metadata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => seedMutation.mutate("channels")}
                  disabled={seedMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {seedMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Create Channels
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:border-green-500/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-green-500" />
                  Content Only
                </CardTitle>
                <CardDescription>
                  Creates episodes, clips, and spotlights with thumbnails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => seedMutation.mutate("content")}
                  disabled={seedMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {seedMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Video className="h-4 w-4 mr-2" />
                  )}
                  Create Content
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Success Message */}
          {seedMutation.isSuccess && seedMutation.data && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  Seeding Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-green-600">{seedMutation.data.message}</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/tv')}
                  className="mt-4 gap-2"
                >
                  <Play className="h-4 w-4" />
                  View Seeksy TV
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Clear Content
              </CardTitle>
              <CardDescription>
                Remove seeded content from the database. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => clearMutation.mutate("content")}
                disabled={clearMutation.isPending}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Clear Content
              </Button>
              <Button
                variant="outline"
                onClick={() => clearMutation.mutate("channels")}
                disabled={clearMutation.isPending}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                Clear Channels
              </Button>
              <Button
                variant="destructive"
                onClick={() => clearMutation.mutate("all")}
                disabled={clearMutation.isPending}
              >
                Clear Everything
              </Button>
            </CardContent>
          </Card>

          {/* Content Templates Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Templates</CardTitle>
              <CardDescription>What gets created when you seed content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    8 Creator Channels
                  </h4>
                  <p className="text-muted-foreground">
                    Tech Insider Daily, The Wellness Hour, Business Unplugged, Creative Studio, 
                    True Crime Weekly, Startup Stories, AI Frontiers, Mindful Living
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-green-500" />
                    10 Podcast Episodes
                  </h4>
                  <p className="text-muted-foreground">
                    Full-length episodes across Technology, Business, Health, Design, and True Crime categories
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-purple-500" />
                    8 AI Clips
                  </h4>
                  <p className="text-muted-foreground">
                    Short-form vertical content styled like TikTok and YouTube Shorts with AI badges
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    4 Creator Spotlights
                  </h4>
                  <p className="text-muted-foreground">
                    Behind-the-scenes content and creator journey stories
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {/* Recent Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Channels</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.channelsList?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {stats.channelsList.slice(0, 6).map((channel: any) => (
                    <div key={channel.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                        {channel.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{channel.name}</p>
                        <p className="text-xs text-muted-foreground">{channel.category}</p>
                      </div>
                      <Badge variant={channel.is_active ? "default" : "secondary"}>
                        {channel.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No channels yet. Seed some content to get started!</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Content</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.contentList?.length ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {stats.contentList.slice(0, 9).map((content: any) => (
                    <div key={content.id} className="rounded-lg overflow-hidden bg-muted/50">
                      <div className="aspect-video bg-gray-200 relative">
                        {content.thumbnail_url ? (
                          <img src={content.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <Badge className="absolute top-2 left-2 text-xs capitalize">
                          {content.content_type}
                        </Badge>
                      </div>
                      <div className="p-3">
                        <p className="font-medium truncate text-sm">{content.title}</p>
                        <p className="text-xs text-muted-foreground">{content.view_count?.toLocaleString() || 0} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No content yet. Seed some content to get started!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
