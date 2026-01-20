import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Instagram, RefreshCw, Users, Eye, TrendingUp, Heart, 
  MessageCircle, Bookmark, Image, Video, Search, 
  AlertCircle, ArrowUpRight, BarChart3, Youtube, Plus, Facebook
} from "lucide-react";
import { 
  useSocialProfiles, 
  useSocialPosts, 
  useSocialInsights, 
  useSyncSocialData,
  useTopPosts 
} from "@/hooks/useSocialMediaSync";
import { SocialOnboardingChecklist } from "@/components/social/SocialOnboardingChecklist";
import { CreatorValuationCard } from "@/components/social/CreatorValuationCard";
import { InstagramReconnectBanner } from "@/components/social/InstagramReconnectBanner";
import { YouTubeChannelSelectModal } from "@/components/social/YouTubeChannelSelectModal";
import { FacebookPageSelectModal } from "@/components/social/FacebookPageSelectModal";
import { SyncStatusBanner } from "@/components/social/SyncStatusBanner";
import { useYouTubeConnect } from "@/hooks/useYouTubeConnect";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";

export default function SocialAnalytics() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<string>("engagement");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get tab from URL or default to 'instagram'
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl || 'instagram');
  
  const { data: profiles, isLoading: profilesLoading, refetch: refetchProfiles } = useSocialProfiles();
  const instagramProfile = profiles?.find(p => p.platform === 'instagram');
  const youtubeProfile = profiles?.find(p => p.platform === 'youtube');
  const facebookProfile = profiles?.find(p => p.platform === 'facebook');
  
  const { data: instagramPosts } = useSocialPosts(instagramProfile?.id || null);
  const { data: youtubePosts } = useSocialPosts(youtubeProfile?.id || null);
  const { data: facebookPosts } = useSocialPosts(facebookProfile?.id || null);
  const { data: instagramInsights } = useSocialInsights(instagramProfile?.id || null);
  const { data: youtubeInsights } = useSocialInsights(youtubeProfile?.id || null);
  const { data: facebookInsights } = useSocialInsights(facebookProfile?.id || null);
  const { data: topPosts } = useTopPosts(instagramProfile?.id || null, 5);
  const { data: topYoutubeVideos } = useTopPosts(youtubeProfile?.id || null, 5);
  const { data: topFacebookPosts } = useTopPosts(facebookProfile?.id || null, 5);
  const { syncData, isSyncing } = useSyncSocialData();
  const { connectYouTube, syncYouTube, isConnecting } = useYouTubeConnect();

  // Selection sessions
  const ytSelectSession = searchParams.get('yt_select_session');
  const fbSelectSession = searchParams.get('fb_select_session');

  // Handle YouTube channel selection modal close
  const handleChannelSelectClose = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('yt_select_session');
    setSearchParams(newParams);
  };

  // Handle successful YouTube channel connection
  const handleChannelConnected = (channelName: string) => {
    toast({
      title: `YouTube channel "${channelName}" connected!`,
      description: "Syncing your channel data now.",
    });
    refetchProfiles();
    setSearchParams({});
  };

  // Handle Facebook page selection modal close
  const handlePageSelectClose = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('fb_select_session');
    setSearchParams(newParams);
  };

  // Handle successful Facebook page connection
  const handlePageConnected = (pageName: string) => {
    toast({
      title: `Facebook Page "${pageName}" connected!`,
      description: "Syncing your page data now.",
    });
    refetchProfiles();
    setSearchParams({});
  };

  // Connect to Meta (for Facebook)
  const connectFacebook = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please sign in first", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.functions.invoke('meta-auth');
      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      toast({ title: "Failed to connect", variant: "destructive" });
    }
  };

  // Handle success redirect from OAuth callback
  useEffect(() => {
    const connected = searchParams.get('connected');
    const tab = searchParams.get('tab');
    const error = searchParams.get('error');
    const youtubeError = searchParams.get('youtube_error');
    
    // Auto-switch to the tab from URL
    if (tab) {
      setActiveTab(tab);
    }
    
    if (connected === 'instagram') {
      toast({
        title: "Instagram Connected!",
        description: "We're syncing your posts and insights. This may take a few minutes.",
      });
      refetchProfiles();
      // Keep tab param but remove connected
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('connected');
      setSearchParams(newParams);
    }
    
    // Only show auto-connected toast if there's no select session (single channel case)
    if (connected === 'youtube' && !ytSelectSession) {
      toast({
        title: "YouTube Connected!",
        description: "We're syncing your channel data now. This may take a few minutes.",
      });
      refetchProfiles();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('connected');
      setSearchParams(newParams);
    }
    
    // Handle Facebook connection (only if no select session - single page auto-connected)
    if (connected === 'facebook' && !fbSelectSession) {
      toast({
        title: "Facebook Connected!",
        description: "We're syncing your page data now. This may take a few minutes.",
      });
      refetchProfiles();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('connected');
      setSearchParams(newParams);
    }
    
    if (error) {
      toast({
        title: "Connection Failed",
        description: error === 'token_failed' 
          ? "Failed to exchange token. Please try again."
          : error === 'pages_failed'
          ? "Couldn't access your Facebook pages. Make sure you have a Facebook Page linked to your Instagram Business account."
          : "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setSearchParams({});
    }
    
    if (youtubeError) {
      toast({
        title: "YouTube Connection Failed",
        description: youtubeError,
        variant: "destructive",
      });
      setSearchParams({});
    }
  }, [searchParams, toast, setSearchParams, refetchProfiles, ytSelectSession, fbSelectSession]);

  const isInstagramTokenExpired = instagramProfile?.sync_status === 'token_expired';
  const isYouTubeTokenExpired = youtubeProfile?.sync_status === 'token_expired';
  const isFacebookTokenExpired = facebookProfile?.sync_status === 'token_expired';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Sort posts
  const posts = activeTab === 'youtube' ? youtubePosts : instagramPosts;
  const sortedPosts = [...(posts || [])].sort((a, b) => {
    switch (sortBy) {
      case "engagement":
        return b.engagement_rate - a.engagement_rate;
      case "reach":
        return (b.reach || 0) - (a.reach || 0);
      case "date":
      default:
        return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
    }
  });

  // Filter posts by search
  const filteredPosts = sortedPosts.filter(post => 
    post.caption?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare insights chart data
  const insights = activeTab === 'youtube' ? youtubeInsights : instagramInsights;
  const insightsChartData = [...(insights || [])].reverse().map(insight => ({
    date: format(new Date(insight.snapshot_date), 'MMM d'),
    followers: insight.follower_count,
    reach: insight.reach,
    impressions: insight.impressions,
    engagement: insight.engagement_rate,
  }));

  const currentProfile = activeTab === 'youtube' ? youtubeProfile : instagramProfile;
  const currentTopPosts = activeTab === 'youtube' ? topYoutubeVideos : topPosts;
  const isTokenExpired = activeTab === 'youtube' ? isYouTubeTokenExpired : activeTab === 'facebook' ? isFacebookTokenExpired : isInstagramTokenExpired;
  const hasAnyProfile = instagramProfile || youtubeProfile || facebookProfile;

  if (profilesLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // No profiles connected at all - show connect options
  if (!hasAnyProfile) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Helmet>
          <title>Social Analytics – Seeksy</title>
        </Helmet>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Social Analytics</h1>
            <p className="text-muted-foreground">Connect your social accounts to view analytics and performance metrics.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  Instagram
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Connect your Instagram Business account to view followers, engagement, and post analytics.
                </p>
                <Button 
                  onClick={() => navigate('/integrations')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  Connect Instagram
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-500" />
                  YouTube
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Connect your YouTube channel to view subscribers, views, and video analytics.
                </p>
                <Button 
                  onClick={connectYouTube}
                  disabled={isConnecting}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500"
                >
                  {isConnecting ? 'Connecting...' : 'Connect YouTube'}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  Facebook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Connect your Facebook Page to view fans, reach, and post analytics.
                </p>
                <Button 
                  onClick={connectFacebook}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500"
                >
                  Connect Facebook
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      <Helmet>
        <title>Social Analytics – Seeksy</title>
        <meta name="description" content="View your social media analytics and performance" />
      </Helmet>

      {/* Platform Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          {instagramProfile && (
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              Instagram
            </TabsTrigger>
          )}
          {youtubeProfile && (
            <TabsTrigger value="youtube" className="gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              YouTube
            </TabsTrigger>
          )}
          {facebookProfile && (
            <TabsTrigger value="facebook" className="gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook
            </TabsTrigger>
          )}
          {!youtubeProfile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 ml-2"
              onClick={connectYouTube}
              disabled={isConnecting}
            >
              <Plus className="h-4 w-4" />
              <Youtube className="h-4 w-4 text-red-500" />
              Add YouTube
            </Button>
          )}
          {!instagramProfile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 ml-2"
              onClick={() => navigate('/integrations')}
            >
              <Plus className="h-4 w-4" />
              <Instagram className="h-4 w-4 text-pink-500" />
              Add Instagram
            </Button>
          )}
          {!facebookProfile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 ml-2"
              onClick={connectFacebook}
            >
              <Plus className="h-4 w-4" />
              <Facebook className="h-4 w-4 text-blue-600" />
              Add Facebook
            </Button>
          )}
        </TabsList>

        {/* Instagram Content */}
        {instagramProfile && (
          <TabsContent value="instagram" className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {instagramProfile.profile_picture ? (
                  <img 
                    src={instagramProfile.profile_picture} 
                    alt={instagramProfile.username || 'Profile'} 
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Instagram className="h-8 w-8 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">@{instagramProfile.username}</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{instagramProfile.account_type || 'Creator'}</Badge>
                    {instagramProfile.last_sync_at && (
                      <span className="text-xs text-muted-foreground">
                        Last synced {formatDistanceToNow(new Date(instagramProfile.last_sync_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => syncData(instagramProfile.id)}
                disabled={isSyncing || isInstagramTokenExpired}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Data
              </Button>
            </div>

            {isInstagramTokenExpired && (
              <InstagramReconnectBanner error={instagramProfile.sync_error || undefined} />
            )}

            {/* Sync Status Banner */}
            <SyncStatusBanner 
              syncStatus={instagramProfile.sync_status}
              platform="instagram"
              onSyncComplete={() => refetchProfiles()}
              onManualSync={() => syncData(instagramProfile.id)}
            />

            {/* Instagram Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Followers</span>
                  </div>
                  <p className="text-3xl font-bold">{formatNumber(instagramProfile.followers_count)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Following</span>
                  </div>
                  <p className="text-3xl font-bold">{formatNumber(instagramProfile.follows_count)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Image className="h-4 w-4" />
                    <span className="text-sm">Posts</span>
                  </div>
                  <p className="text-3xl font-bold">{formatNumber(instagramProfile.media_count)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Avg Engagement</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {instagramPosts?.length 
                      ? (instagramPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / instagramPosts.length).toFixed(2)
                      : '0.00'}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Onboarding & Valuation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SocialOnboardingChecklist />
              <div className="md:col-span-2">
                <CreatorValuationCard profileId={instagramProfile.id} />
              </div>
            </div>
          </TabsContent>
        )}

        {/* YouTube Content */}
        {youtubeProfile && (
          <TabsContent value="youtube" className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {youtubeProfile.profile_picture ? (
                  <img 
                    src={youtubeProfile.profile_picture} 
                    alt={youtubeProfile.username || 'Channel'} 
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center">
                    <Youtube className="h-8 w-8 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{youtubeProfile.username}</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-red-100 text-red-700">YouTube</Badge>
                    {youtubeProfile.last_sync_at && (
                      <span className="text-xs text-muted-foreground">
                        Last synced {formatDistanceToNow(new Date(youtubeProfile.last_sync_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => syncYouTube(youtubeProfile.id)}
                disabled={isSyncing || isYouTubeTokenExpired}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Data
              </Button>
            </div>

            {isYouTubeTokenExpired && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="flex items-center gap-4 py-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">YouTube token expired</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Reconnect to continue syncing data.</p>
                  </div>
                  <Button onClick={connectYouTube} variant="outline" size="sm">
                    Reconnect
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Sync Status Banner */}
            <SyncStatusBanner 
              syncStatus={youtubeProfile.sync_status}
              platform="youtube"
              onSyncComplete={() => refetchProfiles()}
              onManualSync={() => syncYouTube(youtubeProfile.id)}
            />

            {/* YouTube Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Subscribers</span>
                  </div>
                  <p className="text-3xl font-bold">{formatNumber(youtubeProfile.followers_count)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Video className="h-4 w-4" />
                    <span className="text-sm">Videos</span>
                  </div>
                  <p className="text-3xl font-bold">{formatNumber(youtubeProfile.media_count)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Total Views</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {youtubeInsights?.[0]?.reach 
                      ? formatNumber(youtubeInsights[0].reach)
                      : '—'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Avg Engagement</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {youtubePosts?.length 
                      ? (youtubePosts.reduce((sum, p) => sum + p.engagement_rate, 0) / youtubePosts.length).toFixed(2)
                      : '0.00'}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* YouTube Valuation + Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SocialOnboardingChecklist />
              <div className="md:col-span-2">
                <CreatorValuationCard profileId={youtubeProfile.id} platform="youtube" />
              </div>
            </div>

            {/* Top Videos */}
            {topYoutubeVideos && topYoutubeVideos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topYoutubeVideos.slice(0, 5).map(video => (
                      <a 
                        key={video.id}
                        href={video.permalink || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        {video.media_url ? (
                          <img 
                            src={video.media_url} 
                            alt={video.caption?.slice(0, 30) || 'Video'}
                            className="w-24 h-14 object-cover rounded"
                          />
                        ) : (
                          <div className="w-24 h-14 bg-muted rounded flex items-center justify-center">
                            <Video className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{video.caption || 'Untitled'}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatNumber(video.views_count || 0)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {formatNumber(video.like_count)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {formatNumber(video.comment_count)}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary">{video.engagement_rate.toFixed(2)}%</Badge>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Facebook Content */}
        {facebookProfile && (
          <TabsContent value="facebook" className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {facebookProfile.profile_picture ? (
                  <img 
                    src={facebookProfile.profile_picture} 
                    alt={facebookProfile.username || 'Page'} 
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                    <Facebook className="h-8 w-8 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{facebookProfile.username}</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {facebookProfile.account_type || 'Page'}
                    </Badge>
                    {facebookProfile.last_sync_at && (
                      <span className="text-xs text-muted-foreground">
                        Last synced {formatDistanceToNow(new Date(facebookProfile.last_sync_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => syncData(facebookProfile.id)}
                disabled={isSyncing || isFacebookTokenExpired}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Data
              </Button>
            </div>

            {isFacebookTokenExpired && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="flex items-center gap-4 py-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Facebook token expired</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Reconnect to continue syncing data.</p>
                  </div>
                  <Button onClick={connectFacebook} variant="outline" size="sm">
                    Reconnect
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Sync Status Banner */}
            <SyncStatusBanner 
              syncStatus={facebookProfile.sync_status}
              platform="facebook"
              onSyncComplete={() => refetchProfiles()}
              onManualSync={() => syncData(facebookProfile.id)}
            />

            {/* Facebook Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Fans / Followers</span>
                  </div>
                  <p className="text-3xl font-bold">{formatNumber(facebookProfile.followers_count)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Image className="h-4 w-4" />
                    <span className="text-sm">Posts</span>
                  </div>
                  <p className="text-3xl font-bold">{formatNumber(facebookProfile.media_count)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Page Reach</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {facebookInsights?.[0]?.reach 
                      ? formatNumber(facebookInsights[0].reach)
                      : '—'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Avg Engagement</span>
                  </div>
                  <p className="text-3xl font-bold">
                    {facebookPosts?.length 
                      ? (facebookPosts.reduce((sum, p) => sum + p.engagement_rate, 0) / facebookPosts.length).toFixed(2)
                      : '0.00'}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Facebook Valuation + Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SocialOnboardingChecklist platform="facebook" />
              <div className="md:col-span-2">
                <CreatorValuationCard profileId={facebookProfile.id} platform="facebook" />
              </div>
            </div>

            {/* Top Posts */}
            {topFacebookPosts && topFacebookPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topFacebookPosts.slice(0, 5).map(post => (
                      <a 
                        key={post.id}
                        href={post.permalink || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        {post.media_url ? (
                          <img 
                            src={post.media_url} 
                            alt={post.caption?.slice(0, 30) || 'Post'}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <Image className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{post.caption || 'No caption'}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {formatNumber(post.like_count)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {formatNumber(post.comment_count)}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary">{post.engagement_rate.toFixed(2)}%</Badge>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* YouTube Channel Selection Modal */}
      <YouTubeChannelSelectModal
        sessionId={ytSelectSession}
        onClose={handleChannelSelectClose}
        onConnected={handleChannelConnected}
      />

      {/* Facebook Page Selection Modal */}
      <FacebookPageSelectModal
        sessionId={fbSelectSession}
        onClose={handlePageSelectClose}
        onConnected={handlePageConnected}
      />
    </div>
  );
}
