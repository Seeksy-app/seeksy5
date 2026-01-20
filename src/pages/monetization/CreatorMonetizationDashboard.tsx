import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Star,
  ArrowRight,
  Briefcase,
  FileCheck,
  Wallet
} from "lucide-react";
import { Link } from "react-router-dom";
import { OpportunityCard } from "@/components/monetization/OpportunityCard";
import { PaymentTimeline } from "@/components/monetization/PaymentTimeline";
import { CreatorStatsBar } from "@/components/monetization/CreatorStatsBar";

export default function CreatorMonetizationDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data: opportunities, isLoading: loadingOpportunities } = useQuery({
    queryKey: ['creator-opportunities', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('creator_opportunities')
        .select(`
          *,
          ad_campaigns (
            name,
            objective,
            advertisers (company_name)
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['creator-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('creator_payments')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: marketProfile } = useQuery({
    queryKey: ['creator-market-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('creator_market_profiles')
        .select('*')
        .eq('creator_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Calculate stats
  const pendingOpportunities = opportunities?.filter(o => o.status === 'pending') || [];
  const activeOpportunities = opportunities?.filter(o => ['accepted', 'submitted'].includes(o.status)) || [];
  const completedOpportunities = opportunities?.filter(o => o.status === 'approved' || o.status === 'paid') || [];
  const totalEarnings = marketProfile?.total_earnings || 0;
  const pendingPayments = payments?.filter(p => p.status === 'pending' || p.status === 'scheduled') || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              Monetization Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage opportunities, deliverables, and earnings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/monetization/marketplace">
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Opportunities
              </Link>
            </Button>
            <Button asChild>
              <Link to="/identity">
                <Star className="h-4 w-4 mr-2" />
                My Rate Card
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <CreatorStatsBar
          totalEarnings={totalEarnings}
          pendingCount={pendingOpportunities.length}
          activeCount={activeOpportunities.length}
          completedCount={completedOpportunities.length}
          performanceScore={marketProfile?.performance_rating || 0}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="opportunities">
              Opportunities
              {pendingOpportunities.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingOpportunities.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active Work</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Pending Opportunities
                  </CardTitle>
                  <CardDescription>Offers waiting for your response</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingOpportunities ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : pendingOpportunities.length > 0 ? (
                    <div className="space-y-3">
                      {pendingOpportunities.slice(0, 3).map((opp) => (
                        <OpportunityCard key={opp.id} opportunity={opp} compact />
                      ))}
                      {pendingOpportunities.length > 3 && (
                        <Button variant="link" className="w-full" onClick={() => setActiveTab("opportunities")}>
                          View all {pendingOpportunities.length} opportunities
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No pending opportunities
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Active Work */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileCheck className="h-5 w-5 text-blue-500" />
                    Active Work
                  </CardTitle>
                  <CardDescription>Campaigns you're working on</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingOpportunities ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : activeOpportunities.length > 0 ? (
                    <div className="space-y-3">
                      {activeOpportunities.slice(0, 3).map((opp) => (
                        <OpportunityCard key={opp.id} opportunity={opp} compact showProgress />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No active work
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5 text-green-500" />
                    Upcoming Payments
                  </CardTitle>
                  <CardDescription>Scheduled payouts</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPayments ? (
                    <Skeleton className="h-32 w-full" />
                  ) : pendingPayments.length > 0 ? (
                    <PaymentTimeline payments={pendingPayments} compact />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No pending payments
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Recommended for You
                </CardTitle>
                <CardDescription>
                  AI-matched opportunities based on your profile and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Complete your market profile to get personalized recommendations</p>
                  <Button className="mt-4" variant="outline" asChild>
                    <Link to="/monetization/profile">Complete Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Opportunities</CardTitle>
                <CardDescription>
                  Review and respond to advertiser offers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOpportunities ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : opportunities && opportunities.length > 0 ? (
                  <div className="space-y-4">
                    {opportunities.map((opp) => (
                      <OpportunityCard key={opp.id} opportunity={opp} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No opportunities yet</p>
                    <Button className="mt-4" asChild>
                      <Link to="/monetization/marketplace">Browse Marketplace</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Work Tab */}
          <TabsContent value="active" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>
                  Manage your current deliverables and submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeOpportunities.length > 0 ? (
                  <div className="space-y-4">
                    {activeOpportunities.map((opp) => (
                      <OpportunityCard key={opp.id} opportunity={opp} showProgress />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active work</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Track your earnings and payout status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <Skeleton className="h-64 w-full" />
                ) : payments && payments.length > 0 ? (
                  <PaymentTimeline payments={payments} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payment history yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Track your monetization performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
