import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Clock, AlertCircle, CheckCircle2, Loader2, RefreshCw, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import CreateTicketModal from "@/components/helpdesk/CreateTicketModal";
import { demoTickets, DemoTicket } from "@/data/helpdeskDemoData";

type TicketStatus = "all" | "open" | "in_progress" | "resolved" | "archived";

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  category: string | null;
  requester_name: string | null;
  requester_email: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_activity_at: string | null;
}

export default function TicketsInbox() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TicketStatus>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: dbTickets = [], isLoading, refetch } = useQuery({
    queryKey: ["helpdesk-tickets", activeTab],
    queryFn: async () => {
      let query = supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as Ticket[];
    },
  });

  // Merge demo tickets with database tickets, prioritizing DB tickets
  const tickets = useMemo(() => {
    const dbIds = new Set(dbTickets.map(t => t.id));
    const filteredDemo = demoTickets
      .filter(t => !dbIds.has(t.id))
      .filter(t => activeTab === "all" || t.status === activeTab) as Ticket[];
    return [...dbTickets, ...filteredDemo];
  }, [dbTickets, activeTab]);

  const filteredTickets = useMemo(() => {
    if (!searchQuery) return tickets;
    const query = searchQuery.toLowerCase();
    return tickets.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.ticket_number.toLowerCase().includes(query) ||
        t.requester_name?.toLowerCase().includes(query) ||
        t.requester_email?.toLowerCase().includes(query)
    );
  }, [tickets, searchQuery]);

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent": return "bg-red-500/10 text-red-600 border-red-200";
      case "high": return "bg-orange-500/10 text-orange-600 border-orange-200";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "low": return "bg-green-500/10 text-green-600 border-green-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "open": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "in_progress": return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "resolved": return "bg-green-500/10 text-green-600 border-green-200";
      case "archived": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "open": return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-purple-500" />;
      case "resolved": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowCreateModal(true);
      }
      if (e.key === "/" || e.key === "s") {
        e.preventDefault();
        document.getElementById("ticket-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const stats = useMemo(() => ({
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    total: tickets.length,
  }), [tickets]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Ticket Inbox</h2>
            <p className="text-sm text-muted-foreground">
              {stats.open} open · {stats.inProgress} in progress · {stats.total} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Ticket
              <kbd className="ml-2 text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded">N</kbd>
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="ticket-search"
              placeholder="Search tickets... (press /)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TicketStatus)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Inbox className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No tickets found</p>
            <p className="text-sm">Create a new ticket to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/helpdesk/ticket/${ticket.id}`)}
                className="flex items-start gap-4 px-6 py-4 hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <Avatar className="h-10 w-10 mt-1">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {ticket.requester_name?.charAt(0) || ticket.requester_email?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{ticket.title}</span>
                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(ticket.priority))}>
                      {ticket.priority || "normal"}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(ticket.status))}>
                      {ticket.status?.replace("_", " ") || "open"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{ticket.requester_name || ticket.requester_email || "Unknown"}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ticket.created_at ? formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true }) : "Unknown"}
                    </span>
                    <span>·</span>
                    <span className="text-xs font-mono">{ticket.ticket_number}</span>
                  </div>
                  {ticket.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {ticket.description}
                    </p>
                  )}
                </div>
                {getStatusIcon(ticket.status)}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTicketModal open={showCreateModal} onOpenChange={setShowCreateModal} onSuccess={() => refetch()} />
    </div>
  );
}