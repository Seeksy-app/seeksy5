import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutDashboard, Users, TrendingUp, Megaphone } from "lucide-react";
import { AdvertiserKPIBar } from "@/components/advertiser/dashboard/AdvertiserKPIBar";
import { RunningAdsCarousel } from "@/components/advertiser/dashboard/RunningAdsCarousel";
import { TopInfluencersCarousel } from "@/components/advertiser/dashboard/TopInfluencersCarousel";
import { PerformanceCharts } from "@/components/advertiser/dashboard/PerformanceCharts";
import { CreatorLeaderboard } from "@/components/advertiser/dashboard/CreatorLeaderboard";
import { OffersKanban } from "@/components/advertiser/dashboard/OffersKanban";
import {
  demoKPIs,
  demoRunningAds,
  demoInfluencers,
  demoOffers,
  demoImpressionsData,
  demoSpendData,
  demoCreatorLeaderboard,
} from "@/data/advertiserDemoData";

const AdvertiserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const handleViewAd = (adId: string) => {
    navigate(`/advertiser/creatives?ad=${adId}`);
  };

  const handleAddToCampaign = (influencerId: string) => {
    navigate(`/advertiser/creators?invite=${influencerId}`);
  };

  const handleViewOffer = (offerId: string) => {
    console.log("View offer:", offerId);
  };

  const handleMessageCreator = (creatorName: string) => {
    console.log("Message creator:", creatorName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Advertiser Dashboard</h1>
            <p className="text-white/70 mt-1">Manage campaigns, creators, and performance</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/advertiser/campaigns/create-type")}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Ad
            </Button>
            <Button
              onClick={() => navigate("/advertiser/campaigns/create")}
              className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* KPI Bar */}
        <AdvertiserKPIBar {...demoKPIs} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-[#053877] text-white/70">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="creators" className="data-[state=active]:bg-white data-[state=active]:text-[#053877] text-white/70">
              <Users className="w-4 h-4 mr-2" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:text-[#053877] text-white/70">
              <TrendingUp className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="offers" className="data-[state=active]:bg-white data-[state=active]:text-[#053877] text-white/70">
              <Megaphone className="w-4 h-4 mr-2" />
              Offers
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <RunningAdsCarousel ads={demoRunningAds} onViewAd={handleViewAd} />
            
            <div className="grid lg:grid-cols-2 gap-6">
              <PerformanceCharts
                impressionsData={demoImpressionsData}
                spendData={demoSpendData}
              />
            </div>

            <TopInfluencersCarousel
              influencers={demoInfluencers}
              onAddToCampaign={handleAddToCampaign}
            />
          </TabsContent>

          {/* Creators Tab */}
          <TabsContent value="creators" className="space-y-6">
            <TopInfluencersCarousel
              influencers={demoInfluencers}
              onAddToCampaign={handleAddToCampaign}
            />
            <CreatorLeaderboard creators={demoCreatorLeaderboard} />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceCharts
              impressionsData={demoImpressionsData}
              spendData={demoSpendData}
            />
            <CreatorLeaderboard creators={demoCreatorLeaderboard} />
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="space-y-6">
            <OffersKanban
              offers={demoOffers}
              onViewOffer={handleViewOffer}
              onMessageCreator={handleMessageCreator}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <h3 className="text-lg font-semibold text-[#053877] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate("/advertiser/campaigns")}
            >
              <Megaphone className="w-5 h-5 text-[#2C6BED]" />
              <span className="text-sm">View Campaigns</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate("/advertiser/creators")}
            >
              <Users className="w-5 h-5 text-[#2C6BED]" />
              <span className="text-sm">Browse Creators</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate("/advertiser/creatives")}
            >
              <LayoutDashboard className="w-5 h-5 text-[#2C6BED]" />
              <span className="text-sm">Manage Creatives</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate("/advertiser/reports")}
            >
              <TrendingUp className="w-5 h-5 text-[#2C6BED]" />
              <span className="text-sm">View Reports</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdvertiserDashboard;
