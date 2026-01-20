import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, MoreVertical, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ClipLibraryWidget = () => {
  const navigate = useNavigate();

  const { data: clips, isLoading } = useQuery({
    queryKey: ["clip-library-widget"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await (supabase as any)
        .from("clips")
        .select("id, title, created_at, thumbnail_url")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(4);

      return data || [];
    },
  });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Video className="h-4 w-4 text-muted-foreground" />
            Clip Library
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            Your AI-generated clips
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
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-video bg-muted animate-pulse rounded" />
            <div className="aspect-video bg-muted animate-pulse rounded" />
          </div>
        ) : !clips || clips.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p className="mb-3">You haven't created clips yet. Upload a video or let Seeksy generate highlights for you.</p>
            <Button size="sm" onClick={() => navigate("/clips")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Clip
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {clips.slice(0, 4).map((clip: any) => (
                <div
                  key={clip.id}
                  className="relative aspect-video bg-muted rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate("/clips")}
                >
                  {clip.thumbnail_url ? (
                    <img src={clip.thumbnail_url} alt={clip.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/clips")}>
              View All Clips
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
