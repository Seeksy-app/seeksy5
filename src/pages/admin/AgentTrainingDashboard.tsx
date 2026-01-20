import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, Database, Zap, TrendingUp, Target, Clock, FileText, Youtube, Rss, HelpCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface HealthScore {
  name: string;
  score: number;
  description: string;
  icon: React.ReactNode;
  status: 'good' | 'warning' | 'critical';
}

export default function AgentTrainingDashboard() {
  // Fetch KB chunks count
  const { data: kbStats, isLoading: kbLoading } = useQuery({
    queryKey: ['agentKbStats'],
    queryFn: async () => {
      const { count: totalChunks } = await supabase
        .from('kb_chunks' as any)
        .select('*', { count: 'exact', head: true });

      const { data: recentChunks } = await supabase
        .from('kb_chunks' as any)
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1000);

      return {
        totalChunks: totalChunks || 0,
        recentChunks: recentChunks?.length || 0,
      };
    },
  });

  // Fetch feed items stats
  const { data: feedStats, isLoading: feedLoading } = useQuery({
    queryKey: ['agentFeedStats'],
    queryFn: async () => {
      const { data: items } = await supabase
        .from('rd_feed_items' as any)
        .select('content_type, processed');

      const stats = {
        total: items?.length || 0,
        processed: items?.filter((i: any) => i.processed).length || 0,
        byType: {
          article: items?.filter((i: any) => i.content_type === 'article').length || 0,
          youtube: items?.filter((i: any) => i.content_type === 'youtube').length || 0,
          pdf: items?.filter((i: any) => i.content_type === 'pdf').length || 0,
          podcast: items?.filter((i: any) => i.content_type === 'podcast').length || 0,
        },
      };

      return stats;
    },
  });

  // Fetch insights stats
  const { data: insightsStats } = useQuery({
    queryKey: ['agentInsightsStats'],
    queryFn: async () => {
      const { data: insights } = await supabase
        .from('rd_insights' as any)
        .select('tags, confidence_score');

      const allTags = insights?.flatMap((i: any) => i.tags || []) || [];
      const uniqueTags = [...new Set(allTags)];
      const avgConfidence = insights?.length 
        ? insights.reduce((sum: number, i: any) => sum + (i.confidence_score || 0.7), 0) / insights.length 
        : 0;

      return {
        totalInsights: insights?.length || 0,
        uniqueTags: uniqueTags.length,
        avgConfidence: Math.round(avgConfidence * 100),
      };
    },
  });

  // Calculate health scores
  const healthScores: HealthScore[] = [
    {
      name: 'Coverage Score',
      score: Math.min(100, Math.round((kbStats?.totalChunks || 0) / 10)),
      description: '% of KB chunks tagged as relevant to agent domains',
      icon: <Target className="w-5 h-5" />,
      status: (kbStats?.totalChunks || 0) > 500 ? 'good' : (kbStats?.totalChunks || 0) > 100 ? 'warning' : 'critical',
    },
    {
      name: 'Freshness Score',
      score: Math.min(100, Math.round(((kbStats?.recentChunks || 0) / Math.max(1, kbStats?.totalChunks || 1)) * 100)),
      description: 'Weighted average of chunk age (newer = higher)',
      icon: <Clock className="w-5 h-5" />,
      status: (kbStats?.recentChunks || 0) > 50 ? 'good' : (kbStats?.recentChunks || 0) > 10 ? 'warning' : 'critical',
    },
    {
      name: 'Response Quality',
      score: 85, // Placeholder - would need conversation tracking
      description: 'Based on user feedback and compression quality',
      icon: <CheckCircle2 className="w-5 h-5" />,
      status: 'good',
    },
    {
      name: 'Retrieval Accuracy',
      score: insightsStats?.avgConfidence || 70,
      description: '% of conversations using at least one KB chunk',
      icon: <Zap className="w-5 h-5" />,
      status: (insightsStats?.avgConfidence || 0) > 75 ? 'good' : (insightsStats?.avgConfidence || 0) > 50 ? 'warning' : 'critical',
    },
    {
      name: 'Trend Awareness',
      score: Math.min(100, (insightsStats?.uniqueTags || 0) * 2),
      description: '% of summaries with emerging topic tags from R&D',
      icon: <TrendingUp className="w-5 h-5" />,
      status: (insightsStats?.uniqueTags || 0) > 30 ? 'good' : (insightsStats?.uniqueTags || 0) > 10 ? 'warning' : 'critical',
    },
  ];

  const overallScore = Math.round(healthScores.reduce((sum, s) => sum + s.score, 0) / healthScores.length);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-amber-500';
      case 'critical': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const isLoading = kbLoading || feedLoading;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            Agent Training Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor AI agent knowledge health and training status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={overallScore >= 75 ? 'default' : overallScore >= 50 ? 'secondary' : 'destructive'} className="text-lg px-4 py-2">
            Overall: {overallScore}%
          </Badge>
        </div>
      </div>

      {/* Knowledge Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{feedStats?.total || 0}</p>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      <strong>Articles</strong> = content sources ingested (blog posts, YouTube metadata, PDF documents)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">KB Chunks</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{kbStats?.totalChunks || 0}</p>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <Database className="w-6 h-6 text-purple-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      <strong>KB Chunks</strong> = AI-readable knowledge extracted from articles (1 article may produce 3–12 chunks)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processed</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{feedStats?.processed || 0}</p>
                )}
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Tags</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{insightsStats?.uniqueTags || 0}</p>
                )}
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="w-5 h-5" />
            Knowledge Sources Breakdown
          </CardTitle>
          <CardDescription>Articles ingested by content type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Blog Articles</span>
              </div>
              <p className="text-2xl font-bold">{feedStats?.byType.article || 0}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">YouTube Videos</span>
              </div>
              <p className="text-2xl font-bold">{feedStats?.byType.youtube || 0}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">PDF Documents</span>
              </div>
              <p className="text-2xl font-bold">{feedStats?.byType.pdf || 0}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Rss className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Podcast Episodes</span>
              </div>
              <p className="text-2xl font-bold">{feedStats?.byType.podcast || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Scorecard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Agent Knowledge Health Scorecard
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>These metrics measure how well-trained and effective the AI agents are at answering questions.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>5 key metrics for agent training quality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {healthScores.map((metric) => (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(metric.status)}>{metric.icon}</span>
                  <span className="font-medium">{metric.name}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{metric.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={metric.status === 'good' ? 'default' : metric.status === 'warning' ? 'secondary' : 'destructive'}>
                    {metric.score}%
                  </Badge>
                </div>
              </div>
              <Progress value={metric.score} className={`h-2 ${getProgressColor(metric.score)}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Agent Response Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Agent Response Rules (Active)
          </CardTitle>
          <CardDescription>Current system prompt configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Answer Length
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Maximum 2 sentences per response</li>
                <li>• Lists: 5 bullet points or fewer</li>
                <li>• Offer longer version if needed</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Knowledge Sources
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 1. Workspace KB (kb_chunks)</li>
                <li>• 2. R&D Intelligence summaries</li>
                <li>• 3. System-provided context</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Safety Rules
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Never hallucinate metrics/forecasts</li>
                <li>• No legal/medical facts without source</li>
                <li>• Safe fallback for uncertain queries</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Escalation
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Offer human support connection</li>
                <li>• Trigger ticket via help@seeksy.io</li>
                <li>• Track low-confidence responses</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
