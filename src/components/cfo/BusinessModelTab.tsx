import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Users, DollarSign, Zap, Target, Award, Sparkles } from "lucide-react";

// Chart Data
const creatorEconomyGrowth = [
  { year: "2021", value: 104, label: "$104B" },
  { year: "2022", value: 127, label: "$127B" },
  { year: "2023", value: 156, label: "$156B" },
  { year: "2024", value: 192, label: "$192B" },
  { year: "2025", value: 235, label: "$235B" },
  { year: "2026", value: 287, label: "$287B" },
  { year: "2027", value: 350, label: "$350B" },
];

const podcastListenerGrowth = [
  { year: "2021", listeners: 424, label: "424M" },
  { year: "2022", listeners: 464, label: "464M" },
  { year: "2023", listeners: 505, label: "505M" },
  { year: "2024", listeners: 548, label: "548M" },
  { year: "2025", listeners: 600, label: "600M" },
  { year: "2026", listeners: 660, label: "660M" },
  { year: "2027", listeners: 726, label: "726M" },
];

const platformExpansion = [
  { platform: "Apple Podcasts", year: "2005", status: "Established" },
  { platform: "Spotify", year: "2019", status: "Established" },
  { platform: "YouTube Podcasts", year: "2022", status: "Growing" },
  { platform: "Amazon Music", year: "2020", status: "Growing" },
  { platform: "iHeart + TikTok", year: "2025", status: "New (25 podcasts)" },
  { platform: "Threads Audio", year: "2024", status: "Emerging" },
];

const competitorPricing = [
  { 
    name: "Seeksy", 
    basic: 19, 
    pro: 49, 
    enterprise: 199,
    features: "All-in-one: Podcasting, Meetings, Events, AI Tools, Analytics"
  },
  { 
    name: "Riverside", 
    basic: 19, 
    pro: 29, 
    enterprise: 249,
    features: "Remote recording & video editing (limited engagement tools)"
  },
  { 
    name: "Restream", 
    basic: 20, 
    pro: 41, 
    enterprise: 99,
    features: "Multistreaming (no podcast hosting or meetings)"
  },
  { 
    name: "StreamYard", 
    basic: 25, 
    pro: 49, 
    enterprise: 149,
    features: "Live streaming (limited post-production & analytics)"
  },
  { 
    name: "Descript", 
    basic: 24, 
    pro: 40, 
    enterprise: 50,
    features: "Video editing (no live streaming or event hosting)"
  },
];

const podcastRevenueGrowth = [
  { year: "2021", value: 1.3, label: "$1.3B" },
  { year: "2022", value: 1.8, label: "$1.8B" },
  { year: "2023", value: 2.4, label: "$2.4B" },
  { year: "2024", value: 3.1, label: "$3.1B" },
  { year: "2025", value: 4.0, label: "$4.0B" },
  { year: "2026", value: 5.2, label: "$5.2B" },
];

const engagementToolsDemand = [
  { category: "Live Sessions", growth: 145, color: "hsl(280, 85%, 55%)" },
  { category: "Meetings", growth: 132, color: "hsl(340, 75%, 55%)" },
  { category: "Events", growth: 128, color: "hsl(200, 80%, 50%)" },
  { category: "Workshops", growth: 118, color: "hsl(150, 70%, 45%)" },
  { category: "Scheduling", growth: 115, color: "hsl(45, 90%, 55%)" },
];

const revenueStreams = [
  { name: "Subscriptions", value: 45, color: "hsl(280, 85%, 55%)" },
  { name: "Ad Revenue Share", value: 25, color: "hsl(340, 75%, 55%)" },
  { name: "Event Tickets", value: 15, color: "hsl(200, 80%, 50%)" },
  { name: "Premium Tools", value: 10, color: "hsl(150, 70%, 45%)" },
  { name: "Analytics", value: 5, color: "hsl(45, 90%, 55%)" },
];

const valueChain = [
  { stage: "Content Creation", seeksy: 85, traditional: 45 },
  { stage: "Audience Engagement", seeksy: 92, traditional: 35 },
  { stage: "Monetization", seeksy: 88, traditional: 50 },
  { stage: "Analytics", seeksy: 90, traditional: 60 },
  { stage: "Distribution", seeksy: 87, traditional: 75 },
];

const monetizationFlow = [
  { month: "M1", creator: 250, platform: 75 },
  { month: "M3", creator: 420, platform: 130 },
  { month: "M6", creator: 680, platform: 205 },
  { month: "M9", creator: 950, platform: 285 },
  { month: "M12", creator: 1250, platform: 375 },
  { month: "M18", creator: 1800, platform: 540 },
  { month: "M24", creator: 2450, platform: 735 },
];

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
};

export function BusinessModelTab({ theme = "light" }: { theme?: "dark" | "light" }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className={`${theme === 'dark' ? 'bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border-blue-700' : 'bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-200/20'}`}>
        <CardHeader>
          <CardTitle className={`text-3xl flex items-center gap-3 ${theme === 'dark' ? 'text-blue-100' : ''}`}>
            <Sparkles className={`h-8 w-8 ${theme === 'dark' ? 'text-cyan-400' : 'text-purple-600'}`} />
            Seeksy Business Model
          </CardTitle>
          <CardDescription className={`text-base ${theme === 'dark' ? 'text-blue-300/70' : ''}`}>
            A comprehensive overview of how Seeksy creates value in the rapidly growing creator economy
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overview Section */}
      <Card className={theme === 'dark' ? 'bg-blue-950/40 border-blue-800' : ''}>
        <CardHeader>
          <CardTitle className={`text-2xl ${theme === 'dark' ? 'text-blue-100' : ''}`}>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-blue-200/90' : ''}`}>
            Seeksy is an all-in-one platform designed to empower podcasters, creators, and event hosts 
            with the tools they need to grow, engage, and monetize their audiences. We combine content 
            creation, live interaction, and business tools into a single, integrated ecosystem.
          </p>
          <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-blue-200/90' : ''}`}>
            Unlike traditional platforms that focus solely on content distribution, Seeksy enables 
            <strong> direct audience engagement</strong> through meetings, live events, interactive sessions, 
            and booking tools—giving creators new ways to connect with their communities and generate revenue 
            beyond advertising alone.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 pt-4">
            <div className={`p-4 rounded-lg border flex flex-col h-full ${theme === 'dark' ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-purple-500/30' : 'bg-gradient-to-br from-purple-500/5 to-purple-600/5 border-purple-200/20'}`}>
              <Users className={`h-7 w-7 mb-2 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} />
              <h4 className={`font-semibold text-base mb-1.5 ${theme === 'dark' ? 'text-purple-100' : ''}`}>Who We Serve</h4>
              <p className={`text-xs flex-1 ${theme === 'dark' ? 'text-purple-200/80' : 'text-muted-foreground'}`}>
                Podcasters, content creators, event hosts, educators, and small businesses building engaged communities
              </p>
            </div>
            <div className={`p-4 rounded-lg border flex flex-col h-full ${theme === 'dark' ? 'bg-gradient-to-br from-rose-600/30 to-red-600/30 border-rose-500/30' : 'bg-gradient-to-br from-pink-500/5 to-pink-600/5 border-pink-200/20'}`}>
              <Target className={`h-7 w-7 mb-2 ${theme === 'dark' ? 'text-rose-300' : 'text-pink-600'}`} />
              <h4 className={`font-semibold text-base mb-1.5 ${theme === 'dark' ? 'text-rose-100' : ''}`}>What We Solve</h4>
              <p className={`text-xs flex-1 ${theme === 'dark' ? 'text-rose-200/80' : 'text-muted-foreground'}`}>
                Fragmented tools, limited engagement options, and difficulty monetizing beyond ads and sponsorships
              </p>
            </div>
            <div className={`p-4 rounded-lg border flex flex-col h-full ${theme === 'dark' ? 'bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border-cyan-500/30' : 'bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-200/20'}`}>
              <Award className={`h-7 w-7 mb-2 ${theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'}`} />
              <h4 className={`font-semibold text-base mb-1.5 ${theme === 'dark' ? 'text-cyan-100' : ''}`}>Our Edge</h4>
              <p className={`text-xs flex-1 ${theme === 'dark' ? 'text-cyan-200/80' : 'text-muted-foreground'}`}>
                Unified platform combining content, engagement, and monetization with AI-powered tools and seamless workflows
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industry Trends */}
      <Card className={theme === 'dark' ? 'bg-blue-950/40 border-blue-800' : ''}>
        <CardHeader>
          <CardTitle className={`text-2xl ${theme === 'dark' ? 'text-blue-100' : ''}`}>Industry Trends & Opportunity</CardTitle>
          <CardDescription className={theme === 'dark' ? 'text-blue-300/70' : ''}>
            Why now? The creator economy and podcast industry are experiencing explosive growth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Key Market Insights:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Creator Economy Growth:</strong> Expected to reach $350B by 2027, growing at 30%+ CAGR 
                  (Source: Goldman Sachs, SignalFire)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Massive Podcast Audience:</strong> 584.1 million podcast listeners worldwide in 2024, 
                  projected to reach 600 million by end of 2025 (Backlinko, DemandSage). Over 4.57 million active podcasts indexed globally.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Podcasting Revenue Boom:</strong> Podcast industry revenue projected to exceed $5.2B by 2026, 
                  with 160M+ listeners in the U.S. alone (IAB, Edison Research)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>New Platforms Entering:</strong> TikTok partnered with iHeartMedia in Nov 2025 to launch TikTok Podcast Network 
                  with up to 25 new creator podcasts, plus national radio station. Threads Audio and other platforms expanding into podcasting space.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Direct Engagement Demand:</strong> 78% of creators report needing better tools for audience 
                  interaction beyond social media (Creator Economy Report 2024)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Live Session Growth:</strong> Live events, workshops, and one-on-one meetings grew 145% 
                  YoY as creators seek higher-value interactions (Eventbrite, Patreon data)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Platform Fragmentation Pain:</strong> Average creator uses 6-8 different tools to manage 
                  content, bookings, payments, and analytics—creating inefficiency and missed revenue opportunities
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                <span>
                  <strong>Shift to Private Communities:</strong> Creators are moving audiences away from algorithm-driven 
                  platforms toward owned channels (email, memberships, direct bookings) for predictable income
                </span>
              </li>
            </ul>
          </div>

          {/* Chart: Creator Economy Growth */}
          <div>
            <h4 className="font-semibold mb-4">Creator Economy Market Size (Billions)</h4>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={creatorEconomyGrowth}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis 
                  dataKey="year" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 13, fill: 'hsl(var(--foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 13, fill: 'hsl(var(--foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Billions ($)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '2px solid hsl(262, 83%, 58%)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                    padding: '12px'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(262, 83%, 58%)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={2000}
                  dot={{ fill: 'hsl(262, 83%, 58%)', r: 5, strokeWidth: 3, stroke: 'hsl(var(--background))' }}
                  activeDot={{ r: 8, fill: 'hsl(262, 83%, 58%)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart: Podcast Revenue Growth */}
          <div>
            <h4 className="font-semibold mb-4">Podcast Industry Revenue Projection (Billions)</h4>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={podcastRevenueGrowth}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(326, 78%, 55%)" />
                    <stop offset="100%" stopColor="hsl(346, 87%, 62%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis 
                  dataKey="year" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 13, fill: 'hsl(var(--foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 13, fill: 'hsl(var(--foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Billions ($)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '2px solid hsl(326, 78%, 55%)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(244, 63, 94, 0.3)',
                    padding: '12px'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="url(#lineGradient)" 
                  strokeWidth={4}
                  dot={{ fill: 'hsl(326, 78%, 55%)', r: 7, strokeWidth: 3, stroke: 'hsl(var(--background))' }}
                  activeDot={{ r: 10, fill: 'hsl(346, 87%, 62%)', strokeWidth: 3, stroke: 'hsl(var(--background))' }}
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart: Podcast Listener Growth */}
          <div>
            <h4 className="font-semibold mb-4">Global Podcast Listener Growth (Millions)</h4>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={podcastListenerGrowth}>
                <defs>
                  <linearGradient id="colorListeners" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis 
                  dataKey="year" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 13, fill: 'hsl(var(--foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 13, fill: 'hsl(var(--foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Millions', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '2px solid hsl(199, 89%, 48%)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(14, 165, 233, 0.3)',
                    padding: '12px'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="listeners" 
                  stroke="hsl(199, 89%, 48%)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorListeners)" 
                  animationDuration={2000}
                  dot={{ fill: 'hsl(199, 89%, 48%)', r: 5, strokeWidth: 3, stroke: 'hsl(var(--background))' }}
                  activeDot={{ r: 8, fill: 'hsl(199, 89%, 48%)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              584.1M listeners in 2024, projected 600M by end of 2025 • 4.57M active podcasts globally
            </p>
          </div>

          {/* Chart: Engagement Tools Demand */}
          <div>
            <h4 className="font-semibold mb-4">Growth in Engagement Tools Demand (YoY %)</h4>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={engagementToolsDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis 
                  dataKey="category" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 13, fill: 'hsl(var(--foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Growth %', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '2px solid hsl(var(--primary))',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                    padding: '12px'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="growth" radius={[10, 10, 0, 0]} animationDuration={2000}>
                  {engagementToolsDemand.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Timeline & Market Inflection Points */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Podcast Platform Evolution & Market Entry</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <p className="font-medium text-sm">Apple Podcasts</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Launch: 2005 • Podcast Entry: 2005</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <p className="font-medium text-sm">Spotify</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Launch: 2008 • Podcast Entry: 2019</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <p className="font-medium text-sm">YouTube Podcasts</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Launch: 2005 • Podcast Entry: 2022</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <p className="font-medium text-sm">Amazon Music</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Launch: 2007 • Podcast Entry: 2020</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="font-medium text-sm">TikTok + iHeart</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Launch: 2016 • Podcast Entry: Nov 2025</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <p className="font-medium text-sm">Threads Audio</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Launch: 2023 • Podcast Entry: 2024</p>
                </div>
              </div>
            </div>

            {/* Inflection Points */}
            <div className="space-y-4">
              <h4 className="font-semibold">Market Inflection Points & Seeksy's Strategic Entry</h4>
              
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border-2 border-purple-200/30">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-base mb-2 flex items-center gap-2">
                      AI Inflection Point (2023-2025)
                    </h5>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      Generative AI transformed content creation economics. AI video editing, automated post-production, 
                      and intelligent tools reduced production costs by 70%+ while improving quality. This democratized 
                      professional-grade content creation for millions of creators.
                    </p>
                    <p className="text-sm font-semibold">
                      <strong>Seeksy's Market Capture:</strong> We integrate AI-powered editing, clip generation, transcription, 
                      and content optimization directly into our platform—eliminating the need for expensive external tools. 
                      Creators get professional results without technical expertise or additional software subscriptions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border-2 border-blue-200/30">
                <div className="flex items-start gap-3">
                  <Zap className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-base mb-2 flex items-center gap-2">
                      Streaming & Advertising Inflection Point (2024-2026)
                    </h5>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      Major platforms (YouTube, Spotify, TikTok, Threads) accelerated podcast and live streaming integration. 
                      Podcast advertising reached $5.2B+ with programmatic ad insertion becoming standard. Creators demand unified 
                      tools for streaming, monetization, and ad revenue optimization across channels.
                    </p>
                    <p className="text-sm font-semibold">
                      <strong>Seeksy's Market Capture:</strong> We provide native multi-platform streaming, automated ad insertion 
                      with revenue tracking, real-time analytics, and integrated payment processing. Creators broadcast to YouTube, 
                      Spotify, and social platforms simultaneously while Seeksy handles ad placement, revenue splits, and payout 
                      management—capturing both subscription revenue and ad-share fees as the market expands.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic mt-3">
                By positioning at the intersection of AI automation and streaming/advertising expansion, Seeksy captures value 
                from both inflection points: reducing creator costs through AI while increasing revenue through multi-platform 
                streaming and ad monetization infrastructure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why Seeksy Exists */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Why Seeksy Exists</CardTitle>
          <CardDescription>
            Solving critical pain points in the creator economy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed">
            Creators face a fundamental challenge: <strong>how to build sustainable income without relying solely 
            on unpredictable ad revenue or platform algorithms.</strong> Traditional platforms offer content hosting 
            but lack the engagement and monetization tools creators need to thrive.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg text-red-600">❌ Problems Creators Face</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Using 6-8 different tools (Calendly, Zoom, Patreon, YouTube, email, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Limited monetization beyond ads and sponsorships</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>No direct booking or meeting capabilities built into content platforms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Difficulty tracking audience engagement and revenue analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Missed revenue opportunities from high-value interactions (coaching, workshops, consulting)</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-lg text-green-600">✓ How Seeksy Solves This</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>All-in-one platform: podcasting, meetings, events, booking, payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Multiple revenue streams: subscriptions, tickets, bookings, ad-share</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Built-in meeting and event tools—no external integrations needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Unified analytics dashboard showing revenue, engagement, and growth metrics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>AI-powered tools for content creation, editing, and audience insights</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Model */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Our Revenue Model
          </CardTitle>
          <CardDescription>
            How Seeksy earns revenue while helping creators succeed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-base leading-relaxed">
              Seeksy generates revenue through a <strong>diversified, scalable model</strong> that aligns our 
              success with creator growth. As creators earn more, we earn more—creating a true partnership.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  Subscription Revenue
                </h4>
                <p className="text-sm text-muted-foreground">
                  Monthly and annual subscriptions for podcasters ($19-$199/mo), My Page users ($9-$29/mo), 
                  and event creators ($29/mo). Tiered pricing based on features and usage.
                </p>
              </div>

              <div className="p-4 bg-pink-500/5 rounded-lg border border-pink-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Ad Revenue Share
                </h4>
                <p className="text-sm text-muted-foreground">
                  Platform earns 30% of ad revenue generated through podcast ad-insertion and display ads. 
                  Creators keep 70%, ensuring mutual benefit from audience growth.
                </p>
              </div>

              <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">🎟️</span>
                  Event Ticketing Fees
                </h4>
                <p className="text-sm text-muted-foreground">
                  Small percentage fee (5-10%) on paid event tickets, workshops, and virtual conferences 
                  hosted through Seeksy's event platform.
                </p>
              </div>

              <div className="p-4 bg-green-500/5 rounded-lg border border-green-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">🔧</span>
                  Premium Tools & Add-ons
                </h4>
                <p className="text-sm text-muted-foreground">
                  Advanced AI editing, analytics dashboards, custom branding, priority support, and 
                  enterprise-level features available as upgrades.
                </p>
              </div>

              <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  Booking & Meeting Fees
                </h4>
                <p className="text-sm text-muted-foreground">
                  Small platform fee on paid bookings (coaching sessions, consulting calls, workshops) 
                  scheduled through Seeksy's integrated calendar and meeting tools.
                </p>
              </div>

              <div className="p-4 bg-indigo-500/5 rounded-lg border border-indigo-200/20">
                <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  Enterprise & White-Label
                </h4>
                <p className="text-sm text-muted-foreground">
                  Custom enterprise solutions for agencies, networks, and large creator teams requiring 
                  white-label branding and advanced team collaboration features.
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Streams Chart */}
          <div>
            <h4 className="font-semibold mb-4">Revenue Mix by Stream</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueStreams}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1500}
                >
                  {revenueStreams.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* How Creators Benefit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">How Creators Benefit</CardTitle>
          <CardDescription>
            Why Seeksy creates more value for creators than traditional platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-500/5 to-purple-600/5 rounded-lg border border-purple-200/20">
              <Zap className="h-6 w-6 text-purple-600 mb-2" />
              <h4 className="font-semibold mb-2">More Revenue Streams</h4>
              <p className="text-sm text-muted-foreground">
                Earn from subscriptions, ad-share, event tickets, bookings, and premium content—all in one place
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-pink-500/5 to-pink-600/5 rounded-lg border border-pink-200/20">
              <Users className="h-6 w-6 text-pink-600 mb-2" />
              <h4 className="font-semibold mb-2">Deeper Engagement</h4>
              <p className="text-sm text-muted-foreground">
                Connect directly with your audience through live meetings, events, workshops, and interactive sessions
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-lg border border-blue-200/20">
              <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-semibold mb-2">Unified Platform</h4>
              <p className="text-sm text-muted-foreground">
                Replace 6-8 tools with one seamless platform—save time, reduce costs, increase efficiency
              </p>
            </div>
          </div>

          {/* Value Chain Comparison */}
          <div>
            <h4 className="font-semibold mb-4">Seeksy vs Traditional Platforms: Value Delivered</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valueChain}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="stage" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="seeksy" fill="hsl(280, 85%, 55%)" name="Seeksy" radius={[8, 8, 0, 0]} animationDuration={1500} />
                <Bar dataKey="traditional" fill="hsl(var(--muted))" name="Traditional Platforms" radius={[8, 8, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monetization Flow */}
          <div>
            <h4 className="font-semibold mb-4">Creator Earnings Growth Over Time (Average Creator)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monetizationFlow}>
                <defs>
                  <linearGradient id="colorCreator" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(150, 70%, 45%)" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="hsl(150, 70%, 45%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPlatform" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(200, 80%, 50%)" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="hsl(200, 80%, 50%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="creator" 
                  stroke="hsl(150, 70%, 45%)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCreator)"
                  name="Creator Earnings ($)"
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="platform" 
                  stroke="hsl(200, 80%, 50%)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPlatform)"
                  name="Platform Revenue ($)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">
              As creators grow their audience and earnings, Seeksy scales proportionally—aligning our success with creator success
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className={`${theme === 'dark' ? 'bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border-blue-700' : 'bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-200/20'}`}>
        <CardHeader>
          <CardTitle className={`text-2xl ${theme === 'dark' ? 'text-blue-100' : ''}`}>Summary: The Opportunity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-blue-200/90' : ''}`}>
            Seeksy is positioned at the intersection of three massive, high-growth markets: the creator economy 
            ($350B+ by 2027), podcasting ($5.2B+ by 2026), and live engagement tools (145% YoY growth). We solve 
            critical pain points for creators who are frustrated by platform fragmentation, limited monetization 
            options, and lack of direct audience engagement capabilities.
          </p>
          <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-blue-200/90' : ''}`}>
            Our business model is <strong>diversified, scalable, and aligned with creator success</strong>. We earn 
            from subscriptions, ad-share, event fees, bookings, and premium tools—creating multiple revenue streams 
            that grow as our creators grow. Unlike ad-only platforms, Seeksy enables creators to build sustainable, 
            predictable income through direct relationships with their audiences.
          </p>
          <p className={`text-base leading-relaxed font-semibold ${theme === 'dark' ? 'text-blue-100' : ''}`}>
            As the creator economy continues to shift toward private communities, live interactions, and direct 
            monetization, Seeksy is uniquely positioned to become the go-to platform for creators who want to own 
            their audience relationships and maximize their earning potential.
          </p>
        </CardContent>
      </Card>

      {/* Competitive Pricing Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Seeksy vs Competitors: Pricing & Value
          </CardTitle>
          <CardDescription>
            How Seeksy compares to leading video and podcasting platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-3 font-semibold">Platform</th>
                  <th className="text-center p-3 font-semibold">Basic</th>
                  <th className="text-center p-3 font-semibold">Pro</th>
                  <th className="text-center p-3 font-semibold">Enterprise</th>
                  <th className="text-left p-3 font-semibold">Core Features</th>
                </tr>
              </thead>
              <tbody>
                {competitorPricing.map((competitor, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b border-border ${
                      competitor.name === "Seeksy" ? "bg-primary/5 font-semibold" : ""
                    }`}
                  >
                    <td className="p-3">
                      {competitor.name}
                      {competitor.name === "Seeksy" && (
                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="text-center p-3">${competitor.basic}/mo</td>
                    <td className="text-center p-3">${competitor.pro}/mo</td>
                    <td className="text-center p-3">${competitor.enterprise}/mo</td>
                    <td className="p-3 text-sm text-muted-foreground">{competitor.features}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-green-500/5 rounded-lg border border-green-200/20">
              <h4 className="font-semibold text-base mb-2 flex items-center gap-2 text-green-600">
                ✓ Seeksy Advantages
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• All-in-one platform (podcasting + meetings + events)</li>
                <li>• Competitive pricing across all tiers</li>
                <li>• AI-powered post-production & editing</li>
                <li>• Built-in booking & scheduling tools</li>
                <li>• Unified analytics dashboard</li>
                <li>• Direct monetization with multiple revenue streams</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-200/20">
              <h4 className="font-semibold text-base mb-2 flex items-center gap-2 text-orange-600">
                ⚠ Competitor Limitations
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Riverside: Recording only, no live engagement tools</li>
                <li>• Restream: Streaming focus, no podcast hosting</li>
                <li>• StreamYard: Limited analytics & post-production</li>
                <li>• Descript: Editing only, no live or event features</li>
                <li>• All require 3rd party tools for full workflow</li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-border">
            <strong>Value Proposition:</strong> Seeksy provides enterprise-grade features at competitive pricing 
            while eliminating the need for 6-8 separate tools. Creators save $100-300/month in tool subscriptions 
            while gaining unified analytics, AI editing, and direct monetization capabilities that competitors don't offer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
