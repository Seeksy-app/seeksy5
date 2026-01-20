import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface StudioSession {
  id: string;
  user_id: string;
  room_name: string;
  created_at: string;
  updated_at: string;
  status: string;
  settings_json?: Record<string, any>;
  has_recording?: boolean;
  has_clips?: boolean;
}

export function useStudioSession() {
  const [session, setSession] = useState<StudioSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createSession = useCallback(async (settings?: Record<string, any>) => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const sessionTitle = `Studio Session – ${format(new Date(), "MMM d, yyyy h:mm a")}`;

      // @ts-ignore - studio_sessions table exists
      const { data, error } = await supabase
        .from("studio_sessions")
        .insert({
          user_id: user.id,
          room_name: sessionTitle,
          daily_room_url: "",
          status: "active",
          identity_verified: false,
        } as any)
        .select()
        .single();

      if (error) throw error;

      setSession(data);
      return data;
    } catch (error) {
      console.error("Error creating studio session:", error);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateSession = useCallback(async (updates: Partial<StudioSession>) => {
    if (!session?.id) return null;

    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from("studio_sessions")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id)
        .select()
        .single();

      if (error) throw error;

      setSession(data);
      return data;
    } catch (error) {
      console.error("Error updating studio session:", error);
      return null;
    }
  }, [session?.id]);

  const endSession = useCallback(async () => {
    if (!session?.id) return;

    try {
      // @ts-ignore
      await supabase
        .from("studio_sessions")
        .update({
          status: "ended",
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      setSession(null);
    } catch (error) {
      console.error("Error ending studio session:", error);
    }
  }, [session?.id]);

  return {
    session,
    isCreating,
    createSession,
    updateSession,
    endSession,
    setSession,
  };
}
