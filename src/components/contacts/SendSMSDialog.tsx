import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContactInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface SendSMSDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactInfo | null;
}

export const SendSMSDialog = ({ isOpen, onOpenChange, contact }: SendSMSDialogProps) => {
  const [message, setMessage] = useState("");
  const [hasOptedOut, setHasOptedOut] = useState(false);
  const [checkingOptOut, setCheckingOptOut] = useState(false);

  // Check SMS opt-out status
  useEffect(() => {
    const checkOptOutStatus = async () => {
      if (!contact?.email || !isOpen) {
        setHasOptedOut(false);
        return;
      }

      setCheckingOptOut(true);
      try {
        // @ts-ignore - Bypass type inference depth issue
        const result: any = await supabase
          .from("user_preferences")
          .select("sms_notifications_enabled")
          .eq("user_email", contact.email)
          .limit(1);

        const data = result.data;
        const error = result.error;

        if (error) {
          console.error("Error checking opt-out status:", error);
          setHasOptedOut(false);
        } else if (data && data.length > 0) {
          setHasOptedOut(data[0].sms_notifications_enabled === false);
        } else {
          setHasOptedOut(false);
        }
      } catch (err) {
        console.error("Failed to check opt-out:", err);
        setHasOptedOut(false);
      } finally {
        setCheckingOptOut(false);
      }
    };

    checkOptOutStatus();
  }, [contact?.email, isOpen]);

  const sendSMS = useMutation({
    mutationFn: async ({ to, message }: { to: string; message: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { to, message },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("SMS sent successfully");
      setMessage("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to send SMS: ${error?.message || 'Unknown error'}`);
    },
  });

  const handleSend = () => {
    if (!contact?.phone) {
      toast.error("Contact has no phone number");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (message.length > 1600) {
      toast.error("Message too long. Maximum 1600 characters.");
      return;
    }

    sendSMS.mutate({ to: contact.phone, message: message.trim() });
  };

  const characterCount = message.length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send SMS
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">To:</label>
            <p className="text-sm text-muted-foreground">
              {contact?.name} ({contact?.phone || "No phone number"})
            </p>
          </div>

          {hasOptedOut && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This contact has opted out of SMS notifications. Sending messages may violate their preferences.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium">Message *</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              maxLength={1600}
              disabled={!contact?.phone || hasOptedOut || checkingOptOut}
              className="mt-1"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                {characterCount}/1600 characters
              </p>
              {characterCount > 160 && (
                <p className="text-xs text-muted-foreground">
                  ~{Math.ceil(characterCount / 160)} SMS segments
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSend}
              disabled={!contact?.phone || !message.trim() || sendSMS.isPending || hasOptedOut || checkingOptOut}
              className="flex-1"
            >
              {sendSMS.isPending ? "Sending..." : "Send SMS"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sendSMS.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
