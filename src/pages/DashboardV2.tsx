import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Settings, Plus } from "lucide-react";
import { WIDGET_REGISTRY } from "@/config/widgetRegistry";
import { DASHBOARD_TEMPLATES } from "@/config/dashboardTemplates";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function DashboardV2() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch user's dashboard layout
  const { data: layout, isLoading } = useQuery({
    queryKey: ["dashboard-layout", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_dashboard_layouts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      // If no layout exists, create default with first 4 widgets
      if (!data) {
        const defaultWidgets = WIDGET_REGISTRY.slice(0, 4).map((w) => ({
          id: w.id,
          type: w.type,
          category: w.category,
          enabled: true,
        }));

        const { data: newLayout } = await supabase
          .from("user_dashboard_layouts")
          .insert({
            user_id: user.id,
            layout_name: "default",
            widget_config: defaultWidgets,
          })
          .select()
          .single();

        return newLayout;
      }

      return data;
    },
  });

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (widgetConfig: any[]) => {
      const { data, error } = await supabase
        .from("user_dashboard_layouts")
        .update({
          widget_config: widgetConfig,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_active", true)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-layout", user?.id] });
      toast({
        title: "Dashboard updated! 🎨",
        description: "Your widget layout has been saved.",
      });
    },
  });

  const enabledWidgets = (Array.isArray(layout?.widget_config) ? layout.widget_config : []) as any[];

  const toggleWidget = (widgetId: string) => {
    const existing = enabledWidgets.find((w: any) => w.id === widgetId);
    let newConfig;

    if (existing) {
      // Remove widget
      newConfig = enabledWidgets.filter((w: any) => w.id !== widgetId);
    } else {
      // Add widget
      const widget = WIDGET_REGISTRY.find((w) => w.id === widgetId);
      if (widget) {
        newConfig = [
          ...enabledWidgets,
          {
            id: widget.id,
            type: widget.type,
            category: widget.category,
            enabled: true,
          },
        ];
      }
    }

    if (newConfig) {
      saveLayoutMutation.mutate(newConfig);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Welcome back — here's what's happening today
              </p>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Customize
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Customize Dashboard</SheetTitle>
                  <SheetDescription>
                    Choose which widgets to display on your dashboard
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {Object.entries(
                    WIDGET_REGISTRY.reduce((acc, widget) => {
                      if (!acc[widget.category]) acc[widget.category] = [];
                      acc[widget.category].push(widget);
                      return acc;
                    }, {} as Record<string, typeof WIDGET_REGISTRY>)
                  ).map(([category, widgets]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold mb-3 capitalize">{category}</h3>
                      <div className="space-y-2">
                        {widgets.map((widget) => {
                          const isEnabled = Array.isArray(enabledWidgets) && enabledWidgets.some((w: any) => w.id === widget.id);
                          return (
                            <div key={widget.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                              <Checkbox
                                id={widget.id}
                                checked={isEnabled}
                                onCheckedChange={() => toggleWidget(widget.id)}
                              />
                              <div className="flex-1">
                                <Label htmlFor={widget.id} className="text-sm font-medium cursor-pointer">
                                  {widget.name}
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {widget.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="container mx-auto px-6 py-8">
        {enabledWidgets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No widgets enabled yet</p>
            <Sheet>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widgets
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Add Widgets</SheetTitle>
                  <SheetDescription>
                    Choose widgets to display on your dashboard
                  </SheetDescription>
                </SheetHeader>
                {/* Same widget list as above */}
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enabledWidgets.map((widgetConfig: any) => {
              const widget = WIDGET_REGISTRY.find((w) => w.id === widgetConfig.id);
              if (!widget) return null;
              const WidgetComponent = widget.component;
              return (
                <div key={widget.id} className="h-[320px]">
                  <WidgetComponent />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
