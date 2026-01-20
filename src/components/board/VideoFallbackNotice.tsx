import { AlertTriangle, Mic, FileText, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VideoFallbackNoticeProps {
  onAudioOnlyMode?: () => void;
  onNotesOnlyMode?: () => void;
  onRetry?: () => void;
  hasAudioSupport?: boolean;
}

export function VideoFallbackNotice({
  onAudioOnlyMode,
  onNotesOnlyMode,
  onRetry,
  hasAudioSupport = true,
}: VideoFallbackNoticeProps) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
              Video Temporarily Unavailable
              <Badge variant="outline" className="text-xs">
                Network Issue
              </Badge>
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              The video service is currently unreachable. This may be due to network restrictions 
              or temporary service issues. You can still run this meeting using alternative modes.
            </p>
            
            <div className="flex flex-wrap gap-3">
              {hasAudioSupport && onAudioOnlyMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAudioOnlyMode}
                  className="gap-2 border-amber-300 hover:bg-amber-100 dark:border-amber-700"
                >
                  <Mic className="h-4 w-4" />
                  Audio-Only Mode
                </Button>
              )}
              
              {onNotesOnlyMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNotesOnlyMode}
                  className="gap-2 border-amber-300 hover:bg-amber-100 dark:border-amber-700"
                >
                  <FileText className="h-4 w-4" />
                  Notes-Only Mode
                </Button>
              )}
              
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <Video className="h-4 w-4" />
                  Retry Video
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
