import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Star, TrendingUp, Loader2, Download, Share2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { WIPValueBars } from '@/components/wip/WIPValueBars';
import { WIPScoreResult, WIPNeed, WIPValue } from '@/types/wip';

/**
 * Calculate the O*NET scaled score from database values
 * Uses the min-max normalization approach: normalize raw to [-1,+1] then scale to [-4,+4]
 */
function calculateScaledScore(rawScore: number, minPossible: number, maxPossible: number): number {
  if (maxPossible === minPossible) return 0;
  const normalized = 2 * ((rawScore - minPossible) / (maxPossible - minPossible)) - 1;
  return normalized * 4;
}

export default function WIPResults() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const [showAllNeeds, setShowAllNeeds] = useState(false);

  // Fetch assessment data
  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ['wip-assessment', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wip_assessment')
        .select('*')
        .eq('id', assessmentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!assessmentId,
  });

  // Fetch need scores with value data
  const { data: needScores = [], isLoading: needScoresLoading } = useQuery({
    queryKey: ['wip-need-scores', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wip_need_score')
        .select(`
          *,
          need:wip_need(*, value:wip_value(*))
        `)
        .eq('assessment_id', assessmentId)
        .order('std_score_0_100', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!assessmentId,
  });

  // Fetch value scores
  const { data: valueScores = [], isLoading: valueScoresLoading } = useQuery({
    queryKey: ['wip-value-scores', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wip_value_score')
        .select(`
          *,
          value:wip_value(*)
        `)
        .eq('assessment_id', assessmentId)
        .order('std_score_0_100', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!assessmentId,
  });

  const isLoading = assessmentLoading || needScoresLoading || valueScoresLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!assessment || valueScores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Assessment not found or not yet completed.</p>
            <Button className="mt-4" onClick={() => navigate('/workready360/wip')}>
              Start New Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build score result for WIPValueBars component
  const scoreResult: WIPScoreResult = {
    needScores: needScores.map((ns: any) => {
      const rawScoreScaled = calculateScaledScore(ns.raw_score, ns.min_possible, ns.max_possible);
      return {
        need: ns.need as WIPNeed,
        rawScore: ns.raw_score,
        rawScoreScaled,
        stdScore: ns.std_score_0_100,
        appearances: ns.appearances,
        relativeScoreNorm: rawScoreScaled / 4, // Back-calculate from scaled score
      };
    }),
    valueScores: valueScores.map((vs: any) => ({
      value: vs.value as WIPValue,
      rawSum: vs.raw_sum,
      rawMean: vs.raw_mean,
      stdScore: vs.std_score_0_100,
      needCount: 0,
    })),
  };

  const topValues = valueScores.slice(0, 3);
  const topNeeds = needScores.slice(0, 5);

  // Group needs by value for the "All Needs" view
  const needsByValue: Record<string, any[]> = {};
  needScores.forEach((ns: any) => {
    const valueCode = ns.need?.value?.code || 'Unknown';
    if (!needsByValue[valueCode]) {
      needsByValue[valueCode] = [];
    }
    needsByValue[valueCode].push(ns);
  });

  // Sort values by their aggregate score
  const sortedValueCodes = Object.keys(needsByValue).sort((a, b) => {
    const aScore = valueScores.find((v: any) => v.value.code === a)?.std_score_0_100 || 0;
    const bScore = valueScores.find((v: any) => v.value.code === b)?.std_score_0_100 || 0;
    return bScore - aScore;
  });

  const VALUE_DESCRIPTIONS: Record<string, string> = {
    ACHIEVEMENT: 'You thrive when you can use your abilities and see results from your efforts.',
    RECOGNITION: 'You value advancement opportunities, leadership, and being recognized for your contributions.',
    INDEPENDENCE: 'You prefer working autonomously, making your own decisions, and expressing creativity.',
    WORKING_CONDITIONS: 'You prioritize job security, good pay, variety, and comfortable working environments.',
    RELATIONSHIPS: 'You value working with supportive co-workers and contributing to others\' well-being.',
    SUPPORT: 'You appreciate supervisors who provide guidance, training, and advocate for their team.',
  };

  const VALUE_LABELS: Record<string, string> = {
    ACHIEVEMENT: 'Achievement',
    RECOGNITION: 'Recognition',
    INDEPENDENCE: 'Independence',
    WORKING_CONDITIONS: 'Working Conditions',
    RELATIONSHIPS: 'Relationships',
    SUPPORT: 'Support',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/workready360')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Your Work Values Profile</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Based on your responses, here's what matters most to you in a career.
            Use these insights to find roles that align with your values.
          </p>
        </motion.div>

        {/* Top Values Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {topValues.map((vs: any, index: number) => (
            <motion.div
              key={vs.value.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={index === 0 ? 'border-primary border-2' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                    <span className="text-2xl font-bold text-primary font-mono">
                      {Number(vs.std_score_0_100).toFixed(2)}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{vs.value.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {VALUE_DESCRIPTIONS[vs.value.code] || vs.value.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Detailed Results Tabs */}
        <Tabs defaultValue="values" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="values">All Values</TabsTrigger>
            <TabsTrigger value="needs">All 21 Needs</TabsTrigger>
            <TabsTrigger value="careers">Career Matches</TabsTrigger>
          </TabsList>

          <TabsContent value="values">
            <Card>
              <CardHeader>
                <CardTitle>Your 6 Work Values</CardTitle>
                <CardDescription>
                  Scores range from 0-100, with higher scores indicating greater importance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WIPValueBars scores={scoreResult} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="needs">
            <Card>
              <CardHeader>
                <CardTitle>Your Full Scores</CardTitle>
                <CardDescription>
                  All 21 work needs ranked from -4 (least important) to +4 (most important), grouped by their parent value.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Top 5 Needs First */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-lg">Your Top 5 Work Needs</h3>
                  <p className="text-sm text-muted-foreground">These are the specific aspects of work that matter most to you.</p>
                  {topNeeds.map((ns: any, index: number) => (
                    <motion.div
                      key={ns.need.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Star className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{ns.need.label}</span>
                          <span className="text-sm font-mono font-semibold">
                            {calculateScaledScore(ns.raw_score, ns.min_possible, ns.max_possible).toFixed(2)}
                          </span>
                        </div>
                        <Progress value={ns.std_score_0_100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {ns.need.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* View All Needs Button */}
                <Button 
                  variant="outline" 
                  className="w-full bg-amber-50 border-primary hover:bg-amber-100"
                  onClick={() => setShowAllNeeds(!showAllNeeds)}
                >
                  {showAllNeeds ? 'Hide' : 'View all 21 needs'}
                  <TrendingUp className="h-4 w-4 ml-2" />
                </Button>

                {/* All Needs Grouped by Value */}
                <AnimatePresence>
                  {showAllNeeds && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {sortedValueCodes.map((valueCode) => {
                        const valueData = valueScores.find((v: any) => v.value.code === valueCode);
                        const valueNeeds = needsByValue[valueCode] || [];
                        // Sort needs within value by score descending
                        const sortedNeeds = [...valueNeeds].sort((a, b) => b.std_score_0_100 - a.std_score_0_100);
                        
                        return (
                          <Collapsible key={valueCode} defaultOpen>
                            <CollapsibleTrigger className="w-full">
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-primary underline">
                                    {VALUE_LABELS[valueCode] || valueCode}
                                  </span>
                                  <Badge variant="outline" className="ml-2">
                                    {sortedNeeds.length} needs
                                  </Badge>
                                </div>
                                <ChevronDown className="h-4 w-4" />
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="pl-4 pt-2 space-y-2">
                                {sortedNeeds.map((ns: any) => (
                                  <div key={ns.need.id} className="flex items-center justify-between py-1">
                                    <div className="flex-1">
                                      <span className="font-medium">{ns.need.label}:</span>
                                      <span className="text-muted-foreground text-sm ml-2">
                                        {ns.need.description}
                                      </span>
                                    </div>
                                    <span className="font-mono font-semibold text-sm min-w-[60px] text-right">
                                      {calculateScaledScore(ns.raw_score, ns.min_possible, ns.max_possible).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="careers">
            <Card>
              <CardHeader>
                <CardTitle>Matching Careers</CardTitle>
                <CardDescription>
                  Career matches will be available once O*NET occupation profiles are loaded.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Career matching coming soon</p>
                  <p className="text-sm mt-2">
                    We'll show you occupations that align with your work values,
                    grouped by Job Zone (education/experience level).
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button size="lg" onClick={() => navigate('/workready360/wip')}>
            Take Again
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/workready360')}>
            Back to WorkReady360
          </Button>
        </div>
      </main>
    </div>
  );
}
