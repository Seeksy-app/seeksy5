import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Play, Mic, Phone, Monitor, Loader2, RefreshCw, ExternalLink, ArrowLeft, MoreVertical, ArrowUpDown, Square, CheckCircle, Zap, Edit } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { QuickCampaignDialog } from "@/components/advertiser/QuickCampaignDialog";

export default function AdvertiserAdLibrary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentTab, setCurrentTab] = useState('all');
  const [playingAdId, setPlayingAdId] = useState<string | null>(null);
  const [quickCampaignDialog, setQuickCampaignDialog] = useState<{ open: boolean; adId: string; adType: 'audio' | 'video' } | null>(null);
  const [renamingAd, setRenamingAd] = useState<{ id: string; currentName: string; type: string } | null>(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: advertiser, isLoading: advertiserLoading } = useQuery({
    queryKey: ["advertiser", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("advertisers")
        .select("*")
        .eq("owner_profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Helper function to identify video ads - defined BEFORE use
  const isVideoAd = (ad: any) => {
    if (!ad?.audio_url) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    return videoExtensions.some(ext => ad.audio_url.toLowerCase().endsWith(ext));
  };

  const { data: audioAds, isLoading: audioAdsLoading } = useQuery({
    queryKey: ["audio-ads", advertiser?.id],
    queryFn: async () => {
      if (!advertiser) return [];
      const { data, error } = await supabase
        .from("audio_ads")
        .select(`
          *,
          ad_campaigns (
            id,
            name,
            status,
            campaign_type
          )
        `)
        .eq("advertiser_id", advertiser.id)
        .order("created_at", { ascending: sortOrder === 'asc' });
      
      if (error) throw error;
      return data.map((ad: any) => ({ ...ad, type: 'audio' }));
    },
    enabled: !!advertiser,
  });

  const { data: digitalAds, isLoading: digitalAdsLoading } = useQuery({
    queryKey: ["digital-ads", advertiser?.id],
    queryFn: async () => {
      if (!advertiser) return [];
      const { data, error } = await supabase
        .from("digital_ads")
        .select("*")
        .eq("advertiser_id", advertiser.id)
        .order("created_at", { ascending: sortOrder === 'asc' });
      
      if (error) throw error;
      return data.map((ad: any) => ({ ...ad, type: 'digital' }));
    },
    enabled: !!advertiser,
  });

  const isLoading = advertiserLoading || audioAdsLoading || digitalAdsLoading;
  const allAds = [...(audioAds || []), ...(digitalAds || [])];

  // Separate video and audio ads
  const videoAds = (audioAds || []).filter(ad => isVideoAd(ad));
  const pureAudioAds = (audioAds || []).filter(ad => !isVideoAd(ad));
  const aiAudioAds = pureAudioAds.filter(ad => ad.voice_id); // AI-generated have voice_id

  const filteredAds = currentTab === 'all' 
    ? allAds 
    : currentTab === 'audio'
    ? pureAudioAds
    : currentTab === 'ai-audio'
    ? aiAudioAds
    : currentTab === 'video'
    ? videoAds
    : digitalAds || [];

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Show loading state while fetching user or advertiser data
  if (userLoading || advertiserLoading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading your ad library...</p>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Advertiser Account Required</CardTitle>
            <CardDescription>
              You need an advertiser account to access the ad library and create campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an advertiser account to start running ad campaigns and managing your advertisements.
            </p>
            <Button onClick={() => navigate("/advertiser/signup")}>
              Create Advertiser Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const retryGeneration = useMutation({
    mutationFn: async (audioAd: any) => {
      const { error: updateError } = await supabase
        .from('audio_ads')
        .update({ status: 'generating' })
        .eq('id', audioAd.id);

      if (updateError) throw updateError;

      const { error } = await supabase.functions.invoke('elevenlabs-generate-audio', {
        body: {
          audioAdId: audioAd.id,
          script: audioAd.script,
          voiceId: audioAd.voice_id,
          voiceName: audioAd.voice_name,
        },
      });

      if (error) {
        await supabase
          .from('audio_ads')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', audioAd.id);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Regenerating audio",
        description: "Your audio ad is being regenerated.",
      });
      queryClient.invalidateQueries({ queryKey: ['audio-ads'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to regenerate",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (ad: any) => {
    if (ad.type === 'digital') {
      if (ad.status === 'ready') {
        return <Badge className="bg-yellow-500">Ready</Badge>;
      }
      if (ad.status === 'live') {
        return <Badge className="bg-green-500">Live</Badge>;
      }
    }

    if (ad.status === "generating") {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Generating
      </Badge>;
    }
    
    if (ad.status === "pending") {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
        Pending Approval
      </Badge>;
    }
    
    if (ad.status === "failed") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    
    if (ad.status === "ready" || ad.status === "completed") {
      if (ad.campaign_id && ad.ad_campaigns) {
        const campaignStatus = ad.ad_campaigns.status;
        if (campaignStatus === "active") {
          return <Badge className="bg-green-500">Live</Badge>;
        }
        return <Badge variant="secondary">In Campaign</Badge>;
      }
      return <Badge variant="default">Ready</Badge>;
    }
    
    return <Badge variant="outline">{ad.status}</Badge>;
  };

  const getAdTypeInfo = (ad: any) => {
    if (ad.type === 'digital') {
      return {
        icon: Monitor,
        label: "Digital Ad",
        color: "text-orange-600",
      };
    }
    if (ad.ad_type === "conversational") {
      return {
        icon: Phone,
        label: "Conversational",
        color: "text-purple-600",
      };
    }
    if (isVideoAd(ad)) {
      return {
        icon: Monitor,
        label: "Video Ad",
        color: "text-purple-600",
      };
    }
    return {
      icon: Mic,
      label: "Audio",
      color: "text-blue-600",
    };
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/advertiser/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ad Library</h1>
            <p className="text-muted-foreground mt-2">
              All your generated advertisements
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/advertiser/create-ad-wizard")} size="lg">
              🎙️ Create AI Campaign
            </Button>
            <Button onClick={() => navigate("/advertiser/campaigns/create-type")} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Ad
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Advertisements</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSort}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Sort by Date ({sortOrder === 'asc' ? 'Oldest' : 'Newest'})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList>
                <TabsTrigger value="all">
                  All ({allAds.length})
                </TabsTrigger>
                <TabsTrigger value="audio">
                  Audio ({pureAudioAds.length})
                </TabsTrigger>
                <TabsTrigger value="ai-audio">
                  AI Audio ({pureAudioAds.filter(ad => ad.voice_id).length})
                </TabsTrigger>
                <TabsTrigger value="video">
                  Video ({videoAds.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={currentTab} className="mt-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-4">Loading your ads...</p>
                  </div>
                ) : filteredAds.length === 0 ? (
                  <div className="text-center py-12">
                    <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No ads yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first ad to get started
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => navigate("/advertiser/create-ad-wizard")}>
                        Create AI Campaign
                      </Button>
                      <Button onClick={() => navigate("/advertiser/campaigns/create-type")} variant="outline">
                        Create Ad
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Preview</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAds.map((ad) => {
                          const typeInfo = getAdTypeInfo(ad);
                          const TypeIcon = typeInfo.icon;
                          
                          return (
                            <TableRow key={ad.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg bg-muted ${typeInfo.color}`}>
                                    <TypeIcon className="h-4 w-4" />
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {typeInfo.label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {ad.thumbnail_url || ad.image_url || ad.video_url || (isVideoAd(ad) && ad.audio_url) ? (
                                  <div className={`rounded overflow-hidden bg-muted flex items-center justify-center ${isVideoAd(ad) ? 'w-28 h-16' : 'w-16 h-16'}`}>
                                    {ad.thumbnail_url ? (
                                      <img 
                                        src={ad.thumbnail_url} 
                                        alt="Ad preview"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : ad.image_url ? (
                                      <img 
                                        src={ad.image_url} 
                                        alt="Ad preview"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (isVideoAd(ad) && ad.audio_url) ? (
                                      <video 
                                        src={ad.audio_url} 
                                        className="w-full h-full object-cover"
                                        muted
                                      />
                                    ) : ad.video_url ? (
                                      <video 
                                        src={ad.video_url} 
                                        className="w-full h-full object-cover"
                                        muted
                                      />
                                    ) : null}
                                  </div>
                                ) : (
                                  <div className={`rounded bg-muted flex items-center justify-center ${isVideoAd(ad) ? 'w-28 h-16' : 'w-16 h-16'}`}>
                                    <TypeIcon className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(ad)}
                              </TableCell>
                              <TableCell>
                                <div className="max-w-md space-y-1">
                                  {ad.type === 'digital' ? (
                                    <>
                                      <p className="text-sm font-medium">{ad.ad_size_preset}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {ad.platform_type.replace('_', ' ')} • {ad.width}×{ad.height}
                                      </p>
                                    </>
                                   ) : (
                                    <>
                                      <div className="flex items-center gap-2 mb-1">
                                        {ad.campaign_name && (
                                          <p className="text-sm font-medium">{ad.campaign_name}</p>
                                        )}
                                        {isVideoAd(ad) && ad.campaign_id && ad.ad_campaigns?.campaign_type && (
                                          <Badge variant="secondary" className="text-xs">
                                            {ad.ad_campaigns.campaign_type === 'quick' ? 'Quick' : 'Full'}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm line-clamp-1">
                                        {ad.script === "Uploaded pre-made ad" && ad.audio_url 
                                          ? ad.audio_url.split('/').pop()?.split('?')[0] || ad.script
                                          : ad.script
                                        }
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {ad.duration_seconds && <span>{ad.duration_seconds}s</span>}
                                        {ad.voice_name && <span>• {ad.voice_name}</span>}
                                        {isVideoAd(ad) && <span>• Video</span>}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(ad.created_at), "MMM d, yyyy")}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {ad.type === 'audio' && ad.audio_url && !isVideoAd(ad) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (playingAdId === ad.id) {
                                          // Stop current playback
                                          if (currentAudioRef.current) {
                                            currentAudioRef.current.pause();
                                            currentAudioRef.current.currentTime = 0;
                                            currentAudioRef.current = null;
                                          }
                                          setPlayingAdId(null);
                                        } else {
                                          // Stop any other playing audio
                                          if (currentAudioRef.current) {
                                            currentAudioRef.current.pause();
                                            currentAudioRef.current.currentTime = 0;
                                          }
                                          
                                          const audio = new Audio(ad.audio_url);
                                          currentAudioRef.current = audio;
                                          setPlayingAdId(ad.id);
                                          audio.play();
                                          audio.onended = () => {
                                            currentAudioRef.current = null;
                                            setPlayingAdId(null);
                                          };
                                        }
                                      }}
                                    >
                                      {playingAdId === ad.id ? (
                                        <Square className="h-4 w-4" />
                                      ) : (
                                        <Play className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  {ad.type === 'audio' && isVideoAd(ad) && ad.audio_url && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(ad.audio_url, '_blank')}
                                    >
                                      <Play className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {ad.type === 'audio' && ad.campaign_name && ad.promo_code && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => navigate(`/advertiser/campaigns/${ad.id}/dashboard`)}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent align="end">
                                       <DropdownMenuItem
                                         onClick={() => {
                                           const currentName = ad.campaign_name || ad.script?.substring(0, 50) || 'Untitled';
                                           setRenamingAd({ id: ad.id, currentName, type: ad.type });
                                         }}
                                       >
                                         <Edit className="h-4 w-4 mr-2" />
                                         Rename
                                       </DropdownMenuItem>
                                       {ad.type === 'audio' && ad.status === "pending" && (
                                          <DropdownMenuItem 
                                            onClick={async () => {
                                              const { error } = await supabase
                                                .from('audio_ads')
                                                .update({ status: 'ready' })
                                                .eq('id', ad.id);
                                              
                                              if (error) {
                                                toast({
                                                  title: "Error",
                                                  description: "Failed to approve ad",
                                                  variant: "destructive",
                                                });
                                              } else {
                                                toast({
                                                  title: "Ad Approved! 🎉",
                                                  description: "Your ad is now ready to use in campaigns.",
                                                });
                                                queryClient.invalidateQueries({ queryKey: ['audio-ads'] });
                                              }
                                            }}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                            Approve Ad
                                          </DropdownMenuItem>
                                        )}
                                        {ad.type === 'audio' && ad.status === "failed" && (
                                          <DropdownMenuItem onClick={() => retryGeneration.mutate(ad)}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Retry Generation
                                          </DropdownMenuItem>
                                        )}
                                        {!ad.campaign_id && (ad.status === "ready" || ad.status === "completed") && (
                                          <>
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                const adType = isVideoAd(ad) ? 'video' : 'audio';
                                                setQuickCampaignDialog({ open: true, adId: ad.id, adType });
                                              }}
                                            >
                                              <Zap className="h-4 w-4 mr-2 text-purple-600" />
                                              Quick Campaign
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              onClick={() => navigate(`/advertiser/campaigns/create?${ad.type === 'audio' ? 'audioAdId' : 'digitalAdId'}=${ad.id}`)}
                                            >
                                              <Plus className="h-4 w-4 mr-2" />
                                              Full Campaign
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                       {ad.campaign_id && ad.ad_campaigns && (
                                         <DropdownMenuItem 
                                           onClick={() => navigate(`/advertiser/campaigns/${ad.campaign_id}`)}
                                         >
                                           <ExternalLink className="h-4 w-4 mr-2" />
                                           View Campaign
                                         </DropdownMenuItem>
                                       )}
                                     </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {quickCampaignDialog && (
        <QuickCampaignDialog
          open={quickCampaignDialog.open}
          onOpenChange={(open) => !open && setQuickCampaignDialog(null)}
          adId={quickCampaignDialog.adId}
          adType={quickCampaignDialog.adType}
        />
      )}

      {renamingAd && (
        <Dialog open={!!renamingAd} onOpenChange={(open) => !open && setRenamingAd(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Ad</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Ad Name</label>
                <Input
                  id="rename-input"
                  defaultValue={renamingAd.currentName}
                  placeholder="Enter ad name"
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenamingAd(null)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const input = document.getElementById('rename-input') as HTMLInputElement;
                  const newName = input?.value?.trim();
                  
                  if (!newName) {
                    toast({
                      title: "Error",
                      description: "Please enter a name",
                      variant: "destructive",
                    });
                    return;
                  }

                  const tableName = renamingAd.type === 'audio' ? 'audio_ads' : 'digital_ads';
                  const { error } = await supabase
                    .from(tableName)
                    .update({ campaign_name: newName })
                    .eq('id', renamingAd.id);

                  if (error) {
                    toast({
                      title: "Error",
                      description: "Failed to rename ad",
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: "Success",
                      description: "Ad renamed successfully",
                    });
                    queryClient.invalidateQueries({ queryKey: ['audio-ads'] });
                    queryClient.invalidateQueries({ queryKey: ['digital-ads'] });
                    setRenamingAd(null);
                  }
                }}
              >
                Rename
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
