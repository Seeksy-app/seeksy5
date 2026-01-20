import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Eye, Calendar, Trophy, Target, Zap, Award, Star, Rocket } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { OverviewRevenueTab } from "@/components/revenue/OverviewRevenueTab";
import { AwardsRevenueTab } from "@/components/revenue/AwardsRevenueTab";
import { StreamingRevenueTab } from "@/components/revenue/StreamingRevenueTab";

export default function PodcastRevenue() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      return user;
    },
  });

  // Get total earnings and impressions
  const { data: earnings } = useQuery({
    queryKey: ["creator-earnings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_earnings")
        .select(`
          *,
          ad_campaigns (
            name,
            cpm_bid
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get impressions breakdown by episode
  const { data: episodeBreakdown } = useQuery({
    queryKey: ["episode-impressions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_impressions")
        .select(`
          episode_id,
          episodes (
            title,
            podcast_id,
            podcasts (
              title
            )
          )
        `)
        .eq("creator_id", user?.id)
        .eq("is_valid", true);
      
      if (error) throw error;
      
      // Group by episode
      const grouped = data.reduce((acc: any, imp: any) => {
        const episodeId = imp.episode_id;
        if (!acc[episodeId]) {
          acc[episodeId] = {
            episode_id: episodeId,
            episode_title: imp.episodes?.title,
            podcast_title: imp.episodes?.podcasts?.title,
            count: 0
          };
        }
        acc[episodeId].count++;
        return acc;
      }, {});
      
      return Object.values(grouped).sort((a: any, b: any) => b.count - a.count);
    },
    enabled: !!user,
  });

  // Get total impressions from all ad plays (including non-finalized)
  const { data: allImpressions } = useQuery({
    queryKey: ["all-impressions", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("ad_impressions")
        .select("*", { count: 'exact', head: true })
        .eq("creator_id", user?.id)
        .eq("is_valid", true);
      
      return count || 0;
    },
    enabled: !!user,
  });

  // Get user's minimum CPM setting
  const { data: adSettings } = useQuery({
    queryKey: ["user-ad-settings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("podcast_ad_settings")
        .select("minimum_cpm")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      return data;
    },
    enabled: !!user,
  });

  // Calculate totals
  const totalRevenue = earnings?.reduce((sum, e) => sum + Number(e.revenue_generated || 0), 0) || 0;
  const totalCreatorShare = earnings?.reduce((sum, e) => sum + Number(e.creator_share || 0), 0) || 0;
  const totalImpressions = earnings?.reduce((sum, e) => sum + Number(e.total_impressions || 0), 0) || 0;
  const pendingPayout = earnings?.filter(e => e.payout_status === 'pending')
    .reduce((sum, e) => sum + Number(e.creator_share || 0), 0) || 0;

  // Gamification calculations
  const userCPM = adSettings?.minimum_cpm || 5;
  const revenueShare = 0.70; // 70% creator share
  const currentImpressions = allImpressions || 0;
  const estimatedEarnings = (currentImpressions / 1000) * userCPM * revenueShare;
  const payoutThreshold = 50;
  const progressToThreshold = Math.min((estimatedEarnings / payoutThreshold) * 100, 100);
  const impressionsNeeded = Math.max(0, Math.ceil(((payoutThreshold - estimatedEarnings) / (userCPM * revenueShare)) * 1000));
  
  // Milestones
  const milestones = [
    { amount: 10, icon: Star, color: "text-amber-500", label: "First $10" },
    { amount: 50, icon: Target, color: "text-blue-500", label: "Payout Ready" },
    { amount: 100, icon: Trophy, color: "text-purple-500", label: "Century Club" },
    { amount: 500, icon: Zap, color: "text-orange-500", label: "Power Earner" },
    { amount: 1000, icon: Rocket, color: "text-green-500", label: "Elite Status" },
  ];

  const nextMilestone = milestones.find(m => m.amount > estimatedEarnings);
  const completedMilestones = milestones.filter(m => m.amount <= estimatedEarnings);
  const progressToNextMilestone = nextMilestone 
    ? ((estimatedEarnings / nextMilestone.amount) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
        <p className="text-muted-foreground">
          Track your earnings from all revenue streams
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ads">Podcast Ads</TabsTrigger>
          <TabsTrigger value="streaming">Streaming</TabsTrigger>
          <TabsTrigger value="awards">Awards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewRevenueTab />
        </TabsContent>

        <TabsContent value="streaming">
          <StreamingRevenueTab />
        </TabsContent>

        <TabsContent value="awards">
          <AwardsRevenueTab />
        </TabsContent>

        <TabsContent value="ads" className="space-y-6">

      {/* Gamified Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estimated Earnings Progress */}
        <Card className="lg:col-span-2 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary animate-pulse" />
                  Estimated Earnings
                </CardTitle>
                <CardDescription>Based on your ${userCPM} CPM and 70% revenue share</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  ${estimatedEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  from {currentImpressions.toLocaleString()} plays
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress to Payout */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Progress to ${payoutThreshold} Payout</span>
                </div>
                <span className="text-sm font-medium">
                  {progressToThreshold.toFixed(0)}%
                </span>
              </div>
              <Progress value={progressToThreshold} className="h-3" />
              {estimatedEarnings < payoutThreshold && (
                <p className="text-sm text-muted-foreground">
                  <strong>{impressionsNeeded.toLocaleString()}</strong> more impressions needed to reach payout threshold
                </p>
              )}
              {estimatedEarnings >= payoutThreshold && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Trophy className="h-4 w-4" />
                  <span className="font-medium">Ready for payout! 🎉</span>
                </div>
              )}
            </div>

            {/* Next Milestone */}
            {nextMilestone && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <nextMilestone.icon className={`h-4 w-4 ${nextMilestone.color}`} />
                    <span className="font-medium">Next Milestone: {nextMilestone.label}</span>
                  </div>
                  <span className="text-sm font-medium">
                    ${nextMilestone.amount}
                  </span>
                </div>
                <Progress value={progressToNextMilestone} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  ${(nextMilestone.amount - estimatedEarnings).toFixed(2)} to go
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Achievements
            </CardTitle>
            <CardDescription>Your earnings milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map((milestone) => {
                const isCompleted = estimatedEarnings >= milestone.amount;
                const Icon = milestone.icon;
                return (
                  <div
                    key={milestone.amount}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isCompleted
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-muted/30 border-muted opacity-50'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        isCompleted ? milestone.color : 'text-muted-foreground'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{milestone.label}</p>
                      <p className="text-xs text-muted-foreground">
                        ${milestone.amount}
                      </p>
                    </div>
                    {isCompleted && (
                      <Badge variant="default" className="text-xs">
                        ✓
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCreatorShare.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Your share from ads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingPayout.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <CardTitle className="text-sm font-medium">
                      Total Impressions
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-normal">
                      Estimated Impressions
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Shows impressions from completed campaigns. New ad plays appear in "Performance by Episode" below and are added here once campaigns are finalized for payout.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Valid ad plays
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. CPM</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalImpressions > 0 ? ((totalRevenue / totalImpressions) * 1000).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per 1000 impressions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings by Campaign */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings by Campaign</CardTitle>
          <CardDescription>Revenue breakdown by advertising campaign</CardDescription>
        </CardHeader>
        <CardContent>
          {earnings && earnings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Your Share</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell className="font-medium">
                      {earning.ad_campaigns?.name || "Unknown Campaign"}
                    </TableCell>
                    <TableCell>
                      {new Date(earning.period_start).toLocaleDateString()} - {new Date(earning.period_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {earning.total_impressions?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(earning.revenue_generated || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(earning.creator_share || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        earning.payout_status === 'paid' ? 'default' :
                        earning.payout_status === 'pending' ? 'secondary' : 'outline'
                      }>
                        {earning.payout_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No earnings yet. Upload ads to start earning!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impressions by Episode */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Episode</CardTitle>
          <CardDescription>Ad impressions breakdown across your episodes</CardDescription>
        </CardHeader>
        <CardContent>
          {episodeBreakdown && episodeBreakdown.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Podcast</TableHead>
                  <TableHead>Episode</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episodeBreakdown.slice(0, 10).map((episode: any) => (
                  <TableRow key={episode.episode_id}>
                    <TableCell className="font-medium">{episode.podcast_title}</TableCell>
                    <TableCell>{episode.episode_title}</TableCell>
                    <TableCell className="text-right">{episode.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No impressions recorded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Share Info */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Share Details</CardTitle>
          <CardDescription>Understanding your earnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Your Share</p>
              <p className="text-sm text-muted-foreground">From platform ads</p>
            </div>
            <div className="text-2xl font-bold text-primary">70%</div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Platform Share</p>
              <p className="text-sm text-muted-foreground">For ad network & operations</p>
            </div>
            <div className="text-2xl font-bold">30%</div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>• Payments are processed monthly for balances over $50</p>
            <p>• Manual ads (uploaded by you) generate 100% revenue for you</p>
            <p>• CPM rates vary by campaign and advertiser demand</p>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
