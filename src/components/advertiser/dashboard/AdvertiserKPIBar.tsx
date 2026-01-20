import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Eye, DollarSign, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

function KPICard({ title, value, change, icon, trend, subtitle }: KPICardProps) {
  return (
    <Card className="p-4 bg-white/95 backdrop-blur border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-[#053877]">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-lg bg-[#2C6BED]/10">
          {icon}
        </div>
      </div>
      {change !== undefined && (
        <div className={cn(
          "flex items-center gap-1 mt-2 text-xs font-medium",
          trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"
        )}>
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
          <span>{change > 0 ? "+" : ""}{change}% vs last month</span>
        </div>
      )}
    </Card>
  );
}

interface AdvertiserKPIBarProps {
  activeCampaigns: number;
  totalImpressions: number;
  avgCPM: number;
  offersPending: number;
  offersAccepted: number;
  totalSpend: number;
}

export function AdvertiserKPIBar({
  activeCampaigns,
  totalImpressions,
  avgCPM,
  offersPending,
  offersAccepted,
  totalSpend,
}: AdvertiserKPIBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KPICard
        title="Active Campaigns"
        value={activeCampaigns}
        icon={<Target className="w-5 h-5 text-[#2C6BED]" />}
        change={12}
        trend="up"
      />
      <KPICard
        title="Total Impressions"
        value={totalImpressions >= 1000 ? `${(totalImpressions / 1000).toFixed(1)}K` : totalImpressions}
        subtitle="Month to date"
        icon={<Eye className="w-5 h-5 text-[#2C6BED]" />}
        change={8}
        trend="up"
      />
      <KPICard
        title="Avg CPM"
        value={`$${avgCPM.toFixed(2)}`}
        icon={<DollarSign className="w-5 h-5 text-[#2C6BED]" />}
        change={-3}
        trend="down"
      />
      <KPICard
        title="Offers Pending"
        value={offersPending}
        subtitle={`${offersAccepted} accepted`}
        icon={<Handshake className="w-5 h-5 text-[#2C6BED]" />}
      />
      <KPICard
        title="Total Spend"
        value={`$${totalSpend.toLocaleString()}`}
        subtitle="This month"
        icon={<DollarSign className="w-5 h-5 text-[#2C6BED]" />}
        change={15}
        trend="up"
      />
    </div>
  );
}
