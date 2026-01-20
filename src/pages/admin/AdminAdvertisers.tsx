import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Building2, 
  DollarSign, 
  Target, 
  Activity, 
  Plus, 
  Eye,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Advertiser {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  business_description: string | null;
  status: string | null;
  created_at: string;
}

interface AdvertiserWithStats extends Advertiser {
  active_campaigns: number;
  total_spend: number;
}

export default function AdminAdvertisers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [advertisers, setAdvertisers] = useState<AdvertiserWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Summary stats
  const [totalAdvertisers, setTotalAdvertisers] = useState(0);
  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [totalSpendYTD, setTotalSpendYTD] = useState(0);
  const [impressionsYTD, setImpressionsYTD] = useState(0);

  useEffect(() => {
    loadAdvertisers();
    loadSummaryStats();
  }, []);

  const loadAdvertisers = async () => {
    setLoading(true);
    try {
      const { data: advertisersData, error } = await supabase
        .from("advertisers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For each advertiser, get campaign stats
      const advertisersWithStats = await Promise.all(
        (advertisersData || []).map(async (advertiser) => {
          // Count active campaigns
          const { count: campaignCount } = await supabase
            .from("ad_campaigns")
            .select("*", { count: "exact", head: true })
            .eq("advertiser_id", advertiser.id)
            .eq("status", "active");

          // Calculate total spend
          const { data: campaigns } = await supabase
            .from("ad_campaigns")
            .select("total_spent")
            .eq("advertiser_id", advertiser.id);

          const totalSpend = campaigns?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0;

          return {
            ...advertiser,
            active_campaigns: campaignCount || 0,
            total_spend: totalSpend,
          };
        })
      );

      setAdvertisers(advertisersWithStats);
      setTotalAdvertisers(advertisersWithStats.length);
    } catch (error) {
      console.error("Failed to load advertisers:", error);
      toast.error("Failed to load advertisers");
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryStats = async () => {
    try {
      // Count all active campaigns
      const { count: campaignCount } = await supabase
        .from("ad_campaigns")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      setActiveCampaigns(campaignCount || 0);

      // Calculate total spend YTD
      const { data: campaigns } = await supabase
        .from("ad_campaigns")
        .select("total_spent")
        .gte("created_at", new Date(new Date().getFullYear(), 0, 1).toISOString());

      const totalSpend = campaigns?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0;
      setTotalSpendYTD(totalSpend);

      // Count impressions YTD
      const { count: impressionCount } = await supabase
        .from("ad_impressions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().getFullYear(), 0, 1).toISOString());

      setImpressionsYTD(impressionCount || 0);
    } catch (error) {
      console.error("Failed to load summary stats:", error);
    }
  };

  const filteredAdvertisers = advertisers.filter(advertiser => {
    const matchesSearch = 
      advertiser.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      advertiser.contact_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      advertiser.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusBadge = (status: string | null) => {
    const statusLower = (status || "active").toLowerCase();
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      paused: "secondary",
      pending: "secondary",
    };
    return (
      <Badge variant={variants[statusLower] || "default"}>
        {status || "Active"}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Advertisers</h1>
            <p className="text-muted-foreground mt-1">
              Manage all advertisers and their campaigns
            </p>
          </div>
          <Button 
            onClick={() => navigate("/admin/advertising/advertisers")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Manage Advertisers
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Advertisers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAdvertisers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All registered advertisers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently running campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend YTD</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpendYTD)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Year-to-date advertising spend
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions YTD</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(impressionsYTD)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total ad impressions delivered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Advertiser Directory</CardTitle>
            <CardDescription>
              View and manage all advertisers in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company or contact name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-[180px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Advertisers Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Advertiser Name</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Total Spend (YTD)</TableHead>
                    <TableHead>Active Campaigns</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading advertisers...
                      </TableCell>
                    </TableRow>
                  ) : filteredAdvertisers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No advertisers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdvertisers.map((advertiser) => (
                      <TableRow key={advertiser.id}>
                        <TableCell className="font-medium">
                          {advertiser.company_name}
                        </TableCell>
                        <TableCell>
                          {advertiser.business_description || "—"}
                        </TableCell>
                        <TableCell>{formatCurrency(advertiser.total_spend)}</TableCell>
                        <TableCell>{advertiser.active_campaigns}</TableCell>
                        <TableCell>{advertiser.contact_name}</TableCell>
                        <TableCell>{getStatusBadge(advertiser.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.info("Advertiser details view - Coming soon")}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
