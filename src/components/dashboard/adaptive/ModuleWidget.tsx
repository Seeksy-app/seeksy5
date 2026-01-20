import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Instagram, Mic, Video, Upload, Users, Mail, Calendar, 
  BarChart3, FileText, Zap, Scissors, DollarSign, Globe,
  ArrowRight, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/config/dashboardConfig";

const widgetIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "social-analytics": Instagram,
  "brand-deals": Sparkles,
  "media-upload": Upload,
  "studio-record": Mic,
  "audience-insights": Users,
  "revenue-tracking": DollarSign,
  "episode-library": Mic,
  "quick-record": Video,
  "clip-generator": Scissors,
  "sponsorships": DollarSign,
  "campaign-performance": Mail,
  "crm-overview": Users,
  "segments": BarChart3,
  "campaign-schedule": Calendar,
  "events-appointments": Calendar,
  "form-submissions": FileText,
  "automations": Zap,
  "upcoming-events": Calendar,
  "ticket-sales": Users,
  "promo-performance": Mail,
  "creator-profiles": Users,
  "proposal-pipeline": FileText,
  "team-tasks": FileText,
  "collab-notes": FileText,
};

const widgetRoutes: Record<string, string> = {
  "social-analytics": "/social-analytics",
  "brand-deals": "/monetization",
  "media-upload": "/media",
  "studio-record": "/studio",
  "audience-insights": "/social-analytics",
  "revenue-tracking": "/monetization",
  "episode-library": "/podcasts",
  "quick-record": "/studio",
  "clip-generator": "/clips",
  "sponsorships": "/monetization",
  "campaign-performance": "/campaigns",
  "crm-overview": "/contacts",
  "segments": "/segments",
  "campaign-schedule": "/campaigns",
  "events-appointments": "/events",
  "form-submissions": "/forms",
  "automations": "/automations",
  "upcoming-events": "/events",
  "ticket-sales": "/events",
  "promo-performance": "/campaigns",
  "creator-profiles": "/team",
  "proposal-pipeline": "/proposals",
  "team-tasks": "/tasks",
  "collab-notes": "/team",
};

interface ModuleWidgetProps {
  widget: WidgetConfig;
  index: number;
  children?: React.ReactNode;
}

export function ModuleWidget({ widget, index, children }: ModuleWidgetProps) {
  const navigate = useNavigate();
  const Icon = widgetIcons[widget.id] || BarChart3;
  const route = widgetRoutes[widget.id] || "/dashboard";
  
  const sizeClasses = {
    small: "col-span-1",
    medium: "col-span-1 md:col-span-2",
    large: "col-span-1 md:col-span-2 lg:col-span-3",
  };

  const isComingSoon = widget.id === "brand-deals" || widget.id === "sponsorships";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={sizeClasses[widget.size]}
    >
      <Card className={cn(
        "h-full hover:border-primary/30 transition-all cursor-pointer group",
        isComingSoon && "opacity-75"
      )}
        onClick={() => !isComingSoon && navigate(route)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {widget.title}
                  {isComingSoon && (
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{widget.description}</p>
              </div>
            </div>
            {!isComingSoon && (
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </CardHeader>
        {children && (
          <CardContent className="pt-0">
            {children}
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
