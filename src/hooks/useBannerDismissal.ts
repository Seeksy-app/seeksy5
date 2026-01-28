import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useBannerDismissal = (bannerKey: string) => {
  const [isDismissed, setIsDismissed] = useState(true); // Default to hidden until we check
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDismissal = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        // For non-authenticated users, fall back to localStorage
        const dismissed = localStorage.getItem(bannerKey);
        setIsDismissed(dismissed === "true");
        setIsLoading(false);
        return;
      }

      try {
        const result = await (supabase as any)
          .from("user_banner_dismissals")
          .select("id")
          .eq("user_id", user.id)
          .eq("banner_key", bannerKey)
          .maybeSingle();

        if (result.error) throw result.error;
        setIsDismissed(!!result.data);
      } catch (err) {
        console.error("Error checking banner dismissal:", err);
        // Fall back to localStorage on error
        const dismissed = localStorage.getItem(bannerKey);
        setIsDismissed(dismissed === "true");
      } finally {
        setIsLoading(false);
      }
    };

    checkDismissal();
  }, [bannerKey]);

  const dismiss = async () => {
    // Immediately hide the banner
    setIsDismissed(true);
    
    // Also set localStorage as fallback
    localStorage.setItem(bannerKey, "true");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    try {
      await (supabase as any).from("user_banner_dismissals").upsert({
        user_id: user.id,
        banner_key: bannerKey,
      }, {
        onConflict: "user_id,banner_key",
      });
    } catch (err) {
      console.error("Error saving banner dismissal:", err);
    }
  };

  return { isDismissed, isLoading, dismiss };
};
