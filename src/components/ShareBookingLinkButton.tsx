import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareBookingLinkButtonProps {
  username: string;
}

const ShareBookingLinkButton = ({ username }: ShareBookingLinkButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const bookingUrl = `${window.location.origin}/book/${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Link copied!",
        description: "Your booking page link has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Book a meeting with me",
          text: "Schedule a meeting at a time that works for you",
          url: bookingUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleCopy}
        className="flex-1"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copy Booking Link
          </>
        )}
      </Button>
      
      {navigator.share && (
        <Button
          variant="outline"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ShareBookingLinkButton;
