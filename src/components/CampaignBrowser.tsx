import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, DollarSign, TrendingUp, CheckCircle2, XCircle, Sparkles, Info } from "lucide-react";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CampaignBrowserProps {
  podcastId: string;
  minimumCpm: number;
}

export default function CampaignBrowser({ podcastId, minimumCpm }: CampaignBrowserProps) {
  const queryClient = useQueryClient();
  const [matchScores, setMatchScores] = useState<Record<string, any>>({});
  const [loadingScores, setLoadingScores] = useState(false);

  // Fetch available campaigns
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["available-campaigns", podcastId, minimumCpm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("status", "active")
        .gte("cpm_bid", minimumCpm)
        .order("cpm_bid", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!podcastId,
  });

  // Fetch current selections
  const { data: selections } = useQuery({
    queryKey: ["campaign-selections", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcast_campaign_selections")
        .select("campaign_id")
        .eq("podcast_id", podcastId);

      if (error) throw error;
      return new Set(data.map(s => s.campaign_id));
    },
    enabled: !!podcastId,
  });

  const toggleCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, optIn }: { campaignId: string; optIn: boolean }) => {
      if (optIn) {
        const { error } = await supabase
          .from("podcast_campaign_selections")
          .insert({
            podcast_id: podcastId,
            campaign_id: campaignId,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("podcast_campaign_selections")
          .delete()
          .eq("podcast_id", podcastId)
          .eq("campaign_id", campaignId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { optIn }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-selections"] });
      toast.success(optIn ? "Campaign added successfully" : "Campaign removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to update campaign: " + error.message);
    },
  });

  const isSelected = (campaignId: string) => selections?.has(campaignId) || false;

  // Fetch AI match scores when campaigns load
  useEffect(() => {
    if (!campaigns || campaigns.length === 0) return;
    
    const fetchMatchScores = async () => {
      setLoadingScores(true);
      const scores: Record<string, any> = {};
      
      for (const campaign of campaigns) {
        try {
          const { data, error } = await supabase.functions.invoke('match-campaign-to-podcast', {
            body: { campaignId: campaign.id, podcastId }
          });
          
          if (!error && data) {
            scores[campaign.id] = data;
          }
        } catch (error) {
          console.error(`Failed to get match score for campaign ${campaign.id}:`, error);
        }
      }
      
      setMatchScores(scores);
      setLoadingScores(false);
    };
    
    fetchMatchScores();
  }, [campaigns, podcastId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    if (score >= 60) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">Available Campaigns</h3>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI Matched
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Campaigns meeting your minimum CPM (${minimumCpm}) with AI-powered match scores
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const matchScore = matchScores[campaign.id];
            
            return (
              <Card
                key={campaign.id}
                className={`transition-all ${
                  isSelected(campaign.id) ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-semibold text-lg">{campaign.name}</h4>
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                          Active
                        </Badge>
                        {isSelected(campaign.id) && (
                          <Badge className="bg-primary">Selected</Badge>
                        )}
                        {matchScore && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className={`gap-1 ${getScoreBadgeColor(matchScore.score)}`}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  {matchScore.score}% Match
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <div className="space-y-2">
                                  <p className="font-semibold">AI Match Analysis</p>
                                  <p className="text-sm">{matchScore.reasoning}</p>
                                  {matchScore.strengths && matchScore.strengths.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-green-600 dark:text-green-400">Strengths:</p>
                                      <ul className="text-xs list-disc pl-4">
                                        {matchScore.strengths.map((s: string, i: number) => (
                                          <li key={i}>{s}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {matchScore.considerations && matchScore.considerations.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Considerations:</p>
                                      <ul className="text-xs list-disc pl-4">
                                        {matchScore.considerations.map((c: string, i: number) => (
                                          <li key={i}>{c}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {loadingScores && !matchScore && (
                          <Badge variant="outline" className="gap-1">
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            Analyzing...
                          </Badge>
                        )}
                      </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          CPM Offer
                        </p>
                        <p className="font-semibold text-lg">${campaign.cpm_bid}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Budget
                        </p>
                        <p className="font-medium">${campaign.total_budget}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-medium">{campaign.total_impressions?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-medium">
                          ${(campaign.total_budget - (campaign.total_spent || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(campaign.start_date), "MMM d, yyyy")} -{" "}
                        {format(new Date(campaign.end_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant={isSelected(campaign.id) ? "destructive" : "default"}
                    size="sm"
                    onClick={() =>
                      toggleCampaignMutation.mutate({
                        campaignId: campaign.id,
                        optIn: !isSelected(campaign.id),
                      })
                    }
                    disabled={toggleCampaignMutation.isPending}
                  >
                    {isSelected(campaign.id) ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Remove
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Add Campaign
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns available</h3>
            <p className="text-muted-foreground">
              There are currently no active campaigns matching your minimum CPM of ${minimumCpm}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
