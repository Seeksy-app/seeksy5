import { Badge } from "@/components/ui/badge";
import { Sparkles, Mic, Zap, Volume2, Sun, Clock, Layers, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ProcessingAnalyticsPanelProps {
  analytics: AnalyticsData;
  isLive?: boolean;
  variant?: 'processing' | 'summary';
}

const formatDuration = (seconds: number) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface AnalyticCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  color: string;
  bg?: string;
}

function AnalyticCard({ icon: Icon, label, value, unit, color, bg }: AnalyticCardProps) {
  return (
    <div className={cn(
      "p-3 rounded-xl border text-center transition-all",
      bg || "bg-card"
    )}>
      <Icon className={cn("h-5 w-5 mx-auto mb-1", color)} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{unit}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export function ProcessingAnalyticsPanel({ 
  analytics, 
  isLive = false, 
  variant = 'processing' 
}: ProcessingAnalyticsPanelProps) {
  const isSummary = variant === 'summary';
  const cardBg = isSummary ? 'bg-muted/30' : undefined;
  
  return (
    <div className={cn(
      "p-4 rounded-xl border",
      isSummary ? "bg-card" : "bg-muted/50"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-[#2C6BED]" />
        <h4 className="font-semibold">
          {isSummary ? 'Enhancement Summary' : 'AI Processing Analytics'}
        </h4>
        {isLive && (
          <Badge 
            variant="outline" 
            className="ml-auto text-xs animate-pulse" 
            style={{ borderColor: '#2C6BED', color: '#2C6BED' }}
          >
            Live
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <AnalyticCard 
          icon={Mic} 
          label="Filler Words" 
          value={analytics.fillerWordsRemoved} 
          unit="removed" 
          color={isSummary ? "text-green-600" : "text-orange-500"}
          bg={cardBg}
        />
        <AnalyticCard 
          icon={Zap} 
          label="Pauses" 
          value={analytics.pausesRemoved} 
          unit="trimmed" 
          color={isSummary ? "text-green-600" : "text-yellow-500"}
          bg={cardBg}
        />
        <AnalyticCard 
          icon={VolumeX} 
          label="Silences" 
          value={analytics.silencesTrimmed} 
          unit="cut" 
          color={isSummary ? "text-green-600" : "text-blue-500"}
          bg={cardBg}
        />
        <AnalyticCard 
          icon={Volume2} 
          label="Noise Reduced" 
          value={analytics.noiseReduced} 
          unit="%" 
          color={isSummary ? "text-blue-600" : "text-green-500"}
          bg={cardBg}
        />
        <AnalyticCard 
          icon={Clock} 
          label="Time Saved" 
          value={Math.round(analytics.totalTimeSaved)} 
          unit="sec" 
          color={isSummary ? "text-amber-600" : "text-purple-500"}
          bg={cardBg}
        />
        <AnalyticCard 
          icon={Layers} 
          label="Chapters" 
          value={analytics.chaptersDetected} 
          unit="detected" 
          color={isSummary ? "text-blue-600" : "text-pink-500"}
          bg={cardBg}
        />
      </div>
    </div>
  );
}

interface DurationComparisonBannerProps {
  originalDuration: number;
  finalDuration: number;
  totalTimeSaved: number;
}

export function DurationComparisonBanner({ 
  originalDuration, 
  finalDuration, 
  totalTimeSaved 
}: DurationComparisonBannerProps) {
  if (totalTimeSaved <= 0) return null;
  
  const percentImprovement = Math.round((totalTimeSaved / originalDuration) * 100);
  
  return (
    <div className="mt-4 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20 flex items-center justify-between">
      <span className="text-sm font-medium text-green-700 dark:text-green-400">
        Original: {formatDuration(originalDuration)} → Enhanced: {formatDuration(finalDuration)}
      </span>
      <Badge className="bg-green-500 text-white">
        {percentImprovement}% shorter
      </Badge>
    </div>
  );
}
