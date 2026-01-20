import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Mail, Send, Eye, MousePointer, AlertCircle, Reply, Filter } from "lucide-react";
import { format } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useFaviconManager } from "@/hooks/useFaviconManager";

const EVENT_TYPE_ICONS = {
  "email.sent": Send,
  "email.delivered": Mail,
  "email.opened": Eye,
  "email.clicked": MousePointer,
  "email.bounced": AlertCircle,
  "reply": Reply,
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  "email.sent": "bg-blue-500/10 text-blue-500",
  "email.delivered": "bg-green-500/10 text-green-500",
  "email.opened": "bg-purple-500/10 text-purple-500",
  "email.clicked": "bg-indigo-500/10 text-indigo-500",
  "email.bounced": "bg-red-500/10 text-red-500",
  "reply": "bg-yellow-500/10 text-yellow-500",
};

export default function EmailHistory() {
  usePageTitle("Mail History");
  useFaviconManager();
  
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [recipientFilter, setRecipientFilter] = useState("");
  const [dateRange, setDateRange] = useState("7d");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["email-history", user?.id, eventTypeFilter, recipientFilter, dateRange],
    queryFn: async () => {
      if (!user) return [];

      // Calculate date filter
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case "24h":
          startDate.setHours(now.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setFullYear(now.getFullYear() - 1);
      }

      let query = supabase
        .from("email_events")
        .select("*, email_campaigns(campaign_name)")
        .eq("user_id", user.id)
        .gte("occurred_at", startDate.toISOString())
        .order("occurred_at", { ascending: false })
        .limit(500);

      // Apply event type filter
      if (eventTypeFilter !== "all") {
        query = query.eq("event_type", eventTypeFilter);
      }

      // Apply recipient filter
      if (recipientFilter.trim()) {
        query = query.ilike("to_email", `%${recipientFilter.trim()}%`);
      }

      const { data: events } = await query;

      // Fetch replies if no specific event type filter (or filter = reply)
      let replies: any[] = [];
      if (eventTypeFilter === "all" || eventTypeFilter === "reply") {
        const { data: replyData } = await supabase
          .from("email_replies")
          .select("*, email_events!inner(to_email, email_subject, user_id)")
          .eq("email_events.user_id", user.id)
          .gte("received_at", startDate.toISOString())
          .order("received_at", { ascending: false })
          .limit(100);

        replies = replyData || [];
      }

      // Combine and format
      const emailEvents = (events || []).map(event => ({
        id: event.id,
        occurred_at: event.occurred_at,
        event_type: event.event_type,
        to_email: event.to_email,
        subject: event.email_subject,
        source: event.email_campaigns?.campaign_name || "Manual",
      }));

      const replyEvents = replies.map(reply => ({
        id: reply.id,
        occurred_at: reply.received_at,
        event_type: "reply",
        to_email: reply.from_email,
        subject: reply.subject,
        source: "Reply",
      }));

      return [...emailEvents, ...replyEvents].sort((a, b) => 
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      );
    },
    enabled: !!user,
  });

  const getEventLabel = (eventType: string) => {
    return eventType.replace("email.", "").split("_").map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(" ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8 text-primary" />
              Mail History
            </h1>
            <p className="text-muted-foreground">
              Complete audit log of all email activity
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Refine your mail history view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Event Type</label>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="email.sent">Sent</SelectItem>
                    <SelectItem value="email.delivered">Delivered</SelectItem>
                    <SelectItem value="email.opened">Opened</SelectItem>
                    <SelectItem value="email.clicked">Clicked</SelectItem>
                    <SelectItem value="email.bounced">Bounced</SelectItem>
                    <SelectItem value="reply">Reply</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Recipient Email</label>
                <Input
                  placeholder="Filter by recipient..."
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              {history.length} event{history.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Filter className="h-12 w-12 mb-3 opacity-50" />
                <p>No events match your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Time</TableHead>
                      <TableHead className="w-[120px]">Type</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="w-[150px]">Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((event) => {
                      const Icon = EVENT_TYPE_ICONS[event.event_type as keyof typeof EVENT_TYPE_ICONS] || Mail;
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(event.occurred_at), "MMM d, yyyy h:mm a")}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={EVENT_TYPE_COLORS[event.event_type] || ""}
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {getEventLabel(event.event_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{event.to_email}</TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {event.subject || "(No subject)"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {event.source}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
