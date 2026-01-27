import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Instagram, Facebook, TrendingUp, Users, Eye, RefreshCw, Linkedin, Twitter, Youtube, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface SocialMediaAccount {
  id: string;
  user_id: string;
  platform: string;
  account_name: string;
  account_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  platform_username?: string;
  is_business_account?: boolean;
}

export function SocialMediaAnalytics() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const { data: accounts, isLoading } = useQuery<SocialMediaAccount[]>({
    queryKey: ['social-media-accounts-analytics'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return [];
      
      const userId = authData.user.id;
      
      const result = await (supabase as any)
        .from('social_media_accounts')
        .select('*');
      
      if (result.error) throw result.error;
      if (!result.data) return [];
      
      // Filter and deduplicate client-side - show only the most recent account per platform
      const platformMap = new Map<string, any>();
      
      (result.data as any[])
        .filter((acc: any) => acc.user_id === userId)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .forEach((account: any) => {
          if (!platformMap.has(account.platform)) {
            platformMap.set(account.platform, account);
          }
        });
      
      return Array.from(platformMap.values()) as SocialMediaAccount[];
    },
  });

  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights, error: insightsError } = useQuery({
    queryKey: ['social-media-insights'],
    queryFn: async () => {
      console.log('Fetching social media insights...');
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('Invoking meta-fetch-insights edge function');
      const { data, error } = await supabase.functions.invoke('meta-fetch-insights', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      return data;
    },
    enabled: !!accounts && accounts.length > 0,
    retry: 1,
  });

  const handleRefresh = async () => {
    toast.info('Refreshing analytics...');
    try {
      await refetchInsights();
      toast.success('Analytics updated');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh analytics');
    }
  };

  const getMetricValue = (metrics: any[], metricName: string) => {
    const metric = metrics?.find((m: any) => m.name === metricName);
    if (!metric || !metric.values || metric.values.length === 0) return 0;
    return metric.values[metric.values.length - 1]?.value || 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Media Analytics</CardTitle>
          <CardDescription>
            Connect your social accounts to see your performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex justify-center gap-4 mb-6 opacity-50">
              <Instagram className="h-12 w-12" />
              <Facebook className="h-12 w-12" />
            </div>
            <p className="text-muted-foreground mb-4">
              No social media accounts connected
            </p>
            <Button onClick={() => navigate('/integrations')}>
              Connect Accounts
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4 text-blue-700" />;
      case 'x':
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />;
      case 'tiktok':
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                </Button>
              </CollapsibleTrigger>
              <div>
                <CardTitle>Social Media Analytics</CardTitle>
                <CardDescription>
                  Your connected accounts and campaign performance
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={insightsLoading}
              >
                <RefreshCw className={`h-4 w-4 ${insightsLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/integrations')}>
                Manage Accounts
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-6">
        {/* Connected Accounts with Analytics */}
        <div>
          <h3 className="text-sm font-medium mb-4 text-foreground">Connected Accounts</h3>
          <div className="grid gap-4">
            {accounts.map((account) => {
              const accountInsights = insights?.insights?.find((i: any) => i.accountId === account.id);
              const metrics = accountInsights?.metrics || [];
              const accountInfo = accountInsights?.accountInfo || {};
              const hasAnalytics = accountInsights && !accountInsights.error;
              
              return (
                <div key={account.id} className="p-5 bg-card border border-border rounded-xl space-y-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {getPlatformIcon(account.platform)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">@{account.platform_username || account.account_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {account.platform}
                          {account.is_business_account && ' • Business'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={hasAnalytics 
                      ? "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20" 
                      : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20"
                    }>
                      {hasAnalytics ? 'Active' : 'Setup Pending'}
                    </Badge>
                  </div>

                  {/* Analytics Metrics - Show if available */}
                  {hasAnalytics && (
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          {account.platform === 'instagram' ? 'Followers' : 'Fans'}
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {accountInfo.followers_count?.toLocaleString() || 
                           accountInfo.fan_count?.toLocaleString() || 
                           '-'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Impressions</p>
                        <p className="text-xl font-bold text-foreground">
                          {account.platform === 'instagram' 
                            ? getMetricValue(metrics, 'impressions').toLocaleString()
                            : getMetricValue(metrics, 'page_impressions').toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          {account.platform === 'instagram' ? 'Reach' : 'Engagement'}
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {account.platform === 'instagram'
                            ? getMetricValue(metrics, 'reach').toLocaleString()
                            : getMetricValue(metrics, 'page_engaged_users').toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Show basic info even without full analytics for Facebook */}
                  {!hasAnalytics && account.platform === 'facebook' && accountInfo.fan_count && (
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Page Fans</p>
                          <p className="text-lg font-semibold">
                            {accountInfo.fan_count.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          Full analytics available after app review
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Setup help for Instagram */}
                  {accountInsights?.error && account.platform === 'instagram' && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-yellow-600 mb-2">
                        ⚠️ Instagram analytics require additional setup:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                        <li>Link Instagram to Facebook Page in Instagram settings</li>
                        <li>Complete "Manage messaging & content" test in Meta App Dashboard</li>
                      </ul>
                    </div>
                  )}

                  {/* Generic error for other platforms */}
                  {accountInsights?.error && account.platform !== 'instagram' && !accountInfo.fan_count && (
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      Analytics require Meta app review. Basic page info connected successfully.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            Ready to start earning from your social media?
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/creator/campaigns')}>
            Browse Available Campaigns
          </Button>
        </div>
        </CardContent>
      </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
