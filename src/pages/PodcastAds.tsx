import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Play, Pause, Trash2, DollarSign, ExternalLink, Radio, AlertCircle, ToggleLeft } from "lucide-react";
import { toast } from "sonner";
import CampaignBrowser from "@/components/CampaignBrowser";

export default function PodcastAds() {
  const [selectedPodcast, setSelectedPodcast] = useState<string>("");
  const [uploadingAd, setUploadingAd] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("pre");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ctaUrl, setCtaUrl] = useState<string>("");
  const [ctaText, setCtaText] = useState<string>("Learn More");
  const [editingAdSlot, setEditingAdSlot] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showRightsConfirmation, setShowRightsConfirmation] = useState(false);
  const [showUploadConfirmation, setShowUploadConfirmation] = useState(false);
  const [confirmedPodcasts, setConfirmedPodcasts] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Load confirmed podcasts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('confirmedAdRightsPodcasts');
    if (stored) {
      setConfirmedPodcasts(new Set(JSON.parse(stored)));
    }
  }, []);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return user;
    },
  });

  const { data: podcasts } = useQuery({
    queryKey: ["podcasts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all episodes for episode count display
  const { data: allEpisodes } = useQuery({
    queryKey: ["all-episodes", user?.id],
    queryFn: async () => {
      if (!podcasts) return [];
      
      const { data, error } = await supabase
        .from("episodes")
        .select("id, podcast_id")
        .in("podcast_id", podcasts.map(p => p.id));
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!podcasts,
  });

  // Get ad counts for each podcast
  const { data: adCounts } = useQuery({
    queryKey: ["ad-counts", user?.id],
    queryFn: async () => {
      if (!podcasts) return {};
      
      const counts: Record<string, number> = {};
      
      for (const podcast of podcasts) {
        const { data: podcastEpisodes } = await supabase
          .from("episodes")
          .select("id")
          .eq("podcast_id", podcast.id);
        
        if (podcastEpisodes) {
          const episodeIds = podcastEpisodes.map(e => e.id);
          const { count } = await supabase
            .from("ad_slots")
            .select("*", { count: 'exact', head: true })
            .eq("status", "filled")
            .in("episode_id", episodeIds);
          
          counts[podcast.id] = count || 0;
        }
      }
      
      return counts;
    },
    enabled: !!user && !!podcasts,
  });

  const { data: adSettings } = useQuery({
    queryKey: ["podcast-ad-settings", selectedPodcast],
    queryFn: async () => {
      if (!selectedPodcast) return null;
      
      const { data, error } = await supabase
        .from("podcast_ad_settings")
        .select("*")
        .eq("podcast_id", selectedPodcast)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!selectedPodcast,
  });

  // Get podcasts with ad counts
  const { data: podcastsWithAdCounts } = useQuery({
    queryKey: ["podcasts-ad-counts", user?.id],
    queryFn: async () => {
      const { data: podcasts, error: podcastsError } = await supabase
        .from("podcasts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (podcastsError) throw podcastsError;

      // Get ad counts for each podcast
      const podcastsWithCounts = await Promise.all(
        (podcasts || []).map(async (podcast) => {
          const { count } = await supabase
            .from("ad_slots")
            .select("*", { count: 'exact', head: true })
            .eq("status", "filled")
            .in("episode_id", 
              await supabase
                .from("episodes")
                .select("id")
                .eq("podcast_id", podcast.id)
                .then(res => res.data?.map(e => e.id) || [])
            );
          
          return {
            ...podcast,
            activeAdCount: count || 0
          };
        })
      );

      return podcastsWithCounts;
    },
    enabled: !!user,
  });


  const { data: adSlots } = useQuery({
    queryKey: ["ad-slots", selectedPodcast],
    queryFn: async () => {
      if (!selectedPodcast) return [];
      
      const { data, error } = await supabase
        .from("ad_slots")
        .select(`
          *,
          episodes:episode_id(title)
        `)
        .eq("episodes.podcast_id", selectedPodcast)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPodcast,
  });

  const createAdSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const { error } = await supabase
        .from("podcast_ad_settings")
        .upsert({
          ...settings,
          podcast_id: selectedPodcast,
          user_id: user?.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcast-ad-settings"] });
      toast.success("Ad settings updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  const uploadAdMutation = useMutation({
    mutationFn: async ({ file, episodeId, slotType, position, ctaUrl, ctaText }: any) => {
      setUploadingAd(true);
      
      // Upload audio file
      const fileName = `${user?.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ad-audio")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("ad-audio")
        .getPublicUrl(uploadData.path);
      
      // Create ad slot with CTA
      const { error: slotError } = await supabase
        .from("ad_slots")
        .insert({
          episode_id: episodeId,
          slot_type: slotType,
          position_seconds: position || 0,
          manual_audio_url: publicUrl,
          ad_source: "manual",
          status: "filled",
          cta_url: ctaUrl || null,
          cta_text: ctaText || 'Learn More',
        });
      
      if (slotError) throw slotError;
    },
    onSuccess: () => {
      setUploadingAd(false);
      setSelectedEpisode("");
      setSelectedFile(null);
      setCtaUrl("");
      setCtaText("Learn More");
      queryClient.invalidateQueries({ queryKey: ["ad-slots"] });
      toast.success("Ad uploaded successfully");
    },
    onError: (error) => {
      setUploadingAd(false);
      toast.error("Failed to upload ad: " + error.message);
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (adSlotId: string) => {
      const { error } = await supabase
        .from("ad_slots")
        .delete()
        .eq("id", adSlotId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-slots"] });
      toast.success("Ad deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete ad: " + error.message);
    },
  });


  const handleUploadAd = () => {
    if (!selectedEpisode) {
      toast.error("Please select an episode");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select an audio file");
      return;
    }

    // Validate CTA URL if provided
    if (ctaUrl && !ctaUrl.startsWith('http://') && !ctaUrl.startsWith('https://')) {
      toast.error("CTA URL must start with http:// or https://");
      return;
    }

    // Show upload confirmation dialog
    setShowUploadConfirmation(true);
  };

  const handlePodcastSelection = (podcastId: string) => {
    // Check if this podcast has been confirmed before
    if (!confirmedPodcasts.has(podcastId)) {
      setSelectedPodcast(podcastId);
      setShowRightsConfirmation(true);
    } else {
      setSelectedPodcast(podcastId);
    }
  };

  const confirmPodcastRights = () => {
    if (selectedPodcast) {
      const updated = new Set(confirmedPodcasts).add(selectedPodcast);
      setConfirmedPodcasts(updated);
      localStorage.setItem('confirmedAdRightsPodcasts', JSON.stringify([...updated]));
      setShowRightsConfirmation(false);
    }
  };

  const cancelPodcastSelection = () => {
    setSelectedPodcast("");
    setShowRightsConfirmation(false);
  };

  const confirmUploadAd = () => {
    setShowUploadConfirmation(false);

    uploadAdMutation.mutate({
      file: selectedFile,
      episodeId: selectedEpisode,
      slotType: selectedPosition,
      position: 0,
      ctaUrl: ctaUrl.trim() || null,
      ctaText: ctaText.trim() || 'Learn More',
    });
  };

  const { data: episodes } = useQuery({
    queryKey: ["episodes", selectedPodcast],
    queryFn: async () => {
      if (!selectedPodcast) return [];
      
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("podcast_id", selectedPodcast)
        .order("publish_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedPodcast,
  });

  const updateAdCtaMutation = useMutation({
    mutationFn: async ({ adSlotId, ctaUrl, ctaText }: any) => {
      const { error } = await supabase
        .from("ad_slots")
        .update({
          cta_url: ctaUrl || null,
          cta_text: ctaText || 'Learn More',
        })
        .eq("id", adSlotId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-slots"] });
      toast.success("CTA updated successfully");
      setEditDialogOpen(false);
      setEditingAdSlot(null);
    },
    onError: (error) => {
      toast.error("Failed to update CTA: " + error.message);
    },
  });

  const handleUpdateCta = () => {
    if (!editingAdSlot) return;

    // Validate CTA URL if provided
    if (editingAdSlot.cta_url && !editingAdSlot.cta_url.startsWith('http://') && !editingAdSlot.cta_url.startsWith('https://')) {
      toast.error("CTA URL must start with http:// or https://");
      return;
    }

    updateAdCtaMutation.mutate({
      adSlotId: editingAdSlot.id,
      ctaUrl: editingAdSlot.cta_url?.trim() || null,
      ctaText: editingAdSlot.cta_text?.trim() || 'Learn More',
    });
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Podcast Monetization</h1>
        <p className="text-muted-foreground">
          Manage your podcast ads and monetization settings
        </p>
      </div>

      {/* Podcast Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Podcast</CardTitle>
          <CardDescription>Choose which podcast to manage ads for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {podcasts?.map((podcast) => {
              const activeAdCount = adCounts?.[podcast.id] || 0;
              return (
                <Card
                  key={podcast.id}
                  className={`cursor-pointer transition-colors ${
                    selectedPodcast === podcast.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handlePodcastSelection(podcast.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{podcast.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {allEpisodes?.filter(e => e.podcast_id === podcast.id).length || 0} episodes
                        </p>
                      </div>
                      {activeAdCount > 0 && (
                        <div className="flex items-center gap-1 ml-2">
                          <Radio className="h-4 w-4 text-green-500 animate-pulse" />
                          <Badge variant="outline" className="text-xs">
                            {activeAdCount}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedPodcast && (
        <>
          {/* Available Campaigns Browser */}
          {adSettings?.platform_ads_enabled && (
            <Card>
              <CardHeader>
                <CardTitle>Available Campaigns</CardTitle>
                <CardDescription>
                  Browse and opt-in to advertising campaigns that match your podcast
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignBrowser 
                  podcastId={selectedPodcast} 
                  minimumCpm={adSettings?.minimum_cpm || 15} 
                />
              </CardContent>
            </Card>
          )}

          {/* Monetization Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Monetization Settings
              </CardTitle>
              <CardDescription>
                Configure how your podcast earns money through ads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Enable Platform Ads */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Platform Ads</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow our ad network to place ads in your episodes
                  </div>
                </div>
                <Switch
                  checked={adSettings?.platform_ads_enabled || false}
                  onCheckedChange={(checked) =>
                    createAdSettingsMutation.mutate({
                      ...adSettings,
                      platform_ads_enabled: checked,
                    })
                  }
                />
              </div>

              {adSettings?.platform_ads_enabled && (
                <>
                  {/* Step 2: Set Minimum CPM */}
                  <div className="space-y-2">
                    <Label>Minimum CPM (Cost Per 1000 impressions)</Label>
                    <div className="text-sm text-muted-foreground mb-3">
                      Only campaigns offering at least this amount will be available to you
                    </div>
                    <div className="px-3">
                      <Slider
                        value={[adSettings?.minimum_cpm || 15]}
                        onValueChange={([value]) =>
                          createAdSettingsMutation.mutate({
                            ...adSettings,
                            minimum_cpm: value,
                          })
                        }
                        max={100}
                        min={5}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      ${adSettings?.minimum_cpm || 15} CPM minimum
                    </div>
                  </div>

                  {/* Step 3: Revenue Share Info */}
                  <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-1 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Your Revenue Share
                    </h4>
                    <p className="text-sm">
                      You'll earn <strong className="text-primary">{adSettings?.revenue_share_percentage || 70}%</strong> of all ad revenue.
                      Platform keeps {100 - (adSettings?.revenue_share_percentage || 70)}%.
                    </p>
                  </div>

                  {/* Step 4: Choose Campaign Mode */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-base">How do you want to manage campaigns?</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        Choose between automatic matching or manual selection
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Card
                        className={`cursor-pointer transition-all ${
                          adSettings?.ad_mode === 'auto' ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() =>
                          createAdSettingsMutation.mutate({
                            ...adSettings,
                            ad_mode: 'auto',
                          })
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">Auto Mode</h4>
                            {adSettings?.ad_mode === 'auto' && (
                              <Badge className="bg-primary">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            We automatically match campaigns that meet your minimum CPM
                          </p>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all ${
                          adSettings?.ad_mode === 'manual' ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() =>
                          createAdSettingsMutation.mutate({
                            ...adSettings,
                            ad_mode: 'manual',
                          })
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">Manual Mode</h4>
                            {adSettings?.ad_mode === 'manual' && (
                              <Badge className="bg-primary">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Browse and choose specific campaigns to run on your podcast
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Auto-approve only shows in Auto mode */}
                  {adSettings?.ad_mode === 'auto' && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base">Auto-approve Matched Campaigns</Label>
                        <div className="text-sm text-muted-foreground">
                          Start running campaigns immediately when they match your criteria
                        </div>
                      </div>
                      <Switch
                        checked={adSettings?.auto_approve_ads || false}
                        onCheckedChange={(checked) =>
                          createAdSettingsMutation.mutate({
                            ...adSettings,
                            auto_approve_ads: checked,
                          })
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Campaign Browser for Manual Mode */}
          {adSettings?.platform_ads_enabled && adSettings?.ad_mode === 'manual' && (
            <Card>
              <CardHeader>
                <CardTitle>Campaign Marketplace</CardTitle>
                <CardDescription>
                  Browse and select campaigns to run on your podcast
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignBrowser 
                  podcastId={selectedPodcast}
                  minimumCpm={adSettings?.minimum_cpm || 15}
                />
              </CardContent>
            </Card>
          )}

          {/* Manual Ad Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Your Own Ads
              </CardTitle>
              <CardDescription>
                Upload audio ads to place in specific episodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Episode</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(e.target.value)}
                    >
                      <option value="">Choose an episode...</option>
                      {episodes?.map((episode) => (
                        <option key={episode.id} value={episode.id}>
                          {episode.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ad Position</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                    >
                      <option value="pre">Pre-roll (Before episode)</option>
                      <option value="mid">Mid-roll (During episode)</option>
                      <option value="post">Post-roll (After episode)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Audio File</Label>
                    <Input 
                      type="file" 
                      accept="audio/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Call-to-Action URL (Optional)</Label>
                    <Input 
                      type="url"
                      placeholder="https://example.com/landing-page"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Add a link listeners can click during the ad
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>CTA Button Text (Optional)</Label>
                    <Input 
                      type="text"
                      placeholder="Learn More"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      maxLength={30}
                    />
                    <p className="text-xs text-muted-foreground">
                      Custom text for the CTA button (e.g., "Visit Website", "Get 20% Off")
                    </p>
                  </div>
                  
                  <Button 
                    disabled={uploadingAd || !selectedEpisode || !selectedFile}
                    className="w-full"
                    onClick={handleUploadAd}
                  >
                    {uploadingAd ? "Uploading..." : "Upload Ad"}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Ad Guidelines</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Audio should be high quality (44.1kHz, 16-bit minimum)</li>
                    <li>• Recommended length: 15-60 seconds</li>
                    <li>• Format: MP3, WAV, or AAC</li>
                    <li>• Include clear call-to-action</li>
                    <li>• Keep it relevant to your audience</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Ad Slots */}
          {adSlots && adSlots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Current Ad Slots</CardTitle>
                <CardDescription>Manage your existing ad placements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adSlots.map((slot: any) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={slot.status === "filled" ? "default" : "secondary"}>
                          {slot.slot_type === 'pre' ? 'Pre-roll' : 
                           slot.slot_type === 'mid' ? 'Mid-roll' : 
                           slot.slot_type === 'post' ? 'Post-roll' : slot.slot_type}
                        </Badge>
                        <div>
                          <p className="font-medium">{slot.episodes?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {slot.ad_source === "manual" ? "Your ad" : "Platform ad"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {slot.cta_url && (
                          <Badge variant="outline" className="gap-1">
                            <ExternalLink className="h-3 w-3" />
                            CTA
                          </Badge>
                        )}
                        <Dialog open={editDialogOpen && editingAdSlot?.id === slot.id} onOpenChange={(open) => {
                          setEditDialogOpen(open);
                          if (!open) setEditingAdSlot(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAdSlot({
                                  id: slot.id,
                                  cta_url: slot.cta_url || '',
                                  cta_text: slot.cta_text || 'Learn More'
                                });
                                setEditDialogOpen(true);
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Edit CTA
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Call-to-Action</DialogTitle>
                              <DialogDescription>
                                Update the CTA link and button text for this ad
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>CTA URL</Label>
                                <Input
                                  type="url"
                                  placeholder="https://example.com/landing-page"
                                  value={editingAdSlot?.cta_url || ''}
                                  onChange={(e) => setEditingAdSlot({
                                    ...editingAdSlot,
                                    cta_url: e.target.value
                                  })}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Leave empty to remove the CTA button
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label>CTA Button Text</Label>
                                <Input
                                  type="text"
                                  placeholder="Learn More"
                                  value={editingAdSlot?.cta_text || 'Learn More'}
                                  onChange={(e) => setEditingAdSlot({
                                    ...editingAdSlot,
                                    cta_text: e.target.value
                                  })}
                                  maxLength={30}
                                />
                              </div>
                              <Button
                                onClick={handleUpdateCta}
                                className="w-full"
                                disabled={updateAdCtaMutation.isPending}
                              >
                                {updateAdCtaMutation.isPending ? 'Updating...' : 'Update CTA'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteAdMutation.mutate(slot.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Rights Confirmation Dialog */}
      <Dialog open={showRightsConfirmation} onOpenChange={setShowRightsConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirm Advertising Rights
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p>
                Before adding advertisements to this podcast, please confirm that you have the legal rights to monetize this content with ads.
              </p>
              <p className="font-medium text-foreground">
                I confirm that:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>I own the rights to this podcast content OR have explicit permission from the rights holder</li>
                <li>I have the authority to add advertisements to this podcast</li>
                <li>The podcast content complies with advertising standards and guidelines</li>
                <li>I understand that unauthorized monetization may violate copyright laws</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelPodcastSelection}>
              Cancel
            </Button>
            <Button onClick={confirmPodcastRights}>
              I Confirm - Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Confirmation Dialog */}
      <Dialog open={showUploadConfirmation} onOpenChange={setShowUploadConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Final Confirmation
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p>
                You are about to upload and publish an advertisement to your podcast episode.
              </p>
              <p className="font-medium text-foreground">
                Please confirm:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>You have the rights to add this advertisement to your podcast</li>
                <li>The ad content complies with advertising standards</li>
                <li>You understand this ad will be played to your podcast listeners</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowUploadConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={confirmUploadAd}>
              Confirm & Upload Ad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}