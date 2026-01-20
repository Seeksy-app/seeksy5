import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Instagram, 
  Youtube, 
  Check, 
  Copy, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  Sparkles,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

interface SocialPublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clip: {
    id: string;
    title: string;
    thumbnail_url?: string | null;
    file_url?: string | null;
    duration_seconds?: number | null;
    aspect_ratio?: string;
  } | null;
}

type Platform = "instagram" | "tiktok" | "youtube";
type Step = "select" | "edit" | "publishing" | "success";

const platforms = [
  {
    id: "instagram" as Platform,
    name: "Instagram Reels",
    icon: Instagram,
    color: "from-purple-500 via-pink-500 to-orange-400",
    format: "9:16",
    bgColor: "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-400/10",
    borderColor: "border-pink-500/30"
  },
  {
    id: "tiktok" as Platform,
    name: "TikTok",
    icon: TikTokIcon,
    color: "from-black to-gray-800",
    format: "9:16",
    bgColor: "bg-gradient-to-br from-black/10 to-gray-800/10",
    borderColor: "border-gray-500/30"
  },
  {
    id: "youtube" as Platform,
    name: "YouTube Shorts",
    icon: Youtube,
    color: "from-red-500 to-red-600",
    format: "9:16",
    bgColor: "bg-gradient-to-br from-red-500/10 to-red-600/10",
    borderColor: "border-red-500/30"
  }
];

const suggestedHashtags = [
  "#seeksy",
  "#podcastclips",
  "#creatoreconomy",
  "#contentcreator",
  "#viral",
  "#trending"
];

export function SocialPublishModal({ open, onOpenChange, clip }: SocialPublishModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(["#seeksy", "#podcastclips"]);
  const [publishingStep, setPublishingStep] = useState(0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep("select");
      setSelectedPlatform(null);
      setCaption(clip?.title || "Check out this clip! 🎬");
      setSelectedHashtags(["#seeksy", "#podcastclips"]);
      setPublishingStep(0);
    }
  }, [open, clip]);

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    setStep("edit");
  };

  const handleBack = () => {
    if (step === "edit") {
      setStep("select");
      setSelectedPlatform(null);
    }
  };

  const toggleHashtag = (tag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handlePublish = () => {
    setStep("publishing");
    
    // Simulate publishing progress
    const steps = [
      { delay: 800, step: 1 },
      { delay: 1600, step: 2 },
      { delay: 2400, step: 3 }
    ];

    steps.forEach(({ delay, step }) => {
      setTimeout(() => setPublishingStep(step), delay);
    });

    // Complete after all steps
    setTimeout(() => {
      setStep("success");
      console.log(`Simulated publish to ${selectedPlatform}:`, {
        clipId: clip?.id,
        caption,
        hashtags: selectedHashtags,
        platform: selectedPlatform
      });
    }, 3200);
  };

  const handleCopyLink = () => {
    const mockLink = `https://${selectedPlatform}.com/reel/mock-${clip?.id?.slice(0, 8)}`;
    navigator.clipboard.writeText(mockLink);
    toast.success("Link copied to clipboard!");
  };

  const getPlatformInfo = () => platforms.find(p => p.id === selectedPlatform);

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "select" && (
              <>
                <Sparkles className="h-5 w-5 text-primary" />
                Publish Clip to Social Media
              </>
            )}
            {step === "edit" && (
              <>
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Publish to {getPlatformInfo()?.name}
              </>
            )}
            {step === "publishing" && "Publishing Your Clip..."}
            {step === "success" && (
              <>
                <Check className="h-5 w-5 text-green-500" />
                Published Successfully!
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Platform Selection */}
        {step === "select" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Choose where you'd like to share your clip
            </p>
            <div className="grid grid-cols-3 gap-4">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <Card
                    key={platform.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2",
                      platform.bgColor,
                      platform.borderColor
                    )}
                    onClick={() => handlePlatformSelect(platform.id)}
                  >
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                        platform.color
                      )}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{platform.name}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {platform.format}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Edit Caption & Preview */}
        {step === "edit" && (
          <div className="grid md:grid-cols-2 gap-6 py-4">
            {/* Left: Preview */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Preview</p>
              <div className="aspect-[9/16] bg-muted rounded-lg overflow-hidden relative max-h-[300px]">
                {clip?.thumbnail_url ? (
                  <img 
                    src={clip.thumbnail_url} 
                    alt={clip.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Sparkles className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2">
                  <Badge variant="secondary" className="bg-black/60 text-white">
                    {formatDuration(clip?.duration_seconds)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">9:16 Vertical</Badge>
                <span>Optimized for {getPlatformInfo()?.name}</span>
              </div>
            </div>

            {/* Right: Caption Editor */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Caption</label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {caption.length}/2200 characters
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Hashtags</label>
                <div className="flex flex-wrap gap-2">
                  {suggestedHashtags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedHashtags.includes(tag) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedHashtags.includes(tag) 
                          ? "bg-primary hover:bg-primary/90" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleHashtag(tag)}
                    >
                      {tag}
                      {selectedHashtags.includes(tag) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full mt-4" 
                size="lg"
                onClick={handlePublish}
              >
                Publish Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Publishing Progress */}
        {step === "publishing" && (
          <div className="py-8 space-y-6">
            <div className="flex justify-center">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br",
                getPlatformInfo()?.color
              )}>
                {(() => {
                  const Icon = getPlatformInfo()?.icon;
                  return Icon ? <Icon className="h-8 w-8 text-white" /> : null;
                })()}
              </div>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              {[
                { step: 1, label: "Preparing upload..." },
                { step: 2, label: `Connecting to ${getPlatformInfo()?.name}...` },
                { step: 3, label: "Publishing clip..." }
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    publishingStep >= item.step 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {publishingStep > item.step ? (
                      <Check className="h-4 w-4" />
                    ) : publishingStep === item.step ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs">{item.step}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm transition-all",
                    publishingStep >= item.step ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="py-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">
                🎉 Your clip has been successfully published!
              </h3>
              <p className="text-muted-foreground">
                Your clip is now live on {getPlatformInfo()?.name}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                View in Media Library
              </Button>
              <Button variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Social Link
              </Button>
              <Button onClick={() => {
                setStep("select");
                setSelectedPlatform(null);
              }}>
                Publish Another Clip
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
