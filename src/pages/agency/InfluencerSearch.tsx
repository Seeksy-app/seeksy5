import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Search, Users, TrendingUp, MapPin, Instagram, Youtube, Twitter, ArrowLeft, List, Grid, Mail, FolderPlus, X, ChevronDown, CheckSquare, Square, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import alexMorganAvatar from "@/assets/demo-influencer-alex-morgan.jpg";
import emmaMartinezAvatar from "@/assets/demo-influencer-emma-martinez.jpg";
import sarahJohnsonAvatar from "@/assets/demo-influencer-sarah-johnson.jpg";
import marcoRodriguezAvatar from "@/assets/demo-influencer-marco-rodriguez.jpg";

interface InfluencerProfile {
  id: string;
  username: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  social_accounts: Array<{
    platform: string;
    username: string;
    followers_count: number | null;
    engagement_rate: number | null;
    is_verified: boolean;
  }>;
}

export default function InfluencerSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [exactMatch, setExactMatch] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [showFollowerFilter, setShowFollowerFilter] = useState(false);
  const [showEngagementFilter, setShowEngagementFilter] = useState(false);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [followerRange, setFollowerRange] = useState<[number, number]>([0, 1000000]);
  const [engagementMin, setEngagementMin] = useState<number>(0);
  const [locationFilter, setLocationFilter] = useState("");

  // Demo avatars mapping - gender-specific professional images
  const demoAvatars: Record<string, string> = {
    "DemoInfluencer": alexMorganAvatar,
    "hello": emmaMartinezAvatar,
    "support": sarahJohnsonAvatar,
    "andrew1": marcoRodriguezAvatar,
  };

  const { data: influencers, isLoading } = useQuery({
    queryKey: ["influencers", searchQuery, platformFilter, followerRange, engagementMin, showFollowerFilter, showEngagementFilter],
    queryFn: async () => {
      // Get all profiles first
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, account_full_name, bio, account_avatar_url");

      if (profilesError) throw profilesError;

      // Get all social media accounts
      const { data: socialData, error: socialError } = await supabase
        .from("social_media_accounts")
        .select("platform, username, followers_count, engagement_rate, is_verified, user_id");

      if (socialError) throw socialError;

      // Group by user_id
      const profilesMap = new Map<string, any>();
      
      profilesData?.forEach((profile: any) => {
        profilesMap.set(profile.id, {
          id: profile.id,
          username: profile.username,
          full_name: profile.account_full_name || "",
          bio: profile.bio,
          avatar_url: profile.account_avatar_url || demoAvatars[profile.username] || alexMorganAvatar,
          social_accounts: []
        });
      });

      socialData?.forEach((account: any) => {
        const profile = profilesMap.get(account.user_id);
        if (profile) {
          profile.social_accounts.push({
            platform: account.platform,
            username: account.username,
            followers_count: account.followers_count,
            engagement_rate: account.engagement_rate,
            is_verified: account.is_verified
          });
        }
      });

      let filtered = Array.from(profilesMap.values());

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(inf => 
          inf.full_name?.toLowerCase().includes(query) ||
          inf.bio?.toLowerCase().includes(query) ||
          inf.username?.toLowerCase().includes(query)
        );
      }

      // Filter by platform
      if (platformFilter !== "all") {
        filtered = filtered.filter(inf => 
          inf.social_accounts.some((acc: any) => acc.platform === platformFilter)
        );
      }

      // Filter by follower range and engagement (only if filters are active)
      filtered = filtered.filter(inf => {
        const hasMatchingAccount = inf.social_accounts.some((acc: any) => {
          const followers = acc.followers_count || 0;
          const engagement = acc.engagement_rate || 0;
          const matchesFollowers = !showFollowerFilter || (followers >= followerRange[0] && followers <= followerRange[1]);
          const matchesEngagement = !showEngagementFilter || engagement >= engagementMin;
          return matchesFollowers && matchesEngagement;
        });
        return hasMatchingAccount;
      });

      return filtered;
    },
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      case "twitter":
      case "x":
        return <Twitter className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const activeFilters = [
    showFollowerFilter && "followers",
    showEngagementFilter && "engagement", 
    showLocationFilter && "location"
  ].filter(Boolean).length;

  const toggleSelection = (id: string) => {
    setSelectedInfluencers(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedInfluencers.length === influencers?.length) {
      setSelectedInfluencers([]);
    } else {
      setSelectedInfluencers(influencers?.map(i => i.id) || []);
    }
  };

  const clearAllFilters = () => {
    setShowFollowerFilter(false);
    setShowEngagementFilter(false);
    setShowLocationFilter(false);
    setFollowerRange([0, 1000000]);
    setEngagementMin(0);
    setLocationFilter("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Search</h1>
          </div>
          <Button>Search</Button>
        </div>

        {/* Search Bar */}
        <div className="bg-card rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            {/* Platform Selector */}
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  {platformFilter === "all" && <Users className="h-4 w-4" />}
                  {platformFilter === "instagram" && <Instagram className="h-4 w-4" />}
                  {platformFilter === "youtube" && <Youtube className="h-4 w-4" />}
                  {platformFilter === "twitter" && <Twitter className="h-4 w-4" />}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="twitter">X (Twitter)</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, username, or keywords..."
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Select>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Exclude lists" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No exclusions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exact Match Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <Switch checked={exactMatch} onCheckedChange={setExactMatch} />
            <span className="text-sm">Show only exact matches</span>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Followers Filter */}
            <Popover open={showFollowerFilter} onOpenChange={setShowFollowerFilter}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`gap-2 ${showFollowerFilter ? 'border-green-600 border-2' : ''}`}
                >
                  Followers
                  <ChevronDown className={`h-3 w-3 transition-transform ${showFollowerFilter ? 'rotate-180' : ''}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-popover z-50 shadow-lg" align="start">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-base">Follower Range</h4>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between text-sm">
                      <span>{followerRange[0].toLocaleString()}</span>
                      <span>{followerRange[1] >= 1000000 ? '1M+' : followerRange[1].toLocaleString()}</span>
                    </div>
                    
                    <Slider
                      value={followerRange}
                      onValueChange={(value) => setFollowerRange(value as [number, number])}
                      min={0}
                      max={1000000}
                      step={10000}
                      className="w-full"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Engagement Filter */}
            <Popover open={showEngagementFilter} onOpenChange={setShowEngagementFilter}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`gap-2 ${showEngagementFilter ? 'border-green-600 border-2' : ''}`}
                >
                  Engagement
                  <ChevronDown className={`h-3 w-3 transition-transform ${showEngagementFilter ? 'rotate-180' : ''}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-popover z-50 shadow-lg" align="start">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-base">Engagement %</h4>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between text-sm">
                      <span>{engagementMin}%</span>
                      <span>20%+</span>
                    </div>
                    
                    <Slider
                      value={[engagementMin]}
                      onValueChange={(value) => setEngagementMin(value[0])}
                      min={0}
                      max={20}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Location Filter */}
            <Popover open={showLocationFilter} onOpenChange={setShowLocationFilter}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`gap-2 ${showLocationFilter ? 'border-green-600 border-2' : ''}`}
                >
                  Location
                  <ChevronDown className={`h-3 w-3 transition-transform ${showLocationFilter ? 'rotate-180' : ''}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-popover z-50 shadow-lg" align="start">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-base">Location</h4>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Add a location"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="outline" className="gap-2">
              All filters
              {activeFilters > 0 && (
                <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center bg-green-600">
                  {activeFilters}
                </Badge>
              )}
            </Button>

            <Button variant="ghost" disabled>Show {influencers?.length || 0} results</Button>

            {activeFilters > 0 && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={selectedInfluencers.length === influencers?.length && influencers?.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <Button variant="outline" size="sm" className="gap-2" disabled={selectedInfluencers.length === 0}>
              <FolderPlus className="h-4 w-4" />
              Add to list
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Users className="h-4 w-4" />
              Add creator
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border rounded-md">
              <Button 
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            <Select defaultValue="relevance">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading influencers...</p>
          </div>
        ) : influencers?.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No influencers found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedInfluencers.length === influencers?.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Bio</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Mentions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {influencers?.map((influencer) => {
                  const socialAccounts = Array.isArray(influencer.social_accounts) ? influencer.social_accounts : [];
                  const mainAccount = socialAccounts.find(acc => acc.platform === platformFilter) 
                    || socialAccounts[0];
                  
                  return (
                    <TableRow key={influencer.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedInfluencers.includes(influencer.id)}
                          onCheckedChange={() => toggleSelection(influencer.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/${influencer.username}.portfolio`)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={influencer.avatar_url || undefined} />
                            <AvatarFallback>{influencer.full_name?.charAt(0) || influencer.username.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{influencer.full_name || influencer.username}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              @{influencer.username}
                              {getPlatformIcon(mainAccount?.platform || "instagram")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {influencer.bio || "No bio available"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatFollowers(mainAccount?.followers_count || 0)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{mainAccount?.engagement_rate?.toFixed(1) || 0}%</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{influencer.location || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-2">
                          {socialAccounts.slice(0, 3).map((acc, idx) => (
                            <Avatar key={idx} className="h-8 w-8 border-2 border-background">
                              <AvatarFallback className="text-xs">
                                {acc.platform.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {socialAccounts.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                              +{socialAccounts.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <FolderPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Grid view - existing card layout */}
          </div>
        )}
      </div>
    </div>
  );
}
