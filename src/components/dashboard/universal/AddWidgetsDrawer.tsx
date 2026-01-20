import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DashboardWidget, WIDGET_CATEGORIES } from "./types";
import { allAvailableWidgets } from "./defaultWidgets";
import { cn } from "@/lib/utils";

interface AddWidgetsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: DashboardWidget[];
  onToggleWidget: (widgetId: string) => void;
}

export function AddWidgetsDrawer({ open, onOpenChange, widgets, onToggleWidget }: AddWidgetsDrawerProps) {
  // Group widgets by category
  const widgetsByCategory = allAvailableWidgets.reduce((acc, widget) => {
    if (!acc[widget.category]) acc[widget.category] = [];
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, DashboardWidget[]>);

  const isWidgetEnabled = (id: string) => widgets.some(w => w.id === id && w.enabled);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Widgets</SheetTitle>
          <SheetDescription>
            Customize your dashboard by enabling or disabling widgets.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {Object.entries(widgetsByCategory).map(([category, categoryWidgets]) => {
            const categoryConfig = WIDGET_CATEGORIES[category as keyof typeof WIDGET_CATEGORIES];
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className={cn("text-xs", categoryConfig?.colorClass)}>
                    {categoryConfig?.label || category}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {categoryWidgets.map((widget) => {
                    const Icon = widget.icon;
                    const enabled = isWidgetEnabled(widget.id);
                    return (
                      <div
                        key={widget.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                          enabled
                            ? "bg-primary/5 border-primary/20"
                            : "bg-card border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                          enabled ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4",
                            enabled ? "text-primary" : "text-muted-foreground"
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
                          checked={enabled}
                          onCheckedChange={() => onToggleWidget(widget.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
