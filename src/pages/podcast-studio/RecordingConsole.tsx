import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mic, Square, Pause, Play, FileText, Tag } from "lucide-react";
import { initializeRecordingSession, startRecording, stopRecording, fetchAvailableAdScripts, logAdReadEvent, type AudioTrack } from "@/lib/api/podcastStudioAPI";
import type { AdScript } from "@/lib/api/advertiserAPI";

type RecordingState = "idle" | "recording" | "paused";

interface AdReadEvent {
  timestamp: number;
  adScriptId: string;
  adScriptTitle: string;
  duration: number;
}

const RecordingConsole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { micSettings } = location.state || {};

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ad-read features
  const [availableScripts, setAvailableScripts] = useState<AdScript[]>([]);
  const [selectedAdScript, setSelectedAdScript] = useState<string>("");
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [adReadEvents, setAdReadEvents] = useState<AdReadEvent[]>([]);

  // Multitrack recording architecture
  const [participants] = useState([
    { id: "host", name: "Host" },
    { id: "guest1", name: "Guest 1" }, // Mock guest for now
  ]);

  useEffect(() => {
    // Initialize multitrack session on mount
    initializeRecordingSession(participants).then(({ sessionId }) => {
      setSessionId(sessionId);
    });

    // Fetch available ad scripts
    fetchAvailableAdScripts().then((scripts) => {
      setAvailableScripts(scripts);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartRecording = async () => {
    if (!sessionId) return;

    await startRecording(sessionId);
    setRecordingState("recording");
    setDuration(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const handlePauseRecording = () => {
    setRecordingState("paused");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleResumeRecording = () => {
    setRecordingState("recording");
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecording = async () => {
    if (!sessionId) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const { tracks, duration: finalDuration } = await stopRecording(sessionId);
    setAudioTracks(tracks);
    setDuration(finalDuration);
    setRecordingState("idle");

    // Navigate to cleanup with recording data including ad-read events
    navigate("/podcast-studio/cleanup", {
      state: {
        tracks,
        duration: finalDuration,
        micSettings,
        adReadEvents,
      },
    });
  };

  const handleMarkAdRead = async () => {
    if (!selectedAdScript || !sessionId) return;

    const script = availableScripts.find(s => s.id === selectedAdScript);
    if (!script) return;

    const adReadEvent: AdReadEvent = {
      timestamp: duration,
      adScriptId: script.id,
      adScriptTitle: `${script.brandName} — ${script.title}`,
      duration: script.readLengthSeconds,
    };

    setAdReadEvents([...adReadEvents, adReadEvent]);
    await logAdReadEvent(sessionId, adReadEvent);
  };

  const selectedScript = availableScripts.find(s => s.id === selectedAdScript);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl p-8 bg-white/95 backdrop-blur">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-[#053877]">
              Recording Console
            </h2>
            <p className="text-sm text-muted-foreground">
              Multitrack recording in progress
            </p>
          </div>

          {/* Waveform Animation */}
          <div className="relative h-32 bg-gradient-to-r from-[#053877]/5 via-[#2C6BED]/10 to-[#053877]/5 rounded-lg flex items-center justify-center overflow-hidden">
            {recordingState === "recording" && (
              <div className="flex items-center gap-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-[#2C6BED] rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 60 + 20}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
            {recordingState === "idle" && (
              <div className="text-muted-foreground text-sm">
                Press record to start
              </div>
            )}
            {recordingState === "paused" && (
              <div className="text-muted-foreground text-sm">
                Recording paused
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-[#053877]">
              {formatTime(duration)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {participants.length} tracks recording
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            {recordingState === "idle" && (
              <Button
                onClick={handleStartRecording}
                disabled={!sessionId}
                className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-14 px-8"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {recordingState === "recording" && (
              <>
                <Button
                  onClick={handlePauseRecording}
                  variant="outline"
                  className="h-14 px-8"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={handleStopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white h-14 px-8"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              </>
            )}

            {recordingState === "paused" && (
              <>
                <Button
                  onClick={handleResumeRecording}
                  className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white h-14 px-8"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
                <Button
                  onClick={handleStopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white h-14 px-8"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              </>
            )}
          </div>

          {/* Ad-Read Controls */}
          {recordingState !== "idle" && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-sm font-semibold text-[#053877]">Ad Script Controls</h3>
              
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-xs text-muted-foreground">Select Ad Script</label>
                  <Select value={selectedAdScript} onValueChange={setSelectedAdScript}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an ad script..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableScripts.map((script) => (
                        <SelectItem key={script.id} value={script.id}>
                          {script.brandName} — {script.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowScriptDialog(true)}
                  disabled={!selectedAdScript}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Show Script
                </Button>

                <Button
                  onClick={handleMarkAdRead}
                  disabled={!selectedAdScript}
                  className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Mark Ad Read
                </Button>
              </div>

              {adReadEvents.length > 0 && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs font-semibold text-[#053877] mb-2">
                    Ad Reads Recorded ({adReadEvents.length})
                  </p>
                  <div className="space-y-1">
                    {adReadEvents.map((event, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        {formatTime(event.timestamp)} - {event.adScriptTitle}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Script Dialog */}
          <Dialog open={showScriptDialog} onOpenChange={setShowScriptDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedScript ? `${selectedScript.brandName} — ${selectedScript.title}` : "Ad Script"}
                </DialogTitle>
              </DialogHeader>
              {selectedScript && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm leading-relaxed">{selectedScript.scriptText}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Read time: {selectedScript.readLengthSeconds}s</span>
                    <div className="flex gap-1">
                      {selectedScript.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-[#2C6BED]/10 text-[#2C6BED] rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
};

export default RecordingConsole;
