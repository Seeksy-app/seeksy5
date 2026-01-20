import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Plus, Users, Edit } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Events = () => {
  const navigate = useNavigate();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_registrations(count)
        `)
        .eq("user_id", user.id)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const now = new Date();
  const upcomingEvents = events?.filter(e => new Date(e.event_date) >= now) || [];
  const pastEvents = events?.filter(e => new Date(e.event_date) < now) || [];

  const EventCard = ({ event }: { event: any }) => {
    const registrationCount = event.event_registrations?.[0]?.count || 0;
    const isUpcoming = new Date(event.event_date) >= now;
    
    return (
      <Card 
        className="hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={() => navigate(`/event/${event.id}`)}
      >
        {event.image_url && (
          <div className="h-48 w-full overflow-hidden rounded-t-lg">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{event.title}</CardTitle>
                {event.is_published ? (
                  <Badge variant="default">Published</Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
              {event.description && (
                <CardDescription className="line-clamp-2">{event.description}</CardDescription>
              )}
            </div>
            {isUpcoming && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/event/${event.id}/edit`);
                }}
                className="shrink-0"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span>{format(new Date(event.event_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium">{registrationCount} registered</span>
            </div>
            {event.capacity && (
              <span className="text-sm text-muted-foreground">
                / {event.capacity} capacity
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <CalendarDays className="w-10 h-10 text-primary" />
              Events
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and manage your events and registrations
            </p>
          </div>
          <Button onClick={() => navigate("/create-event")} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-80 animate-pulse bg-muted/20" />
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <Card className="p-12 text-center">
                <CalendarDays className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first event Seeksy and start bringing people together
                </p>
                <Button onClick={() => navigate("/create-event")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event Seeksy
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastEvents.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No past events</h3>
                <p className="text-muted-foreground">
                  Your completed events will appear here
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Events;
