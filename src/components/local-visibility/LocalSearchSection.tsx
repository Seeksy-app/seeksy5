import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MousePointerClick,
  Eye,
  FileText,
  Sparkles,
  ArrowRight,
  Globe,
  AlertTriangle
} from "lucide-react";
import { useLocalVisibilityStore } from "@/hooks/useLocalVisibilityStore";
import type { LocalSearchQuery, LocalSearchPage } from "@/types/local-visibility";
import { toast } from "sonner";

const TrendArrow = ({ value }: { value: number }) => {
  if (value > 2) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (value < -2) return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const QueryRow = ({ query }: { query: LocalSearchQuery }) => {
  const ctrColor = query.ctr < 2 ? 'text-red-600' : query.ctr < 5 ? 'text-yellow-600' : 'text-green-600';
  const positionBadge = query.position <= 3 ? 'bg-green-500/10 text-green-600' : 
                         query.position <= 10 ? 'bg-yellow-500/10 text-yellow-600' : 
                         'bg-red-500/10 text-red-600';

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{query.query}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {query.impressions.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <MousePointerClick className="h-3 w-3" />
            {query.clicks.toLocaleString()}
          </span>
          <span className={ctrColor}>{query.ctr.toFixed(1)}% CTR</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={positionBadge}>
          #{query.position.toFixed(1)}
        </Badge>
        <div className="flex items-center gap-1 w-16 justify-end">
          <TrendArrow value={query.positionChange} />
          <span className={`text-xs ${query.positionChange > 0 ? 'text-green-600' : query.positionChange < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
            {query.positionChange > 0 ? '+' : ''}{query.positionChange.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

const PageRow = ({ page }: { page: LocalSearchPage }) => (
  <div className="flex items-center justify-between py-3 border-b last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{page.title}</p>
      <p className="text-xs text-muted-foreground truncate">{page.url}</p>
    </div>
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Eye className="h-3 w-3" />
        {page.impressions.toLocaleString()}
      </span>
      <span className="flex items-center gap-1">
        <MousePointerClick className="h-3 w-3" />
        {page.clicks.toLocaleString()}
      </span>
      {page.linkedLocation && (
        <Badge variant="secondary" className="text-[10px]">{page.linkedLocation}</Badge>
      )}
    </div>
  </div>
);

export function LocalSearchSection() {
  const { connections, searchQueries, addActivityLog } = useLocalVisibilityStore();
  const scConnection = connections.find(c => c.provider === 'search_console');
  const isConnected = scConnection?.status === 'connected';

  // Mock data
  const mockQueries: LocalSearchQuery[] = searchQueries.length ? searchQueries : [
    { query: 'coffee shop near me', clicks: 245, impressions: 3200, ctr: 7.7, position: 2.3, positionChange: 0.5 },
    { query: 'best coffee austin', clicks: 189, impressions: 2800, ctr: 6.8, position: 3.1, positionChange: -0.8 },
    { query: 'downtown coffee', clicks: 156, impressions: 1900, ctr: 8.2, position: 1.8, positionChange: 1.2 },
    { query: 'coffee shop with wifi', clicks: 98, impressions: 1500, ctr: 6.5, position: 4.2, positionChange: 0.0 },
    { query: 'late night coffee austin', clicks: 67, impressions: 890, ctr: 7.5, position: 5.6, positionChange: 2.3 },
    { query: 'organic coffee austin', clicks: 45, impressions: 650, ctr: 6.9, position: 8.4, positionChange: -1.5 },
  ];

  const mockPages: LocalSearchPage[] = [
    { url: '/location/downtown', title: 'Downtown Location - Hours & Menu', clicks: 312, impressions: 4500, linkedLocation: 'Downtown' },
    { url: '/menu', title: 'Our Menu - Coffee, Pastries & More', clicks: 245, impressions: 3200 },
    { url: '/about', title: 'About Us - Our Story', clicks: 89, impressions: 1200 },
  ];

  // Find issues
  const lowCtrQueries = mockQueries.filter(q => q.ctr < 3);
  const decliningQueries = mockQueries.filter(q => q.positionChange < -1);

  const handleConnect = () => {
    toast.info('Search Console OAuth flow would start here');
    addActivityLog({
      type: 'user_action',
      title: 'Connection initiated',
      description: 'Started Google Search Console OAuth flow',
      isAI: false,
    });
  };

  const handleAIAction = (action: string) => {
    toast.info(`AI action: ${action}`);
    addActivityLog({
      type: 'ai_suggestion',
      title: 'AI action requested',
      description: action,
      isAI: true,
    });
  };

  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-3 rounded-full bg-primary/10 mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Connect Search Console</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Link Google Search Console to see how people find your business in local search results.
          </p>
          <Button onClick={handleConnect}>
            <Globe className="h-4 w-4 mr-2" />
            Connect Search Console
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Issues Alert */}
      {(lowCtrQueries.length > 0 || decliningQueries.length > 0) && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Attention Needed</p>
                <ul className="mt-2 space-y-1">
                  {lowCtrQueries.length > 0 && (
                    <li className="text-sm text-muted-foreground">
                      {lowCtrQueries.length} queries have low click-through rates (under 3%)
                    </li>
                  )}
                  {decliningQueries.length > 0 && (
                    <li className="text-sm text-muted-foreground">
                      {decliningQueries.length} queries are declining in rankings
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Queries */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Top Local Queries
              </CardTitle>
              <CardDescription>How people find your business in search</CardDescription>
            </div>
            <Badge variant="outline">Last 28 days</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {mockQueries.map((query, i) => (
              <QueryRow key={i} query={query} />
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Why this matters</p>
                <p className="text-sm text-muted-foreground mt-1">
                  "coffee shop near me" is your top query with good positioning. Maintaining this ranking 
                  is crucial since "near me" searches have high purchase intent.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">What to do next</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your "organic coffee austin" query is dropping. Consider adding more organic-focused 
                  content to your GBP and website.
                </p>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="mt-2 h-7 text-xs"
                  onClick={() => handleAIAction('Generate organic coffee content suggestions')}
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Do it for me
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Top Pages
          </CardTitle>
          <CardDescription>Pages tied to your local presence</CardDescription>
        </CardHeader>
        <CardContent>
          {mockPages.map((page, i) => (
            <PageRow key={i} page={page} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
