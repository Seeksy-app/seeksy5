/**
 * Lead Intelligence Dashboard
 * 
 * Main dashboard with KPI cards, leads table, filters, and detail drawer.
 * Admin-only via RequireAdmin wrapper.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, Users, TrendingUp, Coins, Search, Filter, 
  ChevronRight, ExternalLink, Copy, Settings, 
  Globe, Zap, Eye, Phone, Mail, Calendar
} from "lucide-react";
import { formatDistanceToNow, subDays, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LeadDetailDrawer } from "@/components/admin/leads/LeadDetailDrawer";
import { LeadCreditsChip } from "@/components/admin/leads/LeadCreditsChip";

type LeadStatus = 'new' | 'qualified' | 'contacted' | 'meeting_set' | 'closed' | 'ignored';
type DateRange = '7d' | '28d' | 'custom';

function LeadsDashboardContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [intentFilter, setIntentFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch workspaces
  const { data: workspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ['lead-workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const activeWorkspace = workspaces?.[0];

  // Fetch leads
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['lead-intel-leads', activeWorkspace?.id, statusFilter, providerFilter, dateRange, search],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      let query = supabase
        .from('lead_intel_leads')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('last_seen_at', { ascending: false });

      // Date filter
      const daysBack = dateRange === '7d' ? 7 : dateRange === '28d' ? 28 : 90;
      query = query.gte('last_seen_at', subDays(new Date(), daysBack).toISOString());

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (providerFilter !== 'all') {
        query = query.eq('source', providerFilter);
      }

      if (search.trim()) {
        query = query.or(`person_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id
  });

  // KPI calculations
  const stats = {
    totalLeads: leads?.length || 0,
    highIntent: leads?.filter(l => (l.intent_score || 0) >= 70).length || 0,
    withEmail: leads?.filter(l => l.email).length || 0,
    newLeads: leads?.filter(l => l.status === 'new').length || 0,
  };

  // Fetch credits balance
  const { data: creditsBalance } = useQuery({
    queryKey: ['lead-credits-balance', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return 0;
      const { data, error } = await supabase
        .from('lead_workspace_credits')
        .select('balance')
        .eq('workspace_id', activeWorkspace.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data?.balance || 0;
    },
    enabled: !!activeWorkspace?.id
  });

  const handleOpenLead = (lead: any) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  const getStatusBadge = (status: LeadStatus) => {
    const styles: Record<LeadStatus, string> = {
      new: "bg-blue-100 text-blue-800",
      qualified: "bg-green-100 text-green-800",
      contacted: "bg-yellow-100 text-yellow-800",
      meeting_set: "bg-purple-100 text-purple-800",
      closed: "bg-gray-100 text-gray-800",
      ignored: "bg-red-100 text-red-800",
    };
    return <Badge className={styles[status] || styles.new}>{status.replace('_', ' ')}</Badge>;
  };

  const getIntentBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-500 text-white">High</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  const getProviderBadge = (source: string) => {
    const styles: Record<string, string> = {
      warmly: "bg-orange-100 text-orange-800",
      opensend: "bg-blue-100 text-blue-800",
      pixel: "bg-purple-100 text-purple-800",
      manual: "bg-gray-100 text-gray-800",
    };
    return <Badge className={styles[source] || styles.manual}>{source}</Badge>;
  };

  if (workspacesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Lead Workspace Found</h2>
          <p className="text-muted-foreground mb-4">
            Set up your first Lead Intelligence workspace to start capturing leads.
          </p>
          <Button onClick={() => navigate('/admin/leads/setup')}>
            <Zap className="h-4 w-4 mr-2" />
            Get Started
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Lead Intelligence
          </h1>
          <p className="text-muted-foreground text-sm">
            {activeWorkspace.name} • {activeWorkspace.mode} mode
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LeadCreditsChip balance={creditsBalance || 0} />
          <Button variant="outline" onClick={() => navigate('/admin/leads/setup')}>
            <Settings className="h-4 w-4 mr-2" />
            Setup
          </Button>
          <Button onClick={() => navigate('/admin/leads/providers')}>
            <Globe className="h-4 w-4 mr-2" />
            Providers
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
                <p className="text-xs text-muted-foreground">Total Leads ({dateRange})</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.highIntent}</p>
                <p className="text-xs text-muted-foreground">High Intent</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.withEmail}</p>
                <p className="text-xs text-muted-foreground">With Email</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.newLeads}</p>
                <p className="text-xs text-muted-foreground">New Leads</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex border rounded-md overflow-hidden">
              {(['7d', '28d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    dateRange === range 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="meeting_set">Meeting Set</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="warmly">Warmly</SelectItem>
                <SelectItem value="opensend">OpenSend</SelectItem>
                <SelectItem value="pixel">Pixel</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={intentFilter} onValueChange={setIntentFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Intent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intent</SelectItem>
                <SelectItem value="high">High (70+)</SelectItem>
                <SelectItem value="medium">Medium (40-69)</SelectItem>
                <SelectItem value="low">Low (&lt;40)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          {leadsLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !leads?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No leads found</p>
              <p className="text-sm">Leads will appear once your pixel starts capturing visitors.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Lead</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOpenLead(lead)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {lead.person_name || lead.email || `Anonymous ${lead.id.slice(0, 8)}`}
                          </p>
                          {lead.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{lead.company_name || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIntentBadge(lead.intent_score || 0)}
                        <span className="text-xs text-muted-foreground">{lead.intent_score || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getProviderBadge(lead.source || 'manual')}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {lead.last_seen_at 
                          ? formatDistanceToNow(new Date(lead.last_seen_at), { addSuffix: true })
                          : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lead.status as LeadStatus)}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        workspaceId={activeWorkspace?.id}
      />
    </div>
  );
}

export default function LeadsDashboard() {
  return (
    <RequireAdmin>
      <LeadsDashboardContent />
    </RequireAdmin>
  );
}
