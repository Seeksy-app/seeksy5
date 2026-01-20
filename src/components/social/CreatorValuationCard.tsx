import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, RefreshCw, TrendingUp, Users, AlertCircle } from "lucide-react";
import { useCreatorValuation, useCalculateValuation } from "@/hooks/useCreatorValuation";
import { formatDistanceToNow } from "date-fns";

interface CreatorValuationCardProps {
  profileId: string;
  platform?: "instagram" | "youtube" | "facebook";
}

// Content type labels per platform
const CONTENT_TYPE_LABELS: Record<string, { slot1: string; slot2: string; slot3: string }> = {
  instagram: {
    slot1: "Reel",
    slot2: "Feed Post",
    slot3: "Story",
  },
  youtube: {
    slot1: "Dedicated Video",
    slot2: "Integration",
    slot3: "Short",
  },
  facebook: {
    slot1: "Video",
    slot2: "Feed Post",
    slot3: "Story",
  },
};

// Gradient colors per platform
const PLATFORM_GRADIENTS: Record<string, { slot1: string; slot2: string; slot3: string }> = {
  instagram: {
    slot1: "from-purple-500/10 to-pink-500/10",
    slot2: "from-blue-500/10 to-cyan-500/10",
    slot3: "from-orange-500/10 to-yellow-500/10",
  },
  youtube: {
    slot1: "from-red-500/10 to-orange-500/10",
    slot2: "from-red-400/10 to-pink-400/10",
    slot3: "from-red-300/10 to-yellow-300/10",
  },
  facebook: {
    slot1: "from-blue-600/10 to-indigo-500/10",
    slot2: "from-blue-500/10 to-blue-400/10",
    slot3: "from-blue-400/10 to-cyan-400/10",
  },
};

export function CreatorValuationCard({ profileId, platform = "instagram" }: CreatorValuationCardProps) {
  const { data: valuation, isLoading } = useCreatorValuation(profileId);
  const { calculateValuation, isCalculating } = useCalculateValuation();

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    return `$${price.toFixed(0)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const labels = CONTENT_TYPE_LABELS[platform] || CONTENT_TYPE_LABELS.instagram;
  const gradients = PLATFORM_GRADIENTS[platform] || PLATFORM_GRADIENTS.instagram;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Your Worth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!valuation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Know Your Worth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Calculate your estimated rates for sponsored content based on your engagement and reach.
          </p>
          <Button 
            onClick={() => calculateValuation(profileId)}
            disabled={isCalculating}
            className="w-full"
          >
            {isCalculating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Calculate My Value
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if using default engagement (no real post data)
  const usingDefault = valuation.assumptions_json?.using_default_engagement;
  const postsAnalyzed = valuation.assumptions_json?.posts_analyzed || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <DollarSign className="h-5 w-5 text-green-500" />
            Your Worth
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => calculateValuation(profileId)}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Recalculate
              </>
            )}
          </Button>
        </div>
        {valuation.calculated_at && (
          <p className="text-xs text-muted-foreground">
            Last updated {formatDistanceToNow(new Date(valuation.calculated_at), { addSuffix: true })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning banner if using estimated engagement */}
        {usingDefault && (
          <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Estimated rates based on industry averages. Sync your posts for more accurate pricing.
            </p>
          </div>
        )}

        {/* Price Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`bg-gradient-to-br ${gradients.slot1} rounded-lg p-3 text-center`}>
            <p className="text-xs text-muted-foreground mb-1">{labels.slot1}</p>
            <p className="text-lg font-bold">{formatPrice(valuation.reel_price_mid)}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatPrice(valuation.reel_price_low)} - {formatPrice(valuation.reel_price_high)}
            </p>
          </div>
          <div className={`bg-gradient-to-br ${gradients.slot2} rounded-lg p-3 text-center`}>
            <p className="text-xs text-muted-foreground mb-1">{labels.slot2}</p>
            <p className="text-lg font-bold">{formatPrice(valuation.feed_post_price_mid)}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatPrice(valuation.feed_post_price_low)} - {formatPrice(valuation.feed_post_price_high)}
            </p>
          </div>
          <div className={`bg-gradient-to-br ${gradients.slot3} rounded-lg p-3 text-center`}>
            <p className="text-xs text-muted-foreground mb-1">{labels.slot3}</p>
            <p className="text-lg font-bold">{formatPrice(valuation.story_price_mid)}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatPrice(valuation.story_price_low)} - {formatPrice(valuation.story_price_high)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              <span className="text-xs">
                {platform === "youtube" ? "Subscribers" : platform === "facebook" ? "Fans" : "Followers"}
              </span>
            </div>
            <p className="font-semibold">{formatNumber(valuation.followers)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Engagement</span>
            </div>
            <p className="font-semibold">{valuation.engagement_rate.toFixed(2)}%</p>
            {usingDefault && <p className="text-[10px] text-yellow-600">(estimated)</p>}
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <span className="text-xs">Posts Analyzed</span>
            </div>
            <p className="font-semibold">{postsAnalyzed}</p>
          </div>
        </div>

        {/* Niche Tags */}
        {valuation.assumptions_json?.niche_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {valuation.assumptions_json.niche_tags.map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {valuation.assumptions_json.niche_multiplier > 1 && (
              <Badge variant="outline" className="text-xs text-green-600">
                {valuation.assumptions_json.niche_multiplier}x niche boost
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
