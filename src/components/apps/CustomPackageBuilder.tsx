import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Package, ArrowRight, ArrowLeft, Check, Sparkles, RotateCcw, Palette, Layout, Settings2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { getModuleTooltip } from "@/config/moduleTooltips";
import { motion, AnimatePresence } from "framer-motion";

interface Module {
  id: string;
  name: string;
  category: string;
  creditEstimate: number;
}

interface EditPackage {
  id: string;
  name: string;
  description: string | null;
  modules: string[] | null;
  settings: any;
  is_default: boolean;
}

interface CustomPackageBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: Module[];
  editPackage?: EditPackage | null;
}

const CREDIT_PACKAGES = [
  { name: 'Starter', credits: 300, price: 19 },
  { name: 'Creator', credits: 600, price: 39 },
  { name: 'Pro', credits: 1200, price: 79, recommended: true },
  { name: 'Power User', credits: 2500, price: 149 },
  { name: 'Studio Team', credits: 5000, price: 279 },
];

const THEME_OPTIONS = [
  { id: 'default', name: 'Default', color: 'bg-primary' },
  { id: 'ocean', name: 'Ocean', color: 'bg-blue-500' },
  { id: 'forest', name: 'Forest', color: 'bg-emerald-500' },
  { id: 'sunset', name: 'Sunset', color: 'bg-orange-500' },
  { id: 'lavender', name: 'Lavender', color: 'bg-purple-500' },
];

const LAYOUT_OPTIONS = [
  { id: 'grid', name: 'Grid View', description: 'Cards in a grid layout' },
  { id: 'list', name: 'List View', description: 'Compact list layout' },
  { id: 'sidebar', name: 'Sidebar Focus', description: 'Expanded sidebar navigation' },
];

export function CustomPackageBuilder({ open, onOpenChange, modules, editPackage }: CustomPackageBuilderProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [packageName, setPackageName] = useState("My Custom Workspace");
  const [packageDescription, setPackageDescription] = useState("");
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [isDefault, setIsDefault] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [selectedLayout, setSelectedLayout] = useState('grid');
  const [showQuickStart, setShowQuickStart] = useState(true);

  // Reset when modal opens/closes or edit package changes
  const resetForm = () => {
    if (editPackage) {
      setPackageName(editPackage.name || "My Custom Workspace");
      setPackageDescription(editPackage.description || "");
      setSelectedModules(new Set(editPackage.modules || []));
      setIsDefault(editPackage.is_default || false);
      if (editPackage.settings) {
        setSelectedTheme(editPackage.settings.theme || 'default');
        setSelectedLayout(editPackage.settings.layout || 'grid');
        setShowQuickStart(editPackage.settings.showQuickStart ?? true);
      }
    } else {
      setPackageName("My Custom Workspace");
      setPackageDescription("");
      setSelectedModules(new Set());
      setIsDefault(false);
      setSelectedTheme('default');
      setSelectedLayout('grid');
      setShowQuickStart(true);
    }
    setStep(1);
  };

  // Load edit package data or reset when modal opens
  useEffect(() => {
    if (open) {
      if (editPackage) {
        setPackageName(editPackage.name || "My Custom Workspace");
        setPackageDescription(editPackage.description || "");
        setSelectedModules(new Set(editPackage.modules || []));
        setIsDefault(editPackage.is_default || false);
        if (editPackage.settings) {
          setSelectedTheme(editPackage.settings.theme || 'default');
          setSelectedLayout(editPackage.settings.layout || 'grid');
          setShowQuickStart(editPackage.settings.showQuickStart ?? true);
        }
        setStep(1);
      } else {
        resetForm();
      }
    }
  }, [open, editPackage]);

  const totalCredits = useMemo(() => {
    return modules
      .filter(m => selectedModules.has(m.id))
      .reduce((sum, m) => sum + (m.creditEstimate || 10), 0);
  }, [selectedModules, modules]);

  const recommendedBundle = useMemo(() => {
    const monthlyCredits = totalCredits;
    if (monthlyCredits <= 300) return CREDIT_PACKAGES[0];
    if (monthlyCredits <= 600) return CREDIT_PACKAGES[1];
    if (monthlyCredits <= 1200) return CREDIT_PACKAGES[2];
    if (monthlyCredits <= 2500) return CREDIT_PACKAGES[3];
    return CREDIT_PACKAGES[4];
  }, [totalCredits]);

  const estimatedCost = useMemo(() => {
    const pricePerCredit = 0.06; // Average of $0.055-$0.065
    return (totalCredits * pricePerCredit).toFixed(2);
  }, [totalCredits]);

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const resetSelection = () => {
    setSelectedModules(new Set());
  };

  const groupedModules = useMemo(() => {
    const groups: Record<string, Module[]> = {};
    modules.forEach(m => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return groups;
  }, [modules]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const packageData = {
        user_id: session.user.id,
        name: packageName,
        description: packageDescription,
        modules: Array.from(selectedModules),
        estimated_monthly_credits: totalCredits,
        recommended_bundle: recommendedBundle.name,
        settings: {
          theme: selectedTheme,
          layout: selectedLayout,
          showQuickStart,
        },
        is_default: isDefault,
      };

      if (editPackage) {
        // Update existing package
        const { error } = await supabase
          .from('custom_packages')
          .update(packageData)
          .eq('id', editPackage.id);
        if (error) throw error;
      } else {
        // Insert new package
        const { error } = await supabase
          .from('custom_packages')
          .insert(packageData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-packages'] });
      toast.success(editPackage ? "Workspace updated!" : "Workspace saved!", {
        description: "You can manage this under My Workspaces in the App Directory.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save package", { description: error.message });
    },
  });

  const categoryLabels: Record<string, string> = {
    creator: "Creator Tools",
    media: "Media & Content",
    marketing: "Growth & Distribution",
    business: "Business Tools",
    identity: "Identity & Profile",
    integrations: "Integrations",
  };

  const stepLabels = ["Select Modules", "Customize Settings", "Name & Save"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {editPackage ? "Edit Workspace" : "Create Your Own Package"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Select the modules you want in your custom workspace."}
            {step === 2 && "Customize your workspace settings and appearance."}
            {step === 3 && "Name your package and save your custom workspace."}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 py-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className={cn(
                "ml-2 text-xs font-medium hidden sm:block",
                step >= s ? "text-foreground" : "text-muted-foreground"
              )}>
                {stepLabels[s - 1]}
              </span>
              {s < 3 && <div className={cn("h-0.5 flex-1 mx-2", step > s ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Modules */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex gap-4 flex-1 min-h-0"
            >
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-4 pb-4">
                  {Object.entries(groupedModules).map(([category, categoryModules]) => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                        {categoryLabels[category] || category}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {categoryModules.map(module => {
                          const tooltip = getModuleTooltip(module.id);
                          return (
                            <label
                              key={module.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                                selectedModules.has(module.id)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <Checkbox
                                checked={selectedModules.has(module.id)}
                                onCheckedChange={() => toggleModule(module.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{module.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  ~{module.creditEstimate || 10} credits/mo
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Live Summary Sidebar */}
              <div className="w-56 shrink-0 space-y-3">
                <Card className="p-3 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Selected</span>
                    <Badge variant="secondary" className="text-xs">{selectedModules.size}</Badge>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {Array.from(selectedModules).map(id => {
                      const mod = modules.find(m => m.id === id);
                      return mod ? (
                        <div key={id} className="text-xs truncate">{mod.name}</div>
                      ) : null;
                    })}
                    {selectedModules.size === 0 && (
                      <div className="text-xs text-muted-foreground italic">No modules selected</div>
                    )}
                  </div>
                </Card>

                <Card className="p-3 bg-muted/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">Monthly Credits</span>
                  </div>
                  <div className="text-2xl font-bold">{totalCredits}</div>
                  <div className="text-xs text-muted-foreground">~${estimatedCost}/mo</div>
                </Card>

                <Card className="p-3 border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">Recommended</span>
                  </div>
                  <div className="font-bold">{recommendedBundle.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {recommendedBundle.credits} credits • ${recommendedBundle.price}
                  </div>
                </Card>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-1.5"
                  onClick={resetSelection}
                  disabled={selectedModules.size === 0}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Selection
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Customize Settings */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 space-y-5 overflow-y-auto"
            >
              {/* Theme Selection */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Palette className="h-4 w-4" />
                  Theme Color
                </Label>
                <div className="flex gap-2">
                  {THEME_OPTIONS.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={cn(
                        "w-10 h-10 rounded-full transition-all",
                        theme.color,
                        selectedTheme === theme.id ? "ring-2 ring-offset-2 ring-primary" : "opacity-70 hover:opacity-100"
                      )}
                      title={theme.name}
                    />
                  ))}
                </div>
              </div>

              {/* Layout Selection */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Layout className="h-4 w-4" />
                  Default Layout
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {LAYOUT_OPTIONS.map(layout => (
                    <Card
                      key={layout.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all",
                        selectedLayout === layout.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedLayout(layout.id)}
                    >
                      <div className="text-sm font-medium">{layout.name}</div>
                      <div className="text-xs text-muted-foreground">{layout.description}</div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tool Toggles */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Settings2 className="h-4 w-4" />
                  Default Tools
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="text-sm font-medium">Quick Start Guide</div>
                      <div className="text-xs text-muted-foreground">Show onboarding tips on dashboard</div>
                    </div>
                    <Switch checked={showQuickStart} onCheckedChange={setShowQuickStart} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Name & Save */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="package-name">Package Name</Label>
                <Input
                  id="package-name"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="My Custom Workspace"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="package-description">Description (optional)</Label>
                <Textarea
                  id="package-description"
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  placeholder="Describe your custom workspace..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="text-sm font-medium">Make this my default workspace</div>
                  <div className="text-xs text-muted-foreground">Load this package on login</div>
                </div>
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              </div>

              <Card className="p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Package Summary</span>
                  <Badge variant="secondary">{selectedModules.size} modules</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Array.from(selectedModules).slice(0, 8).map(id => {
                    const mod = modules.find(m => m.id === id);
                    return mod ? (
                      <Badge key={id} variant="outline" className="text-xs">
                        {mod.name}
                      </Badge>
                    ) : null;
                  })}
                  {selectedModules.size > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedModules.size - 8} more
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm">Estimated Monthly Usage</span>
                  </div>
                  <span className="font-bold text-lg">{totalCredits} credits</span>
                </div>
              </Card>

              <Card className="p-4 border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Recommended Bundle</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">{recommendedBundle.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {recommendedBundle.credits} credits for ${recommendedBundle.price}/purchase
                    </div>
                  </div>
                  {recommendedBundle.recommended && (
                    <Badge className="bg-primary text-primary-foreground">Best Value</Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter className="gap-2 pt-4 border-t">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => setStep(2)} 
                disabled={selectedModules.size === 0}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : step === 2 ? (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !packageName.trim()}
              >
                <Check className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : editPackage ? "Update Package" : "Save Package"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
