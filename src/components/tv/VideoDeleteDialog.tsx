import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface VideoDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    id: string;
    title: string;
  } | null;
  onSuccess: () => void;
}

export function VideoDeleteDialog({ open, onOpenChange, video, onSuccess }: VideoDeleteDialogProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!video) return;
    
    setDeleting(true);
    try {
      const result = await (supabase as any)
        .from('tv_content')
        .delete()
        .eq('id', video.id);

      if (result.error) throw result.error;


      toast({
        title: "Video deleted",
        description: "The video has been removed",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Video</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{video?.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
