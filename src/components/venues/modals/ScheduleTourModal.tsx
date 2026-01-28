import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ScheduleTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId?: string;
  isDemoMode?: boolean;
  onSuccess?: () => void;
}

interface Client {
  id: string;
  first_name: string;
  last_name?: string | null;
  email: string | null;
}

interface Space {
  id: string;
  name: string;
}

export function ScheduleTourModal({ open, onOpenChange, venueId, isDemoMode = true, onSuccess }: ScheduleTourModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [createNewClient, setCreateNewClient] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    newClientName: "",
    newClientEmail: "",
    newClientPhone: "",
    date: "",
    time: "",
    spaceId: "",
    notes: ""
  });

  useEffect(() => {
    if (open && venueId) {
      loadClientsAndSpaces();
    }
  }, [open, venueId]);

  const loadClientsAndSpaces = async () => {
    if (!venueId) return;

    const [clientsRes, spacesRes] = await Promise.all([
      (supabase as any).from('venue_clients').select('id, first_name, last_name, email').eq('venue_id', venueId),
      (supabase as any).from('venue_spaces').select('id, name').eq('venue_id', venueId)
    ]);

    if (clientsRes.data) setClients(clientsRes.data as Client[]);
    if (spacesRes.data) setSpaces(spacesRes.data as Space[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId) {
      toast.error("No venue selected");
      return;
    }

    setLoading(true);
    try {
      let clientId = formData.clientId;

      // Create new client if needed
      if (createNewClient) {
        const nameParts = formData.newClientName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const clientResult = await (supabase as any)
          .from('venue_clients')
          .insert({
            venue_id: venueId,
            first_name: firstName,
            last_name: lastName,
            email: formData.newClientEmail,
            phone: formData.newClientPhone,
            type: 'individual',
            is_demo: isDemoMode
          })
          .select()
          .single();

        if (clientResult.error) throw clientResult.error;
        clientId = (clientResult.data as any).id;
      }

      // Create tour booking
      const tourDate = new Date(`${formData.date}T${formData.time}`);
      const bookingResult = await (supabase as any)
        .from('venue_bookings')
        .insert({
          venue_id: venueId,
          client_id: clientId,
          space_id: formData.spaceId || null,
          event_type: 'Tour',
          event_date: formData.date,
          start_time: tourDate.toISOString(),
          end_time: new Date(tourDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour tour
          status: 'scheduled',
          notes: formData.notes,
          is_demo: isDemoMode
        });

      if (bookingResult.error) throw bookingResult.error;

      toast.success("Tour scheduled successfully!");
      setFormData({ clientId: "", newClientName: "", newClientEmail: "", newClientPhone: "", date: "", time: "", spaceId: "", notes: "" });
      setCreateNewClient(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error scheduling tour:', error);
      toast.error(error.message || "Failed to schedule tour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Tour</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Label>Client</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setCreateNewClient(!createNewClient)}
                className="text-xs"
              >
                {createNewClient ? "Select existing" : "Create new"}
              </Button>
            </div>
            
            {createNewClient ? (
              <div className="space-y-3">
                <Input
                  placeholder="Name"
                  value={formData.newClientName}
                  onChange={(e) => setFormData({ ...formData, newClientName: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.newClientEmail}
                  onChange={(e) => setFormData({ ...formData, newClientEmail: e.target.value })}
                  required
                />
                <Input
                  placeholder="Phone"
                  value={formData.newClientPhone}
                  onChange={(e) => setFormData({ ...formData, newClientPhone: e.target.value })}
                />
              </div>
            ) : (
              <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name || ''} ({client.email || 'No email'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="space">Space to Show</Label>
            <Select value={formData.spaceId} onValueChange={(v) => setFormData({ ...formData, spaceId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="All spaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All spaces</SelectItem>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="e.g., Client interested in outdoor space..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schedule Tour
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
