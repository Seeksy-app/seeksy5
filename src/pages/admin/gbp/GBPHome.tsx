import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { GBPLayout } from "@/components/admin/gbp/GBPLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  RefreshCw, 
  Link2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Shield,
  MessageSquare,
  BarChart3,
  FileText,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";

function GBPHomeContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [writeModeReason, setWriteModeReason] = useState("");
  const [showWriteModeModal, setShowWriteModeModal] = useState(false);
  const [pendingWriteMode, setPendingWriteMode] = useState(false);

  // Check for callback success
  useEffect(() => {
    if (searchParams.get('gbp_connected') === 'true') {
      toast.success("Google Business Profile connected successfully!");
      queryClient.invalidateQueries({ queryKey: ['gbp-connection'] });
      // Clean up URL
      navigate(location.pathname, { replace: true });
    }
    if (searchParams.get('error')) {
      toast.error(`Connection failed: ${searchParams.get('error')}`);
      navigate(location.pathname, { replace: true });
    }
  }, [searchParams, queryClient, navigate, location.pathname]);

  // Fetch connection status
  const { data: connection, isLoading: connectionLoading } = useQuery({
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

  // Fetch admin settings
  const { data: settings } = useQuery({
    queryKey: ['gbp-admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_admin_settings')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['gbp-stats', connection?.id],
    queryFn: async () => {
      if (!connection?.id) return null;
      const [locations, reviews, unreplied] = await Promise.all([
        supabase.from('gbp_locations').select('id', { count: 'exact' }).eq('connection_id', connection.id),
        supabase.from('gbp_reviews').select('id', { count: 'exact' }).eq('connection_id', connection.id),
        supabase.from('gbp_reviews').select('id', { count: 'exact' }).eq('connection_id', connection.id).eq('has_reply', false),
      ]);
      return {
        locations: locations.count || 0,
        reviews: reviews.count || 0,
        unreplied: unreplied.count || 0,
      };
    },
    enabled: !!connection?.id,
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('google-business-auth', {
        body: { 
          user_id: user.id, 
          redirect_url: window.location.origin + '/admin/gbp' 
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    },
    onError: (error) => {
      toast.error(`Failed to start connection: ${error.message}`);
    }
  });

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
      toast.success(`Synced ${data.locations} locations and ${data.reviews} reviews`);
      queryClient.invalidateQueries({ queryKey: ['gbp-stats'] });
      queryClient.invalidateQueries({ queryKey: ['gbp-locations'] });
      queryClient.invalidateQueries({ queryKey: ['gbp-reviews'] });
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    }
  });

  // Write mode toggle mutation
  const toggleWriteModeMutation = useMutation({
    mutationFn: async ({ enabled, reason }: { enabled: boolean; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('gbp_admin_settings')
        .update({
          write_mode_enabled: enabled,
          write_mode_reason: enabled ? reason : null,
          write_mode_enabled_by: enabled ? user?.id : null,
          write_mode_enabled_at: enabled ? new Date().toISOString() : null,
        })
        .eq('id', settings?.id);
      if (error) throw error;
    },
    onSuccess: (_, { enabled }) => {
      toast.success(enabled ? 'Write mode enabled' : 'Write mode disabled');
      queryClient.invalidateQueries({ queryKey: ['gbp-admin-settings'] });
      setShowWriteModeModal(false);
      setWriteModeReason("");
    },
    onError: (error) => {
      toast.error(`Failed to update write mode: ${error.message}`);
    }
  });

  const handleWriteModeToggle = (checked: boolean) => {
    if (checked) {
      setPendingWriteMode(true);
      setShowWriteModeModal(true);
    } else {
      toggleWriteModeMutation.mutate({ enabled: false, reason: "" });
    }
  };

  const confirmWriteMode = () => {
    if (!writeModeReason.trim()) {
      toast.error("Please provide a reason for enabling write mode");
      return;
    }
    toggleWriteModeMutation.mutate({ enabled: true, reason: writeModeReason });
  };

  const isConnected = connection?.status === 'connected';
  const isExpired = connection?.expires_at && new Date(connection.expires_at) < new Date();

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => syncMutation.mutate()}
          disabled={!isConnected || syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync Now
        </Button>
        <Button
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isPending}
        >
          {connectMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4 mr-2" />
          )}
          {isConnected ? 'Reconnect' : 'Connect GBP'}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {connectionLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : isConnected ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {connection.google_account_email}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Expires: {connection.expires_at ? format(new Date(connection.expires_at), 'MMM d, h:mm a') : 'Unknown'}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Not connected
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Synced Data</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats.locations}</p>
                  <p className="text-xs text-muted-foreground">Locations</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.reviews}</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.unreplied}</p>
                  <p className="text-xs text-muted-foreground">Unreplied</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data synced yet</p>
            )}
          </CardContent>
        </Card>

        {/* Write Mode */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Write Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="write-mode" className="text-sm">
                {settings?.write_mode_enabled ? 'Enabled' : 'Disabled (Read-only)'}
              </Label>
              <Switch
                id="write-mode"
                checked={settings?.write_mode_enabled || false}
                onCheckedChange={handleWriteModeToggle}
                disabled={toggleWriteModeMutation.isPending}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enable to reply to reviews and update business info
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Connect your Google Business Profile account using the button above</p>
          <p>2. Click "Sync Now" to pull in your locations and reviews</p>
          <p>3. Enable Write Mode only when you need to make changes</p>
          <p className="text-orange-600 font-medium">
            ⚠️ Write mode changes are published directly to Google
          </p>
        </CardContent>
      </Card>

      {/* Write Mode Confirmation Modal */}
      <Dialog open={showWriteModeModal} onOpenChange={(open) => {
        if (!open) {
          setShowWriteModeModal(false);
          setPendingWriteMode(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Enable Write Mode
            </DialogTitle>
            <DialogDescription>
              Write mode allows you to make changes that will be published directly to Google Business Profile. 
              This includes replying to reviews and updating business information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for enabling write mode</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Responding to customer reviews for Q4 2024"
                value={writeModeReason}
                onChange={(e) => setWriteModeReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-800">
              <strong>I understand that:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>Changes will be published to Google immediately</li>
                <li>All actions will be logged in the audit trail</li>
                <li>This affects the live business listing</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWriteModeModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmWriteMode}
              disabled={toggleWriteModeMutation.isPending || !writeModeReason.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {toggleWriteModeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enable Write Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GBPHome() {
  return (
    <RequireAdmin>
      <GBPLayout title="GBP Manager" showTabs={true}>
        <GBPHomeContent />
      </GBPLayout>
    </RequireAdmin>
  );
}
