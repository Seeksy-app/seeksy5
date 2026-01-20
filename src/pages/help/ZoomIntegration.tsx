import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, Users, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const ZoomIntegration = () => {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Zoom Integration Guide</h1>
        <p className="text-muted-foreground">
          Connect your Zoom account to create and manage meetings directly from Seeksy
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Follow these steps to connect your Zoom account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Navigate to Integrations</h3>
            <p className="text-sm text-muted-foreground">
              Go to the Integrations page from your sidebar menu
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Connect Zoom</h3>
            <p className="text-sm text-muted-foreground">
              Click the "Connect" button on the Zoom integration card
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Authorize Access</h3>
            <p className="text-sm text-muted-foreground">
              Log in to your Zoom account and authorize Seeksy to create meetings on your behalf
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">4. Start Creating Meetings</h3>
            <p className="text-sm text-muted-foreground">
              Once connected, you can create Zoom meetings when scheduling events
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium">Automatic Meeting Creation</h4>
              <p className="text-sm text-muted-foreground">
                Create Zoom meetings automatically when scheduling appointments
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Settings className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium">Meeting Settings</h4>
              <p className="text-sm text-muted-foreground">
                Configure meeting settings like waiting rooms, passwords, and recording options
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If you're experiencing issues with the Zoom integration, try these steps:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
            <li>Disconnect and reconnect your Zoom account</li>
            <li>Ensure your Zoom account has meeting creation permissions</li>
            <li>Check that you're using a Pro or higher Zoom account for advanced features</li>
          </ul>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/integrations">Manage Integrations</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/submit-ticket">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZoomIntegration;
