import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, MessageSquare } from "lucide-react";

interface TicketDetailDialogProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

type TeamMember = {
  id: string;
  full_name: string | null;
};

export function TicketDetailDialog({ ticketId, open, onOpenChange, onUpdate }: TicketDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (open && ticketId) {
      loadTicketDetails();
      loadTeamMembers();
      loadComments();
    }
  }, [open, ticketId]);

  const loadTicketDetails = async () => {
    if (!ticketId) return;
    
    setLoading(true);
    try {
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
        .eq("id", ticketId)
        .single();

      if (error) throw error;

      setTicket(data);
      setStatus(data.status || "open");
      setPriority(data.priority || "medium");
      setAssignedTo((data as any).assigned_to || "");
      setNotes((data as any).notes || "");
      setDueDate(data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : "");
      setPaymentMethod((data as any).payment_method || "");
    } catch (error) {
      console.error("Error loading ticket:", error);
      toast.error("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get team members
      const { data: team } = await supabase
        .from("teams")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!team) return;

      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", team.id);

      if (!members) return;

      // Get profiles for team members
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, account_full_name, full_name, username")
        .in("id", members.map(m => m.user_id));

      if (profiles) {
        setTeamMembers(profiles.map(p => ({
          id: p.id,
          full_name: p.account_full_name || p.full_name || p.username || "Unknown"
        })));
      }
    } catch (error) {
      console.error("Error loading team members:", error);
    }
  };

  const loadComments = async () => {
    if (!ticketId) return;
    
    try {
      const { data, error } = await supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !ticketId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("ticket_comments").insert({
        ticket_id: ticketId,
        user_id: user.id,
        comment_text: comment,
      });

      if (error) throw error;

      toast.success("Comment added");
      setComment("");
      loadComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleSave = async () => {
    if (!ticketId) return;
    
    setSaving(true);
    try {
      const updateData: any = {
        status,
        priority,
        assigned_to: assignedTo || null,
        notes,
        due_date: dueDate || null,
        payment_method: paymentMethod || null,
        last_activity_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("client_tickets")
        .update(updateData)
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Ticket updated successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-card border">
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)] px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !ticket ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Ticket not found</p>
            </div>
          ) : (
            <>
              <DialogHeader className="sticky top-0 bg-card pb-4 z-10">
                <DialogTitle className="flex items-center gap-2">
                  {ticket.title}
                  <Badge variant="outline" className="ml-2">
                    Ticket #{ticket.id.slice(0, 8)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Client: {ticket.contacts?.name} {ticket.contacts?.company && `(${ticket.contacts.company})`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
              {/* Status and Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
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
              </div>

              {/* Assignment and Due Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select value={assignedTo || "unassigned"} onValueChange={(value) => setAssignedTo(value === "unassigned" ? "" : value)}>
                    <SelectTrigger id="assignedTo">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {member.full_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod || "none"} onValueChange={(value) => setPaymentMethod(value === "none" ? "" : value)}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None Selected</SelectItem>
                    <SelectItem value="stripe_ach">Stripe ACH</SelectItem>
                    <SelectItem value="stripe_card">Stripe Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              {ticket.description && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    {ticket.description}
                  </div>
                </div>
              )}

              {/* Photos */}
              {ticket.photos && ticket.photos.length > 0 && (
                <div className="space-y-2">
                  <Label>Attached Photos ({ticket.photos.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ticket.photos.map((url: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Ticket photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white text-xs underline"
                          >
                            View Full Size
                          </a>
                        </div>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                          Photo {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this ticket..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Comments Section */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments ({comments.length})
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {comments.map((c) => (
                    <Card key={c.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">Team Member</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{c.comment_text}</p>
                    </Card>
                  ))}

                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No comments yet
                    </p>
                  )}
                </div>

                {/* Add Comment */}
                <div className="space-y-2">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleAddComment} size="sm" disabled={!comment.trim()}>
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              {ticket.contacts && (
                <div className="space-y-2 border-t pt-6">
                  <Label>Client Information</Label>
                  <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                    <div><strong>Name:</strong> {ticket.contacts.name}</div>
                    <div><strong>Email:</strong> {ticket.contacts.email}</div>
                    {ticket.contacts.company && (
                      <div><strong>Company:</strong> {ticket.contacts.company}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex gap-4 text-xs text-muted-foreground border-t pt-4">
                <div>Created: {new Date(ticket.created_at).toLocaleString()}</div>
                {ticket.last_activity_at && (
                  <div>Last Activity: {new Date(ticket.last_activity_at).toLocaleString()}</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
