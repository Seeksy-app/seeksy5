import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Check, Instagram, Youtube, Twitter, Linkedin, Users, TrendingUp, DollarSign, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { DemoCreatorV2 } from "@/data/advertiserDemoDataV2";

interface CreatorAnalyticsModalProps {
  creator: DemoCreatorV2 | null;
  open: boolean;
  onClose: () => void;
  onInvite?: (creatorId: string) => void;
}

const platformIcons: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="w-4 h-4" />,
  YouTube: <Youtube className="w-4 h-4" />,
  Twitter: <Twitter className="w-4 h-4" />,
  LinkedIn: <Linkedin className="w-4 h-4" />,
  TikTok: <span className="text-xs font-bold">TT</span>,
  Twitch: <span className="text-xs font-bold">Tw</span>,
  Spotify: <span className="text-xs font-bold">Sp</span>,
  Pinterest: <span className="text-xs font-bold">Pi</span>,
  Discord: <span className="text-xs font-bold">Dc</span>,
  Podcast: <span className="text-xs font-bold">🎙</span>,
  Behance: <span className="text-xs font-bold">Be</span>,
  "Apple Podcasts": <span className="text-xs font-bold">🍎</span>,
};

export function CreatorAnalyticsModal({ creator, open, onClose, onInvite }: CreatorAnalyticsModalProps) {
  if (!creator) return null;

  // Generate mock reach trend data
  const reachChartData = Array.from({ length: 7 }, (_, index) => ({
    week: `W${index + 1}`,
    reach: Math.floor(creator.followers * (0.05 + Math.random() * 0.03)),
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Creator Analytics</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-start gap-6 pb-6 border-b">
          <Avatar className="h-24 w-24">
            <AvatarImage src={creator.avatarUrl} />
            <AvatarFallback className="bg-[#2C6BED]/10 text-[#2C6BED] text-2xl">
              {creator.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-[#053877]">{creator.name}</h2>
              {creator.verified && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Check className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
              {creator.voiceVerified && (
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                  🎙 Voice Verified
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-2">{creator.handle}</p>
            <Badge variant="secondary" className="bg-[#2C6BED]/10 text-[#2C6BED]">
              {creator.niche}
            </Badge>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl">{creator.bio}</p>
          </div>
          <Button
            onClick={() => onInvite?.(creator.id)}
            className="bg-[#2C6BED] hover:bg-[#2C6BED]/90"
          >
            Invite to Campaign
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 py-6">
          <Card className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-[#2C6BED]" />
            <p className="text-2xl font-bold text-[#053877]">
              {creator.followers >= 1000000
                ? `${(creator.followers / 1000000).toFixed(1)}M`
                : `${(creator.followers / 1000).toFixed(0)}K`}
            </p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-[#053877]">{creator.engagementRate}%</p>
            <p className="text-xs text-muted-foreground">Engagement Rate</p>
          </Card>
          <Card className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold text-[#053877]">${creator.avgCPM.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Avg CPM</p>
          </Card>
          <Card className="p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-[#053877]">{creator.avgCTR}%</p>
            <p className="text-xs text-muted-foreground">Avg CTR</p>
          </Card>
        </div>

        {/* Platforms */}
        <div className="py-4 border-t">
          <h3 className="text-sm font-semibold text-[#053877] mb-3">Platforms</h3>
          <div className="flex gap-2">
            {creator.platforms.map((platform) => (
              <Badge key={platform} variant="outline" className="gap-1">
                {platformIcons[platform] || null}
                {platform}
              </Badge>
            ))}
          </div>
        </div>

        {/* Engagement Trend Chart */}
        <div className="py-4 border-t">
          <h3 className="text-sm font-semibold text-[#053877] mb-3">Reach Trend (7 Weeks)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reachChartData}>
                <defs>
                  <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2C6BED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2C6BED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()}`, "Reach"]} />
                <Area type="monotone" dataKey="reach" stroke="#2C6BED" fill="url(#reachGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audience Demographics */}
        <div className="py-4 border-t">
          <h3 className="text-sm font-semibold text-[#053877] mb-3">Audience Demographics</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Gender</p>
              <div className="flex gap-2 h-4 rounded-full overflow-hidden">
                <div
                  className="bg-pink-500 h-full"
                  style={{ width: `${creator.audienceDemo.female}%` }}
                />
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${creator.audienceDemo.male}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Female {creator.audienceDemo.female}%</span>
                <span>Male {creator.audienceDemo.male}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Age Distribution</p>
              <div className="flex gap-1 h-4">
                <div className="bg-[#2C6BED]/40 h-full rounded" style={{ width: `${creator.audienceDemo.age18_24}%` }} />
                <div className="bg-[#2C6BED]/70 h-full rounded" style={{ width: `${creator.audienceDemo.age25_34}%` }} />
                <div className="bg-[#2C6BED] h-full rounded" style={{ width: `${creator.audienceDemo.age35_plus}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>18-24: {creator.audienceDemo.age18_24}%</span>
                <span>25-34: {creator.audienceDemo.age25_34}%</span>
                <span>35+: {creator.audienceDemo.age35_plus}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Content */}
        <div className="py-4 border-t">
          <h3 className="text-sm font-semibold text-[#053877] mb-3">Top Content Examples</h3>
          <div className="flex gap-4">
            {creator.topContent.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Content ${idx + 1}`}
                className="w-32 h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* Recommended Formats */}
        <div className="py-4 border-t">
          <h3 className="text-sm font-semibold text-[#053877] mb-3">Recommended Ad Formats</h3>
          <div className="flex flex-wrap gap-2">
            {creator.recommendedFormats.map((format) => (
              <Badge key={format} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {format}
              </Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
