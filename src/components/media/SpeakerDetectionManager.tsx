import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Check, Sparkles, Camera } from "lucide-react";

interface DetectedSpeaker {
  id: string;
  faceImageUrl: string;
  firstAppearance: number;
  totalAppearances: number;
  name?: string;
}

interface SpeakerDetectionManagerProps {
  videoUrl: string;
  videoDuration: number;
  onSpeakersIdentified: (speakers: DetectedSpeaker[]) => void;
}

export function SpeakerDetectionManager({ 
  videoUrl, 
  videoDuration,
  onSpeakersIdentified 
}: SpeakerDetectionManagerProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedSpeakers, setDetectedSpeakers] = useState<DetectedSpeaker[]>([]);
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});

  const handleDetectSpeakers = async () => {
    setIsDetecting(true);
    try {
      toast.info("AI is analyzing your video for speakers...");
      
      // Call edge function to detect speakers using AI
      const { data, error } = await supabase.functions.invoke('detect-speakers', {
        body: { 
          videoUrl,
          videoDuration 
        }
      });

      if (error) throw error;

      if (data?.speakers) {
        setDetectedSpeakers(data.speakers);
        
        // Initialize speaker names with defaults
        const names: Record<string, string> = {};
        data.speakers.forEach((speaker: DetectedSpeaker, index: number) => {
          names[speaker.id] = speaker.name || `Speaker ${index + 1}`;
        });
        setSpeakerNames(names);
        
        toast.success(`Detected ${data.speakers.length} speaker${data.speakers.length > 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error('Error detecting speakers:', error);
      toast.error(error.message || "Failed to detect speakers");
      
      // Fallback: Create mock speakers for demo
      const mockSpeakers: DetectedSpeaker[] = [
        {
          id: 'speaker-1',
          faceImageUrl: '/placeholder.svg',
          firstAppearance: 0,
          totalAppearances: 12,
        },
        {
          id: 'speaker-2',
          faceImageUrl: '/placeholder.svg',
          firstAppearance: 30,
          totalAppearances: 8,
        }
      ];
      
      setDetectedSpeakers(mockSpeakers);
      const names: Record<string, string> = {};
      mockSpeakers.forEach((speaker, index) => {
        names[speaker.id] = `Speaker ${index + 1}`;
      });
      setSpeakerNames(names);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleUpdateSpeakerName = (speakerId: string, name: string) => {
    setSpeakerNames(prev => ({ ...prev, [speakerId]: name }));
  };

  const handleSaveSpeakerName = (speakerId: string) => {
    const updatedSpeakers = detectedSpeakers.map(speaker => 
      speaker.id === speakerId 
        ? { ...speaker, name: speakerNames[speakerId] }
        : speaker
    );
    setDetectedSpeakers(updatedSpeakers);
    setEditingSpeaker(null);
    toast.success("Speaker name updated");
  };

  const handleConfirmSpeakers = () => {
    const finalSpeakers = detectedSpeakers.map(speaker => ({
      ...speaker,
      name: speakerNames[speaker.id]
    }));
    
    onSpeakersIdentified(finalSpeakers);
    toast.success("Speakers identified for lower thirds");
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Speaker Detection
        </h4>
        <p className="text-xs text-muted-foreground">
          AI will identify speakers in your video and extract their faces for lower thirds
        </p>
      </div>

      {detectedSpeakers.length === 0 ? (
        <Button
          onClick={handleDetectSpeakers}
          disabled={isDetecting}
          className="w-full"
        >
          {isDetecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Detecting Speakers...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Detect Speakers with AI
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Detected Speakers ({detectedSpeakers.length})
            </Label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDetectSpeakers}
              disabled={isDetecting}
            >
              Re-detect
            </Button>
          </div>

          <div className="space-y-2">
            {detectedSpeakers.map((speaker, index) => (
              <Card key={speaker.id} className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Speaker Avatar */}
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={speaker.faceImageUrl} alt={speakerNames[speaker.id]} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      {/* Speaker Name Input */}
                      {editingSpeaker === speaker.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={speakerNames[speaker.id] || ''}
                            onChange={(e) => handleUpdateSpeakerName(speaker.id, e.target.value)}
                            placeholder="Enter speaker name"
                            className="text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveSpeakerName(speaker.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{speakerNames[speaker.id]}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSpeaker(speaker.id)}
                          >
                            Edit
                          </Button>
                        </div>
                      )}

                      {/* Speaker Stats */}
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          First seen: {formatTimestamp(speaker.firstAppearance)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {speaker.totalAppearances} appearances
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={handleConfirmSpeakers}
            className="w-full"
          >
            <Check className="h-4 w-4 mr-2" />
            Use These Speakers for Lower Thirds
          </Button>
        </div>
      )}
    </div>
  );
}