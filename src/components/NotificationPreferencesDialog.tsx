import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, MessageSquare, Calendar, Ticket, Clock, Wrench, Sparkles, UserPlus } from "lucide-react";

interface NotificationPreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

interface SMSPreferences {
  sms_meeting_confirmations: boolean;
  sms_event_registrations: boolean;
  sms_ticket_assignments: boolean;
  sms_meeting_reminders: boolean;
  sms_maintenance_alerts: boolean;
  sms_feature_updates: boolean;
  sms_follower_requests: boolean;
  sms_new_account_alerts: boolean;
}

export function NotificationPreferencesDialog({
  open,
  onOpenChange,
  userId,
}: NotificationPreferencesDialogProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<SMSPreferences>({
    sms_meeting_confirmations: true,
    sms_event_registrations: true,
    sms_ticket_assignments: true,
    sms_meeting_reminders: true,
    sms_maintenance_alerts: true,
    sms_feature_updates: false,
    sms_follower_requests: false,
    sms_new_account_alerts: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      loadPreferences();
    }
  }, [open, userId]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setPreferences({
          sms_meeting_confirmations: data.sms_meeting_confirmations ?? true,
          sms_event_registrations: data.sms_event_registrations ?? true,
          sms_ticket_assignments: data.sms_ticket_assignments ?? true,
          sms_meeting_reminders: data.sms_meeting_reminders ?? true,
          sms_maintenance_alerts: data.sms_maintenance_alerts ?? true,
          sms_feature_updates: data.sms_feature_updates ?? false,
          sms_follower_requests: data.sms_follower_requests ?? false,
          sms_new_account_alerts: data.sms_new_account_alerts ?? true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading preferences",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof SMSPreferences, value: boolean) => {
    try {
      setPreferences((prev) => ({ ...prev, [key]: value }));

      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: userId,
            [key]: value,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error saving preference",
        description: error.message,
        variant: "destructive",
      });
      // Revert on error
      setPreferences((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const preferenceGroups = [
    {
      title: "Booking & Scheduling",
      icon: Calendar,
      items: [
        {
          key: "sms_meeting_confirmations" as keyof SMSPreferences,
          label: "Meeting Confirmations",
          description: "Get notified when someone books a meeting with you",
        },
        {
          key: "sms_meeting_reminders" as keyof SMSPreferences,
          label: "Meeting Reminders",
          description: "Receive reminders before your scheduled meetings",
        },
        {
          key: "sms_event_registrations" as keyof SMSPreferences,
          label: "Event Registrations",
          description: "Notifications when someone registers for your events",
        },
      ],
    },
    {
      title: "Work & Collaboration",
      icon: MessageSquare,
      items: [
        {
          key: "sms_ticket_assignments" as keyof SMSPreferences,
          label: "Ticket Assignments",
          description: "Alerts when tickets are assigned to you",
        },
        {
          key: "sms_new_account_alerts" as keyof SMSPreferences,
          label: "New Account Alerts",
          description: "Notifications when new users join (admins only)",
        },
      ],
    },
    {
      title: "Platform Updates",
      icon: Sparkles,
      items: [
        {
          key: "sms_maintenance_alerts" as keyof SMSPreferences,
          label: "Maintenance Alerts",
          description: "Important system maintenance notifications",
        },
        {
          key: "sms_feature_updates" as keyof SMSPreferences,
          label: "Feature Updates",
          description: "Learn about new features and improvements",
        },
      ],
    },
    {
      title: "Social",
      icon: UserPlus,
      items: [
        {
          key: "sms_follower_requests" as keyof SMSPreferences,
          label: "Follower Requests",
          description: "Notifications when someone follows you or requests access",
        },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>SMS Notification Preferences</DialogTitle>
          <DialogDescription>
            Choose which SMS notifications you'd like to receive. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {preferenceGroups.map((group, groupIndex) => {
            const Icon = group.icon;
            return (
              <div key={group.title}>
                {groupIndex > 0 && <Separator className="my-6" />}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{group.title}</h3>
                  </div>
                  <div className="space-y-4 pl-6">
                    {group.items.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1">
                          <Label className="font-medium cursor-pointer">
                            {item.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <Switch
                          checked={preferences[item.key]}
                          onCheckedChange={(checked) =>
                            updatePreference(item.key, checked)
                          }
                          disabled={loading}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> You must have SMS notifications enabled and a valid phone
            number in your account settings to receive these notifications.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
