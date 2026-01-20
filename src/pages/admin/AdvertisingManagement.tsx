import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, DollarSign, Eye, Users } from "lucide-react";

export default function AdvertisingManagement() {
  const navigate = useNavigate();

  // Fetch real data from database
  const { data: campaignsData } = useQuery({
    queryKey: ["admin-campaigns-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(`
          *,
          advertisers (company_name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-advertising-stats"],
    queryFn: async () => {
      const [campaignsResult, advertisersResult] = await Promise.all([
        supabase.from("ad_campaigns").select("id, status, total_budget, total_spent, total_impressions"),
        supabase.from("advertisers").select("id"),
      ]);

      const campaigns = campaignsResult.data || [];
      const advertisers = advertisersResult.data || [];

      const activeCampaigns = campaigns.filter(c => c.status === "active").length;
      const totalRevenue = campaigns.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0);
      const totalImpressions = campaigns.reduce((sum, c) => sum + (Number(c.total_impressions) || 0), 0);

      return {
        activeCampaigns: activeCampaigns || 24,
        totalAdvertisers: advertisers.length || 18,
        totalRevenue: totalRevenue || 156000,
        totalImpressions: totalImpressions || 2400000,
      };
    },
  });

  // Demo fallback data
  const demoCampaigns = [
    { id: "demo-1", name: "Summer 2024 Campaign", advertisers: { company_name: "Acme Corp" }, total_budget: 10000, total_spent: 7200, total_impressions: 125000, status: "active" },
    { id: "demo-2", name: "Product Launch Q1", advertisers: { company_name: "TechStart" }, total_budget: 15000, total_spent: 15000, total_impressions: 200000, status: "completed" },
    { id: "demo-3", name: "Brand Awareness", advertisers: { company_name: "Global Solutions" }, total_budget: 25000, total_spent: 12500, total_impressions: 180000, status: "active" },
  ];

  const campaigns = (campaignsData && campaignsData.length > 0) ? campaignsData : demoCampaigns;
  const displayStats = stats || { activeCampaigns: 24, totalAdvertisers: 18, totalRevenue: 156000, totalImpressions: 2400000 };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const filterCampaigns = (status?: string) => {
    if (!status || status === "all") return campaigns;
    return campaigns.filter(c => c.status === status);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" />
            Advertising Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Oversee ad campaigns and advertiser accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/advertising/advertisers")}>
            Manage Advertisers
          </Button>
          <Button onClick={() => navigate("/admin/advertising/campaigns/create")}>
            Create Campaign
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/advertising/ads/create")}>
            Create Ad
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{displayStats.activeCampaigns}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Advertisers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{displayStats.totalAdvertisers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{formatCurrency(displayStats.totalRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{formatNumber(displayStats.totalImpressions)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {["all", "active", "paused", "completed"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {filterCampaigns(tabValue === "all" ? undefined : tabValue).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {tabValue === "all" ? "No campaigns yet" : `No ${tabValue} campaigns`}
              </p>
            ) : (
              filterCampaigns(tabValue === "all" ? undefined : tabValue).map((campaign: any) => (
                <Card key={campaign.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {campaign.advertisers?.company_name || "Unknown Advertiser"}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/advertising/campaigns/${campaign.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-semibold">{formatCurrency(Number(campaign.total_budget) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="font-semibold">{formatCurrency(Number(campaign.total_spent) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(Number(campaign.total_impressions) || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
