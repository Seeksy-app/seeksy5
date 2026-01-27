import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, DollarSign, Search, Check } from "lucide-react";

interface CreatorVoiceSelectorProps {
  onSelectVoice: (voiceId: string, voiceName: string, profileId: string, price: number) => void;
  selectedVoiceId?: string;
}

export function CreatorVoiceSelector({ onSelectVoice, selectedVoiceId }: CreatorVoiceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const { data: creatorVoices, isLoading } = useQuery({
    queryKey: ['creatorVoices'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('creator_voice_profiles')
        .select('*')
        .eq('is_available_for_ads', true)
        .eq('is_verified', true)
        .order('voice_name');
      
      if (error) throw error;
      return data as any[];
    },
  });

  const filteredVoices = creatorVoices?.filter(voice =>
    voice.voice_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const playVoiceSample = (audioUrl: string, voiceId: string) => {
    if (audioElement) {
      audioElement.pause();
    }

    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      setAudioElement(null);
    } else {
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => {
        setPlayingVoice(null);
        setAudioElement(null);
      };
      setAudioElement(audio);
      setPlayingVoice(voiceId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Creator Voice</CardTitle>
        <CardDescription>
          Choose a verified creator voice for your ad campaign
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creator voices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading creator voices...
          </div>
        ) : filteredVoices && filteredVoices.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredVoices.map((voice) => (
              <Card
                key={voice.id}
                className={`cursor-pointer transition-all ${
                  selectedVoiceId === voice.elevenlabs_voice_id
                    ? 'ring-2 ring-primary'
                    : 'hover:bg-accent'
                }`}
                onClick={() =>
                  onSelectVoice(
                    voice.elevenlabs_voice_id!,
                    voice.voice_name,
                    voice.id,
                    voice.price_per_ad || 0
                  )
                }
              >
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{voice.voice_name}</h4>
                        {voice.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {voice.price_per_ad && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          ${voice.price_per_ad.toFixed(2)} per ad
                        </div>
                      )}
                    </div>

                    {voice.sample_audio_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoiceSample(voice.sample_audio_url!, voice.id);
                        }}
                      >
                        {playingVoice === voice.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {voice.usage_terms && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {voice.usage_terms}
                    </p>
                  )}

                  {selectedVoiceId === voice.elevenlabs_voice_id && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Check className="h-4 w-4" />
                      Selected
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No creator voices available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
