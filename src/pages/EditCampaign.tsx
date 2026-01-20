import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { PODCAST_CATEGORIES } from "@/lib/podcastCategories";
import { Badge } from "@/components/ui/badge";
import { differenceInHours } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditCampaign() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState("");
  const [budget, setBudget] = useState("1000");
  const [cpmBid, setCpmBid] = useState("20");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetingCategories, setTargetingCategories] = useState<string[]>([]);
  const [selectedAudioAd, setSelectedAudioAd] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: advertiser } = useQuery({
    queryKey: ["advertiser", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .eq("owner_profile_id", user.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  // Load existing campaign
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select(`
          *,
          ad_creatives(*),
          audio_ads(id, ad_type, voice_name, duration_seconds, audio_url)
        `)
        .eq("id", campaignId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  // Set form values when campaign data loads
  useEffect(() => {
    if (campaign) {
      setCampaignName(campaign.name);
      setBudget(campaign.total_budget.toString());
      setCpmBid(campaign.cpm_bid.toString());
      setStartDate(campaign.start_date);
      setEndDate(campaign.end_date);
      
      // Safely handle targeting rules
      const rules = campaign.targeting_rules as { categories?: string[] } | null;
      setTargetingCategories(rules?.categories || []);
      
      // Set selected audio ad if exists
      if (campaign.audio_ads && campaign.audio_ads.length > 0) {
        setSelectedAudioAd(campaign.audio_ads[0].id);
      }
    }
  }, [campaign]);

  // Fetch audio ads
  const { data: audioAds } = useQuery({
    queryKey: ["audio-ads", advertiser?.id],
    queryFn: async () => {
      if (!advertiser) return [];
      const { data, error } = await supabase
        .from("audio_ads")
        .select("*")
        .eq("advertiser_id", advertiser.id)
        .not("audio_url", "is", null)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const validAds = data.filter((ad: any) => 
        (ad.status === "completed" || ad.status === "ready") && ad.audio_url
      );
      
      return validAds;
    },
    enabled: !!advertiser,
  });

  // Fetch video ads
  const { data: videoAds } = useQuery({
    queryKey: ["video-ads", advertiser?.id],
    queryFn: async () => {
      if (!advertiser) return [];
      const { data, error } = await supabase
        .from("ad_videos")
        .select("*")
        .eq("created_by_user_id", advertiser.owner_profile_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching video ads:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!advertiser,
  });

  // Combine audio and video ads
  const allAds = [
    ...(audioAds || []).map((ad: any) => ({ ...ad, sourceType: 'audio' })),
    ...(videoAds || []).map((ad: any) => ({ ...ad, sourceType: 'video' }))
  ];

  // Helper to check if an ad is a video
  const isVideoAd = (ad: any) => {
    if (ad.sourceType === 'video') return true;
    if (!ad?.audio_url) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    return videoExtensions.some(ext => ad.audio_url.toLowerCase().endsWith(ext));
  };

  // Determine edit permissions
  const canFullEdit = campaign?.status === "draft" || 
    (campaign && differenceInHours(new Date(campaign.start_date), new Date()) > 24);
  const canEditDatesOnly = campaign?.status === "active";

  const updateCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!user || !advertiser || !campaign) throw new Error("Not authenticated");
      if (!campaignName || !startDate || !endDate) {
        throw new Error("Please fill in all required fields");
      }

      // Prepare update data based on permissions
      let updateData: any = {
        start_date: startDate,
        end_date: endDate,
      };

      // If can fully edit, include all fields
      if (canFullEdit) {
        const targetingRules = targetingCategories.length > 0
          ? { categories: targetingCategories }
          : {};

        updateData = {
          ...updateData,
          name: campaignName,
          budget: parseFloat(budget),
          cpm_bid: parseFloat(cpmBid),
          targeting_rules: targetingRules,
        };

        // Update creative type if ad changed
        if (selectedAudioAd && selectedAudioAd !== campaign.audio_ads?.[0]?.id) {
          const selectedAd = audioAds?.find(ad => ad.id === selectedAudioAd);
          if (selectedAd) {
            // Update ad creative
            await supabase
              .from("ad_creatives")
              .update({
                audio_url: selectedAd.audio_url,
                duration_seconds: selectedAd.duration_seconds || 30,
              })
              .eq("campaign_id", campaignId);

            // Update audio ad link
            await supabase
              .from("audio_ads")
              .update({ campaign_id: campaignId })
              .eq("id", selectedAudioAd);
          }
        }
      }

      // Update campaign
      const { error: updateError } = await supabase
        .from("ad_campaigns")
        .update(updateData)
        .eq("id", campaignId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Campaign updated successfully! 🎯");
      navigate("/advertiser/campaigns");
    },
    onError: (error: any) => {
      toast.error("Failed to update campaign: " + error.message);
    },
  });

  if (campaignLoading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center">Loading campaign...</p>
      </div>
    );
  }

  if (!advertiser || advertiser.status !== "approved" || !campaign) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need an approved advertiser account and valid campaign to edit.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if campaign can be edited
  if (!canFullEdit && !canEditDatesOnly) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Cannot Edit Campaign</CardTitle>
            <CardDescription>
              This campaign cannot be edited. Active campaigns can only be edited more than 24 hours before start date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/advertiser/campaigns")}>
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/advertiser/campaigns")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Campaign</h1>
            <p className="text-muted-foreground mt-1">
              Update your campaign settings
            </p>
          </div>
        </div>

        {canEditDatesOnly && !canFullEdit && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This campaign is active. You can only edit the start and end dates.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              {canFullEdit ? "Update campaign information" : "Update campaign dates"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="My Awesome Campaign"
                disabled={!canFullEdit}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($) *</Label>
                <Input
                  id="budget"
                  type="number"
                  min="100"
                  step="50"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="1000"
                  disabled={!canFullEdit}
                />
                <p className="text-sm text-muted-foreground">
                  Minimum $100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpm">CPM Bid ($) *</Label>
                <Input
                  id="cpm"
                  type="number"
                  min="5"
                  step="0.50"
                  value={cpmBid}
                  onChange={(e) => setCpmBid(e.target.value)}
                  placeholder="20"
                  disabled={!canFullEdit}
                />
                <p className="text-sm text-muted-foreground">
                  Cost per 1,000 impressions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {canFullEdit && (
              <>
                <div className="space-y-2">
                  <Label>Target Categories</Label>
                  <Select
                    value={targetingCategories[0] || ""}
                    onValueChange={(value) => {
                      if (!targetingCategories.includes(value)) {
                        setTargetingCategories([...targetingCategories, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select categories to target" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {PODCAST_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {targetingCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {targetingCategories.map((cat) => (
                        <Badge
                          key={cat}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setTargetingCategories(targetingCategories.filter(c => c !== cat))}
                        >
                          {cat} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {allAds && allAds.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Ad</Label>
                    <Select value={selectedAudioAd || ""} onValueChange={setSelectedAudioAd}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an ad" />
                      </SelectTrigger>
                      <SelectContent className="bg-background max-h-[300px]">
                        {allAds.map((ad: any) => {
                          const isVideo = isVideoAd(ad);
                          return (
                            <SelectItem key={ad.id} value={ad.id}>
                              <div className="flex flex-col py-1">
                                <span className="font-medium">
                                  {isVideo ? "🎬 Video" : ad.ad_type === "conversational" ? "🎙️ Conversational" : "🔊 Audio"}
                                  {ad.title && ` • ${ad.title}`}
                                  {!ad.title && ad.campaign_name && ` • ${ad.campaign_name}`}
                                  {!ad.title && !ad.campaign_name && ad.voice_name && ` • ${ad.voice_name}`}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {ad.duration_seconds ? `${ad.duration_seconds}s` : ''}
                                  {ad.script ? ` • ${ad.script.substring(0, 50)}...` : ''}
                                  {ad.description ? ` • ${ad.description.substring(0, 50)}...` : ''}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/advertiser/campaigns")}>
            Cancel
          </Button>
          <Button 
            onClick={() => updateCampaignMutation.mutate()}
            disabled={updateCampaignMutation.isPending}
          >
            {updateCampaignMutation.isPending ? "Updating..." : "Update Campaign"}
          </Button>
        </div>
      </div>
    </div>
  );
}
