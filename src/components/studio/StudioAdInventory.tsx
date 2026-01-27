import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, Music, Video, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface StudioAdInventoryProps {
  onAdSelect: (ad: any, type: 'script' | 'audio' | 'video') => void;
  selectedAd: any;
}

export const StudioAdInventory = ({ onAdSelect, selectedAd }: StudioAdInventoryProps) => {
  const [activeTab, setActiveTab] = useState("scripts");

  // Fetch available audio ads with campaigns (including quick campaigns)
  const { data: audioAds, isLoading } = useQuery({
    queryKey: ['studio-ad-inventory'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('audio_ads')
        .select(`
          *,
          campaign:ad_campaigns(
            id,
            name,
            status,
            total_budget,
            total_spent,
            cpm_bid,
            start_date,
            end_date,
            campaign_type,
            remaining_impressions,
            targeting_rules
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (result.error) throw result.error;

      const data = result.data as any[];
      // Filter to only include ads with active campaigns (including quick campaigns)
      return data?.filter((ad: any) => 
        ad.campaign && 
        ad.campaign.status === 'active' &&
        new Date(ad.campaign.start_date) <= new Date() &&
        new Date(ad.campaign.end_date) >= new Date() &&
        (ad.campaign.remaining_impressions === null || ad.campaign.remaining_impressions > 0) &&
        (ad.campaign.total_budget - (ad.campaign.total_spent || 0)) > 0
      ) || [];
    }
  });

  const scriptAds = audioAds?.filter(ad => ad.ad_type === 'standard');
  const audioOnlyAds = audioAds?.filter(ad => ad.ad_type === 'standard' && ad.audio_url);
  const conversationalAds = audioAds?.filter(ad => ad.ad_type === 'conversational');

  const handleSelectAd = (ad: any, type: 'script' | 'audio' | 'video') => {
    onAdSelect(ad, type);
    toast.success(`Selected ad: ${ad.campaign?.name || 'Untitled'}`);
  };

  const calculatePayout = (ad: any) => {
    // CPM-based payout calculation (70% to creator)
    const cpm = ad.campaign?.cpm_bid || 0;
    const creatorShare = cpm * 0.7;
    return creatorShare.toFixed(2);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Ad Inventory</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          💡 Ads appear here when advertisers create Quick Campaigns targeting your categories
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scripts" className="gap-2">
              <FileText className="h-4 w-4" />
              Scripts
            </TabsTrigger>
            <TabsTrigger value="audio" className="gap-2">
              <Music className="h-4 w-4" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-2">
              <Video className="h-4 w-4" />
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scripts" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading ads...</p>
              ) : scriptAds && scriptAds.length > 0 ? (
                <div className="space-y-3">
                  {scriptAds.map((ad) => (
                    <Card 
                      key={ad.id} 
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedAd?.id === ad.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleSelectAd(ad, 'script')}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{ad.campaign?.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ad.duration_seconds}s duration
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          ${calculatePayout(ad)} CPM
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                        {ad.script.substring(0, 100)}...
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No script ads available
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="audio" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading ads...</p>
              ) : audioOnlyAds && audioOnlyAds.length > 0 ? (
                <div className="space-y-3">
                  {audioOnlyAds.map((ad) => (
                    <Card 
                      key={ad.id} 
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedAd?.id === ad.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleSelectAd(ad, 'audio')}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{ad.campaign?.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ad.duration_seconds}s • Pre-recorded
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          ${calculatePayout(ad)} CPM
                        </Badge>
                      </div>
                      {ad.audio_url && (
                        <audio controls className="w-full mt-2 h-8">
                          <source src={ad.audio_url} type="audio/mpeg" />
                        </audio>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No audio ads available
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="video" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Video ads coming soon
              </p>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {selectedAd && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs font-medium text-primary">
              Selected: {selectedAd.campaign?.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Ad Spot" to insert this ad into your stream
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
