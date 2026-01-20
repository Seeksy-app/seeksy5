import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Instagram, RefreshCw, Users, Eye, TrendingUp, AlertCircle, ExternalLink } from "lucide-react";
import { useSocialProfiles, useSyncSocialData, useLatestInsights } from "@/hooks/useSocialMediaSync";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export function SocialPerformanceCard() {
  const navigate = useNavigate();
  const { data: profiles, isLoading: profilesLoading } = useSocialProfiles();
  const { syncData, isSyncing } = useSyncSocialData();
  
  const instagramProfile = profiles?.find(p => p.platform === 'instagram');
  const { data: latestInsights } = useLatestInsights(instagramProfile?.id || null);

  const isTokenExpired = instagramProfile?.sync_status === 'token_expired';
  const hasError = instagramProfile?.sync_status === 'error';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (profilesLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Social Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!instagramProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Social Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Instagram account to see performance metrics.
          </p>
          <Button 
            onClick={() => navigate('/integrations')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Instagram className="h-4 w-4 mr-2" />
            Connect Instagram
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Instagram className="h-5 w-5 text-pink-500" />
          Social Performance (Instagram)
        </CardTitle>
        <div className="flex items-center gap-2">
          {instagramProfile.last_sync_at && (
            <span className="text-xs text-muted-foreground">
              Updated {formatDistanceToNow(new Date(instagramProfile.last_sync_at), { addSuffix: true })}
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => syncData(instagramProfile.id)}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Expired Warning */}
        {isTokenExpired && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Instagram connection expired</p>
              <p className="text-xs text-muted-foreground">Reconnect to continue syncing data.</p>
            </div>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => navigate('/integrations')}
            >
              Reconnect
            </Button>
          </div>
        )}

        {/* Error State */}
        {hasError && !isTokenExpired && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-600">Sync error</p>
              <p className="text-xs text-muted-foreground">{instagramProfile.sync_error || 'Unknown error'}</p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => syncData(instagramProfile.id)}
              disabled={isSyncing}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Profile Info */}
        <div className="flex items-center gap-3">
          {instagramProfile.profile_picture ? (
            <img 
              src={instagramProfile.profile_picture} 
              alt={instagramProfile.username || 'Profile'} 
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Instagram className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <p className="font-medium">@{instagramProfile.username}</p>
            <Badge variant="secondary" className="text-xs">
              {instagramProfile.account_type || 'Creator'}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs">Followers</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(instagramProfile.followers_count)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Engagement Rate</span>
            </div>
            <p className="text-2xl font-bold">
              {latestInsights?.engagement_rate?.toFixed(2) || '0.00'}%
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-xs">Reach (30d)</span>
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(latestInsights?.reach || 0)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-xs">Profile Views</span>
            </div>
            <p className="text-2xl font-bold">
              {formatNumber(latestInsights?.profile_views || 0)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => navigate('/social-analytics')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncData(instagramProfile.id)}
            disabled={isSyncing || isTokenExpired}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
