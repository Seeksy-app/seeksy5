import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, MessageSquare, CheckCircle, XCircle, MousePointerClick, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface CommunicationLog {
  id: string;
  type: 'email' | 'sms';
  email_type?: string;
  recipient_email?: string;
  recipient_name?: string;
  recipient_phone?: string;
  subject?: string;
  message_body?: string;
  sent_at: string;
  status: string;
  error_message?: string | null;
  is_opened?: boolean;
  is_delivered?: boolean;
  link_clicked?: boolean;
}

const CommunicationHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadCommunications();
    }
  }, [user]);

  const loadCommunications = async () => {
    try {
      // Load emails
      const { data: emailData, error: emailError } = await supabase
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false });

      if (emailError) throw emailError;

      // Get email opened events
      const { data: openedEvents } = await supabase
        .from("email_events")
        .select("to_email, event_type, occurred_at")
        .eq("event_type", "opened");

      // Get email link click events
      const { data: clickEvents } = await supabase
        .from("email_events")
        .select("to_email, event_type, occurred_at")
        .eq("event_type", "clicked");

      const emailsWithStatus = (emailData || []).map(email => ({
        ...email,
        type: 'email' as const,
        is_opened: openedEvents?.some(event => 
          event.to_email === email.recipient_email &&
          new Date(event.occurred_at) >= new Date(email.sent_at)
        ) || false,
        link_clicked: clickEvents?.some(event => 
          event.to_email === email.recipient_email &&
          new Date(event.occurred_at) >= new Date(email.sent_at)
        ) || false,
      }));

      // TODO: Add SMS logs when sms_logs table is created
      // For now, just show emails
      const smsWithStatus: CommunicationLog[] = [];

      // Combine and sort
      const combined = [...emailsWithStatus, ...smsWithStatus].sort(
        (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
      );

      setCommunications(combined);
    } catch (error: any) {
      console.error("Error loading communications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      event_registration: "Event Registration",
      meeting_confirmation: "Meeting Confirmation",
      signup_confirmation: "Signup Confirmation",
      event_reminder: "Event Reminder",
      meeting_reminder: "Meeting Reminder",
      signup_reminder: "Signup Reminder",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      event_registration: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      meeting_confirmation: "bg-green-500/10 text-green-500 border-green-500/20",
      signup_confirmation: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      event_reminder: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      meeting_reminder: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      signup_reminder: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const emails = communications.filter(c => c.type === 'email');
  const sms = communications.filter(c => c.type === 'sms');
  const all = communications;

  const emailStats = {
    total: emails.length,
    sent: emails.filter(e => e.status === 'sent').length,
    opened: emails.filter(e => e.is_opened).length,
    clicked: emails.filter(e => e.link_clicked).length,
    failed: emails.filter(e => e.status === 'failed').length,
  };

  const smsStats = {
    total: sms.length,
    sent: sms.filter(s => s.status === 'sent').length,
    delivered: sms.filter(s => s.is_delivered).length,
    failed: sms.filter(s => s.status === 'failed').length,
  };

  const handleResend = async (emailLog: CommunicationLog) => {
    try {
      const { data: account } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("is_active", true)
        .single();

      if (!account) {
        toast.error("No active email account found");
        return;
      }

      const { error } = await supabase.functions.invoke("send-campaign-email", {
        body: {
          resendEmailLogId: emailLog.id,
          accountId: account.id,
          subject: emailLog.subject,
          htmlContent: emailLog.message_body,
          recipientEmail: emailLog.recipient_email,
          recipientName: emailLog.recipient_name,
          userId: user?.id,
        },
      });

      if (error) throw error;
      toast.success(`Email resent to ${emailLog.recipient_email}`);
      loadCommunications();
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email");
    }
  };

  const CommunicationCard = ({ comm }: { comm: CommunicationLog }) => (
    <Card key={comm.id} className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Badge variant={comm.type === 'email' ? 'default' : 'secondary'}>
              {comm.type === 'email' ? <Mail className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
              {comm.type.toUpperCase()}
            </Badge>
            
            {comm.email_type && (
              <Badge className={getTypeColor(comm.email_type)}>
                {getTypeLabel(comm.email_type)}
              </Badge>
            )}

            <Badge variant={comm.status === 'sent' || comm.status === 'delivered' ? 'default' : 'destructive'}>
              {(comm.status === 'sent' || comm.status === 'delivered') ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {comm.type === 'sms' && comm.is_delivered ? 'Delivered' : 'Sent'}
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Failed
                </>
              )}
            </Badge>

            {comm.is_opened && (
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                <Mail className="h-3 w-3 mr-1" />
                Opened
              </Badge>
            )}

            {comm.link_clicked && (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                <MousePointerClick className="h-3 w-3 mr-1" />
                Link Clicked
              </Badge>
            )}

            <span className="text-sm text-muted-foreground">
              {formatDate(comm.sent_at)}
            </span>
          </div>

          {comm.subject && <h3 className="font-semibold mb-1 truncate">{comm.subject}</h3>}
          
          <p className="text-sm text-muted-foreground mb-1">
            To: {comm.recipient_name}
            {comm.type === 'email' && ` (${comm.recipient_email})`}
            {comm.type === 'sms' && comm.recipient_phone && ` (${comm.recipient_phone})`}
          </p>

          {comm.message_body && comm.type === 'sms' && (
            <p className="text-sm mt-2 p-2 bg-muted rounded">{comm.message_body}</p>
          )}

          {comm.error_message && (
            <p className="text-sm text-red-500 mt-2">
              Error: {comm.error_message}
            </p>
          )}
        </div>

        {comm.type === 'email' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleResend(comm)}
            className="shrink-0"
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Resend
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Communication History</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Communication History</h1>
          <p className="text-muted-foreground">Track all email and SMS communications from your account</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All ({all.length})
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email ({emails.length})
            </TabsTrigger>
            <TabsTrigger value="sms">
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS ({sms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Communications</p>
                    <p className="text-3xl font-bold">{all.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Emails Sent</p>
                    <p className="text-3xl font-bold text-blue-500">{emailStats.sent}</p>
                  </div>
                  <Mail className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SMS Delivered</p>
                    <p className="text-3xl font-bold text-green-500">{smsStats.delivered}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-500" />
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              {all.length === 0 ? (
                <Card className="p-12 text-center">
                  <h3 className="text-xl font-semibold mb-2">No Communications Found</h3>
                  <p className="text-muted-foreground">
                    Email and SMS communications will appear here once they're sent
                  </p>
                </Card>
              ) : (
                all.map((comm) => <CommunicationCard key={comm.id} comm={comm} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="email">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Emails</p>
                    <p className="text-3xl font-bold">{emailStats.total}</p>
                  </div>
                  <Mail className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sent</p>
                    <p className="text-3xl font-bold text-green-500">{emailStats.sent}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Opened</p>
                    <p className="text-3xl font-bold text-blue-500">{emailStats.opened}</p>
                  </div>
                  <Mail className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Link Clicked</p>
                    <p className="text-3xl font-bold text-purple-500">{emailStats.clicked}</p>
                  </div>
                  <MousePointerClick className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              {emails.length === 0 ? (
                <Card className="p-12 text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Emails Found</h3>
                  <p className="text-muted-foreground">
                    Email notifications will appear here once they're sent
                  </p>
                </Card>
              ) : (
                emails.map((comm) => <CommunicationCard key={comm.id} comm={comm} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="sms">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total SMS</p>
                    <p className="text-3xl font-bold">{smsStats.total}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivered</p>
                    <p className="text-3xl font-bold text-green-500">{smsStats.delivered}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-3xl font-bold text-red-500">{smsStats.failed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              {sms.length === 0 ? (
                <Card className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No SMS Found</h3>
                  <p className="text-muted-foreground">
                    SMS messages will appear here once they're sent
                  </p>
                </Card>
              ) : (
                sms.map((comm) => <CommunicationCard key={comm.id} comm={comm} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunicationHistory;
