import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, TrendingUp, Users, DollarSign, BarChart3, 
  Zap, Brain, Radar, Calculator, CheckCircle2, AlertTriangle,
  ArrowUp, ArrowDown, Minus, FileText, RefreshCw, Sparkles,
  ChevronRight, Clock, Globe
} from "lucide-react";
import { motion } from "framer-motion";

interface MetricCard {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'flat';
  insight: string;
}

interface MarketSignal {
  id: string;
  type: string;
  title: string;
  summary: string;
  urgency: string;
  relevance: number;
}

interface ActionItem {
  id: string;
  title: string;
  priority: string;
  category: string;
  status: string;
  impact: string;
}

export default function CMOCommandCenter() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Demo metrics data
  const metrics: MetricCard[] = [
    { label: "CAC Overall", value: "$42.50", change: -8.2, trend: 'down', insight: "Down from $46.30 last month due to improved organic acquisition" },
    { label: "LTV Overall", value: "$385", change: 12.5, trend: 'up', insight: "Increased retention in premium tier driving higher LTV" },
    { label: "CAC/LTV Ratio", value: "9.1x", change: 15.2, trend: 'up', insight: "Healthy ratio above 3x threshold indicates scalable unit economics" },
    { label: "Monthly Burn", value: "$28.4K", change: 2.1, trend: 'up', insight: "Slight increase due to marketing campaign spend" },
    { label: "Active Creators", value: "1,847", change: 18.3, trend: 'up', insight: "Strong growth driven by TikTok migration campaign" },
    { label: "Churn Rate", value: "4.2%", change: -12.0, trend: 'down', insight: "Below industry average of 5.6%, retention initiatives working" },
  ];

  // Demo market signals
  const marketSignals: MarketSignal[] = [
    { id: "1", type: "competitor", title: "Riverside.fm raises Series B", summary: "Competitor raised $50M, likely to increase marketing spend", urgency: "high", relevance: 85 },
    { id: "2", type: "trend", title: "AI editing adoption accelerating", summary: "70% of creators now expect AI features as standard", urgency: "medium", relevance: 92 },
    { id: "3", type: "policy", title: "TikTok uncertainty continues", summary: "Creators actively seeking platform diversification", urgency: "high", relevance: 88 },
    { id: "4", type: "cost", title: "OpenAI API pricing update", summary: "GPT-4 Turbo pricing reduced 3x, margin opportunity", urgency: "low", relevance: 75 },
  ];

  // Demo action items
  const actionItems: ActionItem[] = [
    { id: "1", title: "Launch TikTok migration campaign", priority: "high", category: "growth", status: "in_progress", impact: "+15% creator acquisition" },
    { id: "2", title: "Optimize onboarding flow (conversion +8%)", priority: "high", category: "retention", status: "pending", impact: "+$12K MRR" },
    { id: "3", title: "Prepare Q1 investor update", priority: "medium", category: "reporting", status: "pending", impact: "Board visibility" },
    { id: "4", title: "Review CPM rates vs. market", priority: "medium", category: "revenue", status: "completed", impact: "+5% ad revenue" },
  ];

  const ceoIntentAlignment = 78; // Demo alignment score

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800"
    };
    return colors[urgency] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-500 text-white",
      medium: "bg-yellow-500 text-black",
      low: "bg-green-500 text-white"
    };
    return colors[priority] || "bg-gray-500 text-white";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            CMO Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Marketing intelligence, analytics, and strategic decision support
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            CEO Brief
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* CEO Intent Alignment */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">CEO Strategic Intent Alignment</p>
                <p className="text-sm text-muted-foreground">Current initiatives aligned with mission objectives</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Progress value={ceoIntentAlignment} className="w-48" />
              <span className="text-2xl font-bold text-primary">{ceoIntentAlignment}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="signals">Market Signals</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="simulator">What-If</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics.map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{metric.label}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className={`text-xs ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </p>
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-muted-foreground">{metric.insight}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  CAC by Channel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { channel: "Organic Search", cac: 22, percentage: 28 },
                    { channel: "Paid Social", cac: 58, percentage: 35 },
                    { channel: "Content Marketing", cac: 31, percentage: 20 },
                    { channel: "Referrals", cac: 15, percentage: 12 },
                    { channel: "Events", cac: 85, percentage: 5 },
                  ].map(item => (
                    <div key={item.channel} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.channel}</span>
                        <span className="font-medium">${item.cac}</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Creator Onboarding Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { stage: "Visitors", count: 12500, conversion: 100 },
                    { stage: "Sign Ups", count: 3200, conversion: 25.6 },
                    { stage: "Onboarding Started", count: 2100, conversion: 65.6 },
                    { stage: "Onboarding Complete", count: 1680, conversion: 80.0 },
                    { stage: "First Content", count: 1340, conversion: 79.8 },
                    { stage: "Monetization Active", count: 420, conversion: 31.3 },
                  ].map((item, idx) => (
                    <div key={item.stage} className="flex items-center gap-4">
                      <div className="w-32 text-sm truncate">{item.stage}</div>
                      <div className="flex-1">
                        <Progress value={(item.count / 12500) * 100} className="h-3" />
                      </div>
                      <div className="w-20 text-right">
                        <span className="font-medium">{item.count.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground ml-1">({item.conversion}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI Strategic Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <p className="font-medium text-sm mb-2">Growth Opportunity</p>
                  <p className="text-sm text-muted-foreground">
                    TikTok creator migration could add 500+ users in Q1 if campaign launches by Jan 15.
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-amber-600">
                    View Details →
                  </Button>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <p className="font-medium text-sm mb-2">Risk Alert</p>
                  <p className="text-sm text-muted-foreground">
                    Paid social CAC trending up 12% MoM. Consider reallocating to organic channels.
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-amber-600">
                    Simulate Impact →
                  </Button>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <p className="font-medium text-sm mb-2">Quick Win</p>
                  <p className="text-sm text-muted-foreground">
                    Email onboarding sequence optimization could improve conversion by 8% with minimal effort.
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-amber-600">
                    Start Initiative →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Signals Tab */}
        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radar className="h-5 w-5" />
                Market Signals Radar
              </CardTitle>
              <CardDescription>
                AI-powered monitoring of competitors, trends, policies, and costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketSignals.map(signal => (
                  <div key={signal.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">{signal.type}</Badge>
                          <Badge className={getUrgencyColor(signal.urgency)}>{signal.urgency}</Badge>
                          <span className="text-xs text-muted-foreground">Relevance: {signal.relevance}%</span>
                        </div>
                        <h4 className="font-semibold">{signal.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{signal.summary}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Campaign Intelligence Hub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Campaign Tracking Coming Soon</p>
                <p className="text-sm">ROI models, forecasting, and multi-channel reporting</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* What-If Simulator Tab */}
        <TabsContent value="simulator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Decision Simulator (What-If Engine)
              </CardTitle>
              <CardDescription>
                Model the impact of strategic decisions on key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Quick Scenarios</h4>
                  {[
                    { scenario: "Creator onboarding improves by 20%", revenue: "+$18K MRR", risk: "Low" },
                    { scenario: "TikTok CPM drops 30%", revenue: "-$8K MRR", risk: "Medium" },
                    { scenario: "AWS GPU costs rise 25%", revenue: "-$4K margin", risk: "High" },
                    { scenario: "Referral program 2x effectiveness", revenue: "+$12K MRR", risk: "Low" },
                  ].map(item => (
                    <div key={item.scenario} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                      <p className="font-medium text-sm">{item.scenario}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-sm font-medium ${item.revenue.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {item.revenue}
                        </span>
                        <Badge variant="outline" className="text-xs">Risk: {item.risk}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-4">Custom Simulation</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Build custom what-if scenarios with multiple variables
                  </p>
                  <Button>
                    <Calculator className="h-4 w-4 mr-2" />
                    Create Simulation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Prioritized Action Items
              </CardTitle>
              <CardDescription>
                AI-generated weekly recommendations based on metrics and signals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actionItems.map(action => (
                  <div key={action.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(action.priority)}>{action.priority}</Badge>
                          <Badge variant="outline">{action.category}</Badge>
                          <Badge variant={action.status === 'completed' ? 'default' : 'secondary'}>
                            {action.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{action.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Expected impact: <span className="font-medium text-green-600">{action.impact}</span>
                        </p>
                      </div>
                      {action.status !== 'completed' && (
                        <Button variant="outline" size="sm">
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}