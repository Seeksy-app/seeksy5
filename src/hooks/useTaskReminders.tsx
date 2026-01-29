import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useTaskReminders = () => {
  const { toast } = useToast();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkReminders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user preferences
        const result = await (supabase as any)
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        const prefs = result.data as any;
        if (!prefs?.task_reminder_enabled) return;

        // Check last shown time from localStorage
        const lastShownKey = `task_reminder_last_shown_${user.id}`;
        const lastShown = localStorage.getItem(lastShownKey);
        const now = new Date();
        const hour = now.getHours();
        
        // Check if we should show based on frequency and last shown time
        let shouldShow = false;
        if (prefs.task_reminder_frequency === "hourly") {
          if (!lastShown) {
            shouldShow = true;
          } else {
            const lastShownDate = new Date(lastShown);
            const hoursSince = (now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60);
            shouldShow = hoursSince >= 1;
          }
        } else if (prefs.task_reminder_frequency === "start_of_day" && hour === 9) {
          const today = now.toDateString();
          shouldShow = !lastShown || new Date(lastShown).toDateString() !== today;
        } else if (prefs.task_reminder_frequency === "end_of_day" && hour === 17) {
          const today = now.toDateString();
          shouldShow = !lastShown || new Date(lastShown).toDateString() !== today;
        }

        if (!shouldShow) return;

        // Get outstanding tasks
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["backlog", "todo", "in_progress"])
          .order("priority", { ascending: false })
          .limit(5);

        if (tasks && tasks.length > 0) {
          // Save the time we showed the reminder
          localStorage.setItem(lastShownKey, now.toISOString());
          
          // Request notification permission if not granted
          if (Notification.permission === "default") {
            await Notification.requestPermission();
          }

          // Show browser notification if permission granted
          if (Notification.permission === "granted") {
            new Notification("Outstanding Tasks", {
              body: `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} pending`,
              icon: "/favicon.png",
            });
          }

          // Create task list for toast
          const taskList = tasks.map((task) => `• ${task.title}`).join("\n");

          // Also show toast
          toast({
            title: "Task Reminder",
            description: taskList,
          });
        }
      } catch (error) {
        console.error("Error checking reminders:", error);
      }
    };

    // Check immediately on mount
    checkReminders();

    // Then check every hour
    intervalId = setInterval(checkReminders, 60 * 60 * 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [toast]);
};
