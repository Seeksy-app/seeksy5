import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface StudioInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionName: string;
  onInviteSent?: (email: string) => void;
}

export function StudioInviteDialog({
  open,
  onOpenChange,
  sessionName,
  onInviteSent,
}: StudioInviteDialogProps) {
  const { toast } = useToast();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const handleSendInvite = () => {
    if (!guestName || !guestEmail) {
      toast({
        title: "Missing information",
        description: "Please provide both name and email",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, this would send an actual email invitation
    // For now, we'll just show a success message
    toast({
      title: "Invitation sent!",
      description: `Studio invitation sent to ${guestEmail}`,
    });

    onInviteSent?.(guestEmail);
    
    // Reset form and close dialog
    setGuestName("");
    setGuestEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Guest to Studio</DialogTitle>
          <DialogDescription>
            Invite someone to join your "{sessionName}" recording session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="guest-name">Guest Name *</Label>
            <Input
              id="guest-name"
              placeholder="John Doe"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guest-email">Email *</Label>
            <Input
              id="guest-email"
              type="email"
              placeholder="john@example.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendInvite}>
            <Send className="w-4 h-4 mr-2" />
            Send Invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
