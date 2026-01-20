import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface StudioGuestPanelProps {
  studioSessionId: string | null;
}

interface Guest {
  id: string;
  guest_name: string;
  guest_title: string | null;
  guest_website: string | null;
  display_order: number;
  is_active: boolean;
}

export const StudioGuestPanel = ({ studioSessionId }: StudioGuestPanelProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: "",
    title: "",
    website: ""
  });

  // Fetch guests for the current session
  const { data: guests = [] } = useQuery({
    queryKey: ["studio-guests", studioSessionId],
    queryFn: async () => {
      if (!studioSessionId) return [];
      const { data, error } = await supabase
        .from("studio_guests")
        .select("*")
        .eq("studio_session_id", studioSessionId)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!studioSessionId
  });

  // Check if this is a demo template (has non-UUID string ID)
  const isDemoTemplate = studioSessionId && !studioSessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

  // Add guest mutation
  const addGuestMutation = useMutation({
    mutationFn: async (guest: typeof newGuest) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!studioSessionId) throw new Error("No active studio session");
      
      // Prevent adding guests to demo templates
      if (isDemoTemplate) {
        throw new Error("Cannot add guests to demo templates. Please create your own studio template first.");
      }

      const { error } = await supabase
        .from("studio_guests")
        .insert({
          studio_session_id: studioSessionId,
          guest_name: guest.name,
          guest_title: guest.title || null,
          guest_website: guest.website || null,
          display_order: guests.length
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-guests", studioSessionId] });
      setNewGuest({ name: "", title: "", website: "" });
      setIsAdding(false);
      toast({
        title: "Guest added",
        description: "Guest has been added to the session"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Remove guest mutation
  const removeGuestMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase
        .from("studio_guests")
        .delete()
        .eq("id", guestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-guests", studioSessionId] });
      toast({
        title: "Guest removed",
        description: "Guest has been removed from the session"
      });
    }
  });

  const handleAddGuest = () => {
    if (!newGuest.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a guest name",
        variant: "destructive"
      });
      return;
    }
    addGuestMutation.mutate(newGuest);
  };

  return (
    <div className="space-y-3">
      {/* Existing guests */}
      {guests.length > 0 && (
        <div className="space-y-2">
          {guests.map((guest) => (
            <div
              key={guest.id}
              className="flex items-start justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors"
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-medium text-sm text-foreground truncate">{guest.guest_name}</p>
                {guest.guest_title && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{guest.guest_title}</p>
                )}
                {guest.guest_website && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{guest.guest_website}</p>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeGuestMutation.mutate(guest.id)}
                className="h-7 w-7 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new guest form */}
      {isAdding ? (
        <div className="space-y-2.5 p-3 rounded-lg bg-muted/20 border border-border/50">
          <div className="space-y-1.5">
            <Label htmlFor="guest-name" className="text-xs font-medium">Guest Name *</Label>
            <Input
              id="guest-name"
              placeholder="John Doe"
              value={newGuest.name}
              onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
              className="h-9 text-sm bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guest-title" className="text-xs font-medium">Title</Label>
            <Input
              id="guest-title"
              placeholder="CEO, Company Name"
              value={newGuest.title}
              onChange={(e) => setNewGuest({ ...newGuest, title: e.target.value })}
              className="h-9 text-sm bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guest-website" className="text-xs font-medium">Website</Label>
            <Input
              id="guest-website"
              placeholder="www.example.com"
              value={newGuest.website}
              onChange={(e) => setNewGuest({ ...newGuest, website: e.target.value })}
              className="h-9 text-sm bg-background"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleAddGuest}
              disabled={addGuestMutation.isPending}
              size="sm"
              className="flex-1 h-9"
            >
              Add Guest
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewGuest({ name: "", title: "", website: "" });
              }}
              className="h-9"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsAdding(true)}
          variant="outline"
          size="sm"
          className="w-full h-9"
          disabled={!studioSessionId || isDemoTemplate}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Guest
        </Button>
      )}

      {!studioSessionId && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Start a session to manage guests
        </p>
      )}
      
      {isDemoTemplate && (
        <p className="text-xs text-amber-500 text-center py-2">
          Demo templates are read-only. Create your own template to add guests.
        </p>
      )}
    </div>
  );
};
