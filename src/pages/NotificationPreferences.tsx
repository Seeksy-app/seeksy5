import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const NOTIFICATION_TYPES = [
  { type: 'meeting_confirmation', label: 'Meeting Confirmations', description: 'When someone books a meeting with you' },
  { type: 'event_registration', label: 'Event Registrations', description: 'When someone registers for your events' },
  { type: 'ticket_assignment', label: 'Ticket Assignments', description: 'When a ticket is assigned to you' },
  { type: 'meeting_reminder', label: 'Meeting Reminders', description: 'Reminders before scheduled meetings' },
];

export default function NotificationPreferences() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);

  // Fetch current user
  useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      return user;
    },
  });

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notificationPreferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Update preference mutation
  const updatePreference = useMutation({
    mutationFn: async ({ notificationType, channel, enabled }: { 
      notificationType: string; 
      channel: 'email' | 'sms'; 
      enabled: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const existing = preferences?.find(p => p.notification_type === notificationType);
      
      if (existing) {
        const { error } = await supabase
          .from('notification_preferences')
          .update({
            [`${channel}_enabled`]: enabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            notification_type: notificationType,
            email_enabled: channel === 'email' ? enabled : true,
            sms_enabled: channel === 'sms' ? enabled : false,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      toast.success('Preferences updated');
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    },
  });

  const getPreferenceValue = (notificationType: string, channel: 'email' | 'sms') => {
    const pref = preferences?.find(p => p.notification_type === notificationType);
    if (!pref) return channel === 'email'; // Default: email enabled, SMS disabled
    return channel === 'email' ? pref.email_enabled : pref.sms_enabled;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Choose how you want to receive notifications for different activities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Communication Channels</CardTitle>
          <CardDescription>
            Select which channels you want to use for each type of notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {NOTIFICATION_TYPES.map((notif) => (
            <div key={notif.type} className="border-b pb-6 last:border-0 last:pb-0">
              <div className="mb-3">
                <h3 className="font-medium">{notif.label}</h3>
                <p className="text-sm text-muted-foreground">{notif.description}</p>
              </div>
              
              <div className="space-y-3 ml-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${notif.type}-email`} className="flex-1 cursor-pointer">
                    Email notifications
                  </Label>
                  <Switch
                    id={`${notif.type}-email`}
                    checked={getPreferenceValue(notif.type, 'email')}
                    onCheckedChange={(checked) => 
                      updatePreference.mutate({ 
                        notificationType: notif.type, 
                        channel: 'email', 
                        enabled: checked 
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${notif.type}-sms`} className="flex-1 cursor-pointer">
                    SMS notifications
                  </Label>
                  <Switch
                    id={`${notif.type}-sms`}
                    checked={getPreferenceValue(notif.type, 'sms')}
                    onCheckedChange={(checked) => 
                      updatePreference.mutate({ 
                        notificationType: notif.type, 
                        channel: 'sms', 
                        enabled: checked 
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>SMS Notifications</CardTitle>
                <CardDescription>
                  Get instant SMS alerts on your phone for important events like new leads, meetings, and more.
                </CardDescription>
              </div>
            </div>
            <Link to="/sms-notification-settings">
              <Button>Configure SMS</Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>SMS Consent</CardTitle>
          <CardDescription>
            By enabling SMS notifications, you consent to receive text messages from Seeksy at the phone number associated with your account. 
            Message and data rates may apply. You can opt out at any time by disabling SMS notifications above.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}