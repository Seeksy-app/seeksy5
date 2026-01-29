import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, CreditCard, TrendingDown, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function AdvertiserDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [retainerAmount, setRetainerAmount] = useState("500");
  const [autoTopupAmount, setAutoTopupAmount] = useState("500");
  const [autoTopupThreshold, setAutoTopupThreshold] = useState("100");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: advertiser, isLoading } = useQuery({
    queryKey: ["advertiser", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("advertisers")
        .select(`
          *,
          pricing_tier:advertiser_pricing_tiers(*)
        `)
        .eq("owner_profile_id", user.id)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["advertiser-transactions", advertiser?.id],
    queryFn: async () => {
      if (!advertiser) return [];
      const { data, error } = await supabase
        .from("advertiser_transactions")
        .select("*")
        .eq("advertiser_id", advertiser.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!advertiser,
  });

  const { data: campaigns } = useQuery({
    queryKey: ["advertiser-campaigns", advertiser?.id],
    queryFn: async () => {
      if (!advertiser) return [];
      const result = await (supabase as any)
        .from("ad_campaigns")
        .select("*, audio_ads(ad_type)")
        .eq("advertiser_id", advertiser.id)
        .order("created_at", { ascending: false });
      
      if (result.error) throw result.error;
      const data = result.data as any[];
      
      // Update campaign statuses based on dates and budget
      const now = new Date();
      return data.map((campaign: any) => {
        const startDate = new Date(campaign.start_date);
        const endDate = new Date(campaign.end_date);
        
        let status = campaign.status;
        
        // Auto-activate if within date range and has budget
        if (status === 'draft' && startDate <= now && endDate >= now && campaign.total_budget > 0) {
          status = 'active';
        }
        // Mark as stopped if out of budget during active period
        else if (status === 'active' && campaign.remaining_impressions === 0) {
          status = 'stopped';
        }
        // Mark as complete if past end date
        else if (endDate < now) {
          status = 'complete';
        }
        
        return { ...campaign, status };
      });
    },
    enabled: !!advertiser,
  });

  const setupPaymentMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(retainerAmount);
      if (amount < 100) {
        throw new Error("Minimum retainer is $100");
      }

      const { data, error } = await supabase.functions.invoke("advertiser-setup-payment", {
        body: { retainerAmount: amount },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: any) => {
      toast.error("Failed to setup payment: " + error.message);
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const { error } = await supabase
        .from("advertisers")
        .update(settings)
        .eq("id", advertiser?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertiser"] });
      toast.success("Settings updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  // Handle payment setup completion
  useEffect(() => {
    const setupStatus = searchParams.get("setup");
    const sessionId = searchParams.get("session_id");
    
    if (setupStatus === "success" && sessionId) {
      // Process the payment
      supabase.functions.invoke("advertiser-process-payment", {
        body: { sessionId },
      }).then(({ data, error }) => {
        if (error) {
          toast.error("Failed to process payment");
        } else {
          toast.success(`Payment successful! Your balance is now $${data.balance}`);
          queryClient.invalidateQueries({ queryKey: ["advertiser"] });
          queryClient.invalidateQueries({ queryKey: ["advertiser-transactions"] });
        }
        // Clean up URL
        navigate("/advertiser/dashboard", { replace: true });
      });
    } else if (setupStatus === "cancel") {
      toast.error("Payment setup cancelled");
      navigate("/advertiser/dashboard", { replace: true });
    }
  }, [searchParams]);

  if (!advertiser) {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have an advertiser account. Please apply first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/advertiser/signup")}>
              Apply as Advertiser
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (advertiser.status !== "approved") {
    return (
      <div className="container max-w-4xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Application Pending</CardTitle>
            <CardDescription>
              Your advertiser application is being reviewed. You'll receive an email once approved.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // TODO: Fetch from wallets table
  const balance = 0;
  const needsPayment = balance < 50;

  return (
    <div className="container mx-auto py-8 bg-gradient-to-br from-background via-brand-red/5 to-brand-darkRed/5 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-red to-brand-darkRed bg-clip-text text-transparent">
              Advertiser Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              {advertiser.company_name}
            </p>
          </div>
          <Button 
            onClick={() => navigate("/advertiser/campaigns")}
            className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold"
          >
            View My Campaigns
          </Button>
        </div>

        {/* Warning Banner */}
        {needsPayment && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Payment Setup Required
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    Set up your payment method and deposit a retainer to start running campaigns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-brand-gold/30 bg-gradient-to-br from-background to-brand-gold/5 hover:border-brand-gold/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-brand-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-gold">${balance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Available to spend
              </p>
            </CardContent>
          </Card>

          <Card className="border-brand-blue/30 bg-gradient-to-br from-background to-brand-blue/5 hover:border-brand-blue/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Badge variant="outline" className="border-brand-blue text-brand-blue">
                {campaigns?.length || 0}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-blue">
                {campaigns?.filter(c => c.status === 'active').length || 0} Active
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Running campaigns
              </p>
            </CardContent>
          </Card>

          <Card className="border-brand-navy/30 bg-gradient-to-br from-background to-brand-navy/5 hover:border-brand-navy/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Campaign Status</CardTitle>
              <Calendar className="h-4 w-4 text-brand-navy" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {campaigns && campaigns.length > 0 ? (
                  <>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {campaigns.filter(c => c.status === 'active').length} Active
                    </Badge>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      {campaigns.filter(c => c.status === 'pending').length} Pending
                    </Badge>
                    <Badge variant="outline" className="text-gray-600 border-gray-600">
                      {campaigns.filter(c => c.status === 'draft').length} Draft
                    </Badge>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No campaigns</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-red/30 bg-gradient-to-br from-background to-brand-red/5 hover:border-brand-red/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ad Types</CardTitle>
              <CreditCard className="h-4 w-4 text-brand-red" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {campaigns && campaigns.some(c => (c as any).audio_ads?.length > 0) ? (
                  <>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      Audio Ads
                    </Badge>
                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                      Video Ads
                    </Badge>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No ads yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Setup */}
        {needsPayment && (
          <Card>
            <CardHeader>
              <CardTitle>Setup Payment Method</CardTitle>
              <CardDescription>
                Add a credit card and deposit your initial retainer to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retainer">Initial Retainer Amount ($)</Label>
                <Input
                  id="retainer"
                  type="number"
                  min="100"
                  step="50"
                  value={retainerAmount}
                  onChange={(e) => setRetainerAmount(e.target.value)}
                  placeholder="500"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum $100. This will be added to your account balance.
                </p>
              </div>

              <Button
                onClick={() => setupPaymentMutation.mutate()}
                disabled={setupPaymentMutation.isPending}
                className="w-full"
              >
                {setupPaymentMutation.isPending ? "Processing..." : "Setup Payment & Deposit"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Auto Top-up Settings - TODO: Implement with wallets */}
        {false && (
          <Card>
            <CardHeader>
              <CardTitle>Auto Top-up Settings</CardTitle>
              <CardDescription>
                Automatically charge your card when balance gets low
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Auto Top-up</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically add funds when balance is low
                  </p>
                </div>
                <Switch
                  checked={false}
                  disabled
                />
              </div>

              {false && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Top-up When Balance Below ($)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={autoTopupThreshold}
                      onChange={(e) => setAutoTopupThreshold(e.target.value)}
                      onBlur={() =>
                        updateSettingsMutation.mutate({
                          auto_topup_threshold: parseFloat(autoTopupThreshold),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Top-up Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={autoTopupAmount}
                      onChange={(e) => setAutoTopupAmount(e.target.value)}
                      onBlur={() =>
                        updateSettingsMutation.mutate({
                          auto_topup_amount: parseFloat(autoTopupAmount),
                        })
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Campaign Overview */}
        {campaigns && campaigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Overview</CardTitle>
              <CardDescription>Status and performance of your active campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/advertiser/campaigns/${campaign.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <Badge 
                          className={
                            campaign.status === 'active' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : campaign.status === 'pending'
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : campaign.status === 'stopped'
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-gray-500 hover:bg-gray-600'
                          }
                        >
                          {campaign.status}
                        </Badge>
                        {(campaign as any).audio_ads && (campaign as any).audio_ads.length > 0 && (
                          <Badge variant="outline">
                            {(campaign as any).audio_ads[0].ad_type === 'conversational' ? 'Conversational' : 'Audio'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(campaign.start_date), "MMM d")} - {format(new Date(campaign.end_date), "MMM d, yyyy")}
                        </span>
                        <span>CPM: ${Number(campaign.cpm_bid).toFixed(2)}</span>
                        <span>Impressions: {campaign.total_impressions?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Budget</p>
                      <p className="text-lg font-bold">${Number(campaign.total_budget).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Spent: ${Number(campaign.total_spent || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {campaigns.length > 5 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate("/advertiser/campaigns")}
                >
                  View All Campaigns
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent account activity</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {transaction.transaction_type === "charge" ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(new Date(transaction.created_at), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.transaction_type === "charge" ? "text-red-600" : "text-green-600"
                      }`}>
                        {transaction.transaction_type === "charge" ? "-" : "+"}
                        ${Math.abs(Number(transaction.amount)).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: ${Number((transaction as any).balance_after || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No transactions yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
