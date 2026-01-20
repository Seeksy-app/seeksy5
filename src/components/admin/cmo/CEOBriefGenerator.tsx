import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, Sparkles, AlertTriangle, TrendingUp, CheckCircle2,
  DollarSign, Target, Send, Copy, Download, Loader2, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface CEOBrief {
  topRisks: { title: string; impact: string; mitigation: string }[];
  topWins: { title: string; impact: string }[];
  pipelineForecast: { metric: string; value: string; trend: string }[];
  requiredDecisions: { title: string; options: string[]; deadline: string }[];
  budgetRecommendations: { area: string; current: string; recommended: string; reason: string }[];
  sprintSummary: string;
  executiveMessage: string;
}

export function CEOBriefGenerator() {
  const [generating, setGenerating] = useState(false);
  const [brief, setBrief] = useState<CEOBrief | null>(null);

  const generateBrief = async () => {
    setGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setBrief({
      topRisks: [
        { title: "Rising CAC on Paid Channels", impact: "CAC increased 12% MoM on paid social", mitigation: "Reallocate 20% budget to organic and referral channels" },
        { title: "Competitor Feature Parity", impact: "Riverside launched AI clips feature", mitigation: "Accelerate voice certification rollout as differentiator" },
        { title: "Churn Spike in Mid-Tier", impact: "4.8% churn vs 4.2% baseline", mitigation: "Launch targeted retention campaign for mid-tier creators" }
      ],
      topWins: [
        { title: "TikTok Migration Campaign", impact: "+340 new creators (28% above target)" },
        { title: "Organic Search Growth", impact: "+45% organic traffic, CAC down to $22" },
        { title: "Enterprise Pipeline", impact: "3 enterprise deals in negotiation ($85K total)" }
      ],
      pipelineForecast: [
        { metric: "MRR End of Month", value: "$127,500", trend: "+8.2%" },
        { metric: "New Creator Target", value: "450 / 500", trend: "90% to goal" },
        { metric: "Pipeline Value", value: "$185,000", trend: "+22% MoM" }
      ],
      requiredDecisions: [
        { title: "Q2 Marketing Budget Allocation", options: ["Increase paid 20%", "Maintain current", "Shift to partnerships"], deadline: "Jan 20" },
        { title: "Enterprise Pricing Tier", options: ["Launch at $299/mo", "Launch at $499/mo", "Delay to Q2"], deadline: "Jan 25" }
      ],
      budgetRecommendations: [
        { area: "Paid Social", current: "$15,000", recommended: "$12,000", reason: "CAC trending up, diminishing returns" },
        { area: "Content/SEO", current: "$8,000", recommended: "$11,000", reason: "Organic CAC 40% lower than paid" },
        { area: "Events", current: "$5,000", recommended: "$7,000", reason: "High conversion rate from event leads" }
      ],
      sprintSummary: "This month focused on creator acquisition through the TikTok migration campaign and enterprise pipeline development. Key achievement: organic search now drives 35% of new signups. Next 30 days: launch retention campaign, finalize enterprise tier, and prepare Q1 investor update.",
      executiveMessage: "We're seeing strong momentum in creator acquisition with organic channels outperforming paid. The TikTok uncertainty is creating a window of opportunity that we're capitalizing on. Key focus for the next sprint is converting enterprise pipeline and addressing mid-tier churn before it becomes a larger issue. Recommend board presentation include the voice certification roadmap as a key differentiator story."
    });
    
    setGenerating(false);
    toast.success("CEO Brief generated successfully");
  };

  const copyToClipboard = () => {
    if (!brief) return;
    // Format brief as text
    const text = `CEO GTM BRIEF - ${new Date().toLocaleDateString()}

TOP RISKS:
${brief.topRisks.map(r => `• ${r.title}: ${r.impact}`).join('\n')}

TOP WINS:
${brief.topWins.map(w => `• ${w.title}: ${w.impact}`).join('\n')}

PIPELINE FORECAST:
${brief.pipelineForecast.map(p => `• ${p.metric}: ${p.value} (${p.trend})`).join('\n')}

30-DAY SUMMARY:
${brief.sprintSummary}

EXECUTIVE MESSAGE:
${brief.executiveMessage}`;
    
    navigator.clipboard.writeText(text);
    toast.success("Brief copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI-Powered CEO Brief Generator
          </CardTitle>
          <CardDescription>
            Generate a comprehensive executive summary of marketing performance, risks, and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={generateBrief} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate CEO Brief
                </>
              )}
            </Button>
            {brief && (
              <>
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Send to CEO
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {brief && (
        <>
          {/* Top Risks & Wins */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Top Risks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {brief.topRisks.map((risk, idx) => (
                  <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="font-medium text-sm">{risk.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{risk.impact}</p>
                    <p className="text-sm text-red-700 mt-2">
                      <span className="font-medium">Mitigation:</span> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  Top Wins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {brief.topWins.map((win, idx) => (
                  <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="font-medium text-sm">{win.title}</p>
                    <p className="text-sm text-green-700 mt-1">{win.impact}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Pipeline Forecast */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Pipeline Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {brief.pipelineForecast.map((item, idx) => (
                  <div key={idx} className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.metric}</p>
                    <Badge variant="outline" className="mt-2">{item.trend}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Required Decisions */}
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Target className="h-5 w-5" />
                Required CEO Decisions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {brief.requiredDecisions.map((decision, idx) => (
                <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">{decision.title}</p>
                    <Badge variant="outline">Due: {decision.deadline}</Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {decision.options.map((option, oidx) => (
                      <Badge key={oidx} variant="secondary">{option}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Budget Recommendations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Reallocation Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {brief.budgetRecommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{rec.area}</p>
                      <p className="text-sm text-muted-foreground">{rec.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm line-through text-muted-foreground">{rec.current}</p>
                      <p className="font-bold text-green-600">{rec.recommended}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sprint Summary & Executive Message */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">30-Day Sprint Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{brief.sprintSummary}</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Executive Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{brief.executiveMessage}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
