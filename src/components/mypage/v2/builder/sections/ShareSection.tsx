import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MyPageTheme } from "@/config/myPageThemes";
import { QrCode, Share2, Copy, MessageCircle, Eye } from "lucide-react";
import { ProfileQRCode } from "@/components/ProfileQRCode";
import { toast } from "sonner";

interface ShareSectionProps {
  theme: MyPageTheme;
}

export function ShareSection({ theme }: ShareSectionProps) {
  const profileUrl = `https://seeksy.io/${theme.username || "your-username"}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: theme.displayName || "My Seeksy Page",
          text: `Check out ${theme.displayName || "my"} page on Seeksy`,
          url: profileUrl,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const shareViaText = () => {
    const message = `Check out my Seeksy page: ${profileUrl}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`);
  };

  const openMyPage = () => {
    window.open(profileUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Share</h2>
        <p className="text-sm text-muted-foreground">Share your My Page with others</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Your Page URL</Label>
          <div className="mt-1.5 flex gap-2">
            <input
              type="text"
              value={profileUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-lg bg-muted"
            />
            <Button onClick={copyToClipboard} size="sm" className="gap-2">
              <Copy className="w-4 h-4" />
              Copy
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={copyToClipboard} size="lg" className="w-full gap-2">
            <Copy className="w-4 h-4" />
            Copy My Page Link
          </Button>
          <Button onClick={handleShare} variant="outline" className="w-full gap-2">
            <Share2 className="w-4 h-4" />
            Share via...
          </Button>
          <Button onClick={shareViaText} variant="outline" className="w-full gap-2">
            <MessageCircle className="w-4 h-4" />
            Share via Text Message
          </Button>
          <Button onClick={openMyPage} variant="ghost" className="w-full gap-2">
            <Eye className="w-4 h-4" />
            Open My Page
          </Button>
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-3">
            <QrCode className="w-4 h-4" />
            QR Code
          </Label>
          <div className="border rounded-xl p-6 bg-white">
            <ProfileQRCode username={theme.username || "your-username"} />
          </div>
        </div>

        <div className="p-4 border border-dashed rounded-xl bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">NFC Creator Card</p>
              <p className="text-xs text-muted-foreground mt-1">Coming Soon - Join the waitlist</p>
              <Button size="sm" variant="outline" className="mt-2">
                Join Waitlist
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
