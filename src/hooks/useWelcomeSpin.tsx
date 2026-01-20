import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useWelcomeSpin() {
  const [showWelcomeSpin, setShowWelcomeSpin] = useState(false);

  const { data: spinHistory } = useQuery({
    queryKey: ["spin-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("spin_wheel_history")
        .select("id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    // Check if user has never spun before
    if (spinHistory !== undefined && spinHistory !== null && spinHistory.length === 0) {
      setShowWelcomeSpin(true);
    }
  }, [spinHistory]);

  return {
    showWelcomeSpin,
    setShowWelcomeSpin,
  };
}
