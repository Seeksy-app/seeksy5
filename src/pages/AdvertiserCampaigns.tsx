import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Play, Pause, TrendingUp, DollarSign, Eye, Trash2, Edit, Zap, Users } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdvertiserCampaigns() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["advertiser-campaigns", advertiser?.id],
    queryFn: async () => {
      if (!advertiser) return [];
      const result = await (supabase as any)
        .from("ad_campaigns")
        .select(`
          *,
          ad_creatives(*),
          audio_ads(id, ad_type, voice_name, duration_seconds, audio_url, campaign_id)
        `)
        .eq("advertiser_id", advertiser.id)
        .order("created_at", { ascending: false });
      
      if (result.error) throw result.error;
      const data = result.data as any[];

      // For quick campaigns, fetch matched creators data
      const campaignsWithMetrics = await Promise.all((data || []).map(async (campaign) => {
        if (campaign.campaign_type === 'quick') {
          const targetCategories = (campaign.targeting_rules as any)?.categories as string[] | undefined;
          
          if (targetCategories && targetCategories.length > 0) {
            // Get matched creators
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, my_page_ad_id, my_page_video_type, categories")
              .not("categories", "is", null);

            const matched = profiles?.filter((profile: any) => {
              const profileCategories = profile.categories || [];
              return targetCategories.some((cat: string) => profileCategories.includes(cat));
            }) || [];

            // Count live creators (those actually displaying this ad)
            const adId = campaign.audio_ads?.[0]?.id;
            const liveCount = matched.filter((profile: any) => 
              profile.my_page_ad_id === adId && profile.my_page_video_type === 'ad'
            ).length;

            // Fetch impression count for this campaign
            const { data: impressionData } = await supabase
              .from("ad_impressions")
              .select("id", { count: 'exact' })
              .eq("campaign_id", campaign.id);

            return {
              ...campaign,
              matchedCreators: matched.length,
              liveCreators: liveCount,
              impressionCount: impressionData?.length || 0
            };
          }
        }
        return campaign;
      }));

      return campaignsWithMetrics;
    },
    enabled: !!advertiser,
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const toggleCampaignStatus = useMutation({
    mutationFn: async ({ campaignId, newStatus }: { campaignId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("ad_campaigns")
        .update({ status: newStatus })
        .eq("id", campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertiser-campaigns"] });
      toast.success("Campaign status updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update campaign: " + error.message);
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from("ad_campaigns")
        .delete()
        .eq("id", campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertiser-campaigns"] });
      toast.success("Campaign deleted successfully! 🗑️");
    },
    onError: (error: any) => {
      toast.error("Failed to delete campaign: " + error.message);
    },
  });

  if (!advertiser || advertiser.status !== "approved") {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need an approved advertiser account to manage campaigns.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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

  const canActivateCampaign = (campaign: any) => {
    // TODO: Check wallet balance instead of account_balance
    const hasBalance = true; // Placeholder until wallet integration
    const hasBudget = Number(campaign.total_budget) > 0;
    const isValidDates = new Date(campaign.start_date) <= new Date() && new Date(campaign.end_date) >= new Date();
    return hasBalance && hasBudget && isValidDates;
  };

  const canEditCampaign = (campaign: any) => {
    // Can edit if draft
    if (campaign.status === "draft") return true;
    
    // Can edit if more than 24 hours before start date
    const hoursUntilStart = differenceInHours(new Date(campaign.start_date), new Date());
    if (hoursUntilStart > 24) return true;
    
    return false;
  };

  const canDeleteCampaign = (campaign: any) => {
    // Can delete if draft or pending
    return campaign.status === "draft" || campaign.status === "pending";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Campaigns</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage your advertising campaigns
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/advertiser/campaigns/create-type")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Account Balance Warning - TODO: Use wallets table */}
        {false && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Low Balance
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    Your account balance is low. Add funds to activate campaigns.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate("/advertiser/dashboard")}
                  >
                    Add Funds
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaigns List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">Loading campaigns...</p>
              </CardContent>
            </Card>
          ) : campaigns && campaigns.length > 0 ? (
            campaigns.map((campaign) => {
              const budgetRemaining = Number(campaign.total_budget) - Number(campaign.total_spent || 0);
              const percentSpent = (Number(campaign.total_spent || 0) / Number(campaign.total_budget)) * 100;
              
              return (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle>{campaign.name}</CardTitle>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status.toUpperCase()}
                            </Badge>
                            {campaign.campaign_type === 'quick' && (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                <Zap className="h-3 w-3 mr-1" />
                                Quick Campaign
                              </Badge>
                            )}
                            {campaign.ad_creatives && campaign.ad_creatives.length > 0 && (
                              <Badge variant="outline">
                                {campaign.ad_creatives[0].format === "video" ? "📹 Video" : 
                                 campaign.audio_ads?.[0]?.ad_type === "conversational" ? "🎙️ Conversational" : "🔊 Audio"} Ad
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {format(new Date(campaign.start_date), "MMM d, yyyy")} - {format(new Date(campaign.end_date), "MMM d, yyyy")}
                          </CardDescription>
                        </div>
                      <div className="flex gap-2">
                        {canEditCampaign(campaign) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/advertiser/campaigns/${campaign.id}/edit`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        {campaign.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCampaignStatus.mutate({ 
                              campaignId: campaign.id, 
                              newStatus: "paused" 
                            })}
                            disabled={toggleCampaignStatus.isPending}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        )}
                        {(campaign.status === "paused" || campaign.status === "draft") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCampaignStatus.mutate({ 
                              campaignId: campaign.id, 
                              newStatus: "active" 
                            })}
                            disabled={toggleCampaignStatus.isPending || !canActivateCampaign(campaign)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/advertiser/campaigns/${campaign.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {canDeleteCampaign(campaign) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the campaign "{campaign.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCampaign.mutate(campaign.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="text-lg font-semibold">${Number(campaign.total_budget).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Spent</p>
                        <p className="text-lg font-semibold text-red-600">
                          ${Number(campaign.total_spent || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${budgetRemaining.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Impressions</p>
                        <p className="text-lg font-semibold">
                          {campaign.total_impressions?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                    
                    {/* Budget Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Budget Usage</span>
                        <span className="font-medium">{percentSpent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            percentSpent > 90 ? "bg-red-500" : 
                            percentSpent > 75 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(percentSpent, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        CPM: ${Number(campaign.cpm_bid).toFixed(2)}
                      </div>
                      <div>
                        Created: {format(new Date(campaign.created_at), "MMM d, yyyy")}
                      </div>
                      {campaign.campaign_type === 'quick' && (campaign as any).matchedCreators !== undefined && (
                        <>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {(campaign as any).matchedCreators} matched
                          </div>
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <Users className="h-4 w-4" />
                            {(campaign as any).liveCreators || 0} live
                          </div>
                          {(campaign as any).impressionCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {(campaign as any).impressionCount} impressions
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first campaign to start advertising
                </p>
                <Button onClick={() => navigate("/advertiser/campaigns/create-type")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
