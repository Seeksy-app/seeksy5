import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Mail, Loader2 } from "lucide-react";
import { EmailTrackingPills } from "@/components/email/client/EmailTrackingPills";
import { format } from "date-fns";

interface SentEmail {
  id: string;
  to_email: string;
  email_subject: string;
  from_email: string | null;
  occurred_at: string;
  resend_email_id: string | null;
}

export default function EmailSent() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: sentEmails = [], isLoading } = useQuery({
    queryKey: ["sent-emails", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get sent emails from email_campaigns that were sent (not drafts)
      // Also check email_events for any sent emails
      const [campaignsResult, eventsResult] = await Promise.all([
        supabase
          .from("email_campaigns")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_draft", false)
          .order("sent_at", { ascending: false }),
        supabase
          .from("email_events")
          .select("*")
          .eq("user_id", user.id)
          .eq("event_type", "sent")
          .order("occurred_at", { ascending: false })
      ]);
      
      const campaigns = campaignsResult.data || [];
      const events = eventsResult.data || [];
      
      // Combine and deduplicate - prefer campaign data if available
      const emailMap = new Map();
      
      // Add campaign emails first
      campaigns.forEach(c => {
        const campaignId = c.id;
        emailMap.set(campaignId, {
          id: c.id,
          to_email: (c.draft_data as any)?.to || c.subject || "",
          email_subject: c.subject,
          from_email: null,
          occurred_at: c.sent_at || c.updated_at,
          resend_email_id: null,
        });
      });
      
      // Add events that don't have matching campaigns
      events.forEach(e => {
        if (!emailMap.has(e.resend_email_id)) {
          emailMap.set(e.id, {
            id: e.id,
            to_email: e.to_email,
            email_subject: e.email_subject,
            from_email: e.from_email,
            occurred_at: e.occurred_at,
            resend_email_id: e.resend_email_id,
          });
        }
      });
      
      return Array.from(emailMap.values()) as SentEmail[];
    },
    enabled: !!user,
  });

  // Fetch all events for tracking
  const { data: allEvents = [] } = useQuery({
    queryKey: ["all-email-events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data } = await supabase
        .from("email_events")
        .select("*")
        .eq("user_id", user.id);
      
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9]">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Sent Emails
            </CardTitle>
            <CardDescription>
              View all your sent email campaigns and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sentEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Send className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sent Emails Yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Once you send campaigns, they'll appear here with delivery stats and engagement metrics.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentEmails.map((email) => {
                  // Get events for this specific email
                  const emailEvents = allEvents.filter(
                    (e) => e.resend_email_id === email.resend_email_id
                  );

                  return (
                    <div
                      key={email.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {email.email_subject || "(No subject)"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            To: {email.to_email}
                          </p>
                          {email.from_email && (
                            <p className="text-xs text-muted-foreground truncate">
                              From: {email.from_email}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <EmailTrackingPills
                          events={emailEvents}
                          sentAt={email.occurred_at}
                        />
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(email.occurred_at), "MMM d, h:mm a")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
