import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Zap, Check, ExternalLink, Image as ImageIcon, LucideIcon, Users, Unlock, Sparkles, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { getModuleTooltip } from "@/config/moduleTooltips";
import { motion, AnimatePresence } from "framer-motion";
import { useModuleActivation } from "@/hooks/useModuleActivation";

interface ModulePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    status: string;
    route?: string;
    recommendedWith?: string[];
    creditEstimate?: number;
  } | null;
}

const CREDIT_PACKAGES = [
  { name: 'Starter', credits: 300, price: 19 },
  { name: 'Creator', credits: 600, price: 39 },
  { name: 'Pro', credits: 1200, price: 79, recommended: true },
  { name: 'Power User', credits: 2500, price: 149 },
  { name: 'Studio Team', credits: 5000, price: 279 },
];

export function ModulePreviewModal({ open, onOpenChange, module }: ModulePreviewModalProps) {
  const navigate = useNavigate();
  const { isModuleActivated, activateModule, isActivating } = useModuleActivation();

  const { data: dbTooltip } = useQuery({
    queryKey: ['module-tooltip', module?.id],
    queryFn: async () => {
      if (!module?.id) return null;
      const { data, error } = await supabase
        .from('module_tooltips')
        .select('*')
        .eq('module_id', module.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!module?.id,
  });

  const isAlreadyActivated = module ? isModuleActivated(module.id) : false;

  const handleAddToWorkspace = () => {
    if (!module) return;
    
    if (isAlreadyActivated) {
      // Already activated, navigate in-app
      onOpenChange(false);
      if (module.route) {
        navigate(module.route);
      }
      return;
    }

    // Activate the module
    activateModule(module.id);
    onOpenChange(false);
    if (module.route) {
      // Navigate in-app after a brief delay for the activation toast
      setTimeout(() => navigate(module.route!), 300);
    }
  };

  if (!module) return null;

  // Get tooltip data from config as fallback
  const configTooltip = getModuleTooltip(module.id);
  
  const Icon = module.icon;
  const creditEstimate = dbTooltip?.credit_estimate || module.creditEstimate || configTooltip?.creditEstimate || 10;
  const shortDescription = dbTooltip?.short_description || configTooltip?.shortDescription || module.description;
  const bestFor = configTooltip?.bestFor || [];
  const unlocks = (dbTooltip?.unlocks as string[]) || configTooltip?.unlocks || [];
  
  // Find recommended bundle based on credits
  const recommendedBundle = creditEstimate <= 50 ? CREDIT_PACKAGES[0] : 
                           creditEstimate <= 100 ? CREDIT_PACKAGES[1] : 
                           creditEstimate <= 200 ? CREDIT_PACKAGES[2] :
                           creditEstimate <= 400 ? CREDIT_PACKAGES[3] : CREDIT_PACKAGES[4];

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-lg rounded-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                {/* Header with large icon */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{module.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1.5">
                      {isAlreadyActivated ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <Check className="h-3 w-3 mr-1" />
                          Activated
                        </Badge>
                      ) : module.status === 'coming_soon' ? (
                        <Badge variant="secondary">Coming Soon</Badge>
                      ) : (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <DialogDescription className="text-base leading-relaxed">
                  {shortDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Features Section */}
                {unlocks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                      <Unlock className="h-4 w-4 text-primary" />
                      Features
                    </h4>
                    <ul className="space-y-2">
                      {unlocks.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Best For Section */}
                {bestFor.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Best For
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {bestFor.map((persona, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                          {persona}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Screenshot Placeholder */}
                <Card className="p-6 bg-muted/30 border-dashed flex flex-col items-center justify-center text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <span className="text-sm text-muted-foreground">Module preview coming soon</span>
                </Card>

                {/* Estimated Credits */}
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2.5">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Estimated Credits</span>
                  </div>
                  <span className="text-sm font-bold">{creditEstimate} credits/month</span>
                </div>

                {/* Recommended Plan */}
                <Card className="p-4 border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Recommended Plan</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{recommendedBundle.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {recommendedBundle.credits} credits • ${recommendedBundle.price}
                      </div>
                    </div>
                    {recommendedBundle.recommended && (
                      <Badge className="bg-primary text-primary-foreground">Best Value</Badge>
                    )}
                  </div>
                </Card>

                {/* Recommended With */}
                {module.recommendedWith && module.recommendedWith.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Works great with</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {module.recommendedWith.map((rec, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          + {rec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                {module.status !== 'coming_soon' && (
                  <Button onClick={handleAddToWorkspace} disabled={isActivating}>
                    {isActivating ? (
                      "Adding..."
                    ) : isAlreadyActivated ? (
                      <>
                        Open Module
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add to My Workspace
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
