import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Building2, 
  DollarSign, 
  Rocket, 
  Globe, 
  Shield,
  ChevronRight,
  RefreshCw,
  Star,
  ExternalLink
} from 'lucide-react';
import { useMarketIntelligenceInsights, useRefreshAllSources, type MarketIntelligenceInsight } from '@/hooks/useMarketIntelligence';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const insightTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  competitor_move: { icon: Building2, color: 'bg-red-500/10 text-red-500', label: 'Competitor' },
  market_trend: { icon: TrendingUp, color: 'bg-blue-500/10 text-blue-500', label: 'Trend' },
  pricing_update: { icon: DollarSign, color: 'bg-green-500/10 text-green-500', label: 'Pricing' },
  funding_announcement: { icon: DollarSign, color: 'bg-purple-500/10 text-purple-500', label: 'Funding' },
  product_launch: { icon: Rocket, color: 'bg-orange-500/10 text-orange-500', label: 'Launch' },
  industry_shift: { icon: Globe, color: 'bg-cyan-500/10 text-cyan-500', label: 'Industry' },
  regulatory_change: { icon: Shield, color: 'bg-yellow-500/10 text-yellow-500', label: 'Regulatory' },
};

interface MarketIntelligenceWidgetProps {
  audience?: 'ceo' | 'cfo' | 'board';
  title?: string;
  limit?: number;
  showRefresh?: boolean;
  compact?: boolean;
  className?: string;
}

export function MarketIntelligenceWidget({ 
  audience,
  title = 'Market Intelligence',
  limit = 5,
  showRefresh = true,
  compact = false,
  className
}: MarketIntelligenceWidgetProps) {
  const { data: insights, isLoading, refetch } = useMarketIntelligenceInsights({ 
    audience, 
    limit 
  });
  const refreshAll = useRefreshAllSources();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRefresh = async () => {
    await refreshAll.mutateAsync();
    refetch();
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {showRefresh && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshAll.isPending}
          >
            <RefreshCw className={cn("h-4 w-4", refreshAll.isPending && "animate-spin")} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!insights || insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No insights yet</p>
            <p className="text-xs mt-1">Click refresh to fetch latest intelligence</p>
          </div>
        ) : (
          <ScrollArea className={compact ? "h-[200px]" : "h-[300px]"}>
            <div className="space-y-3">
              {insights.map((insight) => (
                <InsightCard 
                  key={insight.id} 
                  insight={insight} 
                  compact={compact}
                  expanded={expandedId === insight.id}
                  onToggle={() => setExpandedId(expandedId === insight.id ? null : insight.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function InsightCard({ 
  insight, 
  compact, 
  expanded, 
  onToggle 
}: { 
  insight: MarketIntelligenceInsight; 
  compact: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const config = insightTypeConfig[insight.insight_type] || insightTypeConfig.market_trend;
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "border rounded-lg p-3 transition-all cursor-pointer hover:bg-accent/50",
        expanded && "bg-accent/30"
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">
              {config.label}
            </Badge>
            {insight.is_featured && (
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
            </span>
          </div>
          <h4 className="font-medium text-sm line-clamp-2">{insight.title}</h4>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {insight.summary}
            </p>
          )}
          
          {expanded && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-muted-foreground">{insight.summary}</p>
              {insight.key_points && insight.key_points.length > 0 && (
                <ul className="text-xs space-y-1">
                  {insight.key_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
              {insight.source_url && (
                <a 
                  href={insight.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  View source
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
