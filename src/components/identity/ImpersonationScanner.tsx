import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Search, Shield, AlertTriangle, CheckCircle, ExternalLink,
  Instagram, Music, RefreshCw, Eye, Flag, X, Loader2, UserSearch
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface ProfileMatch {
  id: string;
  platform: string;
  username: string;
  profile_url: string;
  profile_image_url: string;
  match_confidence: number;
  match_type: string;
  status: string;
  detected_at: string;
}

interface Scan {
  id: string;
  platform: string;
  scan_status: string;
  profiles_scanned: number;
  matches_found: number;
  started_at: string;
  completed_at: string;
}

interface LookedUpProfile {
  username: string;
  full_name: string;
  profile_pic_url: string;
  follower_count: number;
  is_verified: boolean;
  biography: string;
}

export function ImpersonationScanner() {
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<ProfileMatch | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookedUpProfile, setLookedUpProfile] = useState<LookedUpProfile | null>(null);

  // Fetch recent scans
  const { data: scans = [] } = useQuery({
    queryKey: ['profile-scans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_image_scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Scan[];
    },
  });

  // Fetch matches
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['profile-matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_image_matches')
        .select('*')
        .order('detected_at', { ascending: false });
      if (error) throw error;
      return data as ProfileMatch[];
    },
  });

  // Username lookup mutation
  const lookupMutation = useMutation({
    mutationFn: async (username: string) => {
      setIsLookingUp(true);
      const { data, error } = await supabase.functions.invoke('search-social-profiles', {
        body: { username, platform: 'instagram' },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.profile;
    },
    onSuccess: (profile) => {
      setLookedUpProfile(profile);
      toast({
        title: 'Profile Found',
        description: `Found @${profile.username} with ${profile.follower_count.toLocaleString()} followers`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Lookup Failed',
        description: error.message || 'Could not find profile',
        variant: 'destructive',
      });
      setLookedUpProfile(null);
    },
    onSettled: () => {
      setIsLookingUp(false);
    },
  });

  // Start scan mutation
  const startScanMutation = useMutation({
    mutationFn: async (platform: 'instagram' | 'tiktok') => {
      setIsScanning(true);
      const { data, error } = await supabase.functions.invoke('scan-profile-images', {
        body: { platform, limit: 50 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Scan Complete',
        description: `Scanned ${data.profiles_scanned} profiles, found ${data.matches_found} potential matches`,
      });
      queryClient.invalidateQueries({ queryKey: ['profile-scans'] });
      queryClient.invalidateQueries({ queryKey: ['profile-matches'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to scan profiles',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsScanning(false);
    },
  });

  // Compare profile with user's face
  const compareProfileMutation = useMutation({
    mutationFn: async (profile: LookedUpProfile) => {
      const { data, error } = await supabase.functions.invoke('scan-profile-images', {
        body: { 
          platform: 'instagram',
          singleProfile: {
            username: profile.username,
            profile_pic_url: profile.profile_pic_url,
          }
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.match_found) {
        toast({
          title: 'Potential Match Detected!',
          description: `This profile may be using your face (${data.confidence}% confidence)`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'No Match',
          description: 'This profile does not appear to be using your face',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['profile-matches'] });
      setLookedUpProfile(null);
      setUsernameInput('');
    },
    onError: (error: any) => {
      toast({
        title: 'Comparison Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update match status
  const updateMatchMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('profile_image_matches')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Match updated' });
      queryClient.invalidateQueries({ queryKey: ['profile-matches'] });
      setSelectedMatch(null);
    },
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'tiktok': return <Music className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge variant="destructive">High Risk ({confidence}%)</Badge>;
    if (confidence >= 70) return <Badge variant="default" className="bg-orange-500">Medium Risk ({confidence}%)</Badge>;
    return <Badge variant="secondary">Low Risk ({confidence}%)</Badge>;
  };

  const getMatchTypeBadge = (type: string) => {
    switch (type) {
      case 'impersonation':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Impersonation</Badge>;
      case 'fan_account':
        return <Badge variant="secondary">Fan Account</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const newMatches = matches.filter(m => m.status === 'new');
  const reviewedMatches = matches.filter(m => m.status !== 'new');

  const handleLookup = () => {
    if (usernameInput.trim()) {
      lookupMutation.mutate(usernameInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Impersonation Detection
          </CardTitle>
          <CardDescription>
            Look up Instagram profiles by username and compare with your verified face
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Username Lookup */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter Instagram username..."
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleLookup} disabled={isLookingUp || !usernameInput.trim()}>
                {isLookingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserSearch className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Looked Up Profile */}
            {lookedUpProfile && (
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2">
                    <AvatarImage src={lookedUpProfile.profile_pic_url} />
                    <AvatarFallback>{lookedUpProfile.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">@{lookedUpProfile.username}</p>
                      {lookedUpProfile.is_verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{lookedUpProfile.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {lookedUpProfile.follower_count.toLocaleString()} followers
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href={`https://instagram.com/${lookedUpProfile.username}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => compareProfileMutation.mutate(lookedUpProfile)}
                      disabled={compareProfileMutation.isPending}
                    >
                      {compareProfileMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 mr-1" />
                      )}
                      Compare Face
                    </Button>
                  </div>
                </div>
                {lookedUpProfile.biography && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {lookedUpProfile.biography}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Recent Scans Summary */}
          {scans.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Last scan: {new Date(scans[0].completed_at || scans[0].started_at).toLocaleDateString()} 
                {' · '}{scans[0].profiles_scanned} profiles scanned
                {' · '}{scans[0].matches_found} matches found
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matches */}
      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new" className="relative">
            New Matches
            {newMatches.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {newMatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reviewedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4">
          <MatchGrid 
            matches={newMatches}
            isLoading={matchesLoading}
            getPlatformIcon={getPlatformIcon}
            getConfidenceBadge={getConfidenceBadge}
            getMatchTypeBadge={getMatchTypeBadge}
            onReview={setSelectedMatch}
          />
        </TabsContent>

        <TabsContent value="reviewed" className="mt-4">
          <MatchGrid 
            matches={reviewedMatches}
            isLoading={matchesLoading}
            getPlatformIcon={getPlatformIcon}
            getConfidenceBadge={getConfidenceBadge}
            getMatchTypeBadge={getMatchTypeBadge}
            onReview={setSelectedMatch}
          />
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <AlertDialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Review Match</AlertDialogTitle>
            <AlertDialogDescription>
              What would you like to do with this potential impersonator?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedMatch && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedMatch.profile_image_url} />
                <AvatarFallback>{selectedMatch.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">@{selectedMatch.username}</p>
                <p className="text-sm text-muted-foreground capitalize">{selectedMatch.platform}</p>
                {getConfidenceBadge(selectedMatch.match_confidence)}
              </div>
            </div>
          )}

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => selectedMatch && updateMatchMutation.mutate({ id: selectedMatch.id, status: 'dismissed' })}
            >
              <X className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedMatch && updateMatchMutation.mutate({ id: selectedMatch.id, status: 'reported' })}
            >
              <Flag className="h-4 w-4 mr-2" />
              Report
            </Button>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MatchGrid({
  matches,
  isLoading,
  getPlatformIcon,
  getConfidenceBadge,
  getMatchTypeBadge,
  onReview,
}: {
  matches: ProfileMatch[];
  isLoading: boolean;
  getPlatformIcon: (platform: string) => React.ReactNode;
  getConfidenceBadge: (confidence: number) => React.ReactNode;
  getMatchTypeBadge: (type: string) => React.ReactNode;
  onReview: (match: ProfileMatch) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-muted" />
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

  if (matches.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">No matches found</h3>
        <p className="text-muted-foreground">
          Run a scan to check for profiles using your face
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match) => (
        <Card key={match.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2">
                  <AvatarImage src={match.profile_image_url} />
                  <AvatarFallback>{match.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">@{match.username}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {getPlatformIcon(match.platform)}
                    <span className="capitalize">{match.platform}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {getMatchTypeBadge(match.match_type)}
              {getConfidenceBadge(match.match_confidence)}
            </div>

            <p className="text-xs text-muted-foreground">
              Detected {new Date(match.detected_at).toLocaleDateString()}
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                asChild
              >
                <a href={match.profile_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </a>
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onReview(match)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
