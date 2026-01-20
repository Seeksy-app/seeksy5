import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, Scissors, Mic, Rss, Radio, Users, 
  MessageSquare, Calendar, Link2, DollarSign,
  BarChart3, Shield, Sparkles, Trophy, Ticket
} from "lucide-react";
import { motion } from "framer-motion";
import { PersonaType } from "@/config/personaConfig";

interface WidgetConfig {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  color: string;
  bgColor: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
}

// All available widgets mapped to module IDs from onboarding
const ALL_WIDGETS: WidgetConfig[] = [
  { id: "media", moduleId: "media-studio", title: "Media AI Studio", description: "Record & edit video with AI", icon: Video, path: "/studio", color: "from-blue-500 to-cyan-500", bgColor: "hover:bg-[hsl(217,100%,97%)]", iconBg: "bg-[hsl(217,90%,95%)]", iconColor: "text-[hsl(217,90%,50%)]" },
  { id: "clips", moduleId: "ai-clips", title: "AI Clips", description: "Auto-generate viral clips", icon: Scissors, path: "/clips-studio", color: "from-purple-500 to-pink-500", bgColor: "hover:bg-[hsl(270,80%,97%)]", iconBg: "bg-[hsl(270,80%,95%)]", iconColor: "text-[hsl(270,70%,50%)]", badge: "AI" },
  { id: "podcast", moduleId: "podcast-hosting", title: "Podcast & RSS", description: "Distribute your podcast", icon: Rss, path: "/podcasts", color: "from-amber-500 to-orange-500", bgColor: "hover:bg-[hsl(25,100%,97%)]", iconBg: "bg-[hsl(25,90%,95%)]", iconColor: "text-[hsl(25,90%,50%)]" },
  { id: "mypage", moduleId: "my-page", title: "My Page", description: "Your link-in-bio", icon: Link2, path: "/profile/edit", color: "from-violet-500 to-purple-500", bgColor: "hover:bg-[hsl(270,80%,97%)]", iconBg: "bg-[hsl(270,70%,95%)]", iconColor: "text-[hsl(270,70%,50%)]" },
  { id: "meetings", moduleId: "meetings", title: "Meetings", description: "Book calls & appointments", icon: Calendar, path: "/meetings", color: "from-emerald-500 to-teal-500", bgColor: "hover:bg-[hsl(199,90%,97%)]", iconBg: "bg-[hsl(199,90%,95%)]", iconColor: "text-[hsl(199,80%,45%)]" },
  { id: "events", moduleId: "events", title: "Events & Ticketing", description: "Sell tickets to events", icon: Ticket, path: "/events", color: "from-rose-500 to-pink-500", bgColor: "hover:bg-[hsl(330,80%,97%)]", iconBg: "bg-[hsl(330,80%,95%)]", iconColor: "text-[hsl(330,70%,50%)]" },
  { id: "crm", moduleId: "crm", title: "CRM Lite", description: "Manage contacts & sponsors", icon: Users, path: "/contacts", color: "from-sky-500 to-blue-500", bgColor: "hover:bg-[hsl(199,90%,97%)]", iconBg: "bg-[hsl(199,90%,95%)]", iconColor: "text-[hsl(199,80%,45%)]" },
  { id: "communications", moduleId: "communications", title: "Email & SMS", description: "Reach your audience", icon: MessageSquare, path: "/communications", color: "from-indigo-500 to-violet-500", bgColor: "hover:bg-[hsl(240,80%,97%)]", iconBg: "bg-[hsl(240,80%,95%)]", iconColor: "text-[hsl(240,70%,50%)]" },
  { id: "monetization", moduleId: "monetization", title: "Monetization", description: "Track revenue & deals", icon: DollarSign, path: "/monetization", color: "from-amber-500 to-yellow-500", bgColor: "hover:bg-[hsl(45,100%,97%)]", iconBg: "bg-[hsl(45,90%,92%)]", iconColor: "text-[hsl(45,90%,40%)]" },
  { id: "analytics", moduleId: "analytics", title: "Analytics", description: "Track your growth", icon: BarChart3, path: "/social-analytics", color: "from-green-500 to-emerald-500", bgColor: "hover:bg-[hsl(142,70%,97%)]", iconBg: "bg-[hsl(142,70%,95%)]", iconColor: "text-[hsl(142,70%,40%)]" },
  { id: "awards", moduleId: "awards", title: "Awards", description: "Run contests & voting", icon: Trophy, path: "/awards", color: "from-orange-500 to-red-500", bgColor: "hover:bg-[hsl(25,100%,97%)]", iconBg: "bg-[hsl(25,90%,95%)]", iconColor: "text-[hsl(25,90%,50%)]" },
  { id: "identity", moduleId: "identity", title: "Identity", description: "Voice & face verification", icon: Shield, path: "/identity", color: "from-slate-500 to-gray-600", bgColor: "hover:bg-muted/50", iconBg: "bg-muted", iconColor: "text-muted-foreground" },
  { id: "social", moduleId: "social-hub", title: "Social Hub", description: "Connect & sync accounts", icon: Link2, path: "/integrations", color: "from-pink-500 to-rose-500", bgColor: "hover:bg-[hsl(330,80%,97%)]", iconBg: "bg-[hsl(330,80%,95%)]", iconColor: "text-[hsl(330,70%,50%)]" },
];

// Default widgets by role (fallback when no modules selected)
const defaultWidgetsByRole: Record<string, string[]> = {
  creator: ["media-studio", "ai-clips", "my-page", "analytics"],
  influencer: ["my-page", "ai-clips", "monetization", "analytics"],
  podcaster: ["media-studio", "podcast-hosting", "ai-clips", "analytics"],
  speaker: ["events", "meetings", "my-page", "crm"],
  eventHost: ["events", "meetings", "crm", "communications"],
  entrepreneur: ["crm", "communications", "meetings", "analytics"],
  brand: ["crm", "communications", "meetings", "analytics"],
  agency: ["crm", "analytics", "communications", "monetization"],
  default: ["media-studio", "my-page", "ai-clips", "identity"],
};

interface RoleBasedWidgetsProps {
  personaType?: PersonaType | null;
  selectedModules?: string[];
  showDemoWidgets?: boolean;
}

export function RoleBasedWidgets({ personaType, selectedModules, showDemoWidgets = false }: RoleBasedWidgetsProps) {
  const navigate = useNavigate();
  
  // Determine which modules to show
  let moduleIds: string[] = [];
  
  if (selectedModules && selectedModules.length > 0) {
    moduleIds = selectedModules;
  } else {
    const roleKey = personaType || "default";
    moduleIds = defaultWidgetsByRole[roleKey] || defaultWidgetsByRole.default;
  }
  
  // Get widgets that match the selected module IDs (max 4 for the grid)
  const widgets = moduleIds
    .map(moduleId => ALL_WIDGETS.find(w => w.moduleId === moduleId))
    .filter((w): w is WidgetConfig => w !== undefined)
    .slice(0, 4);
  
  // If we don't have 4 widgets, fill with defaults
  if (widgets.length < 4) {
    const missingCount = 4 - widgets.length;
    const existingIds = widgets.map(w => w.moduleId);
    const defaults = ALL_WIDGETS.filter(w => !existingIds.includes(w.moduleId)).slice(0, missingCount);
    widgets.push(...defaults);
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {widgets.map((widget, index) => (
        <motion.div
          key={widget.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className={`group cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 border-border/50 hover:border-border overflow-hidden h-full ${widget.bgColor}`}
            onClick={() => navigate(widget.path)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${widget.iconBg}`}>
                  <widget.icon className={`h-5 w-5 ${widget.iconColor}`} />
                </div>
                {widget.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                    {widget.badge}
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-sm mb-1">{widget.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{widget.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {showDemoWidgets && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-dashed border-2 border-border/30 bg-card/30 h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <Badge variant="outline" className="text-[10px] mb-2">Example</Badge>
              <p className="text-xs text-muted-foreground">More widgets available in settings</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}