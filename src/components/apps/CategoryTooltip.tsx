import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Target, Users, Sparkles, ArrowRight, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryTooltipData {
  purpose: string;
  best_for_users: string;
  recommended_modules: string[];
  example_workflows: string;
}

interface CategoryTooltipProps {
  categoryId: string;
  children: React.ReactNode;
  fallbackData?: {
    purpose: string;
    bestForUsers: string;
    recommendedModules: string[];
    exampleWorkflows: string;
  };
}

export function CategoryTooltip({ categoryId, children, fallbackData }: CategoryTooltipProps) {
  const { data: tooltip } = useQuery({
    queryKey: ['category-tooltip', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_tooltips')
        .select('*')
        .eq('category_id', categoryId)
        .maybeSingle();
      
      if (error) throw error;
      return data as CategoryTooltipData | null;
    },
    staleTime: 10 * 60 * 1000,
  });

  const data = tooltip || (fallbackData ? {
    purpose: fallbackData.purpose,
    best_for_users: fallbackData.bestForUsers,
    recommended_modules: fallbackData.recommendedModules,
    example_workflows: fallbackData.exampleWorkflows,
  } : null);

  if (!data) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 cursor-help">
            {children}
            <Info className="h-3.5 w-3.5 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="start"
          className="w-80 p-4 bg-popover border border-border shadow-lg"
        >
          <div className="space-y-3">
            {/* Purpose */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <Target className="h-3.5 w-3.5" />
                Purpose
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {data.purpose}
              </p>
            </div>

            {/* Best For Users */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5" />
                Best for
              </div>
              <p className="text-sm text-foreground">{data.best_for_users}</p>
            </div>

            {/* Recommended Starting Modules */}
            {data.recommended_modules && data.recommended_modules.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recommended modules
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.recommended_modules.map((mod, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {mod}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Example Workflow */}
            {data.example_workflows && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Example workflow
                </div>
                <p className="text-xs text-muted-foreground italic">
                  {data.example_workflows}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}