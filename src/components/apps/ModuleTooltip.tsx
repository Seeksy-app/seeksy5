import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Unlock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getModuleTooltip } from "@/config/moduleTooltips";

interface ModuleTooltipData {
  short_description: string;
  best_for: string;
  unlocks: string[];
  credit_estimate: number;
}

interface ModuleTooltipProps {
  moduleId: string;
  children: React.ReactNode;
  fallbackData?: {
    description: string;
    bestFor: string;
    unlocks: string[];
    creditEstimate: number;
  };
}

export function ModuleTooltip({ moduleId, children, fallbackData }: ModuleTooltipProps) {
  const { data: dbTooltip } = useQuery({
    queryKey: ['module-tooltip', moduleId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('module_tooltips')
        .select('*')
        .eq('module_id', moduleId)
        .maybeSingle();
      
      if (result.error) throw result.error;
      return result.data as ModuleTooltipData | null;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Get config tooltip as fallback
  const configTooltip = getModuleTooltip(moduleId);

  const data = dbTooltip || (configTooltip ? {
    short_description: configTooltip.shortDescription,
    best_for: configTooltip.bestFor.join(', '),
    unlocks: configTooltip.unlocks,
    credit_estimate: configTooltip.creditEstimate,
  } : fallbackData ? {
    short_description: fallbackData.description,
    best_for: fallbackData.bestFor,
    unlocks: fallbackData.unlocks,
    credit_estimate: fallbackData.creditEstimate,
  } : null);

  if (!data) {
    return <>{children}</>;
  }

  // Parse best_for to array if string
  const bestForArray = typeof data.best_for === 'string' 
    ? data.best_for.split(', ').filter(Boolean)
    : Array.isArray(data.best_for) ? data.best_for : [];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          align="start"
          className="w-72 p-4 bg-popover/95 backdrop-blur-sm border border-border shadow-xl rounded-xl"
          sideOffset={8}
        >
          <div className="space-y-3">
            {/* Short Description */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Short description:</p>
              <p className="text-sm text-foreground leading-relaxed">
                {data.short_description}
              </p>
            </div>

            {/* Best For */}
            {bestForArray.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Best for:
                </div>
                <ul className="space-y-0.5">
                  {bestForArray.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What it unlocks */}
            {data.unlocks && data.unlocks.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                  <Unlock className="h-3.5 w-3.5" />
                  Unlocks:
                </div>
                <ul className="space-y-0.5">
                  {data.unlocks.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Credit Estimate */}
            {data.credit_estimate > 0 && (
              <div className="pt-2 border-t border-border">
                <Badge variant="secondary" className="gap-1.5">
                  <Zap className="h-3 w-3" />
                  ~{data.credit_estimate} credits/month
                </Badge>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}