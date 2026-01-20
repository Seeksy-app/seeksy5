import { useState, useEffect } from 'react';
import { 
  Newspaper, 
  RefreshCw, 
  Loader2, 
  Target, 
  TrendingUp, 
  Shield, 
  CheckCircle2,
  Mail,
  Bell,
  BellOff,
  Sparkles,
  Calendar,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Brief {
  id: string;
  brief_date: string;
  audience_type: string;
  title: string;
  summary: string;
  competitive_insights: Array<{ competitor: string; insight: string; impact: string }>;
  market_trends: Array<{ trend: string; implication: string }>;
  strategy_assessment: { seeksy_position?: string; opportunities?: string[]; threats?: string[] };
  action_items: Array<{ priority: number; action: string; rationale: string }>;
  sources: Array<{ url: string; title: string }>;
  created_at: string;
}

interface Competitor {
  id: string;
  name: string;
  website_url: string;
  category: string;
  tracking_enabled: boolean;
  last_scraped_at: string | null;
}

export default function DailyBriefPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<string>('ceo');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch briefs
      const { data: briefsData, error: briefsError } = await supabase
        .from('daily_briefs')
        .select('*')
        .order('brief_date', { ascending: false })
        .limit(30);

      if (briefsError) throw briefsError;
      setBriefs((briefsData || []) as unknown as Brief[]);

      // Fetch competitors
      const { data: competitorsData, error: competitorsError } = await supabase
        .from('competitor_profiles')
        .select('*')
        .order('name');

      if (competitorsError) throw competitorsError;
      setCompetitors(competitorsData || []);

      // Check subscription status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subData } = await supabase
          .from('brief_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('audience_type', selectedAudience)
          .maybeSingle();

        setIsSubscribed(subData?.is_active || false);
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAudience]);

  const generateBrief = async (audienceType: string) => {
    setIsGenerating(true);
    try {
      toast({ title: 'Scraping competitors...', description: 'Gathering latest market intelligence' });
      await supabase.functions.invoke('scrape-competitors');

      toast({ title: 'Generating brief...', description: 'AI is analyzing the data' });
      const { data, error } = await supabase.functions.invoke('generate-daily-brief', {
        body: { audienceType }
      });

      if (error) throw error;

      toast({ title: 'Brief generated!', description: 'Your daily competitive intelligence is ready' });
      fetchData();
    } catch (error: any) {
      console.error('Failed to generate brief:', error);
      toast({ title: 'Generation failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Please sign in', variant: 'destructive' });
        return;
      }

      // Toggle the subscription (opt-out system - default enabled)
      const { data: existing } = await supabase
        .from('brief_subscriptions')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('audience_type', selectedAudience)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('brief_subscriptions')
          .update({ is_active: !existing.is_active })
          .eq('id', existing.id);
        setIsSubscribed(!existing.is_active);
      } else {
        // First time - create subscription (enabled by default for opt-out)
        await supabase
          .from('brief_subscriptions')
          .insert({
            user_id: user.id,
            audience_type: selectedAudience,
            is_active: true
          });
        setIsSubscribed(true);
      }
      toast({ 
        title: isSubscribed ? 'Unsubscribed' : 'Subscribed!',
        description: isSubscribed 
          ? 'You will no longer receive email briefs' 
          : 'You will receive daily briefs via email'
      });
    } catch (error: any) {
      toast({ title: 'Failed to update subscription', variant: 'destructive' });
    }
  };

  const todaysBrief = briefs.find(
    b => b.brief_date === new Date().toISOString().split('T')[0] && b.audience_type === selectedAudience
  );

  const audienceTypes = [
    { id: 'ceo', label: 'CEO', icon: Building2, description: 'Strategic executive summary' },
    { id: 'board', label: 'Board', icon: Shield, description: 'Governance and risk focus' },
    { id: 'investor', label: 'Investor', icon: TrendingUp, description: 'Market opportunity analysis' },
    { id: 'creator', label: 'Creator', icon: Sparkles, description: 'Platform comparison insights' },
  ];

  const impactColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Newspaper className="w-8 h-8 text-primary" />
              Daily Brief
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered competitive intelligence for your role
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              {isSubscribed ? (
                <Bell className="w-4 h-4 text-primary" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
              <Label htmlFor="email-sub" className="text-sm cursor-pointer">
                Email me daily
              </Label>
              <Switch
                id="email-sub"
                checked={isSubscribed}
                onCheckedChange={toggleSubscription}
              />
            </div>
            <Button
              onClick={() => generateBrief(selectedAudience)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Generate Today's Brief
            </Button>
          </div>
        </div>

        {/* Audience Selector */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {audienceTypes.map((audience) => {
            const Icon = audience.icon;
            const isSelected = selectedAudience === audience.id;
            return (
              <Card
                key={audience.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedAudience(audience.id)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{audience.label}</h3>
                    <p className="text-xs text-muted-foreground">{audience.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Brief Content */}
          <div className="col-span-2 space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : todaysBrief ? (
              <>
                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{todaysBrief.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(todaysBrief.brief_date), 'EEEE, MMMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-primary/10">
                        {selectedAudience.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{todaysBrief.summary}</p>
                  </CardContent>
                </Card>

                {/* Detailed Tabs */}
                <Card>
                  <CardContent className="pt-6">
                    <Tabs defaultValue="insights">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="insights">
                          <Target className="w-4 h-4 mr-2" />
                          Insights
                        </TabsTrigger>
                        <TabsTrigger value="trends">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Trends
                        </TabsTrigger>
                        <TabsTrigger value="position">
                          <Shield className="w-4 h-4 mr-2" />
                          Position
                        </TabsTrigger>
                        <TabsTrigger value="actions">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Actions
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="insights" className="mt-6 space-y-4">
                        {todaysBrief.competitive_insights?.map((insight, i) => (
                          <div key={i} className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">{insight.competitor}</span>
                              <Badge 
                                variant="outline" 
                                className={impactColors[insight.impact as keyof typeof impactColors]}
                              >
                                {insight.impact} impact
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.insight}</p>
                          </div>
                        ))}
                      </TabsContent>

                      <TabsContent value="trends" className="mt-6 space-y-4">
                        {todaysBrief.market_trends?.map((trend, i) => (
                          <div key={i} className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium mb-1">{trend.trend}</h4>
                            <p className="text-sm text-muted-foreground">{trend.implication}</p>
                          </div>
                        ))}
                      </TabsContent>

                      <TabsContent value="position" className="mt-6 space-y-4">
                        {todaysBrief.strategy_assessment?.seeksy_position && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium mb-2">Current Position</h4>
                            <p className="text-sm text-muted-foreground">
                              {todaysBrief.strategy_assessment.seeksy_position}
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          {todaysBrief.strategy_assessment?.opportunities?.length > 0 && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                              <h4 className="font-medium text-emerald-800 mb-2">Opportunities</h4>
                              <ul className="list-disc list-inside text-sm text-emerald-700 space-y-1">
                                {todaysBrief.strategy_assessment.opportunities.map((opp, i) => (
                                  <li key={i}>{opp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {todaysBrief.strategy_assessment?.threats?.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <h4 className="font-medium text-red-800 mb-2">Threats</h4>
                              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                {todaysBrief.strategy_assessment.threats.map((threat, i) => (
                                  <li key={i}>{threat}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="actions" className="mt-6 space-y-4">
                        {todaysBrief.action_items
                          ?.sort((a, b) => a.priority - b.priority)
                          .map((action, i) => (
                            <div key={i} className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                              <Badge variant="outline" className="shrink-0">P{action.priority}</Badge>
                              <div>
                                <h4 className="font-medium">{action.action}</h4>
                                <p className="text-sm text-muted-foreground">{action.rationale}</p>
                              </div>
                            </div>
                          ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Brief for Today</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Generate today's competitive intelligence brief to get AI-powered insights tailored to your role.
                  </p>
                  <Button onClick={() => generateBrief(selectedAudience)} disabled={isGenerating}>
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate Brief
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Competitors Being Tracked */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tracked Competitors</CardTitle>
                <CardDescription>Platforms we monitor daily</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {competitors.map((competitor) => (
                  <div key={competitor.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{competitor.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {competitor.category.replace('_', ' ')}
                      </p>
                    </div>
                    <Badge variant={competitor.tracking_enabled ? 'default' : 'secondary'}>
                      {competitor.tracking_enabled ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Briefs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Briefs</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {briefs
                  .filter(b => b.audience_type === selectedAudience)
                  .slice(0, 7)
                  .map((brief) => (
                    <div 
                      key={brief.id} 
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <span className="text-sm">
                        {format(new Date(brief.brief_date), 'MMM d')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {brief.competitive_insights?.length || 0} insights
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
