import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, ArrowRight, Users, TrendingUp, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type LeadMagnetType = "creator" | "brand" | "event";

interface LeadMagnetCTABlockProps {
  type: LeadMagnetType;
  variant?: "card" | "inline" | "banner";
  className?: string;
}

const LEAD_MAGNETS = {
  creator: {
    title: "Creator Growth Blueprint",
    subtitle: "Step-by-step framework for creators",
    cta: "Download Free Blueprint",
    icon: Users,
    gradient: "from-[#053877] to-[#2C6BED]",
    href: "/blueprint"
  },
  brand: {
    title: "Brand ROI Playbook",
    subtitle: "Data-driven guide for tracking ROI",
    cta: "Get the ROI Playbook",
    icon: TrendingUp,
    gradient: "from-purple-600 to-purple-400",
    href: "/roi-playbook"
  },
  event: {
    title: "Event Growth Kit",
    subtitle: "Toolkit for event planners",
    cta: "Download Event Kit",
    icon: Calendar,
    gradient: "from-green-600 to-emerald-400",
    href: "/event-growth-kit"
  }
};

export function LeadMagnetCTABlock({ 
  type, 
  variant = "card",
  className 
}: LeadMagnetCTABlockProps) {
  const navigate = useNavigate();
  const magnet = LEAD_MAGNETS[type];
  const Icon = magnet.icon;

  if (variant === "inline") {
    return (
      <button
        onClick={() => navigate(magnet.href)}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all w-full text-left group",
          className
        )}
      >
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${magnet.gradient} flex items-center justify-center shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{magnet.title}</p>
          <p className="text-xs text-muted-foreground truncate">{magnet.subtitle}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>
    );
  }

  if (variant === "banner") {
    return (
      <div 
        className={cn(
          `bg-gradient-to-r ${magnet.gradient} rounded-xl p-4 text-white`,
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8" />
            <div>
              <p className="font-semibold">{magnet.title}</p>
              <p className="text-sm text-white/80">{magnet.subtitle}</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => navigate(magnet.href)}
            className="shrink-0"
          >
            <Download className="h-4 w-4 mr-2" />
            {magnet.cta}
          </Button>
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className={`h-2 bg-gradient-to-r ${magnet.gradient}`} />
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${magnet.gradient} flex items-center justify-center shrink-0`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{magnet.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{magnet.subtitle}</p>
            <Button 
              size="sm"
              onClick={() => navigate(magnet.href)}
            >
              <Download className="h-4 w-4 mr-2" />
              {magnet.cta}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick access component for dashboards
export function LeadMagnetQuickLinks() {
  return (
    <div className="space-y-2">
      <LeadMagnetCTABlock type="creator" variant="inline" />
      <LeadMagnetCTABlock type="brand" variant="inline" />
      <LeadMagnetCTABlock type="event" variant="inline" />
    </div>
  );
}
