import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

type InventoryStatus = 'available' | 'active' | 'lost' | 'reserved';

interface AdInventoryItem {
  id: string;
  name: string;
  type: string;
  channel: string;
  owner_type: string;
  status: string;
  inventory_date: string | null;
  list_price: number;
  expected_cost: number;
  expected_profit: number;
  currency: string;
}

const statusColors: Record<InventoryStatus, string> = {
  available: 'bg-emerald-100 text-emerald-800',
  active: 'bg-blue-100 text-blue-800',
  lost: 'bg-red-100 text-red-800',
  reserved: 'bg-amber-100 text-amber-800',
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

export default function BoardInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['board-ad-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_inventory_items')
        .select('id, name, type, channel, owner_type, status, inventory_date, list_price, expected_cost, expected_profit, currency')
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

  // Filter inventory
  const filteredInventory = useMemo(() => {
    let filtered = [...inventory];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          i.channel.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    return filtered;
  }, [inventory, searchTerm, statusFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ad Inventory Overview</h1>
        <p className="text-muted-foreground">
          View all sellable ad opportunities across Seeksy and creator network.
        </p>
      </div>

      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This inventory view shows all currently sellable ad opportunities across Seeksy
          owned properties and the creator network. Data is read-only for board review.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading inventory...
                    </TableCell>
                  </TableRow>
                ) : filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id}>
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
                      <TableCell className="text-right font-medium text-emerald-600">
                        {formatCurrency(Number(item.expected_profit))}
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
  );
}
