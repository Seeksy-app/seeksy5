import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DASHBOARD_TEMPLATES } from "@/config/dashboardTemplates";
import { WIDGET_REGISTRY } from "@/config/widgetRegistry";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const USER_TYPES = [
  { id: "podcaster", label: "Podcaster", description: "Create and distribute podcast episodes" },
  { id: "creator", label: "Creator / Influencer", description: "Build content and grow your audience" },
  { id: "speaker", label: "Speaker", description: "Share bite-sized industry content" },
  { id: "meeting-host", label: "Meeting Host", description: "Host virtual meetings and bookings" },
  { id: "event-planner", label: "Event Planner", description: "Organize events and registrations" },
  { id: "agency", label: "Agency", description: "Manage multiple creators and revenue" },
  { id: "advertiser", label: "Advertiser / Brand", description: "Connect with creators for campaigns" },
];

export default function DashboardOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customizingWidgets, setCustomizingWidgets] = useState<string[]>([]);

  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = DASHBOARD_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setCustomizingWidgets(template.widgets);
    }
  };

  const handleWidgetToggle = (widgetId: string) => {
    setCustomizingWidgets((prev) =>
      prev.includes(widgetId) ? prev.filter((w) => w !== widgetId) : [...prev, widgetId]
    );
  };

  const handleFinish = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const widgetConfig = customizingWidgets.map((widgetId) => {
        const widget = WIDGET_REGISTRY.find((w) => w.id === widgetId);
        return {
          id: widget?.id,
          type: widget?.type,
          category: widget?.category,
          enabled: true,
        };
      });

      await supabase.from("user_dashboard_layouts").insert({
        user_id: user.id,
        layout_name: "default",
        widget_config: widgetConfig,
        is_active: true,
      });

      toast({
        title: "Dashboard ready! 🎉",
        description: "Your personalized workspace is set up.",
      });

      navigate("/my-day");
    } catch (error) {
      console.error("Failed to save dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to save dashboard layout",
        variant: "destructive",
      });
    }
  };

  // Step 1: User Type Selection
  if (step === 1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-3xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">How will you use Seeksy?</CardTitle>
            <CardDescription>Select all that apply — you can change this later</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {USER_TYPES.map((type) => (
                <div
                  key={type.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTypes.includes(type.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleTypeToggle(type.id)}
                >
                  <Checkbox checked={selectedTypes.includes(type.id)} className="mt-1" />
                  <div className="flex-1">
                    <Label className="text-sm font-medium cursor-pointer">{type.label}</Label>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={selectedTypes.length === 0}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Template Selection
  if (step === 2) {
    const relevantTemplates = DASHBOARD_TEMPLATES.filter((t) =>
      t.targetAudience.some((a) => selectedTypes.includes(a))
    );

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-4xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Choose a Starter Layout</CardTitle>
            <CardDescription>Pick a template that matches your workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relevantTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      {template.name}
                      {selectedTemplate === template.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {template.widgets.slice(0, 4).map((widgetId) => {
                        const widget = WIDGET_REGISTRY.find((w) => w.id === widgetId);
                        return (
                          <p key={widgetId} className="text-xs text-muted-foreground">
                            • {widget?.name}
                          </p>
                        );
                      })}
                      {template.widgets.length > 4 && (
                        <p className="text-xs text-muted-foreground">
                          + {template.widgets.length - 4} more
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!selectedTemplate}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Widget Customization
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-4xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Customize Your Dashboard</CardTitle>
          <CardDescription>Add or remove widgets to personalize your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
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
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        id={widget.id}
                        checked={customizingWidgets.includes(widget.id)}
                        onCheckedChange={() => handleWidgetToggle(widget.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={widget.id} className="text-sm font-medium cursor-pointer">
                          {widget.name}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{widget.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleFinish} disabled={customizingWidgets.length === 0}>
              Finish Setup
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
