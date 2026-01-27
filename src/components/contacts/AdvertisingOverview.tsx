import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Target, 
  ExternalLink,
  Plus,
  MessageSquare,
  Eye,
  Megaphone
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

interface AdvertisingOverviewProps {
  contact: any;
}

export const AdvertisingOverview = ({ contact }: AdvertisingOverviewProps) => {
  const navigate = useNavigate();
  
  // Query advertisers linked to this contact (by email or company name)
  const { data: linkedAdvertisers, isLoading: advertisersLoading } = useQuery({
    queryKey: ["contact-advertisers", contact.id],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("advertisers")
        .select("*")
        .or(`contact_email.eq.${contact.email},company_name.ilike.%${contact.company}%`);
      
      if (result.error) throw result.error;
      return (result.data as any[]) || [];
    },
    enabled: !!contact.email || !!contact.company,
  });

  // Query campaigns for linked advertisers
  const { data: campaignStats } = useQuery({
    queryKey: ["contact-campaign-stats", linkedAdvertisers?.map((a: any) => a.id)],
    queryFn: async () => {
      if (!linkedAdvertisers || linkedAdvertisers.length === 0) return null;
      
      const advertiserIds = linkedAdvertisers.map((a: any) => a.id);
      
      const result = await (supabase as any)
        .from("ad_campaigns")
        .select("*")
        .in("advertiser_id", advertiserIds);
      
      if (result.error) throw result.error;
      const campaigns = result.data as any[];
      
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;
      const completedCampaigns = campaigns?.filter(c => c.status === "completed").length || 0;
      
      const totalSpent = campaigns?.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0) || 0;
      const totalImpressions = campaigns?.reduce((sum, c) => sum + (Number(c.total_impressions) || 0), 0) || 0;
      const avgCPM = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
      
      // Calculate creator payouts (70% of total spent as per platform model)
      const creatorPayouts = totalSpent * 0.7;
      
      // Find most recent active campaign
      const activeCampaignsSorted = campaigns
        ?.filter(c => c.status === "active")
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      
      const lastActiveCampaign = activeCampaignsSorted?.[0];
      
      return {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        totalSpent,
        totalImpressions,
        avgCPM,
        creatorPayouts,
        lastActiveCampaign,
      };
    },
    enabled: !!linkedAdvertisers && linkedAdvertisers.length > 0,
  });

  if (advertisersLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Advertising Overview</h3>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  if (!linkedAdvertisers || linkedAdvertisers.length === 0) {
    return (
      <Card className="p-4 border-dashed bg-muted/20">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Advertising Overview</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Not linked to any advertiser accounts yet.
        </p>
        <Button size="sm" variant="outline" asChild>
          <Link to="/admin/advertising/advertisers">
            <Plus className="h-4 w-4 mr-2" />
            Create Advertiser Account
          </Link>
        </Button>
      </Card>
    );
  }
  
  const handleCreateCampaign = () => {
    const firstAdvertiserId = linkedAdvertisers[0]?.id;
    navigate('/admin/advertising/campaigns/create', { 
      state: { preSelectedAdvertiserId: firstAdvertiserId } 
    });
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Advertising Overview</h3>
        </div>
        <Badge variant="secondary" className="sm:ml-auto w-fit">
          Advertiser Account Contact
        </Badge>
      </div>

      {/* Advertiser Account Links */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-muted-foreground">Advertiser Account{linkedAdvertisers.length > 1 ? 's' : ''}</h4>
        {linkedAdvertisers.map((advertiser) => (
          <div key={advertiser.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">{advertiser.company_name}</span>
              <Badge variant={advertiser.status === "pending" ? "secondary" : "default"} className="text-xs">
                {advertiser.status}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" asChild className="w-fit">
              <Link to={`/admin/advertising/advertisers`}>
                <span className="mr-2 hidden sm:inline">Open</span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      {/* Campaign Summary */}
      {campaignStats && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="text-center p-2 sm:p-3 bg-muted/30 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold">{campaignStats.totalCampaigns}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-green-500/10 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-500">{campaignStats.activeCampaigns}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-blue-500/10 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-500">{campaignStats.completedCampaigns}</div>
              <div className="text-xs text-muted-foreground">Done</div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Performance Snapshot */}
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-muted-foreground">Performance Snapshot</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <span className="text-sm">Total Spend</span>
                </div>
                <span className="font-semibold text-sm">${campaignStats.totalSpent.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
                  <span className="text-sm">Impressions</span>
                </div>
                <span className="font-semibold text-sm">{campaignStats.totalImpressions.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-500 flex-shrink-0" />
                  <span className="text-sm">Avg CPM</span>
                </div>
                <span className="font-semibold text-sm">${campaignStats.avgCPM.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-500 flex-shrink-0" />
                  <span className="text-sm">Creator Payouts</span>
                </div>
                <span className="font-semibold text-sm">${campaignStats.creatorPayouts.toLocaleString()}</span>
              </div>
            </div>

            {campaignStats.lastActiveCampaign && (
              <div className="p-3 bg-primary/10 rounded-lg mt-3">
                <div className="text-xs text-muted-foreground mb-1">Last Active Campaign</div>
                <div className="font-medium text-sm">{campaignStats.lastActiveCampaign.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Started: {new Date(campaignStats.lastActiveCampaign.start_date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />
        </>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={handleCreateCampaign}>
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Campaign</span>
            <span className="sm:hidden">Campaign</span>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/advertising/advertisers">
              <Building2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">View Account</span>
              <span className="sm:hidden">Account</span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/campaigns">
              <Eye className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">All Campaigns</span>
              <span className="sm:hidden">Campaigns</span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/contacts`}>
              <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Send Message</span>
              <span className="sm:hidden">Message</span>
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};
