import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PersonaDialog } from "@/components/ai/PersonaDialog";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { EventTypeSelector } from "@/components/events/EventTypeSelector";
import { TicketTierManager, TicketTier } from "@/components/events/TicketTierManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CreateEvent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [capacity, setCapacity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  
  // Event Type
  const [eventType, setEventType] = useState("live");
  const [virtualUrl, setVirtualUrl] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [location, setLocation] = useState("");
  
  // Ticketing
  const [pricingMode, setPricingMode] = useState("free");
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([{
    name: "Free Admission",
    description: "General admission ticket",
    price: 0,
    currency: "USD",
    quantity_available: null,
    max_per_order: 10,
    is_active: true,
    tier_order: 0,
    benefits: [],
  }]);
  
  // AI Dialog
  const [miaDialogOpen, setMiaDialogOpen] = useState(false);
  const [miaPrompt, setMiaPrompt] = useState("");
  const [aiEventDialogOpen, setAiEventDialogOpen] = useState(false);
  const [aiEventData, setAiEventData] = useState({
    eventType: "",
    ticketingModel: "",
    audienceSize: "",
    goals: "",
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps = [
    { id: "basics", title: "Event Details" },
    { id: "type", title: "Event Type" },
    { id: "tickets", title: "Tickets" },
    { id: "publish", title: "Publish" },
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    try {
      // Create event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .insert([
          {
            title,
            description,
            event_date: eventDate,
            end_date: endDate || null,
            timezone,
            location: eventType === "virtual" ? "Virtual Event" : (venueAddress || location),
            venue_address: venueAddress || null,
            virtual_url: virtualUrl || null,
            capacity: capacity ? parseInt(capacity) : null,
            image_url: imageUrl || null,
            is_published: isPublished,
            user_id: user?.id,
            event_type: eventType,
            pricing_mode: pricingMode,
          },
        ])
        .select()
        .single();

      if (eventError) throw eventError;

      // Create ticket tiers
      if (ticketTiers.length > 0) {
        const tiersToInsert = ticketTiers.map((tier, index) => ({
          event_id: eventData.id,
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

        const { error: tiersError } = await supabase
          .from("event_ticket_tiers")
          .insert(tiersToInsert);

        if (tiersError) {
          console.error("Error creating ticket tiers:", tiersError);
        }
      }

      toast({
        title: "Event created!",
        description: isPublished
          ? "Your event is now live and accepting registrations."
          : "Your event draft has been saved.",
      });

      navigate(`/event/${eventData.id}`);
    } catch (error: any) {
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return title.trim() !== "" && eventDate !== "";
      case 1:
        return true;
      case 2:
        return ticketTiers.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

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
              <BreadcrumbPage>Create Event</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold">Create Event</h1>
            <p className="text-muted-foreground mt-2">
              Set up your event details and start accepting registrations
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setAiEventDialogOpen(true)}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Build with AI
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    index <= currentStep ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 md:w-24 h-0.5 mx-4 ${
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
                    placeholder="Workshop on Community Building"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description</Label>
                    <AskAIButton
                      persona="Mia"
                      onClick={() => {
                        setMiaPrompt(`Generate an engaging event description for: ${title || "an upcoming event"}`);
                        setMiaDialogOpen(true);
                      }}
                    />
                  </div>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell people what your event is about..."
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

            {/* Step 4: Publish */}
            {currentStep === 3 && (
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
                    Publish event immediately
                  </Label>
                </div>
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
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPublished ? "Create & Publish" : "Save Draft"}
                </Button>
              )}
            </div>
          </form>
        </Card>

        <PersonaDialog
          open={miaDialogOpen}
          onOpenChange={setMiaDialogOpen}
          persona="Mia"
          prompt={miaPrompt}
          context={{ title, eventDate, location }}
          onApply={(result) => setDescription(result)}
          placeholder="Describe the event purpose and Mia will create an engaging description"
        />

        {/* AI Event Architect Dialog */}
        <Dialog open={aiEventDialogOpen} onOpenChange={setAiEventDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Event Architect
              </DialogTitle>
              <DialogDescription>
                Tell us about your event and we'll help you build it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Input
                  value={aiEventData.eventType}
                  onChange={(e) => setAiEventData({ ...aiEventData, eventType: e.target.value })}
                  placeholder="Conference, workshop, meetup, webinar..."
                />
              </div>
              <div className="space-y-2">
                <Label>Ticketing Model</Label>
                <Input
                  value={aiEventData.ticketingModel}
                  onChange={(e) => setAiEventData({ ...aiEventData, ticketingModel: e.target.value })}
                  placeholder="Free, paid, tiered pricing, early bird..."
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Audience Size</Label>
                <Input
                  value={aiEventData.audienceSize}
                  onChange={(e) => setAiEventData({ ...aiEventData, audienceSize: e.target.value })}
                  placeholder="50 people, 200 attendees..."
                />
              </div>
              <div className="space-y-2">
                <Label>Goals</Label>
                <Textarea
                  value={aiEventData.goals}
                  onChange={(e) => setAiEventData({ ...aiEventData, goals: e.target.value })}
                  placeholder="What do you want to achieve with this event?"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAiEventDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast({
                    title: "AI Event Architect",
                    description: "Your event preferences have been saved. AI generation coming soon!",
                  });
                  setAiEventDialogOpen(false);
                }}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Generate Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default CreateEvent;
