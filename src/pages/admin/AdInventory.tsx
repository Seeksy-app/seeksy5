import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { AdInventoryDetailDrawer } from '@/components/admin/AdInventoryDetailDrawer';

type InventoryStatus = 'available' | 'active' | 'lost' | 'reserved';
type OwnerType = 'seeksy' | 'creator' | 'partner' | 'all';

interface AdInventoryItem {
  id: string;
  name: string;
  type: string;
  channel: string;
  owner_type: string;
  owner_id: string | null;
  status: string;
  inventory_date: string | null;
  capacity: number | null;
  list_price: number;
  expected_cost: number;
  expected_profit: number;
  currency: string;
  linked_campaign_id: string | null;
  linked_creator_id: string | null;
  linked_ad_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<InventoryStatus, string> = {
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  reserved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const channelColors: Record<string, string> = {
  Blog: 'bg-purple-100 text-purple-800',
  Newsletter: 'bg-indigo-100 text-indigo-800',
  Instagram: 'bg-pink-100 text-pink-800',
  TikTok: 'bg-slate-100 text-slate-800',
  YouTube: 'bg-red-100 text-red-800',
  Podcast: 'bg-orange-100 text-orange-800',
  Event: 'bg-cyan-100 text-cyan-800',
  Awards: 'bg-yellow-100 text-yellow-800',
  App: 'bg-green-100 text-green-800',
  Network: 'bg-gray-100 text-gray-800',
};

export default function AdInventory() {
  const [selectedItem, setSelectedItem] = useState<AdInventoryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerType>('all');
  const [sortField, setSortField] = useState<string>('inventory_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['ad-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_inventory_items')
        .select('*')
        .order('inventory_date', { ascending: true });

      if (error) throw error;
      return data as AdInventoryItem[];
    },
  });

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const availableAndReserved = inventory.filter(
      (i) => i.status === 'available' || i.status === 'reserved'
    );
    const active = inventory.filter((i) => i.status === 'active');
    const lost = inventory.filter((i) => i.status === 'lost');

    const totalInventoryValue = availableAndReserved.reduce(
      (sum, i) => sum + Number(i.list_price),
      0
    );
    const bookedRevenue = active.reduce((sum, i) => sum + Number(i.list_price), 0);
    const lostRevenue = lost.reduce((sum, i) => sum + Number(i.list_price), 0);
    const totalActiveProfit = active.reduce((sum, i) => sum + Number(i.expected_profit), 0);
    const avgProfitMargin = bookedRevenue > 0 ? (totalActiveProfit / bookedRevenue) * 100 : 0;

    return { totalInventoryValue, bookedRevenue, lostRevenue, avgProfitMargin };
  }, [inventory]);

  // Filter and sort inventory
  const filteredInventory = useMemo(() => {
    let filtered = [...inventory];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          i.channel.toLowerCase().includes(term) ||
          i.type.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((i) => i.channel === typeFilter);
    }

    if (ownerFilter !== 'all') {
      filtered = filtered.filter((i) => i.owner_type === ownerFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof AdInventoryItem];
      let bVal: any = b[sortField as keyof AdInventoryItem];

      if (sortField === 'list_price' || sortField === 'expected_profit' || sortField === 'expected_cost') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }

      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [inventory, searchTerm, statusFilter, typeFilter, ownerFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (item: AdInventoryItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const uniqueChannels = useMemo(() => {
    return [...new Set(inventory.map((i) => i.channel))].sort();
  }, [inventory]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col items-start w-full space-y-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-foreground">Ad Inventory</h1>
          <p className="text-muted-foreground">
            Line-by-line ledger of all sellable ad opportunities across Seeksy and creators.
          </p>
        </div>
        <Button className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Add Inventory Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inventory Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">Available + Reserved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Booked Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(metrics.bookedRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Active campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lost Revenue</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.lostRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Missed opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Profit Margin
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgProfitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">On active inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {uniqueChannels.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(v as OwnerType)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                <SelectItem value="seeksy">Seeksy</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('inventory_date')}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('list_price')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Revenue
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('expected_profit')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Profit
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Campaign</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading inventory...
                    </TableCell>
                  </TableRow>
                ) : filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                          <DollarSign className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Ad Inventory Found</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm">
                          Add your first ad opportunity to begin tracking revenue and profit.
                        </p>
                        <Button className="gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Add Inventory Item
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(item)}
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={channelColors[item.channel] || 'bg-gray-100 text-gray-800'}
                        >
                          {item.channel}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{item.owner_type}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[item.status as InventoryStatus]}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.inventory_date
                          ? format(new Date(item.inventory_date), 'MMM d, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(item.list_price))}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(Number(item.expected_cost))}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatCurrency(Number(item.expected_profit))}
                      </TableCell>
                      <TableCell>
                        {item.linked_campaign_id ? (
                          <Badge variant="outline" className="text-xs">
                            Linked
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <AdInventoryDetailDrawer
        item={selectedItem}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
