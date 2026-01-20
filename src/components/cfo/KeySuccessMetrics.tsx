import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface Metric {
  value: string;
  label: string;
  color?: string;
}

interface KeySuccessMetricsProps {
  metrics?: Metric[];
}

const defaultMetrics: Metric[] = [
  { value: "2,500", label: "Year 1 Client Target", color: "text-blue-600" },
  { value: "$5.2M", label: "Year 1 Revenue Goal", color: "text-red-500" },
  { value: "18%", label: "Target Conversion Rate", color: "text-green-600" },
  { value: "$312", label: "Target CAC", color: "text-purple-600" },
];

export function KeySuccessMetrics({ metrics = defaultMetrics }: KeySuccessMetricsProps) {
  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <TrendingUp className="h-5 w-5 text-slate-600" />
          Key Success Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-4 text-center border border-slate-100 shadow-sm"
            >
              <div className={`text-3xl md:text-4xl font-bold ${metric.color || 'text-slate-800'}`}>
                {metric.value}
              </div>
              <div className="text-sm text-slate-600 mt-1 leading-tight">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
