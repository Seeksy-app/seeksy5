import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Instagram, Youtube, Sparkles, ExternalLink, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

const socialPlatforms = [
  {
    id: "instagram",
    name: "Instagram",
    description: "Share Reels and Stories directly to your Instagram account",
    icon: Instagram,
    color: "from-purple-500 via-pink-500 to-orange-400",
    bgColor: "bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-400/10",
    borderColor: "border-pink-500/30",
    status: "coming_soon" as const,
    features: ["Reels", "Stories", "Feed Posts"]
  },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Publish clips directly to your TikTok profile",
    icon: TikTokIcon,
    color: "from-black to-gray-800",
    bgColor: "bg-gradient-to-br from-black/10 to-gray-800/10",
    borderColor: "border-gray-500/30",
    status: "coming_soon" as const,
    features: ["Video Posts", "Sounds", "Duets"]
  },
  {
    id: "youtube",
    name: "YouTube Shorts",
    description: "Upload Shorts directly to your YouTube channel",
    icon: Youtube,
    color: "from-red-500 to-red-600",
    bgColor: "bg-gradient-to-br from-red-500/10 to-red-600/10",
    borderColor: "border-red-500/30",
    status: "coming_soon" as const,
    features: ["Shorts", "Videos", "Community Posts"]
  }
];

export default function SocialConnections() {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const handleConnect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setShowComingSoon(true);
    console.log(`Attempted connection to: ${platformId}`);
  };

  const getPlatformById = (id: string) => socialPlatforms.find(p => p.id === id);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Social Media Connections</h1>
        </div>
        <p className="text-muted-foreground">
          Connect your social media accounts to publish clips directly from Seeksy
        </p>
      </div>

      <div className="grid gap-4">
        {socialPlatforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <Card 
              key={platform.id} 
              className={cn(
                "border-2 transition-all hover:shadow-md",
                platform.bgColor,
                platform.borderColor
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                      platform.color
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {platform.name}
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                          Coming Soon
                        </Badge>
                      </CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => handleConnect(platform.id)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {platform.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming Soon Dialog */}
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#053877] to-[#2C6BED] flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-xl">
              {selectedPlatform && getPlatformById(selectedPlatform)?.name} Integration Coming Soon!
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <p>
                Social media integrations are coming soon, but your UX is ready!
              </p>
              <p className="text-sm">
                You can already preview the publishing flow by clicking "Publish to Social" 
                on any of your generated clips.
              </p>
              <div className="pt-2">
                <Badge className="bg-gradient-to-r from-[#053877] to-[#2C6BED] text-white">
                  Demo Mode Available
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={() => setShowComingSoon(false)}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
