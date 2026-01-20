import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Video, Radio, Play, Upload } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProjectItem = {
  id: string;
  title: string;
  type: "audio" | "video";
  thumbnail: string | null;
  timestamp: string;
  status: string;
  route: string;
};

export const RecentProjectsFeed = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "audio" | "video">("all");

  const { data: projects, isLoading } = useQuery<ProjectItem[]>({
    queryKey: ["recent-studio-projects"],
    queryFn: async (): Promise<ProjectItem[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch recent podcast episodes (simplified query)
      // @ts-ignore - Bypass deep type inference issue
      const { data: episodes } = await supabase
        .from("episodes")
        .select("id, title, created_at, podcast_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent media files
      // @ts-ignore - Bypass deep type inference issue
      const { data: mediaFiles } = await supabase
        .from("media_files")
        .select("id, file_name, created_at, file_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Format results
      const episodeProjects: ProjectItem[] = (episodes || []).map((ep: any) => ({
        id: ep.id,
        title: ep.title,
        type: "audio" as const,
        thumbnail: null,
        timestamp: ep.created_at,
        status: "published",
        route: `/podcasts/${ep.podcast_id}?tab=episodes`,
      }));

      const mediaProjects: ProjectItem[] = (mediaFiles || []).map((mf: any) => ({
        id: mf.id,
        title: mf.file_name || "Untitled Recording",
        type: mf.file_type?.includes("video") ? "video" as const : "audio" as const,
        thumbnail: null,
        timestamp: mf.created_at,
        status: "draft",
        route: "/media-library",
      }));

      const allProjects = [...episodeProjects, ...mediaProjects];

      return allProjects.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 8);
    },
  });

  const filteredProjects = projects?.filter(p => 
    filter === "all" || p.type === filter
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "audio": return Mic;
      case "video": return Video;
      case "live": return Radio;
      default: return Mic;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "audio": return "text-purple-500";
      case "video": return "text-blue-500";
      case "live": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="text-2xl">Recent Projects</CardTitle>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {!filteredProjects || filteredProjects.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No recent projects. Start creating!
          </p>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => {
              const TypeIcon = getTypeIcon(project.type);
              return (
                <div
                  key={project.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <TypeIcon className={`w-6 h-6 ${getTypeColor(project.type)}`} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {project.type}
                      </Badge>
                      {project.status === "draft" && (
                        <Badge variant="outline" className="text-xs">Draft</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {project.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(project.timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(project.route)}
                      className="gap-2"
                    >
                      <Play className="w-3 h-3" />
                      Resume
                    </Button>
                    {project.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => navigate(project.route)}
                        className="gap-2"
                      >
                        <Upload className="w-3 h-3" />
                        Publish
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
