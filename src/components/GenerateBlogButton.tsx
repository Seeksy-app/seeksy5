import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface GenerateBlogButtonProps {
  episodeId: string;
  episodeTitle: string;
  hasTranscript: boolean;
}

export const GenerateBlogButton = ({ episodeId, episodeTitle, hasTranscript }: GenerateBlogButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!hasTranscript) {
      toast.error("This episode needs a transcript to generate a blog post");
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      toast.info("Generating blog post with AI... This may take a minute.");

      const { data, error } = await supabase.functions.invoke("generate-blog-from-podcast", {
        body: { episodeId, userId: user.id },
      });

      if (error) throw error;

      toast.success("Blog post generated successfully!");
      navigate("/my-blog");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate blog post");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating || !hasTranscript}
      variant="outline"
      className="gap-2"
    >
      <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-pulse" : ""}`} />
      {isGenerating ? "Generating..." : "Generate Blog Post"}
    </Button>
  );
};
