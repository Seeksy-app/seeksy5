import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Film, Sparkles, Play } from "lucide-react";

interface IntroOutroManagerProps {
  mediaId: string;
  type: 'intro' | 'outro';
}

interface Voice {
  voice_id: string;
  name: string;
}

interface MusicTrack {
  music_asset_id: string;
  name: string;
  duration_seconds: number;
  genres: string[];
}

export function IntroOutroManager({ mediaId, type }: IntroOutroManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  
  // AI Generation state
  const [script, setScript] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [selectedMusic, setSelectedMusic] = useState<string>("");
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  
  // Use ref to track if data has been fetched to prevent repeated calls
  const hasFetchedData = useRef(false);

  // Fetch voices and music only once when component mounts
  useEffect(() => {
    if (!hasFetchedData.current) {
      hasFetchedData.current = true;
      fetchVoices();
      fetchMusicTracks();
    }
  }, []);

  const fetchVoices = async () => {
    try {
      setIsLoadingVoices(true);
      const { data, error } = await supabase.functions.invoke('elevenlabs-get-voices');

      if (error) {
        console.error('Voices fetch error:', error);
        setVoices([]);
        return;
      }
      
      if (data?.voices && Array.isArray(data.voices)) {
        setVoices(data.voices);
      } else {
        setVoices([]);
      }
    } catch (error: any) {
      console.error('Error fetching voices:', error);
      setVoices([]);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const fetchMusicTracks = async () => {
    try {
      setIsLoadingMusic(true);
      const { data, error } = await supabase.functions.invoke('elevenlabs-get-music', {
        body: { page_size: 30 }
      });

      if (error) {
        console.error('Music fetch error:', error);
        setMusicTracks([]);
        return;
      }
      
      if (data?.music && Array.isArray(data.music)) {
        setMusicTracks(data.music);
      } else {
        setMusicTracks([]);
      }
    } catch (error: any) {
      console.error('Error fetching music:', error);
      setMusicTracks([]);
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const generateAIScript = async () => {
    setIsGeneratingScript(true);
    try {
      const prompt = type === 'intro' 
        ? "Write a professional, engaging 15-second intro script for a video or podcast. Make it welcoming and energetic."
        : "Write a professional, warm 15-second outro script for a video or podcast. Thank viewers and encourage engagement.";

      const { data, error } = await supabase.functions.invoke('seeksy-assistant', {
        body: { 
          message: prompt,
          conversationId: null
        }
      });

      if (error) throw error;
      if (data?.response) {
        setScript(data.response);
        toast.success("Script generated successfully!");
      }
    } catch (error) {
      console.error('Error generating script:', error);
      toast.error("Failed to generate script");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateIntroOutro = async () => {
    if (!script || !selectedVoice) {
      toast.error("Please provide a script and select a voice");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-generate-intro-outro', {
        body: {
          script,
          voiceId: selectedVoice,
          musicAssetId: selectedMusic || null,
          type,
          sessionId: mediaId
        }
      });

      if (error) throw error;
      
      if (data?.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
        toast.success(`${type === 'intro' ? 'Intro' : 'Outro'} generated successfully!`);
      }
    } catch (error) {
      console.error('Error generating:', error);
      toast.error(`Failed to generate ${type}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a video file");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${mediaId}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('studio-recordings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('studio-recordings')
        .getPublicUrl(filePath);

      setUploadedVideo(urlData.publicUrl);
      
      // Note: intro/outro URLs stored via metadata for now
      // In future, add intro_url and outro_url columns to media_files table
      
      toast.success(`${type === 'intro' ? 'Intro' : 'Outro'} uploaded successfully`);
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1 capitalize">{type} Video</h3>
        <p className="text-xs text-muted-foreground">
          Add a custom {type} to your video
        </p>
      </div>

      <Tabs defaultValue="ai-generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai-generate" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Generate
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-generate" className="space-y-4 mt-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Script</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={generateAIScript}
                disabled={isGeneratingScript}
                className="h-7 text-xs"
              >
                {isGeneratingScript ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                AI Generate
              </Button>
            </div>
            <Textarea
              placeholder={`Enter your ${type} script or use AI to generate one...`}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="min-h-[100px] text-sm"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Voice</Label>
            {isLoadingVoices ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : voices.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                No voices available. Please try again later.
              </div>
            ) : (
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="text-sm bg-background">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {voices.map((voice) => (
                    <SelectItem key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Background Music (Optional)</Label>
            {isLoadingMusic ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <Select value={selectedMusic} onValueChange={setSelectedMusic}>
                  <SelectTrigger className="text-sm bg-background">
                    <SelectValue placeholder="No background music" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="">No Music</SelectItem>
                    {musicTracks.length > 0 && musicTracks.map((track) => (
                      <SelectItem key={track.music_asset_id} value={track.music_asset_id}>
                        {track.name} ({Math.floor(track.duration_seconds)}s)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {musicTracks.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Music library unavailable. {type === 'intro' ? 'Intro' : 'Outro'} will be generated without background music.
                  </p>
                )}
              </div>
            )}
          </div>

          <Button 
            onClick={generateIntroOutro} 
            disabled={isGenerating || !script || !selectedVoice}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate {type === 'intro' ? 'Intro' : 'Outro'}
              </>
            )}
          </Button>

          {generatedAudioUrl && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <Label className="text-sm font-medium mb-2 block">
                  Generated {type === 'intro' ? 'Intro' : 'Outro'}
                </Label>
                <audio controls className="w-full" src={generatedAudioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Upload Video</Label>
            <Input
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              MP4, MOV, or WebM format, max 50MB
            </p>
          </div>

          {isUploading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {uploadedVideo && !isUploading && (
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <Label className="text-sm font-medium mb-2 block">
                  Uploaded {type === 'intro' ? 'Intro' : 'Outro'}
                </Label>
                <video 
                  src={uploadedVideo} 
                  controls
                  className="w-full h-auto rounded-md"
                >
                  Your browser does not support the video element.
                </video>
              </CardContent>
            </Card>
          )}

          {!uploadedVideo && !isUploading && (
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Film className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No {type} uploaded yet
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
