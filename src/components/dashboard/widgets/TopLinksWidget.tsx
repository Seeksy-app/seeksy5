import { TrendingUp, MousePointerClick } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TopLink {
  link_url: string;
  link_type: string;
  count: number;
}

interface TopLinksWidgetProps {
  topLinks: TopLink[];
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

export const TopLinksWidget = ({ topLinks }: TopLinksWidgetProps) => (
  <Card className="transition-all duration-300 hover:shadow-lg border-border/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        My Page - Top Links
      </CardTitle>
      <CardDescription>Your most popular links this period</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {topLinks.length > 0 ? (
          topLinks.map((link, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{link.link_url}</p>
                  <p className="text-xs text-muted-foreground">{getLinkTypeLabel(link.link_type)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                {link.count}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No link clicks yet</p>
        )}
      </div>
    </CardContent>
  </Card>
);
