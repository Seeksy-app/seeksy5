import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, Sparkles, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SeeksyAIBoostHelp = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-4xl font-bold">Seeksy AI Boost</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Optimize your content for AI-powered search engines and language models
            </p>
          </div>
        </div>

        {/* Introduction */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>Seeksy AI Boost</strong> helps your blog content get discovered by AI tools like ChatGPT, 
            Perplexity, Claude, Google's AI Overviews, and other AI-powered search engines. Follow these 
            best practices to maximize your content's AI visibility.
          </AlertDescription>
        </Alert>

        {/* Why AI Optimization Matters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why AI Optimization Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The future of search is AI-powered. Users increasingly ask questions to ChatGPT, Perplexity, 
              and Google's AI Overviews instead of traditional search engines. When your content is optimized 
              for AI, you:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Get cited as authoritative sources by AI chatbots</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Appear in AI-generated summaries and overviews</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Reach audiences using conversational search</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Build credibility as AI tools reference your expertise</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">AI Optimization Best Practices</h2>

          {/* Headings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">1.</span>
                Use Proper Heading Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                AI models use heading hierarchy to understand your content structure. Proper headings help 
                AI extract and summarize information accurately.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">Best Practices:</p>
                <ul className="space-y-1 ml-6 text-sm">
                  <li>• Start with H1 for your main title (automatic in Seeksy)</li>
                  <li>• Use H2 for major sections</li>
                  <li>• Use H3 for subsections within H2s</li>
                  <li>• Never skip heading levels (don't go H2 → H4)</li>
                  <li>• Phrase headings as questions when possible (e.g., "How Does This Work?")</li>
                </ul>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Pro Tip:</strong> AI language models favor question-based content. Converting 
                  traditional headings into questions increases your chances of being cited in conversational 
                  AI responses.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Table of Contents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">2.</span>
                Include a Table of Contents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                A table of contents gives AI models a clear roadmap of your content structure, making it 
                easier for them to understand and reference specific sections.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">Why It Works:</p>
                <ul className="space-y-1 ml-6 text-sm">
                  <li>• AI can quickly identify relevant sections</li>
                  <li>• Improves content scannability for both humans and AI</li>
                  <li>• Helps AI understand topic relationships</li>
                  <li>• Signals comprehensive, well-organized content</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">3.</span>
                Add FAQ Sections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                FAQs are the perfect format for AI-powered search. Since users ask questions to AI chatbots, 
                content in Q&A format is highly favored.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">Creating Effective FAQs:</p>
                <ul className="space-y-1 ml-6 text-sm">
                  <li>• Write questions exactly as users would ask them</li>
                  <li>• Keep answers concise but complete (150-300 words)</li>
                  <li>• Include your primary keyword naturally</li>
                  <li>• Address common pain points and objections</li>
                  <li>• Use structured data markup (automatic in Seeksy)</li>
                </ul>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>AI Advantage:</strong> ChatGPT, Claude, and Perplexity actively pull FAQ content 
                  to answer user queries. This is one of the most effective ways to get cited by AI tools.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Structured Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">4.</span>
                Use Lists and Tables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                AI models excel at extracting structured data. Lists and tables make your information 
                easily parseable and more likely to be referenced.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">Ideal Use Cases:</p>
                <ul className="space-y-1 ml-6 text-sm">
                  <li>• Feature comparisons</li>
                  <li>• Step-by-step instructions</li>
                  <li>• Pros and cons lists</li>
                  <li>• Pricing breakdowns</li>
                  <li>• Technical specifications</li>
                  <li>• Key takeaways and summaries</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                Structured content provides visual breaks for readers while giving AI clear data points 
                to extract and cite.
              </p>
            </CardContent>
          </Card>

          {/* Content Length */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">5.</span>
                Write Comprehensive Content (1000+ Words)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                AI models favor thorough, authoritative content. Longer, well-researched articles signal 
                expertise and are more likely to be referenced.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">Content Length Guidelines:</p>
                <ul className="space-y-1 ml-6 text-sm">
                  <li>• Minimum: 1,000 words for basic topics</li>
                  <li>• Ideal: 1,500-2,500 words for most topics</li>
                  <li>• In-depth guides: 3,000+ words</li>
                  <li>• Focus on quality over quantity—add value, not fluff</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">6.</span>
                Strategic Keyword Placement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                While AI understands context better than traditional search engines, strategic keyword 
                use still matters for discoverability.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">Key Placement Areas:</p>
                <ul className="space-y-1 ml-6 text-sm">
                  <li>• Page title (H1)</li>
                  <li>• URL slug</li>
                  <li>• Meta description</li>
                  <li>• First paragraph</li>
                  <li>• At least 2-3 H2 headings</li>
                  <li>• Naturally throughout the content</li>
                  <li>• Image alt text</li>
                </ul>
              </div>

              <Alert>
                <AlertDescription>
                  Aim for keyword density of 0.5-1%. Write naturally for humans first—AI can detect 
                  keyword stuffing and will deprioritize your content.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">7.</span>
                Add Descriptive Images with Alt Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                While AI can't "see" images in traditional search, alt text helps AI understand visual 
                content and improves overall content quality signals.
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">Alt Text Best Practices:</p>
                <ul className="space-y-1 ml-6 text-sm">
                  <li>• Be descriptive and specific</li>
                  <li>• Include relevant keywords naturally</li>
                  <li>• Describe what's happening in the image</li>
                  <li>• Keep it under 125 characters</li>
                  <li>• Don't start with "image of" or "picture of"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How to Check Your Score */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Using Seeksy AI Boost Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Your Seeksy AI Boost score updates in real-time as you write. Here's what to look for:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Green Checkmarks</p>
                  <p className="text-sm text-muted-foreground">
                    Your content meets AI optimization requirements for this element
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Red Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    This element needs attention to improve AI visibility
                  </p>
                </div>
              </div>
            </div>

            <Alert className="mt-4">
              <AlertDescription>
                <strong>Perfect Score (5/5):</strong> Indicates your content is fully optimized for AI 
                discovery and citations. Keep publishing high-quality, AI-friendly content to build authority 
                with AI models.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Button onClick={() => navigate("/blog/create")} size="lg">
            Start Optimizing Your Content
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeeksyAIBoostHelp;
