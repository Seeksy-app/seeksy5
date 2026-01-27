import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Youtube, ScanFace, Loader2, AlertCircle, Search, Filter, Instagram } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useInstagramConnect } from "@/hooks/useInstagramConnect";

interface FaceScanCardProps {
  userId: string;
  isFaceCertified: boolean;
  onScanComplete: () => void;
}

export function FaceScanCard({ userId, isFaceCertified, onScanComplete }: FaceScanCardProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const { connectInstagram, isConnecting } = useInstagramConnect();

  // Check for existing Instagram connection
  const { data: instagramConnection } = useQuery({
    queryKey: ['instagram-connection-face', userId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('social_media_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'instagram')
        .maybeSingle();
      return result.data as any;
    },
  });

  // Mock list of previously scanned channels for filter
  const scannedChannels = [
    { id: "all", name: "All Channels" },
    { id: "recent", name: "Recently Scanned" },
  ];

  const handleScanYouTube = async () => {
    if (!youtubeUrl.trim()) {
      toast.error("Please enter a YouTube video URL");
      return;
    }

    // Validate it's a video URL, not a channel
    const isVideoUrl = youtubeUrl.includes('watch?v=') || youtubeUrl.includes('youtu.be/');
    if (!isVideoUrl) {
      toast.error("Please enter a YouTube video URL (not a channel). Channel scanning coming soon!");
      return;
    }

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-face-youtube", {
        body: { 
          videoUrl: youtubeUrl.trim(),
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.matchFound) {
        toast.success(`Face match found in "${data.videoTitle}"!`, {
          description: `Confidence: ${Math.round((data.confidenceScore || 0) * 100)}%`
        });
        onScanComplete();
      } else {
        toast.info("No face match found in this video", {
          description: data?.matchDetails || "Try scanning a video where you appear more prominently"
        });
      }
    } catch (error) {
      console.error("Face scan error:", error);
      toast.error("Failed to scan video. Please check the URL and try again.");
    } finally {
      setIsScanning(false);
    }
  };

  if (!isFaceCertified) {
    return (
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ScanFace className="h-6 w-6 text-muted-foreground" />
            <div>
              <CardTitle className="text-muted-foreground">Scan for Face Appearances</CardTitle>
              <CardDescription>
                Certify your face first to enable video scanning
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to certify your face before you can scan videos for your appearances.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScanFace className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Scan for Face Appearances</CardTitle>
              <CardDescription>
                Find videos where your face appears using AI detection
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by channel" />
              </SelectTrigger>
              <SelectContent>
                {scannedChannels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            <span className="font-medium">YouTube Video</span>
            <Badge variant="outline" className="text-xs">Active</Badge>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Paste YouTube video URL (e.g., youtube.com/watch?v=...)"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleScanYouTube}
              disabled={isScanning || !youtubeUrl.trim()}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Scan
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="justify-start"
            onClick={connectInstagram}
            disabled={isConnecting}
          >
            <Instagram className="h-4 w-4 mr-2 text-pink-500" />
            {instagramConnection ? 'Scan Instagram' : 'Connect Instagram'}
            {isConnecting && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
          </Button>
          <div className="flex items-center gap-2 p-2 rounded border opacity-50">
            <div className="w-5 h-5 bg-foreground rounded" />
            <span className="text-sm">TikTok</span>
            <Badge variant="outline" className="text-xs ml-auto">Soon</Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Scans video thumbnails and frames to detect your face using AI matching
        </p>
      </CardContent>
    </Card>
  );
}
