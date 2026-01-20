import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ListPreferencesTabProps {
  listId: string;
}

export function ListPreferencesTab({ listId }: ListPreferencesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Preference Channels</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure which communication types this list can receive. Subscribers can override these preferences individually.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex-1">
              <Label className="font-medium text-blue-900">Marketing Updates</Label>
              <p className="text-sm text-blue-700 mt-0.5">
                Newsletter, promotions, and marketing content
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex-1">
              <Label className="font-medium text-green-900">System Notifications</Label>
              <p className="text-sm text-green-700 mt-0.5">
                Account updates, security alerts, and system messages
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex-1">
              <Label className="font-medium text-purple-900">Event Invites</Label>
              <p className="text-sm text-purple-700 mt-0.5">
                Meeting invitations, event notifications, and RSVPs
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex-1">
              <Label className="font-medium text-orange-900">Identity/Verification</Label>
              <p className="text-sm text-orange-700 mt-0.5">
                Voice certification, identity updates, and security verification
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-sm font-semibold mb-2">Subscriber Preference Portal</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Subscribers can manage their own preferences at:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
            /p/preferences/{"{contactId}"}
          </code>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Portal
          </Button>
        </div>
      </div>
    </div>
  );
}
