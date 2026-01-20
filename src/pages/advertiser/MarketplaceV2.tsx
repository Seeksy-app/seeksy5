import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Users, TrendingUp, Star, Check, MessageSquare, SlidersHorizontal } from "lucide-react";
import { demoCreatorsV2 } from "@/data/advertiserDemoDataV2";
import { CreatorAnalyticsModal } from "@/components/advertiser/CreatorAnalyticsModal";
import { motion } from "framer-motion";

const niches = [
  "All Niches",
  "Lifestyle & Wellness",
  "Tech & Gaming",
  "Fashion & Beauty",
  "Business & Finance",
  "Health & Fitness",
  "Food & Cooking",
  "Travel & Adventure",
  "Music & Entertainment",
  "Parenting & Family",
  "Outdoor & Adventure",
  "Art & Design",
  "Personal Finance",
  "Pets & Animals",
  "Automotive",
  "Home & Interior",
  "Podcasting & Media",
];

const platforms = ["All Platforms", "Instagram", "YouTube", "TikTok", "Twitter", "LinkedIn", "Twitch", "Podcast"];

const MarketplaceV2 = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("All Niches");
  const [selectedPlatform, setSelectedPlatform] = useState("All Platforms");
  const [followerRange, setFollowerRange] = useState([0, 500000]);
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<typeof demoCreatorsV2[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredCreators = demoCreatorsV2.filter((creator) => {
    const matchesSearch =
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.niche.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = selectedNiche === "All Niches" || creator.niche.includes(selectedNiche.split(" ")[0]);
    const matchesPlatform =
      selectedPlatform === "All Platforms" || creator.platforms.includes(selectedPlatform);
    const matchesFollowers = creator.followers >= followerRange[0] && creator.followers <= followerRange[1];
    const matchesPrice = creator.avgCPM >= priceRange[0] && creator.avgCPM <= priceRange[1];
    return matchesSearch && matchesNiche && matchesPlatform && matchesFollowers && matchesPrice;
  });

  const handleViewCreator = (creator: typeof demoCreatorsV2[0]) => {
    setSelectedCreator(creator);
    setModalOpen(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 80) return "text-blue-600 bg-blue-50";
    if (score >= 70) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Creator Marketplace</h1>
            <p className="text-white/70 mt-1">Discover and connect with top creators</p>
          </div>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            {demoCreatorsV2.length} Creators
          </Badge>
        </div>

        {/* Search & Filters */}
        <Card className="p-4 bg-white/95 backdrop-blur">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, handle, or niche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Niche" />
              </SelectTrigger>
              <SelectContent>
                {niches.map((niche) => (
                  <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((platform) => (
                  <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-[#2C6BED]/10 border-[#2C6BED]" : ""}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium mb-2">
                  Followers: {(followerRange[0] / 1000).toFixed(0)}K - {(followerRange[1] / 1000).toFixed(0)}K
                </p>
                <Slider
                  value={followerRange}
                  onValueChange={setFollowerRange}
                  max={500000}
                  step={10000}
                  className="w-full"
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">
                  CPM Range: ${priceRange[0]} - ${priceRange[1]}
                </p>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Results Count */}
        <p className="text-white/70 text-sm">{filteredCreators.length} creators found</p>

        {/* Creator Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCreators.map((creator) => (
            <Card
              key={creator.id}
              className="p-5 bg-white/95 backdrop-blur hover:shadow-xl transition-all"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={creator.avatarUrl} className="object-cover w-full h-full" />
                      <AvatarFallback className="bg-[#2C6BED]/10 text-[#2C6BED] text-xl w-full h-full flex items-center justify-center">
                        {creator.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {creator.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[#053877]">{creator.name}</h3>
                  <p className="text-sm text-muted-foreground">{creator.handle}</p>
                </div>

                <Badge variant="secondary" className="bg-[#2C6BED]/10 text-[#2C6BED]">
                  {creator.niche}
                </Badge>

                {/* Platforms */}
                <div className="flex flex-wrap justify-center gap-1">
                  {creator.platforms.slice(0, 3).map((platform) => (
                    <Badge key={platform} variant="outline" className="text-[10px]">
                      {platform}
                    </Badge>
                  ))}
                  {creator.platforms.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">+{creator.platforms.length - 3}</Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 w-full text-center">
                  <div>
                    <p className="text-lg font-bold text-[#053877]">
                      {creator.followers >= 1000000
                        ? `${(creator.followers / 1000000).toFixed(1)}M`
                        : `${(creator.followers / 1000).toFixed(0)}K`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#053877]">{creator.engagementRate}%</p>
                    <p className="text-[10px] text-muted-foreground">Engagement</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold px-2 py-0.5 rounded ${getScoreColor(creator.performanceScore)}`}>
                      {creator.performanceScore}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Score</p>
                  </div>
                </div>

                {/* Price */}
                <p className="text-sm">
                  <span className="text-muted-foreground">Avg CPM:</span>{" "}
                  <span className="font-semibold text-[#053877]">${creator.avgCPM.toFixed(2)}</span>
                </p>

                {/* Actions */}
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewCreator(creator)}
                  >
                    Open Profile
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-[#2C6BED] hover:bg-[#2C6BED]/90"
                    onClick={() => navigate(`/advertiser/campaign-builder-v2?creator=${creator.id}`)}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Invite
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCreators.length === 0 && (
          <Card className="p-8 bg-white/95 backdrop-blur text-center">
            <p className="text-muted-foreground">No creators found matching your criteria.</p>
          </Card>
        )}
      </div>

      {/* Creator Analytics Modal */}
      <CreatorAnalyticsModal
        creator={selectedCreator}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onInvite={(id) => {
          setModalOpen(false);
          navigate(`/advertiser/campaign-builder-v2?creator=${id}`);
        }}
      />
    </motion.div>
  );
};

export default MarketplaceV2;
