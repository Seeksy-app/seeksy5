import { useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, TrendingUp, Users, Play, Clock, 
  ArrowUpRight, ArrowDownRight, Sparkles, Plus,
  ExternalLink, MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContextColumns } from "@/components/workspace/ContextColumns";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const STATS = [
  { label: "Total Listens", value: "248,392", change: "+12.4%", up: true, icon: Play },
  { label: "Active Subscribers", value: "12,847", change: "+8.2%", up: true, icon: Users },
  { label: "Avg. Listen Time", value: "24:32", change: "-2.1%", up: false, icon: Clock },
  { label: "Revenue", value: "$8,429", change: "+22.7%", up: true, icon: TrendingUp },
];

const RECENT_EPISODES = [
  { id: "ep-1", title: "The Future of AI in Podcasting", plays: 4823, published: "2 days ago" },
  { id: "ep-2", title: "Interview with Tech Leaders", plays: 3291, published: "5 days ago" },
  { id: "ep-3", title: "Building Your Audience", plays: 2847, published: "1 week ago" },
];

const QUICK_ACTIONS = [
  { label: "New Episode", icon: Plus },
  { label: "View Analytics", icon: BarChart3 },
  { label: "AI Suggestions", icon: Sparkles },
];

export function WorkspaceDashboard() {
  const { openDetailPanel, openAnalyticsPanel } = useContextColumns();
  const { addRecentAction, toggleAiColumn } = useWorkspaceStore();

  const handleEpisodeClick = (episode: typeof RECENT_EPISODES[0]) => {
    openDetailPanel(`Episode: ${episode.title}`, 'episode', episode.id, episode);
    addRecentAction(`Opened episode: ${episode.title}`);
  };

  const handleViewAnalytics = () => {
    openAnalyticsPanel("Podcast Analytics", { period: "30d" });
    addRecentAction("Opened analytics panel");
  };

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button 
              key={action.label} 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (action.label === "AI Suggestions") toggleAiColumn();
                if (action.label === "View Analytics") handleViewAnalytics();
                addRecentAction(`Clicked: ${action.label}`);
              }}
            >
              <action.icon className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewAnalytics}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {stat.up ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span className={stat.up ? "text-green-500" : "text-red-500"}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Episodes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Episodes</CardTitle>
              <CardDescription>Your latest published content</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RECENT_EPISODES.map((episode, index) => (
                <motion.div
                  key={episode.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleEpisodeClick(episode)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Play className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {episode.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {episode.plays.toLocaleString()} plays • {episode.published}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Personalized recommendations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-background/80 border">
              <p className="text-sm font-medium mb-1">🎯 Optimal posting time</p>
              <p className="text-xs text-muted-foreground">
                Your audience is most active on Tuesdays at 9 AM EST
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background/80 border">
              <p className="text-sm font-medium mb-1">📈 Growing topic</p>
              <p className="text-xs text-muted-foreground">
                Episodes about AI are getting 34% more engagement
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background/80 border">
              <p className="text-sm font-medium mb-1">💡 Suggestion</p>
              <p className="text-xs text-muted-foreground">
                Consider a collaboration with similar creators in your niche
              </p>
            </div>
            <Button 
              className="w-full" 
              variant="secondary"
              onClick={() => {
                toggleAiColumn();
                addRecentAction("Opened AI for more insights");
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get More Insights
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
