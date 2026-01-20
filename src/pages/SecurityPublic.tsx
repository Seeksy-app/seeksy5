import { Shield, Lock, Server, Eye, Bot, Settings, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const SecurityPublic = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Security & Privacy at Seeksy</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your work, your audience, and your data are at the heart of Seeksy. This page explains, in plain language, how we protect them.
          </p>
        </div>

        {/* How We Protect Your Data */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">How We Protect Your Data</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Account Security</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>All sign-ins are handled using secure, modern authentication.</li>
                  <li>Sessions are protected with signed tokens and time-based expiration.</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-2">Encryption</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Data is encrypted in transit (HTTPS) and at rest in our database.</li>
                  <li>Sensitive integration credentials (like email, calendar, and social media tokens) are encrypted using a dedicated encryption key on the server.</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-2">Access Control</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>You can only see the data that belongs to your account (e.g., contacts, events, social accounts).</li>
                  <li>Admin access is limited to specific operational needs, such as support, billing, and platform health.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Third-Party Connections */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Server className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Third-Party Connections (Gmail, Calendar, Social, Zoom, etc.)</h2>
            </div>
            
            <p className="text-muted-foreground mb-4">
              When you connect an external account (e.g., Gmail, Google Calendar, Instagram, YouTube, Zoom):
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>We never see or store your password.</li>
              <li>We receive limited access tokens from the provider via OAuth.</li>
              <li>Those tokens are:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Encrypted before they are stored.</li>
                  <li>Used only to perform actions you request (syncing messages, analytics, events, clips, etc.).</li>
                  <li>Scoped to the minimum permissions required for Seeksy features.</li>
                </ul>
              </li>
            </ul>
            
            <p className="text-muted-foreground mt-4">
              You can disconnect these integrations at any time from within your account or from the provider's own security settings.
            </p>
          </CardContent>
        </Card>

        {/* How We Use Your Data */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">How We Use Your Data</h2>
            </div>
            
            <p className="text-muted-foreground mb-4">We use your data to:</p>
            
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-6">
              <li>Power your Seeksy workspace: meetings, events, content, studio, analytics, and more.</li>
              <li>Help you understand performance: dashboards, valuations, event analytics, and reports.</li>
              <li>Deliver communications you request: reminders, follow-ups, campaigns, and notifications.</li>
            </ul>
            
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-semibold">We do not sell your personal data.</p>
              <p className="text-muted-foreground">We do not share your integration tokens with other customers or third parties.</p>
            </div>
            
            <p className="text-muted-foreground mt-4">
              Where we use aggregated data (for example, "creators on Seeksy collectively generated X clips this month"), it is anonymized and not tied back to you personally.
            </p>
          </CardContent>
        </Card>

        {/* AI Features */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Bot className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">AI Features & Responsible Use</h2>
            </div>
            
            <p className="text-muted-foreground mb-4">Seeksy uses AI to help with:</p>
            
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-6">
              <li>Content and clip generation</li>
              <li>Event and awards planning</li>
              <li>Studio post-production</li>
              <li>CFO and GTM insights</li>
            </ul>
            
            <div>
              <h3 className="font-semibold mb-2">Our approach:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>AI models are used to transform and analyze the data you provide (audio, video, text, metrics).</li>
                <li>We aim to minimize the amount of personal information sent to AI providers and use it only to support the features you activate.</li>
                <li>We continuously refine prompts, filters, and workflows to reduce risks such as hallucinations, misclassification, or biased output.</li>
              </ul>
            </div>
            
            <p className="text-muted-foreground mt-4">
              If you ever have questions about how an AI feature uses your data, you can contact us and we will walk you through it.
            </p>
          </CardContent>
        </Card>

        {/* Your Controls */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Your Controls</h2>
            </div>
            
            <p className="text-muted-foreground mb-4">You are always in control of your Seeksy account:</p>
            
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-6">
              <li>Disconnect external integrations (email, calendar, social, Zoom, etc.).</li>
              <li>Delete events, campaigns, and content from your account.</li>
              <li>Request assistance from support if you need help removing or exporting data.</li>
            </ul>
            
            <p className="text-muted-foreground">
              If you are a creator or organizer running events, awards, or campaigns, you are responsible for honoring any commitments you make to your attendees and participants (for example, prize delivery for awards, honoring unsubscribe preferences, and complying with your local laws).
            </p>
          </CardContent>
        </Card>

        {/* Reporting a Security Concern */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Reporting a Security Concern</h2>
            </div>
            
            <p className="text-muted-foreground mb-4">
              If you believe you've discovered a security issue affecting Seeksy or your data:
            </p>
            
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mb-4">
              <li>Email us at security@seeksy.io (placeholder)</li>
              <li>Include as much detail as you can (steps to reproduce, screenshots, environment)</li>
              <li>Please avoid sharing sensitive information in public or over social media</li>
            </ul>
            
            <p className="text-muted-foreground">
              We review and prioritize security reports promptly and will coordinate with you on next steps.
            </p>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Updates to This Page</h2>
            <p className="text-muted-foreground mb-4">
              Our platform evolves quickly, and so does our security posture. When we make meaningful changes to how we protect or process your data, we update this page accordingly.
            </p>
            <p className="text-muted-foreground">
              If you use Seeksy as part of your business, we encourage you to review this page periodically and reach out with any questions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityPublic;
