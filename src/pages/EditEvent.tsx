import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronRight, ChevronLeft, ExternalLink } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EventTypeSelector } from "@/components/events/EventTypeSelector";
import { TicketTierManager, TicketTier } from "@/components/events/TicketTierManager";
import { EventSessionManager } from "@/components/events/EventSessionManager";

const EditEvent = () => {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  
  // Event Type
  const [eventType, setEventType] = useState("live");
  const [virtualUrl, setVirtualUrl] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  
  // Ticketing
  const [pricingMode, setPricingMode] = useState("free");
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps = [
    { id: "basics", title: "Event Details" },
    { id: "type", title: "Event Type" },
    { id: "tickets", title: "Tickets" },
    { id: "schedule", title: "Schedule" },
    { id: "publish", title: "Review" },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (user && id) {
      loadEvent();
    }
  }, [user, id]);

  const loadEvent = async () => {
    try {
      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError) throw eventError;

      // Check ownership
      if (eventData.user_id !== user?.id) {
        toast({
          title: "Access denied",
          description: "You don't have permission to edit this event",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Populate form
      setTitle(eventData.title);
      setDescription(eventData.description || "");
      setEventDate(eventData.event_date?.slice(0, 16) || "");
      setEndDate(eventData.end_date?.slice(0, 16) || "");
      setCapacity(eventData.capacity?.toString() || "");
      setImageUrl(eventData.image_url || "");
      setIsPublished(eventData.is_published);
      setEventType(eventData.event_type || "live");
      setVirtualUrl(eventData.virtual_url || "");
      setVenueAddress(eventData.venue_address || eventData.location || "");
      setPricingMode(eventData.pricing_mode || "free");

      // Load ticket tiers
      const { data: tiersData } = await supabase
        .from("event_ticket_tiers")
        .select("*")
        .eq("event_id", id)
        .order("tier_order", { ascending: true });

      if (tiersData && tiersData.length > 0) {
        setTicketTiers(tiersData.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description || "",
          price: t.price,
          currency: t.currency || "USD",
          quantity_available: t.quantity_available,
          max_per_order: t.max_per_order || 10,
          is_active: t.is_active,
          tier_order: t.tier_order || 0,
          benefits: Array.isArray(t.benefits) ? t.benefits as string[] : [],
        })));
      }
    } catch (error: any) {
      toast({
        title: "Error loading event",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);

    try {
      // Update event
      const { error: eventError } = await supabase
        .from("events")
        .update({
          title,
          description,
          event_date: eventDate,
          end_date: endDate || null,
          location: eventType === "virtual" ? "Virtual Event" : venueAddress,
          venue_address: venueAddress || null,
          virtual_url: virtualUrl || null,
          capacity: capacity ? parseInt(capacity) : null,
          image_url: imageUrl || null,
          is_published: isPublished,
          event_type: eventType,
          pricing_mode: pricingMode,
        })
        .eq("id", id);

      if (eventError) throw eventError;

      // Delete existing tiers and recreate
      await supabase.from("event_ticket_tiers").delete().eq("event_id", id);

      if (ticketTiers.length > 0) {
        const tiersToInsert = ticketTiers.map((tier, index) => ({
          event_id: id,
          name: tier.name,
          description: tier.description,
          price: tier.price,
          currency: tier.currency,
          quantity_available: tier.quantity_available,
          max_per_order: tier.max_per_order,
          is_active: tier.is_active,
          tier_order: index,
          benefits: tier.benefits,
        }));

        await supabase.from("event_ticket_tiers").insert(tiersToInsert);
      }

      toast({
        title: "Event updated!",
        description: "Your changes have been saved.",
      });

      navigate(`/event/${id}`);
    } catch (error: any) {
      toast({
        title: "Error updating event",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/events">Events</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/event/${id}`}>{title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-4xl font-bold">Edit Event</h1>
          <p className="text-muted-foreground mt-2">Update your event details</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center min-w-max">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {index + 1}
                </button>
                <span
                  className={`ml-2 text-sm whitespace-nowrap ${
                    index <= currentStep ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 md:w-16 h-0.5 mx-3 ${
                      index < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Details */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Start Date & Time *</Label>
                    <Input
                      id="eventDate"
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date & Time</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <ImageUpload
                  label="Event Cover Image"
                  onImageUploaded={setImageUrl}
                  currentImage={imageUrl}
                />
              </div>
            )}

            {/* Step 2: Event Type */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <EventTypeSelector
                  eventType={eventType}
                  onEventTypeChange={setEventType}
                  virtualUrl={virtualUrl}
                  onVirtualUrlChange={setVirtualUrl}
                  venueAddress={venueAddress}
                  onVenueAddressChange={setVenueAddress}
                />
              </div>
            )}

            {/* Step 3: Tickets */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <TicketTierManager
                  pricingMode={pricingMode}
                  onPricingModeChange={setPricingMode}
                  ticketTiers={ticketTiers}
                  onTicketTiersChange={setTicketTiers}
                />
              </div>
            )}

            {/* Step 4: Schedule */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <EventSessionManager eventId={id!} eventDate={eventDate} isAdmin={true} />
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle>Event Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Title</Label>
                        <p className="font-medium">{title}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <p className="font-medium capitalize">{eventType}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Date</Label>
                        <p className="font-medium">
                          {eventDate ? new Date(eventDate).toLocaleString() : "Not set"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Pricing</Label>
                        <p className="font-medium capitalize">{pricingMode}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Ticket Tiers</Label>
                        <p className="font-medium">{ticketTiers.length} tier(s)</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Capacity</Label>
                        <p className="font-medium">{capacity || "Unlimited"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                  <Switch
                    id="published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="published" className="cursor-pointer">
                    Event is published
                  </Label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(`/event/${id}`, "_blank")}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Event Page
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              )}
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default EditEvent;
