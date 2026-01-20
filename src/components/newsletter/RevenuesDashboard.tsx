import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  MousePointer, 
  Eye, 
  PieChart,
  BarChart3,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface RevenueStats {
  totalGross: number;
  totalCreatorShare: number;
  totalPlatformFee: number;
  totalImpressions: number;
  totalClicks: number;
  byType: {
    cpm: number;
    cpc: number;
    flat_rate: number;
  };
}

export function RevenuesDashboard() {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["newsletter-revenue"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("newsletter_revenue")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ["newsletter-campaigns-with-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("id, title, recipient_count, sent_at")
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate stats
  const stats: RevenueStats = {
    totalGross: revenueData?.reduce((sum, r) => sum + Number(r.gross_amount), 0) || 0,
    totalCreatorShare: revenueData?.reduce((sum, r) => sum + Number(r.creator_share), 0) || 0,
    totalPlatformFee: revenueData?.reduce((sum, r) => sum + Number(r.platform_fee), 0) || 0,
    totalImpressions: revenueData?.reduce((sum, r) => sum + (r.impressions || 0), 0) || 0,
    totalClicks: revenueData?.reduce((sum, r) => sum + (r.clicks || 0), 0) || 0,
    byType: {
      cpm: revenueData?.filter(r => r.revenue_type === 'cpm').reduce((sum, r) => sum + Number(r.creator_share), 0) || 0,
      cpc: revenueData?.filter(r => r.revenue_type === 'cpc').reduce((sum, r) => sum + Number(r.creator_share), 0) || 0,
      flat_rate: revenueData?.filter(r => r.revenue_type === 'flat_rate').reduce((sum, r) => sum + Number(r.creator_share), 0) || 0,
    },
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US').format(num);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Earnings</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(stats.totalCreatorShare)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gross Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalGross)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.totalImpressions)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <MousePointer className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ad Clicks</p>
                <p className="text-2xl font-bold">
                  {formatNumber(stats.totalClicks)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Tabs defaultValue="by-type" className="space-y-4">
        <TabsList>
          <TabsTrigger value="by-type">
            <PieChart className="h-4 w-4 mr-2" />
            By Type
          </TabsTrigger>
          <TabsTrigger value="by-campaign">
            <BarChart3 className="h-4 w-4 mr-2" />
            By Campaign
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="by-type">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Ad Type</CardTitle>
              <CardDescription>
                Your earnings breakdown by monetization model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-500">CPM</Badge>
                    <span className="text-sm">Cost Per Mille (1,000 impressions)</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(stats.byType.cpm)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-500">CPC</Badge>
                    <span className="text-sm">Cost Per Click</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(stats.byType.cpc)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-500">Flat Rate</Badge>
                    <span className="text-sm">Sponsorship Deals</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(stats.byType.flat_rate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-campaign">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Campaign</CardTitle>
              <CardDescription>
                Performance of your recent newsletter campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns && campaigns.length > 0 ? (
                <div className="space-y-3">
                  {campaigns.map(campaign => {
                    const campaignRevenue = revenueData?.filter(r => r.campaign_id === campaign.id) || [];
                    const earnings = campaignRevenue.reduce((sum, r) => sum + Number(r.creator_share), 0);
                    
                    return (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{campaign.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {campaign.sent_at && format(new Date(campaign.sent_at), "MMM d, yyyy")}
                            {" · "}
                            {campaign.recipient_count} recipients
                          </p>
                        </div>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(earnings)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No campaigns sent yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Revenue History</CardTitle>
              <CardDescription>
                All your newsletter ad revenue transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData && revenueData.length > 0 ? (
                <div className="space-y-2">
                  {revenueData.map(revenue => (
                    <div
                      key={revenue.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {revenue.revenue_type}
                        </Badge>
                        <div>
                          <p className="text-sm">
                            {revenue.impressions ? `${formatNumber(revenue.impressions)} impressions` : ''}
                            {revenue.clicks ? ` · ${formatNumber(revenue.clicks)} clicks` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(revenue.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-emerald-600">
                          +{formatCurrency(Number(revenue.creator_share))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          of {formatCurrency(Number(revenue.gross_amount))} gross
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No revenue recorded yet. Send newsletters with ad placements to start earning!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Revenue Share Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <PieChart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Revenue Share</h4>
              <p className="text-sm text-muted-foreground mt-1">
                You keep <span className="font-semibold text-emerald-600">70%</span> of all ad revenue. 
                The remaining 30% covers platform costs including ad serving, tracking, and payment processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
