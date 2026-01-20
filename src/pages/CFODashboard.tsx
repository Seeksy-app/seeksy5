import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, DollarSign, Users, Sparkles, Download, Radio, Activity, ToggleLeft, ArrowLeft } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProformaTemplate } from "@/components/cfo/ProformaTemplate";
import { TalkingPointsWidget } from "@/components/dashboard/TalkingPointsWidget";
import { ForecastTab } from "@/components/cfo/ForecastTab";
import { InteractiveSpreadsheet } from "@/components/cfo/InteractiveSpreadsheet";
import { CFOAIChat } from "@/components/cfo/CFOAIChat";
import { CFOBoardSummary } from "@/components/cfo/CFOBoardSummary";
import { 
  getFinancialOverview,
  getAwardsSummary,
  getAdSpend,
  getCpmTiers,
} from "@/lib/api/financialApis";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B9D'];

const CFODashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [useRealTimeData, setUseRealTimeData] = useState(true);
  
  // Expanded assumptions with multiple ad types
  const [assumptions, setAssumptions] = useState({
    // Growth Assumptions
    monthlyUserGrowth: 15,
    creatorGrowth: 20,
    avgSubscriptionPrice: 19,
    conversionRate: 5,
    churnRate: 5,
    
    // Cash & Runway
    cashReserves: 500000, // Starting cash reserves
    
    // Ad Type CPMs and Fill Rates
    hostReadCpm: 35, // $18-$50
    hostReadFillRate: 95, // 90-100%
    announcerReadCpm: 17, // $12-$22
    announcerReadFillRate: 85,
    programmaticAudioCpm: 5, // $2-$8
    programmaticFillRate: 40, // 20-60%
    videoAdsCpm: 12, // $6-$18
    videoFillRate: 60,
    displayAdsCpm: 7, // $3-$12
    displayFillRate: 55, // 30-80%
    
    // PPI/PPC Call-Based Ads
    ppiPayoutPerInquiry: 65, // $15-$120
    ppiInquiriesPerCampaign: 25,
    ppiConversionRate: 8, // Percentage of calls that qualify
    ppiCallDurationThreshold: 3, // Minutes
    
    // Ad Inventory Split (%)
    preRollPercent: 35,
    midRollPercent: 50,
    postRollPercent: 15,
    
    // Creator Tiers
    creatorTierBasicPercent: 60,
    creatorTierProPercent: 30,
    creatorTierEnterprisePercent: 10,
    
    // Awards Revenue
    veteranAwardsRevenue: 250000,
    additionalAwardsProgramsCount: 2,
    avgAwardProgramRevenue: 75000,
    sponsorshipTiersAvg: 15000,
    ticketMerchRevenue: 25000,
    
    // Cost Structure
    storageCostPerGB: 0.10,
    bandwidthCostPerGB: 0.05,
    aiProcessingCostPerHour: 2.50,
    aiCostPerEpisode: 3.00,
    
    // Payout Splits
    creatorPayoutPercent: 75,
    platformSharePercent: 25,
  });

  // Demo data for AI projections mode
  const demoData = {
    totalUsers: 2847,
    activeCreators: 342,
    totalPodcasts: 156,
    totalEpisodes: 892,
    mrr: 54293,
    arr: 651516,
    adRevenue: 33390,
    awardsRevenue: 375000,
    totalRevenue: 491320,
    totalImpressions: 425600,
    hostReadRevenue: 15680,
    announcerRevenue: 8940,
    programmaticRevenue: 2560,
    videoRevenue: 4320,
    displayRevenue: 1890,
    ppiRevenue: 16250,
    sponsorshipRevenue: 12500,
    creatorPayouts: 46605,
    storageCosts: 446,
    bandwidthCosts: 2128,
    aiComputeCosts: 2676,
    paymentProcessingCosts: 14248,
    totalCosts: 66103,
    grossMargin: 86.5,
    burnRate: -425217,
    runwayMonths: 999,
    cac: 25,
    ltv: 456,
    totalInquiries: 312,
    qualifiedInquiries: 25,
    submissionsCount: 0,
    programCount: 0,
    cpmTiers: [],
  };

  // Fetch real financial data from APIs (actual customer data)
  const { data: financialOverview, isLoading: metricsLoading } = useQuery({
    queryKey: ['financial-overview-real'],
    queryFn: async () => {
      const overview = await getFinancialOverview();
      
      // Get actual data from database (may be zero)
      const [
        { count: totalUsers },
        { count: activeCreators },
        { count: totalPodcasts },
        { count: totalEpisodes },
        { data: subscriptions },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_type', 'creator'),
        supabase.from('podcasts').select('*', { count: 'exact', head: true }),
        supabase.from('episodes').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('plan_name').eq('status', 'active'),
      ]);

      // Return ACTUAL data (zeros if no real customers)
      return {
        totalUsers: totalUsers || 0,
        activeCreators: activeCreators || 0,
        totalPodcasts: totalPodcasts || 0,
        totalEpisodes: totalEpisodes || 0,
        mrr: (subscriptions?.length || 0) * assumptions.avgSubscriptionPrice,
        arr: (subscriptions?.length || 0) * assumptions.avgSubscriptionPrice * 12,
        adRevenue: overview?.adRevenue || 0,
        awardsRevenue: overview?.awardsRevenue || 0,
        totalRevenue: overview?.totalRevenue || 0,
        totalImpressions: overview?.totalImpressions || 0,
        hostReadRevenue: overview?.hostReadRevenue || 0,
        announcerRevenue: overview?.announcerRevenue || 0,
        programmaticRevenue: overview?.programmaticRevenue || 0,
        videoRevenue: overview?.videoRevenue || 0,
        displayRevenue: overview?.displayRevenue || 0,
        ppiRevenue: overview?.ppiRevenue || 0,
        sponsorshipRevenue: overview?.sponsorshipRevenue || 0,
        creatorPayouts: overview?.creatorPayouts || 0,
        storageCosts: overview?.storageCosts || 0,
        bandwidthCosts: overview?.bandwidthCosts || 0,
        aiComputeCosts: overview?.aiComputeCosts || 0,
        paymentProcessingCosts: overview?.paymentProcessingCosts || 0,
        totalCosts: overview?.totalCosts || 0,
        grossMargin: overview?.grossMargin || 0,
        burnRate: overview?.burnRate || 0,
        runwayMonths: overview?.runwayMonths || 999,
        cac: overview?.cac || 0,
        ltv: overview?.ltv || 0,
        totalInquiries: overview?.totalInquiries || 0,
        qualifiedInquiries: overview?.qualifiedInquiries || 0,
        submissionsCount: overview?.submissionsCount || 0,
        programCount: overview?.programCount || 0,
        cpmTiers: overview?.cpmTiers || [],
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Use demo data when toggle is OFF, real data when toggle is ON
  const realTimeMetrics = useRealTimeData ? financialOverview : demoData;

  // Calculate projected revenue based on assumptions (not real-time data)
  const calculateProjectedRevenue = () => {
    // Use assumptions to project revenue without real-time data
    const projectedUsers = assumptions.monthlyUserGrowth * 100; // Estimate
    const projectedCreators = assumptions.creatorGrowth * 50; // Estimate
    const projectedEpisodes = projectedCreators * 10; // Estimate 10 episodes per creator
    const projectedImpressions = projectedEpisodes * 1000; // Estimate 1000 impressions per episode
    
    // Calculate projected MRR
    const projectedPaidUsers = Math.round(projectedUsers * (assumptions.conversionRate / 100));
    const projectedMrr = projectedPaidUsers * assumptions.avgSubscriptionPrice;
    const projectedArr = projectedMrr * 12;
    
    // Calculate projected ad revenue by type
    const projHostReadImpressions = projectedImpressions * 0.3;
    const projAnnouncerReadImpressions = projectedImpressions * 0.25;
    const projProgrammaticImpressions = projectedImpressions * 0.25;
    const projVideoImpressions = projectedImpressions * 0.15;
    const projDisplayImpressions = projectedImpressions * 0.05;
    
    const projHostReadRevenue = (projHostReadImpressions / 1000) * assumptions.hostReadCpm * (assumptions.hostReadFillRate / 100);
    const projAnnouncerRevenue = (projAnnouncerReadImpressions / 1000) * assumptions.announcerReadCpm * (assumptions.announcerReadFillRate / 100);
    const projProgrammaticRevenue = (projProgrammaticImpressions / 1000) * assumptions.programmaticAudioCpm * (assumptions.programmaticFillRate / 100);
    const projVideoRevenue = (projVideoImpressions / 1000) * assumptions.videoAdsCpm * (assumptions.videoFillRate / 100);
    const projDisplayRevenue = (projDisplayImpressions / 1000) * assumptions.displayAdsCpm * (assumptions.displayFillRate / 100);
    
    const projAdRevenue = projHostReadRevenue + projAnnouncerRevenue + projProgrammaticRevenue + projVideoRevenue + projDisplayRevenue;
    
    // Calculate projected PPI revenue
    const projInquiries = Math.round(projectedImpressions * 0.001); // 0.1% inquiry rate
    const projQualifiedInquiries = projInquiries * (assumptions.ppiConversionRate / 100);
    const projPpiRevenue = projQualifiedInquiries * assumptions.ppiPayoutPerInquiry;
    
    // Calculate projected sponsorship revenue
    const projSponsorshipRevenue = assumptions.sponsorshipTiersAvg * 5; // Assume 5 sponsors
    
    // Calculate projected awards revenue
    const projAwardsRevenue = assumptions.veteranAwardsRevenue + 
      (assumptions.additionalAwardsProgramsCount * assumptions.avgAwardProgramRevenue) +
      assumptions.ticketMerchRevenue;
    
    const projTotalRevenue = projectedMrr + projAdRevenue + projPpiRevenue + projSponsorshipRevenue + projAwardsRevenue;
    
    // Calculate projected costs
    const projCreatorPayouts = (projAdRevenue + projSponsorshipRevenue + projPpiRevenue) * (assumptions.creatorPayoutPercent / 100);
    const projStorageCosts = projectedEpisodes * 0.5 * assumptions.storageCostPerGB;
    const projBandwidthCosts = projectedImpressions * 0.1 * assumptions.bandwidthCostPerGB;
    const projAiComputeCosts = projectedEpisodes * assumptions.aiCostPerEpisode;
    const projPaymentProcessing = projTotalRevenue * 0.029;
    
    const projTotalCosts = projCreatorPayouts + projStorageCosts + projBandwidthCosts + projAiComputeCosts + projPaymentProcessing;
    const projGrossMargin = projTotalRevenue > 0 ? ((projTotalRevenue - projTotalCosts) / projTotalRevenue) * 100 : 0;
    const projBurnRate = projTotalCosts - projTotalRevenue;
    const projRunwayMonths = projBurnRate > 0 ? Math.floor(assumptions.cashReserves / Math.abs(projBurnRate)) : 999;
    
    return {
      projectedMrr,
      projectedArr,
      projTotalRevenue,
      projGrossMargin,
      projBurnRate,
      projRunwayMonths,
      projAdRevenue,
      projPpiRevenue,
      projSponsorshipRevenue,
      projAwardsRevenue,
    };
  };

  const projectedMetrics = calculateProjectedRevenue();

  // Calculate projections based on assumptions
  const calculateProjections = () => {
    if (!realTimeMetrics) return [];

    const projections = [];
    const userGrowth = assumptions.monthlyUserGrowth / 100;
    const conversionRate = assumptions.conversionRate / 100;
    const avgPrice = assumptions.avgSubscriptionPrice;
    const churnRate = assumptions.churnRate / 100;

    let currentUsers = realTimeMetrics.totalUsers;
    let currentMrr = realTimeMetrics.mrr;
    let currentAdRevenue = realTimeMetrics.adRevenue;

    for (let month = 1; month <= 12; month++) {
      currentUsers = Math.round(currentUsers * (1 + userGrowth));
      const newPaidUsers = Math.round(currentUsers * conversionRate);
      const churnedUsers = Math.round((currentMrr / avgPrice) * churnRate);
      const netNewUsers = newPaidUsers - churnedUsers;
      currentMrr = Math.max(0, currentMrr + (netNewUsers * avgPrice));
      currentAdRevenue = currentAdRevenue * (1 + userGrowth * 0.5); // Ad revenue grows with user growth

      projections.push({
        month: `Month ${month}`,
        users: currentUsers,
        mrr: currentMrr,
        arr: currentMrr * 12,
        adRevenue: currentAdRevenue,
        totalRevenue: currentMrr + currentAdRevenue + realTimeMetrics.sponsorshipRevenue,
      });
    }

    return projections;
  };

  const projections = calculateProjections();

  // Update assumption value
  const updateAssumption = (key: string, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  if (metricsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl overflow-x-hidden">
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="max-w-full">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin')}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">CFO Financial Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Comprehensive financial modeling with multi-tier ad revenue & real-time data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="data-mode" className="text-sm font-medium">
            {useRealTimeData ? "Real-Time Data (Actual)" : "Demo Mode (AI Projections)"}
          </Label>
          <Switch
            id="data-mode"
            checked={useRealTimeData}
            onCheckedChange={setUseRealTimeData}
          />
        </div>
      </div>

      <Tabs defaultValue="board-summary" className="space-y-6">
        <TabsList className="inline-flex w-full overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <TabsTrigger value="board-summary" className="flex-shrink-0">Board Summary</TabsTrigger>
          <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
          <TabsTrigger value="revenue" className="flex-shrink-0">Revenue</TabsTrigger>
          <TabsTrigger value="ad-breakdown" className="flex-shrink-0">Ads</TabsTrigger>
          <TabsTrigger value="financial-models" className="flex-shrink-0">Financial Models</TabsTrigger>
          <TabsTrigger value="forecast" className="flex-shrink-0">Forecast</TabsTrigger>
        </TabsList>

        {/* Board Summary Tab - Investor Ready View */}
        <TabsContent value="board-summary" className="space-y-6">
          <CFOBoardSummary />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Investor Talking Points Widget */}
          <TalkingPointsWidget 
            teamType="cfo"
            title="Investor Talking Points"
            description="AI-generated insights and narratives for investor conversations"
          />
          
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${Math.round(realTimeMetrics?.mrr || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ARR: ${Math.round(realTimeMetrics?.arr || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${Math.round(realTimeMetrics?.totalRevenue || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gross Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{realTimeMetrics?.grossMargin.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">After creator payouts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Runway</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {realTimeMetrics?.runwayMonths === 999 ? '∞' : `${realTimeMetrics?.runwayMonths} months`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Burn: ${Math.round(Math.abs(realTimeMetrics?.burnRate || 0)).toLocaleString()}/mo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Projected Revenue Card - Based on Assumptions (Show in Real-Time Mode for comparison) */}
          {useRealTimeData && (
            <Card className="border-2 border-secondary/50 bg-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Projected Revenue (Based on Assumptions)
                </CardTitle>
                <CardDescription>Financial projections using assumption models for comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Projected MRR</div>
                    <div className="text-2xl font-bold">${Math.round(projectedMetrics.projectedMrr).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ARR: ${Math.round(projectedMetrics.projectedArr).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold">${Math.round(projectedMetrics.projTotalRevenue).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Monthly projection</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Gross Margin</div>
                    <div className="text-2xl font-bold">{projectedMetrics.projGrossMargin.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">After payouts</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Projected Runway</div>
                    <div className="text-2xl font-bold">
                      {projectedMetrics.projRunwayMonths === 999 ? '∞' : `${projectedMetrics.projRunwayMonths} months`}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Burn: ${Math.round(Math.abs(projectedMetrics.projBurnRate)).toLocaleString()}/mo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revenue Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Current month revenue streams with expanded categories</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto -mx-6 px-6">
              <div className="min-w-[600px]">
                <ResponsiveContainer width="100%" height={350}>
                <BarChart data={[
                  { name: 'Subscriptions', value: realTimeMetrics?.mrr || 0 },
                  { name: 'Host-Read Ads', value: realTimeMetrics?.hostReadRevenue || 0 },
                  { name: 'Announcer Ads', value: realTimeMetrics?.announcerRevenue || 0 },
                  { name: 'Programmatic', value: realTimeMetrics?.programmaticRevenue || 0 },
                  { name: 'Video Ads', value: realTimeMetrics?.videoRevenue || 0 },
                  { name: 'Display Ads', value: realTimeMetrics?.displayRevenue || 0 },
                  { name: 'PPI/PPC Calls', value: realTimeMetrics?.ppiRevenue || 0 },
                  { name: 'Sponsorships', value: realTimeMetrics?.sponsorshipRevenue || 0 },
                  { name: 'Awards', value: realTimeMetrics?.awardsRevenue || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${Math.round(value).toLocaleString()}`} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <span className="font-semibold">{realTimeMetrics?.totalUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Creators</span>
                  <span className="font-semibold">{realTimeMetrics?.activeCreators.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Podcasts</span>
                  <span className="font-semibold">{realTimeMetrics?.totalPodcasts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Episodes</span>
                  <span className="font-semibold">{realTimeMetrics?.totalEpisodes.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ad Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Impressions</span>
                  <span className="font-semibold">{realTimeMetrics?.totalImpressions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ad Revenue</span>
                  <span className="font-semibold">${Math.round(realTimeMetrics?.adRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">PPI Revenue</span>
                  <span className="font-semibold">${Math.round(realTimeMetrics?.ppiRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Qualified Inquiries</span>
                  <span className="font-semibold">{realTimeMetrics?.qualifiedInquiries.toFixed(0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unit Economics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CAC</span>
                  <span className="font-semibold">${realTimeMetrics?.cac.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">LTV</span>
                  <span className="font-semibold">${realTimeMetrics?.ltv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">LTV:CAC Ratio</span>
                  <span className="font-semibold">
                    {realTimeMetrics?.cac > 0 ? (realTimeMetrics.ltv / realTimeMetrics.cac).toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payback Period</span>
                  <span className="font-semibold">
                    {realTimeMetrics?.mrr > 0 ? Math.round((realTimeMetrics.cac / (realTimeMetrics.mrr / (realTimeMetrics.totalUsers || 1)))) : 'N/A'}mo
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Details Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>Breakdown of all revenue streams</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Subscriptions', value: realTimeMetrics?.mrr || 0 },
                        { name: 'Ads', value: realTimeMetrics?.adRevenue || 0 },
                        { name: 'PPI/PPC', value: realTimeMetrics?.ppiRevenue || 0 },
                        { name: 'Sponsorships', value: realTimeMetrics?.sponsorshipRevenue || 0 },
                        { name: 'Awards', value: realTimeMetrics?.awardsRevenue || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${Math.round(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Structure</CardTitle>
                <CardDescription>Operating expenses breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Creator Payouts</span>
                  <span className="text-xl font-bold">${Math.round(realTimeMetrics?.creatorPayouts || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Storage Costs</span>
                  <span className="font-semibold">${Math.round(realTimeMetrics?.storageCosts || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bandwidth Costs</span>
                  <span className="font-semibold">${Math.round(realTimeMetrics?.bandwidthCosts || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">AI Compute</span>
                  <span className="font-semibold">${Math.round(realTimeMetrics?.aiComputeCosts || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment Processing</span>
                  <span className="font-semibold">${Math.round(realTimeMetrics?.paymentProcessingCosts || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold">Total Costs</span>
                  <span className="text-xl font-bold">${Math.round(realTimeMetrics?.totalCosts || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Awards Revenue Program</CardTitle>
              <CardDescription>Revenue from awards programs and sponsorships</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Veteran Podcast Awards</span>
                <span className="font-semibold">${Math.round(assumptions.veteranAwardsRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Additional Programs ({assumptions.additionalAwardsProgramsCount})</span>
                <span className="font-semibold">${Math.round(assumptions.additionalAwardsProgramsCount * assumptions.avgAwardProgramRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tickets & Merch</span>
                <span className="font-semibold">${Math.round(assumptions.ticketMerchRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-bold">Total Awards Revenue</span>
                <span className="text-xl font-bold">${Math.round(realTimeMetrics?.awardsRevenue || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ad Breakdown Tab */}
        <TabsContent value="ad-breakdown" className="space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Host-Read Ads</CardTitle>
                <CardDescription>Premium podcast advertising</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CPM</span>
                  <span className="font-semibold">${assumptions.hostReadCpm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fill Rate</span>
                  <span className="font-semibold">{assumptions.hostReadFillRate}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold">Revenue</span>
                  <span className="text-lg font-bold">${Math.round(realTimeMetrics?.hostReadRevenue || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Announcer-Read Ads</CardTitle>
                <CardDescription>Standard audio advertising</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CPM</span>
                  <span className="font-semibold">${assumptions.announcerReadCpm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fill Rate</span>
                  <span className="font-semibold">{assumptions.announcerReadFillRate}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold">Revenue</span>
                  <span className="text-lg font-bold">${Math.round(realTimeMetrics?.announcerRevenue || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Programmatic Audio</CardTitle>
                <CardDescription>Automated ad placement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CPM</span>
                  <span className="font-semibold">${assumptions.programmaticAudioCpm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fill Rate</span>
                  <span className="font-semibold">{assumptions.programmaticFillRate}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold">Revenue</span>
                  <span className="text-lg font-bold">${Math.round(realTimeMetrics?.programmaticRevenue || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Video Ads</CardTitle>
                <CardDescription>Video advertising</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CPM</span>
                  <span className="font-semibold">${assumptions.videoAdsCpm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fill Rate</span>
                  <span className="font-semibold">{assumptions.videoFillRate}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold">Revenue</span>
                  <span className="text-lg font-bold">${Math.round(realTimeMetrics?.videoRevenue || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Display Ads</CardTitle>
                <CardDescription>Banner and display</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CPM</span>
                  <span className="font-semibold">${assumptions.displayAdsCpm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fill Rate</span>
                  <span className="font-semibold">{assumptions.displayFillRate}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold">Revenue</span>
                  <span className="text-lg font-bold">${Math.round(realTimeMetrics?.displayRevenue || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">PPI/PPC Calls</CardTitle>
                <CardDescription>Call-based advertising</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payout/Inquiry</span>
                  <span className="font-semibold">${assumptions.ppiPayoutPerInquiry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Qualified Calls</span>
                  <span className="font-semibold">{realTimeMetrics?.qualifiedInquiries.toFixed(0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-bold">Revenue</span>
                  <span className="text-lg font-bold">${Math.round(realTimeMetrics?.ppiRevenue || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ad Inventory Distribution</CardTitle>
              <CardDescription>Pre-roll, mid-roll, and post-roll split</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pre-Roll', value: assumptions.preRollPercent },
                      { name: 'Mid-Roll', value: assumptions.midRollPercent },
                      { name: 'Post-Roll', value: assumptions.postRollPercent },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.slice(0, 3).map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projections Tab - Removed per user request */}

        {/* Financial Models Tab - AI vs Custom Pro Forma */}
        <TabsContent value="financial-models" className="space-y-6">
          {/* Pro Forma Quick Links */}
          <Card className="border-l-4 border-l-[#053877]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#053877]" />
                Available Pro Formas
              </CardTitle>
              <CardDescription>Financial models for business segments and acquisition opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => window.open('/cfo/proforma/events-awards', '_blank')}
                  className="bg-[#053877] hover:bg-[#053877]/90"
                >
                  Events & Awards Pro Forma
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <InteractiveSpreadsheet />
            </div>
            <div>
              <CFOAIChat financialData={realTimeMetrics} />
            </div>
          </div>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-6">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Data Source</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This forecast is based on <strong>custom assumptions</strong> configured by the CFO team. 
                These projections reflect Seeksy's specific growth strategy, pricing models, and cost structures.
              </p>
            </CardContent>
          </Card>
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <ForecastTab assumptions={assumptions} />
            </div>
            <div>
              <CFOAIChat financialData={realTimeMetrics} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CFODashboard;
