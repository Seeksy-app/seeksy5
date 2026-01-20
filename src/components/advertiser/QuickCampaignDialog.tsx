import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { PODCAST_CATEGORIES } from "@/lib/podcastCategories";

interface QuickCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adId: string;
  adType: 'audio' | 'video';
}

export function QuickCampaignDialog({ open, onOpenChange, adId, adType }: QuickCampaignDialogProps) {
  const queryClient = useQueryClient();
  const [cpmBid, setCpmBid] = useState<string>("5.00");
  const [maxImpressions, setMaxImpressions] = useState<string>("10000");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: advertiser } = useQuery({
    queryKey: ["advertiser-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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
    enabled: open,
  });

  const createQuickCampaign = useMutation({
    mutationFn: async () => {
      if (!advertiser) throw new Error("Advertiser profile not found");

      const cpm = parseFloat(cpmBid);
      const impressions = parseInt(maxImpressions);
      const totalBudget = (cpm * impressions) / 1000;

      // Use selected categories or fall back to empty array
      const targetCategories = selectedCategories.length > 0 
        ? selectedCategories 
        : [];

      console.log('Invoking create-quick-campaign with:', {
        adId,
        adType,
        advertiserId: advertiser.id,
        cpmBid: cpm,
        maxImpressions: impressions,
        totalBudget,
        targetCategories,
      });

      const { data, error } = await supabase.functions.invoke('create-quick-campaign', {
        body: {
          adId,
          adType,
          advertiserId: advertiser.id,
          cpmBid: cpm,
          maxImpressions: impressions,
          totalBudget,
          targetCategories,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to send a request to the Edge Function');
      }
      
      if (!data) {
        throw new Error('No data returned from edge function');
      }

      console.log('Quick campaign response:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success("Quick Campaign Created!", {
        description: `Your ad is now available to ${data.matchedCreatorsCount} creators in matching categories.`,
      });
      queryClient.invalidateQueries({ queryKey: ["audio-ads"] });
      queryClient.invalidateQueries({ queryKey: ["ad-campaigns"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Quick campaign error:', error);
      toast.error("Failed to create campaign", {
        description: error.message,
      });
    },
  });

  const estimatedBudget = (parseFloat(cpmBid) * parseInt(maxImpressions || "0")) / 1000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Quick Campaign</DialogTitle>
          </div>
          <DialogDescription>
            Instantly distribute your ad to all creators matching your target categories.
            No complex setup required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Target Categories Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Target Categories</Label>
            <p className="text-xs text-muted-foreground">
              Select categories for this campaign. Your ad will be available to creators in these categories.
            </p>
            <div className="flex flex-wrap gap-2">
              {PODCAST_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <Badge
                    key={category}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories(selectedCategories.filter(c => c !== category));
                      } else {
                        setSelectedCategories([...selectedCategories, category]);
                      }
                    }}
                  >
                    {category}
                  </Badge>
                );
              })}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No categories selected. Default targeting will apply.
              </p>
            )}
          </div>

          {/* CPM Bid */}
          <div className="space-y-2">
            <Label htmlFor="cpm">CPM Bid (Cost per 1,000 impressions)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="cpm"
                type="number"
                step="0.01"
                min="1"
                value={cpmBid}
                onChange={(e) => setCpmBid(e.target.value)}
                className="pl-7"
                placeholder="5.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Higher CPM = better ad placement priority
            </p>
          </div>

          {/* Max Impressions */}
          <div className="space-y-2">
            <Label htmlFor="impressions">Maximum Impressions</Label>
            <Input
              id="impressions"
              type="number"
              step="1000"
              min="1000"
              value={maxImpressions}
              onChange={(e) => setMaxImpressions(e.target.value)}
              placeholder="10000"
            />
            <p className="text-xs text-muted-foreground">
              Campaign auto-pauses when limit is reached
            </p>
          </div>

          {/* Budget Estimate */}
          <div className="p-4 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-lg border border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Estimated Total Budget</p>
                <p className="text-2xl font-bold text-primary">
                  ${estimatedBudget.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {parseInt(maxImpressions || "0").toLocaleString()} impressions @ ${cpmBid} CPM
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => createQuickCampaign.mutate()}
            disabled={createQuickCampaign.isPending || !cpmBid || !maxImpressions}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            {createQuickCampaign.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Campaign...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Launch Quick Campaign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}