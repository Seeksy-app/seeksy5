import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface DirectoriesTabProps {
  userId: string;
}

const DIRECTORIES = [
  { name: "Apple Podcasts", icon: "🎵", url: "https://podcasts.apple.com/" },
  { name: "Spotify", icon: "🎧", url: "https://podcasters.spotify.com/" },
  { name: "Amazon Music", icon: "🎵", url: "https://music.amazon.com/podcasters/" },
  { name: "YouTube", icon: "▶️", url: "https://studio.youtube.com/" },
  { name: "iHeartRadio", icon: "❤️", url: "https://www.iheart.com/podcast-submit/" },
  { name: "Podcast Index", icon: "📡", url: "https://podcastindex.org/" },
  { name: "Podcast Addict", icon: "🎙️", url: "https://podcastaddict.com/" },
  { name: "Podchaser", icon: "🔍", url: "https://www.podchaser.com/" },
  { name: "Pocket Casts", icon: "📻", url: "https://www.pocketcasts.com/" },
  { name: "Deezer", icon: "💜", url: "https://www.deezer.com/explore/podcasts/" },
  { name: "Listen Notes", icon: "🎧", url: "https://www.listennotes.com/" },
  { name: "Player FM", icon: "⭕", url: "https://player.fm/" },
];

export const DirectoriesTab = ({ userId }: DirectoriesTabProps) => {
  const [selectedPodcast, setSelectedPodcast] = useState<string>("");

  const { data: podcasts } = useQuery({
    queryKey: ["podcasts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: directoryStatus, refetch } = useQuery({
    queryKey: ["podcast-directories", selectedPodcast],
    queryFn: async () => {
      if (!selectedPodcast) return [];
      const result = await (supabase as any)
        .from("podcast_directories")
        .select("*")
        .eq("podcast_id", selectedPodcast);
      
      if (result.error) throw result.error;
      return (result.data || []) as any[];
    },
    enabled: !!selectedPodcast,
  });

  const handleUpdateStatus = async (directoryName: string, newStatus: string) => {
    if (!selectedPodcast) return;

    try {
      const { error } = await (supabase as any)
        .from("podcast_directories")
        .upsert({
          podcast_id: selectedPodcast,
          directory_name: directoryName,
          status: newStatus,
          submitted_at: newStatus === "submitted" ? new Date().toISOString() : null,
          approved_at: newStatus === "listed" ? new Date().toISOString() : null,
        });

      if (error) throw error;

      toast.success("Status updated");
      refetch();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "listed": return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "submitted": return <Clock className="w-5 h-5 text-yellow-600" />;
      case "rejected": return <XCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  const getDirectoryStatus = (directoryName: string) => {
    return directoryStatus?.find(d => d.directory_name === directoryName);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Podcast</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPodcast} onValueChange={setSelectedPodcast}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a podcast to manage" />
            </SelectTrigger>
            <SelectContent>
              {podcasts?.map((podcast) => (
                <SelectItem key={podcast.id} value={podcast.id}>
                  {podcast.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedPodcast && (
        <>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Tip:</strong> Click on each directory name to visit their submission page. 
              Update the status here as you progress through each directory's submission process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DIRECTORIES.map((directory) => {
              const status = getDirectoryStatus(directory.name);
              return (
                <Card key={directory.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-2xl">{directory.icon}</span>
                        {directory.name}
                      </CardTitle>
                      {status && getStatusIcon(status.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(directory.url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit {directory.name}
                    </Button>

                    <Select
                      value={status?.status || "not_submitted"}
                      onValueChange={(value) => handleUpdateStatus(directory.name, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_submitted">Not Submitted</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="listed">✓ Listed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!selectedPodcast && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a podcast above to manage directory submissions
          </CardContent>
        </Card>
      )}
    </div>
  );
};
