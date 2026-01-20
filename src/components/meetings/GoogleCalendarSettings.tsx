import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Check, X, Calendar, ExternalLink, Settings2, Shield } from 'lucide-react';
import { GoogleVerifiedBadge } from '@/components/ui/google-verified-badge';

export function GoogleCalendarSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [googleOverride, setGoogleOverride] = useState(true);

  // Check for existing Google Calendar connection
  const { data: calendarConnection, isLoading, refetch } = useQuery({
    queryKey: ['google-calendar-connection'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle();

      if (error) {
        console.error('Error fetching calendar connection:', error);
        return null;
      }
      
      if (data) {
        setGoogleOverride(data.google_override_seeksy ?? true);
      }
      
      return data;
    }
  });

  // Connect Google Calendar
  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('google-calendar-auth', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect Google Calendar',
        variant: 'destructive'
      });
    }
  });

  // Update Google override setting
  const updateOverrideMutation = useMutation({
    mutationFn: async (override: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('calendar_connections')
        .update({ google_override_seeksy: override })
        .eq('user_id', user.id)
        .eq('provider', 'google');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast({ title: 'Settings updated' });
    }
  });

  // Sync calendar
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Update last_sync_at
      await supabase
        .from('calendar_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .eq('provider', 'google');

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast({ title: 'Calendar synced', description: 'Busy times have been refreshed.' });
    }
  });

  // Disconnect Google Calendar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('calendar_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connection'] });
      toast({ title: 'Disconnected', description: 'Google Calendar has been disconnected.' });
    }
  });

  const isConnected = !!calendarConnection;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <img src="/integrations/google-calendar.svg" alt="" className="w-5 h-5" />
              Google Calendar
              <GoogleVerifiedBadge variant="subtle" />
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Securely sync your calendar to prevent double-booking
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <Check className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : isConnected ? (
          <>
            {/* Connected state */}
            <div className="text-sm text-muted-foreground">
              Connected as <span className="font-medium">{calendarConnection?.calendar_email || 'Google Account'}</span>
            </div>

            {/* Override toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-sm">Google Overrides Seeksy</p>
                <p className="text-xs text-muted-foreground">Google busy times block Seeksy slots</p>
              </div>
              <Switch 
                checked={googleOverride}
                onCheckedChange={(v) => {
                  setGoogleOverride(v);
                  updateOverrideMutation.mutate(v);
                }}
              />
            </div>

            {/* Last sync info */}
            {calendarConnection?.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                Last synced: {new Date(calendarConnection.last_sync_at).toLocaleString()}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Not connected state */}
            <p className="text-sm text-muted-foreground">
              Securely connect your Google Calendar to automatically block times when you're busy.
            </p>
            <Button 
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
              className="w-full gap-2"
            >
              {connectMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Connect Google Calendar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
