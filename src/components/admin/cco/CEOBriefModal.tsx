import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, AlertTriangle, TrendingUp, MessageCircle, 
  Calendar, Copy, Loader2, Sparkles, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface CEOBriefModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CEOBriefData {
  situationalAwareness: string;
  currentSentiment: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    summary: string;
  };
  crisisAlerts: Array<{
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: string;
  }>;
  priorityMediaActions: string[];
  communicationsSummary: string;
  upcomingRisks: Array<{
    risk: string;
    recommendedStatement: string;
  }>;
}

export const CEOBriefModal = ({ open, onOpenChange }: CEOBriefModalProps) => {
  const [generating, setGenerating] = useState(false);
  const [briefData, setBriefData] = useState<CEOBriefData | null>(null);

  const generateBrief = async () => {
    setGenerating(true);
    
    // Simulate AI generation with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBriefData({
      situationalAwareness: `As of ${new Date().toLocaleDateString()}, Seeksy is experiencing steady growth with 12% MoM creator acquisition. Platform sentiment is positive (72%) with minor concerns around upload speeds. No active crises. Q1 investor update preparations are on track.`,
      currentSentiment: {
        score: 72,
        trend: 'up',
        summary: 'Community sentiment has improved 8% since last week, driven by positive reception of AI clip features.',
      },
      crisisAlerts: [
        { title: 'Upload timeout issues', severity: 'medium', status: 'Monitoring - 90% resolved' },
      ],
      priorityMediaActions: [
        'Finalize Q1 press release draft by Friday',
        'Schedule creator success story for social media',
        'Prepare investor FAQ document',
      ],
      communicationsSummary: 'Sent 3 creator newsletters (68% open rate), 2 advertiser updates. Active support tickets: 23 (avg resolution: 4 hours).',
      upcomingRisks: [
        {
          risk: 'Potential negative coverage if upload issues persist',
          recommendedStatement: 'We have identified the root cause and are implementing a permanent fix. Affected creators will receive priority support.',
        },
        {
          risk: 'Competitor feature launch next week',
          recommendedStatement: 'Our AI-powered features continue to lead the industry in quality and ease of use. We remain focused on creator success.',
        },
      ],
    });
    
    setGenerating(false);
  };

  const copyBrief = () => {
    if (!briefData) return;
    
    const text = `CEO BRIEF - ${new Date().toLocaleDateString()}

SITUATIONAL AWARENESS:
${briefData.situationalAwareness}

CURRENT SENTIMENT: ${briefData.currentSentiment.score}% (${briefData.currentSentiment.trend})
${briefData.currentSentiment.summary}

CRISIS ALERTS:
${briefData.crisisAlerts.map(a => `• [${a.severity.toUpperCase()}] ${a.title} - ${a.status}`).join('\n')}

PRIORITY MEDIA ACTIONS:
${briefData.priorityMediaActions.map(a => `• ${a}`).join('\n')}

COMMUNICATIONS SUMMARY:
${briefData.communicationsSummary}

UPCOMING RISKS & RECOMMENDED STATEMENTS:
${briefData.upcomingRisks.map(r => `Risk: ${r.risk}\nStatement: "${r.recommendedStatement}"`).join('\n\n')}
`;
    
    navigator.clipboard.writeText(text);
    toast.success('CEO Brief copied to clipboard');
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-black',
      low: 'bg-green-500 text-white',
    };
    return colors[severity] || 'bg-gray-500 text-white';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            CEO Communications Brief
          </DialogTitle>
        </DialogHeader>

        {!briefData && !generating && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold mb-2">Generate CEO Brief</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get a 1-page situational awareness summary including sentiment, crisis alerts, 
              priority actions, and recommended statements.
            </p>
            <Button onClick={generateBrief} size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Brief
            </Button>
          </div>
        )}

        {generating && (
          <div className="space-y-4 py-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating CEO Brief...</span>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        )}

        {briefData && !generating && (
          <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={copyBrief}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Brief
              </Button>
              <Button variant="outline" size="sm" onClick={generateBrief}>
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>

            {/* Situational Awareness */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Situational Awareness
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm">{briefData.situationalAwareness}</p>
              </CardContent>
            </Card>

            {/* Current Sentiment */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Current Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-2xl font-bold text-green-600">
                    {briefData.currentSentiment.score}%
                  </span>
                  <Badge variant={briefData.currentSentiment.trend === 'up' ? 'default' : 'secondary'}>
                    {briefData.currentSentiment.trend === 'up' ? '↑ Improving' : 
                     briefData.currentSentiment.trend === 'down' ? '↓ Declining' : '→ Stable'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{briefData.currentSentiment.summary}</p>
              </CardContent>
            </Card>

            {/* Crisis Alerts */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Crisis Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {briefData.crisisAlerts.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">No active crisis alerts</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {briefData.crisisAlerts.map((alert, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          <span className="text-sm font-medium">{alert.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{alert.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Priority Media Actions */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Priority Media Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {briefData.priorityMediaActions.map((action, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Communications Summary */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Communications Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm">{briefData.communicationsSummary}</p>
              </CardContent>
            </Card>

            {/* Upcoming Risks */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Upcoming Risks & Recommended Statements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {briefData.upcomingRisks.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-sm font-medium text-amber-700">{item.risk}</p>
                    <div className="pl-4 border-l-2 border-primary/30">
                      <p className="text-sm italic text-muted-foreground">
                        "{item.recommendedStatement}"
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
