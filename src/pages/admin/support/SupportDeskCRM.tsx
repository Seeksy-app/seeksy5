import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Headphones, Search, Clock, CheckCircle2, AlertCircle, User, 
  MessageSquare, TrendingUp, Zap, BookOpen, BarChart3, Plus,
  Filter, RefreshCw, ChevronRight, AlertTriangle, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Ticket {
  id: string;
  ticket_number: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  subject: string;
  description: string | null;
  category_id: string | null;
  issue_type: string | null;
  status: string;
  priority: string;
  severity_score: number;
  sentiment_score: number;
  churn_risk_score: number;
  assigned_to: string | null;
  assigned_team: string | null;
  tags: string[] | null;
  sla_due_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface TicketStats {
  total: number;
  open: number;
  pending: number;
  escalated: number;
  closed: number;
  avgResponseTime: string;
  avgResolutionTime: string;
}

export default function SupportDeskCRM() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [stats, setStats] = useState<TicketStats>({
    total: 0, open: 0, pending: 0, escalated: 0, closed: 0,
    avgResponseTime: "2.4h", avgResolutionTime: "18h"
  });

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    user_email: "",
    priority: "medium",
    category_id: "",
    issue_type: ""
  });

  useEffect(() => {
    fetchTickets();
    fetchCategories();
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setTickets(data || []);
      
      // Calculate stats
      const allTickets = data || [];
      setStats({
        total: allTickets.length,
        open: allTickets.filter(t => t.status === "open").length,
        pending: allTickets.filter(t => t.status === "pending").length,
        escalated: allTickets.filter(t => t.status === "escalated").length,
        closed: allTickets.filter(t => t.status === "closed").length,
        avgResponseTime: "2.4h",
        avgResolutionTime: "18h"
      });
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("support_ticket_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");
    setCategories(data || []);
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject) {
      toast.error("Subject is required");
      return;
    }

    try {
      const { error } = await supabase.from("support_tickets").insert({
        subject: newTicket.subject,
        description: newTicket.description || null,
        user_email: newTicket.user_email || null,
        priority: newTicket.priority,
        category_id: newTicket.category_id || null,
        issue_type: newTicket.issue_type || null,
        source: "portal"
      } as any);

      if (error) throw error;

      toast.success("Ticket created successfully");
      setIsCreateOpen(false);
      setNewTicket({ subject: "", description: "", user_email: "", priority: "medium", category_id: "", issue_type: "" });
      fetchTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket");
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (error) throw error;
      toast.success("Status updated");
      fetchTickets();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-black",
      low: "bg-green-500 text-white"
    };
    return colors[priority] || "bg-gray-500 text-white";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      waiting_on_customer: "bg-purple-100 text-purple-800",
      escalated: "bg-red-100 text-red-800",
      closed: "bg-green-100 text-green-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ticket.user_email && ticket.user_email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Headphones className="h-8 w-8 text-primary" />
            Support Desk CRM
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified inbox for customer support with AI-powered automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchTickets()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Subject *</Label>
                  <Input 
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div>
                  <Label>Customer Email</Label>
                  <Input 
                    type="email"
                    value={newTicket.user_email}
                    onChange={(e) => setNewTicket({ ...newTicket, user_email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={newTicket.category_id} onValueChange={(v) => setNewTicket({ ...newTicket, category_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Detailed description of the issue..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTicket}>Create Ticket</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.escalated}</p>
                <p className="text-xs text-muted-foreground">Escalated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgResponseTime}</p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.closed}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets by subject, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="waiting_on_customer">Waiting on Customer</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tickets */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tickets found</p>
                    <p className="text-sm">Create a new ticket or adjust your filters</p>
                  </CardContent>
                </Card>
              ) : (
                filteredTickets.map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className={`cursor-pointer hover:shadow-md transition-all ${selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</span>
                            <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                            <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace(/_/g, " ")}</Badge>
                            {ticket.severity_score > 70 && (
                              <Badge variant="destructive" className="text-xs">High Severity</Badge>
                            )}
                          </div>
                          <h3 className="font-semibold">{ticket.subject}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {ticket.user_email || ticket.user_name || "Anonymous"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Zap className="h-4 w-4 mr-2 text-amber-500" />
                AI Auto-Assign
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <BookOpen className="h-4 w-4 mr-2 text-green-500" />
                Knowledge Base
              </Button>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs font-medium text-amber-800">High Volume Alert</p>
                <p className="text-xs text-amber-700 mt-1">
                  Billing tickets up 23% this week. Consider automated response.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs font-medium text-blue-800">Suggested Action</p>
                <p className="text-xs text-blue-700 mt-1">
                  3 tickets match pattern "studio upload error" - batch respond?
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between text-sm">
                    <span>{cat.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {tickets.filter(t => t.category_id === cat.id).length}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Ticket Detail Modal */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{selectedTicket.ticket_number}</span>
                {selectedTicket.subject}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                <Badge className={getStatusColor(selectedTicket.status)}>{selectedTicket.status.replace(/_/g, " ")}</Badge>
                <Badge variant="outline">Severity: {selectedTicket.severity_score}/100</Badge>
                <Badge variant="outline">Sentiment: {selectedTicket.sentiment_score}/100</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedTicket.user_email || selectedTicket.user_name || "Anonymous"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-2">Description</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedTicket.description || "No description provided"}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-2">Update Status</p>
                <Select 
                  value={selectedTicket.status} 
                  onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="waiting_on_customer">Waiting on Customer</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800">AI Suggested Reply</p>
                </div>
                <p className="text-sm text-amber-700">
                  "Thank you for contacting Seeksy support. I understand you're experiencing issues with {selectedTicket.subject.toLowerCase()}. 
                  Let me help you resolve this. Could you please provide more details about..."
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Use Suggestion
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}