import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateTicketModal({ open, onOpenChange, onSuccess }: CreateTicketModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "General",
    requester_name: "",
    requester_email: "",
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate ticket number
      const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase.from("tickets").insert({
        user_id: user?.id,
        ticket_number: ticketNumber,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        status: "open",
        source: "manual",
        channel: "helpdesk",
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket created successfully");
      queryClient.invalidateQueries({ queryKey: ["helpdesk-tickets"] });
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        category: "General",
        requester_name: "",
        requester_email: "",
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to create ticket");
      console.error(error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requester_name">Requester Name</Label>
              <Input
                id="requester_name"
                placeholder="John Doe"
                value={formData.requester_name}
                onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requester_email">Requester Email</Label>
              <Input
                id="requester_email"
                type="email"
                placeholder="john@example.com"
                value={formData.requester_email}
                onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Subject *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the issue..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Feature Request">Feature Request</SelectItem>
                  <SelectItem value="Bug">Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => createTicket.mutate()} disabled={!formData.title.trim() || createTicket.isPending}>
            {createTicket.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}