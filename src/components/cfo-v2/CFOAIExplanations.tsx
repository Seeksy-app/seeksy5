import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamic AI explanation templates
export const AI_EXPLANATION_TEMPLATES = {
  revenue: "Revenue changed due to growth, ARPU, AI adoption, CPM, or fill rate adjustments.",
  cac: "CAC changed due to marketing spend, channel efficiency, or churn impacts.",
  churn: "Churn impacts retention, lifetime value, and revenue stability.",
  opex: "OpEx changed due to headcount adjustments or OpEx compression.",
  burn: "Burn changed because revenue, COGS, or OpEx changed.",
  runway: "Runway updated due to changes in burn, capital infusion timing, or cash thresholds.",
  scenario: "Scenario selection updates growth, churn, CAC, CPM, hiring, and capital assumptions.",
};

interface AIExplanationCardProps {
  type: keyof typeof AI_EXPLANATION_TEMPLATES;
  className?: string;
  visible?: boolean;
}

export function AIExplanationCard({ type, className, visible = true }: AIExplanationCardProps) {
  if (!visible) return null;
  
  const explanation = AI_EXPLANATION_TEMPLATES[type];
  
  return (
    <Card className={cn("bg-muted/30 border-dashed border-primary/20", className)}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground italic">
            {explanation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface DynamicAIExplanationProps {
  changedFields: string[];
  className?: string;
}

// Generates contextual explanations based on what fields changed
export function DynamicAIExplanation({ changedFields, className }: DynamicAIExplanationProps) {
  const explanations = React.useMemo(() => {
    const result: string[] = [];
    
    const fieldMappings: Record<string, keyof typeof AI_EXPLANATION_TEMPLATES> = {
      monthlyCreatorGrowth: 'revenue',
      avgRevenuePerCreator: 'revenue',
      advertisingCPM: 'revenue',
      adFillRate: 'revenue',
      aiToolsAdoption: 'revenue',
      pricingSensitivity: 'revenue',
      
      cacPaid: 'cac',
      cacOrganic: 'cac',
      monthlyMarketingBudget: 'cac',
      
      churnRate: 'churn',
      opexChurn: 'churn',
      
      headcountProductivity: 'opex',
      opexCompression: 'opex',
      salaryInflation: 'opex',
      
      burnRateChangePercent: 'burn',
      revenueShock: 'burn',
      
      startingCash: 'runway',
      minimumCashTarget: 'runway',
      hiringFreezeEnabled: 'runway',
    };
    
    const usedTypes = new Set<string>();
    
    changedFields.forEach(field => {
      const type = fieldMappings[field];
      if (type && !usedTypes.has(type)) {
        usedTypes.add(type);
        result.push(AI_EXPLANATION_TEMPLATES[type]);
      }
    });
    
    return result;
  }, [changedFields]);
  
  if (explanations.length === 0) return null;
  
  return (
    <Card className={cn("bg-gradient-to-r from-primary/5 to-transparent border-dashed border-primary/20", className)}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-primary uppercase tracking-wide">Why This Changed</p>
            {explanations.map((exp, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                • {exp}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
