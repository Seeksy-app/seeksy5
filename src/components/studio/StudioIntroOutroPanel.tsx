import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, Sparkles } from "lucide-react";

interface MusicTrack {
  music_asset_id: string;
  name: string;
  duration_seconds: number;
  genres: string[];
}

interface Voice {
  voice_id: string;
  name: string;
}

interface StudioIntroOutroPanelProps {
  type: 'intro' | 'outro';
  sessionId: string;
  onSuccess?: () => void;
}

export function StudioIntroOutroPanel({ type, sessionId, onSuccess }: StudioIntroOutroPanelProps) {
  const { toast } = useToast();
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

  useEffect(() => {
    // Fetch data once on mount
    fetchVoices();
    fetchMusicTracks();
  }, []); // Empty dependency array - only run once on mount

  const fetchVoices = async () => {
    try {
      setIsLoadingVoices(true);
      const { data, error } = await supabase.functions.invoke('elevenlabs-get-voices');

      if (error) {
        console.error('Voices fetch error:', error);
        toast({
          title: "Warning",
          description: "Could not load voices. You can still enter a script.",
          variant: "default",
        });
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
        ? "Write a professional, engaging 15-second intro script for a live stream or podcast. Make it welcoming and energetic."
        : "Write a professional, warm 15-second outro script for a live stream or podcast. Thank viewers and encourage engagement.";

      const { data, error } = await supabase.functions.invoke('seeksy-assistant', {
        body: { 
          message: prompt,
          conversationId: null
        }
      });

      if (error) throw error;
      if (data?.response) {
        setScript(data.response);
      }
    } catch (error) {
      console.error('Error generating script:', error);
      toast({
        title: "Error",
        description: "Failed to generate script",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateIntroOutro = async () => {
    if (!script || !selectedVoice) {
      toast({
        title: "Missing Information",
        description: "Please provide a script and select a voice",
        variant: "destructive",
      });
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
          sessionId
        }
      });

      if (error) throw error;
      
      if (data?.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
        
        // Save to library
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const voiceName = voices.find(v => v.voice_id === selectedVoice)?.name || 'Unknown';
          
          await (supabase as any).from('studio_intro_outro_library').insert({
            user_id: user.id,
            session_id: sessionId,
            type,
            title: `${type === 'intro' ? 'Intro' : 'Outro'} - ${new Date().toLocaleDateString()}`,
            script,
            audio_url: data.audioUrl,
            voice_id: selectedVoice,
            voice_name: voiceName,
            music_asset_id: selectedMusic || null,
            is_ai_generated: true
          });
        }
        
        toast({
          title: "Success",
          description: `${type === 'intro' ? 'Intro' : 'Outro'} generated and saved to library!`,
        });

        // Call success callback to close dialog and refresh list
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error generating:', error);
      toast({
        title: "Error",
        description: `Failed to generate ${type}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1 capitalize">{type} Generator</h3>
        <p className="text-xs text-muted-foreground">
          Create an AI-powered {type} with voice and music
        </p>
      </div>

      <div className="space-y-4">
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
            placeholder={`Enter your ${type} script...`}
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
                  Music library browsing unavailable. {type === 'intro' ? 'Intro' : 'Outro'} will be generated without background music.
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
              <Label className="text-sm font-medium mb-2 block">Generated {type === 'intro' ? 'Intro' : 'Outro'}</Label>
              <audio controls className="w-full" src={generatedAudioUrl}>
                Your browser does not support the audio element.
              </audio>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
