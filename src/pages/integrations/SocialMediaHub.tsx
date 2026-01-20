import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, Facebook, Link as LinkIcon, CheckCircle2, Twitter, Youtube, Music, RefreshCw, CloudDownload, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useYouTubeConnect } from "@/hooks/useYouTubeConnect";
import { useSocialProfiles, useSyncSocialData } from "@/hooks/useSocialMediaSync";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface SocialIntegration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  connected: boolean;
  gradient: string;
  available: boolean;
  profileData?: {
    username?: string;
    profile_picture?: string;
    followers_count?: number;
  };
  onConnect?: () => void;
  onSync?: () => void;
  onDisconnect?: () => void;
  isSyncing?: boolean;
}

export default function SocialMediaHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { connectYouTube, syncYouTube, isConnecting } = useYouTubeConnect();
  const { data: socialProfiles, refetch: refetchProfiles } = useSocialProfiles();
  const { syncData, isSyncing } = useSyncSocialData();
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [platformToDisconnect, setPlatformToDisconnect] = useState<string | null>(null);

  // Get profiles from social_media_profiles table
  const instagramProfile = socialProfiles?.find(p => p.platform === 'instagram');
  const youtubeProfile = socialProfiles?.find(p => p.platform === 'youtube');
  const facebookProfile = socialProfiles?.find(p => p.platform === 'facebook');
  const dropboxProfile = socialProfiles?.find(p => p.platform === 'dropbox');

  const hasInstagram = !!instagramProfile;
  const hasYouTube = !!youtubeProfile;
  const hasFacebook = !!facebookProfile;
  const hasDropbox = !!dropboxProfile;

  // Handle YouTube connection callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const youtubeError = params.get('youtube_error');

    if (connected === 'youtube') {
      toast({
        title: 'YouTube Connected!',
        description: 'Syncing your channel data now.',
      });
      refetchProfiles();
      queryClient.invalidateQueries({ queryKey: ['social-profiles'] });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (youtubeError) {
      toast({
        title: 'YouTube Connection Failed',
        description: youtubeError,
        variant: 'destructive',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetchProfiles, queryClient]);

  const handleInstagramSync = async () => {
    if (instagramProfile?.id) {
      await syncData(instagramProfile.id);
      refetchProfiles();
    }
  };

  const handleYouTubeSync = async () => {
    if (youtubeProfile?.id) {
      await syncYouTube(youtubeProfile.id);
      refetchProfiles();
    }
  };

  const handleFacebookSync = async () => {
    if (facebookProfile?.id) {
      await syncData(facebookProfile.id);
      refetchProfiles();
    }
  };

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
      toast({ title: "Failed to connect Facebook", variant: "destructive" });
    }
  };

  const connectDropbox = async () => {
    try {
      const redirectUri = `${window.location.origin}/dropbox/callback`;
      
      const { data, error } = await supabase.functions.invoke('dropbox-auth', {
        body: { action: 'get_auth_url', redirectUri }
      });

      if (error) throw error;

      // Store redirect info and open popup
      localStorage.setItem('dropbox_redirect', '/integrations');
      window.open(data.authUrl, 'dropbox-auth', 'width=600,height=700');

      // Listen for callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'dropbox-callback' && event.data?.code) {
          window.removeEventListener('message', handleMessage);
          
          const { error: exchangeError } = await supabase.functions.invoke('dropbox-auth', {
            body: { action: 'exchange_code', code: event.data.code, redirectUri }
          });

          if (exchangeError) {
            toast({ title: 'Connection failed', variant: 'destructive' });
          } else {
            toast({ title: 'Dropbox connected successfully!' });
            refetchProfiles();
          }
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('Dropbox connect error:', error);
      toast({ title: 'Failed to connect Dropbox', variant: 'destructive' });
    }
  };

  const handleDisconnect = async (platform: string) => {
    setPlatformToDisconnect(platform);
    setDisconnectDialogOpen(true);
  };

  const confirmDisconnect = async () => {
    if (!platformToDisconnect) return;
    
    setDisconnectingId(platformToDisconnect);
    try {
      const profile = socialProfiles?.find(p => p.platform === platformToDisconnect);
      if (!profile) return;

      const { error } = await supabase
        .from('social_media_profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;

      toast({ title: `${platformToDisconnect.charAt(0).toUpperCase() + platformToDisconnect.slice(1)} disconnected` });
      refetchProfiles();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({ title: 'Failed to disconnect', variant: 'destructive' });
    } finally {
      setDisconnectingId(null);
      setDisconnectDialogOpen(false);
      setPlatformToDisconnect(null);
    }
  };

  const integrations: SocialIntegration[] = [
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Sync followers, engagement metrics, and post performance from your Instagram Business account',
      icon: <Instagram className="h-6 w-6 text-white" />,
      path: '/integrations/meta',
      connected: hasInstagram,
      gradient: 'from-purple-500 to-pink-500',
      available: true,
      profileData: instagramProfile ? {
        username: instagramProfile.username,
        profile_picture: instagramProfile.profile_picture,
        followers_count: instagramProfile.followers_count,
      } : undefined,
      onSync: handleInstagramSync,
      onDisconnect: () => handleDisconnect('instagram'),
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Connect your Facebook Page to sync insights, audience data, and post analytics',
      icon: <Facebook className="h-6 w-6 text-white" />,
      path: '#',
      connected: hasFacebook,
      gradient: 'from-blue-600 to-blue-500',
      available: true,
      profileData: facebookProfile ? {
        username: facebookProfile.username,
        profile_picture: facebookProfile.profile_picture,
        followers_count: facebookProfile.followers_count,
      } : undefined,
      onConnect: connectFacebook,
      onSync: handleFacebookSync,
      onDisconnect: () => handleDisconnect('facebook'),
    },
    {
      id: 'youtube',
      name: 'YouTube',
      description: 'Sync your YouTube channel videos, views, and subscriber data',
      icon: <Youtube className="h-6 w-6 text-white" />,
      path: '#',
      connected: hasYouTube,
      gradient: 'from-red-600 to-red-500',
      available: true,
      profileData: youtubeProfile ? {
        username: youtubeProfile.username,
        profile_picture: youtubeProfile.profile_picture,
        followers_count: youtubeProfile.followers_count,
      } : undefined,
      onConnect: connectYouTube,
      onSync: handleYouTubeSync,
      onDisconnect: () => handleDisconnect('youtube'),
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'Import videos and media files directly from your Dropbox account to your Media Library',
      icon: <CloudDownload className="h-6 w-6 text-white" />,
      path: '#',
      connected: hasDropbox,
      gradient: 'from-blue-500 to-blue-600',
      available: true,
      profileData: dropboxProfile ? {
        username: dropboxProfile.username || 'Connected',
      } : undefined,
      onConnect: connectDropbox,
      onDisconnect: () => handleDisconnect('dropbox'),
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      description: 'Import your TikTok videos, analytics, and audience demographics',
      icon: <Music className="h-6 w-6 text-white" />,
      path: '#',
      connected: false,
      gradient: 'from-black to-gray-800',
      available: false,
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      description: 'Connect your Twitter account to track tweets, engagement, and follower growth',
      icon: <Twitter className="h-6 w-6 text-white" />,
      path: '#',
      connected: false,
      gradient: 'from-sky-500 to-sky-400',
      available: false,
    },
  ];

  const formatFollowers = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <LinkIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Social Media</h1>
          </div>
          <p className="text-muted-foreground">
            Connect your social media accounts to sync data, track performance, and expand your reach
          </p>
        </div>

        {/* Available Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <Card 
              key={integration.id} 
              className={`border-2 transition-all ${integration.available ? 'hover:shadow-lg' : 'opacity-60'}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${integration.gradient}`}>
                    {integration.icon}
                  </div>
                  {integration.connected ? (
                    <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : integration.available ? (
                    <Badge variant="outline">Available</Badge>
                  ) : (
                    <Badge variant="secondary">Coming Soon</Badge>
                  )}
                </div>
                <CardTitle>{integration.name}</CardTitle>
                <CardDescription className="min-h-[40px]">
                  {integration.description}
                </CardDescription>

                {/* Connected profile preview */}
                {integration.connected && integration.profileData && (
                  <div className="flex items-center gap-3 mt-3 p-3 bg-muted/50 rounded-lg">
                    {integration.profileData.profile_picture ? (
                      <img 
                        src={integration.profileData.profile_picture} 
                        alt={integration.profileData.username}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${integration.gradient} flex items-center justify-center`}>
                        {integration.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {integration.id === 'instagram' ? '@' : ''}{integration.profileData.username}
                      </p>
                      {integration.profileData.followers_count !== undefined && integration.profileData.followers_count > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formatFollowers(integration.profileData.followers_count)} {integration.id === 'youtube' ? 'subscribers' : integration.id === 'facebook' ? 'fans' : 'followers'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {integration.connected ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {integration.id !== 'dropbox' && (
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/social-analytics?tab=${integration.id}`);
                          }}
                        >
                          View Analytics
                        </Button>
                      )}
                      {integration.id === 'dropbox' && (
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/studio/media');
                          }}
                        >
                          Go to Media Library
                        </Button>
                      )}
                      {integration.onSync && (
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            integration.onSync?.();
                          }}
                          disabled={isSyncing}
                        >
                          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                    </div>
                    {integration.onDisconnect && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full text-muted-foreground hover:text-destructive gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          integration.onDisconnect?.();
                        }}
                        disabled={disconnectingId === integration.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Disconnect
                      </Button>
                    )}
                  </div>
                ) : integration.onConnect ? (
                  <Button 
                    className="w-full" 
                    disabled={!integration.available || isConnecting}
                    onClick={(e) => {
                      e.stopPropagation();
                      integration.onConnect?.();
                    }}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant="default"
                    disabled={!integration.available}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (integration.available && integration.path !== '#') {
                        navigate(integration.path);
                      }
                    }}
                  >
                    {!integration.available ? 'Coming Soon' : 'Connect'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {platformToDisconnect?.charAt(0).toUpperCase()}{platformToDisconnect?.slice(1)}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to your {platformToDisconnect} account. You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
