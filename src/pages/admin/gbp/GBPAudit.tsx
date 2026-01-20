import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { GBPLayout } from "@/components/admin/gbp/GBPLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  FileText, 
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  Loader2,
  Clock
} from "lucide-react";
import { format } from "date-fns";

function GBPAuditContent() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['gbp-audit-logs', connection?.id, actionFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('gbp_audit_log')
        .select('*, gbp_locations(title)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (connection?.id) {
        query = query.eq('connection_id', connection.id);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const actionTypes = ['SYNC_READ', 'REPLY_REVIEW', 'UPDATE_HOURS', 'UPDATE_DESCRIPTION', 'OAUTH_CONNECT', 'OAUTH_DISCONNECT'];

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'SYNC_READ': return 'secondary';
      case 'REPLY_REVIEW': return 'default';
      case 'UPDATE_HOURS': return 'outline';
      case 'UPDATE_DESCRIPTION': return 'outline';
      case 'OAUTH_CONNECT': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="container max-w-6xl py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/gbp')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">All GBP operations are recorded here</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map(type => (
              <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
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
          ) : !logs?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <Collapsible key={log.id} asChild>
                    <>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                            >
                              {expandedRow === log.id ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(log.created_at), 'MMM d, h:mm a')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action_type) as any}>
                            {log.action_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {(log as any).gbp_locations?.title || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.status === 'success' ? 'outline' : log.status === 'error' ? 'destructive' : 'secondary'}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.duration_ms ? `${log.duration_ms}ms` : '—'}
                        </TableCell>
                      </TableRow>
                      {expandedRow === log.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {log.request_json && (
                                <div>
                                  <p className="font-medium mb-1">Request</p>
                                  <pre className="bg-background p-2 rounded text-xs overflow-auto max-h-40">
                                    {JSON.stringify(log.request_json, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.response_json && (
                                <div>
                                  <p className="font-medium mb-1">Response</p>
                                  <pre className="bg-background p-2 rounded text-xs overflow-auto max-h-40">
                                    {JSON.stringify(log.response_json, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.error_message && (
                                <div className="col-span-2">
                                  <p className="font-medium mb-1 text-destructive">Error</p>
                                  <p className="text-destructive bg-destructive/10 p-2 rounded">
                                    {log.error_message}
                                  </p>
                                </div>
                              )}
                              {log.target_google_resource && (
                                <div className="col-span-2">
                                  <p className="font-medium mb-1">Target Resource</p>
                                  <code className="text-xs bg-background p-1 rounded">
                                    {log.target_google_resource}
                                  </code>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GBPAudit() {
  return (
    <RequireAdmin>
      <GBPLayout title="Audit Log">
        <GBPAuditContent />
      </GBPLayout>
    </RequireAdmin>
  );
}
