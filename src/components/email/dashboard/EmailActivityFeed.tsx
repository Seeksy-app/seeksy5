import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MousePointerClick, AlertCircle, Ban, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmailActivityFeedProps {
  userId?: string;
}

export const EmailActivityFeed = ({ userId }: EmailActivityFeedProps) => {
  const { data: events } = useQuery({
    queryKey: ["email-events-feed", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data } = await supabase
        .from("email_events")
        .select(`
          *,
          email_campaigns(subject),
          contacts(name, email)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      return data || [];
    },
    enabled: !!userId,
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "opened":
        return <Eye className="h-4 w-4" />;
      case "clicked":
        return <MousePointerClick className="h-4 w-4" />;
      case "bounced":
        return <AlertCircle className="h-4 w-4" />;
      case "unsubscribed":
        return <Ban className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getEventVariant = (eventType: string) => {
    switch (eventType) {
      case "opened":
        return "default";
      case "clicked":
        return "default";
      case "bounced":
        return "destructive";
      case "unsubscribed":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Last 10 email events</CardDescription>
      </CardHeader>
      <CardContent>
        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="mt-1">
                  <Badge variant={getEventVariant(event.event_type)}>
                    {getEventIcon(event.event_type)}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {event.contacts?.name || event.contacts?.email || "Unknown contact"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {event.event_type} • {event.email_campaigns?.subject || "Campaign"}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activity yet. Send your first campaign to see events here.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
