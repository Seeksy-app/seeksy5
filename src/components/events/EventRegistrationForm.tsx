import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Ticket, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import QRCode from "react-qr-code";

interface EventRegistrationFormProps {
  event: {
    id: string;
    title: string;
    description?: string;
    event_date: string;
    location?: string;
    event_type: string;
    virtual_url?: string;
    capacity?: number;
    pricing_mode: string;
  };
  ticketTiers: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    quantity_available?: number;
    quantity_sold: number;
  }>;
  registrationCount: number;
}

export function EventRegistrationForm({ event, ticketTiers, registrationCount }: EventRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedTier, setSelectedTier] = useState(ticketTiers[0]?.id || "");
  const { toast } = useToast();

  const isFull = event.capacity && registrationCount >= event.capacity;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    try {
      // Check for existing registration
      const { data: existing } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", event.id)
        .eq("attendee_email", email)
        .single();

      if (existing) {
        toast({
          title: "Already registered",
          description: "This email is already registered for this event.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create registration
      const { data: registration, error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: event.id,
          attendee_name: name,
          attendee_email: email,
          attendee_phone: phone || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Registration created - ticket creation handled by database trigger or admin
      setRegistrationData(registration);
      setRegistered(true);
      toast({
        title: "Registration successful!",
        description: "Check your email for confirmation details.",
      });

      // Try to send confirmation email
      try {
        await supabase.functions.invoke("send-event-registration-email", {
          body: {
            attendeeName: name,
            attendeeEmail: email,
            eventTitle: event.title,
            eventDate: event.event_date,
            eventLocation: event.location || "Virtual",
            eventDescription: event.description,
            userId: event.id,
            eventId: event.id,
          },
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (registered && registrationData) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">You're Registered!</CardTitle>
          <CardDescription>
            Save your QR code for check-in at the event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white p-4 rounded-lg mx-auto w-fit">
            <QRCode
              value={`${event.id}-${registrationData.id}`}
              size={180}
              level="H"
            />
          </div>

          <div className="text-center space-y-2">
            <p className="font-medium">{name}</p>
            <p className="text-muted-foreground text-sm">{email}</p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{format(new Date(event.event_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            A confirmation email has been sent to {email}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Register for Event
        </CardTitle>
        {event.capacity && (
          <CardDescription>
            {registrationCount} / {event.capacity} spots filled
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isFull ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">This event is at capacity.</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            {ticketTiers.length > 1 && (
              <div className="space-y-2">
                <Label>Select Ticket</Label>
                <div className="grid gap-2">
                  {ticketTiers.map((tier) => (
                    <label
                      key={tier.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTier === tier.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="tier"
                          value={tier.id}
                          checked={selectedTier === tier.id}
                          onChange={(e) => setSelectedTier(e.target.value)}
                          className="sr-only"
                        />
                        <div>
                          <p className="font-medium">{tier.name}</p>
                          {tier.description && (
                            <p className="text-sm text-muted-foreground">{tier.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold">
                        {tier.price === 0 ? "Free" : `$${tier.price}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {event.pricing_mode === "free" ? "Register Free" : "Continue to Payment"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
