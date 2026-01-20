import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, CheckCircle2 } from "lucide-react";

interface Strategy {
  title: string;
  description: string;
}

export const GTMStrategyTab = () => {
  const { data: phases } = useQuery({
    queryKey: ["gtm-phases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gtm_phases")
        .select("*")
        .order("display_order");
      return data || [];
    },
  });

  const { data: keyMetrics } = useQuery({
    queryKey: ["gtm-key-success-metrics"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gtm_market_metrics")
        .select("*")
        .eq("category", "financial")
        .order("display_order");
      return data || [];
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Go-To-Market Strategy</h2>
      </div>

      {/* GTM Phases */}
      {phases?.map((phase) => {
        const strategies = (phase.strategies as unknown) as Strategy[];
        return (
          <Card 
            key={phase.id} 
            className="border-l-4 overflow-hidden"
            style={{ borderLeftColor: phase.color_code }}
          >
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-xl">
                Phase {phase.phase_number}: {phase.phase_name}
                <span className="ml-3 text-sm font-normal text-muted-foreground">
                  ({phase.timeline})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-4">
                {strategies.map((strategy, idx) => (
                  <li key={idx} className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{strategy.title}:</p>
                      <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      {/* Key Success Metrics */}
      <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Key Success Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {keyMetrics?.slice(0, 3).map((metric) => (
              <div key={metric.id} className="text-center p-6 bg-background rounded-lg border border-border/50">
                <p className="text-4xl font-bold mb-2" style={{
                  color: metric.metric_name.includes("Revenue") 
                    ? "hsl(var(--chart-2))" 
                    : metric.metric_name.includes("Target")
                    ? "hsl(var(--primary))"
                    : "hsl(var(--chart-3))"
                }}>
                  {metric.metric_value}
                </p>
                <p className="text-sm text-muted-foreground">{metric.metric_name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { TrendingUp } from "lucide-react";
