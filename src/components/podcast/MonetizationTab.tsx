import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPodcastRevenue } from "@/lib/api/financialApis";
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Megaphone,
  FileText,
  Mic2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MonetizationTabProps {
  podcastId: string;
}

export const MonetizationTab = ({ podcastId }: MonetizationTabProps) => {
  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["podcast-revenue", podcastId],
    queryFn: () => getPodcastRevenue(podcastId),
  });

  const { data: episodes } = useQuery({
    queryKey: ["podcast-episodes-monetization", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*, ad_slots(*)")
        .eq("podcast_id", podcastId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["podcast-campaigns", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .limit(10)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const episodeRevenueData = revenue?.episodes?.map((ep, idx) => ({
    name: `Ep ${idx + 1}`,
    revenue: ep.revenue_amount,
  })).slice(0, 10) || [];

  if (revenueLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenue?.total_revenue?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">All-time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenue?.total_impressions?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Across all episodes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Reads</CardTitle>
            <Mic2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenue?.total_ad_reads || 0}</div>
            <p className="text-xs text-muted-foreground">Total ad placements</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown Chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Revenue by Episode</CardTitle>
          <CardDescription>Earnings breakdown across your podcast episodes</CardDescription>
        </CardHeader>
        <CardContent>
          {episodeRevenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={episodeRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
              <DollarSign className="w-12 h-12 mb-2 opacity-50" />
              <p>No revenue data available yet</p>
              <p className="text-sm">Publish episodes with ads to start tracking revenue</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ad Campaigns */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Ad Campaigns</CardTitle>
          <CardDescription>Active and completed advertising campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns && campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50 hover:bg-card transition-colors">
                  <div className="flex-1">
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.total_impressions?.toLocaleString() || 0} impressions • ${campaign.total_spent?.toFixed(2) || '0.00'} spent
                    </p>
                  </div>
                  <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="ml-4">
                    {campaign.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No campaigns yet</p>
              <p className="text-sm">Connect with advertisers to start monetizing</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ad Slots Management */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Slot Configuration</CardTitle>
          <CardDescription>Manage pre-roll, mid-roll, and end-roll ad placements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pre-roll Ads</p>
                <p className="text-sm text-muted-foreground">Play before episode content</p>
              </div>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mid-roll Ads</p>
                <p className="text-sm text-muted-foreground">Play during episode content</p>
              </div>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">End-roll Ads</p>
                <p className="text-sm text-muted-foreground">Play after episode content</p>
              </div>
              <Badge variant="outline">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Ad Tools */}
      <Card className="shadow-sm border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle>Voice Ad Tools</CardTitle>
          <CardDescription>Create and manage voice-powered advertisements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start hover:bg-primary/10 transition-colors">
            <FileText className="w-4 h-4 mr-2" />
            Voice Ad Script Generator
          </Button>
          <Button variant="outline" className="w-full justify-start hover:bg-primary/10 transition-colors">
            <Mic2 className="w-4 h-4 mr-2" />
            View Certified Voice Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
