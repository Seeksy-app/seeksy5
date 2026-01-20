import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Trophy, Video } from "lucide-react";

export function OverviewRevenueTab() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Get podcast ad revenue
  const { data: adRevenue } = useQuery({
    queryKey: ["ad-revenue-overview", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("creator_earnings")
        .select("creator_share, payout_status")
        .eq("user_id", user?.id);

      const total = data?.reduce((sum, e) => sum + Number(e.creator_share || 0), 0) || 0;
      const pending = data
        ?.filter((e) => e.payout_status === "pending")
        .reduce((sum, e) => sum + Number(e.creator_share || 0), 0) || 0;
      const paid = data
        ?.filter((e) => e.payout_status === "paid")
        .reduce((sum, e) => sum + Number(e.creator_share || 0), 0) || 0;

      return { total, pending, paid };
    },
    enabled: !!user,
  });

  // Get awards revenue
  const { data: awardsRevenue } = useQuery({
    queryKey: ["awards-revenue-overview", user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, pending: 0, paid: 0 };

      const { data: programs } = await supabase
        .from("awards_programs")
        .select("id")
        .eq("user_id", user.id);

      if (!programs || programs.length === 0) return { total: 0, pending: 0, paid: 0 };

      const programIds = programs.map((p) => p.id);

      // Get all transactions
      const [{ data: sponsorships }, { data: nominations }, { data: registrations }] =
        await Promise.all([
          supabase
            .from("award_sponsorships")
            .select("amount_paid, status")
            .in("program_id", programIds)
            .eq("status", "paid"),
          supabase
            .from("award_self_nominations")
            .select("amount_paid, status")
            .in("program_id", programIds)
            .eq("status", "paid"),
          supabase
            .from("award_registrations")
            .select("amount_paid, status")
            .in("program_id", programIds)
            .eq("status", "paid"),
        ]);

      const allTransactions = [
        ...(sponsorships || []),
        ...(nominations || []),
        ...(registrations || []),
      ];

      const total = allTransactions.reduce((sum, t) => sum + Number(t.amount_paid), 0);

      // Get payouts
      const { data: payouts } = await supabase
        .from("award_payouts")
        .select("net_amount, status")
        .in("program_id", programIds);

      const paid = (payouts || [])
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.net_amount), 0);

      const pending = total - paid;

      return { total, pending, paid };
    },
    enabled: !!user,
  });

  // Get streaming revenue
  const { data: streamingRevenue } = useQuery({
    queryKey: ["streaming-revenue-overview", user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, pending: 0, paid: 0 };

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) return { total: 0, pending: 0, paid: 0 };

      const { count } = await supabase
        .from("my_page_video_impressions")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profile.id);

      const totalImpressions = count || 0;
      const streamingCPM = 5;
      const estimatedRevenue = (totalImpressions / 1000) * streamingCPM;
      const creatorShare = estimatedRevenue * 0.70;

      return { total: creatorShare, pending: creatorShare, paid: 0 };
    },
    enabled: !!user,
  });

  const totalRevenue = (adRevenue?.total || 0) + (awardsRevenue?.total || 0) + (streamingRevenue?.total || 0);
  const totalPending = (adRevenue?.pending || 0) + (awardsRevenue?.pending || 0) + (streamingRevenue?.pending || 0);
  const totalPaid = (adRevenue?.paid || 0) + (awardsRevenue?.paid || 0) + (streamingRevenue?.paid || 0);

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Total Revenue
          </CardTitle>
          <CardDescription>Combined earnings from all sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-primary mb-6">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Paid Out</p>
              <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-amber-600">${totalPending.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Source */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Podcast Ads
            </CardTitle>
            <CardDescription>Revenue from advertising</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
              <p className="text-3xl font-bold">${(adRevenue?.total || 0).toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-semibold text-green-600">
                  ${(adRevenue?.paid || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-semibold text-amber-600">
                  ${(adRevenue?.pending || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-500" />
              Streaming
            </CardTitle>
            <CardDescription>My Page video revenue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
              <p className="text-3xl font-bold">${(streamingRevenue?.total || 0).toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-semibold text-green-600">
                  ${(streamingRevenue?.paid || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-semibold text-amber-600">
                  ${(streamingRevenue?.pending || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Awards Programs
            </CardTitle>
            <CardDescription>Revenue from awards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Collected</p>
              <p className="text-3xl font-bold">${(awardsRevenue?.total || 0).toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="text-lg font-semibold text-green-600">
                  ${(awardsRevenue?.paid || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Held</p>
                <p className="text-lg font-semibold text-amber-600">
                  ${(awardsRevenue?.pending || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
