import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, CheckCircle2, Clock, AlertCircle, Copy, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { TicketDetailDialog } from "@/components/pm/TicketDetailDialog";

export default function ClientTickets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    clientContactId: "",
    priority: "medium",
    category: "",
    dueDate: "",
  });

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }
      return user;
    },
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["client-tickets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("client_tickets")
        .select(`
          *,
          contacts (
            id,
            name,
            email,
            company
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    navigate("/auth");
    return null;
  }

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: typeof formData) => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("client_tickets")
        .insert({
          user_id: user.id,
          title: ticketData.title,
          description: ticketData.description,
          client_contact_id: ticketData.clientContactId || null,
          priority: ticketData.priority,
          category: ticketData.category || null,
          due_date: ticketData.dueDate || null,
          status: "open",
          source: "internal",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Ticket Created! 🎫",
        description: "Your client ticket has been added to the queue.",
      });
      queryClient.invalidateQueries({ queryKey: ["client-tickets"] });
      setShowCreateDialog(false);
      setFormData({
        title: "",
        description: "",
        clientContactId: "",
        priority: "medium",
        category: "",
        dueDate: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const { error } = await supabase
        .from("client_tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Ticket Updated",
        description: "Status has been changed.",
      });
      queryClient.invalidateQueries({ queryKey: ["client-tickets"] });
    },
  });

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return <Badge className={colors[priority as keyof typeof colors] || colors.medium}>{priority}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      open: <AlertCircle className="h-4 w-4 text-blue-500" />,
      in_progress: <Clock className="h-4 w-4 text-yellow-500" />,
      completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      closed: <CheckCircle2 className="h-4 w-4 text-gray-500" />,
    };
    return icons[status as keyof typeof icons] || icons.open;
  };

  const copyLeadFormLink = () => {
    const leadFormUrl = `${window.location.origin}/submit-ticket`;
    navigator.clipboard.writeText(leadFormUrl);
    toast({
      title: "Link Copied! 📋",
      description: "Lead form link has been copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Tickets</h1>
            <p className="text-muted-foreground mt-2">
              Manage tasks and requests from your clients
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyLeadFormLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Lead Form Link
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Client Ticket</DialogTitle>
                <DialogDescription>
                  Add a new task or request from a client
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label>Client Name</Label>
                  <Select value={formData.clientContactId} onValueChange={(value) => setFormData({ ...formData, clientContactId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client from CRM" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactsLoading ? (
                        <div className="p-4 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </div>
                      ) : (
                        contacts?.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name} {contact.company && `(${contact.company})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="Brief description of the task"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Detailed information about the task or request"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Category (Optional)</Label>
                  <Input
                    placeholder="e.g., Design, Development, Content"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createTicketMutation.mutate(formData)}
                  disabled={!formData.title || createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Ticket"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
            <CardDescription>View and manage client requests and tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : !tickets || tickets.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first client ticket to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket: any) => (
                    <TableRow 
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        setShowDetailDialog(true);
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          <span className="text-sm capitalize">{ticket.status.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{ticket.title}</TableCell>
                      <TableCell>
                        {ticket.contacts ? (
                          <div className="text-sm">
                            <div>{ticket.contacts.name}</div>
                            {ticket.contacts.company && (
                              <div className="text-xs text-muted-foreground">{ticket.contacts.company}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No client</span>
                        )}
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>
                        {ticket.due_date ? format(new Date(ticket.due_date), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ticket.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) =>
                            updateTicketStatusMutation.mutate({ ticketId: ticket.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <TicketDetailDialog
          ticketId={selectedTicketId}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ["client-tickets"] })}
        />
      </div>
    </div>
  );
}
