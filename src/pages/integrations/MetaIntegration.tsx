import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, Facebook, TrendingUp, Users, BarChart3, AlertCircle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Meta API Scopes we'll need
export const META_SCOPES = {
  instagram: [
    'instagram_basic',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
  ],
  facebook: [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_read_user_content',
  ],
};

interface MetaIntegration {
  id: string;
  platform: 'facebook' | 'instagram';
  username: string | null;
  followers_count: number;
  engagement_rate: number;
  last_synced_at: string | null;
  is_active: boolean;
}

export default function MetaIntegration() {
  const [connecting, setConnecting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle OAuth callback params
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const count = searchParams.get('count');

    if (success === 'true') {
      toast.success(`Successfully connected ${count} Instagram account(s)!`);
      navigate('/integrations/meta', { replace: true });
    } else if (error) {
      toast.error(`Connection failed: ${error}`);
      navigate('/integrations/meta', { replace: true });
    }
  }, [searchParams, navigate]);

  // Fetch connected Meta accounts
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['meta-integrations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('meta_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MetaIntegration[];
    },
  });

  const handleConnect = async (platform: 'facebook' | 'instagram') => {
    setConnecting(true);
    try {
      // Call meta-auth edge function to get OAuth URL
      const { data, error } = await supabase.functions.invoke('meta-auth');
      
      if (error) {
        console.error('[MetaIntegration] Error:', error);
        alert('Failed to initiate connection');
        return;
      }

      if (data?.authUrl) {
        // Redirect to Meta OAuth
        window.location.href = data.authUrl;
      } else {
        alert('Invalid response from server');
      }
    } catch (error) {
      console.error('[MetaIntegration] Error:', error);
      alert('Failed to connect to Meta');
    } finally {
      setConnecting(false);
    }
  };

  const connectedInstagram = integrations?.find(i => i.platform === 'instagram');
  const connectedFacebook = integrations?.find(i => i.platform === 'facebook');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9] dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meta Integrations</h1>
          <p className="text-muted-foreground">
            Connect your Facebook and Instagram accounts to sync metrics and audience data
          </p>
        </div>

        {/* Alert Banner */}
        <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Ready to Connect
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Click "Connect Instagram" below to authorize Seeksy to access your Instagram Business account metrics. You'll be redirected to Facebook to complete the connection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Instagram Card */}
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Instagram className="h-6 w-6 text-white" />
                </div>
                {connectedInstagram ? (
                  <Badge className="bg-green-500">Connected</Badge>
                ) : (
                  <Badge variant="outline">Not Connected</Badge>
                )}
              </div>
              <CardTitle>Instagram</CardTitle>
              <CardDescription>
                Sync followers, engagement metrics, and post performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectedInstagram ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Followers</span>
                    </div>
                    <span className="font-semibold">{connectedInstagram.followers_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Engagement Rate</span>
                    </div>
                    <span className="font-semibold">{connectedInstagram.engagement_rate}%</span>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2 mb-4">
                    <p className="font-medium">Will sync:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Follower count & growth</li>
                      <li>Last 10 posts metrics</li>
                      <li>Engagement rates</li>
                      <li>Audience demographics</li>
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={() => handleConnect('instagram')}
                    disabled={connecting}
                  >
                    {connecting ? 'Connecting...' : 'Connect Instagram'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Facebook Card */}
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-600">
                  <Facebook className="h-6 w-6 text-white" />
                </div>
                {connectedFacebook ? (
                  <Badge className="bg-green-500">Connected</Badge>
                ) : (
                  <Badge variant="outline">Not Connected</Badge>
                )}
              </div>
              <CardTitle>Facebook</CardTitle>
              <CardDescription>
                Sync page insights, audience data, and post analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectedFacebook ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Page Likes</span>
                    </div>
                    <span className="font-semibold">{connectedFacebook.followers_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Engagement Rate</span>
                    </div>
                    <span className="font-semibold">{connectedFacebook.engagement_rate}%</span>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2 mb-4">
                    <p className="font-medium">Will sync:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Page followers & reach</li>
                      <li>Post performance</li>
                      <li>Engagement metrics</li>
                      <li>Audience insights</li>
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleConnect('facebook')}
                    disabled={connecting}
                  >
                    {connecting ? 'Connecting...' : 'Connect Facebook'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* API Scopes Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Prepared API Scopes
            </CardTitle>
            <CardDescription>
              Data permissions ready for OAuth integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-purple-600" />
                  Instagram Scopes
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {META_SCOPES.instagram.map(scope => (
                    <li key={scope} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                      <code className="text-xs bg-muted px-2 py-1 rounded">{scope}</code>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Facebook Scopes
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {META_SCOPES.facebook.map(scope => (
                    <li key={scope} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      <code className="text-xs bg-muted px-2 py-1 rounded">{scope}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}