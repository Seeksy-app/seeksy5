import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Star, Plus } from "lucide-react";

interface Influencer {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  performanceScore: number;
  engagementRate: number;
  followers: number;
  niche?: string;
}

interface TopInfluencersCarouselProps {
  influencers: Influencer[];
  onAddToCampaign?: (influencerId: string) => void;
}

export function TopInfluencersCarousel({ influencers, onAddToCampaign }: TopInfluencersCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 220;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-amber-600";
    return "text-slate-600";
  };

  if (influencers.length === 0) {
    return (
      <Card className="p-6 bg-white/95 backdrop-blur">
        <h3 className="text-lg font-semibold text-[#053877] mb-4">Top Influencers</h3>
        <p className="text-muted-foreground text-center py-8">No influencers available yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/95 backdrop-blur overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#053877]">Top Influencers For You</h3>
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
        {influencers.map((influencer) => (
          <div
            key={influencer.id}
            className="flex-shrink-0 w-[200px] snap-start"
          >
            <Card className="p-4 text-center hover:shadow-lg transition-all border">
              <Avatar className="h-16 w-16 mx-auto mb-3 ring-2 ring-[#2C6BED]/20">
                <AvatarImage src={influencer.avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-[#2C6BED] to-[#053877] text-white text-lg">
                  {influencer.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <h4 className="font-semibold text-sm truncate">{influencer.name}</h4>
              <p className="text-xs text-muted-foreground mb-2">@{influencer.handle}</p>

              {influencer.niche && (
                <span className="inline-block px-2 py-0.5 bg-[#2C6BED]/10 text-[#2C6BED] text-xs rounded-full mb-2">
                  {influencer.niche}
                </span>
              )}

              <div className="flex items-center justify-center gap-1 mb-3">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className={`font-bold text-sm ${getScoreColor(influencer.performanceScore)}`}>
                  {influencer.performanceScore}
                </span>
                <span className="text-xs text-muted-foreground">score</span>
              </div>

              <div className="text-xs text-muted-foreground mb-3">
                <span>{(influencer.followers / 1000).toFixed(1)}K followers</span>
                <span className="mx-1">•</span>
                <span>{influencer.engagementRate}% eng.</span>
              </div>

              <Button
                size="sm"
                className="w-full bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-xs"
                onClick={() => onAddToCampaign?.(influencer.id)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add to Campaign
              </Button>
            </Card>
          </div>
        ))}
      </div>
    </Card>
  );
}
