import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, Video, Square, Pause, Play, Sparkles,
  Scissors, DollarSign, MessageSquare, FileText
} from "lucide-react";
import { RecordingWaveform } from "@/components/studio/audio/RecordingWaveform";

type RecordingState = "idle" | "recording" | "paused";

export default function StudioRecording() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [clipMarkers, setClipMarkers] = useState<Array<{timestamp: number; description?: string}>>([]);
  const [adMarkers, setAdMarkers] = useState<Array<{timestamp: number; slot_type: string}>>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (recordingState === "recording" && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else if (recordingState !== "recording" && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate a unique room name
      const roomName = `recording-${Date.now()}`;

      const { data, error } = await supabase
        .from("studio_sessions")
        .insert({
          user_id: user.id,
          room_name: roomName,
          daily_room_url: "", // Will be populated if using Daily.co integration
          session_type: "recording",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setRecordingState("recording");
      toast({ title: "Recording started" });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error("No session");

      const { error } = await supabase
        .from("studio_sessions")
        .update({
          duration_seconds: duration,
          recording_status: "completed",
        })
        .eq("id", sessionId);

      if (error) throw error;
      return sessionId;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["studio-recent-recordings"] });
      toast({ title: "Recording saved successfully" });
      navigate(`/studio/post-session/${id}`);
    },
  });

  const handleStartRecording = () => {
    createSessionMutation.mutate();
  };

  const handlePause = () => {
    setRecordingState("paused");
    toast({ title: "Recording paused" });
  };

  const handleResume = () => {
    setRecordingState("recording");
    toast({ title: "Recording resumed" });
  };

  const handleStop = () => {
    endSessionMutation.mutate();
  };

  const handleMarkClip = () => {
    setClipMarkers(prev => [...prev, { timestamp: duration }]);
    toast({ title: "Clip marker added", description: `At ${formatTime(duration)}` });
  };

  const handleMarkAd = (slotType: string) => {
    setAdMarkers(prev => [...prev, { timestamp: duration, slot_type: slotType }]);
    toast({ title: `${slotType.toUpperCase()}-roll ad marker added` });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Recording Session</h1>
                <p className="text-sm text-muted-foreground">Professional audio & video capture</p>
              </div>
            </div>
            {recordingState !== "idle" && (
              <div className="flex items-center gap-4">
                <Badge variant="destructive" className="gap-2 px-4 py-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {recordingState === "recording" ? "RECORDING" : "PAUSED"}
                </Badge>
                <div className="text-3xl font-mono font-bold">{formatTime(duration)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Recording Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Video/Audio Preview */}
          <Card className="aspect-video bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-pink-500/5" />
            <div className="relative text-center space-y-4">
              {recordingState === "idle" ? (
                <>
                  <Video className="w-20 h-20 text-muted-foreground/50 mx-auto" />
                  <div>
                    <p className="text-xl font-medium text-muted-foreground">Ready to Record</p>
                    <p className="text-sm text-muted-foreground/70">Click Start Recording to begin</p>
                  </div>
                </>
              ) : (
                <div className="w-full px-8">
                  <RecordingWaveform isRecording={recordingState === "recording"} />
                </div>
              )}
            </div>
          </Card>

          {/* Recording Controls */}
          <Card className="p-6">
            <div className="flex items-center justify-center gap-4">
              {recordingState === "idle" ? (
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 h-16 px-8"
                  onClick={handleStartRecording}
                  disabled={createSessionMutation.isPending}
                >
                  <Mic className="w-6 h-6" />
                  Start Recording
                </Button>
              ) : (
                <>
                  {recordingState === "recording" ? (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handlePause}
                      className="gap-2 h-12"
                    >
                      <Pause className="w-5 h-5" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="gap-2 bg-green-600 hover:bg-green-700 h-12"
                      onClick={handleResume}
                    >
                      <Play className="w-5 h-5" />
                      Resume
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={handleStop}
                    className="gap-2 h-12"
                    disabled={endSessionMutation.isPending}
                  >
                    <Square className="w-5 h-5" />
                    Stop & Save
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Marker Controls */}
          {recordingState !== "idle" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-16 gap-2 hover:border-purple-500 hover:bg-purple-500/10"
                onClick={handleMarkClip}
              >
                <Scissors className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Mark Clip</div>
                  <div className="text-xs text-muted-foreground">{clipMarkers.length} added</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16 gap-2 hover:border-green-500 hover:bg-green-500/10"
                onClick={() => handleMarkAd("pre")}
              >
                <DollarSign className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Pre-Roll Ad</div>
                  <div className="text-xs text-muted-foreground">Mark ad slot</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16 gap-2 hover:border-blue-500 hover:bg-blue-500/10"
                onClick={() => handleMarkAd("mid")}
              >
                <DollarSign className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Mid-Roll Ad</div>
                  <div className="text-xs text-muted-foreground">Mark ad slot</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16 gap-2 hover:border-orange-500 hover:bg-orange-500/10"
                onClick={() => handleMarkAd("post")}
              >
                <DollarSign className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Post-Roll Ad</div>
                  <div className="text-xs text-muted-foreground">Mark ad slot</div>
                </div>
              </Button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Session Info */}
        {recordingState !== "idle" && (
          <div className="w-80 border-l p-6 space-y-6 overflow-y-auto">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Clip Markers ({clipMarkers.length})
              </h3>
              {clipMarkers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No markers yet</p>
              ) : (
                <div className="space-y-2">
                  {clipMarkers.map((marker, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="text-sm font-medium">{formatTime(marker.timestamp)}</div>
                      <div className="text-xs text-muted-foreground">Clip #{idx + 1}</div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ad Markers ({adMarkers.length})
              </h3>
              {adMarkers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ad slots marked</p>
              ) : (
                <div className="space-y-2">
                  {adMarkers.map((marker, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="text-sm font-medium">{formatTime(marker.timestamp)}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {marker.slot_type}-roll
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
