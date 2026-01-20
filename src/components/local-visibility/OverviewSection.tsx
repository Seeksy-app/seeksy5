import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  MessageSquare, 
  Star,
  ArrowRight,
  Sparkles,
  MapPin,
  Globe
} from "lucide-react";
import { useLocalVisibilityStore } from "@/hooks/useLocalVisibilityStore";
import type { HealthStatus, GrowthAction } from "@/types/local-visibility";

const HealthBadge = ({ status }: { status: HealthStatus }) => {
  const config = {
    good: { label: 'Good', icon: CheckCircle2, variant: 'default' as const, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    needs_attention: { label: 'Needs Attention', icon: AlertTriangle, variant: 'secondary' as const, className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    at_risk: { label: 'At Risk', icon: XCircle, variant: 'destructive' as const, className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  };
  const { label, icon: Icon, className } = config[status];
  return (
    <Badge variant="outline" className={`gap-1.5 ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
};

const ActionCard = ({ action, onExecute }: { action: GrowthAction; onExecute: (id: string) => void }) => {
  const impactColors = {
    low: 'text-muted-foreground',
    medium: 'text-yellow-600',
    high: 'text-green-600',
  };

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{action.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs ${impactColors[action.estimatedImpact]}`}>
                {action.estimatedImpact.charAt(0).toUpperCase() + action.estimatedImpact.slice(1)} Impact
              </span>
              {action.creditCost > 0 && (
                <span className="text-xs text-muted-foreground">{action.creditCost} credits</span>
              )}
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onExecute(action.id)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function OverviewSection() {
  const { summary, connections, setActiveTab, updateGrowthAction, addActivityLog } = useLocalVisibilityStore();

  const gbpConnection = connections.find(c => c.provider === 'google_business');
  const scConnection = connections.find(c => c.provider === 'search_console');

  const handleExecuteAction = (actionId: string) => {
    updateGrowthAction(actionId, { status: 'pending_preview' });
    addActivityLog({
      type: 'user_action',
      title: 'Action initiated',
      description: 'User started a growth action',
      isAI: false,
    });
    setActiveTab('actions');
  };

  // Mock summary for demo
  const displaySummary = summary || {
    overallHealth: 'needs_attention' as HealthStatus,
    gbpConnected: gbpConnection?.status === 'connected',
    searchConsoleConnected: scConnection?.status === 'connected',
    reviewsNeedingResponse: 3,
    topInsight: "Your profile views are up 12% this week, but 3 reviews need responses to maintain your rating.",
    recommendedActions: [
      {
        id: '1',
        type: 'review_reply' as const,
        title: 'Respond to recent reviews',
        description: 'You have 3 reviews waiting for a response. Timely replies improve customer trust.',
        estimatedImpact: 'high' as const,
        creditCost: 1,
        riskLevel: 'low' as const,
        status: 'available' as const,
      },
      {
        id: '2',
        type: 'add_hours' as const,
        title: 'Update holiday hours',
        description: 'Christmas is coming. Update your holiday hours to avoid customer confusion.',
        estimatedImpact: 'medium' as const,
        creditCost: 0,
        riskLevel: 'low' as const,
        status: 'available' as const,
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      {/* AI Summary Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Daily Visibility Summary</CardTitle>
            </div>
            <HealthBadge status={displaySummary.overallHealth} />
          </div>
          <CardDescription className="text-sm">
            AI-generated overview of your local presence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/90 leading-relaxed">
            {displaySummary.topInsight}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${displaySummary.gbpConnected ? 'bg-green-500/10' : 'bg-muted'}`}>
                <MapPin className={`h-4 w-4 ${displaySummary.gbpConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">GBP Status</p>
                <p className="text-sm font-medium">
                  {displaySummary.gbpConnected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${displaySummary.searchConsoleConnected ? 'bg-green-500/10' : 'bg-muted'}`}>
                <Globe className={`h-4 w-4 ${displaySummary.searchConsoleConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Search Console</p>
                <p className="text-sm font-medium">
                  {displaySummary.searchConsoleConnected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${displaySummary.reviewsNeedingResponse > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                <MessageSquare className={`h-4 w-4 ${displaySummary.reviewsNeedingResponse > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reviews Pending</p>
                <p className="text-sm font-medium">{displaySummary.reviewsNeedingResponse}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Performance</p>
                <p className="text-sm font-medium">+12% views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Actions */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          Top Recommended Actions
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {displaySummary.recommendedActions.slice(0, 3).map((action) => (
            <ActionCard key={action.id} action={action} onExecute={handleExecuteAction} />
          ))}
        </div>
      </div>
    </div>
  );
}
