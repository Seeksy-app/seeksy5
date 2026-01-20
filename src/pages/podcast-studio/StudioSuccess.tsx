import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Home, Mic, FileText, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const StudioSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { episodeTitle, episodeId, audioUrl, duration } = location.state || {};
  const [transcriptionStatus, setTranscriptionStatus] = useState<'pending' | 'processing' | 'complete' | 'error'>('pending');
  const [transcriptId, setTranscriptId] = useState<string | null>(null);

  useEffect(() => {
    // Confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ["#053877", "#2C6BED", "#4B9EFF"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ["#053877", "#2C6BED", "#4B9EFF"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Auto-trigger transcription if enabled
  useEffect(() => {
    if (!episodeId || !audioUrl) return;

    const triggerTranscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if auto-transcribe is enabled
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('auto_transcribe_enabled')
          .eq('user_id', user.id)
          .single();

        if (prefs?.auto_transcribe_enabled === false) return;

        setTranscriptionStatus('processing');

        // Call transcription edge function
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: {
            asset_id: episodeId,
            audio_url: audioUrl,
            language: 'en',
            source_type: 'podcast_episode',
          },
        });

        if (error) throw error;

        setTranscriptId(data?.transcript_id);
        setTranscriptionStatus('complete');
      } catch (error) {
        console.error('Transcription error:', error);
        setTranscriptionStatus('error');
      }
    };

    triggerTranscription();
  }, [episodeId, audioUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 bg-white/95 backdrop-blur">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#053877]">
              Episode Complete!
            </h2>
            <p className="text-muted-foreground">
              Your podcast episode has been successfully processed and saved
            </p>
          </div>

          {episodeTitle && (
            <div className="p-4 rounded-lg bg-[#053877]/5 border border-[#053877]/10">
              <div className="text-sm text-muted-foreground">Episode Title</div>
              <div className="font-semibold text-[#053877] mt-1">
                {episodeTitle}
              </div>
            </div>
          )}

          {/* Transcription Status */}
          {transcriptionStatus !== 'pending' && (
            <div className="p-4 rounded-lg border bg-background/50">
              <div className="flex items-center gap-3">
                {transcriptionStatus === 'processing' && (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div>
                      <div className="font-medium">Transcription in progress...</div>
                      <div className="text-sm text-muted-foreground">
                        We'll notify you when it's ready
                      </div>
                    </div>
                  </>
                )}
                {transcriptionStatus === 'complete' && (
                  <>
                    <FileText className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-green-600">Transcript ready!</div>
                      <div className="text-sm text-muted-foreground">
                        View it in your Transcript Library
                      </div>
                    </div>
                    {transcriptId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/transcripts/${transcriptId}`)}
                      >
                        View Transcript
                      </Button>
                    )}
                  </>
                )}
                {transcriptionStatus === 'error' && (
                  <>
                    <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center">
                      <span className="text-xs text-destructive">!</span>
                    </div>
                    <div>
                      <div className="font-medium text-destructive">Transcription failed</div>
                      <div className="text-sm text-muted-foreground">
                        Please try again later
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => navigate("/podcast-studio")}
              variant="outline"
              className="flex-1 h-12"
            >
              <Mic className="w-4 h-4 mr-2" />
              Back to Studio Home
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-12"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StudioSuccess;
