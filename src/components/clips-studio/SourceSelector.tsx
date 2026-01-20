import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, FolderOpen, Sparkles, ArrowLeft, Film, 
  Search, CheckCircle2, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SourceMedia } from "@/pages/ClipsStudio";

interface SourceSelectorProps {
  onMediaSelect: (media: SourceMedia) => void;
  onBack: () => void;
}

export function SourceSelector({ onMediaSelect, onBack }: SourceSelectorProps) {
  const [mediaFiles, setMediaFiles] = useState<SourceMedia[]>([]);
  const [selectedFile, setSelectedFile] = useState<SourceMedia | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("media_files")
        .select("id, file_url, file_type, file_name, duration_seconds, created_at, cloudflare_uid, edit_transcript, source")
        .eq("user_id", user.id)
        .ilike("file_type", "video%")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map to SourceMedia type
      const mapped: SourceMedia[] = (data || []).map(item => ({
        id: item.id,
        file_url: item.file_url,
        file_name: item.file_name,
        file_type: item.file_type,
        duration_seconds: item.duration_seconds,
        cloudflare_uid: item.cloudflare_uid || undefined,
        created_at: item.created_at,
        source: item.source || undefined,
        edit_transcript: item.edit_transcript,
      }));
      
      setMediaFiles(mapped);
    } catch (error) {
      console.error("Error fetching media:", error);
      toast({
        title: "Error",
        description: "Failed to load media files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload to Cloudflare Stream via edge function
      const formData = new FormData();
      formData.append("file", file);

      const { data, error } = await supabase.functions.invoke("upload-media", {
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      toast({
        title: "Upload complete!",
        description: "Your video is ready for AI clip generation",
      });

      // Refresh media list and select the new file
      await fetchMediaFiles();
      
      if (data?.mediaFile) {
        const mapped: SourceMedia = {
          id: data.mediaFile.id,
          file_url: data.mediaFile.file_url,
          file_name: data.mediaFile.file_name,
          file_type: data.mediaFile.file_type,
          duration_seconds: data.mediaFile.duration_seconds,
          cloudflare_uid: data.mediaFile.cloudflare_uid,
          created_at: data.mediaFile.created_at,
          source: data.mediaFile.source,
          edit_transcript: data.mediaFile.edit_transcript,
        };
        setSelectedFile(mapped);
        onMediaSelect(mapped);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredMedia = mediaFiles.filter(media =>
    media.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'studio':
        return <Badge variant="secondary" className="bg-violet-500/20 text-violet-400 border-0">Studio</Badge>;
      case 'youtube':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-0">YouTube</Badge>;
      case 'zoom':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-0">Zoom</Badge>;
      case 'ai_enhanced':
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-0">AI Enhanced</Badge>;
      default:
        return <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">Upload</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Clips Studio
            </h1>
            <p className="text-muted-foreground mt-1">
              Create viral-worthy clips with AI-powered detection and editing
            </p>
          </div>
        </div>

        {/* Source Selection */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Select Video Source</CardTitle>
            <CardDescription>
              Upload a new video or select from your library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload New
                </TabsTrigger>
                <TabsTrigger value="library" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Media Library
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                    isUploading 
                      ? "border-primary bg-primary/5" 
                      : "border-muted-foreground/20 hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {isUploading ? (
                    <div className="space-y-4">
                      <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                      <div className="space-y-2">
                        <p className="font-medium">Uploading video...</p>
                        <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium mb-1">Click to upload or drag & drop</p>
                      <p className="text-sm text-muted-foreground">
                        MP4, MOV, WebM up to 2GB
                      </p>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="library" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search videos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="text-center py-12">
                    <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium mb-1">No videos found</p>
                    <p className="text-sm text-muted-foreground">
                      Upload a video to get started
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="grid gap-3">
                      {filteredMedia.map((media) => (
                        <div
                          key={media.id}
                          onClick={() => setSelectedFile(media)}
                          className={cn(
                            "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all",
                            selectedFile?.id === media.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-24 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0">
                            <video
                              src={media.file_url}
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                              {formatDuration(media.duration_seconds)}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {media.file_name.replace(/\.[^/.]+$/, "")}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {getSourceBadge(media.source)}
                              {media.created_at && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(media.created_at), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selected indicator */}
                          {selectedFile?.id === media.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {selectedFile && (
                  <Button 
                    onClick={() => onMediaSelect(selectedFile)}
                    className="w-full"
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze with AI
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
