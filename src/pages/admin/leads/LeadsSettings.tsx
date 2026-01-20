/**
 * Lead Intelligence Settings Page
 * 
 * Credits management, export, and data retention settings.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Coins, Download, Trash2, Settings, AlertCircle, 
  FileJson, FileSpreadsheet, Loader2, TrendingUp,
  Clock, Shield, CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

interface CreditAction {
  action: string;
  cost: number;
  description: string;
}

const CREDIT_COSTS: CreditAction[] = [
  { action: 'identity_match', cost: 3, description: 'Email/phone identified by provider' },
  { action: 'company_match', cost: 1, description: 'Company identified (B2B IP match)' },
  { action: 'ai_summary', cost: 2, description: 'AI-generated lead summary' },
  { action: 'export_csv', cost: 5, description: 'Export leads to CSV' },
];

function LeadsSettingsContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv_leads' | 'csv_events' | 'json'>('csv_leads');
  const [exportDateRange, setExportDateRange] = useState('7d');
  const [isExporting, setIsExporting] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);
  const [hardStop, setHardStop] = useState(true);

  // Fetch workspaces
  const { data: workspaces } = useQuery({
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

  // Fetch credits balance
  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ['lead-credits-balance', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return { balance: 0 };
      const { data, error } = await supabase
        .from('lead_workspace_credits')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || { balance: 0 };
    },
    enabled: !!activeWorkspace?.id
  });

  // Fetch credit usage history
  const { data: creditHistory } = useQuery({
    queryKey: ['lead-credits-history', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const { data, error } = await supabase
        .from('lead_credits_ledger')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id
  });

  // Export mutation
  const exportData = async () => {
    if (!activeWorkspace?.id) return;
    
    setIsExporting(true);
    try {
      const daysBack = exportDateRange === '7d' ? 7 : exportDateRange === '28d' ? 28 : 90;
      
      const { data, error } = await supabase.functions.invoke('lead-export', {
        body: {
          workspace_id: activeWorkspace.id,
          format: exportFormat,
          start_date: subDays(new Date(), daysBack).toISOString(),
          end_date: new Date().toISOString()
        }
      });

      if (error) throw error;
      
      // Download the file
      if (data?.url) {
        window.open(data.url, '_blank');
      }
      
      queryClient.invalidateQueries({ queryKey: ['lead-credits-balance', activeWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['lead-credits-history', activeWorkspace?.id] });
      toast.success("Export started!");
      setExportDialogOpen(false);
    } catch (err: any) {
      toast.error("Export failed", { description: err.message });
    } finally {
      setIsExporting(false);
    }
  };

  const getExportCost = () => {
    switch (exportFormat) {
      case 'csv_leads':
      case 'csv_events':
        return 5;
      case 'json':
        return 8;
      default:
        return 5;
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Workspace Found</h2>
          <Button onClick={() => navigate('/admin/leads/setup')}>Setup Workspace</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Lead Intelligence Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage credits, exports, and data retention
        </p>
      </div>

      {/* Credits Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              Credit Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creditsLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{credits?.balance || 0}</span>
                <span className="text-muted-foreground">credits</span>
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/credits')}>
              <CreditCard className="h-4 w-4 mr-2" />
              Add Credits
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Credit Costs</CardTitle>
            <CardDescription>How credits are consumed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {CREDIT_COSTS.map((item) => (
                <div key={item.action} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{item.description}</span>
                  <Badge variant="secondary">{item.cost} cr</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hard Stop Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Credit Hard Stop</CardTitle>
              <CardDescription>
                Block actions when credits are insufficient
              </CardDescription>
            </div>
            <Switch checked={hardStop} onCheckedChange={setHardStop} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hardStop 
              ? "Actions requiring credits will be blocked when balance is insufficient."
              : "Actions will continue but may result in a negative balance."}
          </p>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download your leads and events data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setExportDialogOpen(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Leads
            </Button>
          </div>

          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Lead Data</DialogTitle>
                <DialogDescription>
                  Choose format and date range for your export.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv_leads">CSV (Leads only)</SelectItem>
                      <SelectItem value="csv_events">CSV (Events only)</SelectItem>
                      <SelectItem value="json">JSON Bundle (All)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={exportDateRange} onValueChange={setExportDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="28d">Last 28 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-muted rounded flex items-center justify-between">
                  <span className="text-sm">Estimated cost:</span>
                  <Badge variant="secondary">{getExportCost()} credits</Badge>
                </div>

                {(credits?.balance || 0) < getExportCost() && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Insufficient credits
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={exportData}
                  disabled={isExporting || (credits?.balance || 0) < getExportCost()}
                >
                  {isExporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Export ({getExportCost()} cr)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Credit History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Credit History</CardTitle>
          <CardDescription>Recent credit usage</CardDescription>
        </CardHeader>
        <CardContent>
          {creditHistory && creditHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditHistory.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="capitalize">
                      {entry.event?.replace('_', ' ') || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.units < 0 ? 'destructive' : 'secondary'}>
                        {entry.units > 0 ? '+' : ''}{entry.units}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(entry.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              No credit history yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Retention
          </CardTitle>
          <CardDescription>
            Automatically delete old lead data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Retention Period</Label>
            <Select value={retentionDays.toString()} onValueChange={(v) => setRetentionDays(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Lead data older than {retentionDays} days will be automatically deleted.
          </p>
          <Button variant="outline" disabled>
            <Shield className="h-4 w-4 mr-2" />
            Save Retention Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeadsSettings() {
  return (
    <RequireAdmin>
      <LeadsSettingsContent />
    </RequireAdmin>
  );
}
