import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, User, MessageSquare } from "lucide-react";
import { useState } from "react";

interface Ticket {
  id: string;
  customer: string;
  subject: string;
  priority: string;
  status: string;
  time: string;
}

interface TicketDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
}

export default function TicketDetailModal({ open, onOpenChange, ticket }: TicketDetailModalProps) {
  const [reply, setReply] = useState("");

  if (!ticket) return null;

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "destructive";
    if (priority === "medium") return "default";
    return "secondary";
  };

  const getStatusColor = (status: string) => {
    if (status === "resolved") return "default";
    if (status === "in-progress") return "default";
    return "secondary";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-xl">{ticket.subject}</DialogTitle>
            <Badge variant={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
            <Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge>
          </div>
          <DialogDescription className="flex items-center gap-4 pt-2">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {ticket.customer}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {ticket.time}
            </span>
            <span className="text-xs text-muted-foreground">{ticket.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              This is a sample ticket description. In a real implementation, this would contain the full ticket details and conversation history.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Reply
            </label>
            <Textarea
              placeholder="Type your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button>Send Reply</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
