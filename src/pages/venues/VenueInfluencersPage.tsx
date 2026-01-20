import { useState } from "react";
import { VenueLayout } from "@/components/venues/VenueLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  Instagram, 
  Youtube,
  MapPin,
  Users,
  Heart,
  Mail,
  ExternalLink,
  Filter
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const colors = {
  primary: "#053877",
  primaryLight: "#2C6BED",
};

const nicheTags = ["Weddings", "Corporate", "Nightlife", "Food & Drink", "Lifestyle", "Local", "Luxury"];

const suggestedInfluencers = [
  {
    id: 1,
    name: "Sarah Events",
    handle: "@sarahevents",
    avatar: "",
    platform: "instagram",
    location: "New York, NY",
    followers: 45000,
    engagement: 4.2,
    niches: ["Weddings", "Lifestyle"],
    verified: true,
  },
  {
    id: 2,
    name: "NYC Venues",
    handle: "@nycvenues",
    avatar: "",
    platform: "instagram",
    location: "New York, NY",
    followers: 128000,
    engagement: 3.8,
    niches: ["Corporate", "Nightlife"],
    verified: true,
  },
  {
    id: 3,
    name: "Event Queen",
    handle: "@eventqueen",
    avatar: "",
    platform: "youtube",
    location: "Brooklyn, NY",
    followers: 89000,
    engagement: 5.1,
    niches: ["Weddings", "Luxury"],
    verified: false,
  },
  {
    id: 4,
    name: "Party Planning Pro",
    handle: "@partyplanningpro",
    avatar: "",
    platform: "instagram",
    location: "Manhattan, NY",
    followers: 67000,
    engagement: 4.5,
    niches: ["Corporate", "Food & Drink"],
    verified: true,
  },
];

const activeCampaigns = [
  {
    id: 1,
    influencer: "Sarah Events",
    campaign: "Summer Wedding Showcase",
    status: "active",
    posts: 3,
    reach: 45000,
    engagement: 2100,
  },
  {
    id: 2,
    influencer: "NYC Venues",
    campaign: "Corporate Event Package",
    status: "completed",
    posts: 5,
    reach: 128000,
    engagement: 4500,
  },
];

export default function VenueInfluencersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<typeof suggestedInfluencers[0] | null>(null);
  const [outreachMessage, setOutreachMessage] = useState("");

  const toggleNiche = (niche: string) => {
    setSelectedNiches(prev => 
      prev.includes(niche) 
        ? prev.filter(n => n !== niche)
        : [...prev, niche]
    );
  };

  const filteredInfluencers = suggestedInfluencers.filter(influencer => {
    const matchesSearch = 
      influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.handle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = selectedNiches.length === 0 || 
      influencer.niches.some(n => selectedNiches.includes(n));
    return matchesSearch && matchesNiche;
  });

  const handleInvite = (influencer: typeof suggestedInfluencers[0]) => {
    setSelectedInfluencer(influencer);
    setOutreachMessage(`Hi ${influencer.name.split(" ")[0]},

We love your content and think you'd be a perfect fit to showcase our venue to your audience.

Would you be interested in a collaboration? We'd love to offer you a complimentary visit and discuss partnership opportunities.

Best,
[Your Name]`);
    setInviteDialogOpen(true);
  };

  const sendOutreach = () => {
    toast.success(`Outreach sent to ${selectedInfluencer?.name}`);
    setInviteDialogOpen(false);
    setSelectedInfluencer(null);
    setOutreachMessage("");
  };

  const formatFollowers = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <VenueLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Influencer Marketplace</h1>
            <p className="text-gray-600">Find and partner with creators to promote your venue</p>
          </div>
          <Button style={{ backgroundColor: colors.primary }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Influencer
          </Button>
        </div>

        {/* Search & Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {nicheTags.map(niche => (
                  <Badge
                    key={niche}
                    variant={selectedNiches.includes(niche) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleNiche(niche)}
                    style={selectedNiches.includes(niche) ? { backgroundColor: colors.primaryLight } : {}}
                  >
                    {niche}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Suggested Creators */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Suggested Creators Near You</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredInfluencers.map(influencer => (
                <Card key={influencer.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={influencer.avatar} />
                        <AvatarFallback style={{ backgroundColor: colors.primaryLight }} className="text-white">
                          {influencer.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{influencer.name}</h3>
                          {influencer.verified && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">Verified</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{influencer.handle}</p>
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {influencer.location}
                        </div>
                      </div>
                      {influencer.platform === "instagram" ? (
                        <Instagram className="h-5 w-5 text-pink-500" />
                      ) : (
                        <Youtube className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{formatFollowers(influencer.followers)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{influencer.engagement}%</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {influencer.niches.map(niche => (
                        <Badge key={niche} variant="outline" className="text-xs">
                          {niche}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        style={{ backgroundColor: colors.primary }}
                        onClick={() => handleInvite(influencer)}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Invite
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Campaigns</h2>
            <div className="space-y-4">
              {activeCampaigns.map(campaign => (
                <Card key={campaign.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{campaign.influencer}</h3>
                      <Badge 
                        variant={campaign.status === "active" ? "default" : "secondary"}
                        className={campaign.status === "active" ? "bg-green-100 text-green-700" : ""}
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{campaign.campaign}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-lg font-semibold text-gray-900">{campaign.posts}</p>
                        <p className="text-xs text-gray-500">Posts</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-lg font-semibold text-gray-900">{formatFollowers(campaign.reach)}</p>
                        <p className="text-xs text-gray-500">Reach</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-lg font-semibold text-gray-900">{formatFollowers(campaign.engagement)}</p>
                        <p className="text-xs text-gray-500">Engagement</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {activeCampaigns.length === 0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No active campaigns yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Invite an influencer to get started!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Invite Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite {selectedInfluencer?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Outreach Message</Label>
                <Textarea
                  value={outreachMessage}
                  onChange={(e) => setOutreachMessage(e.target.value)}
                  className="mt-1 min-h-[200px]"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={sendOutreach} className="flex-1" style={{ backgroundColor: colors.primary }}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VenueLayout>
  );
}
