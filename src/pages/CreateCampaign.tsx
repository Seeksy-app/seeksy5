import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Volume2, Plus } from "lucide-react";
import { PODCAST_CATEGORIES } from "@/lib/podcastCategories";
import { Badge } from "@/components/ui/badge";

export default function CreateCampaign() {
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

  // Fetch generated audio and video ads (including all valid statuses)
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
      
      // Filter for ready/completed ads that have audio_url
      const validAds = data.filter((ad: any) => 
        (ad.status === "completed" || ad.status === "ready") && ad.audio_url
      );
      
      console.log("Available ads for campaign:", validAds.length, validAds);
      return validAds;
    },
    enabled: !!advertiser,
  });

  // Helper to check if an ad is a video
  const isVideoAd = (ad: any) => {
    if (!ad?.audio_url) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    return videoExtensions.some(ext => ad.audio_url.toLowerCase().endsWith(ext));
  };

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!user || !advertiser) throw new Error("Not authenticated");
      if (!campaignName || !startDate || !endDate) {
        throw new Error("Please fill in all required fields");
      }

      let audioUrl = "";
      let duration = 0;

      // Use selected audio ad
      if (!selectedAudioAd) throw new Error("Please select an ad from your library");
      
      const selectedAd = audioAds?.find(ad => ad.id === selectedAudioAd);
      if (!selectedAd || !selectedAd.audio_url) throw new Error("Selected audio ad not found or invalid");
      
      audioUrl = selectedAd.audio_url;
      duration = selectedAd.duration_seconds || 30;

      // Create campaign
      const targetingRules = targetingCategories.length > 0
        ? { categories: targetingCategories }
        : {};

      const { data: campaign, error: campaignError } = await supabase
        .from("ad_campaigns")
        .insert({
          advertiser_id: advertiser.id,
          name: campaignName,
          total_budget: parseFloat(budget),
          cpm_bid: parseFloat(cpmBid),
          start_date: startDate,
          end_date: endDate,
          targeting_rules: targetingRules,
          status: "pending",
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create ad creative
      const { error: creativeError } = await supabase
        .from("ad_creatives")
        .insert({
          campaign_id: campaign.id,
          advertiser_id: campaign.advertiser_id,
          name: "Audio Creative",
          format: "audio",
          status: "ready",
          duration_seconds: duration,
        });

      if (creativeError) throw creativeError;

      // Link the audio ad to the campaign
      if (selectedAudioAd) {
        await supabase
          .from("audio_ads")
          .update({ campaign_id: campaign.id })
          .eq("id", selectedAudioAd);
      }

      return campaign;
    },
    onSuccess: () => {
      toast.success("Campaign scheduled successfully! 🎯");
      navigate("/advertiser/campaigns");
    },
    onError: (error: any) => {
      toast.error("Failed to create campaign: " + error.message);
    },
  });

  if (!advertiser || advertiser.status !== "approved") {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need an approved advertiser account to create campaigns.
            </CardDescription>
          </CardHeader>
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
            <h1 className="text-3xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground mt-1">
              Schedule and target your existing ads
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Fill in the information about your advertising campaign
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

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-lg font-semibold">Target Categories</Label>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Matching
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Select categories that match your content for better ad targeting and discovery
              </p>
              <div className="flex flex-wrap gap-2">
                {PODCAST_CATEGORIES.map((category) => {
                  const isSelected = targetingCategories.includes(category);
                  return (
                    <Badge
                      key={category}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (isSelected) {
                          setTargetingCategories(targetingCategories.filter(c => c !== category));
                        } else {
                          setTargetingCategories([...targetingCategories, category]);
                        }
                      }}
                    >
                      {category}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Ad</CardTitle>
            <CardDescription>
              Choose an audio or video ad from your library to use in this campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {audioAds && audioAds.length > 0 ? (
              <div className="space-y-2">
                <Label>Available Ads</Label>
                <Select value={selectedAudioAd || ""} onValueChange={setSelectedAudioAd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an ad" />
                  </SelectTrigger>
                  <SelectContent className="bg-background max-h-[300px]">
                    {audioAds.map((ad: any) => {
                      const isVideo = isVideoAd(ad);
                      return (
                        <SelectItem key={ad.id} value={ad.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium">
                              {isVideo ? "🎬 Video" : ad.ad_type === "conversational" ? "🎙️ Conversational" : "🔊 Audio"}
                              {ad.campaign_name && ` • ${ad.campaign_name}`}
                              {!ad.campaign_name && ad.voice_name && ` • ${ad.voice_name}`}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {ad.duration_seconds ? `${ad.duration_seconds}s` : ''}
                              {ad.script ? ` • ${ad.script.substring(0, 50)}...` : ''}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedAudioAd && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Preview</p>
                    {(() => {
                      const ad = audioAds.find((a: any) => a.id === selectedAudioAd);
                      if (!ad) return null;
                      
                      if (isVideoAd(ad) && ad.audio_url) {
                        return (
                          <video controls className="w-full rounded" src={ad.audio_url}>
                            Your browser does not support the video element.
                          </video>
                        );
                      }
                      
                      return ad.audio_url ? (
                        <audio controls className="w-full" src={ad.audio_url}>
                          Your browser does not support the audio element.
                        </audio>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <Volume2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No ads available</h3>
                  <p className="text-muted-foreground mb-4">
                    Create an ad first before setting up a campaign
                  </p>
                  <Button onClick={() => navigate("/advertiser/campaigns/create-type")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ad
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/advertiser/campaigns")}>
            Cancel
          </Button>
          <Button 
            onClick={() => createCampaignMutation.mutate()}
            disabled={createCampaignMutation.isPending}
          >
            {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
          </Button>
        </div>
      </div>
    </div>
  );
}
