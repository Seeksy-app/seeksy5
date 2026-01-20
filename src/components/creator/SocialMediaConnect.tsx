import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Instagram, Facebook, Twitter, Loader2, CheckCircle2, XCircle } from "lucide-react";

export function SocialMediaConnect() {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState<string | null>(null);

  const { data: connectedAccounts, isLoading } = useQuery({
    queryKey: ['social-media-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('social_media_accounts')
        .delete()
        .eq('id', accountId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-accounts'] });
      toast.success('Social media account disconnected');
    },
    onError: (error) => {
      console.error('Error disconnecting account:', error);
      toast.error('Failed to disconnect account');
    },
  });

  const refreshTokenMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('meta-refresh-token', {
        body: { accountId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-accounts'] });
      toast.success('Account token refreshed successfully');
    },
    onError: (error) => {
      console.error('Error refreshing token:', error);
      toast.error('Failed to refresh token. Please reconnect your account.');
    },
  });

  const connectMeta = async (platform: 'instagram' | 'facebook') => {
    setConnecting(platform);
    
    try {
      // Fetch Meta App ID from secrets
      const { data: configData } = await supabase.functions.invoke('get-meta-config');
      const metaAppId = configData?.appId || '';
      
      if (!metaAppId) {
        throw new Error('Meta App ID not configured');
      }
      
      const redirectUri = `${window.location.origin}/integrations/meta-callback`;
      
      // Request permissions for Instagram and Facebook
      // Note: instagram_manage_insights is not needed - insights are accessed via the connected Page
      const scope = platform === 'instagram' 
        ? 'instagram_basic,pages_show_list,pages_read_engagement'
        : 'pages_show_list,pages_read_engagement';

      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${metaAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `state=${platform}&` +
        `response_type=code`;

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      window.open(
        authUrl,
        'Connect ' + platform,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      window.addEventListener('message', handleOAuthCallback);
      
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      toast.error('Failed to initiate connection');
      setConnecting(null);
    }
  };

  const handleOAuthCallback = async (event: MessageEvent) => {
    console.log('Received OAuth callback:', event.data);
    
    if (event.data.type === 'meta-oauth-success') {
      const { code, platform } = event.data;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const redirectUri = `${window.location.origin}/integrations/meta-callback`;
        
        console.log('Calling meta-connect-account with:', { platform, redirectUri });
        
        const { data, error } = await supabase.functions.invoke('meta-connect-account', {
          body: { platform, code, redirectUri },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        console.log('Edge function response:', { data, error });

        if (error) throw error;
        
        if (data?.error) {
          throw new Error(data.error);
        }

        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`);
        queryClient.invalidateQueries({ queryKey: ['social-media-accounts'] });
        
      } catch (error) {
        console.error('Error connecting account:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to connect account';
        toast.error(errorMessage);
      } finally {
        setConnecting(null);
        window.removeEventListener('message', handleOAuthCallback);
      }
    } else if (event.data.type === 'meta-oauth-error') {
      console.error('OAuth error:', event.data.error);
      toast.error(`Connection failed: ${event.data.error}`);
      setConnecting(null);
      window.removeEventListener('message', handleOAuthCallback);
    }
  };

  const getAccountIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      case 'tiktok':
        return <Twitter className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const isAccountConnected = (platform: string) => {
    return connectedAccounts?.some(acc => acc.platform === platform);
  };

  const isTokenExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 7; // Warn if expiring within 7 days
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
        Social Media
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Instagram */}
        <Card className="p-6 hover:border-foreground/20 transition-colors">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 flex items-center justify-center">
              <img src="/integrations/instagram.svg" alt="Instagram" className="w-12 h-12" />
            </div>
            
            <div className="space-y-2 w-full">
              <h3 className="font-semibold">Instagram</h3>
              <p className="text-sm text-muted-foreground">
                Social Media
              </p>
            </div>
            {isAccountConnected('instagram') ? (
              <div className="w-full space-y-3">
                {connectedAccounts
                  ?.filter(acc => acc.platform === 'instagram')
                  .map(account => {
                    const expiringSoon = account.token_expires_at && isTokenExpiringSoon(account.token_expires_at);
                    const expired = account.token_expires_at && isTokenExpired(account.token_expires_at);
                    
                    return (
                      <div key={account.id} className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="truncate">@{account.platform_username}</span>
                        </div>
                        {expired && (
                          <p className="text-xs text-destructive">Token expired</p>
                        )}
                        {expiringSoon && !expired && (
                          <p className="text-xs text-amber-600">Expiring soon</p>
                        )}
                        <div className="flex gap-2">
                          {(expiringSoon || expired) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refreshTokenMutation.mutate(account.id)}
                              disabled={refreshTokenMutation.isPending}
                              className="flex-1"
                            >
                              {refreshTokenMutation.isPending ? 'Refreshing...' : 'Refresh'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => disconnectMutation.mutate(account.id)}
                            className="flex-1"
                          >
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <Button
                onClick={() => connectMeta('instagram')}
                disabled={connecting === 'instagram'}
                size="sm"
                className="w-full"
              >
                {connecting === 'instagram' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Facebook */}
        <Card className="p-6 hover:border-foreground/20 transition-colors">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 flex items-center justify-center">
              <img src="/integrations/facebook.svg" alt="Facebook" className="w-12 h-12" />
            </div>
            
            <div className="space-y-2 w-full">
              <h3 className="font-semibold">Facebook</h3>
              <p className="text-sm text-muted-foreground">
                Social Media
              </p>
            </div>
            {isAccountConnected('facebook') ? (
              <div className="w-full space-y-3">
                {connectedAccounts
                  ?.filter(acc => acc.platform === 'facebook')
                  .map(account => {
                    const expiringSoon = account.token_expires_at && isTokenExpiringSoon(account.token_expires_at);
                    const expired = account.token_expires_at && isTokenExpired(account.token_expires_at);
                    
                    return (
                      <div key={account.id} className="space-y-2">
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="truncate">{account.platform_username}</span>
                        </div>
                        {expired && (
                          <p className="text-xs text-destructive">Token expired</p>
                        )}
                        {expiringSoon && !expired && (
                          <p className="text-xs text-amber-600">Expiring soon</p>
                        )}
                        <div className="flex gap-2">
                          {(expiringSoon || expired) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refreshTokenMutation.mutate(account.id)}
                              disabled={refreshTokenMutation.isPending}
                              className="flex-1"
                            >
                              {refreshTokenMutation.isPending ? 'Refreshing...' : 'Refresh'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => disconnectMutation.mutate(account.id)}
                            className="flex-1"
                          >
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <Button
                onClick={() => connectMeta('facebook')}
                disabled={connecting === 'facebook'}
                size="sm"
                className="w-full"
              >
                {connecting === 'facebook' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
    </section>
  );
}
