import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Link2, ExternalLink, MessageSquare, Headphones, Users } from "lucide-react";

const integrations = [
  {
    id: "zendesk",
    name: "Zendesk",
    description: "Sync tickets with your Zendesk account for unified support management",
    icon: Headphones,
    status: "not_connected",
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  {
    id: "intercom",
    name: "Intercom",
    description: "Connect Intercom for live chat and customer messaging",
    icon: MessageSquare,
    status: "coming_soon",
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    id: "hubspot",
    name: "HubSpot Service",
    description: "Integrate with HubSpot Service Hub for CRM-connected support",
    icon: Users,
    status: "coming_soon",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

export default function Integrations() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">External Support Tools</h1>
        <p className="text-muted-foreground">Connect with third-party support platforms</p>
      </div>

      <div className="grid gap-4">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg ${integration.bg} flex items-center justify-center`}>
                    <integration.icon className={`h-6 w-6 ${integration.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      {integration.status === "coming_soon" && (
                        <Badge variant="secondary">Coming Soon</Badge>
                      )}
                      {integration.status === "not_connected" && (
                        <Badge variant="outline">Not Connected</Badge>
                      )}
                      {integration.status === "connected" && (
                        <Badge className="bg-green-100 text-green-700">Connected</Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">{integration.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {integration.status === "not_connected" && (
                    <Button variant="outline">
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                  {integration.status === "connected" && (
                    <>
                      <Switch checked={true} />
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Settings
                      </Button>
                    </>
                  )}
                  {integration.status === "coming_soon" && (
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Email Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email Integration</CardTitle>
          <CardDescription>Configure inbound/outbound email settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Primary Support Email</p>
              <p className="text-sm text-muted-foreground">hello@seeksy.io</p>
            </div>
            <Badge className="bg-green-100 text-green-700">Active</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Emails sent to this address will automatically create support tickets.</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Escalation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Agent Escalation</CardTitle>
          <CardDescription>Automatic ticket creation when AI escalates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-create tickets on escalation</p>
              <p className="text-sm text-muted-foreground">When users click "Escalate" in AI chat, create a Help Desk ticket</p>
            </div>
            <Switch checked={true} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Include conversation history</p>
              <p className="text-sm text-muted-foreground">Attach AI chat transcript to the ticket</p>
            </div>
            <Switch checked={true} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}