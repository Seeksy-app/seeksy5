import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Database, 
  Settings2, 
  FileText, 
  RotateCcw,
  TrendingUp,
  CreditCard,
  Radio,
  Calendar,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useCFOAssumptions, type EffectiveAssumption } from '@/hooks/useCFOAssumptions';
import { 
  CFO_ASSUMPTIONS_SCHEMA, 
  CATEGORY_LABELS, 
  formatAssumptionValue,
  type AssumptionConfig 
} from '@/lib/cfo-assumptions-schema';

interface Props {
  onResetAll?: () => void;
}

const CATEGORY_ICONS = {
  growth: TrendingUp,
  subscriptions: CreditCard,
  advertising: Radio,
  impressions: Database,
  events: Calendar,
};

export function AssumptionsSummaryPanel({ onResetAll }: Props) {
  const { 
    effectiveAssumptions, 
    rdCount, 
    cfoOverrideCount, 
    deleteAssumption,
    isLoading 
  } = useCFOAssumptions();

  // Track which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    growth: true,
    subscriptions: true,
    advertising: true,
    impressions: true,
    events: true,
  });

  const toggleSection = (category: string) => {
    setOpenSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Group assumptions by category
  const groupedAssumptions = useMemo(() => {
    const groups: Record<string, Array<{ key: string; config: AssumptionConfig; effective: EffectiveAssumption | undefined }>> = {};
    
    Object.entries(CFO_ASSUMPTIONS_SCHEMA).forEach(([category, metrics]) => {
      groups[category] = Object.entries(metrics as Record<string, AssumptionConfig>).map(([key, config]) => ({
        key,
        config,
        effective: effectiveAssumptions[key],
      }));
    });
    
    return groups;
  }, [effectiveAssumptions]);

  const handleResetSingle = (metricKey: string) => {
    deleteAssumption(metricKey);
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Key Assumptions
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {rdCount} R&D
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {cfoOverrideCount} CFO
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Summary of all active assumptions used in the AI Pro Forma.
        </p>
      </CardHeader>
      <Separator />
      <ScrollArea className="h-[500px]">
        <CardContent className="p-4 space-y-3">
          {Object.entries(groupedAssumptions).map(([category, items]) => {
            const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Settings2;
            const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
            const isOpen = openSections[category] ?? true;
            
            return (
              <Collapsible key={category} open={isOpen} onOpenChange={() => toggleSection(category)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-2 py-2 px-1 hover:bg-muted/50 rounded-md transition-colors">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">{categoryLabel}</h4>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1 pl-8 pr-1">
                    {items.map(({ key, config, effective }) => {
                      const value = effective?.value ?? config.default;
                      const source = effective?.source || 'schema_default';
                      const isCfoOverride = source === 'cfo_override';
                      
                      return (
                        <div 
                          key={key} 
                          className="flex items-center justify-between py-1.5 group"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                            <span className="text-sm text-muted-foreground truncate">
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-medium text-foreground whitespace-nowrap">
                              {formatAssumptionValue(value, config.unit)}
                            </span>
                            {isCfoOverride ? (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0 flex-shrink-0"
                              >
                                CFO
                              </Badge>
                            ) : source === 'r_d_default' ? (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 px-1.5 py-0 flex-shrink-0"
                              >
                                R&D
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 px-1.5 py-0 flex-shrink-0"
                              >
                                Default
                              </Badge>
                            )}
                            {isCfoOverride && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={() => handleResetSingle(key)}
                                title="Reset to benchmark"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </ScrollArea>
      
      {cfoOverrideCount > 0 && onResetAll && (
        <>
          <Separator />
          <div className="p-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onResetAll}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All to Benchmarks
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
