import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Calendar, Users, FileText, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SmartSuggestionsPanelProps {
  userId: string;
  onAddSuggestion: (type: string, data: any) => void;
}

export function SmartSuggestionsPanel({ userId, onAddSuggestion }: SmartSuggestionsPanelProps) {
  const { data: meetingTypes = [] } = useQuery({
    queryKey: ["meeting-types", userId],
    queryFn: async (): Promise<Array<{ id: string; name: string; description: string | null }>> => {
      // @ts-ignore - Bypass deep Supabase type inference
      const result = await supabase.from("meeting_types").select("id, name, description").eq("user_id", userId).eq("active", true).limit(3);
      return result.data || [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["upcoming-events", userId],
    queryFn: async (): Promise<Array<{ id: string; title: string; event_date: string }>> => {
      // @ts-ignore - Bypass deep Supabase type inference
      const result = await supabase.from("events").select("id, title, event_date").eq("creator_id", userId).gte("event_date", new Date().toISOString()).order("event_date", { ascending: true }).limit(3);
      return result.data || [];
    },
  });

  const { data: signupSheets = [] } = useQuery({
    queryKey: ["signup-sheets", userId],
    queryFn: async (): Promise<Array<{ id: string; title: string }>> => {
      // @ts-ignore - Bypass deep Supabase type inference
      const result = await supabase.from("signup_sheets").select("id, title").eq("creator_id", userId).eq("is_active", true).limit(3);
      return result.data || [];
    },
  });

  const { data: studioSessions = [] } = useQuery({
    queryKey: ["studio-sessions", userId],
    queryFn: async (): Promise<Array<{ id: string; created_at: string }>> => {
      // @ts-ignore - Bypass deep Supabase type inference
      const result = await supabase.from("studio_sessions").select("id, created_at").eq("host_user_id", userId).order("created_at", { ascending: false }).limit(5);
      return result.data || [];
    },
  });

  const suggestions = [];

  if (meetingTypes && meetingTypes.length > 0) {
    suggestions.push({
      icon: Calendar,
      title: "Add Meeting Booking",
      description: `You have ${meetingTypes.length} active meeting type${meetingTypes.length > 1 ? 's' : ''}`,
      action: () => onAddSuggestion('meeting', meetingTypes[0]),
      badge: meetingTypes.length,
    });
  }

  if (events && events.length > 0) {
    suggestions.push({
      icon: Users,
      title: "Feature Upcoming Event",
      description: `${events.length} upcoming event${events.length > 1 ? 's' : ''} found`,
      action: () => onAddSuggestion('event', events[0]),
      badge: events.length,
    });
  }

  if (signupSheets && signupSheets.length > 0) {
    suggestions.push({
      icon: FileText,
      title: "Add Signup Sheet",
      description: `${signupSheets.length} active sheet${signupSheets.length > 1 ? 's' : ''}`,
      action: () => onAddSuggestion('signup_sheet', signupSheets[0]),
      badge: signupSheets.length,
    });
  }

  if (studioSessions && studioSessions.length > 0) {
    suggestions.push({
      icon: Mic,
      title: "Add Studio Sessions as Appearances",
      description: `${studioSessions.length} session${studioSessions.length > 1 ? 's' : ''} available`,
      action: () => onAddSuggestion('studio_sessions', studioSessions),
      badge: studioSessions.length,
    });
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Smart Suggestions</h3>
            <p className="text-sm text-muted-foreground">
              We found some Seeksy features you can quickly add to your landing page
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {suggestions.map((suggestion, idx) => {
            const Icon = suggestion.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{suggestion.title}</p>
                      {suggestion.badge && (
                        <Badge variant="secondary" className="h-5 text-xs">
                          {suggestion.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={suggestion.action}
                >
                  Add
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
