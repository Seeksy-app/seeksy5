import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Youtube, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ImportYouTubeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportYouTubeDialog = ({ open, onOpenChange }: ImportYouTubeDialogProps) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const navigate = useNavigate();

  const handleImport = async () => {
    if (!youtubeUrl.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    setIsImporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const loadingToast = toast.loading("Fetching video and generating blog post...");

      const { data, error } = await supabase.functions.invoke("youtube-transcript-to-blog", {
        body: { youtubeUrl },
      });

      toast.dismiss(loadingToast);

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to fetch video from YouTube");
      }

      // Create draft blog post with generated content
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { error: insertError } = await supabase
        .from("blog_posts")
        .insert([{
          user_id: user.id,
          title: data.title,
          slug,
          content: data.content,
          excerpt: data.excerpt,
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          status: "draft",
          is_ai_generated: true,
        }]);

      if (insertError) throw insertError;

      toast.success("Blog post generated from YouTube video!");
      onOpenChange(false);
      setYoutubeUrl("");
      navigate("/my-blog");
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import from YouTube");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            Import from YouTube
          </DialogTitle>
          <DialogDescription>
            Enter a YouTube video URL to generate a blog post from its content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube Video URL</Label>
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isImporting}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || !youtubeUrl.trim()}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4 mr-2" />
                  Generate Blog Post
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
