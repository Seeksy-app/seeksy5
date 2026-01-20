import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, DollarSign, BarChart3, Settings, Users } from "lucide-react";
import CampaignOpportunities from "./CampaignOpportunities";

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(`
          *,
          advertisers (company_name, contact_name, contact_email)
        `)
        .eq("id", campaignId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-muted-foreground">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Campaign not found</div>
      </div>
    );
  }

  const targetingRules = campaign.targeting_rules as { selected_units?: any[] } | null;
  const selectedUnits = targetingRules?.selected_units || [];
  const totalImpressions = selectedUnits.reduce((sum: number, unit: any) => sum + (unit.expected_impressions || 0), 0);

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/admin/ad-campaigns")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Campaigns
      </Button>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground mt-1">
              {campaign.advertisers?.company_name}
            </p>
          </div>
          <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
            {campaign.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-2">
            <Users className="h-4 w-4" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="creatives" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Creatives
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Budget</div>
                  <div className="text-2xl font-bold">${Number(campaign.total_budget || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Spent</div>
                  <div className="text-2xl font-bold">${Number(campaign.total_spent || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Remaining</div>
                  <div className="text-2xl font-bold">
                    ${(Number(campaign.total_budget || 0) - Number(campaign.total_spent || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Impressions</div>
                  <div className="text-2xl font-bold">{Number(campaign.total_impressions || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Expected</div>
                  <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Avg CPM</div>
                  <div className="text-2xl font-bold">${Number(campaign.cpm_bid || 0).toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Campaign Type:</span>
                <span className="font-medium">{campaign.campaign_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-medium">{new Date(campaign.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date:</span>
                <span className="font-medium">{new Date(campaign.end_date).toLocaleDateString()}</span>
              </div>
              {campaign.daily_cap && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Cap:</span>
                  <span className="font-medium">${Number(campaign.daily_cap).toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedUnits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Ad Units</CardTitle>
                <CardDescription>{selectedUnits.length} units selected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedUnits.map((unit: any, index: number) => (
                    <div key={index} className="flex justify-between items-center border-b pb-3 last:border-0">
                      <div>
                        <div className="font-medium">Unit #{index + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          {unit.expected_impressions?.toLocaleString()} impressions
                        </div>
                      </div>
                      <Badge variant="outline">${unit.cpm} CPM</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="opportunities">
          {campaignId && <CampaignOpportunities campaignId={campaignId} />}
        </TabsContent>

        <TabsContent value="creatives">
          <Card>
            <CardContent className="py-8 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Creatives Coming Soon</h3>
              <p className="text-muted-foreground">
                Upload and manage ad creatives for this campaign
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
