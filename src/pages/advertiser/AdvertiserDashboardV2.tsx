import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Target,
  Eye,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { demoCreatorsV2, demoKPIsV2, demoCampaignsV2, demoAdsV2, demoChartDataV2 } from "@/data/advertiserDemoDataV2";
import { CreatorAnalyticsModal } from "@/components/advertiser/CreatorAnalyticsModal";
import { motion } from "framer-motion";
import { useRef } from "react";

const AdvertiserDashboardV2 = () => {
  const navigate = useNavigate();
  const [selectedCreator, setSelectedCreator] = useState<typeof demoCreatorsV2[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const creatorsScrollRef = useRef<HTMLDivElement>(null);
  const recommendedScrollRef = useRef<HTMLDivElement>(null);

  const scrollCreators = (direction: "left" | "right") => {
    if (creatorsScrollRef.current) {
      creatorsScrollRef.current.scrollBy({
        left: direction === "left" ? -320 : 320,
        behavior: "smooth",
      });
    }
  };

  const handleViewCreator = (creator: typeof demoCreatorsV2[0]) => {
    setSelectedCreator(creator);
    setModalOpen(true);
  };

  const featuredCreators = demoCreatorsV2.slice(0, 8);
  const recommendedCreators = demoCreatorsV2.slice(8, 14);
  const recentAds = demoAdsV2.slice(0, 4);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Running</Badge>;
      case "paused":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Paused</Badge>;
      case "completed":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] px-10 pt-8 pb-16"
    >
      <div className="w-full max-w-none space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Advertiser Dashboard</h1>
            <p className="text-white/70 mt-1">Manage campaigns, creators, and performance</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/advertiser/marketplace-v2")}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Find Creators
            </Button>
            <Button
              onClick={() => navigate("/advertiser/campaign-builder-v2")}
              className="bg-[#2C6BED] hover:bg-[#2C6BED]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* KPI Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Campaigns</p>
                <p className="text-3xl font-bold text-[#053877] mt-1">{demoKPIsV2.activeCampaigns}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#2C6BED]/10">
                <Target className="w-6 h-6 text-[#2C6BED]" />
              </div>
            </div>
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demoChartDataV2.impressionsTrend.slice(-7)}>
                  <Area type="monotone" dataKey="value" stroke="#2C6BED" fill="#2C6BED" fillOpacity={0.1} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Impressions (30d)</p>
                <p className="text-3xl font-bold text-[#053877] mt-1">
                  {(demoKPIsV2.totalImpressions30d / 1000000).toFixed(2)}M
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demoChartDataV2.impressionsTrend}>
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Creator</p>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={demoKPIsV2.topCreator.avatarUrl} />
                    <AvatarFallback>SM</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-[#053877]">{demoKPIsV2.topCreator.name}</p>
                    <p className="text-xs text-muted-foreground">{demoKPIsV2.topCreator.ctr}% CTR</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spend This Month</p>
                <p className="text-3xl font-bold text-[#053877] mt-1">${demoKPIsV2.spendThisMonth.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{demoKPIsV2.spendTrend}% vs last month
            </p>
          </Card>
        </div>

        {/* Featured Creators Carousel */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#053877]">Featured Creators</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollCreators("left")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scrollCreators("right")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div
            ref={creatorsScrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {featuredCreators.map((creator) => (
              <div key={creator.id} className="flex-shrink-0 w-[260px] snap-start">
                <Card
                  className="p-4 hover:shadow-lg hover:scale-[1.02] transition-all border cursor-pointer"
                  onClick={() => navigate(`/advertiser/creators/${creator.id}`)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Avatar className="h-full w-full">
                        <AvatarImage src={creator.avatarUrl} className="object-cover w-full h-full" />
                        <AvatarFallback className="bg-[#2C6BED]/10 text-[#2C6BED] w-full h-full flex items-center justify-center">
                          {creator.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{creator.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{creator.niche}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center mb-3">
                    <div>
                      <p className="text-lg font-bold text-[#053877]">
                        {creator.followers >= 1000000
                          ? `${(creator.followers / 1000000).toFixed(1)}M`
                          : `${(creator.followers / 1000).toFixed(0)}K`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Followers</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#053877]">{creator.engagementRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Engagement</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCreator(creator);
                      }}
                    >
                      Quick View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-[#2C6BED] hover:bg-[#2C6BED]/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/advertiser/campaign-builder-v2?creator=${creator.id}`);
                      }}
                    >
                      Invite
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Card>

        {/* Active Campaigns Table */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#053877]">Active Campaigns</h3>
            <Button variant="outline" size="sm" onClick={() => navigate("/advertiser/campaigns")}>
              View All
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoCampaignsV2.map((campaign) => (
                <TableRow
                  key={campaign.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/advertiser/campaigns/${campaign.id}`)}
                >
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell className="text-right">{campaign.impressions.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{campaign.ctr}%</TableCell>
                  <TableCell className="text-right">${campaign.spent.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Bottom Section: Recommended + Recent Ads */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recommended Creators */}
          <Card className="p-6 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-[#053877]">AI Recommended Creators</h3>
            </div>
            <div className="space-y-3">
              {recommendedCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 hover:shadow-sm cursor-pointer transition-all"
                  onClick={() => navigate(`/advertiser/creators/${creator.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Avatar className="h-full w-full">
                        <AvatarImage src={creator.avatarUrl} className="object-cover w-full h-full" />
                        <AvatarFallback className="bg-[#2C6BED]/10 text-[#2C6BED] text-sm w-full h-full flex items-center justify-center">
                          {creator.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{creator.name}</p>
                      <p className="text-xs text-muted-foreground">{creator.niche}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#053877]">
                      {(creator.followers / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-muted-foreground">{creator.engagementRate}% eng</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recently Viewed Ads */}
          <Card className="p-6 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#053877]">Recent Ads</h3>
              <Button variant="outline" size="sm" onClick={() => navigate("/advertiser/ad-library-v2")}>
                View Library
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {recentAds.map((ad) => (
                <Card
                  key={ad.id}
                  className="overflow-hidden border hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                  onClick={() => navigate(`/advertiser/ads/${ad.id}`)}
                >
                  <div className="relative aspect-video bg-slate-100">
                    <img src={ad.thumbnailUrl} alt={ad.title} className="w-full h-full object-cover" />
                    {ad.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <Badge
                      className={`absolute top-2 right-2 text-[10px] ${
                        ad.status === "active"
                          ? "bg-green-500/90 text-white"
                          : ad.status === "paused"
                          ? "bg-amber-500/90 text-white"
                          : "bg-slate-500/90 text-white"
                      }`}
                    >
                      {ad.status}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{ad.title}</p>
                    <p className="text-xs text-muted-foreground">{ad.metrics?.ctr || 0}% CTR</p>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Creator Analytics Modal */}
      <CreatorAnalyticsModal
        creator={selectedCreator}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onInvite={(id) => {
          setModalOpen(false);
          navigate(`/advertiser/campaign-builder-v2?creator=${id}`);
        }}
      />
    </motion.div>
  );
};

export default AdvertiserDashboardV2;
