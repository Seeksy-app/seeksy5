import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, Clock, Scissors, Bookmark, FileAudio, 
  Wand2, Download, PlusCircle, Video, Library, CheckCircle2
} from "lucide-react";

export default function StudioSession() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const { data: session, isLoading } = useQuery({
    queryKey: ["studio-session", sessionId],
    queryFn: async () => {
      if (!sessionId || sessionId === "new") {
        return {
          id: "new",
          room_name: "New Recording",
          duration_seconds: 125,
          status: "ended",
          created_at: new Date().toISOString(),
          clips_detected: 4,
          markers_count: 3,
          tracks: 2,
        };
      }
      const { data } = await supabase
        .from("studio_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      return data;
    },
    enabled: !!sessionId,
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAIPostProduction = () => {
    navigate("/studio/clips", {
      state: { sessionId, mediaId: sessionId, preloadTranscript: true }
    });
  };

  const handleGenerateClips = () => {
    const markers = (session as any)?.markers_count || 0;
    navigate("/studio/clips", {
      state: { sessionId, markers, filterByMarkers: markers > 0 }
    });
  };

  const handleCreateEpisode = () => {
    navigate("/podcasts", {
      state: { 
        createEpisode: true,
        recordingId: sessionId,
        title: session?.room_name || "Recording Session",
        duration: session?.duration_seconds || 0,
        recordingDate: session?.created_at
      }
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading session...</div>
      </div>
    );
  }

  const markers = (session as any)?.markers_count || 0;
  const clipsDetected = (session as any)?.clips_detected || 4;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/studio")} 
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-muted-foreground/50">‹</span>
          <span 
            className="text-muted-foreground text-sm cursor-pointer hover:text-foreground transition-colors" 
            onClick={() => navigate("/studio")}
          >
            Back to Studio Home
          </span>
        </div>
        <h1 className="font-semibold text-foreground">Session Details</h1>
        <div />
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Session Summary */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{session?.room_name || "Recording Session"}</h2>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-0">
            Recording Saved
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{formatDuration(session?.duration_seconds || 0)}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 text-center">
              <Scissors className="w-6 h-6 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{clipsDetected}</p>
              <p className="text-xs text-muted-foreground">Clips Detected</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 text-center">
              <Bookmark className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{markers}</p>
              <p className="text-xs text-muted-foreground">Markers</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 text-center">
              <FileAudio className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">2</p>
              <p className="text-xs text-muted-foreground">Tracks</p>
            </CardContent>
          </Card>
        </div>

        {/* What's Next? Actions */}
        <Card className="bg-card border-border shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Primary CTA - AI Post-Production */}
            <Button 
              className="w-full justify-start gap-3 h-16 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleAIPostProduction}
            >
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Wand2 className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold">Run AI Post-Production</p>
                <p className="text-xs opacity-80">Auto-enhance, remove filler words, normalize audio</p>
              </div>
              <span className="text-sm font-medium">Get Started →</span>
            </Button>
            
            {/* Generate Clips */}
            <Button 
              variant="outline"
              className="w-full justify-start gap-3 h-16 border-border hover:bg-accent"
              onClick={handleGenerateClips}
            >
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground">Generate Clips from Markers</p>
                <p className="text-xs text-muted-foreground">
                  {markers > 0 
                    ? `Create social clips from ${markers} marker${markers > 1 ? 's' : ''}` 
                    : "Create social media clips from AI suggestions"}
                </p>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Get Started →</span>
            </Button>
            
            {/* Create Podcast Episode */}
            <Button 
              variant="outline"
              className="w-full justify-start gap-3 h-16 border-border hover:bg-accent"
              onClick={handleCreateEpisode}
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground">Create Podcast Episode</p>
                <p className="text-xs text-muted-foreground">Publish this recording as an episode</p>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Get Started →</span>
            </Button>
            
            {/* Download Recording */}
            <Button 
              variant="outline"
              className="w-full justify-start gap-3 h-16 border-border hover:bg-accent"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Download className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground">Download Recording</p>
                <p className="text-xs text-muted-foreground">Export raw audio/video files</p>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Download →</span>
            </Button>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/studio")} 
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Studio Home
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/studio/media")} 
            className="text-muted-foreground hover:text-foreground"
          >
            <Library className="w-4 h-4 mr-2" />
            View All Recordings
          </Button>
        </div>
      </div>
    </div>
  );
}
