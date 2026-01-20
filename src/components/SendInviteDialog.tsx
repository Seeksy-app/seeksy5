import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { ActivityLogger } from "@/lib/activityLogger";

interface SendInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingTypeId: string;
  meetingTypeName: string;
}

export const SendInviteDialog = ({
  open,
  onOpenChange,
  meetingTypeId,
  meetingTypeName,
}: SendInviteDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inviteeName, setInviteeName] = useState("");
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const handleSendInvite = async () => {
    if (!inviteeName || !inviteeEmail) {
      toast({
        title: "Missing information",
        description: "Please provide both name and email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-meeting-invitation", {
        body: {
          inviteeEmail,
          inviteeName,
          meetingTypeId,
          customMessage,
        },
      });

      if (error) throw error;

      // Log the activity
      await ActivityLogger.inviteSent(inviteeEmail, meetingTypeName);

      toast({
        title: "Invitation sent!",
        description: `Meeting invitation sent to ${inviteeEmail}`,
      });

      // Reset form and close dialog
      setInviteeName("");
      setInviteeEmail("");
      setCustomMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Meeting Invitation</DialogTitle>
          <DialogDescription>
            Invite someone to schedule a {meetingTypeName} meeting with you
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={inviteeName}
              onChange={(e) => setInviteeName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to your invitation..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendInvite} disabled={loading}>
            <Send className="w-4 h-4 mr-2" />
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};