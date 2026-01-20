import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, Square, Pause, Play, Scissors, DollarSign,
  CheckCircle2, XCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LiveRecordingProps {
  recorder: {
    state: string;
    duration: number;
    audioLevel: number;
    pauseRecording: () => void;
    resumeRecording: () => void;
    addClipMarker: () => void;
    addAdMarker: (type: "pre_roll" | "mid_roll" | "post_roll") => void;
  };
  onEndSession: () => void;
  onBack: () => void;
}

export function LiveRecording({ recorder, onEndSession, onBack }: LiveRecordingProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Fetch real identity status
  const { data: identityStatus } = useQuery({
    queryKey: ["identity-status-live"],
    queryFn: async (): Promise<{ voiceVerified: boolean; faceVerified: boolean }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { voiceVerified: false, faceVerified: false };

      // @ts-ignore
      const faceResult = await supabase.from("identity_assets")
        .select("id")
        .eq("user_id", user.id)
        .eq("asset_type", "FACE_IDENTITY")
        .eq("cert_status", "minted")
        .limit(1);
      
      // @ts-ignore
      const voiceResult = await supabase.from("creator_voice_profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_verified", true)
        .limit(1);

      return {
        faceVerified: !!(faceResult.data && faceResult.data.length > 0),
        voiceVerified: !!(voiceResult.data && voiceResult.data.length > 0),
      };
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isRecording = recorder.state === "recording";
  const isPaused = recorder.state === "paused";
  const isSaving = recorder.state === "saving";

  const handleEndClick = () => {
    if (isRecording || isPaused) {
      setShowEndConfirm(true);
    } else {
      onBack();
    }
  };

  return (
    <>
      <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/10">
        {/* Top Bar */}
        <div className="border-b bg-card/95 backdrop-blur-sm px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Session Name & Status */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Untitled Session</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge 
                    variant={isRecording ? "destructive" : "secondary"}
                    className="gap-1.5 px-3"
                  >
                    {isRecording && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                    {isSaving ? "Saving..." : isRecording ? "Recording" : isPaused ? "Paused" : "Stopped"}
                  </Badge>
                  {/* Identity badges */}
                  {identityStatus && (
                    <div className="flex items-center gap-3 text-xs border-l pl-3 ml-1">
                      <div className="flex items-center gap-1.5">
                        {identityStatus.faceVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className="text-muted-foreground font-medium">Face</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {identityStatus.voiceVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className="text-muted-foreground font-medium">Voice</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Timer */}
            <div className="text-5xl font-mono font-bold tabular-nums tracking-tight">
              {formatTime(recorder.duration)}
            </div>

            {/* Right: End Session */}
            <Button 
              variant="ghost" 
              onClick={handleEndClick}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "End Session"}
            </Button>
          </div>
        </div>

        {/* Main Recording Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-5xl space-y-10">
            {/* Waveform / Level Meter */}
            <Card className="aspect-[21/9] bg-gradient-to-br from-card to-muted/20 flex items-center justify-center relative overflow-hidden border-2">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(var(--primary-rgb),0.05)_0%,transparent_100%)]" />
              <div className="relative w-full px-16 z-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="font-semibold">Host Track</span>
                    </div>
                    <span className="text-muted-foreground tabular-nums">
                      Level: {Math.round(recorder.audioLevel * 100)}%
                    </span>
                  </div>
                  <div className="h-32 bg-gradient-to-b from-muted/40 to-muted/60 rounded-2xl overflow-hidden flex items-center border border-border/50 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75 ease-out rounded-r-2xl shadow-lg"
                      style={{ 
                        width: `${Math.max(recorder.audioLevel * 100, 2)}%`,
                        opacity: recorder.audioLevel > 0.05 ? 1 : 0.5 
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-6">
              {isPaused ? (
                <Button
                  size="lg"
                  className="h-20 px-12 gap-3 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl"
                  onClick={recorder.resumeRecording}
                  disabled={isSaving}
                >
                  <Play className="w-7 h-7" />
                  Resume
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-20 px-12 gap-3 text-lg border-2 hover:border-primary shadow-lg"
                  onClick={recorder.pauseRecording}
                  disabled={!isRecording || isSaving}
                >
                  <Pause className="w-7 h-7" />
                  Pause
                </Button>
              )}
              
              <Button
                size="lg"
                variant="destructive"
                className="h-20 px-12 gap-3 text-lg shadow-xl"
                onClick={() => setShowEndConfirm(true)}
                disabled={isSaving}
              >
                <Square className="w-7 h-7" />
                Stop & Save
              </Button>
            </div>

            {/* Marker Controls */}
            <div className="grid grid-cols-2 gap-6">
              <Button
                variant="outline"
                className="h-24 gap-4 hover:border-purple-500 hover:bg-purple-500/10 transition-all duration-200 shadow-md border-2"
                onClick={recorder.addClipMarker}
                disabled={!isRecording || isSaving}
              >
                <Scissors className="w-7 h-7 text-purple-500" />
                <div className="text-left">
                  <div className="font-semibold text-base">Mark Clip</div>
                  <div className="text-xs text-muted-foreground">Create highlight at {formatTime(recorder.duration)}</div>
                </div>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-24 gap-4 hover:border-green-500 hover:bg-green-500/10 transition-all duration-200 shadow-md border-2"
                    disabled={!isRecording || isSaving}
                  >
                    <DollarSign className="w-7 h-7 text-green-500" />
                    <div className="text-left">
                      <div className="font-semibold text-base">Mark Ad Slot</div>
                      <div className="text-xs text-muted-foreground">Choose placement</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem 
                    onClick={() => recorder.addAdMarker("pre_roll")}
                    className="py-3 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">Pre-roll</span>
                      <span className="text-xs text-muted-foreground">Before content starts</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => recorder.addAdMarker("mid_roll")}
                    className="py-3 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">Mid-roll</span>
                      <span className="text-xs text-muted-foreground">During content</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => recorder.addAdMarker("post_roll")}
                    className="py-3 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">Post-roll</span>
                      <span className="text-xs text-muted-foreground">After content ends</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Saving Overlay */}
        {isSaving && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
            <Card className="p-8 space-y-4 max-w-md">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Saving your recording...</h3>
                  <p className="text-sm text-muted-foreground">
                    Please don't close this window
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* End Session Confirmation */}
      <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Recording Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the recording and save your session. You'll be able to review, edit, and publish it afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Recording</AlertDialogCancel>
            <AlertDialogAction onClick={onEndSession} className="bg-destructive hover:bg-destructive/90">
              End & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
