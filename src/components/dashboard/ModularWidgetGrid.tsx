import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mic, BarChart3, FolderOpen, Users, Mail, Calendar, 
  DollarSign, Shield, Scissors, TrendingUp, Video, Layout,
  ArrowRight, Play, Plus, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { WidgetDefinition } from "./WidgetModal";

interface ModularWidgetGridProps {
  widgets: WidgetDefinition[];
  stats?: Record<string, any>;
}

// Small elegant widget tiles
function WidgetTile({ 
  widget, 
  children,
  onClick 
}: { 
  widget: WidgetDefinition; 
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const Icon = widget.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-md",
          "border-border/50 hover:border-border"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                {widget.name}
              </h4>
              {children || (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {widget.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Studio Quick Launch
function StudioWidget({ widget }: { widget: WidgetDefinition }) {
  const navigate = useNavigate();
  
  return (
    <WidgetTile widget={widget} onClick={() => navigate("/studio")}>
      <div className="flex items-center gap-2 mt-2">
        <Button size="sm" className="h-7 text-xs gap-1.5">
          <Play className="h-3 w-3" />
          Record Now
        </Button>
      </div>
    </WidgetTile>
  );
}

// Recent Clips Widget
function RecentClipsWidget({ widget, count = 0 }: { widget: WidgetDefinition; count?: number }) {
  const navigate = useNavigate();
  
  return (
    <WidgetTile widget={widget} onClick={() => navigate("/clips")}>
      <p className="text-2xl font-semibold text-foreground mt-1">{count}</p>
      <p className="text-xs text-muted-foreground">clips created</p>
    </WidgetTile>
  );
}

// Media Library Widget  
function MediaLibraryWidget({ widget, count = 0 }: { widget: WidgetDefinition; count?: number }) {
  const navigate = useNavigate();
  
  return (
    <WidgetTile widget={widget} onClick={() => navigate("/media/library")}>
      <p className="text-2xl font-semibold text-foreground mt-1">{count}</p>
      <p className="text-xs text-muted-foreground">files uploaded</p>
    </WidgetTile>
  );
}

// Podcasts Widget
function PodcastsWidget({ widget, episodes = 0 }: { widget: WidgetDefinition; episodes?: number }) {
  const navigate = useNavigate();
  
  return (
    <WidgetTile widget={widget} onClick={() => navigate("/podcasts")}>
      <p className="text-2xl font-semibold text-foreground mt-1">{episodes}</p>
      <p className="text-xs text-muted-foreground">total episodes</p>
    </WidgetTile>
  );
}

// Social Analytics Widget
function SocialAnalyticsWidget({ widget, followers = 0 }: { widget: WidgetDefinition; followers?: number }) {
  const navigate = useNavigate();
  const formattedFollowers = followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : followers;
  
  return (
    <WidgetTile widget={widget} onClick={() => navigate("/social-analytics")}>
      <p className="text-2xl font-semibold text-foreground mt-1">{formattedFollowers}</p>
      <p className="text-xs text-muted-foreground">total followers</p>
    </WidgetTile>
  );
}

// Creator Valuation Widget
function CreatorValuationWidget({ widget, value }: { widget: WidgetDefinition; value?: { min: number; max: number } }) {
  const navigate = useNavigate();
  
  return (
    <WidgetTile widget={widget} onClick={() => navigate("/social-analytics")}>
      {value ? (
        <>
          <p className="text-xl font-semibold text-foreground mt-1">
            ${value.min} - ${value.max}
          </p>
          <p className="text-xs text-muted-foreground">per sponsored post</p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground mt-1">
          Connect social to calculate
        </p>
      )}
    </WidgetTile>
  );
}

// Identity Status Widget
function IdentityStatusWidget({ widget, verified }: { widget: WidgetDefinition; verified?: { voice: boolean; face: boolean } }) {
  const navigate = useNavigate();
  
  return (
    <WidgetTile widget={widget} onClick={() => navigate("/identity")}>
      <div className="flex items-center gap-2 mt-2">
        <div className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          verified?.voice ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"
        )}>
          Voice {verified?.voice ? "✓" : "—"}
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          verified?.face ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-muted text-muted-foreground"
        )}>
          Face {verified?.face ? "✓" : "—"}
        </div>
      </div>
    </WidgetTile>
  );
}

// Generic placeholder for other widgets
function GenericWidget({ widget }: { widget: WidgetDefinition }) {
  const navigate = useNavigate();
  const routes: Record<string, string> = {
    "audience-insights": "/social-analytics",
    "campaigns": "/creator/campaigns",
    "email-preview": "/email",
    "events-booking": "/meetings",
    "my-page": "/profile/edit",
  };
  
  return (
    <WidgetTile 
      widget={widget} 
      onClick={() => navigate(routes[widget.id] || "/dashboard")}
    />
  );
}

export function ModularWidgetGrid({ widgets, stats = {} }: ModularWidgetGridProps) {
  const enabledWidgets = widgets.filter(w => w.enabled);
  
  if (enabledWidgets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No widgets enabled. Click "Customize Dashboard" to add some.</p>
      </div>
    );
  }

  const renderWidget = (widget: WidgetDefinition) => {
    switch (widget.id) {
      case "studio-launch":
        return <StudioWidget key={widget.id} widget={widget} />;
      case "recent-clips":
        return <RecentClipsWidget key={widget.id} widget={widget} count={stats.clips || 0} />;
      case "media-library":
        return <MediaLibraryWidget key={widget.id} widget={widget} count={stats.mediaFiles || 0} />;
      case "podcasts":
        return <PodcastsWidget key={widget.id} widget={widget} episodes={stats.episodes || 0} />;
      case "social-analytics":
        return <SocialAnalyticsWidget key={widget.id} widget={widget} followers={stats.followers || 0} />;
      case "creator-valuation":
        return <CreatorValuationWidget key={widget.id} widget={widget} value={stats.valuation} />;
      case "identity-status":
        return <IdentityStatusWidget key={widget.id} widget={widget} verified={stats.identity} />;
      default:
        return <GenericWidget key={widget.id} widget={widget} />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {enabledWidgets.map(renderWidget)}
    </div>
  );
}
