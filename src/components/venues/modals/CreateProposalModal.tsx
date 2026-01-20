import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId?: string;
  isDemoMode?: boolean;
  onSuccess?: () => void;
}

interface Client { id: string; first_name: string; last_name?: string | null; email: string | null; }
interface Space { id: string; name: string; }

const eventTypes = ["Wedding", "Corporate Event", "Birthday Party", "Anniversary", "Gala", "Conference", "Concert", "Private Dinner", "Other"];
const addOns = [
  { id: "catering", label: "Full Catering", price: 2500 },
  { id: "bar", label: "Open Bar Package", price: 1500 },
  { id: "decor", label: "Premium Décor", price: 1000 },
  { id: "av", label: "A/V Equipment", price: 500 },
  { id: "photography", label: "Event Photography", price: 800 },
  { id: "valet", label: "Valet Parking", price: 400 },
];

export function CreateProposalModal({ open, onOpenChange, venueId, isDemoMode = true, onSuccess }: CreateProposalModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    clientId: "",
    eventType: "",
    eventDate: "",
    spaceId: "",
    basePrice: "",
    guestCount: "",
    notes: ""
  });

  useEffect(() => {
    if (open && venueId) {
      loadData();
    }
  }, [open, venueId]);

  const loadData = async () => {
    if (!venueId) return;
    const [clientsRes, spacesRes] = await Promise.all([
      supabase.from('venue_clients').select('id, first_name, last_name, email').eq('venue_id', venueId),
      supabase.from('venue_spaces').select('id, name').eq('venue_id', venueId)
    ]);
    if (clientsRes.data) setClients(clientsRes.data);
    if (spacesRes.data) setSpaces(spacesRes.data);
  };

  const calculateTotal = () => {
    const base = parseFloat(formData.basePrice) || 0;
    const addOnsTotal = addOns.filter(a => selectedAddOns.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
    return base + addOnsTotal;
  };

  const handleSpaceChange = (spaceId: string) => {
    setFormData({ 
      ...formData, 
      spaceId
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId) {
      toast.error("No venue selected");
      return;
    }

    setLoading(true);
    try {
      const selectedAddOnData = addOns.filter(a => selectedAddOns.includes(a.id));
      const { error } = await supabase
        .from('venue_proposals')
        .insert({
          venue_id: venueId,
          client_id: formData.clientId,
          space_id: formData.spaceId || null,
          event_type: formData.eventType,
          event_date: formData.eventDate || null,
          guest_count: parseInt(formData.guestCount) || null,
          base_price: parseFloat(formData.basePrice) || 0,
          add_ons: selectedAddOnData,
          total_price: calculateTotal(),
          notes: formData.notes,
          status: 'draft',
          is_demo: isDemoMode
        });

      if (error) throw error;

      toast.success("Proposal created!");
      setFormData({ clientId: "", eventType: "", eventDate: "", spaceId: "", basePrice: "", guestCount: "", notes: "" });
      setSelectedAddOns([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      toast.error(error.message || "Failed to create proposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Proposal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })} required>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.first_name} {client.last_name || ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Event Type *</Label>
              <Select value={formData.eventType} onValueChange={(v) => setFormData({ ...formData, eventType: v })} required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Date</Label>
              <Input type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Guest Count</Label>
              <Input type="number" value={formData.guestCount} onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Space</Label>
              <Select value={formData.spaceId} onValueChange={handleSpaceChange}>
                <SelectTrigger><SelectValue placeholder="Select space" /></SelectTrigger>
                <SelectContent>
                  {spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Package Price ($)</Label>
              <Input type="number" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })} placeholder="5000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Add-Ons</Label>
            <div className="grid grid-cols-2 gap-2">
              {addOns.map((addOn) => (
                <label key={addOn.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <Checkbox
                    checked={selectedAddOns.includes(addOn.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAddOns([...selectedAddOns, addOn.id]);
                      } else {
                        setSelectedAddOns(selectedAddOns.filter(id => id !== addOn.id));
                      }
                    }}
                  />
                  <span className="text-sm">{addOn.label}</span>
                  <span className="text-sm text-gray-500 ml-auto">${addOn.price}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>${calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Proposal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
