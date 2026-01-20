import { CheckCircle2, Circle, AlertCircle, RefreshCw, Youtube, Instagram, Facebook, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useSocialProfiles, useSocialPosts, useSocialInsights, useSyncSocialData } from "@/hooks/useSocialMediaSync";
import { useYouTubeConnect } from "@/hooks/useYouTubeConnect";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  label: string;
  status: "complete" | "warning" | "incomplete";
  action?: { label: string; onClick: () => void };
}

interface SocialOnboardingChecklistProps {
  platform?: 'instagram' | 'youtube' | 'facebook';
}

export function SocialOnboardingChecklist({ platform }: SocialOnboardingChecklistProps = {}) {
  const navigate = useNavigate();
  const { data: profiles } = useSocialProfiles();
  const instagramProfile = profiles?.find(p => p.platform === 'instagram');
  const youtubeProfile = profiles?.find(p => p.platform === 'youtube');
  const facebookProfile = profiles?.find(p => p.platform === 'facebook');
  const { data: instagramPosts } = useSocialPosts(instagramProfile?.id || null);
  const { data: youtubePosts } = useSocialPosts(youtubeProfile?.id || null);
  const { data: facebookPostsData } = useSocialPosts(facebookProfile?.id || null);
  const { data: instagramInsights } = useSocialInsights(instagramProfile?.id || null);
  const { data: youtubeInsights } = useSocialInsights(youtubeProfile?.id || null);
  const { data: facebookInsightsData } = useSocialInsights(facebookProfile?.id || null);
  const { syncData, isSyncing } = useSyncSocialData();
  const { connectYouTube, syncYouTube, isConnecting } = useYouTubeConnect();

  // Connect to Meta (for Facebook)
  const connectFacebook = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in first");
        return;
      }
      const { data, error } = await supabase.functions.invoke('meta-auth');
      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      toast.error("Failed to connect Facebook");
    }
  };

  // Instagram checks
  const isInstagramTokenValid = instagramProfile && instagramProfile.sync_status !== 'token_expired';
  const hasInstagramProfileData = instagramProfile && (instagramProfile.followers_count > 0 || instagramProfile.media_count > 0);
  const hasInstagramPostsData = instagramPosts && instagramPosts.length >= 10;
  const hasInstagramInsightsData = instagramInsights && instagramInsights.length > 0;
  const hasInstagramAudienceData = instagramInsights?.some(i => 
    i.reach > 0 || i.impressions > 0 || i.profile_views > 0
  );
  const instagramLastSyncAt = instagramProfile?.last_sync_at 
    ? new Date(instagramProfile.last_sync_at) 
    : null;
  const isInstagramSyncRecent = instagramLastSyncAt && (Date.now() - instagramLastSyncAt.getTime()) < 48 * 60 * 60 * 1000;

  // YouTube checks
  const isYouTubeTokenValid = youtubeProfile && youtubeProfile.sync_status !== 'token_expired';
  const hasYouTubeProfileData = youtubeProfile && (youtubeProfile.followers_count > 0 || youtubeProfile.media_count > 0);
  const hasYouTubePostsData = youtubePosts && youtubePosts.length >= 5;
  const hasYouTubeInsightsData = youtubeInsights && youtubeInsights.length > 0;
  const youtubeLastSyncAt = youtubeProfile?.last_sync_at 
    ? new Date(youtubeProfile.last_sync_at) 
    : null;
  const isYouTubeSyncRecent = youtubeLastSyncAt && (Date.now() - youtubeLastSyncAt.getTime()) < 48 * 60 * 60 * 1000;

  // Facebook checks
  const isFacebookTokenValid = facebookProfile && facebookProfile.sync_status !== 'token_expired';
  const hasFacebookProfileData = facebookProfile && (facebookProfile.followers_count > 0 || facebookProfile.media_count > 0);
  const hasFacebookPostsData = facebookPostsData && facebookPostsData.length >= 5;
  const hasFacebookInsightsData = facebookInsightsData && facebookInsightsData.length > 0;
  const hasFacebookAudienceData = facebookInsightsData?.some(i => 
    i.reach > 0 || i.impressions > 0 || i.profile_views > 0
  );
  const facebookLastSyncAt = facebookProfile?.last_sync_at 
    ? new Date(facebookProfile.last_sync_at) 
    : null;
  const isFacebookSyncRecent = facebookLastSyncAt && (Date.now() - facebookLastSyncAt.getTime()) < 48 * 60 * 60 * 1000;

  const instagramChecklistItems: ChecklistItem[] = [
    {
      id: "connected",
      label: "Account Connected",
      status: instagramProfile && isInstagramTokenValid ? "complete" : instagramProfile ? "warning" : "incomplete",
      action: !instagramProfile || !isInstagramTokenValid 
        ? { label: isInstagramTokenValid ? "Connect" : "Reconnect", onClick: () => navigate('/integrations') }
        : undefined,
    },
    {
      id: "profile",
      label: "Profile Synced",
      status: hasInstagramProfileData ? "complete" : instagramProfile ? "warning" : "incomplete",
      action: instagramProfile && !hasInstagramProfileData 
        ? { label: "Sync Now", onClick: () => syncData(instagramProfile.id) }
        : undefined,
    },
    {
      id: "posts",
      label: "Posts & Engagement Imported",
      status: hasInstagramPostsData ? "complete" : instagramPosts && instagramPosts.length > 0 ? "warning" : "incomplete",
      action: instagramProfile && !hasInstagramPostsData
        ? { label: "Sync Posts", onClick: () => syncData(instagramProfile.id) }
        : undefined,
    },
    {
      id: "insights",
      label: "Insights Available",
      status: hasInstagramInsightsData ? "complete" : "incomplete",
      action: instagramProfile && !hasInstagramInsightsData
        ? { label: "Sync Insights", onClick: () => syncData(instagramProfile.id) }
        : undefined,
    },
    {
      id: "audience",
      label: "Audience Data Available",
      status: hasInstagramAudienceData ? "complete" : hasInstagramInsightsData ? "warning" : "incomplete",
    },
    {
      id: "autosync",
      label: "Daily Auto-Sync Enabled",
      status: isInstagramSyncRecent ? "complete" : instagramProfile ? "warning" : "incomplete",
      action: instagramProfile && !isInstagramSyncRecent
        ? { label: "Run Sync", onClick: () => syncData(instagramProfile.id) }
        : undefined,
    },
  ];

  const youtubeChecklistItems: ChecklistItem[] = [
    {
      id: "connected",
      label: "Channel Connected",
      status: youtubeProfile && isYouTubeTokenValid ? "complete" : youtubeProfile ? "warning" : "incomplete",
      action: !youtubeProfile || !isYouTubeTokenValid 
        ? { label: isYouTubeTokenValid ? "Connect" : "Reconnect", onClick: connectYouTube }
        : undefined,
    },
    {
      id: "profile",
      label: "Channel Synced",
      status: hasYouTubeProfileData ? "complete" : youtubeProfile ? "warning" : "incomplete",
      action: youtubeProfile && !hasYouTubeProfileData 
        ? { label: "Sync Now", onClick: () => syncYouTube(youtubeProfile.id) }
        : undefined,
    },
    {
      id: "videos",
      label: "Videos Imported",
      status: hasYouTubePostsData ? "complete" : youtubePosts && youtubePosts.length > 0 ? "warning" : "incomplete",
      action: youtubeProfile && !hasYouTubePostsData
        ? { label: "Sync Videos", onClick: () => syncYouTube(youtubeProfile.id) }
        : undefined,
    },
    {
      id: "insights",
      label: "Analytics Available",
      status: hasYouTubeInsightsData ? "complete" : "incomplete",
      action: youtubeProfile && !hasYouTubeInsightsData
        ? { label: "Sync Analytics", onClick: () => syncYouTube(youtubeProfile.id) }
        : undefined,
    },
    {
      id: "autosync",
      label: "Daily Auto-Sync Enabled",
      status: isYouTubeSyncRecent ? "complete" : youtubeProfile ? "warning" : "incomplete",
      action: youtubeProfile && !isYouTubeSyncRecent
        ? { label: "Run Sync", onClick: () => syncYouTube(youtubeProfile.id) }
        : undefined,
    },
  ];

  const facebookChecklistItems: ChecklistItem[] = [
    {
      id: "connected",
      label: "Page Connected",
      status: facebookProfile && isFacebookTokenValid ? "complete" : facebookProfile ? "warning" : "incomplete",
      action: !facebookProfile || !isFacebookTokenValid 
        ? { label: isFacebookTokenValid ? "Connect" : "Reconnect", onClick: connectFacebook }
        : undefined,
    },
    {
      id: "profile",
      label: "Profile Synced",
      status: hasFacebookProfileData ? "complete" : facebookProfile ? "warning" : "incomplete",
      action: facebookProfile && !hasFacebookProfileData 
        ? { label: "Sync Now", onClick: () => syncData(facebookProfile.id) }
        : undefined,
    },
    {
      id: "posts",
      label: "Posts & Engagement Imported",
      status: hasFacebookPostsData ? "complete" : facebookPostsData && facebookPostsData.length > 0 ? "warning" : "incomplete",
      action: facebookProfile && !hasFacebookPostsData
        ? { label: "Sync Posts", onClick: () => syncData(facebookProfile.id) }
        : undefined,
    },
    {
      id: "insights",
      label: "Insights Available",
      status: hasFacebookInsightsData ? "complete" : "incomplete",
      action: facebookProfile && !hasFacebookInsightsData
        ? { label: "Sync Insights", onClick: () => syncData(facebookProfile.id) }
        : undefined,
    },
    {
      id: "audience",
      label: "Audience Data Available",
      status: hasFacebookAudienceData ? "complete" : hasFacebookInsightsData ? "warning" : "incomplete",
    },
    {
      id: "autosync",
      label: "Daily Auto-Sync Enabled",
      status: isFacebookSyncRecent ? "complete" : facebookProfile ? "warning" : "incomplete",
      action: facebookProfile && !isFacebookSyncRecent
        ? { label: "Run Sync", onClick: () => syncData(facebookProfile.id) }
        : undefined,
    },
  ];

  const getCompletedCount = (items: ChecklistItem[]) => items.filter(i => i.status === "complete").length;

  const getStatusIcon = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const renderChecklist = (items: ChecklistItem[], profile: any, lastSyncAt: Date | null, onSync: () => void) => (
    <>
      {lastSyncAt && (
        <p className="text-xs text-muted-foreground mb-3">
          Last synced {formatDistanceToNow(lastSyncAt, { addSuffix: true })}
        </p>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {getStatusIcon(item.status)}
              <span className={`text-sm ${item.status === "incomplete" ? "text-muted-foreground" : ""}`}>
                {item.label}
              </span>
            </div>
            {item.action && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={item.action.onClick}
                disabled={isSyncing || isConnecting}
                className="h-7 text-xs"
              >
                {(isSyncing || isConnecting) && item.action.label.includes("Sync") ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  item.action.label
                )}
              </Button>
            )}
          </div>
        ))}

        {profile && (
          <div className="pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onSync}
              disabled={isSyncing || isConnecting}
            >
              {isSyncing || isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync All Data Now
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );

  const renderConnectCard = (platformType: 'instagram' | 'youtube' | 'facebook') => (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      {platformType === 'youtube' ? (
        <>
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center mb-4">
            <Youtube className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">Connect YouTube to track your channel</p>
          <Button onClick={connectYouTube} disabled={isConnecting} size="sm">
            {isConnecting ? 'Connecting...' : 'Connect YouTube'}
          </Button>
        </>
      ) : platformType === 'facebook' ? (
        <>
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mb-4">
            <Facebook className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">Connect Facebook to track your page</p>
          <Button onClick={connectFacebook} size="sm">
            Connect Facebook
          </Button>
        </>
      ) : (
        <>
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
            <Instagram className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">Connect Instagram to track your account</p>
          <Button onClick={() => navigate('/integrations')} size="sm">
            Connect Instagram
          </Button>
        </>
      )}
    </div>
  );

  // If platform prop is provided, render only that platform's checklist
  if (platform === 'facebook') {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-600" />
            Facebook Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facebookProfile ? (
            renderChecklist(
              facebookChecklistItems, 
              facebookProfile, 
              facebookLastSyncAt,
              () => facebookProfile && syncData(facebookProfile.id)
            )
          ) : (
            renderConnectCard('facebook')
          )}
        </CardContent>
      </Card>
    );
  }

  // Default: show tabbed view for Instagram and YouTube
  const defaultTab = instagramProfile ? 'instagram' : youtubeProfile ? 'youtube' : 'instagram';
  const showInstagramTab = !!instagramProfile;
  const showYouTubeTab = !!youtubeProfile;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Social Media Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="h-4 w-4 text-pink-500" />
              Instagram
              {showInstagramTab && (
                <span className="text-xs text-muted-foreground">
                  {getCompletedCount(instagramChecklistItems)}/{instagramChecklistItems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="youtube" className="gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              YouTube
              {showYouTubeTab && (
                <span className="text-xs text-muted-foreground">
                  {getCompletedCount(youtubeChecklistItems)}/{youtubeChecklistItems.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="instagram">
            {showInstagramTab ? (
              renderChecklist(
                instagramChecklistItems, 
                instagramProfile, 
                instagramLastSyncAt,
                () => instagramProfile && syncData(instagramProfile.id)
              )
            ) : (
              renderConnectCard('instagram')
            )}
          </TabsContent>
          
          <TabsContent value="youtube">
            {showYouTubeTab ? (
              renderChecklist(
                youtubeChecklistItems, 
                youtubeProfile, 
                youtubeLastSyncAt,
                () => youtubeProfile && syncYouTube(youtubeProfile.id)
              )
            ) : (
              renderConnectCard('youtube')
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
