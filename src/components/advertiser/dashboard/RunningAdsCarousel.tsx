import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Play, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface RunningAd {
  id: string;
  title: string;
  thumbnailUrl?: string;
  creatorName: string;
  creatorAvatar?: string;
  impressions: number;
  status: "active" | "paused" | "pending";
  campaignName: string;
}

interface RunningAdsCarouselProps {
  ads: RunningAd[];
  onViewAd?: (adId: string) => void;
}

export function RunningAdsCarousel({ ads, onViewAd }: RunningAdsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getStatusColor = (status: RunningAd["status"]) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "paused": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "pending": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
  };

  if (ads.length === 0) {
    return (
      <Card className="p-6 bg-white/95 backdrop-blur">
        <h3 className="text-lg font-semibold text-[#053877] mb-4">Currently Running Ads</h3>
        <p className="text-muted-foreground text-center py-8">No ads currently running. Create a campaign to get started.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/95 backdrop-blur overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#053877]">Currently Running Ads</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll("left")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll("right")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="flex-shrink-0 w-[280px] snap-start"
          >
            <Card className="overflow-hidden border hover:shadow-lg transition-all">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200">
                {ad.thumbnailUrl ? (
                  <img src={ad.thumbnailUrl} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-12 h-12 text-slate-400" />
                  </div>
                )}
                <Badge className={cn("absolute top-2 right-2", getStatusColor(ad.status))}>
                  {ad.status}
                </Badge>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ad.creatorAvatar} />
                    <AvatarFallback className="bg-[#2C6BED]/10 text-[#2C6BED] text-xs">
                      {ad.creatorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ad.creatorName}</p>
                    <p className="text-xs text-muted-foreground truncate">{ad.campaignName}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>{ad.impressions.toLocaleString()}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => onViewAd?.(ad.id)}
                  >
                    View Ad
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </Card>
  );
}
