import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { sendVenueEmail } from "@/lib/venues/messaging";
import { Checkbox } from "@/components/ui/checkbox";

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId?: string;
  isDemoMode?: boolean;
  onSuccess?: () => void;
  preselectedClientId?: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name?: string | null;
  email: string | null;
}

export function SendEmailModal({ open, onOpenChange, venueId, isDemoMode = true, onSuccess, preselectedClientId }: SendEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    subject: "",
    body: ""
  });

  useEffect(() => {
    if (open && venueId) {
      loadClients();
    }
  }, [open, venueId]);

  useEffect(() => {
    if (preselectedClientId) {
      setSelectedClients([preselectedClientId]);
    }
  }, [preselectedClientId]);

  const loadClients = async () => {
    if (!venueId) return;
    const { data } = await supabase
      .from('venue_clients')
      .select('id, first_name, last_name, email')
      .eq('venue_id', venueId);
    if (data) setClients(data);
  };

  const toggleClient = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId) {
      toast.error("No venue selected");
      return;
    }
    if (selectedClients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    setLoading(true);
    try {
      const selectedClientData = clients.filter(c => selectedClients.includes(c.id) && c.email);
      
      for (const client of selectedClientData) {
        await sendVenueEmail({
          venueId,
          clientId: client.id,
          to: client.email!,
          subject: formData.subject,
          body: formData.body,
          isDemoMode
        });
      }

      toast.success(
        isDemoMode 
          ? `Email logged for ${selectedClientData.length} recipient(s) (Demo mode - not sent)`
          : `Email sent to ${selectedClientData.length} recipient(s)`
      );
      
      setFormData({ subject: "", body: "" });
      setSelectedClients([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
        </DialogHeader>
        
        {isDemoMode && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Demo mode: Emails will be logged but not actually sent</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Recipients *</Label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {clients.length === 0 ? (
                <p className="text-sm text-gray-500 p-2">No clients found. Add clients first.</p>
              ) : (
                clients.map((client) => (
                  <label key={client.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => toggleClient(client.id)}
                      disabled={!client.email}
                    />
                    <span className="text-sm">{client.first_name} {client.last_name || ''}</span>
                    <span className="text-xs text-gray-500">({client.email || 'No email'})</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500">{selectedClients.length} selected</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Your email subject..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={6}
              placeholder="Write your email content here..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedClients.length === 0}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isDemoMode ? "Log Email (Demo)" : "Send Email"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
