import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, Filter, Users, CheckCircle, Shield, Mic, 
  Instagram, Music, Heart, Bookmark, Send, ExternalLink,
  TrendingUp, Star, Mail
} from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DiscoveryProfile {
  id: string;
  platform: string;
  username: string;
  profile_picture_url: string | null;
  followers: number;
  engagement_rate: number;
  niche_tags: string[];
  location: string | null;
  email: string | null;
  estimated_value_per_post: number;
  is_seeksy_verified: boolean;
  face_verified: boolean;
  voice_verified: boolean;
  seeksy_user_id: string | null;
}

export default function InfluencerMarketplace() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [platform, setPlatform] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minFollowers, setMinFollowers] = useState<string>('');
  const [selectedCreator, setSelectedCreator] = useState<DiscoveryProfile | null>(null);
  const [inviteMessage, setInviteMessage] = useState('');

  // Fetch discovery profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['influencer-marketplace', searchTerm, platform, verifiedOnly, minFollowers],
    queryFn: async () => {
      let query = supabase
        .from('agency_discovery_profiles')
        .select('*')
        .order('followers', { ascending: false });

      if (searchTerm) {
        query = query.ilike('username', `%${searchTerm}%`);
      }
      if (platform !== 'all') {
        query = query.eq('platform', platform);
      }
      if (verifiedOnly) {
        query = query.eq('is_seeksy_verified', true);
      }
      if (minFollowers) {
        query = query.gte('followers', parseInt(minFollowers));
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as DiscoveryProfile[];
    },
  });

  // Fetch user's agency
  const { data: agency } = useQuery({
    queryKey: ['user-agency'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Save creator mutation
  const saveCreatorMutation = useMutation({
    mutationFn: async (profileId: string) => {
      if (!agency) {
        throw new Error('Please create an agency first');
      }

      const { error } = await supabase
        .from('agency_saved_creators')
        .insert({
          agency_id: agency.id,
          discovery_profile_id: profileId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Creator saved to your list!' });
      queryClient.invalidateQueries({ queryKey: ['saved-creators'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Invite creator mutation
  const inviteCreatorMutation = useMutation({
    mutationFn: async ({ profile, message }: { profile: DiscoveryProfile; message: string }) => {
      if (!agency) {
        throw new Error('Please create an agency first');
      }

      const inviteToken = crypto.randomUUID();

      const { error } = await supabase
        .from('agency_creator_invites')
        .insert({
          agency_id: agency.id,
          discovery_profile_id: profile.id,
          email: profile.email,
          platform: profile.platform,
          username: profile.username,
          invite_token: inviteToken,
          message,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Invitation sent!' });
      setSelectedCreator(null);
      setInviteMessage('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Stats
  const stats = {
    total: profiles.length,
    verified: profiles.filter(p => p.is_seeksy_verified).length,
    avgFollowers: profiles.length > 0 
      ? Math.round(profiles.reduce((sum, p) => sum + p.followers, 0) / profiles.length)
      : 0,
  };

  const formatFollowers = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'tiktok': return <Music className="h-4 w-4" />;
      case 'youtube': return <TrendingUp className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Influencer Marketplace</h1>
          <p className="text-muted-foreground">
            Discover and connect with verified creators for your campaigns
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Users className="h-5 w-5 mr-2" />
          {stats.total} Creators
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-sm text-muted-foreground">Seeksy Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatFollowers(stats.avgFollowers)}</p>
                <p className="text-sm text-muted-foreground">Avg. Followers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.filter(p => p.face_verified || p.voice_verified).length}</p>
                <p className="text-sm text-muted-foreground">Identity Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
            <Select value={minFollowers} onValueChange={setMinFollowers}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Min Followers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="1000">1K+</SelectItem>
                <SelectItem value="10000">10K+</SelectItem>
                <SelectItem value="50000">50K+</SelectItem>
                <SelectItem value="100000">100K+</SelectItem>
                <SelectItem value="1000000">1M+</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={verifiedOnly ? "default" : "outline"}
              onClick={() => setVerifiedOnly(!verifiedOnly)}
            >
              <Shield className="h-4 w-4 mr-2" />
              Verified Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Creator Grid */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Creators</TabsTrigger>
          <TabsTrigger value="seeksy">On Seeksy</TabsTrigger>
          <TabsTrigger value="external">External (Invite)</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <CreatorGrid 
            profiles={profiles}
            isLoading={isLoading}
            onSave={(id) => saveCreatorMutation.mutate(id)}
            onInvite={setSelectedCreator}
            formatFollowers={formatFollowers}
            getPlatformIcon={getPlatformIcon}
          />
        </TabsContent>

        <TabsContent value="seeksy" className="mt-6">
          <CreatorGrid 
            profiles={profiles.filter(p => p.is_seeksy_verified)}
            isLoading={isLoading}
            onSave={(id) => saveCreatorMutation.mutate(id)}
            onInvite={setSelectedCreator}
            formatFollowers={formatFollowers}
            getPlatformIcon={getPlatformIcon}
          />
        </TabsContent>

        <TabsContent value="external" className="mt-6">
          <CreatorGrid 
            profiles={profiles.filter(p => !p.is_seeksy_verified)}
            isLoading={isLoading}
            onSave={(id) => saveCreatorMutation.mutate(id)}
            onInvite={setSelectedCreator}
            formatFollowers={formatFollowers}
            getPlatformIcon={getPlatformIcon}
          />
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={!!selectedCreator} onOpenChange={() => setSelectedCreator(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite {selectedCreator?.username} to Seeksy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedCreator?.profile_picture_url || ''} />
                <AvatarFallback>{selectedCreator?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedCreator?.username}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFollowers(selectedCreator?.followers || 0)} followers on {selectedCreator?.platform}
                </p>
              </div>
            </div>
            <Textarea
              placeholder="Write a personalized message to invite this creator..."
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedCreator(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedCreator && inviteCreatorMutation.mutate({ 
                  profile: selectedCreator, 
                  message: inviteMessage 
                })}
                disabled={inviteCreatorMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Creator Grid Component
function CreatorGrid({ 
  profiles, 
  isLoading, 
  onSave, 
  onInvite,
  formatFollowers,
  getPlatformIcon 
}: {
  profiles: DiscoveryProfile[];
  isLoading: boolean;
  onSave: (id: string) => void;
  onInvite: (profile: DiscoveryProfile) => void;
  formatFollowers: (num: number) => string;
  getPlatformIcon: (platform: string) => React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No creators found</h3>
        <p className="text-muted-foreground">Try adjusting your filters</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {profiles.map((profile) => (
        <Card key={profile.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-background">
                  <AvatarImage src={profile.profile_picture_url || ''} />
                  <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{profile.username}</p>
                    {profile.is_seeksy_verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {getPlatformIcon(profile.platform)}
                    <span className="capitalize">{profile.platform}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Badges */}
            <div className="flex gap-2 flex-wrap">
              {profile.is_seeksy_verified && (
                <Badge variant="default" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Seeksy Verified
                </Badge>
              )}
              {profile.face_verified && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Face ID
                </Badge>
              )}
              {profile.voice_verified && (
                <Badge variant="secondary" className="text-xs">
                  <Mic className="h-3 w-3 mr-1" />
                  Voice ID
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Followers</p>
                <p className="font-semibold">{formatFollowers(profile.followers)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Engagement</p>
                <p className="font-semibold">{profile.engagement_rate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Tags */}
            {profile.niche_tags && profile.niche_tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {profile.niche_tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onSave(profile.id)}
              >
                <Bookmark className="h-4 w-4 mr-1" />
                Save
              </Button>
              {profile.is_seeksy_verified ? (
                <Button size="sm" className="flex-1">
                  <Mail className="h-4 w-4 mr-1" />
                  Contact
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => onInvite(profile)}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Invite
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
