import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, 
  Play, 
  Square, 
  ExternalLink, 
  Download, 
  FolderOpen, 
  Clock,
  Loader2,
  CheckCircle,
  Monitor,
  RefreshCw,
  CloudUpload,
  AlertCircle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScreenCapture, ScreenCapturePreset, CapturedRecording } from "@/hooks/useScreenCapture";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DemoRecorderSettings, defaultDemoRecorderSettings, type DemoRecorderSettingsData } from "@/components/studio/DemoRecorderSettings";
import { BackButton } from "@/components/navigation/BackButton";

const CAPTURE_PRESETS: ScreenCapturePreset[] = [
  {
    id: "home-hero",
    name: "Seeksy Home – Your Seeksy Workspace",
    shortName: "home-hero",
    sceneNumber: 1,
    targetUrl: "/",
    recommendedDuration: 10,
    description: "Hero section + module cards. Slowly scroll over the hero area.",
  },
  {
    id: "creator-dashboard",
    name: "Creator / Investor Dashboard",
    shortName: "creator-dashboard",
    sceneNumber: 2,
    targetUrl: "/dashboard",
    recommendedDuration: 15,
    description: "Main dashboard with widgets. Hover over Identity Verification, AI Clips, etc.",
  },
  {
    id: "ai-studio",
    name: "AI Production Studio / AI Clips",
    shortName: "ai-studio",
    sceneNumber: 3,
    targetUrl: "/studio/clips",
    recommendedDuration: 15,
    description: "Show timeline, transcript, caption styles, Export & Save buttons.",
  },
  {
    id: "events-awards",
    name: "Events & Awards Module",
    shortName: "events-awards",
    sceneNumber: 4,
    targetUrl: "/events",
    recommendedDuration: 15,
    description: "Event list, registration details, awards categories.",
  },
  {
    id: "meetings-mia",
    name: "Meetings / Scheduling (Mia)",
    shortName: "meetings-mia",
    sceneNumber: 5,
    targetUrl: "/meetings",
    recommendedDuration: 15,
    description: "Meeting types, booking links, Mia assistant.",
  },
  {
    id: "cfo-board",
    name: "CFO / Investor Board View",
    shortName: "cfo-board",
    sceneNumber: 6,
    targetUrl: "/cfo-dashboard",
    recommendedDuration: 15,
    description: "Key Success Metrics, Performance Insights tiles & charts.",
  },
  {
    id: "credits-pricing",
    name: "Credits & Pricing",
    shortName: "credits-pricing",
    sceneNumber: 7,
    targetUrl: "/settings/billing",
    recommendedDuration: 10,
    description: "Credit packages, what you can do with credits.",
  },
];

export default function ScreenCapture() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    isRecording,
    isProcessing,
    captureStatus,
    recordingDuration,
    currentPresetId,
    lastError,
    startCapture,
    stopCapture,
    cancelCapture,
    resetStatus,
  } = useScreenCapture();

  const [sessionRecordings, setSessionRecordings] = useState<CapturedRecording[]>([]);
  const [activePreset, setActivePreset] = useState<ScreenCapturePreset | null>(null);
  const activePresetRef = useRef<ScreenCapturePreset | null>(null);
  const [settings, setSettings] = useState<DemoRecorderSettingsData>(defaultDemoRecorderSettings);

  // Query recent demo video recordings from database
  const { data: dbRecordings, refetch: refetchRecordings } = useQuery({
    queryKey: ['demo-video-recordings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('[ScreenCapture] Error fetching recordings:', error);
        return [];
      }
      // Filter for demo-video tag in clip_metadata
      return (data || []).filter(r => (r.clip_metadata as any)?.tag === 'demo-video');
    },
  });

  // Keep ref in sync with state for async callbacks
  useEffect(() => {
    activePresetRef.current = activePreset;
  }, [activePreset]);

  const handleStartCapture = async (preset: ScreenCapturePreset) => {
    setActivePreset(preset);
    await startCapture(preset);
  };

  const handleStopCapture = async () => {
    const preset = activePresetRef.current || activePreset;
    if (!preset) {
      console.warn('[ScreenCapture] No active preset to stop');
      return;
    }
    
    console.log('[ScreenCapture] handleStopCapture called for:', preset.name);
    const recording = await stopCapture(preset);
    
    if (recording) {
      setSessionRecordings(prev => [recording, ...prev]);
      // Refresh the database query to show the new recording
      await refetchRecordings();
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
    }
    setActivePreset(null);
  };

  const handleOpenPage = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownload = async (recording: CapturedRecording) => {
    try {
      const { data, error } = await supabase.storage
        .from('media-vault')
        .download(recording.storagePath);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = recording.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download the recording.",
      });
    }
  };

  const handleDownloadDb = async (recording: { file_name: string; file_url: string }) => {
    try {
      // Use the file_url directly for download
      const response = await fetch(recording.file_url);
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = recording.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download the recording.",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton fallbackPath="/admin" className="mb-2" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Monitor className="h-8 w-8 text-primary" />
            Demo Video Recorder
          </h1>
          <p className="text-muted-foreground mt-2">
            Record silent screen captures of Seeksy pages for HeyGen investor videos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DemoRecorderSettings settings={settings} onSettingsChange={setSettings} />
          <Button variant="outline" onClick={() => navigate('/media/library')}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open Media Library
          </Button>
        </div>
      </div>

      {/* Recording Status Bar - Enhanced with visual progress */}
      {(isRecording || isProcessing || captureStatus === 'saved' || captureStatus === 'failed') && (
        <Card className={`border-2 ${
          captureStatus === 'recording' ? 'border-destructive bg-destructive/5' : 
          captureStatus === 'saved' ? 'border-green-500 bg-green-500/5' :
          captureStatus === 'failed' ? 'border-destructive bg-destructive/5' :
          'border-primary bg-primary/5'
        }`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {captureStatus === 'recording' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive"></span>
                      </span>
                      <span className="font-bold text-destructive text-lg">⏺ Recording</span>
                    </div>
                    <Badge variant="outline" className="text-lg px-4 py-1 font-mono border-2">
                      <Clock className="mr-2 h-4 w-4" />
                      {formatDuration(recordingDuration)}
                    </Badge>
                    <span className="text-muted-foreground font-medium">
                      {activePreset?.name}
                    </span>
                  </>
                )}
                {captureStatus === 'encoding' && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                      <span className="font-bold text-amber-600">⏳ Encoding video...</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Encoding
                      </span>
                      <span>→</span>
                      <span className="opacity-50">Uploading</span>
                      <span>→</span>
                      <span className="opacity-50">Saved</span>
                    </div>
                  </div>
                )}
                {captureStatus === 'uploading' && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CloudUpload className="h-5 w-5 animate-pulse text-blue-500" />
                      <span className="font-bold text-blue-600">☁️ Uploading to Seeksy...</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="h-3 w-3" />
                        Encoded
                      </span>
                      <span>→</span>
                      <span className="flex items-center gap-1 animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading
                      </span>
                      <span>→</span>
                      <span className="opacity-50">Saved</span>
                    </div>
                  </div>
                )}
                {captureStatus === 'saved' && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-bold text-green-600">✅ Saved to Library</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={resetStatus}>
                      Dismiss
                    </Button>
                  </div>
                )}
                {captureStatus === 'failed' && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span className="font-bold text-destructive">❌ Failed</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{lastError}</span>
                    <Button size="sm" variant="ghost" onClick={resetStatus}>
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
              {captureStatus === 'recording' && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={cancelCapture}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="lg" onClick={handleStopCapture}>
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Capture Presets */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Capture Presets ({CAPTURE_PRESETS.length} Scenes)</CardTitle>
            <CardDescription>
              Pre-configured scenes for the investor demo video. Click Start to begin recording.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {CAPTURE_PRESETS.map((preset) => {
                  const isActive = currentPresetId === preset.id;
                  const hasRecording = sessionRecordings.some(r => r.presetId === preset.id) || 
                    (dbRecordings?.some(r => (r.clip_metadata as any)?.preset_id === preset.id));
                  
                  return (
                    <div
                      key={preset.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isActive ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              Scene {preset.sceneNumber}
                            </Badge>
                            <h3 className="font-semibold">{preset.name}</h3>
                            {hasRecording && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {preset.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              ~{preset.recommendedDuration}s recommended
                            </span>
                            <code className="bg-muted px-2 py-0.5 rounded">
                              {preset.targetUrl}
                            </code>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPage(preset.targetUrl)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          {isActive && isRecording ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={handleStopCapture}
                              disabled={isProcessing}
                            >
                              <Square className="mr-1 h-4 w-4" />
                              Stop
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleStartCapture(preset)}
                              disabled={isRecording || isProcessing}
                            >
                              <Play className="mr-1 h-4 w-4" />
                              Start
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Recordings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Recent Recordings
                </CardTitle>
                <CardDescription>
                  Demo videos saved to Media Library with "demo-video" tag.
                </CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => refetchRecordings()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(!dbRecordings || dbRecordings.length === 0) && sessionRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recordings yet</p>
                <p className="text-sm text-muted-foreground">
                  Start capturing scenes above
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[420px]">
                <div className="space-y-3">
                  {/* Show session recordings first (most recent) */}
                  {sessionRecordings.map((recording) => {
                    const preset = CAPTURE_PRESETS.find(p => p.id === recording.presetId);
                    return (
                      <div
                        key={recording.id}
                        className="p-3 border rounded-lg space-y-2 border-primary/50 bg-primary/5"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              Scene {preset?.sceneNumber}: {preset?.shortName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDuration(recording.duration)} • Just now
                            </p>
                          </div>
                          <Badge variant="default">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            New
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleDownload(recording)}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate('/media/library')}
                          >
                            <FolderOpen className="mr-1 h-3 w-3" />
                            Library
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Show database recordings (excluding duplicates from session) */}
                  {dbRecordings?.filter(r => !sessionRecordings.some(s => s.id === r.id)).map((recording) => {
                    const clipMeta = recording.clip_metadata as any;
                    const preset = CAPTURE_PRESETS.find(p => p.id === clipMeta?.preset_id);
                    return (
                      <div
                        key={recording.id}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {preset ? `Scene ${preset.sceneNumber}: ${preset.shortName}` : recording.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {clipMeta?.duration_seconds ? formatDuration(clipMeta.duration_seconds) : 'N/A'} • {new Date(recording.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Saved
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleDownloadDb(recording)}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate('/media/library')}
                          >
                            <FolderOpen className="mr-1 h-3 w-3" />
                            Library
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Click <strong>Open (↗)</strong> to open the target page in a new tab</li>
            <li>Click <strong>Start</strong> on a preset to begin recording</li>
            <li>Your browser will ask you to choose what to share — select the <strong>tab</strong> with Seeksy</li>
            <li>Perform your demo actions (scroll slowly, hover over elements)</li>
            <li>Click <strong>Stop Recording</strong> when done</li>
            <li>The video is automatically saved to Media Library with the "demo-video" tag</li>
            <li>Use <strong>Download</strong> to get the MP4 directly, or find it in Media Library</li>
          </ol>
          <div className="p-3 bg-muted rounded-lg text-sm">
            <strong>Tip:</strong> For best results, record at 1080p resolution. Hide browser dev tools and 
            any UI elements you don't want in the video. The recording captures only what you share — 
            no browser chrome or address bar.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
