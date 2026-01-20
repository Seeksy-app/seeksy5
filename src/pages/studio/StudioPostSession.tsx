import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Wand2, Scissors, FileText, Share2,
  Clock, Mic, ArrowRight, Sparkles, Target, DollarSign, XCircle
} from "lucide-react";

export default function StudioPostSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // Fetch session details
  const { data: session, isLoading } = useQuery({
    queryKey: ["studio-session", sessionId],
    queryFn: async (): Promise<any> => {
      if (!sessionId) throw new Error("No session ID");

      // @ts-ignore
      const { data, error } = await supabase
        .from("studio_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch marker counts
  const { data: markerCounts } = useQuery({
    queryKey: ["marker-counts", sessionId],
    queryFn: async (): Promise<{ clipCount: number; adCount: number }> => {
      if (!sessionId) return { clipCount: 0, adCount: 0 };

      // @ts-ignore
      const [clipResult, adResult] = await Promise.all([
        supabase.from("clip_markers")
          .select("id", { count: "exact", head: true })
          .eq("session_id", sessionId),
        supabase.from("ad_markers")
          .select("id", { count: "exact", head: true })
          .eq("session_id", sessionId),
      ]);

      return {
        clipCount: clipResult.count || 0,
        adCount: adResult.count || 0,
      };
    },
    enabled: !!sessionId,
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/10">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/10">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
              <p className="text-sm text-muted-foreground">
                This recording session doesn't exist or has been deleted.
              </p>
            </div>
            <Button onClick={() => navigate("/studio")}>
              Back to Studio
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const nextActions = [
    {
      title: "Run AI Post-Production",
      description: "Clean audio, remove filler words, enhance quality",
      icon: Wand2,
      color: "from-purple-500 to-purple-600",
      action: () => {
        // TODO: runAiPostProduction(sessionId)
        console.log("TODO: Run AI Post-Production for session", sessionId);
      },
      available: true,
    },
    {
      title: "Generate Clips from Markers",
      description: `Auto-create ${markerCounts?.clipCount || 0} clips from your markers`,
      icon: Scissors,
      color: "from-blue-500 to-blue-600",
      action: () => {
        // TODO: generateClipsFromMarkers(sessionId)
        console.log("TODO: Generate clips from markers for session", sessionId);
      },
      available: (markerCounts?.clipCount || 0) > 0,
    },
    {
      title: "Create Podcast Episode",
      description: "Add metadata and publish to your RSS feed",
      icon: FileText,
      color: "from-green-500 to-green-600",
      action: () => {
        // TODO: prepareEpisode(sessionId)
        console.log("TODO: Prepare episode for session", sessionId);
      },
      available: true,
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container max-w-6xl mx-auto p-8 space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Recording Complete!</h1>
            <p className="text-lg text-muted-foreground">
              Your session has been saved successfully
            </p>
          </div>
        </div>

        {/* Session Summary */}
        <Card className="border-2 shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Session Summary
            </CardTitle>
            <CardDescription>
              {session.room_name || "Untitled Recording"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <div className="text-3xl font-bold">
                  {session.duration_seconds ? formatTime(session.duration_seconds) : "0:00"}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Clip Markers</span>
                </div>
                <div className="text-3xl font-bold text-purple-500">
                  {markerCounts?.clipCount || 0}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Ad Markers</span>
                </div>
                <div className="text-3xl font-bold text-green-500">
                  {markerCounts?.adCount || 0}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mic className="w-4 h-4" />
                  <span className="text-sm">Tracks</span>
                </div>
                <div className="text-3xl font-bold">
                  1
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Actions */}
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            What's Next?
            <Sparkles className="w-5 h-5 text-primary" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nextActions.map((action, index) => (
              <Card
                key={index}
                className={`group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden ${
                  !action.available ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={action.available ? action.action : undefined}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 ${action.available ? 'group-hover:opacity-5' : ''} transition-opacity`} />
                <CardHeader className="relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 ${action.available ? 'group-hover:scale-110' : ''} transition-transform shadow-lg`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className={`text-lg ${action.available ? 'group-hover:text-primary' : ''} transition-colors`}>
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                {action.available && (
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      Get Started
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                )}
                {!action.available && (
                  <CardContent>
                    <Badge variant="outline" className="text-xs">
                      No markers yet
                    </Badge>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-6 border-t animate-in fade-in slide-in-from-bottom-7 duration-700">
          <Button
            variant="outline"
            onClick={() => navigate("/studio")}
            size="lg"
          >
            Back to Studio Home
          </Button>
          <Button 
            className="gap-2" 
            size="lg"
            variant="secondary"
            onClick={() => navigate("/studio/recordings")}
          >
            <Share2 className="w-4 h-4" />
            View All Recordings
          </Button>
        </div>
      </div>
    </div>
  );
}
