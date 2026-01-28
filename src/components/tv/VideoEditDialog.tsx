import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface VideoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
  } | null;
  onSuccess: () => void;
}

export function VideoEditDialog({ open, onOpenChange, video, onSuccess }: VideoEditDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(video?.title || "");
  const [description, setDescription] = useState(video?.description || "");
  const [category, setCategory] = useState(video?.category || "");

  // Reset form when video changes
  useState(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
      setCategory(video.category || "");
    }
  });

  const handleSave = async () => {
    if (!video) return;
    
    setSaving(true);
    try {
      const result = await (supabase as any)
        .from('tv_content')
        .update({
          title,
          description,
          category,
        })
        .eq('id', video.id);

      if (result.error) throw result.error;

      toast({
        title: "Video updated",
        description: "Changes saved successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating video:", error);
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
          <DialogDescription>
            Update video details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Video description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Podcasts, Interviews, Events"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
