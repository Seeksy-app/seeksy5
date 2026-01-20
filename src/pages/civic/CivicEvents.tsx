import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Plus } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function CivicEvents() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");

  const { data: events, isLoading } = useQuery({
    queryKey: ["civic-events", filter],
    queryFn: async () => {
      let query = supabase
        .from("civic_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "cancelled":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getEventTypeLabel = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Civic Events</h1>
          <p className="text-muted-foreground">Manage your public engagement events</p>
        </div>
        <Button onClick={() => navigate("/civic/events/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Events
        </Button>
        <Button
          variant={filter === "scheduled" ? "default" : "outline"}
          onClick={() => setFilter("scheduled")}
        >
          Scheduled
        </Button>
        <Button
          variant={filter === "live" ? "default" : "outline"}
          onClick={() => setFilter("live")}
        >
          Live
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
        >
          Completed
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events && events.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/civic/events/${event.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
                <CardDescription>
                  {getEventTypeLabel(event.event_type)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.event_date), "PPP 'at' p")}
                </div>
                {event.location_details && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {event.location_details}
                  </div>
                )}
                {event.topics && event.topics.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {event.topics.slice(0, 3).map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first civic event to get started
            </p>
            <Button onClick={() => navigate("/civic/events/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
