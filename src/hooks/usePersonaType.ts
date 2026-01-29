import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PersonaType } from "@/config/personaConfig";

export function usePersonaType() {
  const [personaType, setPersonaType] = useState<PersonaType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonaType = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        setUserId(user.id);

        const result = await (supabase as any)
          .from("user_preferences")
          .select("preferences")
          .eq("user_id", user.id)
          .maybeSingle();

        const data = result.data as any;
        const prefs = data?.preferences as Record<string, any> || {};

        if (prefs.user_type) {
          // Map old user_type values to new persona types
          const typeMapping: Record<string, PersonaType> = {
            creator: "influencer",
            influencer: "influencer",
            podcaster: "podcaster",
            speaker: "speaker",
            event_host: "eventHost",
            eventHost: "eventHost",
            entrepreneur: "entrepreneur",
            business: "entrepreneur",
            agency: "agency",
            brand: "brand",
          };
          
          setPersonaType(typeMapping[prefs.user_type] || "podcaster");
        }
      } catch (error) {
        console.error("Error fetching persona type:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonaType();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchPersonaType();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { personaType, isLoading, userId };
}
