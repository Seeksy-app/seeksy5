// Dashboard Preview Component for Onboarding
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Mic, Upload, UserPlus, Link, BarChart, Layout, Calendar, 
  Mail, Megaphone, FileText, Play, TrendingUp, Users, DollarSign,
  Radio, Scissors, Zap, Globe, Clock, CheckCircle2
} from "lucide-react";
import { DashboardPreviewConfig } from "@/lib/onboardingRecommendations";

interface DashboardPreviewProps {
  config: DashboardPreviewConfig;
  activatedModules: string[];
}

const iconMap: Record<string, React.ElementType> = {
  Mic, Upload, UserPlus, Link, BarChart, Layout, Calendar, 
  Mail, Megaphone, FileText, Play, TrendingUp, Users, DollarSign,
  Radio, Scissors, Zap, Globe, Clock
};

// Mock KPI data for preview
const mockKPIs = {
  podcaster: [
    { label: "Downloads", value: "12,450", trend: "+18%" },
    { label: "Avg. per Episode", value: "890", trend: "+5%" },
    { label: "Listeners", value: "3,200", trend: "+12%" },
    { label: "Retention", value: "78%", trend: "+3%" },
  ],
  creator: [
    { label: "Followers", value: "45,200", trend: "+8%" },
    { label: "Engagement", value: "4.2%", trend: "+0.3%" },
    { label: "Reach (30d)", value: "125K", trend: "+22%" },
    { label: "Est. Value", value: "$2,400", trend: "+15%" },
  ],
  event_host: [
    { label: "Registrations", value: "284", trend: "+25%" },
    { label: "Attendance", value: "92%", trend: "+4%" },
    { label: "Events", value: "12", trend: "+2" },
  ],
  business: [
    { label: "Contacts", value: "1,240", trend: "+15%" },
    { label: "Engagement", value: "28%", trend: "+5%" },
    { label: "Conversions", value: "89", trend: "+12%" },
  ],
  agency: [
    { label: "Creators", value: "24", trend: "+3" },
    { label: "Total Reach", value: "2.4M", trend: "+18%" },
    { label: "Active Deals", value: "8", trend: "+2" },
  ],
};

export function DashboardPreview({ config, activatedModules }: DashboardPreviewProps) {
  const dashboardType = config.title.toLowerCase().includes("podcaster") ? "podcaster"
    : config.title.toLowerCase().includes("creator") ? "creator"
    : config.title.toLowerCase().includes("event") ? "event_host"
    : config.title.toLowerCase().includes("agency") ? "agency"
    : "business";
  
  const kpis = mockKPIs[dashboardType as keyof typeof mockKPIs] || mockKPIs.creator;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-6"
      >
        <h2 className="text-xl font-bold mb-1">Welcome to your {config.title}!</h2>
        <p className="text-muted-foreground text-sm">
          Here's a preview of what your personalized dashboard will look like.
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {config.quickActions.map((action, i) => {
            const Icon = iconMap[action.icon] || Play;
            return (
              <Button key={i} variant="outline" size="sm" className="gap-2">
                <Icon className="h-4 w-4" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* KPIs Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold mt-1">{kpi.value}</p>
                <Badge variant="secondary" className="mt-1 text-xs bg-emerald-500/10 text-emerald-600 border-0">
                  {kpi.trend}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Module Panels */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Activated Modules</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {config.panels.map((panel, i) => (
            <motion.div
              key={panel}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{panel}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to explore
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Preview Badge */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
          This is a preview — real data will appear after setup
        </Badge>
      </div>
    </div>
  );
}
