import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FolderOpen, ArrowLeft } from "lucide-react";
import { PersonaDialog } from "@/components/ai/PersonaDialog";
import { AskAIButton } from "@/components/ai/AskAIButton";

const NewEpisode = () => {
  const navigate = useNavigate();
  const { podcastId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  const mode = location.state?.mode || 'upload';

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [episodeType, setEpisodeType] = useState("full");
  const [isExplicit, setIsExplicit] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [castorDialogOpen, setCastorDialogOpen] = useState(false);
  const [castorPrompt, setCastorPrompt] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcast } = useQuery({
    queryKey: ["podcast", podcastId],
    queryFn: async () => {
      if (!podcastId) return null;
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", podcastId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!podcastId,
  });

  const { data: mediaFiles } = useQuery({
    queryKey: ["media-files", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && mode === 'library',
  });

  const createEpisode = useMutation({
    mutationFn: async () => {
      if (!user || !podcastId) throw new Error("Missing required data");

      let audioUrl = "";
      let duration = 0;

      // Handle upload mode
      if (mode === 'upload' && audioFile) {
        setIsUploading(true);
        const fileName = `${Date.now()}-${audioFile.name}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('episode-audio')
          .upload(filePath, audioFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('episode-audio')
          .getPublicUrl(filePath);

        audioUrl = publicUrl;
        
        // Get duration from audio file
        const audio = new Audio();
        audio.src = URL.createObjectURL(audioFile);
        await new Promise((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            duration = Math.floor(audio.duration);
            resolve(true);
          });
        });
      }
      // Handle library mode
      else if (mode === 'library' && selectedMediaId) {
        const selectedMedia = mediaFiles?.find(f => f.id === selectedMediaId);
        if (!selectedMedia) throw new Error("Selected media not found");
        audioUrl = selectedMedia.file_url;
        duration = selectedMedia.duration_seconds || 0;
      }

      if (!audioUrl) throw new Error("No audio URL available");

      const episodeData = {
        podcast_id: podcastId,
        title,
        description,
        audio_url: audioUrl,
        episode_number: episodeNumber ? parseInt(episodeNumber) : null,
        season_number: seasonNumber ? parseInt(seasonNumber) : null,
        episode_type: episodeType,
        is_explicit: isExplicit,
        duration_seconds: duration,
        is_published: false,
        publish_date: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("episodes")
        .insert(episodeData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Episode created successfully!",
        description: "Your episode draft has been saved",
      });
      navigate(`/podcasts/${podcastId}/episodes/${data.id}`);
    },
    onError: (error) => {
      console.error("Episode creation error:", error);
      toast({
        title: "Failed to create episode",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter an episode title",
        variant: "destructive",
      });
      return;
    }
    if (mode === 'upload' && !audioFile) {
      toast({
        title: "Audio file required",
        description: "Please select an audio file to upload",
        variant: "destructive",
      });
      return;
    }
    if (mode === 'library' && !selectedMediaId) {
      toast({
        title: "Media file required",
        description: "Please select a file from your library",
        variant: "destructive",
      });
      return;
    }
    createEpisode.mutate();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(`/podcasts/${podcastId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Episode</h1>
            <p className="text-muted-foreground">
              for {podcast?.title}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Episode Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === 'upload' && (
                <div className="space-y-2">
                  <Label htmlFor="audio-file">Audio File *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="audio-file"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      disabled={isUploading}
                    />
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {audioFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {audioFile.name}
                    </p>
                  )}
                </div>
              )}

              {mode === 'library' && (
                <div className="space-y-2">
                  <Label htmlFor="media-select">Select from Library *</Label>
                  <Select value={selectedMediaId} onValueChange={setSelectedMediaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a recording" />
                    </SelectTrigger>
                    <SelectContent>
                      {mediaFiles?.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" />
                            {file.file_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Episode Title *</Label>
                  <AskAIButton
                    persona="Castor"
                    onClick={() => {
                      setCastorPrompt(`Generate a compelling podcast episode title for: ${podcast?.title || "my podcast"}`);
                      setCastorDialogOpen(true);
                    }}
                  />
                </div>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter episode title"
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <AskAIButton
                    persona="Castor"
                    onClick={() => {
                      setCastorPrompt(`Write show notes and episode description for: ${title || "a podcast episode"}`);
                      setCastorDialogOpen(true);
                    }}
                  />
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter episode description"
                  rows={4}
                  disabled={isUploading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="season">Season Number</Label>
                  <Input
                    id="season"
                    type="number"
                    value={seasonNumber}
                    onChange={(e) => setSeasonNumber(e.target.value)}
                    placeholder="1"
                    disabled={isUploading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="episode">Episode Number</Label>
                  <Input
                    id="episode"
                    type="number"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value)}
                    placeholder="1"
                    disabled={isUploading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Episode Type</Label>
                <Select value={episodeType} onValueChange={setEpisodeType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="trailer">Trailer</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="explicit"
                  checked={isExplicit}
                  onChange={(e) => setIsExplicit(e.target.checked)}
                  className="rounded"
                  disabled={isUploading}
                />
                <Label htmlFor="explicit" className="cursor-pointer">
                  Explicit content
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/podcasts/${podcastId}`)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isUploading || createEpisode.isPending}
            >
              {isUploading || createEpisode.isPending ? "Creating..." : "Create Episode"}
            </Button>
          </div>
        </form>

        <PersonaDialog
          open={castorDialogOpen}
          onOpenChange={setCastorDialogOpen}
          persona="Castor"
          prompt={castorPrompt}
          context={{ podcastTitle: podcast?.title, episodeTitle: title }}
          onApply={(result) => {
            if (castorPrompt.includes("title")) {
              setTitle(result);
            } else {
              setDescription(result);
            }
          }}
          placeholder="Describe the episode topic and Castor will help you create it"
        />
      </div>
    </div>
  );
};

export default NewEpisode;
