import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ALL_WIDGETS, WidgetConfig } from "@/config/personaConfig";
import { cn } from "@/lib/utils";

interface WidgetSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabledWidgets: string[];
  availableWidgets: string[];
  onSave: (widgets: string[]) => void;
}

export function WidgetSelectorModal({
  open,
  onOpenChange,
  enabledWidgets,
  availableWidgets,
  onSave,
}: WidgetSelectorModalProps) {
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(enabledWidgets);

  const toggleWidget = (widgetId: string) => {
    setSelectedWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSave = () => {
    onSave(selectedWidgets);
    onOpenChange(false);
  };

  const widgetsByCategory = availableWidgets.reduce((acc, widgetId) => {
    const widget = ALL_WIDGETS.find((w) => w.id === widgetId);
    if (widget) {
      if (!acc[widget.category]) acc[widget.category] = [];
      acc[widget.category].push(widget);
    }
    return acc;
  }, {} as Record<string, WidgetConfig[]>);

  const categoryLabels: Record<string, string> = {
    content: "Content & Media",
    analytics: "Analytics",
    monetization: "Monetization",
    engagement: "Engagement",
    identity: "Identity & Rights",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Choose which widgets to display on your dashboard.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Object.entries(widgetsByCategory).map(([category, widgets]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                  {categoryLabels[category] || category}
                </h4>
                <div className="space-y-2">
                  {widgets.map((widget) => {
                    const Icon = widget.icon;
                    const isEnabled = selectedWidgets.includes(widget.id);
                    return (
                      <div
                        key={widget.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          isEnabled
                            ? "bg-primary/5 border-primary/20"
                            : "bg-muted/30 border-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              isEnabled ? "bg-primary/10" : "bg-muted"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4",
                                isEnabled ? "text-primary" : "text-muted-foreground"
                              )}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{widget.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {widget.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
