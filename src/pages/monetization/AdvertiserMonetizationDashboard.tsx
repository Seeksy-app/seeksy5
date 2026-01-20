import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  Users,
  Eye,
  MousePointerClick,
  Plus,
  Wallet,
  BarChart3,
  Target,
  ArrowRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AdvertiserStatsBar } from "@/components/monetization/AdvertiserStatsBar";
import { CampaignCard } from "@/components/monetization/CampaignCard";
import { WalletWidget } from "@/components/monetization/WalletWidget";
import { AnalyticsCharts } from "@/components/monetization/AnalyticsCharts";

export default function AdvertiserMonetizationDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: advertiser, isLoading: loadingAdvertiser } = useQuery({
    queryKey: ['advertiser-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('advertisers')
        .select('*')
        .eq('owner_profile_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['advertiser-campaigns', advertiser?.id],
    queryFn: async () => {
      if (!advertiser?.id) return [];
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('advertiser_id', advertiser.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!advertiser?.id
  });

  const { data: wallet } = useQuery({
    queryKey: ['advertiser-wallet', advertiser?.id],
    queryFn: async () => {
      if (!advertiser?.id) return null;
      const { data, error } = await supabase
        .from('advertiser_wallet')
        .select('*')
        .eq('advertiser_id', advertiser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!advertiser?.id
  });

  const { data: metrics } = useQuery({
    queryKey: ['advertiser-metrics', advertiser?.id],
    queryFn: async () => {
      if (!advertiser?.id) return null;
      const campaignIds = campaigns?.map(c => c.id) || [];
      if (campaignIds.length === 0) return null;
      
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .in('campaign_id', campaignIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!advertiser?.id && !!campaigns?.length
  });

  // Calculate totals
  const activeCampaigns = campaigns?.filter(c => c.status === 'active') || [];
  const totalSpend = campaigns?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0;
  const totalImpressions = metrics?.reduce((sum, m) => sum + (m.impressions || 0), 0) || 0;
  const totalClicks = metrics?.reduce((sum, m) => sum + (m.clicks || 0), 0) || 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  if (!advertiser && !loadingAdvertiser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Advertiser Account</CardTitle>
            <CardDescription>
              You need to create an advertiser account to access the monetization center.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/advertiser/signup">Create Advertiser Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              Advertiser Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage campaigns, creators, and performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/monetization/creators">
                <Users className="h-4 w-4 mr-2" />
                Browse Creators
              </Link>
            </Button>
            <Button onClick={() => navigate('/monetization/campaigns/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <AdvertiserStatsBar
          activeCampaigns={activeCampaigns.length}
          totalSpend={totalSpend}
          totalImpressions={totalImpressions}
          avgCTR={avgCTR}
          walletBalance={wallet?.balance || 0}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="creators">Creators</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Active Campaigns */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Active Campaigns</CardTitle>
                      <CardDescription>Currently running campaigns</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("campaigns")}>
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loadingCampaigns ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : activeCampaigns.length > 0 ? (
                      <div className="space-y-4">
                        {activeCampaigns.slice(0, 3).map((campaign) => (
                          <CampaignCard key={campaign.id} campaign={campaign} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No active campaigns</p>
                        <Button className="mt-4" onClick={() => navigate('/monetization/campaigns/new')}>
                          Create Your First Campaign
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        Total Impressions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-green-500" />
                        Total Clicks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">{avgCTR.toFixed(2)}% CTR</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Avg CPM
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000).toFixed(2) : '0.00'}
                      </div>
                      <p className="text-xs text-muted-foreground">Cost per 1,000 impressions</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="space-y-6 mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>All Campaigns</CardTitle>
                      <CardDescription>Manage your advertising campaigns</CardDescription>
                    </div>
                    <Button onClick={() => navigate('/monetization/campaigns/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {loadingCampaigns ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : campaigns && campaigns.length > 0 ? (
                      <div className="space-y-4">
                        {campaigns.map((campaign) => (
                          <CampaignCard key={campaign.id} campaign={campaign} showDetails />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No campaigns yet</p>
                        <Button className="mt-4" onClick={() => navigate('/monetization/campaigns/new')}>
                          Create Your First Campaign
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Creators Tab */}
              <TabsContent value="creators" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Creator Marketplace</CardTitle>
                    <CardDescription>
                      Find and connect with creators for your campaigns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Browse available creators</p>
                      <Button className="mt-4" asChild>
                        <Link to="/monetization/creators">Browse Creators</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6 mt-6">
                <AnalyticsCharts metrics={metrics || []} campaigns={campaigns || []} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WalletWidget 
              wallet={wallet} 
              advertiserId={advertiser?.id} 
            />

            {/* Top Performing Creators */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Creators</CardTitle>
                <CardDescription>Best performers this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No creator data yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
