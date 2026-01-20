import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, DollarSign, Target, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AgencyCampaigns() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["agency-campaigns", user?.id],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser?.id) return [];

      const result = await (supabase as any)
        .from("multi_channel_campaigns")
        .select("*")
        .eq("created_by", currentUser.id)
        .order("created_at", { ascending: false });

      if (result.error) throw result.error;

      const data = result.data as any[];

      // Fetch campaign properties separately to avoid deep nesting
      const campaignsWithProperties = await Promise.all((data || []).map(async (campaign) => {
        const { data: properties } = await supabase
          .from("campaign_properties")
          .select("id, allocated_budget, status")
          .eq("multi_channel_campaign_id", campaign.id);

        return {
          ...campaign,
          campaign_properties: properties || []
        };
      }));

      return campaignsWithProperties;
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "draft": return "secondary";
      case "active": return "default";
      case "completed": return "outline";
      case "paused": return "destructive";
      default: return "secondary";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const activeCampaigns = campaigns?.filter(c => c.status === "active") || [];
  const draftCampaigns = campaigns?.filter(c => c.status === "draft") || [];
  const completedCampaigns = campaigns?.filter(c => c.status === "completed") || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Campaigns</h1>
            <p className="text-muted-foreground">Manage your influencer marketing campaigns</p>
          </div>
          <Button onClick={() => navigate("/create-multi-channel-campaign")}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading campaigns...</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All ({campaigns?.length || 0})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeCampaigns.length})</TabsTrigger>
              <TabsTrigger value="draft">Draft ({draftCampaigns.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedCampaigns.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {campaigns?.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} formatCurrency={formatCurrency} getStatusColor={getStatusColor} />
              ))}
              {campaigns?.length === 0 && <EmptyState />}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} formatCurrency={formatCurrency} getStatusColor={getStatusColor} />
              ))}
              {activeCampaigns.length === 0 && <EmptyState message="No active campaigns" />}
            </TabsContent>

            <TabsContent value="draft" className="space-y-4">
              {draftCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} formatCurrency={formatCurrency} getStatusColor={getStatusColor} />
              ))}
              {draftCampaigns.length === 0 && <EmptyState message="No draft campaigns" />}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} formatCurrency={formatCurrency} getStatusColor={getStatusColor} />
              ))}
              {completedCampaigns.length === 0 && <EmptyState message="No completed campaigns" />}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function CampaignCard({ campaign, formatCurrency, getStatusColor }: { 
  campaign: {
    id: string;
    campaign_name: string;
    status: string;
    impression_goal: number | null;
    start_date: string;
    end_date: string;
    campaign_properties: Array<{
      id: string;
      allocated_budget: number;
      status: string;
    }> | null;
  }; 
  formatCurrency: (amount: number) => string; 
  getStatusColor: (status: string) => "default" | "destructive" | "outline" | "secondary";
}) {
  const totalBudget = campaign.campaign_properties?.reduce((sum, prop) => sum + (prop.allocated_budget || 0), 0) || 0;
  const totalProperties = campaign.campaign_properties?.length || 0;
  const acceptedProperties = campaign.campaign_properties?.filter(p => p.status === "accepted").length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-2">{campaign.campaign_name}</CardTitle>
            <CardDescription>Multi-channel influencer campaign</CardDescription>
          </div>
          <Badge variant={getStatusColor(campaign.status)}>{campaign.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="font-semibold">{formatCurrency(totalBudget)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Target Impressions</p>
              <p className="font-semibold">{(campaign.impression_goal || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Influencers</p>
              <p className="font-semibold">{acceptedProperties} / {totalProperties}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-semibold">
                {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">View Details</Button>
          <Button variant="outline" size="sm">Edit</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message = "No campaigns yet" }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{message}</h3>
      <p className="text-muted-foreground mb-4">Create your first campaign to get started</p>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Campaign
      </Button>
    </div>
  );
}
