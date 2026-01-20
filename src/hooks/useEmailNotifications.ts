import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export const useEmailNotifications = () => {
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  useEffect(() => {
    if (!user) return;

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Subscribe to new email events
    const channel = supabase
      .channel("email-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "email_events",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const event = payload.new as any;

          // Only notify for delivered emails (inbox)
          if (event.event_type === "email.delivered" && Notification.permission === "granted") {
            // Fetch contact info if available
            let senderName = event.from_email || "Unknown Sender";
            let senderAvatar = null;

            if (event.contact_id) {
              const { data: contact } = await supabase
                .from("contacts")
                .select("name")
                .eq("id", event.contact_id)
                .single();

              if (contact) {
                senderName = contact.name || event.from_email;
              }
            }

            // Get email body snippet
            let bodySnippet = "";
            if (event.campaign_id) {
              const { data: campaign } = await supabase
                .from("email_campaigns")
                .select("html_content")
                .eq("id", event.campaign_id)
                .single();

              if (campaign?.html_content) {
                // Strip HTML and get first 80 chars
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = campaign.html_content;
                bodySnippet = (tempDiv.textContent || "").substring(0, 80);
              }
            }

            // Create notification
            const notification = new Notification("New Email", {
              body: `From: ${senderName}\n${event.email_subject || "(No subject)"}\n${bodySnippet}`,
              icon: "/spark/base/spark-icon-32.png",
              tag: event.id,
              requireInteraction: false,
            });

            notification.onclick = () => {
              window.focus();
              window.location.href = `/inbox?open=${event.id}`;
              notification.close();
            };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
};
