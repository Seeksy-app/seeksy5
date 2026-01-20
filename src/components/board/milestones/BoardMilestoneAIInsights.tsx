import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Milestone, calculateProgress } from '@/hooks/useMilestones';
import { Sparkles, AlertTriangle, CheckCircle, HelpCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BoardMilestoneAIInsightsProps {
  milestones: Milestone[];
}

interface AIInsights {
  statusSummary: string;
  risks: string[];
  progressCommentary: string;
  questionsForCEO: string[];
  recommendedActions: string[];
}

export function BoardMilestoneAIInsights({ milestones }: BoardMilestoneAIInsightsProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = async () => {
    setIsLoading(true);
    
    try {
      const overdueMilestones = milestones.filter(m => {
        if (!m.due_date) return false;
        return new Date(m.due_date) < new Date() && m.status !== 'completed';
      });
      
      const blockedMilestones = milestones.filter(m => m.status === 'blocked');
      const atRiskMilestones = milestones.filter(m => m.status === 'at_risk');
      
      const metricGaps = milestones
        .filter(m => m.progress_type === 'metric' && m.metric_target && m.metric_current)
        .map(m => ({
          title: m.title,
          gap: (m.metric_target || 0) - (m.metric_current || 0),
          progress: calculateProgress(m),
        }));
      
      const prompt = `Analyze these company milestones and provide strategic insights for the Board:

MILESTONES OVERVIEW:
- Total: ${milestones.length}
- Completed: ${milestones.filter(m => m.status === 'completed').length}
- In Progress: ${milestones.filter(m => m.status === 'in_progress').length}
- At Risk: ${atRiskMilestones.length}
- Blocked: ${blockedMilestones.length}
- Overdue: ${overdueMilestones.length}

OVERDUE MILESTONES:
${overdueMilestones.map(m => `- ${m.title} (${m.category})`).join('\n') || 'None'}

BLOCKED MILESTONES:
${blockedMilestones.map(m => `- ${m.title} (${m.category})`).join('\n') || 'None'}

AT-RISK MILESTONES:
${atRiskMilestones.map(m => `- ${m.title} (${m.category})`).join('\n') || 'None'}

METRIC GAPS:
${metricGaps.map(m => `- ${m.title}: ${m.gap.toLocaleString()} gap (${m.progress}% complete)`).join('\n') || 'No metric-based milestones'}

Provide a JSON response with these fields:
{
  "statusSummary": "2-3 sentence executive summary of milestone health",
  "risks": ["List 2-3 key risks or concerns"],
  "progressCommentary": "2-3 sentences on overall progress and velocity",
  "questionsForCEO": ["2-3 strategic questions the Board should ask the CEO"],
  "recommendedActions": ["2-3 recommended actions for the Board to consider"]
}`;

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [{ role: 'user', content: prompt }],
          model: 'google/gemini-2.5-flash',
        },
      });

      if (error) throw error;

      const content = data?.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setInsights(parsed);
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      console.error('AI insights error:', error);
      toast.error('Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  };

  if (!insights && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={generateInsights} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate AI Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Insights
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={generateInsights}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Summary */}
        <div>
          <h4 className="font-medium mb-2">Executive Summary</h4>
          <p className="text-sm text-muted-foreground">{insights?.statusSummary}</p>
        </div>

        {/* Risks */}
        {insights?.risks && insights.risks.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Key Risks
            </h4>
            <ul className="space-y-1">
              {insights.risks.map((risk, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress Commentary */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Progress Commentary
          </h4>
          <p className="text-sm text-muted-foreground">{insights?.progressCommentary}</p>
        </div>

        {/* Questions for CEO */}
        {insights?.questionsForCEO && insights.questionsForCEO.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              Questions for CEO
            </h4>
            <ul className="space-y-1">
              {insights.questionsForCEO.map((q, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-600 mt-1">{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Actions */}
        {insights?.recommendedActions && insights.recommendedActions.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              Recommended Board Actions
            </h4>
            <ul className="space-y-1">
              {insights.recommendedActions.map((action, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">→</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
