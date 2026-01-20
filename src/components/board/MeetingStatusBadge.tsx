import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, Sparkles, CheckCircle, Clock, Play } from "lucide-react";

export type MeetingStatus = 
  | "upcoming" 
  | "active" 
  | "completed" 
  | "capturing" 
  | "generating";

interface MeetingStatusBadgeProps {
  status: string;
  isCapturingAudio?: boolean;
  isGeneratingNotes?: boolean;
  className?: string;
}

export function MeetingStatusBadge({ 
  status, 
  isCapturingAudio = false,
  isGeneratingNotes = false,
  className = "" 
}: MeetingStatusBadgeProps) {
  // Determine effective status based on live state
  const effectiveStatus = isGeneratingNotes 
    ? "generating" 
    : isCapturingAudio 
      ? "capturing" 
      : status;

  const config = {
    upcoming: {
      label: "Upcoming",
      icon: <Clock className="h-3 w-3" />,
      className: "bg-muted text-muted-foreground border-muted-foreground/20",
    },
    active: {
      label: "Active",
      icon: <Play className="h-3 w-3" />,
      className: "bg-green-500/10 text-green-600 border-green-500/30",
    },
    completed: {
      label: "Completed",
      icon: <CheckCircle className="h-3 w-3" />,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    },
    capturing: {
      label: "AI Notes Active",
      icon: <Mic className="h-3 w-3 animate-pulse" />,
      className: "bg-green-500/10 text-green-600 border-green-500/30 animate-pulse",
    },
    generating: {
      label: "Generating Notes",
      icon: <Sparkles className="h-3 w-3 animate-spin" />,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    },
  };

  const statusConfig = config[effectiveStatus as keyof typeof config] || config.upcoming;

  return (
    <Badge 
      variant="outline" 
      className={`gap-1.5 ${statusConfig.className} ${className}`}
    >
      {statusConfig.icon}
      {statusConfig.label}
    </Badge>
  );
}
