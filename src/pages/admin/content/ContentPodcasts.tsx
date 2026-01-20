import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Plus, Play, Clock, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ContentPodcasts() {
  const { data: podcasts = [], isLoading } = useQuery({
    queryKey: ['admin-podcasts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*, episodes(count)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mic className="h-8 w-8 text-primary" />
            Podcasts
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all podcasts across the platform
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Podcast
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Podcasts</CardDescription>
            <CardTitle className="text-2xl">{podcasts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published Episodes</CardDescription>
            <CardTitle className="text-2xl">--</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Listens</CardDescription>
            <CardTitle className="text-2xl">--</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Duration</CardDescription>
            <CardTitle className="text-2xl">--</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Podcasts</CardTitle>
          <CardDescription>
            All podcasts created on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : podcasts.length === 0 ? (
            <div className="text-center py-12">
              <Mic className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No podcasts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {podcasts.map((podcast: any) => (
                <div key={podcast.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                    {podcast.cover_image_url ? (
                      <img src={podcast.cover_image_url} alt={podcast.title} className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <Mic className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{podcast.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{podcast.description}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
