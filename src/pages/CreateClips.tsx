import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Film, Download, Loader2, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface MediaFile {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  duration_seconds: number | null;
  created_at: string;
}

interface ClipSuggestion {
  start_time: number;
  end_time: number;
  title: string;
  description: string;
  virality_score: number;
  hook: string;
}

export default function CreateClips() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [clips, setClips] = useState<ClipSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("media_files")
        .select("id, file_url, file_type, file_name, duration_seconds, created_at, edit_transcript")
        .eq("user_id", user.id)
        .ilike("file_type", "video%")
        .in("source", ["upload", "studio"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMediaFiles(data || []);
    } catch (error) {
      console.error("Error fetching media:", error);
      toast({
        title: "Error",
        description: "Failed to load media files",
        variant: "destructive",
      });
    }
  };

  const analyzeForClips = async (media: any) => {
    setSelectedMedia(media);
    setIsAnalyzing(true);
    setClips([]);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-clips", {
        body: {
          mediaId: media.id,
          fileUrl: media.file_url,
          duration: media.duration_seconds,
          transcript: media.edit_transcript?.transcript || null,
        },
      });

      if (error) throw error;

      setClips(data.clips || []);
      toast({
        title: "Analysis complete!",
        description: `Found ${data.clips?.length || 0} viral-worthy moments`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze video for clips",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateTranscript = async (media: MediaFile) => {
    try {
      toast({
        title: "Generating transcript...",
        description: "This may take a moment",
      });

      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: {
          asset_id: media.id,
          audio_url: media.file_url,
          language: "en",
          source_type: "clip",
        },
      });

      if (error) {
        console.error("Transcription error details:", error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Transcript generated!",
        description: "Analyzing for clips now...",
      });
      
      // Refresh media files to get updated transcript
      await fetchMediaFiles();
      
      // Auto-trigger clip analysis if we have the transcript
      if (data?.transcript?.raw_text) {
        analyzeForClips({...media, edit_transcript: { transcript: data.transcript.raw_text }});
      }
    } catch (error) {
      console.error("Transcription error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Transcription failed",
        description: errorMsg.includes("ElevenLabs") 
          ? "ElevenLabs API error. Please check your API key or try again."
          : errorMsg,
        variant: "destructive",
        duration: 6000,
      });
    }
  };

  const generateClip = async (clip: ClipSuggestion, index: number) => {
    setIsGenerating(index);
    
    try {
      // Get transcript if available
      const transcriptText = selectedMedia && (selectedMedia as any).edit_transcript?.transcript;

      const { data, error } = await supabase.functions.invoke("generate-clip", {
        body: {
          mediaId: selectedMedia?.id,
          fileUrl: selectedMedia?.file_url,
          startTime: clip.start_time,
          endTime: clip.end_time,
          title: clip.title,
          hook: clip.hook,
          caption: clip.description,
          transcript: transcriptText || null,
        },
      });

      if (error) throw error;

      toast({
        title: "Processing started!",
        description: `Generating vertical and thumbnail clips. This may take 30-60 seconds.`,
        duration: 5000,
      });
      
      // Poll for completion (check every 3 seconds)
      const clipId = data.clipId;
      let attempts = 0;
      const maxAttempts = 30; // 90 seconds max wait
      
      const checkStatus = setInterval(async () => {
        attempts++;
        const { data: clipStatus } = await supabase
          .from('clips')
          .select('status, vertical_url, thumbnail_url, error_message')
          .eq('id', clipId)
          .single();
        
        if (clipStatus?.status === 'ready') {
          clearInterval(checkStatus);
          toast({
            title: "Clips ready!",
            description: `Generated vertical and thumbnail formats. View in Media Library.`,
          });
          setIsGenerating(null);
        } else if (clipStatus?.status === 'failed' || attempts >= maxAttempts) {
          clearInterval(checkStatus);
          toast({
            title: "Generation failed",
            description: clipStatus?.error_message || "Processing timed out",
            variant: "destructive",
          });
          setIsGenerating(null);
        }
      }, 3000);

    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: "Could not generate clip",
        variant: "destructive",
      });
      setIsGenerating(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Viral Clips</h1>
        <p className="text-muted-foreground">
          AI finds the best moments and formats them for TikTok & Instagram
        </p>
      </div>

      {!selectedMedia ? (
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Select a video to analyze</h2>
          {mediaFiles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Film className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload a video to get started
                </p>
                <Button onClick={() => navigate("/media-library")}>
                  Go to Media Library
                </Button>
              </CardContent>
            </Card>
          ) : (
            mediaFiles.map((media) => (
              <Card key={media.id} className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-shrink-0 w-32 h-20 bg-black rounded overflow-hidden">
                      <video
                        src={media.file_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl font-semibold mb-1.5 truncate">
                        {media.file_name.replace(/\.[^/.]+$/, "")}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(media.created_at), "MMM dd, yyyy")}
                        {media.duration_seconds && (
                          <span className="ml-2">
                            • {formatTime(media.duration_seconds)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => analyzeForClips(media)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Find Clips
                      </Button>
                      {!(media as any).edit_transcript && (
                        <Button onClick={() => generateTranscript(media)} variant="outline" size="sm">
                          Generate Transcript
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedMedia.file_name.replace(/\.[^/.]+$/, "")}</CardTitle>
                  <CardDescription>
                    {isAnalyzing ? "Analyzing video..." : `${clips.length} clips found`}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedMedia(null)}>
                  Choose Different Video
                </Button>
              </div>
            </CardHeader>
          </Card>

          {isAnalyzing ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI is analyzing your video</h3>
                <p className="text-muted-foreground">
                  Finding the most viral-worthy moments...
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {clips.map((clip, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{clip.title}</CardTitle>
                          <Badge variant="secondary" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {clip.virality_score}% viral
                          </Badge>
                        </div>
                        <CardDescription className="mb-3">
                          {formatTime(clip.start_time)} - {formatTime(clip.end_time)} ({Math.round(clip.end_time - clip.start_time)}s)
                        </CardDescription>
                        <p className="text-sm text-muted-foreground mb-2">
                          {clip.description}
                        </p>
                        <div className="text-sm">
                          <span className="font-medium text-primary">Hook: </span>
                          <span className="italic">"{clip.hook}"</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => generateClip(clip, index)}
                        disabled={isGenerating === index}
                      >
                        {isGenerating === index ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Clip
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
