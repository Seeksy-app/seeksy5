import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { GBPLayout } from "@/components/admin/gbp/GBPLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MapPin, 
  Search, 
  RefreshCw,
  ExternalLink,
  Phone,
  Globe,
  ChevronLeft,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { SeoLinkStatusChip } from "@/components/admin/shared/SeoLinkStatusChip";

function GBPLocationsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch connection
  const { data: connection } = useQuery({
    queryKey: ['gbp-connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_connections')
        .select('*')
        .eq('status', 'connected')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Fetch locations
  const { data: locations, isLoading } = useQuery({
    queryKey: ['gbp-locations', connection?.id, search, categoryFilter],
    queryFn: async () => {
      if (!connection?.id) return [];
      
      let query = supabase
        .from('gbp_locations')
        .select('*')
        .eq('connection_id', connection.id)
        .order('title', { ascending: true });

      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('primary_category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!connection?.id,
  });

  // Fetch SEO links for all GBP locations
  const { data: seoLinks } = useQuery({
    queryKey: ['gbp-seo-links-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_seo_links')
        .select(`
          gbp_location_id,
          seo_page_id,
          sync_status,
          seo_pages:seo_page_id (
            id,
            page_name
          )
        `);
      if (error) throw error;
      // Create a map for quick lookup
      const linkMap = new Map<string, { seoPageId: string; seoPageName: string; syncStatus: string }>();
      data?.forEach(link => {
        const page = link.seo_pages as any;
        if (page) {
          linkMap.set(link.gbp_location_id, {
            seoPageId: link.seo_page_id,
            seoPageName: page.page_name,
            syncStatus: link.sync_status
          });
        }
      });
      return linkMap;
    }
  });

  // Get unique categories
  const categories = [...new Set(locations?.map(l => l.primary_category).filter(Boolean) || [])];

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!connection?.id) throw new Error('No connection');
      const { data, error } = await supabase.functions.invoke('gbp-sync', {
        body: { connection_id: connection.id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.locations} locations`);
      queryClient.invalidateQueries({ queryKey: ['gbp-locations'] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    }
  });

  const formatAddress = (addressJson: any) => {
    if (!addressJson) return '—';
    const parts = [
      addressJson.locality,
      addressJson.administrativeArea,
    ].filter(Boolean);
    return parts.join(', ') || '—';
  };

  return (
    <div className="container max-w-6xl py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/gbp')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locations
            </h1>
            <p className="text-sm text-muted-foreground">
              {locations?.length || 0} locations synced
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={!connection?.id || syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !locations?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No locations found</p>
              <p className="text-sm">Connect and sync your Google Business Profile</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">SEO</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => {
                  const seoLink = seoLinks?.get(location.id);
                  const linkStatus = seoLink 
                    ? (seoLink.syncStatus as 'linked' | 'warning' | 'out_of_sync') 
                    : 'not_linked';
                  
                  return (
                    <TableRow 
                      key={location.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/admin/gbp/location/${location.id}`)}
                    >
                      <TableCell>
                        <SeoLinkStatusChip 
                          status={linkStatus}
                          targetType="seo"
                          targetId={seoLink?.seoPageId}
                          targetTitle={seoLink?.seoPageName}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{location.title}</div>
                        {location.store_code && (
                          <div className="text-xs text-muted-foreground">
                            Code: {location.store_code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatAddress(location.address_json)}
                      </TableCell>
                      <TableCell>
                        {location.phone ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {location.phone}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {location.primary_category ? (
                          <Badge variant="secondary" className="text-xs">
                            {location.primary_category}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {location.last_synced_at 
                          ? formatDistanceToNow(new Date(location.last_synced_at), { addSuffix: true })
                          : '—'}
                      </TableCell>
                    <TableCell>
                      {location.website && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(location.website, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GBPLocations() {
  return (
    <RequireAdmin>
      <GBPLayout title="Locations">
        <GBPLocationsContent />
      </GBPLayout>
    </RequireAdmin>
  );
}
