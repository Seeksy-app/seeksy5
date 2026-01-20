import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Users, TrendingUp, Star, MessageSquare } from "lucide-react";
import { demoInfluencers } from "@/data/advertiserDemoData";

const allInfluencers = [
  ...demoInfluencers,
  {
    id: "inf-6",
    name: "Jordan Lee",
    handle: "@jordanlee",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    niche: "Gaming",
    followers: 425000,
    engagementRate: 7.2,
    performanceScore: 91,
  },
  {
    id: "inf-7",
    name: "Nina Rodriguez",
    handle: "@ninarodriguez",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
    niche: "Beauty",
    followers: 198000,
    engagementRate: 5.8,
    performanceScore: 83,
  },
  {
    id: "inf-8",
    name: "Chris Taylor",
    handle: "@christaylor",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
    niche: "Fitness",
    followers: 367000,
    engagementRate: 4.1,
    performanceScore: 79,
  },
];

const niches = ["All", "Lifestyle", "Tech", "Fashion", "Business", "Health", "Gaming", "Beauty", "Fitness"];

const AdvertiserCreators = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("All");
  const [sortBy, setSortBy] = useState("performanceScore");

  const filteredInfluencers = allInfluencers
    .filter((inf) => {
      const matchesSearch =
        inf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.handle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesNiche = selectedNiche === "All" || inf.niche === selectedNiche;
      return matchesSearch && matchesNiche;
    })
    .sort((a, b) => {
      if (sortBy === "performanceScore") return b.performanceScore - a.performanceScore;
      if (sortBy === "followers") return b.followers - a.followers;
      if (sortBy === "engagementRate") return b.engagementRate - a.engagementRate;
      return 0;
    });

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Creator Marketplace</h1>
            <p className="text-white/70 mt-1">Discover and connect with top creators</p>
          </div>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            {allInfluencers.length} Creators Available
          </Badge>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white/95 backdrop-blur">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Niche" />
              </SelectTrigger>
              <SelectContent>
                {niches.map((niche) => (
                  <SelectItem key={niche} value={niche}>
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <TrendingUp className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performanceScore">Performance Score</SelectItem>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="engagementRate">Engagement Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Creator Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInfluencers.map((influencer) => (
            <Card key={influencer.id} className="p-4 bg-white/95 backdrop-blur hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={influencer.avatarUrl} />
                  <AvatarFallback className="bg-[#2C6BED]/10 text-[#2C6BED] text-lg">
                    {influencer.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="font-semibold text-[#053877]">{influencer.name}</h3>
                  <p className="text-sm text-muted-foreground">{influencer.handle}</p>
                </div>

                <Badge variant="secondary" className="bg-[#2C6BED]/10 text-[#2C6BED]">
                  {influencer.niche}
                </Badge>

                <div className="grid grid-cols-3 gap-2 w-full text-center">
                  <div>
                    <p className="text-lg font-bold text-[#053877]">
                      {influencer.followers >= 1000
                        ? `${(influencer.followers / 1000).toFixed(0)}K`
                        : influencer.followers}
                    </p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#053877]">{influencer.engagementRate}%</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${getScoreColor(influencer.performanceScore)}`}>
                      {influencer.performanceScore}
                    </p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                  <Button size="sm" className="flex-1 bg-[#2C6BED] hover:bg-[#2C6BED]/90">
                    <Star className="w-4 h-4 mr-1" />
                    Invite
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredInfluencers.length === 0 && (
          <Card className="p-8 bg-white/95 backdrop-blur text-center">
            <p className="text-muted-foreground">No creators found matching your criteria.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvertiserCreators;
