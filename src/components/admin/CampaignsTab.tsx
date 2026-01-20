import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function CampaignsTab() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(`
          *,
          ad_creatives (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-campaign-stats"],
    queryFn: async () => {
      const { data: impressions } = await supabase
        .from("ad_impressions")
        .select("*", { count: "exact", head: true });

      const { data: campaigns } = await supabase
        .from("ad_campaigns")
        .select("total_spent")
        .eq("status", "active");

      const totalRevenue = campaigns?.reduce((sum, c) => sum + Number(c.total_spent), 0) || 0;

      return {
        totalImpressions: impressions || 0,
        totalRevenue,
        activeCampaigns: campaigns?.length || 0,
      };
    },
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalImpressions.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalRevenue.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {campaigns && campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>
                      {format(new Date(campaign.start_date), "MMM d")} - {format(new Date(campaign.end_date), "MMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Budget</div>
                    <div className="font-medium">${campaign.total_budget.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">CPM Bid</div>
                    <div className="font-medium">${campaign.cpm_bid.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Impressions</div>
                    <div className="font-medium">{campaign.total_impressions?.toLocaleString() || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Spent</div>
                    <div className="font-medium">${(campaign.total_spent || 0).toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No campaigns found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
