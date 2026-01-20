import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ContactCommunicationTabProps {
  contactId: string;
}

interface EmailLog {
  id: string;
  subject: string;
  status: string;
  sent_at: string;
  recipient_email: string;
}

export function ContactCommunicationTab({ contactId }: ContactCommunicationTabProps) {
  const { data: emailLogs, isLoading } = useQuery<EmailLog[]>({
    queryKey: ["contact-communication", contactId],
    queryFn: async () => {
      // Get contact first
      const { data: contact } = await supabase
        .from("contacts")
        .select("email")
        .eq("id", contactId)
        .maybeSingle();

      if (!contact?.email) return [];

      // Get email logs
      const { data } = await supabase
        .from("email_logs")
        .select("id, subject, status, sent_at, recipient_email")
        .eq("recipient_email", contact.email)
        .order("sent_at", { ascending: false })
        .limit(50);

      return (data || []) as EmailLog[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Email History</h3>
        <p className="text-sm text-muted-foreground">
          All emails sent to this contact
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!emailLogs || emailLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No emails sent to this contact yet
                </TableCell>
              </TableRow>
            ) : (
              emailLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium max-w-md truncate">
                    {log.subject}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === "delivered"
                          ? "default"
                          : log.status === "bounced"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.sent_at ? format(new Date(log.sent_at), "MMM d, yyyy h:mm a") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/email/${log.id}/view`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
