import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { DollarSign, Clock, CheckCircle, Lock } from "lucide-react";
import { format } from "date-fns";

interface AwardsFinancialDashboardProps {
  programId: string;
}

export function AwardsFinancialDashboard({ programId }: AwardsFinancialDashboardProps) {
  const { data: financials, isLoading } = useQuery({
    queryKey: ["awards-financials", programId],
    queryFn: async () => {
      // Get program details
      const programResult = await (supabase as any)
        .from("awards_programs")
        .select("*")
        .eq("id", programId)
        .single();
      const program = programResult.data as any;

      // Get all sponsorships
      const sponsorshipsResult = await (supabase as any)
        .from("award_sponsorships")
        .select("amount_paid, status, paid_at")
        .eq("program_id", programId);
      const sponsorships = (sponsorshipsResult.data || []) as any[];

      // Get all self-nominations
      const nominationsResult = await (supabase as any)
        .from("award_self_nominations")
        .select("amount_paid, status, paid_at")
        .eq("program_id", programId);
      const nominations = (nominationsResult.data || []) as any[];

      // Get all registrations
      const registrationsResult = await (supabase as any)
        .from("award_registrations")
        .select("amount_paid, status, paid_at")
        .eq("program_id", programId);
      const registrations = (registrationsResult.data || []) as any[];

      // Get all payouts
      const payoutsResult = await (supabase as any)
        .from("award_payouts")
        .select("*")
        .eq("program_id", programId);
      const payouts = (payoutsResult.data || []) as any[];

      // Calculate totals
      const allTransactions = [
        ...(sponsorships || []),
        ...(nominations || []),
        ...(registrations || []),
      ];

      const totalCollected = allTransactions
        .filter((t) => t.status === "paid")
        .reduce((sum, t) => sum + Number(t.amount_paid), 0);

      const processing = allTransactions
        .filter((t) => t.status === "pending")
        .reduce((sum, t) => sum + Number(t.amount_paid), 0);

      const totalPaid = (payouts || [])
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.net_amount), 0);

      const held = totalCollected - totalPaid;

      const feeConfig = (program?.fee_configuration as any) || {
        creator_percentage: 4.0,
        platform_processing_fee: 10.95,
        platform_percentage: 4.0,
      };

      const platformFees = (payouts || []).reduce(
        (sum, p) => sum + Number(p.platform_fee || 0),
        0
      );

      return {
        totalCollected,
        processing,
        totalPaid,
        held,
        platformFees,
        payoutScheduledDate: program?.payout_scheduled_date,
        ceremonyDate: program?.ceremony_date,
        feeConfig,
        breakdown: {
          sponsorships: (sponsorships || [])
            .filter((s) => s.status === "paid")
            .reduce((sum, s) => sum + Number(s.amount_paid), 0),
          nominations: (nominations || [])
            .filter((n) => n.status === "paid")
            .reduce((sum, n) => sum + Number(n.amount_paid), 0),
          registrations: (registrations || [])
            .filter((r) => r.status === "paid")
            .reduce((sum, r) => sum + Number(r.amount_paid), 0),
        },
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-brand-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!financials) return null;

  const stats = [
    {
      label: "Total Collected",
      value: financials.totalCollected,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Processing",
      value: financials.processing,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Paid Out",
      value: financials.totalPaid,
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Held (Pending Payout)",
      value: financials.held,
      icon: Lock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </span>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">
              ${stat.value.toFixed(2)}
            </p>
          </Card>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Sponsorships</span>
            <span className="font-semibold">
              ${financials.breakdown.sponsorships.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Self-Nominations</span>
            <span className="font-semibold">
              ${financials.breakdown.nominations.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Registrations</span>
            <span className="font-semibold">
              ${financials.breakdown.registrations.toFixed(2)}
            </span>
          </div>
          <div className="pt-3 border-t flex justify-between items-center">
            <span className="font-semibold">Total Revenue</span>
            <span className="font-bold text-lg">
              ${financials.totalCollected.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Fee Structure */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fee Structure</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Platform Percentage</span>
            <span className="font-semibold">
              {financials.feeConfig.platform_percentage}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              Processing Fee (per transaction)
            </span>
            <span className="font-semibold">
              ${financials.feeConfig.platform_processing_fee}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Creator Percentage</span>
            <span className="font-semibold">
              {financials.feeConfig.creator_percentage}%
            </span>
          </div>
          <div className="pt-3 border-t flex justify-between items-center">
            <span className="font-semibold">Total Platform Fees</span>
            <span className="font-bold text-lg text-red-600">
              -${financials.platformFees.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Payout Schedule */}
      {financials.ceremonyDate && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-2">Payout Schedule</h3>
          <p className="text-sm text-muted-foreground mb-3">
            All remaining funds will be paid out 5 business days after the
            awards ceremony.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Ceremony Date:</span>
              <span className="font-semibold">
                {format(new Date(financials.ceremonyDate), "PPP")}
              </span>
            </div>
            {financials.payoutScheduledDate && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Expected Payout Date:</span>
                <span className="font-semibold text-green-600">
                  {format(new Date(financials.payoutScheduledDate), "PPP")}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
