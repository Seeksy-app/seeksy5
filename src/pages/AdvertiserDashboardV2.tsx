import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, RefreshCw } from "lucide-react";
import { listCampaigns, type Campaign } from "@/lib/api/advertiserAPI";
import { useAdvertiserGuard } from "@/hooks/useAdvertiserGuard";
import { AdvertiserKPIBar } from "@/components/advertiser/dashboard/AdvertiserKPIBar";
import { RunningAdsCarousel } from "@/components/advertiser/dashboard/RunningAdsCarousel";
import { TopInfluencersCarousel } from "@/components/advertiser/dashboard/TopInfluencersCarousel";
import { PerformanceCharts } from "@/components/advertiser/dashboard/PerformanceCharts";
import { CreatorLeaderboard } from "@/components/advertiser/dashboard/CreatorLeaderboard";
import { OffersKanban } from "@/components/advertiser/dashboard/OffersKanban";
import { AIInsightsModule } from "@/components/advertiser/dashboard/AIInsightsModule";
import { toast } from "sonner";

// Mock data generators
const generateMockImpressionData = () => {
  const data = [];
  const baseImpressions = 15000;
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      impressions: Math.floor(baseImpressions + Math.random() * 10000 - 3000 + i * 200),
    });
  }
  return data;
};

const generateMockSpendData = () => [
  { name: "Brand Awareness", spent: 2400, budget: 3000 },
  { name: "Product Launch", spent: 1800, budget: 2500 },
  { name: "Holiday Sale", spent: 900, budget: 1500 },
  { name: "Podcast Ads", spent: 650, budget: 1000 },
];

const mockRunningAds = [
  { id: "1", title: "Summer Collection", creatorName: "Sarah Johnson", impressions: 45200, status: "active" as const, campaignName: "Brand Awareness Q4" },
  { id: "2", title: "Tech Review", creatorName: "Mike Chen", impressions: 32100, status: "active" as const, campaignName: "Product Launch" },
  { id: "3", title: "Lifestyle Vlog", creatorName: "Emma Davis", impressions: 28900, status: "paused" as const, campaignName: "Holiday Sale" },
  { id: "4", title: "Podcast Ad Read", creatorName: "The Daily Show", impressions: 18500, status: "active" as const, campaignName: "Podcast Ads" },
  { id: "5", title: "Fitness Tips", creatorName: "Alex Fitness", impressions: 22300, status: "pending" as const, campaignName: "Brand Awareness Q4" },
];

const mockInfluencers = [
  { id: "1", name: "Sarah Johnson", handle: "sarahj", performanceScore: 94, engagementRate: 4.8, followers: 125000, niche: "Lifestyle" },
  { id: "2", name: "Mike Chen", handle: "miketech", performanceScore: 91, engagementRate: 5.2, followers: 89000, niche: "Tech" },
  { id: "3", name: "Emma Davis", handle: "emmad", performanceScore: 88, engagementRate: 4.1, followers: 156000, niche: "Fashion" },
  { id: "4", name: "Alex Fitness", handle: "alexfit", performanceScore: 85, engagementRate: 6.3, followers: 78000, niche: "Fitness" },
  { id: "5", name: "Jamie Cook", handle: "jamiecooks", performanceScore: 82, engagementRate: 3.9, followers: 112000, niche: "Food" },
  { id: "6", name: "Taylor Swift", handle: "taylormusic", performanceScore: 79, engagementRate: 4.5, followers: 245000, niche: "Music" },
];

const mockCreatorLeaderboard = [
  { id: "1", name: "Sarah Johnson", ctr: 3.42, engagement: 4.8, costPerResult: 0.85, rank: 1, trend: "up" as const },
  { id: "2", name: "Mike Chen", ctr: 2.98, engagement: 5.2, costPerResult: 1.12, rank: 2, trend: "up" as const },
  { id: "3", name: "Emma Davis", ctr: 2.76, engagement: 4.1, costPerResult: 1.35, rank: 3, trend: "down" as const },
  { id: "4", name: "Alex Fitness", ctr: 2.45, engagement: 6.3, costPerResult: 1.50, rank: 4, trend: "same" as const },
  { id: "5", name: "Jamie Cook", ctr: 2.12, engagement: 3.9, costPerResult: 1.78, rank: 5, trend: "down" as const },
];

const mockOffers = [
  { id: "1", creatorName: "New Creator A", campaignName: "Q1 Campaign", budget: 2500, status: "sent" as const },
  { id: "2", creatorName: "Rising Star B", campaignName: "Product Launch", budget: 3000, status: "sent" as const },
  { id: "3", creatorName: "Popular C", campaignName: "Brand Awareness", budget: 5000, status: "pending" as const },
  { id: "4", creatorName: "Influencer D", campaignName: "Holiday Sale", budget: 1500, status: "pending" as const },
  { id: "5", creatorName: "Star Creator E", campaignName: "Q1 Campaign", budget: 4000, status: "accepted" as const },
  { id: "6", creatorName: "Micro Creator F", campaignName: "Podcast Ads", budget: 800, status: "rejected" as const },
];

const mockAIInsights = [
  {
    id: "1",
    type: "opportunity" as const,
    title: "High-performing creator available",
    description: "Sarah Johnson has 15% higher engagement than your average creator. Consider adding her to your Q1 campaign.",
    action: { label: "View Profile", onClick: () => {} },
  },
  {
    id: "2",
    type: "warning" as const,
    title: "Campaign budget running low",
    description: "Your 'Product Launch' campaign is at 72% spend with 2 weeks remaining. Consider adjusting daily caps.",
    action: { label: "Adjust Budget", onClick: () => {} },
  },
  {
    id: "3",
    type: "success" as const,
    title: "CPM decreased by 12%",
    description: "Your average CPM has dropped from $8.50 to $7.48 this month due to improved targeting.",
  },
  {
    id: "4",
    type: "tip" as const,
    title: "Try podcast advertising",
    description: "Based on your audience demographics, podcast ads could increase your reach by 30% with similar CPM.",
    action: { label: "Learn More", onClick: () => {} },
  },
];

const AdvertiserDashboardV2 = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { isOnboarded, advertiserId, isLoading: guardLoading } = useAdvertiserGuard();
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock KPI data
  const [kpiData] = useState({
    activeCampaigns: 4,
    totalImpressions: 147200,
    avgCPM: 7.48,
    offersPending: 2,
    offersAccepted: 8,
    totalSpend: 5750,
  });

  const fetchCampaigns = useCallback(async () => {
    if (!isOnboarded || !advertiserId) return;

    setIsLoadingCampaigns(true);
    try {
      const { campaigns: fetchedCampaigns } = await listCampaigns(advertiserId);
      setCampaigns(fetchedCampaigns);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [isOnboarded, advertiserId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Auto-refresh KPIs every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // In production, this would fetch real data
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCampaigns();
    setLastRefresh(new Date());
    toast.success("Dashboard refreshed");
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const isLoading = guardLoading || isLoadingCampaigns;

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "active": return "text-green-600";
      case "paused": return "text-yellow-600";
      case "draft": return "text-gray-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#053877] to-[#041d3a] border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Advertiser Dashboard</h1>
            <p className="text-white/60 text-sm">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {isLoading ? (
          <Card className="p-8 bg-white/95 backdrop-blur">
            <p className="text-center text-muted-foreground">Loading dashboard...</p>
          </Card>
        ) : (
          <>
            {/* KPI Bar */}
            <AdvertiserKPIBar {...kpiData} />

            {/* AI Insights */}
            <AIInsightsModule insights={mockAIInsights} />

            {/* Carousels Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              <RunningAdsCarousel
                ads={mockRunningAds}
                onViewAd={(id) => navigate(`/advertiser/ads/${id}`)}
              />
              <TopInfluencersCarousel
                influencers={mockInfluencers}
                onAddToCampaign={(id) => toast.success("Creator added to campaign")}
              />
            </div>

            {/* Performance Charts */}
            <PerformanceCharts
              impressionsData={generateMockImpressionData()}
              spendData={generateMockSpendData()}
            />

            {/* Leaderboard and Kanban Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              <CreatorLeaderboard creators={mockCreatorLeaderboard} />
              <OffersKanban
                offers={mockOffers}
                onViewOffer={(id) => navigate(`/advertiser/offers/${id}`)}
                onMessageCreator={(id) => toast.success("Opening chat...")}
              />
            </div>

            {/* Existing Campaign List */}
            <Card className="p-6 bg-white/95 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#053877]">All Campaigns</h3>
                <Button variant="outline" size="sm" onClick={() => navigate("/advertiser/campaigns")}>
                  View All
                </Button>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No campaigns yet</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Get started by creating an ad first, then launch a campaign
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={() => navigate("/advertiser/campaigns/create-type")}
                      variant="outline"
                    >
                      Create Ad First
                    </Button>
                    <Button
                      onClick={() => navigate("/advertiser/campaigns/create")}
                      className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
                    >
                      Create Campaign
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <Card
                      key={campaign.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer border"
                      onClick={() => navigate(`/advertiser/campaigns/${campaign.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-[#053877]">{campaign.name}</h4>
                          <div className="flex items-center gap-4 text-sm">
                            <span className={`font-medium ${getStatusColor(campaign.status)}`}>
                              {campaign.status.toUpperCase()}
                            </span>
                            <span className="text-muted-foreground">
                              Budget: ${(campaign as any).total_budget?.toLocaleString() || "0"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {campaign.targeting.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-[#2C6BED]/10 text-[#2C6BED] text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AdvertiserDashboardV2;
