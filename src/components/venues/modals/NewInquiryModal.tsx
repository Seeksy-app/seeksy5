import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface NewInquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId?: string;
  isDemoMode?: boolean;
  onSuccess?: () => void;
}

const eventTypes = [
  "Wedding",
  "Corporate Event",
  "Birthday Party",
  "Anniversary",
  "Gala",
  "Conference",
  "Concert",
  "Private Dinner",
  "Other"
];

export function NewInquiryModal({ open, onOpenChange, venueId, isDemoMode = true, onSuccess }: NewInquiryModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    dateFlexibility: "",
    guestCount: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId) {
      toast.error("No venue selected");
      return;
    }

    setLoading(true);
    try {
      // Create client
      const nameParts = formData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const { data: client, error: clientError } = await supabase
        .from('venue_clients')
        .insert({
          venue_id: venueId,
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          phone: formData.phone,
          type: 'individual',
          is_demo: isDemoMode
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create booking inquiry
      const { error: bookingError } = await supabase
        .from('venue_bookings')
        .insert({
          venue_id: venueId,
          client_id: client.id,
          event_type: formData.eventType,
          guest_count: parseInt(formData.guestCount) || null,
          status: 'inquiry',
          notes: `Date flexibility: ${formData.dateFlexibility}\n\n${formData.notes}`,
          is_demo: isDemoMode
        });

      if (bookingError) throw bookingError;

      toast.success("Inquiry added successfully!");
      setFormData({ name: "", email: "", phone: "", eventType: "", dateFlexibility: "", guestCount: "", notes: "" });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating inquiry:', error);
      toast.error(error.message || "Failed to create inquiry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Inquiry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCount">Guest Count</Label>
              <Input
                id="guestCount"
                type="number"
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select value={formData.eventType} onValueChange={(v) => setFormData({ ...formData, eventType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFlexibility">Date Flexibility</Label>
              <Select value={formData.dateFlexibility} onValueChange={(v) => setFormData({ ...formData, dateFlexibility: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Specific date">Specific date</SelectItem>
                  <SelectItem value="Flexible within week">Flexible within week</SelectItem>
                  <SelectItem value="Flexible within month">Flexible within month</SelectItem>
                  <SelectItem value="Very flexible">Very flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Inquiry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
