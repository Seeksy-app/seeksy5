import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Loader2, Volume2, Zap, Sparkles, Scissors, 
  CheckCircle2, Film, AlertCircle 
} from "lucide-react";
import type { ClipJob } from "@/hooks/useClipGeneration";

// Processing steps for visual feedback
const PROCESSING_STEPS = [
  { id: 'analyze', label: 'Analyzing', icon: Volume2 },
  { id: 'detect', label: 'Detecting Hooks', icon: Zap },
  { id: 'score', label: 'Scoring', icon: Sparkles },
  { id: 'render', label: 'Rendering', icon: Film },
  { id: 'finalize', label: 'Finalizing', icon: CheckCircle2 },
];

interface ClipGenerationProgressProps {
  job: ClipJob | null;
  thumbnailUrl?: string | null;
  isGenerating: boolean;
}

export function ClipGenerationProgress({ 
  job, 
  thumbnailUrl,
  isGenerating 
}: ClipGenerationProgressProps) {
  if (!isGenerating && !job) return null;

  const progress = job?.progress_percent || 0;
  const currentStep = job?.current_step || "Initializing";
  const status = job?.status || "pending";

  // Determine which step is active
  const getCurrentStepIndex = () => {
    if (progress < 20) return 0;
    if (progress < 40) return 1;
    if (progress < 60) return 2;
    if (progress < 85) return 3;
    return 4;
  };

  const activeStepIndex = getCurrentStepIndex();

  if (status === "failed") {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertCircle className="h-5 w-5" />
            Generation Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {job?.error_message || "An error occurred during clip generation. Please try again."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#2C6BED] bg-gradient-to-br from-[#2C6BED]/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Loader2 className="h-5 w-5 animate-spin text-[#2C6BED]" />
          Creating Your Clips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Thumbnail Preview */}
        {thumbnailUrl && (
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <img 
              src={thumbnailUrl} 
              alt="Source video" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#2C6BED]/30 flex items-center justify-center animate-pulse">
                <Scissors className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        )}
        
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{currentStep}</span>
            <span className="font-medium text-[#2C6BED]">{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
            style={{
              background: 'hsl(var(--muted))',
            }}
          />
        </div>
        
        {/* Step Indicators */}
        <div className="grid grid-cols-5 gap-1">
          {PROCESSING_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = idx === activeStepIndex;
            const isComplete = idx < activeStepIndex;
            
            return (
              <div 
                key={step.id}
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg transition-colors",
                  isActive && "bg-[#2C6BED]/10",
                  isComplete && "opacity-60"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors",
                  isActive ? "bg-[#2C6BED] text-white" : 
                  isComplete ? "bg-green-500 text-white" : 
                  "bg-muted text-muted-foreground"
                )}>
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <StepIcon className={cn("h-4 w-4", isActive && "animate-pulse")} />
                  )}
                </div>
                <span className="text-[10px] text-center text-muted-foreground leading-tight">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="bg-[#2C6BED]/10 border-[#2C6BED]/30 text-[#2C6BED]">
            {status === "processing" ? "Processing..." : "Preparing..."}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
