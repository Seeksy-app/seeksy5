import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Target, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Eye,
  Search,
  ArrowUpDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  advertiser_id: string | null;
  status: string;
  total_budget: number;
  total_spent: number | null;
  total_impressions: number | null;
  cpm_bid: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface CampaignWithAdvertiser extends Campaign {
  advertiser_name: string;
}

type SortField = "name" | "budget" | "spent" | "impressions" | "status";
type SortOrder = "asc" | "desc";

export default function AdminCampaigns() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignWithAdvertiser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [advertiserFilter, setAdvertiserFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Summary stats
  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalImpressions, setTotalImpressions] = useState(0);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { data: campaignsData, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get advertiser names
      const campaignsWithAdvertisers = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          if (!campaign.advertiser_id) {
            return { ...campaign, advertiser_name: "Unknown" };
          }

          const { data: advertiser } = await supabase
            .from("advertisers")
            .select("company_name")
            .eq("id", campaign.advertiser_id)
            .single();

          return {
            ...campaign,
            advertiser_name: advertiser?.company_name || "Unknown",
          };
        })
      );

      setCampaigns(campaignsWithAdvertisers);

      // Calculate summary stats
      const active = campaignsWithAdvertisers.filter(c => c.status === "active").length;
      const budget = campaignsWithAdvertisers.reduce((sum, c) => sum + c.total_budget, 0);
      const spent = campaignsWithAdvertisers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
      const impressions = campaignsWithAdvertisers.reduce((sum, c) => sum + (c.total_impressions || 0), 0);

      setActiveCampaigns(active);
      setTotalBudget(budget);
      setTotalSpent(spent);
      setTotalImpressions(impressions);
    } catch (error) {
      console.error("Failed to load campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedCampaigns = campaigns
    .filter(campaign => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
      const matchesAdvertiser = advertiserFilter === "all" || campaign.advertiser_id === advertiserFilter;
      return matchesSearch && matchesStatus && matchesAdvertiser;
    })
    .sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "budget") {
        aVal = a.total_budget;
        bVal = b.total_budget;
      } else if (sortField === "spent") {
        aVal = a.total_spent || 0;
        bVal = b.total_spent || 0;
      } else if (sortField === "impressions") {
        aVal = a.total_impressions || 0;
        bVal = b.total_impressions || 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const uniqueAdvertisers = Array.from(
    new Set(campaigns.map(c => ({ id: c.advertiser_id, name: c.advertiser_name })))
  );

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      paused: "secondary",
      completed: "secondary",
      draft: "secondary",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ad Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage all advertising campaigns
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={() => navigate("/admin/advertising/campaigns/create")}>
            <Target className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/advertising/ads/create")}>
            <Activity className="h-4 w-4 mr-2" />
            Create Ad
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Allocated budget
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Actual spend
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalImpressions)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total delivered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign List */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign List</CardTitle>
            <CardDescription>
              View all campaigns with performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
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
                  <option value="completed">Completed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="w-[200px]">
                <select
                  value={advertiserFilter}
                  onChange={(e) => setAdvertiserFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All Advertisers</option>
                  {uniqueAdvertisers.map((adv) => (
                    <option key={adv.id} value={adv.id || ""}>
                      {adv.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("name")}
                        className="gap-1 px-0"
                      >
                        Campaign Name
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Advertiser</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("budget")}
                        className="gap-1 px-0"
                      >
                        Budget
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("spent")}
                        className="gap-1 px-0"
                      >
                        Spent
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("impressions")}
                        className="gap-1 px-0"
                      >
                        Impressions
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("status")}
                        className="gap-1 px-0"
                      >
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading campaigns...
                      </TableCell>
                    </TableRow>
                  ) : filteredAndSortedCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No campaigns found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.advertiser_name}</TableCell>
                        <TableCell>{formatCurrency(campaign.total_budget)}</TableCell>
                        <TableCell>{formatCurrency(campaign.total_spent || 0)}</TableCell>
                        <TableCell>{formatNumber(campaign.total_impressions || 0)}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/advertising/campaigns/${campaign.id}`)}
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
