import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  RefreshCw, 
  Target, 
  TrendingUp, 
  Shield, 
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DailyBriefModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audienceType: 'ceo' | 'board' | 'investor' | 'creator';
}

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
}

export function DailyBriefModal({ open, onOpenChange, audienceType }: DailyBriefModalProps) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const fetchBrief = async () => {
    setIsLoading(true);
    try {
      // Use local timezone date (not UTC)
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from('daily_briefs')
        .select('*')
        .eq('brief_date', today)
        .eq('audience_type', audienceType)
        .maybeSingle();

      if (error) throw error;
      setBrief(data as unknown as Brief | null);
    } catch (error: any) {
      console.error('Failed to fetch brief:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBrief = async () => {
    setIsGenerating(true);
    try {
      // First scrape competitors
      toast({ title: 'Scraping competitors...', description: 'Gathering latest market intelligence' });
      
      await supabase.functions.invoke('scrape-competitors');

      // Then generate brief
      toast({ title: 'Generating brief...', description: 'AI is analyzing the data' });
      
      const { data, error } = await supabase.functions.invoke('generate-daily-brief', {
        body: { audienceType }
      });

      if (error) throw error;

      setBrief(data.brief);
      toast({ title: 'Brief generated!', description: 'Your daily competitive intelligence is ready' });
    } catch (error: any) {
      console.error('Failed to generate brief:', error);
      toast({ 
        title: 'Generation failed', 
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBrief();
    }
  }, [open, audienceType]);

  const audienceLabels = {
    ceo: 'CEO',
    board: 'Board',
    investor: 'Investor',
    creator: 'Creator'
  };

  const impactColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {audienceLabels[audienceType]} Daily Brief
              </DialogTitle>
              <DialogDescription>
                {brief ? format(new Date(brief.brief_date + 'T12:00:00'), 'EEEE, MMMM d, yyyy') : 'Competitive Intelligence'}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateBrief}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Refresh'}
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(85vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !brief ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Brief Available</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Generate today's competitive intelligence brief to get AI-powered insights about your market.
              </p>
              <Button onClick={generateBrief} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Brief
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <h3 className="font-semibold text-lg mb-2">{brief.title}</h3>
                <p className="text-muted-foreground">{brief.summary}</p>
              </div>

              <Tabs defaultValue="insights" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="insights" className="text-xs">
                    <Target className="w-3 h-3 mr-1" />
                    Insights
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trends
                  </TabsTrigger>
                  <TabsTrigger value="position" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Position
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Actions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="mt-4 space-y-3">
                  {brief.competitive_insights?.length > 0 ? (
                    brief.competitive_insights.map((insight, i) => (
                      <div key={i} className="bg-white border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{insight.competitor}</span>
                              <Badge 
                                variant="outline" 
                                className={impactColors[insight.impact as keyof typeof impactColors] || impactColors.medium}
                              >
                                {insight.impact}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{insight.insight}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No competitive insights available</p>
                  )}
                </TabsContent>

                <TabsContent value="trends" className="mt-4 space-y-3">
                  {brief.market_trends?.length > 0 ? (
                    brief.market_trends.map((trend, i) => (
                      <div key={i} className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium mb-1">{trend.trend}</h4>
                        <p className="text-sm text-muted-foreground">{trend.implication}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No market trends available</p>
                  )}
                </TabsContent>

                <TabsContent value="position" className="mt-4 space-y-4">
                  {brief.strategy_assessment?.seeksy_position && (
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Seeksy's Position</h4>
                      <p className="text-sm text-muted-foreground">{brief.strategy_assessment.seeksy_position}</p>
                    </div>
                  )}
                  
                  {brief.strategy_assessment?.opportunities?.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <h4 className="font-medium text-emerald-800 mb-2">Opportunities</h4>
                      <ul className="list-disc list-inside text-sm text-emerald-700 space-y-1">
                        {brief.strategy_assessment.opportunities.map((opp, i) => (
                          <li key={i}>{opp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {brief.strategy_assessment?.threats?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Threats</h4>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {brief.strategy_assessment.threats.map((threat, i) => (
                          <li key={i}>{threat}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="mt-4 space-y-3">
                  {brief.action_items?.length > 0 ? (
                    brief.action_items
                      .sort((a, b) => a.priority - b.priority)
                      .map((action, i) => (
                        <div key={i} className="bg-white border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="shrink-0">P{action.priority}</Badge>
                            <div>
                              <h4 className="font-medium">{action.action}</h4>
                              <p className="text-sm text-muted-foreground">{action.rationale}</p>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No action items available</p>
                  )}
                </TabsContent>
              </Tabs>

              {/* Sources */}
              {brief.sources?.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {brief.sources.slice(0, 5).map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {source.title?.substring(0, 40)}...
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
