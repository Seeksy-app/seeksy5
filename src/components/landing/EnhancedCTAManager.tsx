import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EnhancedCTAManagerProps {
  landingPageId: string;
  userId: string;
}

export function EnhancedCTAManager({ landingPageId, userId }: EnhancedCTAManagerProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newCTA, setNewCTA] = useState({
    label: "",
    description: "",
    url: "",
    cta_type: "primary",
    cta_category: "custom",
    linked_entity_id: null as string | null,
  });

  const { data: ctas = [] } = useQuery<any[]>({
    queryKey: ["landing-ctas", landingPageId],
    queryFn: async () => {
      const result = await (supabase as any).from("landing_ctas").select("*").eq("landing_page_id", landingPageId).order("sort_order", { ascending: true });
      return (result.data as any[]) || [];
    },
    enabled: !!landingPageId,
  });

  const { data: meetingTypes = [] } = useQuery({
    queryKey: ["meeting-types", userId],
    queryFn: async (): Promise<Array<{ id: string; name: string; description: string | null }>> => {
      const result = await (supabase as any).from("meeting_types").select("id, name, description").eq("user_id", userId).eq("active", true);
      return (result.data as any[]) || [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events", userId],
    queryFn: async (): Promise<Array<{ id: string; title: string; event_date: string }>> => {
      const result = await (supabase as any).from("events").select("id, title, event_date").eq("creator_id", userId).gte("event_date", new Date().toISOString()).order("event_date", { ascending: true });
      return (result.data as any[]) || [];
    },
  });

  const { data: signupSheets = [] } = useQuery({
    queryKey: ["signup-sheets", userId],
    queryFn: async (): Promise<Array<{ id: string; title: string }>> => {
      const result = await (supabase as any).from("signup_sheets").select("id, title").eq("creator_id", userId).eq("is_active", true);
      return (result.data as any[]) || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (cta: typeof newCTA) => {
      const maxOrder = ctas?.reduce((max, c) => Math.max(max, c.sort_order || 0), 0) || 0;
      
      // Auto-generate URL based on category
      let url = cta.url;
      if (cta.cta_category === 'meeting' && cta.linked_entity_id) {
        url = `/book/${userId}?type=${cta.linked_entity_id}`;
      } else if (cta.cta_category === 'event' && cta.linked_entity_id) {
        url = `/events/${cta.linked_entity_id}`;
      } else if (cta.cta_category === 'signup_sheet' && cta.linked_entity_id) {
        url = `/signup/${cta.linked_entity_id}`;
      } else if (cta.cta_category === 'guest_request') {
        url = '#guest-request';
      }

      const result = await (supabase as any)
        .from("landing_ctas")
        .insert([{
          landing_page_id: landingPageId,
          label: cta.label,
          description: cta.description || null,
          url,
          cta_type: cta.cta_type,
          cta_category: cta.cta_category,
          linked_entity_id: cta.linked_entity_id,
          sort_order: maxOrder + 1,
        }]);
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success("CTA added!");
      queryClient.invalidateQueries({ queryKey: ["landing-ctas"] });
      setIsAdding(false);
      setNewCTA({
        label: "",
        description: "",
        url: "",
        cta_type: "primary",
        cta_category: "custom",
        linked_entity_id: null,
      });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ctaId: string) => {
      const result = await (supabase as any)
        .from("landing_ctas")
        .delete()
        .eq("id", ctaId);
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success("CTA deleted");
      queryClient.invalidateQueries({ queryKey: ["landing-ctas"] });
    },
  });

  const handleCategoryChange = (category: string) => {
    setNewCTA(prev => ({
      ...prev,
      cta_category: category,
      linked_entity_id: null,
      label: "",
    }));
  };

  const handleEntitySelect = (entityId: string) => {
    let label = "";
    
    if (newCTA.cta_category === 'meeting') {
      const meeting = meetingTypes?.find(m => m.id === entityId);
      label = `Book a Meeting: ${meeting?.name}`;
    } else if (newCTA.cta_category === 'event') {
      const event = events?.find(e => e.id === entityId);
      label = `RSVP: ${event?.title}`;
    } else if (newCTA.cta_category === 'signup_sheet') {
      const sheet = signupSheets?.find(s => s.id === entityId);
      label = `Join: ${sheet?.title}`;
    } else if (newCTA.cta_category === 'guest_request') {
      label = "Request a Guest Spot";
    }

    setNewCTA(prev => ({
      ...prev,
      linked_entity_id: entityId,
      label,
    }));
  };

  if (!landingPageId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Save your basic info first to manage CTAs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call-to-Actions</CardTitle>
        <CardDescription>Add smart-linked buttons to your landing page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing CTAs */}
        {ctas && ctas.length > 0 && (
          <div className="space-y-2">
            {ctas.map((cta) => (
              <div
                key={cta.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{cta.label}</p>
                      {cta.cta_category && cta.cta_category !== 'custom' && (
                        <Badge variant="secondary" className="text-xs">
                          {cta.cta_category.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    {cta.description && (
                      <p className="text-sm text-muted-foreground">{cta.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(cta.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add CTA Form */}
        {isAdding ? (
          <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
            <div className="space-y-2">
              <Label>CTA Type</Label>
              <Select value={newCTA.cta_category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Book a Meeting</SelectItem>
                  <SelectItem value="event">RSVP to Event</SelectItem>
                  <SelectItem value="signup_sheet">Join Signup Sheet</SelectItem>
                  <SelectItem value="guest_request">Request Guest Spot</SelectItem>
                  <SelectItem value="custom">Custom Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity Selector */}
            {newCTA.cta_category === 'meeting' && meetingTypes && meetingTypes.length > 0 && (
              <div className="space-y-2">
                <Label>Select Meeting Type</Label>
                <Select onValueChange={handleEntitySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a meeting type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes.map((meeting) => (
                      <SelectItem key={meeting.id} value={meeting.id}>
                        {meeting.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newCTA.cta_category === 'event' && events && events.length > 0 && (
              <div className="space-y-2">
                <Label>Select Event</Label>
                <Select onValueChange={handleEntitySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newCTA.cta_category === 'signup_sheet' && signupSheets && signupSheets.length > 0 && (
              <div className="space-y-2">
                <Label>Select Signup Sheet</Label>
                <Select onValueChange={handleEntitySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a signup sheet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {signupSheets.map((sheet) => (
                      <SelectItem key={sheet.id} value={sheet.id}>
                        {sheet.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newCTA.cta_category === 'guest_request' && (
              <div className="p-3 bg-primary/5 rounded-lg text-sm">
                This will open a guest request form for visitors
              </div>
            )}

            <div className="space-y-2">
              <Label>Button Label</Label>
              <Input
                value={newCTA.label}
                onChange={(e) => setNewCTA(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Button text"
              />
            </div>

            {newCTA.cta_category === 'custom' && (
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={newCTA.url}
                  onChange={(e) => setNewCTA(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={newCTA.description}
                onChange={(e) => setNewCTA(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional context"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Button Style</Label>
              <Select
                value={newCTA.cta_type}
                onValueChange={(value) => setNewCTA(prev => ({ ...prev, cta_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewCTA({
                    label: "",
                    description: "",
                    url: "",
                    cta_type: "primary",
                    cta_category: "custom",
                    linked_entity_id: null,
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => addMutation.mutate(newCTA)}
                disabled={!newCTA.label || (newCTA.cta_category === 'custom' && !newCTA.url)}
                className="flex-1"
              >
                Add CTA
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Call-to-Action
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
