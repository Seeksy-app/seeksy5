import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Settings2, Sparkles, ArrowRight, Check, TrendingUp, TrendingDown, Minus,
  Mic, Video, Users, Calendar, BarChart3, DollarSign, Film, Mail, Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  PersonaType, 
  getPersonaConfig, 
  getWidgetById,
  ChecklistItem,
  KPIConfig 
} from "@/config/personaConfig";
import { WidgetSelectorModal } from "./WidgetSelectorModal";
import { toast } from "sonner";

interface PersonaDashboardProps {
  personaType: PersonaType;
  userId: string;
}

export function PersonaDashboard({ personaType, userId }: PersonaDashboardProps) {
  const navigate = useNavigate();
  const config = getPersonaConfig(personaType);
  
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(config.defaultWidgets);
  const [checklistStatus, setChecklistStatus] = useState<Record<string, boolean>>({});
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [kpis, setKpis] = useState<KPIConfig[]>(config.kpis);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserPreferences();
  }, [userId, personaType]);

  const loadUserPreferences = async () => {
    try {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (prefs) {
        // Load enabled widgets from preferences
        if (prefs.pinned_modules && Array.isArray(prefs.pinned_modules)) {
          setEnabledWidgets(prefs.pinned_modules as string[]);
        }
        
        // Load checklist status from onboarding data
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_data")
          .eq("id", userId)
          .maybeSingle();
          
        if (profile?.onboarding_data) {
          const data = profile.onboarding_data as Record<string, any>;
          setChecklistStatus(data.checklistStatus || {});
        }
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWidgets = async (widgets: string[]) => {
    setEnabledWidgets(widgets);
    
    try {
      await supabase.from("user_preferences").upsert({
        user_id: userId,
        pinned_modules: widgets,
      }, { onConflict: "user_id" });
      
      toast.success("Dashboard updated");
    } catch (error) {
      console.error("Error saving widgets:", error);
      toast.error("Failed to save");
    }
  };

  const toggleChecklistItem = async (itemId: string) => {
    const newStatus = { ...checklistStatus, [itemId]: !checklistStatus[itemId] };
    setChecklistStatus(newStatus);
    
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_data")
        .eq("id", userId)
        .maybeSingle();
        
      const existingData = (profile?.onboarding_data as Record<string, any>) || {};
      
      await supabase.from("profiles").update({
        onboarding_data: { ...existingData, checklistStatus: newStatus }
      }).eq("id", userId);
    } catch (error) {
      console.error("Error updating checklist:", error);
    }
  };

  const completedCount = Object.values(checklistStatus).filter(Boolean).length;
  const totalCount = config.checklist.length;
  const checklistProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const showChecklist = checklistProgress < 100;

  const getTrendIcon = (trend?: "up" | "down" | "neutral") => {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-emerald-500" />;
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const renderWidget = (widgetId: string) => {
    const widget = getWidgetById(widgetId);
    if (!widget) return null;
    
    const Icon = widget.icon;
    
    return (
      <motion.div
        key={widgetId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium">{widget.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">{widget.description}</p>
            <div className="h-20 bg-muted/30 rounded-lg flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className={cn("p-2 rounded-lg bg-gradient-to-br text-white", config.gradient)}>
              <config.icon className="h-5 w-5" />
            </span>
            {config.label} Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">{config.description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowWidgetModal(true)}>
          <Settings2 className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </div>

      {/* Setup Checklist */}
      {showChecklist && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Setup Checklist</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                {completedCount}/{totalCount} complete
              </Badge>
            </div>
            <Progress value={checklistProgress} className="h-1.5 mt-2" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {config.checklist.map((item, index) => {
                const isCompleted = checklistStatus[item.id];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                      isCompleted 
                        ? "bg-emerald-500/5 border-emerald-500/20" 
                        : "bg-background hover:bg-muted/50"
                    )}
                    onClick={() => item.route && navigate(item.route)}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        isCompleted && "line-through text-muted-foreground"
                      )}>
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.route && !isCompleted && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  {getTrendIcon(kpi.trend)}
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                {kpi.change && (
                  <p className={cn(
                    "text-xs",
                    kpi.trend === "up" ? "text-emerald-500" : 
                    kpi.trend === "down" ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {kpi.change}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enabledWidgets.map((widgetId) => renderWidget(widgetId))}
      </div>

      {/* AI Recommendation */}
      <Card className="border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">AI Recommendation</p>
              <p className="text-sm text-muted-foreground">
                Based on your profile, consider connecting your social accounts to unlock analytics and grow your audience faster.
              </p>
              <Button variant="link" size="sm" className="px-0 mt-1" onClick={() => navigate("/social-analytics")}>
                Connect Now <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Selector Modal */}
      <WidgetSelectorModal
        open={showWidgetModal}
        onOpenChange={setShowWidgetModal}
        enabledWidgets={enabledWidgets}
        availableWidgets={config.allWidgets}
        onSave={saveWidgets}
      />
    </div>
  );
}
