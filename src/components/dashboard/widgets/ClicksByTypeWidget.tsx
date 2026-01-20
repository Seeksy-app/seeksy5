import { LinkIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LinkClickBreakdown {
  link_type: string;
  count: number;
  title?: string;
}

interface ClicksByTypeWidgetProps {
  clickBreakdown: LinkClickBreakdown[];
  totalClicks: number;
}

const getLinkTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'event': 'Events',
    'meeting': 'Meetings',
    'signup': 'Signup Sheets',
    'poll': 'Polls',
    'custom_link': 'Custom Links',
    'social': 'Social Media',
    'podcast': 'Podcasts'
  };
  return labels[type] || type;
};

const getLinkTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'event': 'bg-blue-500',
    'meeting': 'bg-green-500',
    'signup': 'bg-purple-500',
    'poll': 'bg-orange-500',
    'custom_link': 'bg-pink-500',
    'social': 'bg-cyan-500',
    'podcast': 'bg-indigo-500'
  };
  return colors[type] || 'bg-gray-500';
};

export const ClicksByTypeWidget = ({ clickBreakdown, totalClicks }: ClicksByTypeWidgetProps) => (
  <Card className="transition-all duration-300 hover:shadow-lg border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <LinkIcon className="h-5 w-5" />
        My Page - Clicks by Type
      </CardTitle>
      <CardDescription>See which types of links get the most engagement</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {clickBreakdown.map((item, index) => (
          <div key={`${item.link_type}-${item.title || index}`} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getLinkTypeColor(item.link_type)}`} />
                <span className="font-medium truncate max-w-[250px]">
                  {item.title || getLinkTypeLabel(item.link_type)}
                </span>
              </div>
              <span className="text-muted-foreground">
                {item.count} {item.count === 1 ? 'click' : 'clicks'}
              </span>
            </div>
            <Progress 
              value={totalClicks > 0 ? (item.count / totalClicks) * 100 : 0}
              className="h-2"
            />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
