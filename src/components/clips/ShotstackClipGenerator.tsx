import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useShotstackClips } from "@/hooks/useShotstackClips";
import { Loader2, Check, X } from "lucide-react";

/**
 * Example component showing how to use Shotstack for clip generation
 * 
 * Usage:
 * 1. User selects a video and defines start/end times
 * 2. Click "Generate Clip" to submit to Shotstack
 * 3. Component polls for completion and displays final video
 */

interface ShotstackClipGeneratorProps {
  clipId: string;
  cloudflareDownloadUrl: string;
  duration: number;
  onComplete?: (videoUrl: string) => void;
}

export const ShotstackClipGenerator = ({
  clipId,
  cloudflareDownloadUrl,
  duration,
  onComplete,
}: ShotstackClipGeneratorProps) => {
  const { submitShotstackRender, pollClipStatus, isProcessing } = useShotstackClips();
  const [status, setStatus] = useState<string>("pending");
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateClip = async () => {
    try {
      setError(null);
      setStatus("submitting");

      // Submit render job
      const result = await submitShotstackRender({
        clipId,
        cloudflareDownloadUrl,
        length: duration,
        orientation: "vertical", // 9:16 for social media
      });

      console.log("Shotstack job submitted:", result);
      setStatus("rendering");

      // Poll for completion
      const completedClip = await pollClipStatus(
        clipId,
        (currentStatus) => {
          console.log("Status update:", currentStatus);
          setStatus(currentStatus);
        },
        60, // Poll for up to 5 minutes (60 attempts × 5s)
        5000 // Poll every 5 seconds
      );

      // Render complete
      setFinalUrl(completedClip.vertical_url);
      setStatus("ready");

      if (onComplete) {
        onComplete(completedClip.vertical_url);
      }

    } catch (err) {
      console.error("Clip generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to generate clip");
      setStatus("failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Vertical Clip (9:16)</CardTitle>
        <CardDescription>
          Create a vertical clip optimized for Instagram Reels, TikTok, and YouTube Shorts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center gap-2">
          {status === "pending" && <div className="text-muted-foreground">Ready to generate</div>}
          
          {(status === "submitting" || status === "processing" || status === "rendering") && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">
                {status === "submitting" && "Submitting render job..."}
                {status === "processing" && "Processing..."}
                {status === "rendering" && "Rendering video..."}
              </span>
            </>
          )}

          {status === "ready" && (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-green-500">Render complete!</span>
            </>
          )}

          {status === "failed" && (
            <>
              <X className="h-4 w-4 text-destructive" />
              <span className="text-destructive">Render failed</span>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Generate Button */}
        {status === "pending" && (
          <Button
            onClick={handleGenerateClip}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Vertical Clip"
            )}
          </Button>
        )}

        {/* Final Video Preview */}
        {finalUrl && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Final Video:</div>
            <video
              src={finalUrl}
              controls
              className="w-full rounded-md"
              style={{ aspectRatio: "9/16", maxHeight: "600px" }}
            />
            <Button
              variant="outline"
              onClick={() => window.open(finalUrl, "_blank")}
              className="w-full"
            >
              Open in New Tab
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <strong>Technical Details:</strong>
          <ul className="mt-1 space-y-1">
            <li>• Output: 1080x1920 (9:16 aspect ratio)</li>
            <li>• Format: MP4</li>
            <li>• Duration: {duration}s</li>
            <li>• Processing: Shotstack Edit API</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
