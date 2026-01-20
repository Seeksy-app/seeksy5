import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Film, Upload, X, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface BRollClip {
  id: string;
  file_url: string;
  file_name: string;
  duration_seconds: number | null;
  created_at: string;
}

export const BRollManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch B-roll clips (media files tagged as b-roll)
  const { data: brollClips = [] } = useQuery({
    queryKey: ["broll-clips"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .eq("file_type", "broll")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as BRollClip[];
    }
  });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Get presigned URL for R2 upload
      const { data: urlData, error: urlError } = await supabase.functions.invoke('r2-presigned-url', {
        body: {
          fileName: `broll-${Date.now()}-${file.name}`,
          fileType: file.type,
          userId: session.user.id,
          fileSize: file.size
        }
      });

      if (urlError || !urlData?.presignedUrl) {
        throw new Error('Failed to get upload URL');
      }

      // Upload to R2
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('PUT', urlData.presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Create database record
      const { error: dbError } = await supabase
        .from('media_files')
        .insert({
          user_id: session.user.id,
          file_name: file.name,
          file_url: urlData.fileUrl,
          file_type: 'broll',
          file_size_bytes: file.size,
          source: 'broll-upload',
        });

      if (dbError) throw dbError;

      toast({
        title: "B-roll uploaded!",
        description: `${file.name} is now available for AI to use`,
      });

      queryClient.invalidateQueries({ queryKey: ["broll-clips"] });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload B-roll",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteBRollMutation = useMutation({
    mutationFn: async (clipId: string) => {
      const { error } = await supabase
        .from("media_files")
        .delete()
        .eq("id", clipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broll-clips"] });
      toast({
        title: "B-roll deleted",
        description: "Clip removed successfully"
      });
    }
  });

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Film className="h-5 w-5" />
          B-Roll Library
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload B-roll clips for AI to use in your videos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div>
          <Input
            id="broll-upload"
            type="file"
            accept="video/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
          <Label htmlFor="broll-upload">
            <Button 
              asChild
              variant="outline" 
              className="w-full cursor-pointer"
              disabled={isUploading}
            >
              <div>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? `Uploading... ${uploadProgress}%` : "Upload B-Roll Clip"}
              </div>
            </Button>
          </Label>
        </div>

        {/* B-roll clips list */}
        {brollClips.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Available B-Roll ({brollClips.length})</p>
            {brollClips.map((clip) => (
              <div
                key={clip.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Film className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{clip.file_name}</p>
                    {clip.duration_seconds && (
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(clip.duration_seconds)}s
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => window.open(clip.file_url, '_blank')}
                    className="h-8 w-8"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteBRollMutation.mutate(clip.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No B-roll clips yet. Upload clips for AI to automatically insert into your videos.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
