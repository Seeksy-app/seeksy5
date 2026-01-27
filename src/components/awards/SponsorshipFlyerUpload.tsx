import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, ExternalLink } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

interface SponsorshipFlyerUploadProps {
  programId: string;
  currentFlyerUrl?: string | null;
}

export function SponsorshipFlyerUpload({ programId, currentFlyerUrl }: SponsorshipFlyerUploadProps) {
  const queryClient = useQueryClient();
  const [flyerUrl, setFlyerUrl] = useState(currentFlyerUrl || "");

  const updateFlyerMutation = useMutation({
    mutationFn: async (url: string) => {
      const result = await (supabase as any)
        .from("awards_programs")
        .update({ sponsorship_flyer_url: url })
        .eq("id", programId);

      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awards-program", programId] });
      toast.success("Sponsorship flyer updated!");
    },
    onError: (error: any) => {
      toast.error("Failed to update flyer: " + error.message);
    },
  });

  const handleFlyerUpload = (url: string) => {
    setFlyerUrl(url);
    updateFlyerMutation.mutate(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Sponsorship Flyer
        </CardTitle>
        <CardDescription>
          Upload a marketing flyer that sponsors can view or share with their team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Upload Flyer (Image or PDF)</Label>
          <ImageUpload
            currentImage={flyerUrl}
            onImageUploaded={handleFlyerUpload}
            bucket="avatars"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Create a flyer in Canva or upload an existing one. Sponsors will be able to view this.
          </p>
        </div>

        {flyerUrl && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => window.open(flyerUrl, "_blank")}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Current Flyer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
