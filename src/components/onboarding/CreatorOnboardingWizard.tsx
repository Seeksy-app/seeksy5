import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowRight, ArrowLeft, Check, Sparkles, Zap, Mic, Video, 
  Users, BookOpen, Presentation, Briefcase, Layers, TrendingUp,
  DollarSign, Megaphone, BarChart3, PenTool, Shield, Layout,
  Podcast, Scissors, Mail, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatorOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CREATOR_TYPES = [
  { id: 'podcaster', name: 'Podcaster', icon: Mic, description: 'Host audio/video shows' },
  { id: 'social-creator', name: 'Social Creator', icon: Video, description: 'Create content for social platforms' },
  { id: 'educator', name: 'Educator/Coach', icon: BookOpen, description: 'Teach and mentor others' },
  { id: 'speaker', name: 'Speaker', icon: Presentation, description: 'Present at events and conferences' },
  { id: 'business', name: 'Business/Brand', icon: Briefcase, description: 'Promote products or services' },
  { id: 'hybrid', name: 'Hybrid Creator', icon: Layers, description: 'Mix of multiple types' },
];

const GOALS = [
  { id: 'grow-audience', name: 'Grow my audience', icon: TrendingUp },
  { id: 'launch-podcast', name: 'Launch a podcast', icon: Podcast },
  { id: 'brand-deals', name: 'Monetize through brand deals', icon: DollarSign },
  { id: 'sell-courses', name: 'Sell courses/events', icon: Calendar },
  { id: 'manage-content', name: 'Manage content', icon: Scissors },
  { id: 'analyze-performance', name: 'Analyze performance', icon: BarChart3 },
  { id: 'build-brand', name: 'Build a personal brand', icon: PenTool },
];

interface RecommendedModule {
  id: string;
  name: string;
  icon: React.ElementType;
  creditEstimate: number;
  reason: string;
}

const MODULE_RECOMMENDATIONS: Record<string, RecommendedModule[]> = {
  podcaster: [
    { id: 'studio', name: 'Studio & Recording', icon: Mic, creditEstimate: 50, reason: 'Record professional audio' },
    { id: 'podcasts', name: 'Podcasts', icon: Podcast, creditEstimate: 20, reason: 'Host and distribute' },
    { id: 'clips-editing', name: 'Clips & Editing', icon: Scissors, creditEstimate: 30, reason: 'Create clips for social' },
    { id: 'audience-insights', name: 'Audience Insights', icon: BarChart3, creditEstimate: 10, reason: 'Track listener growth' },
  ],
  'social-creator': [
    { id: 'clips-editing', name: 'Clips & Editing', icon: Scissors, creditEstimate: 30, reason: 'Auto-generate clips' },
    { id: 'social-connect', name: 'Social Connect', icon: Users, creditEstimate: 5, reason: 'Sync all platforms' },
    { id: 'audience-insights', name: 'Audience Insights', icon: BarChart3, creditEstimate: 10, reason: 'Track engagement' },
    { id: 'campaigns', name: 'Social Posting', icon: Megaphone, creditEstimate: 25, reason: 'Schedule content' },
  ],
  educator: [
    { id: 'studio', name: 'Studio & Recording', icon: Mic, creditEstimate: 50, reason: 'Record lessons' },
    { id: 'events', name: 'Events', icon: Calendar, creditEstimate: 15, reason: 'Host workshops' },
    { id: 'email-templates', name: 'Email & Newsletter', icon: Mail, creditEstimate: 10, reason: 'Nurture students' },
    { id: 'my-page', name: 'My Page Builder', icon: Layout, creditEstimate: 5, reason: 'Showcase offerings' },
  ],
  speaker: [
    { id: 'studio', name: 'Studio & Recording', icon: Mic, creditEstimate: 50, reason: 'Record talks' },
    { id: 'events', name: 'Events', icon: Calendar, creditEstimate: 15, reason: 'Manage bookings' },
    { id: 'proposals', name: 'Proposal Builder', icon: Briefcase, creditEstimate: 10, reason: 'Pitch to clients' },
    { id: 'identity-verification', name: 'Identity Verification', icon: Shield, creditEstimate: 20, reason: 'Protect your brand' },
  ],
  business: [
    { id: 'campaigns', name: 'Campaigns', icon: Megaphone, creditEstimate: 25, reason: 'Run marketing' },
    { id: 'contacts', name: 'Contacts & CRM', icon: Users, creditEstimate: 5, reason: 'Manage leads' },
    { id: 'email-templates', name: 'Email & Newsletter', icon: Mail, creditEstimate: 10, reason: 'Email marketing' },
    { id: 'gtm-engine', name: 'GTM Engine', icon: TrendingUp, creditEstimate: 25, reason: 'AI strategy' },
  ],
  hybrid: [
    { id: 'studio', name: 'Studio & Recording', icon: Mic, creditEstimate: 50, reason: 'Create content' },
    { id: 'clips-editing', name: 'Clips & Editing', icon: Scissors, creditEstimate: 30, reason: 'Repurpose content' },
    { id: 'social-connect', name: 'Social Connect', icon: Users, creditEstimate: 5, reason: 'Sync platforms' },
    { id: 'audience-insights', name: 'Audience Insights', icon: BarChart3, creditEstimate: 10, reason: 'Track growth' },
    { id: 'my-page', name: 'My Page Builder', icon: Layout, creditEstimate: 5, reason: 'Your link-in-bio' },
  ],
};

const CREDIT_PACKAGES = [
  { name: 'Starter', credits: 300, price: 19 },
  { name: 'Creator', credits: 600, price: 39 },
  { name: 'Pro', credits: 1200, price: 79, recommended: true },
  { name: 'Power User', credits: 2500, price: 149 },
  { name: 'Studio Team', credits: 5000, price: 279 },
];

export function CreatorOnboardingWizard({ open, onOpenChange }: CreatorOnboardingWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [customizeMode, setCustomizeMode] = useState(false);

  const recommendedModules = useMemo(() => {
    if (!selectedType) return [];
    return MODULE_RECOMMENDATIONS[selectedType] || MODULE_RECOMMENDATIONS.hybrid;
  }, [selectedType]);

  const totalCredits = useMemo(() => {
    if (customizeMode) {
      return Array.from(selectedModules).reduce((sum, id) => {
        const mod = recommendedModules.find(m => m.id === id);
        return sum + (mod?.creditEstimate || 10);
      }, 0);
    }
    return recommendedModules.reduce((sum, m) => sum + m.creditEstimate, 0);
  }, [selectedModules, recommendedModules, customizeMode]);

  const recommendedBundle = useMemo(() => {
    if (totalCredits <= 300) return CREDIT_PACKAGES[0];
    if (totalCredits <= 600) return CREDIT_PACKAGES[1];
    if (totalCredits <= 1200) return CREDIT_PACKAGES[2];
    if (totalCredits <= 2500) return CREDIT_PACKAGES[3];
    return CREDIT_PACKAGES[4];
  }, [totalCredits]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const addAllRecommended = () => {
    setSelectedModules(new Set(recommendedModules.map(m => m.id)));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const modulesToSave = customizeMode 
        ? Array.from(selectedModules)
        : recommendedModules.map(m => m.id);

      // Save onboarding preferences
      const { error } = await supabase
        .from('custom_packages')
        .insert({
          user_id: session.user.id,
          name: `${CREATOR_TYPES.find(t => t.id === selectedType)?.name || 'Creator'} Workspace`,
          modules: modulesToSave,
          estimated_monthly_credits: totalCredits,
          recommended_bundle: recommendedBundle.name,
          settings: {
            creatorType: selectedType,
            goals: Array.from(selectedGoals),
          },
          is_default: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Your workspace is ready!");
      onOpenChange(false);
      navigate('/');
    },
    onError: (error) => {
      toast.error("Setup failed", { description: error.message });
    },
  });

  const stepLabels = ["Creator Type", "Goals", "Modules", "Plan", "Confirm"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <h2 className="text-xl font-bold mb-1">Welcome to Seeksy</h2>
          <p className="text-sm text-muted-foreground">Let's set up your perfect workspace</p>
          
          {/* Progress */}
          <div className="flex items-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={cn(
                  "w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors",
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {step > s ? <Check className="h-3 w-3" /> : s}
                </div>
                {s < 5 && <div className={cn("h-0.5 flex-1 mx-1", step > s ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-5">
          <AnimatePresence mode="wait">
            {/* Step 1: Creator Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-semibold">What type of creator are you?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {CREATOR_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <Card
                        key={type.id}
                        className={cn(
                          "p-4 cursor-pointer transition-all",
                          selectedType === type.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "hover:border-primary/50"
                        )}
                        onClick={() => setSelectedType(type.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            selectedType === type.id ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-semibold">What are your goals?</h3>
                <p className="text-sm text-muted-foreground">Select all that apply</p>
                <div className="space-y-2">
                  {GOALS.map(goal => {
                    const Icon = goal.icon;
                    return (
                      <label
                        key={goal.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          selectedGoals.has(goal.id)
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        )}
                      >
                        <Checkbox
                          checked={selectedGoals.has(goal.id)}
                          onCheckedChange={() => toggleGoal(goal.id)}
                        />
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{goal.name}</span>
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: Recommended Modules */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Recommended Modules
                    </h3>
                    <p className="text-sm text-muted-foreground">Based on your profile</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomizeMode(!customizeMode)}
                    >
                      {customizeMode ? "Use AI Picks" : "Customize"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {recommendedModules.map(module => {
                    const Icon = module.icon;
                    const isSelected = customizeMode ? selectedModules.has(module.id) : true;
                    return (
                      <div
                        key={module.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          isSelected ? "border-primary/50 bg-primary/5" : "opacity-50"
                        )}
                      >
                        {customizeMode && (
                          <Checkbox
                            checked={selectedModules.has(module.id)}
                            onCheckedChange={() => toggleModule(module.id)}
                          />
                        )}
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{module.name}</div>
                          <div className="text-xs text-muted-foreground">{module.reason}</div>
                        </div>
                        <Badge variant="secondary" className="gap-1">
                          <Zap className="h-3 w-3" />
                          {module.creditEstimate}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                {!customizeMode && (
                  <Button variant="outline" className="w-full" onClick={() => {
                    setCustomizeMode(true);
                    addAllRecommended();
                  }}>
                    Customize My Setup
                  </Button>
                )}
              </motion.div>
            )}

            {/* Step 4: Credit Plan */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-semibold">Your Recommended Plan</h3>
                
                <Card className="p-5 border-primary bg-primary/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Based on your selection</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    You'll likely use about <span className="font-bold text-foreground">{totalCredits} credits</span> per month. 
                    We recommend the <span className="font-bold text-foreground">{recommendedBundle.name}</span> pack.
                  </p>
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <div className="text-lg font-bold">{recommendedBundle.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {recommendedBundle.credits} credits • ${recommendedBundle.price}
                      </div>
                    </div>
                    {recommendedBundle.recommended && (
                      <Badge className="bg-primary text-primary-foreground">Best Value</Badge>
                    )}
                  </div>
                </Card>

                <div className="space-y-2">
                  <p className="text-sm font-medium">All plans available:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CREDIT_PACKAGES.map(pkg => (
                      <Card
                        key={pkg.name}
                        className={cn(
                          "p-3 text-sm",
                          pkg.name === recommendedBundle.name && "border-primary"
                        )}
                      >
                        <div className="font-medium">{pkg.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {pkg.credits} credits • ${pkg.price}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Confirm */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-semibold">Your Workspace Setup</h3>
                
                <Card className="p-4 bg-muted/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">
                      {CREATOR_TYPES.find(t => t.id === selectedType)?.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {customizeMode ? selectedModules.size : recommendedModules.length} modules
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(customizeMode 
                      ? recommendedModules.filter(m => selectedModules.has(m.id))
                      : recommendedModules
                    ).map(m => (
                      <Badge key={m.id} variant="outline" className="text-xs">
                        {m.name}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm">Monthly credits</span>
                    <span className="font-bold">{totalCredits}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm">Recommended plan</span>
                    <span className="font-bold">{recommendedBundle.name}</span>
                  </div>
                </Card>

                {/* Dashboard Preview Placeholder */}
                <Card className="p-6 bg-muted/30 border-dashed text-center">
                  <Layout className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Dashboard preview</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex justify-between">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 5 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedType) ||
                (step === 2 && selectedGoals.size === 0) ||
                (step === 3 && customizeMode && selectedModules.size === 0)
              }
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                Edit Selection
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Check className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Setting up..." : "Confirm Setup"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
