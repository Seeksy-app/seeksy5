import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface PerformanceSegment {
  name: string;
  roi: number;
  roiComment: string;
  conversionRate: number;
  conversionComment: string;
  cpa: number;
  cpaComment: string;
}

interface PerformanceInsightsProps {
  segments?: PerformanceSegment[];
}

const defaultSegments: PerformanceSegment[] = [
  {
    name: "Digital Marketing",
    roi: 476.0,
    roiComment: "Excellent performer, consider increasing budget",
    conversionRate: 8.0,
    conversionComment: "Improve lead quality or nurturing",
    cpa: 416.67,
    cpaComment: "Efficient",
  },
  {
    name: "Base Events",
    roi: 693.3,
    roiComment: "Excellent performer, consider increasing budget",
    conversionRate: 12.1,
    conversionComment: "Strong conversion",
    cpa: 352.94,
    cpaComment: "Efficient",
  },
  {
    name: "VA Seminars",
    roi: 931.1,
    roiComment: "Excellent performer, consider increasing budget",
    conversionRate: 18.1,
    conversionComment: "Strong conversion",
    cpa: 310.34,
    cpaComment: "Efficient",
  },
  {
    name: "Influencer Partnerships",
    roi: 245.5,
    roiComment: "Moderate performer, monitor closely",
    conversionRate: 5.2,
    conversionComment: "Below target",
    cpa: 520.00,
    cpaComment: "Above target",
  },
  {
    name: "Podcast Sponsorships",
    roi: 385.2,
    roiComment: "Good performer, maintain current spend",
    conversionRate: 9.8,
    conversionComment: "Meeting expectations",
    cpa: 398.50,
    cpaComment: "On target",
  },
];

export function PerformanceInsights({ segments = defaultSegments }: PerformanceInsightsProps) {
  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Target className="h-5 w-5 text-slate-600" />
          Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {segments.map((segment, index) => (
          <div
            key={index}
            className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4"
          >
            <h4 className="font-semibold text-slate-800 mb-2">{segment.name}</h4>
            <ul className="space-y-1 text-sm text-slate-600">
              <li className="flex items-start gap-1">
                <span className="text-slate-400">•</span>
                <span>
                  <strong>ROI: {segment.roi.toFixed(1)}%</strong> - {segment.roiComment}
                </span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-slate-400">•</span>
                <span>
                  <strong>Conversion Rate: {segment.conversionRate.toFixed(1)}%</strong> - {segment.conversionComment}
                </span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-slate-400">•</span>
                <span>
                  <strong>Cost per Acquisition: ${segment.cpa.toFixed(2)}</strong> - {segment.cpaComment}
                </span>
              </li>
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
