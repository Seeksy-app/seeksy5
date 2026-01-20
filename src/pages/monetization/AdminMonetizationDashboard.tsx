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
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Settings,
  FileCheck,
  Wallet,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdminStatsBar } from "@/components/monetization/AdminStatsBar";
import { AdminCampaignTable } from "@/components/monetization/AdminCampaignTable";
import { AdminPayoutQueue } from "@/components/monetization/AdminPayoutQueue";
import { AdminFraudAlerts } from "@/components/monetization/AdminFraudAlerts";

export default function AdminMonetizationDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch all advertisers
  const { data: advertisers, isLoading: loadingAdvertisers } = useQuery({
    queryKey: ['admin-advertisers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch all campaigns
  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select(`
          *,
          advertisers (company_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch pending payments
  const { data: pendingPayments, isLoading: loadingPayments } = useQuery({
    queryKey: ['admin-pending-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_payments')
        .select(`
          *,
          profiles:creator_id (full_name, email)
        `)
        .in('status', ['pending', 'scheduled'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch pending deliverables
  const { data: pendingDeliverables } = useQuery({
    queryKey: ['admin-pending-deliverables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_deliverables')
        .select(`
          *,
          creator_opportunities (
            creator_id,
            ad_campaigns (name, advertisers (company_name))
          )
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate stats
  const activeCampaigns = campaigns?.filter(c => c.status === 'active') || [];
  const totalRevenue = campaigns?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0;
  const totalPayouts = pendingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Monetization Admin
            </h1>
            <p className="text-muted-foreground mt-1">
              Oversee campaigns, payouts, and platform revenue
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/ads/advertisers">
                <Building2 className="h-4 w-4 mr-2" />
                Manage Advertisers
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/ads">
                <Settings className="h-4 w-4 mr-2" />
                Ad Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <AdminStatsBar
          totalRevenue={totalRevenue}
          activeCampaigns={activeCampaigns.length}
          totalAdvertisers={advertisers?.length || 0}
          pendingPayouts={totalPayouts}
          pendingReviews={pendingDeliverables?.length || 0}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="payouts">
              Payouts
              {pendingPayments && pendingPayments.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingPayments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deliverables">
              Reviews
              {pendingDeliverables && pendingDeliverables.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingDeliverables.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Revenue This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    From {activeCampaigns.length} active campaigns
                  </p>
                </CardContent>
              </Card>

              {/* Pending Payouts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5 text-amber-500" />
                    Pending Payouts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${totalPayouts.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pendingPayments?.length || 0} payments pending
                  </p>
                  <Button variant="link" className="px-0 mt-2" onClick={() => setActiveTab("payouts")}>
                    Review Payouts →
                  </Button>
                </CardContent>
              </Card>

              {/* Pending Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileCheck className="h-5 w-5 text-blue-500" />
                    Pending Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{pendingDeliverables?.length || 0}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Deliverables awaiting approval
                  </p>
                  <Button variant="link" className="px-0 mt-2" onClick={() => setActiveTab("deliverables")}>
                    Review Now →
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
                <CardDescription>Latest campaign activity</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCampaigns ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : campaigns && campaigns.length > 0 ? (
                  <AdminCampaignTable campaigns={campaigns.slice(0, 5)} compact />
                ) : (
                  <p className="text-center text-muted-foreground py-8">No campaigns yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Campaigns</CardTitle>
                <CardDescription>Manage and monitor all advertising campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCampaigns ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : campaigns && campaigns.length > 0 ? (
                  <AdminCampaignTable campaigns={campaigns} />
                ) : (
                  <p className="text-center text-muted-foreground py-8">No campaigns yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6 mt-6">
            <AdminPayoutQueue payments={pendingPayments || []} loading={loadingPayments} />
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Deliverable Reviews</CardTitle>
                <CardDescription>Review and approve creator submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDeliverables && pendingDeliverables.length > 0 ? (
                  <div className="space-y-4">
                    {pendingDeliverables.map((deliverable: any) => (
                      <div key={deliverable.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{deliverable.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {deliverable.creator_opportunities?.ad_campaigns?.name}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          <Button size="sm" variant="default">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No deliverables pending review
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6 mt-6">
            <AdminFraudAlerts />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
