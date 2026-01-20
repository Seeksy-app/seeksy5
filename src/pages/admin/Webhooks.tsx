import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Webhook, Plus, ExternalLink } from "lucide-react";

export default function Webhooks() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">Configure webhook endpoints for external integrations</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Endpoints
          </CardTitle>
          <CardDescription>
            Manage outgoing webhook configurations for third-party integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Webhook className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Stripe Webhook</p>
                  <p className="text-sm text-muted-foreground">Payment events</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">Active</Badge>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Webhook className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Resend Webhook</p>
                  <p className="text-sm text-muted-foreground">Email tracking events</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">Active</Badge>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Webhook className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Twilio Webhook</p>
                  <p className="text-sm text-muted-foreground">SMS events</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600">Active</Badge>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}