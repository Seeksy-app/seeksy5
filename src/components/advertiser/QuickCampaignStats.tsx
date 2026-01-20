import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Users, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface QuickCampaignStatsProps {
  campaignId: string;
}

export function QuickCampaignStats({ campaignId }: QuickCampaignStatsProps) {
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ["quick-campaign", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(`
          *,
          audio_ads (
            id,
            script,
            campaign_name
          )
        `)
        .eq("id", campaignId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: impressions, isLoading: impressionsLoading } = useQuery({
    queryKey: ["campaign-impressions", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_impressions")
        .select(`
          id,
          created_at,
          creator_id,
          profiles:creator_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Group impressions by creator
  const creatorImpressions = impressions?.reduce((acc, impression) => {
    const creatorId = impression.creator_id;
    if (!acc[creatorId]) {
      acc[creatorId] = {
        count: 0,
        profile: impression.profiles,
      };
    }
    acc[creatorId].count++;
    return acc;
  }, {} as Record<string, { count: number; profile: any }>);

  const topCreators = Object.entries(creatorImpressions || {})
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5);

  if (campaignLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">Loading campaign stats...</p>
        </CardContent>
      </Card>
    );
  }

  if (!campaign || campaign.campaign_type !== 'quick') {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Quick Campaign Performance</CardTitle>
              <CardDescription>Real-time distribution stats</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Impressions</p>
              </div>
              <p className="text-2xl font-bold">{impressions?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">
                of {campaign.max_impressions?.toLocaleString() || 'unlimited'}
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Active Creators</p>
              </div>
              <p className="text-2xl font-bold">{Object.keys(creatorImpressions || {}).length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                showing your ad
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Avg per Creator</p>
              </div>
              <p className="text-2xl font-bold">
                {Object.keys(creatorImpressions || {}).length > 0
                  ? Math.round((impressions?.length || 0) / Object.keys(creatorImpressions || {}).length)
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                impressions
              </p>
            </div>
          </div>

          {/* Top Creators */}
          {topCreators.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Top Performing Creators</h4>
              <div className="space-y-2">
                {topCreators.map(([creatorId, data]) => (
                  <div
                    key={creatorId}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={data.profile?.avatar_url} />
                        <AvatarFallback>
                          {data.profile?.full_name?.[0] || data.profile?.username?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {data.profile?.full_name || data.profile?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">@{data.profile?.username}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{data.count} impressions</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Categories */}
          {campaign.targeting_rules && typeof campaign.targeting_rules === 'object' && 
           'categories' in campaign.targeting_rules && 
           Array.isArray(campaign.targeting_rules.categories) && 
           campaign.targeting_rules.categories.length > 0 && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Targeting Categories</p>
              <div className="flex flex-wrap gap-2">
                {(campaign.targeting_rules.categories as string[]).map((category: string) => (
                  <Badge key={category} variant="outline" className="capitalize">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}