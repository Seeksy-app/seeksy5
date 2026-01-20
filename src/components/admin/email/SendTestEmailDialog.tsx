import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

interface SendTestEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signatures: any[];
}

export function SendTestEmailDialog({ open, onOpenChange, signatures }: SendTestEmailDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: "",
    subject: "Test Email from Seeksy Admin",
    body: "This is a test email sent from Seeksy Admin to verify email delivery.",
    signatureId: "",
  });

  const handleSend = async () => {
    if (!formData.to) {
      toast({
        title: "Missing recipient",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get selected signature HTML if any
      let signatureHtml = "";
      if (formData.signatureId && formData.signatureId !== "none") {
        const signature = signatures.find(s => s.id === formData.signatureId);
        if (signature?.html_signature) {
          signatureHtml = `<br><br>${signature.html_signature}`;
        }
      }

      // Build HTML content
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
          ${formData.body.replace(/\n/g, '<br>')}
          ${signatureHtml}
        </div>
      `;

      // Send via edge function
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: [formData.to],
          subject: formData.subject,
          htmlContent,
        },
      });

      if (error) throw error;

      toast({
        title: "Test email sent!",
        description: `Email delivered to ${formData.to}`,
      });
      
      onOpenChange(false);
      setFormData({
        to: "",
        subject: "Test Email from Seeksy Admin",
        body: "This is a test email sent from Seeksy Admin to verify email delivery.",
        signatureId: "",
      });
    } catch (error: any) {
      console.error("Failed to send test email:", error);
      toast({
        title: "Failed to send email",
        description: error.message || "Please check your Resend configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test email to verify your email configuration is working properly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">Recipient Email</Label>
            <Input
              id="to"
              type="email"
              placeholder="test@example.com"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Email body..."
              rows={4}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Attach Signature</Label>
            <Select
              value={formData.signatureId}
              onValueChange={(value) => setFormData({ ...formData, signatureId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="No signature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Signature</SelectItem>
                {signatures.map((sig) => (
                  <SelectItem key={sig.id} value={sig.id}>
                    {sig.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Test Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}