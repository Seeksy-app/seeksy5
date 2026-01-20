import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Edit, 
  ExternalLink, 
  Radio, 
  Award,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface EpisodesTabProps {
  podcastId: string;
  userId: string;
}

export const EpisodesTab = ({ podcastId, userId }: EpisodesTabProps) => {
  const navigate = useNavigate();
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["podcast-episodes-full", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("podcast_id", podcastId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">All Episodes</h3>
        <Button onClick={() => navigate(`/podcasts/${podcastId}/episodes/new-from-studio`)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Episode
        </Button>
      </div>

      {episodes && episodes.length > 0 ? (
        <div className="space-y-3">
          {episodes.map((episode) => (
            <Card key={episode.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{episode.title}</h4>
                      <Badge variant={episode.is_published ? "default" : "secondary"}>
                        {episode.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>
                        {episode.publish_date 
                          ? format(new Date(episode.publish_date), 'MMM d, yyyy')
                          : format(new Date(episode.created_at), 'MMM d, yyyy')}
                      </span>
                      {episode.duration_seconds && <span>{Math.floor(episode.duration_seconds / 60)}m</span>}
                      <span>0 listens</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/podcasts/${podcastId}/episodes/${episode.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/episodes/${episode.id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate("/studio")}
                    >
                      <Radio className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No episodes yet</p>
            <Button onClick={() => navigate(`/podcasts/${podcastId}/episodes/new-from-studio`)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Episode
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
