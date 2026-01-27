import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
  userId: string;
  onSuccess: () => void;
}

export const SendDocumentDialog = ({ open, onOpenChange, templateId, userId, onSuccess }: SendDocumentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient_name: "",
    recipient_email: "",
    client_id: "",
  });

  const { data: template } = useQuery({
    queryKey: ["document-template", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const result = await (supabase as any)
        .from("document_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      
      if (result.error) throw result.error;
      return result.data as any;
    },
    enabled: !!templateId,
  });

  const { data: clients } = useQuery({
    queryKey: ["clients", userId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("clients")
        .select("*")
        .eq("user_id", userId);
      
      if (result.error) throw result.error;
      return (result.data || []) as any[];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipient_name || !formData.recipient_email || !template) {
      toast.error("Recipient name and email are required");
      return;
    }

    setLoading(true);
    try {
      // Generate unique access token
      const accessToken = crypto.randomUUID();

      const { error } = await (supabase as any).from("signature_documents").insert({
        user_id: userId,
        template_id: templateId,
        client_id: formData.client_id || null,
        document_title: template.template_name,
        document_content: template.document_content,
        recipient_name: formData.recipient_name,
        recipient_email: formData.recipient_email,
        access_token: accessToken,
        status: "pending",
      });

      if (error) throw error;

      const signingLink = `${window.location.origin}/sign/${accessToken}`;
      
      toast.success("Document sent successfully!");
      toast.info("Signing link copied to clipboard", {
        description: "Share this link with your client",
      });
      navigator.clipboard.writeText(signingLink);

      onSuccess();
      onOpenChange(false);
      setFormData({
        recipient_name: "",
        recipient_email: "",
        client_id: "",
      });
    } catch (error) {
      console.error("Error sending document:", error);
      toast.error("Failed to send document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Document for Signature</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Template</Label>
            <Input value={template?.template_name || ""} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client (optional)</Label>
            <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name || client.contact_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_name">Recipient Name *</Label>
            <Input
              id="recipient_name"
              value={formData.recipient_name}
              onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_email">Recipient Email *</Label>
            <Input
              id="recipient_email"
              type="email"
              value={formData.recipient_email}
              onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send for Signature"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
