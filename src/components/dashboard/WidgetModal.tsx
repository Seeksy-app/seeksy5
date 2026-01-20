import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, BarChart3, FolderOpen, Users, Mail, Calendar, 
  DollarSign, Shield, Scissors, TrendingUp, Video, Layout
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  enabled: boolean;
}

interface WidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: WidgetDefinition[];
  onSave: (widgets: WidgetDefinition[]) => void;
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  studio: { label: "Studio", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
  media: { label: "Media", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  analytics: { label: "Analytics", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  engagement: { label: "Engagement", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  monetization: { label: "Monetization", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  identity: { label: "Identity", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
};

export function WidgetModal({ open, onOpenChange, widgets, onSave }: WidgetModalProps) {
  const [localWidgets, setLocalWidgets] = useState<WidgetDefinition[]>(widgets);

  const toggleWidget = (id: string) => {
    setLocalWidgets(prev => 
      prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w)
    );
  };

  const handleSave = () => {
    onSave(localWidgets);
    onOpenChange(false);
  };

  const groupedWidgets = localWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) acc[widget.category] = [];
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, WidgetDefinition[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Choose which widgets to display on your dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {Object.entries(groupedWidgets).map(([category, categoryWidgets]) => {
            const config = categoryConfig[category] || { label: category, color: "bg-muted text-muted-foreground" };
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className={cn("text-xs", config.color)}>
                    {config.label}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryWidgets.map((widget) => {
                    const Icon = widget.icon;
                    return (
                      <div
                        key={widget.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                          widget.enabled 
                            ? "bg-primary/5 border-primary/20" 
                            : "bg-card border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                          widget.enabled ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4",
                            widget.enabled ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {widget.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {widget.description}
                          </p>
                        </div>
                        <Switch
                          checked={widget.enabled}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Default widget definitions
export const defaultWidgetDefinitions: WidgetDefinition[] = [
  { id: "studio-launch", name: "Studio Quick Launch", description: "Start recording instantly", icon: Mic, category: "studio", enabled: true },
  { id: "recent-clips", name: "Recent Clips", description: "Your latest generated clips", icon: Scissors, category: "media", enabled: true },
  { id: "media-library", name: "Media Library", description: "Recent uploads", icon: FolderOpen, category: "media", enabled: true },
  { id: "podcasts", name: "Podcast Episodes", description: "Latest episodes", icon: Video, category: "media", enabled: true },
  { id: "social-analytics", name: "Social Analytics", description: "Follower trends", icon: BarChart3, category: "analytics", enabled: true },
  { id: "audience-insights", name: "Audience Insights", description: "Demographics & engagement", icon: Users, category: "analytics", enabled: false },
  { id: "creator-valuation", name: "Creator Valuation", description: "Your estimated worth", icon: DollarSign, category: "monetization", enabled: true },
  { id: "campaigns", name: "Campaign Opportunities", description: "Brand deals available", icon: TrendingUp, category: "monetization", enabled: false },
  { id: "email-preview", name: "Email Performance", description: "Recent sends & opens", icon: Mail, category: "engagement", enabled: false },
  { id: "events-booking", name: "Booking Performance", description: "Upcoming meetings", icon: Calendar, category: "engagement", enabled: false },
  { id: "identity-status", name: "Identity Status", description: "Verification badges", icon: Shield, category: "identity", enabled: true },
  { id: "my-page", name: "My Page Preview", description: "Public page stats", icon: Layout, category: "identity", enabled: false },
];
