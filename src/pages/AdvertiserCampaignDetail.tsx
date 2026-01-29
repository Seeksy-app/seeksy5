import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Edit2, Save, X, TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function AdvertiserCampaignDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedStartDate, setEditedStartDate] = useState("");
  const [editedEndDate, setEditedEndDate] = useState("");

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign-detail", campaignId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("ad_campaigns")
        .select(`
          *,
          ad_creatives(*),
          audio_ads(id, ad_type, voice_name, duration_seconds, audio_url)
        `)
        .eq("id", campaignId)
        .single();
      
      if (result.error) throw result.error;
      const data = result.data as any;
      
      // Initialize edit fields
      setEditedStartDate(data.start_date);
      setEditedEndDate(data.end_date);
      
      return data;
    },
    enabled: !!campaignId,
  });

  // Fetch matching creators count for Quick Campaigns
  const { data: matchedCreators } = useQuery({
    queryKey: ["matched-creators", campaignId],
    queryFn: async () => {
      if (!campaign?.campaign_type || campaign.campaign_type !== 'quick') {
        return null;
      }

      const targetCategories = (campaign.targeting_rules as any)?.categories as string[] | undefined;
      if (!targetCategories || targetCategories.length === 0) {
        return { count: 0, creators: [], liveCount: 0, liveCreators: [] };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, categories, my_page_ad_id, my_page_video_type")
        .not("categories", "is", null);

      if (error) throw error;

      // Filter profiles that have at least one matching category
      const matched = data?.filter((profile: any) => {
        const profileCategories = profile.categories || [];
        return targetCategories.some((cat: string) => profileCategories.includes(cat));
      }) || [];

      // Count how many actually have this ad loaded on their page
      const { data: adData } = await supabase
        .from("audio_ads")
        .select("id")
        .eq("campaign_id", campaignId)
        .single();

      const liveCreatorsData = matched.filter((profile: any) => 
        profile.my_page_ad_id === adData?.id && profile.my_page_video_type === 'ad'
      );

      return { 
        count: matched.length, 
        creators: matched, 
        liveCount: liveCreatorsData.length,
        liveCreators: liveCreatorsData
      };
    },
    enabled: !!campaign && campaign?.campaign_type === 'quick',
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  // Fetch impressions for active campaigns
  const { data: impressions } = useQuery({
    queryKey: ["campaign-impressions", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_impressions")
        .select("id, created_at")
        .eq("campaign_id", campaignId);

      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("ad_campaigns")
        .update({
          start_date: editedStartDate,
          end_date: editedEndDate,
        })
        .eq("id", campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-detail", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["advertiser-campaigns"] });
      toast.success("Campaign dates updated successfully! 📅");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update campaign: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Campaign not found</p>
            <Button onClick={() => navigate("/advertiser/campaigns")} className="mt-4">
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const budgetRemaining = Number(campaign.total_budget) - Number(campaign.total_spent || 0);
  const percentSpent = (Number(campaign.total_spent || 0) / Number(campaign.total_budget)) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500 text-white";
      case "paused": return "bg-yellow-500 text-black";
      case "completed": return "bg-blue-500 text-white";
      case "stopped": return "bg-red-500 text-white";
      case "draft": return "bg-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/advertiser/campaigns")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Campaigns
      </Button>

      <div className="space-y-6">
        {/* Campaign Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-3xl">{campaign.name}</CardTitle>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status.toUpperCase()}
                  </Badge>
                  {campaign.ad_creatives && campaign.ad_creatives.length > 0 && (
                    <Badge variant="outline">
                      {campaign.ad_creatives[0].format === "video" ? "📹 Video" : 
                       campaign.audio_ads?.[0]?.ad_type === "conversational" ? "🎙️ Conversational" : "🔊 Audio"} Ad
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Created: {format(new Date(campaign.created_at), "MMM d, yyyy 'at' h:mm a")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Campaign Dates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Campaign Schedule
              </CardTitle>
              {!isEditing && campaign.status !== "active" && campaign.status !== "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Dates
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={editedStartDate}
                      onChange={(e) => setEditedStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={editedEndDate}
                      onChange={(e) => setEditedEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateCampaignMutation.mutate()}
                    disabled={updateCampaignMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedStartDate(campaign.start_date);
                      setEditedEndDate(campaign.end_date);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-lg">
                <p>
                  <span className="font-semibold">Start:</span>{" "}
                  {format(new Date(campaign.start_date), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="mt-2">
                  <span className="font-semibold">End:</span>{" "}
                  {format(new Date(campaign.end_date), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget & Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget & Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-2xl font-bold">${Number(campaign.total_budget).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-2xl font-bold text-red-600">
                  ${Number(campaign.total_spent || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold text-green-600">
                  ${budgetRemaining.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold">
                  {campaign.total_impressions?.toLocaleString() || 0}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Budget Usage</span>
                <span className="font-semibold">{percentSpent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    percentSpent > 90 ? "bg-red-500" : 
                    percentSpent > 75 ? "bg-yellow-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(percentSpent, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6 pt-6 border-t">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium">CPM Bid:</span> ${Number(campaign.cpm_bid).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Targeting & Matched Creators */}
        {campaign.targeting_rules && (campaign.targeting_rules as any).categories && (
          <Card>
            <CardHeader>
              <CardTitle>Targeting</CardTitle>
              {campaign.campaign_type === 'quick' && matchedCreators && (
                <CardDescription>
                  Matched {matchedCreators.count} {matchedCreators.count === 1 ? 'creator' : 'creators'}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {((campaign.targeting_rules as any).categories as string[]).map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
              {campaign.campaign_type === 'quick' && matchedCreators && matchedCreators.count > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    {campaign.status === 'active' && matchedCreators.liveCount > 0
                      ? `This ad is LIVE on ${matchedCreators.liveCount} creator ${matchedCreators.liveCount === 1 ? 'page' : 'pages'}` 
                      : `Live on 0 creator pages`}
                  </p>
                  
                  {matchedCreators.liveCreators && matchedCreators.liveCreators.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Currently displaying on:</p>
                      <div className="flex flex-wrap gap-2">
                        {matchedCreators.liveCreators.map((creator: any) => (
                          <Badge 
                            key={creator.id} 
                            variant="outline"
                            className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300"
                          >
                            {creator.full_name || creator.username}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {campaign.status === 'active' && impressions && impressions.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="default" className="bg-green-500">
                        <span className="relative flex h-2 w-2 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        LIVE
                      </Badge>
                      <span className="text-sm font-semibold">
                        {impressions.length.toLocaleString()} impressions
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
