import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Music, Sparkles, Play, Download } from "lucide-react";

interface MusicGeneratorManagerProps {
  mediaId: string;
  onMusicGenerated?: (audioUrl: string) => void;
}

export function MusicGeneratorManager({ mediaId, onMusicGenerated }: MusicGeneratorManagerProps) {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("16");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null)[0];

  const musicTemplates = [
    { label: "Upbeat Energy", prompt: "Upbeat, energetic background music with electronic beats" },
    { label: "Corporate Professional", prompt: "Professional corporate background music, positive and motivating" },
    { label: "Chill Lo-Fi", prompt: "Chill lo-fi hip hop beats, relaxed and smooth" },
    { label: "Cinematic Epic", prompt: "Epic cinematic orchestral music, dramatic and powerful" },
    { label: "Acoustic Calm", prompt: "Calm acoustic guitar background music, peaceful and serene" },
    { label: "Tech Future", prompt: "Futuristic electronic tech music with synthesizers" },
  ];

  const generateMusic = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe the music you want");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-generate-music', {
        body: {
          prompt: prompt.trim(),
          durationSeconds: parseInt(duration)
        }
      });

      if (error) throw error;
      
      if (data?.audioUrl) {
        setGeneratedMusicUrl(data.audioUrl);
        toast.success("Music generated successfully!");
        onMusicGenerated?.(data.audioUrl);
      }
    } catch (error) {
      console.error('Error generating music:', error);
      toast.error("Failed to generate music");
    } finally {
      setIsGenerating(false);
    }
  };

  const useTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
  };

  const playMusic = () => {
    if (!generatedMusicUrl) return;
    
    if (isPlaying && audioRef) {
      audioRef.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(generatedMusicUrl);
      audio.play();
      audio.onended = () => setIsPlaying(false);
      setIsPlaying(true);
    }
  };

  const downloadMusic = () => {
    if (!generatedMusicUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedMusicUrl;
    link.download = `background-music-${Date.now()}.mp3`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Music className="h-4 w-4" />
              Music Description
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the background music you want... (e.g., 'Upbeat corporate music with electronic beats')"
              className="min-h-[100px]"
              disabled={isGenerating}
            />
          </div>

          <div>
            <Label className="mb-2 block">Quick Templates</Label>
            <div className="grid grid-cols-2 gap-2">
              {musicTemplates.map((template) => (
                <Button
                  key={template.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => useTemplate(template.prompt)}
                  disabled={isGenerating}
                  className="text-xs"
                >
                  {template.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="duration" className="mb-2 block">
              Duration (seconds)
            </Label>
            <Select value={duration} onValueChange={setDuration} disabled={isGenerating}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 seconds</SelectItem>
                <SelectItem value="16">16 seconds</SelectItem>
                <SelectItem value="22">22 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateMusic}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Music...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Background Music
              </>
            )}
          </Button>

          {generatedMusicUrl && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <Label className="block mb-3">Generated Music</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={playMusic}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isPlaying ? "Playing..." : "Preview"}
                  </Button>
                  <Button
                    onClick={downloadMusic}
                    variant="secondary"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <audio src={generatedMusicUrl} className="hidden" />
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Tips for best results:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Be specific about mood, genre, and instruments</li>
              <li>Mention tempo (fast, slow, upbeat, calm)</li>
              <li>Shorter durations (8-16s) work best for loops</li>
              <li>Use templates as starting points</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
