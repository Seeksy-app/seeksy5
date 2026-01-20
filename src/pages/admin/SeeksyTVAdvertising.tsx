import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Megaphone, Plus, Play, Pause, Archive, Video, Music, 
  Target, Calendar, DollarSign, Eye, TrendingUp, Download 
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { AdInventoryTable } from "@/components/tv/advertising/AdInventoryTable";
import { AdPlacementsTable } from "@/components/tv/advertising/AdPlacementsTable";
import { AdAnalyticsDashboard } from "@/components/tv/advertising/AdAnalyticsDashboard";
import { CreateAdDialog } from "@/components/tv/advertising/CreateAdDialog";
import { CreatePlacementDialog } from "@/components/tv/advertising/CreatePlacementDialog";

const SeeksyTVAdvertising = () => {
  const queryClient = useQueryClient();
  const [createAdOpen, setCreateAdOpen] = useState(false);
  const [createPlacementOpen, setCreatePlacementOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");

  // Fetch ads
  const { data: ads, isLoading: adsLoading } = useQuery({
    queryKey: ['seeksy-tv-ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seeksy_tv_ads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch placements with related data
  const { data: placements, isLoading: placementsLoading } = useQuery({
    queryKey: ['seeksy-tv-ad-placements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seeksy_tv_ad_placements')
        .select(`
          *,
          ad:seeksy_tv_ads(id, title, type, thumbnail_url),
          channel:tv_channels(id, name),
          video:tv_content(id, title)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch impressions for stats
  const { data: impressions } = useQuery({
    queryKey: ['seeksy-tv-ad-impressions-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seeksy_tv_ad_impressions')
        .select('id, ad_id, placement_id, created_at');
      if (error) throw error;
      return data;
    }
  });

  // Calculate stats
  const activeAds = ads?.filter(a => a.status === 'active').length || 0;
  const activePlacements = placements?.filter(p => p.status === 'active').length || 0;
  const totalImpressions = impressions?.length || 0;
  
  // Estimate spend based on CPM
  const estimatedSpend = placements?.reduce((total, p) => {
    const placementImpressions = impressions?.filter(i => i.placement_id === p.id).length || 0;
    return total + (placementImpressions / 1000) * (p.cpm || 0);
  }, 0) || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" />
            Seeksy TV Advertising
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage ad inventory, placements, and view analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreatePlacementOpen(true)}>
            <Target className="h-4 w-4 mr-2" />
            Create Placement
          </Button>
          <Button onClick={() => setCreateAdOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Ad
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Video className="h-4 w-4" />
              Active Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{activeAds}</div>
            <p className="text-xs text-muted-foreground">{ads?.length || 0} total in inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Active Placements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{activePlacements}</div>
            <p className="text-xs text-muted-foreground">{placements?.length || 0} total placements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Est. Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">${estimatedSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on CPM</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="placements" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Placements
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ad Inventory</CardTitle>
              <CardDescription>Video and audio ads available for placements</CardDescription>
            </CardHeader>
            <CardContent>
              <AdInventoryTable 
                ads={ads || []} 
                isLoading={adsLoading}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['seeksy-tv-ads'] })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ad Placements</CardTitle>
              <CardDescription>Configure where and when ads appear</CardDescription>
            </CardHeader>
            <CardContent>
              <AdPlacementsTable 
                placements={placements || []} 
                isLoading={placementsLoading}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['seeksy-tv-ad-placements'] })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AdAnalyticsDashboard 
            impressions={impressions || []}
            placements={placements || []}
            ads={ads || []}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateAdDialog 
        open={createAdOpen}
        onOpenChange={setCreateAdOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['seeksy-tv-ads'] });
          setCreateAdOpen(false);
        }}
      />
      
      <CreatePlacementDialog
        open={createPlacementOpen}
        onOpenChange={setCreatePlacementOpen}
        ads={ads || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['seeksy-tv-ad-placements'] });
          setCreatePlacementOpen(false);
        }}
      />
    </div>
  );
};

export default SeeksyTVAdvertising;
