import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, ExternalLink, Info } from "lucide-react";

interface ConversationalAdDemoProps {
  demoAgentId?: string;
  demoPhoneNumber?: string;
}

export const ConversationalAdDemo = ({ demoAgentId, demoPhoneNumber }: ConversationalAdDemoProps) => {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <CardTitle>Conversational AI Demo & Setup</CardTitle>
        </div>
        <CardDescription>
          Learn how conversational ads work and how to set up your own
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demo Section */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Test Our Live Demo
          </h3>
          <Alert className="border-primary/50 bg-primary/5">
            <AlertDescription className="space-y-3">
              <div>
                <p className="font-medium mb-2">📞 Call our live conversational AI demo:</p>
                <div className="bg-background p-4 rounded-lg border-2 border-primary/20">
                  <p className="text-3xl font-bold text-primary tracking-wide">+1 202 952 1925</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Available 24/7 • Try asking questions about products or services
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Experience how conversational AI ads work in real-time. The AI will respond naturally to your questions,
                  just like it would for your customers.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Setup Instructions */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            How to Get Your Own Phone Number
          </h3>
          <div className="space-y-3 text-sm">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="font-medium">Option 1: ElevenLabs Phone Integration (Recommended)</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                <li>Sign up for an ElevenLabs paid plan at elevenlabs.io</li>
                <li>Navigate to Conversational AI → Phone Numbers</li>
                <li>Rent a phone number for your region</li>
                <li>Create your agent in the ElevenLabs dashboard</li>
                <li>Assign the phone number to your agent</li>
                <li>Copy the Agent ID and add it to your campaign</li>
              </ol>
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => window.open('https://elevenlabs.io/conversational-ai', '_blank')}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Visit ElevenLabs Conversational AI
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="font-medium">Option 2: Web Widget (No Phone Required)</p>
              <p className="text-muted-foreground">
                Use web-based conversational widgets that podcasters can embed. This option:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Works without phone number costs</li>
                <li>Embeds directly in podcast show notes</li>
                <li>Provides click-to-chat functionality</li>
                <li>Tracks engagement metrics</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing Info */}
        <Alert>
          <AlertDescription className="text-sm">
            <p className="font-medium mb-2">💡 Pricing Note</p>
            <p className="text-muted-foreground">
              Phone numbers typically cost $40-60/month through ElevenLabs. Web widgets are free to use.
              Conversational AI ads are priced at a premium CPM due to higher engagement rates.
            </p>
          </AlertDescription>
        </Alert>

        {/* Benefits */}
        <div>
          <h3 className="font-semibold mb-3">Why Choose Conversational AI?</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="font-medium text-primary">3-5x Engagement</p>
              <p className="text-muted-foreground text-xs">Higher than standard ads</p>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="font-medium text-primary">Real-time Q&A</p>
              <p className="text-muted-foreground text-xs">Answer specific questions</p>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="font-medium text-primary">Brand Recall</p>
              <p className="text-muted-foreground text-xs">2x better than audio</p>
            </div>
            <div className="bg-primary/5 p-3 rounded-lg">
              <p className="font-medium text-primary">Qualification</p>
              <p className="text-muted-foreground text-xs">Pre-qualify leads</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
