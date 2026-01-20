import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Home, FileText, Radio, Monitor, Globe, DollarSign, BarChart3, List, RefreshCw, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OverviewTab } from "@/components/podcast/OverviewTab";
import { EpisodesTab } from "@/components/podcast/EpisodesTab";
import { PodcastStudioTab } from "@/components/podcast/PodcastStudioTab";
import { PlayersTab } from "@/components/podcast/PlayersTab";
import { WebsiteTab } from "@/components/podcast/WebsiteTab";
import { MonetizationTab } from "@/components/podcast/MonetizationTab";
import { StatsTab } from "@/components/podcast/StatsTab";
import { DirectoriesTab } from "@/components/podcast/DirectoriesTab";
import { RSSMigrationWizard } from "@/components/podcast/RSSMigrationWizard";

const PodcastDetail = () => {
  const { podcastId: id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isDeleting, setIsDeleting] = useState(false);

  console.log("🔍 PodcastDetail - Route param podcastId:", id);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcast, isLoading } = useQuery({
    queryKey: ["podcast", id],
    queryFn: async () => {
      console.log("🔍 PodcastDetail - Fetching podcast with ID:", id);
      console.log("🔍 PodcastDetail - Current user:", user?.id);
      
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      console.log("🔍 PodcastDetail - Query result:", { data, error });
      
      if (error) {
        console.error("🔍 PodcastDetail - Query error:", error);
        throw error;
      }
      
      if (!data) {
        console.warn("🔍 PodcastDetail - No podcast found for ID:", id);
      } else {
        console.log("🔍 PodcastDetail - Podcast found:", {
          id: data.id,
          title: data.title,
          user_id: data.user_id,
          matchesCurrentUser: data.user_id === user?.id
        });
      }
      
      return data;
    },
  });

  // Persist tab selection in localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem("podcast-detail-tab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem("podcast-detail-tab", activeTab);
  }, [activeTab]);

  const handleDeletePodcast = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("podcasts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Podcast deleted",
        description: "Your podcast and all episodes have been removed.",
      });

      queryClient.invalidateQueries({ queryKey: ["podcasts"] });
      navigate("/podcasts");
    } catch (error) {
      console.error("Error deleting podcast:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete podcast. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
          <p className="text-muted-foreground">Loading podcast...</p>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground mb-4">Podcast not found</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Podcast ID: {id}</p>
            <p>Your User ID: {user?.id}</p>
            <p className="text-destructive">
              This usually means the podcast doesn't exist or you don't have access to it.
            </p>
          </div>
          <Button onClick={() => navigate("/podcasts")}>Back to Podcasts</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/podcasts")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            {podcast.cover_image_url && (
              <img
                src={podcast.cover_image_url}
                alt={podcast.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">{podcast.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                {podcast.source !== 'rss' && (
                  <div className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded text-xs font-medium text-white">
                    Hosted by Seeksy
                  </div>
                )}
                {podcast.source === 'rss' && (
                  <div className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-xs font-medium text-amber-600 dark:text-amber-400">
                    Imported from RSS
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">My Podcasts</span>
            <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">Resources</span>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this podcast?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p className="font-semibold text-destructive">
                      Warning: All episodes will be permanently deleted.
                    </p>
                    <p>
                      If you imported this podcast from another host, you may want to complete the RSS Migration process first to ensure a smooth transition.
                    </p>
                    <p>
                      Would you like to migrate your RSS feed before deleting, or proceed with deletion?
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab("rss-migration");
                    }}
                  >
                    Migrate First
                  </Button>
                  <AlertDialogAction
                    onClick={handleDeletePodcast}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete Anyway"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
          <TabsList className="bg-transparent border-b-0 h-auto p-0 gap-2">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="episodes"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Episodes
            </TabsTrigger>
            <TabsTrigger
              value="studio"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              Studio
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              Players
            </TabsTrigger>
            <TabsTrigger
              value="website"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Website
            </TabsTrigger>
            <TabsTrigger
              value="monetization"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Monetization
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger
              value="directories"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Directories
            </TabsTrigger>
            <TabsTrigger
              value="rss-migration"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-3 text-base flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              RSS Migration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 p-6">
            <OverviewTab podcastId={id!} userId={user.id} />
          </TabsContent>

          <TabsContent value="episodes" className="mt-0 p-6">
            <EpisodesTab podcastId={id!} userId={user.id} />
          </TabsContent>

          <TabsContent value="studio" className="mt-0 p-6">
            <PodcastStudioTab podcastId={id!} userId={user.id} />
          </TabsContent>

          <TabsContent value="players" className="mt-0 p-6">
            <PlayersTab podcastId={id!} />
          </TabsContent>

          <TabsContent value="website" className="mt-0 p-6">
            <WebsiteTab podcastId={id!} />
          </TabsContent>

          <TabsContent value="monetization" className="mt-0 p-6">
            <MonetizationTab podcastId={id!} />
          </TabsContent>

          <TabsContent value="stats" className="mt-0 p-6">
            <StatsTab podcastId={id!} />
          </TabsContent>

          <TabsContent value="directories" className="mt-0 p-6">
            <DirectoriesTab userId={user.id} />
          </TabsContent>

          <TabsContent value="rss-migration" className="mt-0 p-6">
            <RSSMigrationWizard userId={user.id} podcastId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PodcastDetail;
