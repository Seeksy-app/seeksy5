import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MoreVertical, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const RecentEpisodesWidget = () => {
  const navigate = useNavigate();

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["recent-episodes-widget"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("episodes")
        .select("id, title, created_at, podcast_id, podcasts(title)")
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Mic className="h-4 w-4 text-muted-foreground" />
            Recent Episodes
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Your latest podcast episodes
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Hide widget</DropdownMenuItem>
            <DropdownMenuItem>Customize</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-12 bg-muted animate-pulse rounded" />
          </div>
        ) : !episodes || episodes.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p className="mb-3">No episodes yet — upload your first one or record directly in Seeksy.</p>
            <Button size="sm" onClick={() => navigate("/studio")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Episode
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {episodes.map((episode: any) => (
              <div
                key={episode.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/podcasts/${episode.podcast_id}/episodes/${episode.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{episode.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {episode.podcasts?.title}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(episode.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
