import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Search, 
  Link2, 
  Link2Off, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  Clock,
  ExternalLink
} from "lucide-react";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { formatDistanceToNow } from "date-fns";

// Default workspace for now (could be dynamic in future)
const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

function AdminAnalyticsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [syncing, setSyncing] = useState<{ gsc: boolean; ga4: boolean }>({ gsc: false, ga4: false });

  // Fetch google connection
  const { data: connection, isLoading: connectionLoading } = useQuery({
    queryKey: ['google-connection', DEFAULT_WORKSPACE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_connections')
        .select('*')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .eq('provider', 'google')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Fetch analytics settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['analytics-settings', DEFAULT_WORKSPACE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_analytics_settings')
        .select('*')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Fetch GSC sites
  const { data: gscSites } = useQuery({
    queryKey: ['gsc-sites', DEFAULT_WORKSPACE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gsc_sites')
        .select('*')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID);
      if (error) throw error;
      return data || [];
    },
    enabled: !!connection
  });

  // Fetch GA4 properties
  const { data: ga4Properties } = useQuery({
    queryKey: ['ga4-properties', DEFAULT_WORKSPACE_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ga4_properties')
        .select('*')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID);
      if (error) throw error;
      return data || [];
    },
    enabled: !!connection
  });

  const enabledProducts = (connection?.enabled_products as string[]) || [];
  const isGscConnected = enabledProducts.includes('gsc') && !!connection?.access_token;
  const isGa4Connected = enabledProducts.includes('ga4') && !!connection?.access_token;

  // Handle OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'success') {
      toast({ title: "Google Analytics connected successfully" });
      queryClient.invalidateQueries({ queryKey: ['google-connection'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-settings'] });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('oauth') === 'error') {
      toast({ 
        title: "Connection failed", 
        description: params.get('message') || 'OAuth error',
        variant: "destructive" 
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    if (selectedProducts.length === 0) {
      toast({ title: "Select at least one product", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not authenticated", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke('google-analytics-auth', {
        body: {
          user_id: user.id,
          workspace_id: DEFAULT_WORKSPACE_ID,
          products: selectedProducts,
          redirect_url: window.location.origin + '/admin/analytics'
        }
      });

      if (response.error) throw response.error;
      if (response.data?.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error: any) {
      toast({ title: "Failed to start OAuth", description: error.message, variant: "destructive" });
    }
  };

  const handleDisconnect = async () => {
    try {
      // Delete connection
      await supabase
        .from('google_connections')
        .delete()
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .eq('provider', 'google');

      // Clear settings
      await supabase
        .from('workspace_analytics_settings')
        .update({ gsc_site_url: null, ga4_property_id: null })
        .eq('workspace_id', DEFAULT_WORKSPACE_ID);

      toast({ title: "Disconnected from Google" });
      queryClient.invalidateQueries({ queryKey: ['google-connection'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-settings'] });
      setDisconnectDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Failed to disconnect", description: error.message, variant: "destructive" });
    }
  };

  const saveSettings = useMutation({
    mutationFn: async (data: { gsc_site_url?: string | null; ga4_property_id?: string | null; sync_enabled?: boolean }) => {
      const { error } = await supabase
        .from('workspace_analytics_settings')
        .upsert({
          workspace_id: DEFAULT_WORKSPACE_ID,
          ...data,
          updated_at: new Date().toISOString()
        }, { onConflict: 'workspace_id' });
      if (error) throw error;

      // Log audit event
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('gbp_audit_log').insert({
        action_type: 'ANALYTICS_SETTINGS_UPDATED',
        actor_user_id: user?.id,
        location_id: DEFAULT_WORKSPACE_ID,
        request_json: data
      });
    },
    onSuccess: () => {
      toast({ title: "Analytics settings saved" });
      queryClient.invalidateQueries({ queryKey: ['analytics-settings'] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  });

  const handleSync = async (type: 'gsc' | 'ga4' | 'all') => {
    const types = type === 'all' ? ['gsc', 'ga4'] : [type];
    
    for (const t of types) {
      setSyncing(prev => ({ ...prev, [t]: true }));
      try {
        const fn = t === 'gsc' ? 'gsc-sync' : 'ga4-sync';
        const response = await supabase.functions.invoke(fn, {
          body: { workspace_id: DEFAULT_WORKSPACE_ID, days: 30 }
        });
        if (response.error) throw response.error;
        
        toast({ title: `${t.toUpperCase()} sync complete` });
        queryClient.invalidateQueries({ queryKey: [t === 'gsc' ? 'gsc-sites' : 'ga4-properties'] });
        queryClient.invalidateQueries({ queryKey: ['analytics-settings'] });
      } catch (error: any) {
        toast({ title: `${t.toUpperCase()} sync failed`, description: error.message, variant: "destructive" });
      } finally {
        setSyncing(prev => ({ ...prev, [t]: false }));
      }
    }
  };

  const isLoading = connectionLoading || settingsLoading;
  const isSyncing = syncing.gsc || syncing.ga4;

  return (
    <div className="container max-w-5xl py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics (GSC + GA4)
          </h1>
          <p className="text-muted-foreground text-sm">
            Connect Google Search Console and Google Analytics 4
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Section 1: Connections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Connections
              </CardTitle>
              <CardDescription>Google Search Console and Google Analytics 4 connection status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GSC Card */}
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Google Search Console</span>
                    </div>
                    {isGscConnected ? (
                      <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>
                    ) : (
                      <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Not connected</Badge>
                    )}
                  </div>
                  {isGscConnected && gscSites && (
                    <p className="text-xs text-muted-foreground">{gscSites.length} site(s) available</p>
                  )}
                </div>

                {/* GA4 Card */}
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Google Analytics 4</span>
                    </div>
                    {isGa4Connected ? (
                      <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>
                    ) : (
                      <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Not connected</Badge>
                    )}
                  </div>
                  {isGa4Connected && ga4Properties && (
                    <p className="text-xs text-muted-foreground">{ga4Properties.length} property/ies available</p>
                  )}
                </div>
              </div>

              {connection?.google_account_email && (
                <p className="text-sm text-muted-foreground">
                  Connected as: <span className="font-medium">{connection.google_account_email}</span>
                </p>
              )}

              <div className="flex gap-2">
                {!connection ? (
                  <Button onClick={() => { setSelectedProducts([]); setConnectModalOpen(true); }}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect Google
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => { setSelectedProducts(enabledProducts); setConnectModalOpen(true); }}>
                      <Settings className="h-4 w-4 mr-2" />
                      Reconnect / Add Products
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDisconnectDialogOpen(true)}>
                      <Link2Off className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Workspace Settings */}
          {connection && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Workspace Settings
                </CardTitle>
                <CardDescription>Select which GSC site and GA4 property to use</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GSC Site URL</Label>
                    <Select 
                      value={settings?.gsc_site_url || ''} 
                      onValueChange={(v) => saveSettings.mutate({ gsc_site_url: v || null })}
                      disabled={!gscSites?.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={gscSites?.length ? "Select a site..." : "No sites - run sync first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {gscSites?.map(site => (
                          <SelectItem key={site.id} value={site.site_url}>{site.site_url}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>GA4 Property</Label>
                    <Select 
                      value={settings?.ga4_property_id || ''} 
                      onValueChange={(v) => saveSettings.mutate({ ga4_property_id: v || null })}
                      disabled={!ga4Properties?.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={ga4Properties?.length ? "Select a property..." : "No properties - run sync first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {ga4Properties?.map(prop => (
                          <SelectItem key={prop.id} value={prop.property_id}>{prop.display_name || prop.property_id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="sync-enabled" 
                    checked={settings?.sync_enabled ?? true}
                    onCheckedChange={(v) => saveSettings.mutate({ sync_enabled: v })}
                  />
                  <Label htmlFor="sync-enabled">Sync enabled</Label>
                </div>
                {(!settings?.gsc_site_url || !settings?.ga4_property_id) && (
                  <p className="text-xs text-muted-foreground">
                    Select a site/property to sync page-level metrics.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section 3: Sync */}
          {connection && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Sync
                </CardTitle>
                <CardDescription>Fetch sites/properties and sync page metrics (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleSync('gsc')} 
                    disabled={!isGscConnected || isSyncing}
                  >
                    {syncing.gsc ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                    {settings?.gsc_site_url ? 'Sync GSC (30d)' : 'Fetch GSC Sites'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSync('ga4')} 
                    disabled={!isGa4Connected || isSyncing}
                  >
                    {syncing.ga4 ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                    {settings?.ga4_property_id ? 'Sync GA4 (30d)' : 'Fetch GA4 Properties'}
                  </Button>
                  <Button 
                    onClick={() => handleSync('all')} 
                    disabled={(!isGscConnected && !isGa4Connected) || isSyncing}
                  >
                    {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Sync All
                  </Button>
                </div>
                {settings?.last_synced_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last synced: {formatDistanceToNow(new Date(settings.last_synced_at), { addSuffix: true })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Connect Modal */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Google Analytics</DialogTitle>
            <DialogDescription>
              Select which Google products to connect with read-only access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="gsc" 
                checked={selectedProducts.includes('gsc')}
                onCheckedChange={(checked) => {
                  setSelectedProducts(prev => 
                    checked ? [...prev, 'gsc'] : prev.filter(p => p !== 'gsc')
                  );
                }}
              />
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" />
                <Label htmlFor="gsc" className="font-normal">Google Search Console</Label>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="ga4" 
                checked={selectedProducts.includes('ga4')}
                onCheckedChange={(checked) => {
                  setSelectedProducts(prev => 
                    checked ? [...prev, 'ga4'] : prev.filter(p => p !== 'ga4')
                  );
                }}
              />
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <Label htmlFor="ga4" className="font-normal">Google Analytics 4</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConnect} disabled={selectedProducts.length === 0}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect with Google
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Analytics?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all stored tokens and clear the selected GSC site and GA4 property. Synced metrics data will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminAnalytics() {
  return (
    <RequireAdmin>
      <AdminAnalyticsContent />
    </RequireAdmin>
  );
}
