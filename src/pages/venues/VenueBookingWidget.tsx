import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Users, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const colors = {
  primary: "#053877",
  primaryLight: "#2C6BED",
  background: "#F5F7FF",
};

const eventTypes = [
  "Wedding",
  "Corporate Event",
  "Birthday Party",
  "Anniversary",
  "Conference",
  "Concert",
  "Other",
];

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
  event_types: string[];
  brand_primary_color: string;
}

export default function VenueBookingWidget() {
  const { venueSlug } = useParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [eventType, setEventType] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchVenue() {
      if (!venueSlug) return;

      const { data, error } = await supabase
        .from("venues")
        .select("id, name, city, state, event_types, brand_primary_color")
        .eq("slug", venueSlug)
        .single();

      if (error) {
        console.error("Error fetching venue:", error);
      } else {
        setVenue(data);
      }
      setLoading(false);
    }

    fetchVenue();
  }, [venueSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!venue || !selectedDate || !eventType || !name || !email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Create the booking inquiry directly (client creation handled by venue owner)
      const startTime = new Date(selectedDate);
      startTime.setHours(10, 0, 0, 0);
      const endTime = new Date(selectedDate);
      endTime.setHours(22, 0, 0, 0);

      const { error: bookingError } = await supabase
        .from("venue_bookings")
        .insert({
          venue_id: venue.id,
          title: `${eventType} - ${name}`,
          event_type: eventType,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          guest_count: parseInt(guestCount) || null,
          status: "inquiry",
          source: "widget",
          notes_internal: `Contact: ${name}, ${email}, ${phone}\n\n${message}`,
        });

      if (bookingError) throw bookingError;

      setSubmitted(true);
      toast.success("Inquiry submitted successfully!");
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Venue Not Found</h2>
            <p className="text-gray-600">The venue you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your interest in {venue.name}. Our team will reach out to you within 24 hours.
            </p>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setSelectedDate(undefined);
                setEventType("");
                setGuestCount("");
                setName("");
                setEmail("");
                setPhone("");
                setMessage("");
              }}
              variant="outline"
            >
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = venue.brand_primary_color || colors.primary;

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: colors.background }}>
      <Card className="max-w-2xl mx-auto border-0 shadow-lg">
        {/* Header */}
        <div className="p-6 rounded-t-lg" style={{ backgroundColor: primaryColor }}>
          <h1 className="text-2xl font-bold text-white">{venue.name}</h1>
          <div className="flex items-center gap-1 mt-1 text-white/80">
            <MapPin className="h-4 w-4" />
            <span>{venue.city}, {venue.state}</span>
          </div>
        </div>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Event Details</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Event Type *</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(venue.event_types?.length ? venue.event_types : eventTypes).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Estimated Guests</Label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      placeholder="100"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Preferred Date *</Label>
                <div className="mt-2 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
                {selectedDate && (
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Selected: {format(selectedDate, "MMMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-gray-900">Your Information</h3>
              
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1"
                />
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label>Additional Details</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more about your event..."
                  className="mt-1"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={submitting}
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Request This Date
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Powered by */}
      <p className="text-center text-sm text-gray-400 mt-6">
        Powered by Seeksy VenueOS
      </p>
    </div>
  );
}
