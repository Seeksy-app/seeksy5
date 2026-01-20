import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clapperboard, Play, Phone, Clock, Building2, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function AdsTab() {
  const { data: audioAds, isLoading: loadingAds } = useQuery({
    queryKey: ["admin-audio-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audio_ads")
        .select(`
          *,
          advertiser:advertiser_id(company_name),
          campaign:campaign_id(name, status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      generating: "bg-blue-500",
      ready: "bg-green-500",
      failed: "bg-red-500",
    };
    return variants[status] || "bg-gray-500";
  };

  const getAdTypeBadge = (adType: string) => {
    return adType === "conversational"
      ? "bg-purple-500 text-white"
      : "bg-blue-500 text-white";
  };

  const getCampaignStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-green-500",
      draft: "bg-gray-500",
      paused: "bg-yellow-500",
      completed: "bg-blue-500",
    };
    return variants[status] || "bg-gray-500";
  };

  return (
    <Tabs defaultValue="ads" className="space-y-4">
      <TabsList>
        <TabsTrigger value="ads">Audio Ads</TabsTrigger>
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
      </TabsList>

      <TabsContent value="ads" className="space-y-4">
        {loadingAds ? (
          <div className="text-center py-12">Loading ads...</div>
        ) : audioAds && audioAds.length > 0 ? (
          <div className="grid gap-4">
            {audioAds.map((ad) => (
              <Card key={ad.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {ad.advertiser?.company_name || "Unknown Advertiser"}
                        </CardTitle>
                        <Badge className={getAdTypeBadge(ad.ad_type)}>
                          {ad.ad_type === "conversational" ? "Conversational AI" : "Standard Audio"}
                        </Badge>
                        <Badge className={getStatusBadge(ad.status)}>
                          {ad.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Created {format(new Date(ad.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    {ad.campaign && (
                      <Badge variant="outline">
                        Campaign: {ad.campaign.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Script</div>
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {ad.script.length > 200 ? `${ad.script.substring(0, 200)}...` : ad.script}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {ad.duration_seconds && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Duration</div>
                          <div className="font-medium">{ad.duration_seconds}s</div>
                        </div>
                      </div>
                    )}

                    {ad.voice_name && (
                      <div className="flex items-center gap-2">
                        <Clapperboard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Voice</div>
                          <div className="font-medium">{ad.voice_name}</div>
                        </div>
                      </div>
                    )}

                    {ad.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Phone</div>
                          <div className="font-medium">{ad.phone_number}</div>
                        </div>
                      </div>
                    )}

                    {ad.audio_url && (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const audio = new Audio(ad.audio_url);
                            audio.play();
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No ads found
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="campaigns" className="space-y-4">
        {loadingCampaigns ? (
          <div className="text-center py-12">Loading campaigns...</div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <Badge className={getCampaignStatusBadge(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Created {format(new Date(campaign.created_at), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Budget</div>
                        <div className="font-medium">${Number(campaign.total_budget).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">CPM Bid</div>
                        <div className="font-medium">${Number(campaign.cpm_bid).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Impressions</div>
                        <div className="font-medium">{campaign.total_impressions || 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Spent</div>
                        <div className="font-medium">${Number(campaign.total_spent || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-2">Campaign Period</div>
                      <div className="font-medium">
                        {format(new Date(campaign.start_date), "MMM d, yyyy")} -{" "}
                        {format(new Date(campaign.end_date), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No campaigns found
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
