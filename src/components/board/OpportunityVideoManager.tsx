import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, Plus, X, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";

interface OpportunityVideoManagerProps {
  opportunityId: string;
  opportunityName: string;
}

export function OpportunityVideoManager({ opportunityId, opportunityName }: OpportunityVideoManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  type DemoVideo = { id: string; title: string; thumbnail_url: string | null; duration_seconds: number | null; category: string | null };
  type AttachedVideo = { id: string; video_id: string; display_order: number; video?: DemoVideo };

  const { data: allVideos } = useQuery<DemoVideo[]>({
    queryKey: ["all-demo-videos"],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("demo_videos")
        .select("id, title, thumbnail_url, duration_seconds, category")
        .eq("is_active", true)
        .order("title");
      return (result.data || []) as DemoVideo[];
    },
  });

  const { data: attachedVideos, refetch: refetchAttached } = useQuery<AttachedVideo[]>({
    queryKey: ["opportunity-videos", opportunityId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("sales_opportunity_videos")
        .select("id, video_id, display_order")
        .eq("opportunity_id", opportunityId)
        .order("display_order");
      
      const data = result.data as Array<{ id: string; video_id: string; display_order: number }> | null;
      if (!data || data.length === 0) return [];
      
      const videoIds = data.map(v => v.video_id);
      const videosResult = await (supabase as any)
        .from("demo_videos")
        .select("id, title, thumbnail_url, duration_seconds")
        .in("id", videoIds);
      const videos = videosResult.data as DemoVideo[] | null;
      
      return data.map(item => ({
        ...item,
        video: videos?.find(v => v.id === item.video_id)
      }));
    },
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && attachedVideos) {
      setSelectedVideoIds(attachedVideos.map(v => v.video_id));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (videoIds: string[]) => {
      await (supabase as any).from("sales_opportunity_videos")
        .delete()
        .eq("opportunity_id", opportunityId);
      if (videoIds.length > 0) {
        await (supabase as any).from("sales_opportunity_videos")
          .insert(videoIds.map((videoId, index) => ({ 
            opportunity_id: opportunityId, 
            video_id: videoId, 
            display_order: index 
          })));
      }
    },
    onSuccess: () => {
      toast.success("Videos updated");
      queryClient.invalidateQueries({ queryKey: ["opportunity-videos", opportunityId] });
      setIsOpen(false);
    },
  });

  const removeVideo = async (videoId: string) => {
    await (supabase as any).from("sales_opportunity_videos")
      .delete()
      .eq("opportunity_id", opportunityId)
      .eq("video_id", videoId);
    refetchAttached();
    toast.success("Video removed");
  };

  const toggleVideo = (videoId: string) => {
    setSelectedVideoIds(prev => prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]);
  };

  return (
    <div className="space-y-4">
      {attachedVideos && attachedVideos.length > 0 && (
        <div className="space-y-2">
          {attachedVideos.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <div className="w-16 h-10 rounded bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                <Video className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="flex-1 text-sm font-medium truncate">{item.video?.title}</p>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeVideo(item.video_id)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {attachedVideos?.length ? "Manage Videos" : "Add Videos"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Videos for {opportunityName}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {allVideos?.map((video) => (
                <div
                  key={video.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selectedVideoIds.includes(video.id) ? "bg-primary/10 border-primary/50" : "hover:bg-muted/50"}`}
                  onClick={() => toggleVideo(video.id)}
                >
                  <Checkbox checked={selectedVideoIds.includes(video.id)} />
                  <Video className="w-5 h-5 text-muted-foreground" />
                  <p className="flex-1 font-medium truncate">{video.title}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(selectedVideoIds)} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save ({selectedVideoIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}