import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { OverviewTab } from "@/components/podcast/OverviewTab";
import { EpisodesTab } from "@/components/podcast/EpisodesTab";
import { PodcastStudioTab } from "@/components/podcast/PodcastStudioTab";
import { PlayersTab } from "@/components/podcast/PlayersTab";
import { WebsiteTab } from "@/components/podcast/WebsiteTab";
import { MonetizationTab } from "@/components/podcast/MonetizationTab";
import { StatsTab } from "@/components/podcast/StatsTab";
import { DirectoriesTab } from "@/components/podcast/DirectoriesTab";

export default function PodcastDistribution() {
  const [selectedPodcast, setSelectedPodcast] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcasts } = useQuery({
    queryKey: ["user-podcasts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Persist tab selection in localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem("podcast-dashboard-tab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem("podcast-dashboard-tab", activeTab);
  }, [activeTab]);

  // Auto-select first podcast if none selected
  useEffect(() => {
    if (!selectedPodcast && podcasts && podcasts.length > 0) {
      setSelectedPodcast(podcasts[0].id);
    }
  }, [podcasts, selectedPodcast]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Podcast Dashboard</h1>
              <p className="text-muted-foreground">Manage your podcast content, analytics, and monetization</p>
            </div>
            {podcasts && podcasts.length > 0 && (
              <Select value={selectedPodcast} onValueChange={setSelectedPodcast}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a podcast" />
                </SelectTrigger>
                <SelectContent>
                  {podcasts.map((podcast) => (
                    <SelectItem key={podcast.id} value={podcast.id}>
                      {podcast.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {selectedPodcast ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8 mb-8 sticky top-0 bg-background z-10">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="episodes">Episodes</TabsTrigger>
              <TabsTrigger value="studio">Studio</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="website">Website</TabsTrigger>
              <TabsTrigger value="monetization">Monetization</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="directories">Directories</TabsTrigger>
            </TabsList>

            {activeTab === "overview" && (
              <TabsContent value="overview">
                <OverviewTab podcastId={selectedPodcast} userId={user.id} />
              </TabsContent>
            )}

            {activeTab === "episodes" && (
              <TabsContent value="episodes">
                <EpisodesTab podcastId={selectedPodcast} userId={user.id} />
              </TabsContent>
            )}

            {activeTab === "studio" && (
              <TabsContent value="studio">
                <PodcastStudioTab podcastId={selectedPodcast} userId={user.id} />
              </TabsContent>
            )}

            {activeTab === "players" && (
              <TabsContent value="players">
                <PlayersTab podcastId={selectedPodcast} />
              </TabsContent>
            )}

            {activeTab === "website" && (
              <TabsContent value="website">
                <WebsiteTab podcastId={selectedPodcast} />
              </TabsContent>
            )}

            {activeTab === "monetization" && (
              <TabsContent value="monetization">
                <MonetizationTab podcastId={selectedPodcast} />
              </TabsContent>
            )}

            {activeTab === "stats" && (
              <TabsContent value="stats">
                <StatsTab podcastId={selectedPodcast} />
              </TabsContent>
            )}

            {activeTab === "directories" && (
              <TabsContent value="directories">
                <DirectoriesTab userId={user.id} />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No podcasts found. Create your first podcast to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
