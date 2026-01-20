import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Check, Users, TrendingUp, DollarSign, Instagram, Youtube, Twitter, Linkedin, MapPin } from "lucide-react";
import { demoCreatorsV2 } from "@/data/advertiserDemoDataV2";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const CreatorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find the creator from demo data
  const creator = demoCreatorsV2.find((c) => c.id === id) || demoCreatorsV2[0];

  if (!creator) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-medium mb-4">Creator not found</p>
          <Button onClick={() => navigate("/advertiser/marketplace-v2")}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  const engagementData = (creator.reachTrend || [45000, 52000, 48000, 61000, 58000, 72000, 78000]).map((value, index) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
    reach: value,
  }));

  const platformIcons: Record<string, React.ReactNode> = {
    Instagram: <Instagram className="w-4 h-4" />,
    YouTube: <Youtube className="w-4 h-4" />,
    Twitter: <Twitter className="w-4 h-4" />,
    LinkedIn: <Linkedin className="w-4 h-4" />,
    TikTok: <span className="text-xs font-bold">TT</span>,
    Twitch: <span className="text-xs font-bold">Tw</span>,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-[#053877] to-[#041d3a] p-6"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Creator Profile</h1>
        </div>

        {/* Profile Header Card */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-28 w-28 flex-shrink-0">
              <AvatarImage src={creator.avatarUrl} className="object-cover" />
              <AvatarFallback className="text-2xl bg-[#2C6BED]/10 text-[#2C6BED]">
                {creator.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-[#053877]">{creator.name}</h2>
                    {creator.verified && (
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {creator.voiceVerified && (
                      <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Voice Verified</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{creator.handle}</p>
                </div>
                <Button
                  className="bg-[#2C6BED] hover:bg-[#2C6BED]/90"
                  onClick={() => navigate(`/advertiser/campaign-builder-v2?creator=${creator.id}`)}
                >
                  Invite to Campaign
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{creator.bio}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{creator.niche}</Badge>
                {creator.platforms?.map((platform) => (
                  <Badge key={platform} variant="secondary" className="flex items-center gap-1">
                    {platformIcons[platform] || null}
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#053877]">
                  {creator.followers >= 1000000
                    ? `${(creator.followers / 1000000).toFixed(1)}M`
                    : `${(creator.followers / 1000).toFixed(0)}K`}
                </p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#053877]">{creator.engagementRate}%</p>
                <p className="text-xs text-muted-foreground">Engagement Rate</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#053877]">${creator.avgCPM || 18}</p>
                <p className="text-xs text-muted-foreground">Avg CPM</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#053877]">{creator.performanceScore}</p>
                <p className="text-xs text-muted-foreground">Performance Score</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Engagement Trend */}
          <Card className="p-6 bg-white/95 backdrop-blur">
            <h3 className="font-semibold text-[#053877] mb-4">Reach Trend (Last 7 Days)</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()}`, "Reach"]} />
                  <Area type="monotone" dataKey="reach" stroke="#2C6BED" fill="#2C6BED" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Audience Demographics */}
          <Card className="p-6 bg-white/95 backdrop-blur">
            <h3 className="font-semibold text-[#053877] mb-4">Audience Demographics</h3>
            {creator.audienceDemo ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Gender</p>
                  <div className="flex gap-2 h-3 rounded-full overflow-hidden">
                    <div className="bg-pink-500" style={{ width: `${creator.audienceDemo.female}%` }} />
                    <div className="bg-blue-500" style={{ width: `${creator.audienceDemo.male}%` }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>Female {creator.audienceDemo.female}%</span>
                    <span>Male {creator.audienceDemo.male}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Age Distribution</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-16">18-24</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="bg-[#2C6BED] h-full rounded-full" style={{ width: `${creator.audienceDemo.age18_24}%` }} />
                      </div>
                      <span className="text-xs w-10 text-right">{creator.audienceDemo.age18_24}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-16">25-34</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="bg-[#2C6BED] h-full rounded-full" style={{ width: `${creator.audienceDemo.age25_34}%` }} />
                      </div>
                      <span className="text-xs w-10 text-right">{creator.audienceDemo.age25_34}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-16">35+</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="bg-[#2C6BED] h-full rounded-full" style={{ width: `${creator.audienceDemo.age35_plus}%` }} />
                      </div>
                      <span className="text-xs w-10 text-right">{creator.audienceDemo.age35_plus}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Demographics data not available</p>
            )}
          </Card>
        </div>

        {/* Top Content */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <h3 className="font-semibold text-[#053877] mb-4">Top Performing Content</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(creator.topContent || []).map((url, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={url} alt={`Content ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
            ))}
            {(!creator.topContent || creator.topContent.length === 0) && (
              <p className="text-sm text-muted-foreground col-span-4">No content examples available</p>
            )}
          </div>
        </Card>

        {/* Recommended Ad Formats */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <h3 className="font-semibold text-[#053877] mb-4">Recommended Ad Formats</h3>
          <div className="flex flex-wrap gap-2">
            {(creator.recommendedFormats || ["Story Ads", "Reels", "Sponsored Posts"]).map((format) => (
              <Badge key={format} variant="outline" className="px-3 py-1">
                {format}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default CreatorDetailPage;