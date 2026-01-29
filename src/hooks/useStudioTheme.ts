import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StudioTheme = "light" | "dark";

export function useStudioTheme() {
  const [studioTheme, setStudioTheme] = useState<StudioTheme>("light");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudioTheme();
  }, []);

  const loadStudioTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const result = await (supabase as any)
        .from("user_preferences")
        .select("studio_theme")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!result.error && result.data?.studio_theme) {
        setStudioTheme(result.data.studio_theme as StudioTheme);
      }
    } catch (error) {
      console.error("Error loading studio theme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudioTheme = async () => {
    const newTheme: StudioTheme = studioTheme === "light" ? "dark" : "light";
    setStudioTheme(newTheme);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any)
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          studio_theme: newTheme,
        });
    } catch (error) {
      console.error("Error saving studio theme:", error);
    }
  };

  return {
    studioTheme,
    toggleStudioTheme,
    isLoading,
  };
}
