import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, Building2, Wallet, FileCheck } from "lucide-react";

interface AdminStatsBarProps {
  totalRevenue: number;
  activeCampaigns: number;
  totalAdvertisers: number;
  pendingPayouts: number;
  pendingReviews: number;
}

export function AdminStatsBar({ 
  totalRevenue, 
  activeCampaigns, 
  totalAdvertisers, 
  pendingPayouts,
  pendingReviews 
}: AdminStatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Campaigns</p>
              <p className="text-2xl font-bold">{activeCampaigns}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Advertisers</p>
              <p className="text-2xl font-bold">{totalAdvertisers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Payouts</p>
              <p className="text-2xl font-bold">${pendingPayouts.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FileCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
              <p className="text-2xl font-bold">{pendingReviews}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
