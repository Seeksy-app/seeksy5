import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Database, ChevronDown, ChevronUp, ExternalLink, Info, Lock, Shield } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useCFOAssumptions, EffectiveAssumption } from '@/hooks/useCFOAssumptions';
import { useCFOLockStatus } from '@/hooks/useCFOLockStatus';
import { CFO_ASSUMPTIONS_SCHEMA } from '@/lib/cfo-assumptions-schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate, useLocation } from 'react-router-dom';

const CATEGORY_LABELS: Record<string, string> = {
  growth: 'Growth & CAC',
  subscriptions: 'Subscriptions',
  advertising: 'Advertising',
  impressions: 'Impressions',
  events: 'Events & Awards',
};

const SOURCE_BADGES = {
  cfo_override: { label: 'CFO Override', className: 'bg-blue-100 text-blue-700' },
  r_d_default: { label: 'R&D Benchmark', className: 'bg-emerald-100 text-emerald-700' },
  schema_default: { label: 'Default', className: 'bg-slate-100 text-slate-600' },
};

export function CFOAssumptionsReadOnlyPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { effectiveAssumptions, rdCount, cfoOverrideCount, hasCFOAssumptions, isLoading } = useCFOAssumptions();
  const { isLocked, lockedAt } = useCFOLockStatus();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['growth', 'subscriptions']);
  
  // Check if user is on CFO route (has edit access)
  const isCFORoute = location.pathname.startsWith('/cfo') || location.pathname.startsWith('/admin');

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'percent') return `${value}%`;
    if (unit === 'USD') return `$${value.toLocaleString()}`;
    if (unit === 'impressions' || unit === 'views') return value.toLocaleString();
    return value.toString();
  };

  const getAssumptionsForCategory = (categoryKey: string): EffectiveAssumption[] => {
    const categoryMetrics = CFO_ASSUMPTIONS_SCHEMA[categoryKey as keyof typeof CFO_ASSUMPTIONS_SCHEMA];
    if (!categoryMetrics) return [];
    
    return Object.keys(categoryMetrics)
      .map(key => effectiveAssumptions[key])
      .filter(Boolean);
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-8 text-center">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Assumptions...</h3>
          <p className="text-muted-foreground">Fetching CFO overrides and R&D benchmarks.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* CFO Control Notice */}
      <Alert className={cn(
        hasCFOAssumptions 
          ? "bg-emerald-50 border-emerald-200" 
          : "bg-blue-50 border-blue-200"
      )}>
        {hasCFOAssumptions ? (
          <Shield className="w-4 h-4 text-emerald-600" />
        ) : (
          <Info className="w-4 h-4 text-blue-600" />
        )}
        <AlertDescription className={hasCFOAssumptions ? "text-emerald-800" : "text-blue-800"}>
          {hasCFOAssumptions ? (
            <>
              <strong>These assumptions are controlled by the CFO</strong> and power all Board forecasts.
              {isLocked && lockedAt && (
                <span className="ml-2 flex items-center gap-1 inline-flex">
                  <Lock className="w-3 h-3" />
                  Locked on {new Date(lockedAt).toLocaleDateString()}
                </span>
              )}
            </>
          ) : (
            <>
              <strong>Using R&D Benchmarks</strong> — Default assumptions are active.
            </>
          )}
          {isCFORoute && (
            <Button
              variant="link"
              size="sm"
              className="text-blue-700 p-0 h-auto ml-2"
              onClick={() => navigate('/cfo/assumptions')}
            >
              Open CFO Assumption Studio <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          )}
        </AlertDescription>
      </Alert>

      {/* Summary Badges */}
      <div className="flex items-center gap-3">
        {hasCFOAssumptions ? (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            CFO-Controlled Model
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            R&D Benchmarks
          </Badge>
        )}
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {cfoOverrideCount} CFO Overrides
        </Badge>
        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
          {rdCount} R&D Benchmarks
        </Badge>
      </div>

      {/* Categories */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Model Assumptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.keys(CFO_ASSUMPTIONS_SCHEMA).map((categoryKey) => {
            const assumptions = getAssumptionsForCategory(categoryKey);
            const isExpanded = expandedCategories.includes(categoryKey);
            const categoryLabel = CATEGORY_LABELS[categoryKey] || categoryKey;

            if (assumptions.length === 0) return null;

            return (
              <Collapsible key={categoryKey} open={isExpanded} onOpenChange={() => toggleCategory(categoryKey)}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="text-sm font-medium">{categoryLabel}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {assumptions.length} metrics
                      </Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-2 pb-2">
                  <div className="border rounded-md overflow-hidden mt-2">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2 font-medium text-slate-600">Assumption</th>
                          <th className="text-right p-2 font-medium text-slate-600">Value</th>
                          <th className="text-right p-2 font-medium text-slate-600">R&D Benchmark</th>
                          <th className="text-right p-2 font-medium text-slate-600">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assumptions.map((assumption) => {
                          const sourceBadge = SOURCE_BADGES[assumption.source];
                          return (
                            <tr key={assumption.metric_key} className="border-t border-slate-100">
                              <td className="p-2 text-slate-700">
                                {assumption.config?.label || assumption.metric_key.replace(/_/g, ' ')}
                              </td>
                              <td className="p-2 text-right font-medium text-slate-900">
                                {formatValue(assumption.value, assumption.unit)}
                              </td>
                              <td className="p-2 text-right text-slate-500">
                                {assumption.rd_value 
                                  ? formatValue(assumption.rd_value, assumption.unit) 
                                  : '—'}
                              </td>
                              <td className="p-2 text-right">
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-xs', sourceBadge.className)}
                                >
                                  {sourceBadge.label}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
