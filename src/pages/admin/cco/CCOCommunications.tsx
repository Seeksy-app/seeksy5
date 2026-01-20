import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, AlertTriangle, TrendingUp, TrendingDown, Minus,
  FileText, Megaphone, Shield, Users, Send, RefreshCw, Sparkles,
  ChevronRight, Clock, Edit, Eye, CheckCircle2, AlertCircle,
  Smile, Meh, Frown, Copy, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CEOBriefModal } from "@/components/admin/cco/CEOBriefModal";
import { SystemHealthBanner } from "@/components/debug/SystemHealthBanner";

interface SentimentData {
  source: string;
  positive: number;
  neutral: number;
  negative: number;
  trend: 'up' | 'down' | 'flat';
}

interface CrisisEvent {
  id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  affectedUsers: number;
  createdAt: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  type: string;
  tone: string;
  usageCount: number;
}

interface BrandNarrative {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: string;
}

export default function CCOCommunications() {
  const [activeTab, setActiveTab] = useState("sentiment");
  const [generatingContent, setGeneratingContent] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState("");
  const [ceoBriefOpen, setCeoBriefOpen] = useState(false);

  // Demo sentiment data
  const sentimentData: SentimentData[] = [
    { source: "Support Tickets", positive: 42, neutral: 38, negative: 20, trend: 'up' },
    { source: "Platform Feedback", positive: 58, neutral: 28, negative: 14, trend: 'up' },
    { source: "Advertiser Feedback", positive: 65, neutral: 25, negative: 10, trend: 'flat' },
    { source: "Social Media", positive: 45, neutral: 35, negative: 20, trend: 'down' },
  ];

  // Demo crisis events
  const crisisEvents: CrisisEvent[] = [
    { id: "1", title: "Studio upload timeout issues", type: "technical", severity: "medium", status: "monitoring", affectedUsers: 127, createdAt: "2024-01-15T10:30:00Z" },
    { id: "2", title: "Payment processing delay", type: "billing", severity: "high", status: "resolved", affectedUsers: 45, createdAt: "2024-01-14T15:20:00Z" },
  ];

  // Demo message templates
  const messageTemplates: MessageTemplate[] = [
    { id: "1", name: "Product Launch Announcement", type: "product_announcement", tone: "excited", usageCount: 12 },
    { id: "2", name: "Service Disruption Notice", type: "crisis", tone: "empathetic", usageCount: 5 },
    { id: "3", name: "Creator Newsletter", type: "creator", tone: "friendly", usageCount: 24 },
    { id: "4", name: "Investor Update", type: "investor", tone: "formal", usageCount: 4 },
    { id: "5", name: "Partner Onboarding", type: "partner", tone: "professional", usageCount: 8 },
  ];

  // Demo brand narratives
  const brandNarratives: BrandNarrative[] = [
    { id: "1", title: "Q1 2024 Press Release", type: "press_release", status: "draft", updatedAt: "2024-01-15" },
    { id: "2", title: "Creator Success Story - TikTok Migration", type: "social_script", status: "approved", updatedAt: "2024-01-14" },
    { id: "3", title: "Series A Positioning Doc", type: "brand_position", status: "review", updatedAt: "2024-01-13" },
  ];

  const overallSentiment = 52; // Demo value

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-black",
      low: "bg-green-500 text-white"
    };
    return colors[severity] || "bg-gray-500 text-white";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-red-100 text-red-800",
      monitoring: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const handleGenerateContent = async (type: string) => {
    setGeneratingContent(true);
    // Simulate AI generation
    setTimeout(() => {
      const templates: Record<string, string> = {
        press: `FOR IMMEDIATE RELEASE

Seeksy Announces Revolutionary AI-Powered Creator Platform

[City, Date] — Seeksy, the leading creator operating system, today announced the launch of its next-generation AI features designed to help creators produce, monetize, and grow their audience more effectively than ever before.

"We're putting the power of professional studio production in every creator's hands," said [CEO Name], CEO of Seeksy. "Our AI tools reduce editing time by 70% while maintaining the authentic voice that audiences love."

Key highlights include:
• AI-powered clip generation from long-form content
• Voice certification and identity protection
• Integrated monetization with dynamic ad insertion
• Cross-platform publishing with one click

For more information, visit seeksy.io.

Media Contact:
press@seeksy.io`,
        crisis: `Subject: Important Update on [Issue]

Dear Seeksy Community,

We want to keep you informed about [specific issue] that some of you may have experienced over the past [timeframe].

What happened:
[Brief, clear explanation]

What we're doing:
• [Action 1]
• [Action 2]
• [Action 3]

What you can expect:
[Timeline and next steps]

We understand this may have caused inconvenience, and we sincerely apologize. Your trust is important to us, and we're committed to making this right.

If you have any questions, please reach out to support@seeksy.io.

Thank you for your patience and understanding.

The Seeksy Team`,
        social: `🎙️ Big news for creators!

We just dropped our biggest update yet:

✨ AI clips that actually understand your content
🎯 Smart monetization that matches you with the right brands
🚀 One-click publishing to 10+ platforms

The future of creator tools is here. Link in bio 👆

#CreatorEconomy #Podcasting #ContentCreator`
      };
      setAiGeneratedContent(templates[type] || "Content generation in progress...");
      setGeneratingContent(false);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            CCO Communications Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified messaging, sentiment monitoring, and crisis management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCeoBriefOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            CEO Brief
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Overall Sentiment Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                {overallSentiment >= 60 ? (
                  <Smile className="h-6 w-6 text-green-500" />
                ) : overallSentiment >= 40 ? (
                  <Meh className="h-6 w-6 text-yellow-500" />
                ) : (
                  <Frown className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium">Community Sentiment Score</p>
                <p className="text-sm text-muted-foreground">Aggregated from all feedback channels</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Progress value={overallSentiment} className="w-48" />
              <span className={`text-2xl font-bold ${overallSentiment >= 60 ? 'text-green-600' : overallSentiment >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                {overallSentiment}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="crisis">Crisis Console</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="narratives">Narratives</TabsTrigger>
          <TabsTrigger value="ai">AI Writer</TabsTrigger>
        </TabsList>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sentiment by Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sentiment by Channel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentimentData.map(item => (
                    <div key={item.source} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.source}</span>
                        {getTrendIcon(item.trend)}
                      </div>
                      <div className="flex h-4 rounded-full overflow-hidden">
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${item.positive}%` }}
                        />
                        <div 
                          className="bg-yellow-500" 
                          style={{ width: `${item.neutral}%` }}
                        />
                        <div 
                          className="bg-red-500" 
                          style={{ width: `${item.negative}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Positive: {item.positive}%</span>
                        <span>Neutral: {item.neutral}%</span>
                        <span>Negative: {item.negative}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { topic: "AI clip quality", sentiment: "positive", mentions: 127 },
                    { topic: "Upload speed", sentiment: "negative", mentions: 45 },
                    { topic: "New studio features", sentiment: "positive", mentions: 89 },
                    { topic: "Mobile app", sentiment: "neutral", mentions: 34 },
                    { topic: "Pricing", sentiment: "mixed", mentions: 56 },
                  ].map(item => (
                    <div key={item.topic} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.topic}</p>
                        <p className="text-xs text-muted-foreground">{item.mentions} mentions</p>
                      </div>
                      <Badge variant={item.sentiment === 'positive' ? 'default' : item.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                        {item.sentiment}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notable Quotes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Notable Community Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { quote: "The AI clips feature saved me 5 hours this week. Game changer!", sentiment: "positive", source: "Creator feedback" },
                  { quote: "Upload times have been slow lately, hope this gets fixed soon.", sentiment: "negative", source: "Support ticket" },
                  { quote: "Love the new studio UI, very intuitive for beginners.", sentiment: "positive", source: "Social media" },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg border ${
                      item.sentiment === 'positive' ? 'bg-green-50 border-green-200' : 
                      item.sentiment === 'negative' ? 'bg-red-50 border-red-200' : 
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <p className="text-sm italic">"{item.quote}"</p>
                    <p className="text-xs text-muted-foreground mt-2">— {item.source}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crisis Console Tab */}
        <TabsContent value="crisis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Crisis Communication Console
              </CardTitle>
              <CardDescription>
                Monitor and respond to platform incidents and crises
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crisisEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="font-medium">All Clear</p>
                    <p className="text-sm">No active crisis events</p>
                  </div>
                ) : (
                  crisisEvents.map(event => (
                    <div key={event.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                            <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                            <Badge variant="outline">{event.type}</Badge>
                          </div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {event.affectedUsers} affected
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(event.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm">
                            <Send className="h-4 w-4 mr-1" />
                            Respond
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Message Templates
                  </CardTitle>
                  <CardDescription>
                    Pre-approved templates for consistent communications
                  </CardDescription>
                </div>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {messageTemplates.map(template => (
                  <div key={template.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{template.type.replace('_', ' ')}</Badge>
                          <Badge variant="secondary">{template.tone}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Used {template.usageCount} times</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Narratives Tab */}
        <TabsContent value="narratives" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    Brand Narratives
                  </CardTitle>
                  <CardDescription>
                    Press releases, social scripts, and positioning documents
                  </CardDescription>
                </div>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  New Narrative
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {brandNarratives.map(narrative => (
                  <div key={narrative.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{narrative.type.replace('_', ' ')}</Badge>
                          <Badge variant={narrative.status === 'approved' ? 'default' : 'secondary'}>
                            {narrative.status}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{narrative.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">Updated {narrative.updatedAt}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button size="sm">View</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Writer Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI Content Writer
              </CardTitle>
              <CardDescription>
                Generate on-brand content with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col"
                  onClick={() => handleGenerateContent('press')}
                  disabled={generatingContent}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Press Release</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col"
                  onClick={() => handleGenerateContent('crisis')}
                  disabled={generatingContent}
                >
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <span>Crisis Response</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col"
                  onClick={() => handleGenerateContent('social')}
                  disabled={generatingContent}
                >
                  <Megaphone className="h-6 w-6 mb-2" />
                  <span>Social Post</span>
                </Button>
              </div>

              {generatingContent && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Generating content...</span>
                </div>
              )}

              {aiGeneratedContent && !generatingContent && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Generated Content</p>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(aiGeneratedContent)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Textarea 
                    value={aiGeneratedContent}
                    onChange={(e) => setAiGeneratedContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAiGeneratedContent("")}>
                      Clear
                    </Button>
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Send for Review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CEO Brief Modal */}
      <CEOBriefModal open={ceoBriefOpen} onOpenChange={setCeoBriefOpen} />
      
      {/* System Health Banner */}
      <SystemHealthBanner />
    </div>
  );
}