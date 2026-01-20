import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Loader2, CheckCircle, CloudUpload, AlertCircle } from "lucide-react";

export type RecordingStatus = 
  | "idle"
  | "recording"
  | "encoding"
  | "uploading"
  | "saved"
  | "failed";

interface RecordingStatusBarProps {
  status: RecordingStatus;
  duration?: number;
  sceneName?: string;
  errorMessage?: string;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function RecordingStatusBar({ 
  status, 
  duration = 0, 
  sceneName,
  errorMessage 
}: RecordingStatusBarProps) {
  if (status === "idle") return null;

  const statusConfig = {
    recording: {
      icon: (
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive"></span>
        </span>
      ),
      label: "⏺ Recording",
      color: "border-destructive bg-destructive/5",
      textColor: "text-destructive",
    },
    encoding: {
      icon: <Loader2 className="h-4 w-4 animate-spin text-amber-500" />,
      label: "⏳ Encoding video...",
      color: "border-amber-500 bg-amber-500/5",
      textColor: "text-amber-600",
    },
    uploading: {
      icon: <CloudUpload className="h-4 w-4 animate-pulse text-blue-500" />,
      label: "☁️ Uploading to Seeksy...",
      color: "border-blue-500 bg-blue-500/5",
      textColor: "text-blue-600",
    },
    saved: {
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      label: "✅ Saved to Library",
      color: "border-green-500 bg-green-500/5",
      textColor: "text-green-600",
    },
    failed: {
      icon: <AlertCircle className="h-4 w-4 text-destructive" />,
      label: "❌ Failed",
      color: "border-destructive bg-destructive/5",
      textColor: "text-destructive",
    },
  };

  const config = statusConfig[status];

  return (
    <Card className={`border-2 ${config.color}`}>
      <CardContent className="py-3">
        <div className="flex items-center gap-4">
          {config.icon}
          <span className={`font-bold ${config.textColor}`}>{config.label}</span>
          
          {status === "recording" && (
            <>
              <Badge variant="outline" className="font-mono text-base px-3 border-2">
                <Clock className="mr-2 h-4 w-4" />
                {formatDuration(duration)}
              </Badge>
              {sceneName && (
                <span className="text-muted-foreground">
                  {sceneName}
                </span>
              )}
            </>
          )}
          
          {status === "failed" && errorMessage && (
            <span className="text-sm text-muted-foreground">
              {errorMessage}
            </span>
          )}
          
          {(status === "encoding" || status === "uploading") && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className={`flex items-center gap-1 ${status === "encoding" ? "animate-pulse" : ""}`}>
                {status === "encoding" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                Encoding
              </span>
              <span>→</span>
              <span className={`flex items-center gap-1 ${status === "uploading" ? "animate-pulse" : ""}`}>
                {status === "uploading" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="h-3 w-3 rounded-full border border-muted-foreground" />
                )}
                Uploading
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 opacity-50">
                <span className="h-3 w-3 rounded-full border border-muted-foreground" />
                Saved
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
