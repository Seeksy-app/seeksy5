import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, TrendingUp, Users, BarChart2, Mic, ShoppingBag, 
  Headphones, Sparkles, ChevronRight, FileText, ExternalLink,
  ArrowUpRight, ArrowDownRight, Settings2
} from "lucide-react";
import { MarketIntelligenceAdmin } from "@/components/market-intelligence/MarketIntelligenceAdmin";
import { MarketIntelligenceWidget } from "@/components/market-intelligence/MarketIntelligenceWidget";

// Insight card data
const economicInsights = [
  {
    title: "Creator Economy",
    value: "$104B",
    subtitle: "2024 Market Size",
    projection: "$147B projected 2026",
    icon: Globe,
    trend: "+41%",
    trendUp: true
  },
  {
    title: "Influencer Marketing Spend",
    value: "$24.5B",
    subtitle: "2025 Expected Worldwide",
    projection: "+18% YoY",
    icon: TrendingUp,
    trend: "+18%",
    trendUp: true
  },
  {
    title: "Podcast Advertising Market",
    value: "$2.3B",
    subtitle: "2025 Projection",
    projection: "+31% YoY in Host-Read Ads",
    icon: Mic,
    trend: "+31%",
    trendUp: true
  },
  {
    title: "Social Commerce / Affiliate",
    value: "$82B",
    subtitle: "2024 Revenue",
    projection: "TikTok Shop + Meta Shops growth",
    icon: ShoppingBag,
    trend: "+48%",
    trendUp: true
  }
];

const behaviorInsights = [
  {
    title: "Active Creators",
    value: "50M+",
    subtitle: "Globally",
    projection: "11M monetize consistently",
    icon: Users,
    trend: "+22%",
    trendUp: true
  },
  {
    title: "Ad Spend Growth",
    value: "+26%",
    subtitle: "YoY Increase",
    projection: "Q4 CPM expected +22%",
    icon: BarChart2,
    trend: "Q4 Peak",
    trendUp: true
  },
  {
    title: "Host-Read Ads Effectiveness",
    value: "3–6×",
    subtitle: "Higher Recall vs Display",
    projection: "Q4 demand up 40%",
    icon: Headphones,
    trend: "+40%",
    trendUp: true
  },
  {
    title: "Holiday Performance Forecast",
    value: "+51%",
    subtitle: "Influencer-Driven Sales YoY",
    projection: "AI content usage +520% YoY",
    icon: Sparkles,
    trend: "🎄",
    trendUp: true
  }
];

// Competitor data by category
const competitorCategories = [
  {
    category: "Recording & Editing Platforms",
    competitors: [
      { name: "Riverside.fm", tag: "Primary Competitor", description: "High-quality remote recording with local files and AI transcription" },
      { name: "Descript", tag: "Post-Production", description: "AI-powered video editing with text-based workflows" },
      { name: "Adobe Podcast", tag: "AI Enhancement", description: "Free AI audio enhancement and transcription tools" }
    ]
  },
  {
    category: "Streaming & Live Production",
    competitors: [
      { name: "Restream", tag: "Streaming Focus", description: "Multi-platform live streaming with branding tools" },
      { name: "StreamYard", tag: "Live Production", description: "Browser-based live streaming with guest management" }
    ]
  },
  {
    category: "Creator Monetization / Affiliate Tools",
    competitors: [
      { name: "Kajabi", tag: "All-in-One", description: "Course creation, marketing, and membership platform" },
      { name: "Stan Store", tag: "Link-in-Bio", description: "Creator storefront for digital products and bookings" },
      { name: "Fourthwall", tag: "Merch + Commerce", description: "Merchandise, memberships, and creator shops" }
    ]
  },
  {
    category: "Podcast Hosting / Distribution",
    competitors: [
      { name: "Buzzsprout", tag: "Hosting Only", description: "Simple podcast hosting with analytics and distribution" },
      { name: "Libsyn", tag: "Enterprise Hosting", description: "Advanced podcast hosting with monetization tools" },
      { name: "Spotify for Podcasters", tag: "Distribution", description: "Free hosting with Spotify-first distribution" }
    ]
  },
  {
    category: "AI Clip Generation / Short-Form Tools",
    competitors: [
      { name: "OpusClip", tag: "AI Clips", description: "AI-powered short clip generation from long-form content" },
      { name: "Dumme", tag: "Auto Highlights", description: "Automated highlight and clip extraction" },
      { name: "Kapwing AI", tag: "Creative Suite", description: "AI video editing with templates and collaboration" }
    ]
  }
];

// Market reports data
const marketReports = [
  { title: "2025 Holiday Advertising Outlook", description: "CPM trends, seasonal spikes, and advertiser behavior predictions", category: "Seasonal" },
  { title: "AI Influence Growth Report", description: "520% YoY increase in AI-generated content usage across platforms", category: "AI Trends" },
  { title: "Creator Monetization Benchmarks", description: "Revenue per follower, sponsorship rates, and affiliate performance by niche", category: "Monetization" },
  { title: "Social Commerce Industry Deep Dive", description: "TikTok Shop, Instagram Shopping, and live commerce analysis", category: "E-Commerce" }
];

// Trend indicators data
const trendIndicators = [
  { label: "CPM Movement", value: "+12%", trend: "up", period: "90 days" },
  { label: "IG Conversion Rate", value: "2.8%", trend: "up", period: "avg" },
  { label: "TikTok Conversion", value: "3.2%", trend: "up", period: "avg" },
  { label: "YouTube Conversion", value: "1.9%", trend: "stable", period: "avg" },
  { label: "Avg Engagement", value: "4.7%", trend: "up", period: "all niches" },
  { label: "Short-Form Growth", value: "+35%", trend: "up", period: "YoY" }
];

export default function MarketIntelligence() {
  const [selectedReport, setSelectedReport] = useState<typeof marketReports[0] | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<{ name: string; description: string } | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Market Intelligence</h1>
          <p className="text-muted-foreground">Industry insights, competitive analysis, and market trends</p>
        </div>
        <Badge variant="outline" className="text-xs">
          Last updated: Dec 2025
        </Badge>
      </div>

      {/* Tabs for Overview vs Source Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            <Globe className="h-4 w-4" />
            Live Intelligence
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Manage Sources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-6">

      {/* Economic Snapshot Row */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">Economic Snapshot</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {economicInsights.map((insight) => (
            <Card key={insight.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                <insight.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insight.value}</div>
                <p className="text-xs text-muted-foreground">{insight.subtitle}</p>
                <div className="flex items-center gap-1 mt-2">
                  {insight.trendUp ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-xs text-green-600 font-medium">{insight.projection}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Behavior & Performance Row */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">Behavior & Performance Insights</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {behaviorInsights.map((insight) => (
            <Card key={insight.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                <insight.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insight.value}</div>
                <p className="text-xs text-muted-foreground">{insight.subtitle}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-primary font-medium">{insight.projection}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">Trend Indicators</h2>
        <div className="flex flex-wrap gap-3">
          {trendIndicators.map((indicator) => (
            <div 
              key={indicator.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border"
            >
              <span className="text-sm font-medium">{indicator.label}</span>
              <span className={`text-sm font-bold ${
                indicator.trend === 'up' ? 'text-green-600' : 
                indicator.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {indicator.value}
              </span>
              {indicator.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-green-500" />}
              {indicator.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
              <span className="text-xs text-muted-foreground">({indicator.period})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Market Reports */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">Key Market Reports</h2>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {marketReports.map((report) => (
              <Card 
                key={report.title} 
                className="min-w-[300px] cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedReport(report)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">{report.category}</Badge>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base mt-2">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                  <Button variant="ghost" size="sm" className="mt-3 p-0 h-auto text-primary">
                    View Report <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Competitive Landscape */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Competitive Landscape</h2>
            <p className="text-sm text-muted-foreground">Key competitors by category</p>
          </div>
        </div>

        <div className="space-y-6">
          {competitorCategories.map((category) => (
            <Card key={category.category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{category.category}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {category.competitors.map((competitor) => (
                    <div 
                      key={competitor.name}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{competitor.name}</p>
                          <Badge variant="outline" className="text-xs">{competitor.tag}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{competitor.description}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedCompetitor(competitor)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </TabsContent>

        {/* Live Intelligence Tab */}
        <TabsContent value="live" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <MarketIntelligenceWidget 
              audience="ceo"
              title="CEO Strategic Signals"
              limit={8}
              showRefresh={true}
            />
            <MarketIntelligenceWidget 
              audience="cfo"
              title="CFO Market Benchmarks"
              limit={8}
              showRefresh={true}
            />
          </div>
        </TabsContent>

        {/* Source Management Tab */}
        <TabsContent value="sources" className="mt-6">
          <MarketIntelligenceAdmin />
        </TabsContent>
      </Tabs>

      {/* Report Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <Badge variant="secondary" className="w-fit mb-2">{selectedReport?.category}</Badge>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>{selectedReport?.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground">
                Full report data coming soon. This will include detailed charts, data tables, 
                and actionable insights for creators and advertisers.
              </p>
            </div>
            <Button className="w-full" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Download PDF (Coming Soon)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Competitor Modal */}
      <Dialog open={!!selectedCompetitor} onOpenChange={() => setSelectedCompetitor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Competitive Notes: {selectedCompetitor?.name}</DialogTitle>
            <DialogDescription>{selectedCompetitor?.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground">
                Detailed competitive analysis including pricing, features, market positioning, 
                and Seeksy differentiation points will be available here.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Pricing</p>
                <p className="font-medium">TBD</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Market Share</p>
                <p className="font-medium">TBD</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
