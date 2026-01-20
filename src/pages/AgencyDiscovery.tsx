import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Search, Users, TrendingUp, DollarSign, ExternalLink, 
  Instagram, Filter, X, MapPin
} from "lucide-react";
import { useAgencyDiscovery, useDiscoveryStats, DiscoveryFilters } from "@/hooks/useAgencyDiscovery";
import { Helmet } from "react-helmet";

const FOLLOWER_PRESETS = [
  { label: "Any", min: 0, max: undefined },
  { label: "1K - 10K", min: 1000, max: 10000 },
  { label: "10K - 50K", min: 10000, max: 50000 },
  { label: "50K - 100K", min: 50000, max: 100000 },
  { label: "100K - 500K", min: 100000, max: 500000 },
  { label: "500K+", min: 500000, max: undefined },
];

const NICHE_OPTIONS = [
  "Beauty", "Fashion", "Business", "Finance", "Fitness", 
  "Health", "Wellness", "Lifestyle", "Travel", "Food",
  "Tech", "Gaming", "Music", "Art", "Education"
];

export default function AgencyDiscovery() {
  const [filters, setFilters] = useState<DiscoveryFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [followerPreset, setFollowerPreset] = useState("Any");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [engagementRange, setEngagementRange] = useState([0, 20]);
  const [showFilters, setShowFilters] = useState(true);

  const { data: profiles, isLoading } = useAgencyDiscovery(filters);
  const { data: stats } = useDiscoveryStats();

  const applyFilters = () => {
    const preset = FOLLOWER_PRESETS.find(p => p.label === followerPreset);
    setFilters({
      searchTerm: searchTerm || undefined,
      minFollowers: preset?.min,
      maxFollowers: preset?.max,
      minEngagement: engagementRange[0] || undefined,
      maxEngagement: engagementRange[1] < 20 ? engagementRange[1] : undefined,
      nicheTags: selectedNiches.length > 0 ? selectedNiches : undefined,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFollowerPreset("Any");
    setSelectedNiches([]);
    setEngagementRange([0, 20]);
    setFilters({});
  };

  const toggleNiche = (niche: string) => {
    setSelectedNiches(prev => 
      prev.includes(niche) 
        ? prev.filter(n => n !== niche)
        : [...prev, niche]
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <Helmet>
        <title>Creator Discovery – Seeksy</title>
        <meta name="description" content="Discover and find creators for brand partnerships" />
      </Helmet>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Creator Discovery</h1>
          <p className="text-muted-foreground">Find creators for brand partnerships</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Total Profiles</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalProfiles || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Instagram className="h-4 w-4" />
              <span className="text-xs">Connected Creators</span>
            </div>
            <p className="text-2xl font-bold">{stats?.connectedCreators || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Avg Followers</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(stats?.avgFollowers || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Avg Engagement</span>
            </div>
            <p className="text-2xl font-bold">{stats?.avgEngagement || 0}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <Card className="w-72 shrink-0 h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Filters</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Username</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <Select defaultValue="instagram">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Followers */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Followers</label>
                <Select value={followerPreset} onValueChange={setFollowerPreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLLOWER_PRESETS.map(preset => (
                      <SelectItem key={preset.label} value={preset.label}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Engagement */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Engagement Rate: {engagementRange[0]}% - {engagementRange[1] >= 20 ? '20%+' : `${engagementRange[1]}%`}
                </label>
                <Slider
                  value={engagementRange}
                  onValueChange={setEngagementRange}
                  min={0}
                  max={20}
                  step={0.5}
                />
              </div>

              {/* Niches */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Niches</label>
                <div className="flex flex-wrap gap-1.5">
                  {NICHE_OPTIONS.map(niche => (
                    <Badge
                      key={niche}
                      variant={selectedNiches.includes(niche) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleNiche(niche)}
                    >
                      {niche}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={applyFilters}>
                Apply Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-16 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : profiles && profiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map(profile => (
                <Card key={profile.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    {/* Profile Header */}
                    <div className="flex items-center gap-3 mb-4">
                      {profile.profile_picture_url ? (
                        <img 
                          src={profile.profile_picture_url} 
                          alt={profile.username}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Instagram className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">@{profile.username}</p>
                        {profile.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {profile.location}
                          </div>
                        )}
                      </div>
                      <a 
                        href={`https://instagram.com/${profile.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Followers</p>
                        <p className="font-semibold">{formatNumber(profile.followers)}</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Engagement</p>
                        <p className="font-semibold">{profile.engagement_rate.toFixed(1)}%</p>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">Est. Rate</p>
                        <p className="font-semibold text-green-600">
                          ${profile.estimated_value_per_post.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {/* Niches */}
                    {profile.niche_tags && profile.niche_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {profile.niche_tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {profile.niche_tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.niche_tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Source Badge */}
                    {profile.source === "connected_creator" && (
                      <Badge variant="outline" className="mt-2 text-xs text-green-600 border-green-200">
                        Verified Creator
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No creators found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or wait for more creators to connect.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
