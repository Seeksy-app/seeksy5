import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Camera, Loader2, CheckCircle2, AlertCircle, Lightbulb, 
  Palette, Layout, Image, Sparkles, RefreshCw, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SetupAnalysis {
  overall_score: number;
  summary: string;
  categories: {
    background?: CategoryFeedback;
    lighting?: CategoryFeedback;
    colors?: CategoryFeedback;
    composition?: CategoryFeedback;
  };
  quick_wins: string[];
  raw_response?: string;
}

interface CategoryFeedback {
  score: number;
  feedback: string;
  improvements: string[];
}

interface SetupCheckPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onClose?: () => void;
}

const CATEGORY_CONFIG = {
  background: { icon: Image, label: "Background", color: "text-blue-400" },
  lighting: { icon: Lightbulb, label: "Lighting", color: "text-yellow-400" },
  colors: { icon: Palette, label: "Colors", color: "text-pink-400" },
  composition: { icon: Layout, label: "Composition", color: "text-green-400" },
};

function getScoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-yellow-400";
  return "text-red-400";
}

function getScoreBadge(score: number): { variant: "default" | "secondary" | "destructive"; label: string } {
  if (score >= 8) return { variant: "default", label: "Great" };
  if (score >= 6) return { variant: "secondary", label: "Good" };
  return { variant: "destructive", label: "Needs Work" };
}

export function SetupCheckPanel({ videoRef, onClose }: SetupCheckPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SetupAnalysis | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const analyzeSetup = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const imageBase64 = captureFrame();
      if (!imageBase64) {
        toast.error("Could not capture video frame");
        setIsAnalyzing(false);
        return;
      }

      setCapturedImage(imageBase64);

      const { data, error } = await supabase.functions.invoke("analyze-setup", {
        body: { image_base64: imageBase64 },
      });

      if (error) {
        console.error("Setup analysis error:", error);
        toast.error(error.message || "Failed to analyze setup");
        setIsAnalyzing(false);
        return;
      }

      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast.success("Setup analyzed!");
      } else {
        toast.error("No analysis returned");
      }
    } catch (err) {
      console.error("Setup analysis failed:", err);
      toast.error("Failed to analyze setup");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="bg-[#1a1f2e] border-white/10 overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold text-white">AI Setup Check</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Captured Preview */}
        {capturedImage && (
          <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
            <img src={capturedImage} alt="Captured setup" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Analyze Button */}
        {!analysis && (
          <Button
            onClick={analyzeSetup}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing your setup...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Check My Setup
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {analysis && (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className={cn("text-4xl font-bold", getScoreColor(analysis.overall_score))}>
                  {analysis.overall_score}/10
                </div>
                <p className="text-white/70 text-sm mt-1">{analysis.summary}</p>
              </div>

              {/* Quick Wins */}
              {analysis.quick_wins && analysis.quick_wins.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-amber-400 text-sm">Quick Fixes</span>
                  </div>
                  <ul className="space-y-1">
                    {analysis.quick_wins.map((win, i) => (
                      <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        {win}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Category Breakdown */}
              <div className="space-y-3">
                {Object.entries(analysis.categories).map(([key, cat]) => {
                  if (!cat) return null;
                  const config = CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG];
                  if (!config) return null;
                  const Icon = config.icon;
                  const badge = getScoreBadge(cat.score);

                  return (
                    <div key={key} className="p-3 rounded-lg bg-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("w-4 h-4", config.color)} />
                          <span className="font-medium text-white">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-semibold", getScoreColor(cat.score))}>
                            {cat.score}/10
                          </span>
                          <Badge variant={badge.variant} className="text-xs">
                            {badge.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <Progress value={cat.score * 10} className="h-1.5" />
                      
                      <p className="text-sm text-white/70">{cat.feedback}</p>
                      
                      {cat.improvements && cat.improvements.length > 0 && (
                        <ul className="space-y-1 mt-2">
                          {cat.improvements.map((imp, i) => (
                            <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                              <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                              {imp}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Re-analyze Button */}
              <Button
                onClick={analyzeSetup}
                disabled={isAnalyzing}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-analyze Setup
              </Button>
            </div>
          </ScrollArea>
        )}

        {/* Tips when no analysis */}
        {!analysis && !isAnalyzing && (
          <div className="text-center text-white/50 text-sm p-4">
            <p>Get AI-powered feedback on your:</p>
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1"><Image className="w-3 h-3" /> Background</span>
              <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Lighting</span>
              <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> Colors</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
