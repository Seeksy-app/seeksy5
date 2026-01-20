import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface ShareProfileButtonProps {
  username: string;
}

const ShareProfileButton = ({ username }: ShareProfileButtonProps) => {
  const { toast } = useToast();
  const profileUrl = `${window.location.origin}/${username}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: "Link copied!",
      description: "Your profile link has been copied to clipboard.",
    });
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Profile",
          url: profileUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share Profile
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Share your profile</h4>
            <p className="text-sm text-muted-foreground">
              Copy this link to share your page with others
            </p>
          </div>
          <div className="flex gap-2">
            <Input value={profileUrl} readOnly className="flex-1" />
            <Button size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {navigator.share && (
            <Button onClick={shareNative} className="w-full" variant="secondary">
              <Share2 className="h-4 w-4 mr-2" />
              Share via...
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareProfileButton;
