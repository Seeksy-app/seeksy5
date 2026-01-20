import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Send, Users, Check, Clock, Eye, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface MeetingInviteManagerProps {
  meetingId: string;
  meetingTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Invite {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  accepted_at: string | null;
}

export function MeetingInviteManager({
  meetingId,
  meetingTitle,
  isOpen,
  onClose,
}: MeetingInviteManagerProps) {
  const queryClient = useQueryClient();
  const [emailInput, setEmailInput] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  // Fetch existing invites
  const { data: invites = [], isLoading } = useQuery({
    queryKey: ["board-meeting-invites", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_meeting_invites")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Invite[];
    },
    enabled: isOpen,
  });

  // Send invite mutation
  const sendInviteMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name?: string }) => {
      const { data, error } = await supabase.functions.invoke("board-send-meeting-invite", {
        body: {
          meeting_id: meetingId,
          invitee_email: email.trim().toLowerCase(),
          invitee_name: name,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-meeting-invites", meetingId] });
    },
  });

  const handleSendSingle = async () => {
    if (!emailInput.trim()) return;
    
    try {
      await sendInviteMutation.mutateAsync({ email: emailInput });
      toast.success(`Invitation sent to ${emailInput}`);
      setEmailInput("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    }
  };

  const handleSendBulk = async () => {
    const emails = bulkEmails
      .split(/[\n,;]/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e && e.includes("@"));

    if (emails.length === 0) {
      toast.error("No valid emails found");
      return;
    }

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        await sendInviteMutation.mutateAsync({ email });
        sent++;
      } catch {
        failed++;
      }
    }

    if (sent > 0) {
      toast.success(`Sent ${sent} invitation(s)${failed > 0 ? `, ${failed} failed` : ""}`);
    } else {
      toast.error("Failed to send invitations");
    }
    
    setBulkEmails("");
    setShowBulk(false);
  };

  const handleResend = async (email: string) => {
    try {
      await sendInviteMutation.mutateAsync({ email });
      toast.success(`Invitation resent to ${email}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to resend");
    }
  };

  const getStatusBadge = (invite: Invite) => {
    if (invite.accepted_at) {
      return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;
    }
    if (invite.opened_at) {
      return <Badge className="bg-blue-100 text-blue-700">Opened</Badge>;
    }
    return <Badge variant="outline">Sent</Badge>;
  };

  const getStatusIcon = (invite: Invite) => {
    if (invite.accepted_at) return <Check className="w-4 h-4 text-green-600" />;
    if (invite.opened_at) return <Eye className="w-4 h-4 text-blue-600" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Invite Board Members
          </DialogTitle>
          <DialogDescription>
            Send invitations to "{meetingTitle}" with calendar attachment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Single email input */}
          {!showBulk ? (
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="member@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendSingle()}
                />
                <Button 
                  onClick={handleSendSingle} 
                  disabled={sendInviteMutation.isPending || !emailInput.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowBulk(true)}
                className="text-xs"
              >
                Add multiple emails at once
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Bulk Email Addresses</Label>
              <Textarea
                placeholder="Enter emails separated by commas, semicolons, or new lines..."
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSendBulk} 
                  disabled={sendInviteMutation.isPending || !bulkEmails.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send All
                </Button>
                <Button variant="ghost" onClick={() => setShowBulk(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Existing invites list */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Sent Invitations ({invites.length})
              </Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(invite)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {invite.invitee_name || invite.invitee_email}
                        </p>
                        {invite.invitee_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {invite.invitee_email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(invite)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResend(invite.invitee_email)}
                        disabled={sendInviteMutation.isPending}
                        title="Resend invitation"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center text-muted-foreground py-4">
              Loading invitations...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
