import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, Mic, Video, Megaphone, 
  Film, Radio, DollarSign, ArrowRight,
  TrendingUp, Users, Target, Zap
} from "lucide-react";
import { motion } from "framer-motion";

const opportunities = [
  {
    id: "host-read",
    title: "Host-Read Opportunities",
    description: "Authentic ad reads in your own voice. Premium rates for verified voices.",
    icon: Mic,
    color: "bg-blue-500",
    earnings: "$15-50 CPM",
    available: 12,
    path: "/studio/advertising/host-read"
  },
  {
    id: "video-ads",
    title: "Video Ad Opportunities",
    description: "Pre-roll, mid-roll, and post-roll video ad placements.",
    icon: Video,
    color: "bg-red-500",
    earnings: "$20-75 CPM",
    available: 8,
    path: "/studio/advertising/video-ads"
  },
  {
    id: "shoutouts",
    title: "Shout-outs",
    description: "Quick mentions and endorsements for brands.",
    icon: Megaphone,
    color: "bg-amber-500",
    earnings: "$50-200 flat",
    available: 24,
    path: "/studio/advertising/shoutouts"
  },
  {
    id: "sponsored-clips",
    title: "Sponsored Clips",
    description: "Create short-form branded content for social platforms.",
    icon: Film,
    color: "bg-purple-500",
    earnings: "$100-500 per clip",
    available: 6,
    path: "/studio/advertising/sponsored"
  },
  {
    id: "dai",
    title: "Dynamic Ad Insertion",
    description: "Automated ad placement with real-time targeting.",
    icon: Radio,
    color: "bg-green-500",
    earnings: "Variable CPM",
    available: null,
    isPro: true,
    path: "/studio/advertising/dai"
  },
];

const stats = [
  { label: "Potential Monthly Earnings", value: "$2,400", icon: DollarSign, color: "text-green-500" },
  { label: "Active Campaigns", value: "48", icon: Target, color: "text-blue-500" },
  { label: "Brands Looking", value: "156", icon: Users, color: "text-purple-500" },
  { label: "Avg. Response Time", value: "2h", icon: Zap, color: "text-amber-500" },
];

export default function StudioAdvertising() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate("/studio")} className="hover:text-foreground transition-colors">
            Studio Hub
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Advertising</span>
        </nav>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Advertising</h1>
            <p className="text-muted-foreground mt-1">Monetize your content with brand partnerships</p>
          </div>
          <Button onClick={() => navigate("/monetization")} variant="outline">
            <DollarSign className="w-4 h-4 mr-2" /> View Earnings
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Opportunities */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Available Opportunities</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {opportunities.map((opp, index) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <Card 
                  className="bg-card border-border hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group h-full"
                  onClick={() => navigate(opp.path)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${opp.color} flex items-center justify-center shrink-0`}>
                        <opp.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{opp.title}</h3>
                          {opp.isPro && (
                            <Badge variant="secondary" className="text-[10px]">Pro</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{opp.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                              <span className="text-xs font-medium text-green-600">{opp.earnings}</span>
                            </div>
                            {opp.available && (
                              <span className="text-xs text-muted-foreground">
                                {opp.available} available
                              </span>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Connect Tools CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Connect Your Advertiser Tools</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Link your ad networks and brand partnerships for seamless monetization
                  </p>
                </div>
                <Button onClick={() => navigate("/monetization")} className="shrink-0">
                  Connect Tools <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
