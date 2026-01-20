import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Users, Clock, DollarSign, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIInsight {
  id: string;
  type: "opportunity" | "warning" | "success" | "tip";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AIInsightsModuleProps {
  insights: AIInsight[];
}

export function AIInsightsModule({ insights }: AIInsightsModuleProps) {
  const getInsightStyle = (type: AIInsight["type"]) => {
    switch (type) {
      case "opportunity":
        return {
          bg: "bg-blue-50 border-blue-200",
          icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
          badge: "bg-blue-100 text-blue-700",
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-200",
          icon: <Clock className="w-4 h-4 text-amber-600" />,
          badge: "bg-amber-100 text-amber-700",
        };
      case "success":
        return {
          bg: "bg-green-50 border-green-200",
          icon: <DollarSign className="w-4 h-4 text-green-600" />,
          badge: "bg-green-100 text-green-700",
        };
      case "tip":
        return {
          bg: "bg-purple-50 border-purple-200",
          icon: <Users className="w-4 h-4 text-purple-600" />,
          badge: "bg-purple-100 text-purple-700",
        };
    }
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-[#053877]/5 to-[#2C6BED]/5 border-[#2C6BED]/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-[#2C6BED] to-[#053877]">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#053877]">AI Insights For You</h3>
          <p className="text-xs text-muted-foreground">Daily recommendations based on your campaigns</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const style = getInsightStyle(insight.type);
          return (
            <div
              key={insight.id}
              className={cn(
                "p-4 rounded-lg border transition-all hover:shadow-sm",
                style.bg
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-1.5 rounded-lg", style.badge)}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold mb-1">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
                {insight.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={insight.action.onClick}
                  >
                    {insight.action.label}
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
