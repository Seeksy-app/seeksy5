import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Camera, Focus, Scissors, TrendingUp, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProcessingStage {
  id: string;
  label: string;
  icon: any;
  status: 'pending' | 'processing' | 'complete';
  description: string;
  changes?: string[];
}

interface AICameraProcessingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  videoDuration: number;
  onComplete: (edits: any) => void;
}

export const AICameraProcessingDialog = ({ 
  open, 
  onOpenChange, 
  videoUrl,
  videoDuration,
  onComplete 
}: AICameraProcessingDialogProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [detectedChanges, setDetectedChanges] = useState<string[]>([]);
  const [currentEdit, setCurrentEdit] = useState<{ type: string; label: string } | null>(null);
  const [pipScale, setPipScale] = useState(1);
  const [videoTime, setVideoTime] = useState(0);
  
  const stages: ProcessingStage[] = [
    {
      id: 'analyzing',
      label: 'Analyzing Video',
      icon: Camera,
      status: 'processing',
      description: 'Detecting speakers, emotions, and emphasis points...',
      changes: []
    },
    {
      id: 'planning',
      label: 'Planning Camera Angles',
      icon: Focus,
      status: 'pending',
      description: 'Determining optimal wide, medium, and close-up shots...',
      changes: []
    },
    {
      id: 'editing',
      label: 'Creating Virtual Cameras',
      icon: Scissors,
      status: 'pending',
      description: 'Generating punch-ins, zooms, and reframing effects...',
      changes: []
    },
    {
      id: 'optimizing',
      label: 'Finalizing Edit',
      icon: TrendingUp,
      status: 'pending',
      description: 'Smoothing transitions and balancing shot variety...',
      changes: []
    }
  ];

  const [processedStages, setProcessedStages] = useState(stages);

  useEffect(() => {
    if (!open) {
      setCurrentStageIndex(0);
      setProgress(0);
      setProcessedStages(stages);
      setDetectedChanges([]);
      setCurrentEdit(null);
      setPipScale(1);
      setVideoTime(0);
      return;
    }

    // Simulate real-time change detection and sync video playback
    const changeTimer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 1.5, 100);
        
        // Calculate video playback time based on progress (play through entire video once)
        const duration = videoDuration || 120;
        const calculatedTime = (newProgress / 100) * duration;
        setVideoTime(calculatedTime);
        
        // Add realistic change notifications at specific progress points (based on video duration)
        const formatTimestamp = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        const timestamps = [
          Math.floor(duration * 0.05),
          Math.floor(duration * 0.20),
          Math.floor(duration * 0.40),
          Math.floor(duration * 0.60),
          Math.floor(duration * 0.80)
        ];
        
        if (newProgress >= 20 && newProgress < 22 && detectedChanges.length === 0) {
          setDetectedChanges([`Found speaker at ${formatTimestamp(timestamps[0])} - creating close-up shot`]);
          setCurrentEdit({ type: 'close_up', label: 'Focusing on Speaker' });
          setPipScale(1.5);
        }
        if (newProgress >= 35 && newProgress < 37 && detectedChanges.length === 1) {
          setDetectedChanges(prev => [...prev, `Emphasis detected at ${formatTimestamp(timestamps[1])} - adding punch-in`]);
          setCurrentEdit({ type: 'punch_in', label: 'Adding Punch-In Effect' });
          setPipScale(1.8);
        }
        if (newProgress >= 50 && newProgress < 52 && detectedChanges.length === 2) {
          setDetectedChanges(prev => [...prev, `Conversation flow at ${formatTimestamp(timestamps[2])} - alternating to wide shot`]);
          setCurrentEdit({ type: 'wide', label: 'Switching to Wide Angle' });
          setPipScale(0.9);
        }
        if (newProgress >= 65 && newProgress < 67 && detectedChanges.length === 3) {
          setDetectedChanges(prev => [...prev, `Energy shift at ${formatTimestamp(timestamps[3])} - adding digital zoom`]);
          setCurrentEdit({ type: 'zoom', label: 'Applying Digital Zoom' });
          setPipScale(1.6);
        }
        if (newProgress >= 80 && newProgress < 82 && detectedChanges.length === 4) {
          setDetectedChanges(prev => [...prev, `Smoothing transition at ${formatTimestamp(timestamps[4])} - medium shot`]);
          setCurrentEdit({ type: 'medium', label: 'Creating Medium Shot' });
          setPipScale(1.2);
        }
        
        // Update stage status based on progress
        const stageProgress = (newProgress / 100) * stages.length;
        const newStageIndex = Math.floor(stageProgress);
        
        if (newStageIndex !== currentStageIndex && newStageIndex < stages.length) {
          setCurrentStageIndex(newStageIndex);
          setProcessedStages(prev => prev.map((stage, idx) => ({
            ...stage,
            status: idx < newStageIndex ? 'complete' : 
                   idx === newStageIndex ? 'processing' : 'pending',
            changes: idx < newStageIndex ? detectedChanges.slice(idx * 2, (idx + 1) * 2) : []
          })));
        }
        
        // Complete processing
        if (newProgress === 100) {
          setTimeout(() => {
            const completionTimestamps = [
              Math.floor(duration * 0.05),
              Math.floor(duration * 0.20),
              Math.floor(duration * 0.40),
              Math.floor(duration * 0.60),
              Math.floor(duration * 0.80)
            ];
            
            onComplete({
              edits: [
                { timestamp: completionTimestamps[0], type: 'close_up', description: 'Speaker emphasis - close-up shot' },
                { timestamp: completionTimestamps[1], type: 'punch_in', description: 'Key point - digital punch-in' },
                { timestamp: completionTimestamps[2], type: 'wide', description: 'Conversational flow - wide angle' },
                { timestamp: completionTimestamps[3], type: 'zoom', description: 'Energy shift - smooth zoom in' },
                { timestamp: completionTimestamps[4], type: 'medium', description: 'Natural transition - medium shot' }
              ],
              totalShots: 5,
              avgShotLength: Math.floor(duration / 5),
              multicamStyle: 'professional'
            });
            onOpenChange(false);
          }, 500);
        }
        
        return newProgress;
      });
    }, 80);

    return () => clearInterval(changeTimer);
  }, [open, currentStageIndex, detectedChanges.length]);

  // Keep video elements in sync with calculated time and ensure they're playing
  useEffect(() => {
    if (open && videoTime >= 0) {
      const videos = document.querySelectorAll('.ai-processing-video');
      videos.forEach((video) => {
        const videoElement = video as HTMLVideoElement;
        // Sync the currentTime
        if (Math.abs(videoElement.currentTime - videoTime) > 0.5) {
          videoElement.currentTime = videoTime;
        }
        // Ensure video is playing
        if (videoElement.paused && videoTime < videoDuration) {
          videoElement.play().catch(console.error);
        }
      });
    }
  }, [videoTime, open, videoDuration]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary animate-pulse" />
            AI Camera Focus - Creating Multicam Edit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Real-time Text Overlay - Prominent */}
          {currentEdit && (
            <div className="bg-primary/10 border-2 border-primary rounded-lg p-5 animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-center gap-3">
                {currentEdit.type === 'zoom' && <ZoomIn className="h-6 w-6 text-primary animate-pulse" />}
                {currentEdit.type === 'close_up' && <Focus className="h-6 w-6 text-primary animate-pulse" />}
                {currentEdit.type === 'wide' && <Camera className="h-6 w-6 text-primary animate-pulse" />}
                {currentEdit.type === 'punch_in' && <ZoomIn className="h-6 w-6 text-primary animate-pulse" />}
                {currentEdit.type === 'medium' && <Camera className="h-6 w-6 text-primary animate-pulse" />}
                <div>
                  <p className="font-semibold text-primary">AI is editing now:</p>
                  <p className="text-sm">{currentEdit.label}</p>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Video Preview with PiP */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-primary/20">
            {/* Original Video (Background) */}
            <video 
              src={videoUrl} 
              className="w-full h-full object-contain ai-processing-video"
              muted
              autoPlay
              playsInline
            />
            
            {/* Large Text Overlay on Main Video */}
            {currentEdit && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm px-8 py-4 rounded-lg border-2 border-primary/50 animate-in zoom-in duration-300">
                  <p className="text-white text-2xl font-bold mb-1">
                    {currentEdit.label}
                  </p>
                  <Badge variant="default" className="bg-primary text-xs">
                    Watch the preview below →
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Picture-in-Picture Edited Preview - Made Larger */}
            <div className="absolute bottom-4 right-4 w-96 aspect-video bg-black rounded-lg overflow-hidden border-4 border-primary shadow-2xl z-10">
              <video 
                src={videoUrl} 
                className={cn(
                  "w-full h-full object-cover transition-transform duration-700 ease-in-out ai-processing-video",
                )}
                style={{ transform: `scale(${pipScale})` }}
                muted
                autoPlay
                playsInline
              />
              
              {/* Edit Type Overlay on PiP */}
              {currentEdit && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent">
                  <div className="absolute bottom-2 left-2 right-2 text-center">
                    <Badge variant="default" className="bg-primary/90 backdrop-blur text-xs px-3 py-1">
                      AI Edited - {currentEdit.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              )}
              
              {/* PiP Label */}
              <div className="absolute top-2 left-2 right-2">
                <Badge variant="default" className="text-[10px] bg-black/80 backdrop-blur border border-primary/50">
                  ✨ AI Preview
                </Badge>
              </div>
            </div>

            {/* Processing Indicator */}
            <div className="absolute top-4 left-4 z-20">
              <Badge variant="default" className="bg-red-500/90 backdrop-blur animate-pulse shadow-lg">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Processing Live
              </Badge>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing video...</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Video Timeline - Shows current position in video */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Video Timeline</span>
              <span className="font-mono text-sm">
                {Math.floor(videoTime / 60)}:{Math.floor(videoTime % 60).toString().padStart(2, '0')} / {Math.floor(videoDuration / 60)}:{Math.floor(videoDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="relative h-3 bg-background rounded-full overflow-hidden border">
              <div 
                className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
                style={{ width: `${(videoTime / videoDuration) * 100}%` }}
              />
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/50 to-transparent"
                style={{ width: `${(videoTime / videoDuration) * 100 + 5}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              AI is analyzing and editing the entire video duration
            </p>
          </div>

          {/* Processing Stages */}
          <div className="space-y-3">
            {processedStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div 
                  key={stage.id}
                  className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                    stage.status === 'processing' 
                      ? 'bg-primary/10 border border-primary/20' 
                      : stage.status === 'complete'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="mt-0.5">
                    {stage.status === 'complete' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : stage.status === 'processing' ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{stage.label}</p>
                      {stage.status === 'processing' && (
                        <Badge variant="outline" className="text-xs">
                          In Progress
                        </Badge>
                      )}
                      {stage.status === 'complete' && (
                        <Badge variant="default" className="text-xs bg-green-500">
                          Complete
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-time Changes Detected */}
          {detectedChanges.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Changes Being Applied:
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {detectedChanges.map((change, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50 animate-in fade-in slide-in-from-bottom-2"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Stats */}
          {progress > 40 && (
            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{Math.min(Math.floor(progress / 20), 5)}</p>
                <p className="text-xs text-muted-foreground">Virtual Cameras</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{Math.min(Math.floor(progress / 25), 4)}</p>
                <p className="text-xs text-muted-foreground">Smooth Transitions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{Math.round(progress)}%</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};