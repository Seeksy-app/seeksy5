import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PING_DURATION = 5000; // 5 seconds
const NORMAL_FAVICON = "/spark/base/spark-icon-32.png";
const PING_FAVICON = "/spark/base/spark-ping-32.png";

export const useUnreadCount = () => {
  const [isPinging, setIsPinging] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch unread count (emails in inbox that haven't been opened)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Get all delivered emails
      const { data: delivered } = await supabase
        .from("email_events")
        .select("resend_email_id")
        .eq("user_id", user.id)
        .eq("event_type", "email.delivered");

      if (!delivered || delivered.length === 0) return 0;

      // Get all opened emails
      const { data: opened } = await supabase
        .from("email_events")
        .select("resend_email_id")
        .eq("user_id", user.id)
        .eq("event_type", "email.opened");

      const openedIds = new Set(opened?.map((e) => e.resend_email_id) || []);
      const unread = delivered.filter((e) => !openedIds.has(e.resend_email_id));

      return unread.length;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update document title with unread count
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `Inbox (${unreadCount}) – Seeksy Mail`;
    } else {
      document.title = "Seeksy Mail";
    }
  }, [unreadCount]);

  // Subscribe to new emails for favicon ping
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("unread-count")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "email_events",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const event = payload.new as any;
          if (event.event_type === "email.delivered") {
            // Trigger ping favicon
            setIsPinging(true);
            
            // Update favicon to ping version
            const faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
            if (faviconLink) {
              faviconLink.href = PING_FAVICON;
            }

            // Revert after 5 seconds
            setTimeout(() => {
              if (faviconLink) {
                faviconLink.href = NORMAL_FAVICON;
              }
              setIsPinging(false);
            }, PING_DURATION);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount, isPinging };
};
