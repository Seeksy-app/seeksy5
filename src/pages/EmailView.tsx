import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { sanitizeEmailHtml } from "@/lib/sanitizeHtml";

export default function EmailView() {
  const { id } = useParams();
  const [email, setEmail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmail();
  }, [id]);

  const loadEmail = async () => {
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setEmail(data);

      // Track view event
      await supabase.from("email_events").insert({
        to_email: data.recipient_email,
        from_email: data.recipient_email,
        email_subject: data.subject || "",
        event_type: "viewed",
        occurred_at: new Date().toISOString(),
        user_id: data.user_id,
      });
    } catch (error) {
      console.error("Error loading email:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-2">Email Not Found</h2>
          <p className="text-muted-foreground">
            This email may have been deleted or the link is invalid.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container max-w-3xl mx-auto px-4">
        <Card className="overflow-hidden">
          {/* Email Header */}
          <div className="border-b bg-card p-6">
            <h1 className="text-2xl font-bold mb-2">{email.subject}</h1>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>From: {email.from_email}</p>
              <p>To: {email.recipient_email}</p>
              <p>Date: {new Date(email.sent_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Email Content */}
          <div className="p-6 bg-background">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.message_body) }}
            />
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/50 p-4 text-center text-xs text-muted-foreground">
            <p>
              This email was sent via Seeksy. 
              <a href="/email-preferences" className="underline ml-1">Update your preferences</a>
              {" or "}
              <a href={`/unsubscribe?email=${email.recipient_email}`} className="underline">unsubscribe</a>.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
