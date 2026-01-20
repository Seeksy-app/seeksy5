import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Copy, Share2, MessageCircle, QrCode, X } from "lucide-react";
import { toast } from "sonner";

interface ShareMyPageDrawerProps {
  open: boolean;
  onClose: () => void;
  profileUrl: string;
  displayName: string;
}

export function ShareMyPageDrawer({ open, onClose, profileUrl, displayName }: ShareMyPageDrawerProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          text: `Check out ${displayName}'s page on Seeksy`,
          url: profileUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      copyToClipboard();
    }
  };

  const shareViaText = () => {
    const message = `Check out my Seeksy page: ${profileUrl}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`);
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Share My Page</DrawerTitle>
          <DrawerDescription>
            Share your profile with others
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Page URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-muted"
              />
              <Button onClick={copyToClipboard} size="sm" className="gap-2">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button onClick={shareViaText} variant="outline" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Text
            </Button>
          </div>

          <div className="p-4 border border-dashed rounded-xl bg-muted/30 text-center">
            <QrCode className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">QR Code</p>
            <p className="text-xs text-muted-foreground mt-1">Available in builder</p>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
