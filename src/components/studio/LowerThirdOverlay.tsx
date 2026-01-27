import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface LowerThirdOverlayProps {
  studioSessionId: string | null;
  isVisible: boolean;
  currentGuestIndex?: number;
}

interface Guest {
  id: string;
  guest_name: string;
  guest_title: string | null;
  guest_website: string | null;
  display_order: number;
}

export const LowerThirdOverlay = ({ 
  studioSessionId, 
  isVisible,
  currentGuestIndex = 0
}: LowerThirdOverlayProps) => {
  const { data: guests = [] } = useQuery({
    queryKey: ["studio-guests", studioSessionId],
    queryFn: async () => {
      if (!studioSessionId) return [];
      const result = await (supabase as any)
        .from("studio_guests")
        .select("*")
        .eq("studio_session_id", studioSessionId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (result.error) throw result.error;
      return (result.data as any[]) as Guest[];
    },
    enabled: !!studioSessionId
  });

  const currentGuest = guests[currentGuestIndex];

  if (!currentGuest) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute bottom-8 left-8 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-primary/95 to-primary-foreground/95 backdrop-blur-sm rounded-lg shadow-2xl border border-primary/20 overflow-hidden">
            <div className="px-6 py-4 space-y-1">
              <h3 className="text-white font-bold text-xl tracking-tight">
                {currentGuest.guest_name}
              </h3>
              {currentGuest.guest_title && (
                <p className="text-white/90 text-sm font-medium">
                  {currentGuest.guest_title}
                </p>
              )}
              {currentGuest.guest_website && (
                <p className="text-white/75 text-xs">
                  {currentGuest.guest_website}
                </p>
              )}
            </div>
            <div className="h-1 bg-gradient-to-r from-accent via-primary to-accent animate-pulse" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};