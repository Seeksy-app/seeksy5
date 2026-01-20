import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Check, Download, FileText, Layers, Type, Scissors, 
  Eye, FolderOpen, Share2, ChevronRight, Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProcessingAnalyticsPanel, DurationComparisonBanner } from "./ProcessingAnalyticsPanel";

interface AnalyticsData {
  fillerWordsRemoved: number;
  pausesRemoved: number;
  silencesTrimmed: number;
  noiseReduced: number;
  totalTimeSaved: number;
  chaptersDetected: number;
  originalDuration: number;
  finalDuration: number;
}

interface DownloadAssets {
  enhancedVideoUrl?: string | null;
  transcriptUrl?: string | null;
  chaptersJsonUrl?: string | null;
  srtUrl?: string | null;
}

interface CompletionSuccessPageProps {
  mediaId: string;
  mediaName: string;
  analytics: AnalyticsData;
  onCompareClick: () => void;
  hasOriginalPreview?: boolean;
  downloadAssets?: DownloadAssets;
}

export function CompletionSuccessPage({
  mediaId,
  mediaName,
  analytics,
  onCompareClick,
  hasOriginalPreview = true,
  downloadAssets
}: CompletionSuccessPageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/studio/media/${mediaId}`);
    toast({
      title: "Link Copied",
      description: "Shareable link copied to clipboard"
    });
  };

  const handleDownload = (type: 'video' | 'transcript' | 'chapters' | 'srt', url?: string | null) => {
    if (!url) {
      toast({
        title: "Not Available",
        description: "This file isn't available yet. Try re-running AI Post-Production.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Download Started",
      description: `Your ${type} download has started.`
    });
    window.open(url, "_blank");
  };

  const downloadButtons = [
    {
      type: 'video' as const,
      icon: Download,
      label: 'Enhanced Video',
      url: downloadAssets?.enhancedVideoUrl,
      tooltip: 'Download the final enhanced video file with all edits applied.',
      disabledTooltip: "This file isn't available yet. Try re-running AI Post-Production."
    },
    {
      type: 'transcript' as const,
      icon: FileText,
      label: 'Transcript',
      url: downloadAssets?.transcriptUrl,
      tooltip: 'Download a full text transcript for blogs, show notes, or editing.',
      disabledTooltip: "This file isn't available yet. Try re-running AI Post-Production."
    },
    {
      type: 'chapters' as const,
      icon: Layers,
      label: 'Chapters JSON',
      url: downloadAssets?.chaptersJsonUrl,
      tooltip: 'Download structured chapter data (JSON) for players, show notes, or custom apps.',
      disabledTooltip: "This file isn't available yet. Try re-running AI Post-Production."
    },
    {
      type: 'srt' as const,
      icon: Type,
      label: 'SRT Captions',
      url: downloadAssets?.srtUrl,
      tooltip: 'Download a standard SRT subtitle file for captions on YouTube, TikTok, Instagram, etc.',
      disabledTooltip: "This file isn't available yet. Try re-running AI Post-Production."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div 
        className="p-6 rounded-xl text-white"
        style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">🎉 Your Video Has Been Successfully Enhanced</h2>
            <p className="text-white/80 mt-1">
              Your enhanced content is ready. Choose what you'd like to do next.
            </p>
          </div>
        </div>
      </div>

      {/* Enhancement Summary */}
      <Card>
        <CardContent className="pt-6">
          <ProcessingAnalyticsPanel 
            analytics={analytics} 
            variant="summary" 
          />
          <DurationComparisonBanner 
            originalDuration={analytics.originalDuration}
            finalDuration={analytics.finalDuration}
            totalTimeSaved={analytics.totalTimeSaved}
          />
        </CardContent>
      </Card>

      {/* Download Your Files */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-[#2C6BED]" />
            Download Your Files
          </h3>
          <TooltipProvider>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {downloadButtons.map((btn) => {
                const Icon = btn.icon;
                const isDisabled = !btn.url;
                
                return (
                  <Tooltip key={btn.type}>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`h-auto py-4 flex-col gap-2 transition-all ${
                          isDisabled 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:border-[#2C6BED] hover:bg-[#2C6BED]/5'
                        }`}
                        onClick={() => handleDownload(btn.type, btn.url)}
                        disabled={isDisabled}
                      >
                        <Icon className={`h-6 w-6 ${isDisabled ? 'text-muted-foreground' : 'text-[#2C6BED]'}`} />
                        <span className="text-sm font-medium">{btn.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                      <p className="text-xs">{isDisabled ? btn.disabledTooltip : btn.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Next Steps</h3>
          <div className="space-y-3">
            {/* Primary CTA - Generate Clips */}
            <Button 
              className="w-full justify-between h-auto py-4 text-white group"
              style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
              onClick={() => navigate(`/studio/clips?media=${mediaId}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Scissors className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">✂️ Generate AI Clips from This Video</div>
                  <div className="text-xs text-white/70">Create viral short clips automatically</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            {/* Secondary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 gap-3"
                onClick={onCompareClick}
              >
                <Eye className="h-5 w-5 text-[#2C6BED]" />
                <div className="text-left">
                  <div className="font-medium">Compare Original vs Enhanced</div>
                  {!hasOriginalPreview && (
                    <div className="text-xs text-muted-foreground">Original not available for import</div>
                  )}
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 gap-3"
                onClick={() => navigate(`/studio/enhanced/${mediaId}`)}
              >
                <FolderOpen className="h-5 w-5 text-[#2C6BED]" />
                <div className="text-left">
                  <div className="font-medium">View Full Details</div>
                  <div className="text-xs text-muted-foreground">Analytics, downloads & sharing</div>
                </div>
              </Button>
            </div>
            
            {/* Share/Copy Link */}
            <Button 
              variant="ghost" 
              className="w-full justify-between text-muted-foreground hover:text-foreground"
              onClick={handleCopyLink}
            >
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span>Share or Copy Link</span>
              </div>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
