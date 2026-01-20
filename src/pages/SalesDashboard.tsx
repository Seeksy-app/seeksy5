import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target, DollarSign, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TalkingPointsWidget } from "@/components/dashboard/TalkingPointsWidget";

export default function SalesDashboard() {
  const navigate = useNavigate();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["sales-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("multi_channel_campaigns")
        .select(`
          *,
          advertiser:advertisers(company_name),
          sales_member:sales_team_members(full_name),
          properties:campaign_properties(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["sales-stats"],
    queryFn: async () => {
      const { data: campaignsData } = await supabase
        .from("multi_channel_campaigns")
        .select("impression_goal, total_budget, status");

      const { data: impressionsData } = await supabase
        .from("campaign_property_impressions")
        .select("impression_count");

      const totalImpressionGoal = campaignsData?.reduce((sum, c) => sum + c.impression_goal, 0) || 0;
      const totalBudget = campaignsData?.reduce((sum, c) => sum + Number(c.total_budget), 0) || 0;
      const activeCampaigns = campaignsData?.filter(c => c.status === 'active').length || 0;
      const deliveredImpressions = impressionsData?.reduce((sum, i) => sum + i.impression_count, 0) || 0;

      return {
        totalImpressionGoal,
        totalBudget,
        activeCampaigns,
        deliveredImpressions,
      };
    },
  });

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-secondary",
      active: "bg-green-500",
      paused: "bg-yellow-500",
      completed: "bg-blue-500",
      cancelled: "bg-destructive",
    };
    return colors[status as keyof typeof colors] || "bg-secondary";
  };

  const calculateProgress = (campaign: any) => {
    const totalDelivered = campaign.properties?.reduce(
      (sum: number, prop: any) => sum + (prop.delivered_impressions || 0),
      0
    ) || 0;
    return (totalDelivered / campaign.impression_goal) * 100;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Dashboard</h1>
          <p className="text-muted-foreground">Manage multi-channel ad campaigns</p>
        </div>
        <Button onClick={() => navigate("/sales/create-campaign")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(stats?.totalBudget ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Impression Goal</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalImpressionGoal || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.deliveredImpressions || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalImpressionGoal
                ? `${((stats.deliveredImpressions / stats.totalImpressionGoal) * 100).toFixed(1)}% of goal`
                : "0% of goal"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Talking Points */}
      <TalkingPointsWidget 
        teamType="sales"
        title="Sales Team Talking Points"
        description="AI-generated pipeline insights and conversation starters"
      />

      {/* Campaigns List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Campaigns</h2>
        {isLoading ? (
          <Card>
            <CardContent className="p-6">Loading campaigns...</CardContent>
          </Card>
        ) : campaigns?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first multi-channel campaign to get started
              </p>
              <Button onClick={() => navigate("/sales/create-campaign")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns?.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{campaign.campaign_name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {campaign.advertiser?.company_name}
                    </p>
                  </div>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Impression Goal</p>
                    <p className="text-lg font-semibold">
                      {campaign.impression_goal.toLocaleString()}
                    </p>
                  </div>
                   <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="text-lg font-semibold">
                      ${Math.round(Number(campaign.total_budget)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Properties</p>
                    <p className="text-lg font-semibold">
                      {campaign.properties?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sales Rep</p>
                    <p className="text-lg font-semibold">
                      {campaign.sales_member?.full_name || "Unassigned"}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Campaign Progress</span>
                    <span>{calculateProgress(campaign).toFixed(1)}%</span>
                  </div>
                  <Progress value={calculateProgress(campaign)} />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    {new Date(campaign.start_date).toLocaleDateString()} -{" "}
                    {new Date(campaign.end_date).toLocaleDateString()}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/sales/campaign/${campaign.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
