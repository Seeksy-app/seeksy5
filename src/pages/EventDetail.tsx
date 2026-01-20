import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, MapPin, Users, Loader2, Pencil, DollarSign, 
  Download, ExternalLink, Monitor, Globe, BarChart3, QrCode,
  CalendarClock
} from "lucide-react";
import { EventSponsorshipPackageManager } from "@/components/events/EventSponsorshipPackageManager";
import { EventCheckIn } from "@/components/events/EventCheckIn";
import { EventSessionManager } from "@/components/events/EventSessionManager";
import { EventAnalytics } from "@/components/events/EventAnalytics";
import { BackButton } from "@/components/navigation/BackButton";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date?: string;
  location: string;
  venue_address?: string;
  virtual_url?: string;
  capacity: number;
  is_published: boolean;
  image_url?: string;
  user_id: string;
  event_type?: string;
  pricing_mode?: string;
}

interface Registration {
  id: string;
  attendee_name: string;
  attendee_email: string;
  checked_in: boolean;
  registered_at: string;
}

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = user?.id === event?.user_id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id, user]);

  useEffect(() => {
    if (user && isOwner && id) {
      loadRegistrations();
    }
  }, [user, isOwner, id]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error: any) {
      toast({
        title: "Error loading event",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", id)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      console.error("Error loading registrations:", error);
    }
  };

  const downloadAttendeeList = () => {
    if (!registrations.length) return;
    
    const csv = [
      ["Name", "Email", "Registered At", "Checked In"].join(","),
      ...registrations.map(r => [
        r.attendee_name,
        r.attendee_email,
        new Date(r.registered_at).toLocaleString(),
        r.checked_in ? "Yes" : "No"
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.title?.replace(/\s+/g, "_")}_attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEventTypeIcon = () => {
    switch (event?.event_type) {
      case "virtual": return <Monitor className="h-5 w-5" />;
      case "hybrid": return <Globe className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };

  const getEventTypeBadge = () => {
    switch (event?.event_type) {
      case "virtual": return <Badge variant="secondary">Virtual</Badge>;
      case "hybrid": return <Badge variant="secondary">Hybrid</Badge>;
      default: return <Badge variant="secondary">In-Person</Badge>;
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

  if (!event) {
    return null;
  }

  // Public view for attendees
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <BackButton fallbackPath="/events" className="mb-6" />
          {event.image_url && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-soft">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-80 object-cover"
              />
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {getEventTypeBadge()}
                  {!event.is_published && <Badge variant="outline">Draft</Badge>}
                </div>
                <h1 className="text-4xl font-bold">{event.title}</h1>
                <p className="text-lg text-muted-foreground mt-4">{event.description}</p>
              </div>

              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5" />
                  <span>{new Date(event.event_date).toLocaleString()}</span>
                </div>
                
                {event.location && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {getEventTypeIcon()}
                    <span>{event.location}</span>
                  </div>
                )}
                
                {event.capacity && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span>{event.capacity} capacity</span>
                  </div>
                )}

                {event.virtual_url && (
                  <Button variant="outline" asChild>
                    <a href={event.virtual_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Join Virtual Event
                    </a>
                  </Button>
                )}
              </Card>
            </div>

            <div>
              {event.is_published ? (
                <PublicRegistrationCard event={event} />
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">
                    This event is not yet published.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Owner/Admin view with tabs
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <BackButton fallbackPath="/events" className="mb-4" />
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getEventTypeBadge()}
              <Badge variant={event.is_published ? "default" : "outline"}>
                {event.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground mt-1">
              {new Date(event.event_date).toLocaleDateString()} • {registrations.length} registrations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/event/${event.id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
            <Button variant="outline" onClick={() => window.open(`/event/${event.id}`, "_blank")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Page
            </Button>
            <Button variant="outline" onClick={downloadAttendeeList} disabled={!registrations.length}>
              <Download className="h-4 w-4 mr-2" />
              Download List
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">
              <CalendarClock className="h-4 w-4 mr-2 hidden md:inline" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="checkin">
              <QrCode className="h-4 w-4 mr-2 hidden md:inline" />
              Check-In
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2 hidden md:inline" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="sponsorships">
              <DollarSign className="h-4 w-4 mr-2 hidden md:inline" />
              Sponsors
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {event.image_url && (
                  <Card className="overflow-hidden">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-64 object-cover"
                    />
                  </Card>
                )}

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {event.description || "No description provided."}
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Date & Time</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.event_date).toLocaleString()}
                        </p>
                        {event.end_date && (
                          <p className="text-sm text-muted-foreground">
                            to {new Date(event.end_date).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      {getEventTypeIcon()}
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {event.location || event.venue_address || "Virtual Event"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Capacity</p>
                        <p className="text-sm text-muted-foreground">
                          {event.capacity ? `${event.capacity} attendees` : "Unlimited"}
                        </p>
                      </div>
                    </div>

                    {event.virtual_url && (
                      <div className="flex items-start gap-3">
                        <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">Virtual Link</p>
                          <a 
                            href={event.virtual_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {event.virtual_url}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Sidebar with recent registrations */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Registrations</h3>
                  {registrations.length > 0 ? (
                    <div className="space-y-3">
                      {registrations.slice(0, 5).map((reg) => (
                        <div key={reg.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{reg.attendee_name}</p>
                            <p className="text-xs text-muted-foreground">{reg.attendee_email}</p>
                          </div>
                          {reg.checked_in && (
                            <Badge variant="secondary" className="text-xs">Checked In</Badge>
                          )}
                        </div>
                      ))}
                      {registrations.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          +{registrations.length - 5} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No registrations yet
                    </p>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{registrations.length}</p>
                      <p className="text-xs text-muted-foreground">Registered</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {registrations.filter(r => r.checked_in).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Checked In</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <EventSessionManager eventId={event.id} eventDate={event.event_date} isAdmin={true} />
          </TabsContent>

          {/* Check-In Tab */}
          <TabsContent value="checkin">
            <EventCheckIn eventId={event.id} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <EventAnalytics eventId={event.id} />
          </TabsContent>

          {/* Sponsorships Tab */}
          <TabsContent value="sponsorships">
            <EventSponsorshipPackageManager eventId={event.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Simple inline registration card for public view
function PublicRegistrationCard({ event }: { event: Event }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: event.id,
          attendee_name: name,
          attendee_email: email,
        });
      if (error) throw error;
      toast({ title: "Registration successful!" });
      setName("");
      setEmail("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Register for this event</h3>
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Your Name *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Your Email *</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register Now
        </Button>
      </form>
    </Card>
  );
}

export default EventDetail;
