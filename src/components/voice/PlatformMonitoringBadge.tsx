import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface PlatformMonitoringBadgeProps {
  platforms: string[];
}

export const PlatformMonitoringBadge = ({ platforms }: PlatformMonitoringBadgeProps) => {
  const platformEmojis: Record<string, string> = {
    youtube: '🎥',
    spotify: '🎵',
    tiktok: '📱',
    instagram: '📸',
    twitter: '🐦',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => (
        <Badge 
          key={platform}
          variant="outline" 
          className="gap-1.5 bg-background/50"
        >
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="text-base">{platformEmojis[platform.toLowerCase()] || '🌐'}</span>
          <span className="capitalize">{platform}</span>
        </Badge>
      ))}
    </div>
  );
};
