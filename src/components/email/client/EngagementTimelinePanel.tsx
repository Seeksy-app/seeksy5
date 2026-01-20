import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eye, MousePointer, Mail, CheckCircle, XCircle, Monitor, Smartphone } from "lucide-react";
import { calculateEngagementStats, getEngagementTag, getEngagementColor } from "@/utils/emailEngagement";

interface EmailEvent {
  event_type: string;
  occurred_at: string;
  device_type?: string;
  ip_address?: string;
  clicked_url?: string;
  user_agent?: string;
}

interface EngagementTimelinePanelProps {
  open: boolean;
  onClose: () => void;
  email: {
    to_email: string;
    email_subject: string;
    created_at: string;
  } | null;
  events: EmailEvent[];
}

export function EngagementTimelinePanel({ open, onClose, email, events }: EngagementTimelinePanelProps) {
  if (!email) return null;

  const daysSinceSent = Math.floor((Date.now() - new Date(email.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const stats = calculateEngagementStats(events, email.created_at);
  const engagementTag = getEngagementTag(stats, daysSinceSent);

  const getEventIcon = (eventType: string) => {
    const normalized = eventType.replace("email.", "");
    switch (normalized) {
      case "sent":
        return <Mail className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "opened":
        return <Eye className="h-4 w-4" />;
      case "clicked":
        return <MousePointer className="h-4 w-4" />;
      case "bounced":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getEventColor = (eventType: string) => {
    const normalized = eventType.replace("email.", "");
    switch (normalized) {
      case "sent":
        return "text-blue-400";
      case "delivered":
        return "text-green-500";
      case "opened":
        return "text-blue-500";
      case "clicked":
        return "text-purple-500";
      case "bounced":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Engagement Timeline</SheetTitle>
          <SheetDescription>
            {email.to_email} • {email.email_subject || "(No subject)"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Stats */}
          <Card className="p-4">
            <h3 className="font-medium mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-2xl font-bold text-blue-500">{stats.opens}</div>
                <div className="text-xs text-muted-foreground">Total Opens</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">{stats.clicks}</div>
                <div className="text-xs text-muted-foreground">Total Clicks</div>
              </div>
              {stats.firstOpenMinutes !== null && (
                <div className="col-span-2">
                  <div className="text-sm font-medium">
                    Opened {stats.firstOpenMinutes} minutes after sending
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* AI Engagement Tag */}
          {engagementTag && (
            <Card className="p-4">
              <h3 className="font-medium mb-2">AI Interpretation</h3>
              <Badge className={`${getEngagementColor(engagementTag)} text-sm px-2 py-1`}>
                {engagementTag}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {engagementTag === "Hot Lead" && "Fast open with multiple interactions. High interest signal."}
                {engagementTag === "Interested" && "Multiple opens indicate sustained interest."}
                {engagementTag === "Cold" && "No engagement detected yet."}
                {engagementTag === "Possible Spam Folder" && "No opens for extended period. May be in spam."}
                {engagementTag === "Forwarded" && "Multiple devices/locations detected. Likely forwarded."}
              </p>
            </Card>
          )}

          {/* Device Info */}
          {stats.devices.size > 0 && (
            <Card className="p-4">
              <h3 className="font-medium mb-3">Devices</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(stats.devices).map((device) => (
                  <Badge key={device} variant="secondary" className="text-xs">
                    {device.includes("mobile") ? (
                      <Smartphone className="h-3 w-3 mr-1" />
                    ) : (
                      <Monitor className="h-3 w-3 mr-1" />
                    )}
                    {device}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Event Timeline */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Full Timeline</h3>
            <div className="space-y-3">
              {events.map((event, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`mt-0.5 ${getEventColor(event.event_type)}`}>
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        {event.event_type.replace("email.", "").charAt(0).toUpperCase() + 
                         event.event_type.replace("email.", "").slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.occurred_at).toLocaleString()}
                      </span>
                    </div>
                    {event.clicked_url && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {event.clicked_url}
                      </div>
                    )}
                    {event.device_type && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {event.device_type}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
