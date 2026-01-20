import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Phone, MessageSquare, Bell, Users, Calendar, Trophy, FileText, Mail, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";

interface NotificationType {
  type: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

const NOTIFICATION_TYPES: NotificationType[] = [
  // Lead & Sales Notifications
  { type: 'new_lead', label: 'New Lead Captured', description: 'When someone fills out a form or becomes a lead', icon: Users, category: 'Leads & Sales' },
  { type: 'lead_form_submission', label: 'Lead Form Submission', description: 'When a new lead form is submitted', icon: FileText, category: 'Leads & Sales' },
  { type: 'high_value_lead', label: 'High-Value Lead Alert', description: 'When a lead is marked as high priority or high value', icon: AlertTriangle, category: 'Leads & Sales' },
  
  // Meeting & Calendar Notifications
  { type: 'meeting_confirmation', label: 'Meeting Booked', description: 'When someone books a meeting with you', icon: Calendar, category: 'Meetings & Events' },
  { type: 'meeting_reminder', label: 'Meeting Reminder', description: 'Reminder before scheduled meetings', icon: Bell, category: 'Meetings & Events' },
  { type: 'meeting_cancelled', label: 'Meeting Cancelled', description: 'When a meeting is cancelled', icon: Calendar, category: 'Meetings & Events' },
  
  // Event Notifications
  { type: 'event_registration', label: 'Event Registration', description: 'When someone registers for your events', icon: Calendar, category: 'Meetings & Events' },
  { type: 'event_reminder', label: 'Event Reminder', description: 'Reminder before your events start', icon: Bell, category: 'Meetings & Events' },
  
  // Support & Tickets
  { type: 'ticket_created', label: 'New Ticket Created', description: 'When a new support ticket is created', icon: FileText, category: 'Support & Tasks' },
  { type: 'ticket_assignment', label: 'Ticket Assigned', description: 'When a ticket is assigned to you', icon: FileText, category: 'Support & Tasks' },
  { type: 'ticket_update', label: 'Ticket Updated', description: 'When a ticket you\'re watching is updated', icon: FileText, category: 'Support & Tasks' },
  
  // Task Notifications
  { type: 'task_assigned', label: 'Task Assigned', description: 'When a task is assigned to you', icon: CheckCircle, category: 'Support & Tasks' },
  { type: 'task_due_reminder', label: 'Task Due Reminder', description: 'Reminder when tasks are due soon', icon: Bell, category: 'Support & Tasks' },
  { type: 'task_completed', label: 'Task Completed', description: 'When a task you created is completed', icon: CheckCircle, category: 'Support & Tasks' },
  
  // Communication
  { type: 'email_received', label: 'Important Email Received', description: 'Urgent or priority emails', icon: Mail, category: 'Communication' },
  { type: 'message_received', label: 'New Message', description: 'When you receive a direct message', icon: MessageSquare, category: 'Communication' },
  
  // Awards & Recognition
  { type: 'award_nomination', label: 'Award Nomination', description: 'When you receive an award nomination', icon: Trophy, category: 'Awards & Recognition' },
  { type: 'award_voting', label: 'Award Voting Open', description: 'When voting opens for an award you\'re nominated in', icon: Trophy, category: 'Awards & Recognition' },
  
  // System Notifications
  { type: 'security_alert', label: 'Security Alert', description: 'Important security notifications', icon: AlertTriangle, category: 'System' },
  { type: 'payment_received', label: 'Payment Received', description: 'When you receive a payment', icon: CheckCircle, category: 'System' },
];

export default function SMSNotificationSettings() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Fetch current user
  useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      return user;
    },
  });

  // Fetch user profile for phone number
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('account_phone')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      if (data?.account_phone) setPhoneNumber(data.account_phone);
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['smsNotificationPreferences', user?.id],
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

  // Update phone number mutation
  const updatePhone = useMutation({
    mutationFn: async (phone: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update({ account_phone: phone })
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Phone number saved');
    },
    onError: (error) => {
      console.error('Error updating phone:', error);
      toast.error('Failed to save phone number');
    },
  });

  // Update preference mutation
  const updatePreference = useMutation({
    mutationFn: async ({ notificationType, enabled }: { 
      notificationType: string; 
      enabled: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const existing = preferences?.find(p => p.notification_type === notificationType);
      
      if (existing) {
        const { error } = await supabase
          .from('notification_preferences')
          .update({
            sms_enabled: enabled,
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
            email_enabled: true,
            sms_enabled: enabled,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smsNotificationPreferences'] });
      toast.success('SMS preference updated');
    },
    onError: (error) => {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
    },
  });

  // Enable/disable all SMS
  const toggleAllSMS = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      for (const notif of NOTIFICATION_TYPES) {
        const existing = preferences?.find(p => p.notification_type === notif.type);
        
        if (existing) {
          await supabase
            .from('notification_preferences')
            .update({ sms_enabled: enabled, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('notification_preferences')
            .insert({
              user_id: user.id,
              notification_type: notif.type,
              email_enabled: true,
              sms_enabled: enabled,
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smsNotificationPreferences'] });
      toast.success('All SMS preferences updated');
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    },
  });

  const getPreferenceValue = (notificationType: string) => {
    const pref = preferences?.find(p => p.notification_type === notificationType);
    return pref?.sms_enabled || false;
  };

  const enabledCount = NOTIFICATION_TYPES.filter(n => getPreferenceValue(n.type)).length;

  // Group notifications by category
  const groupedNotifications = NOTIFICATION_TYPES.reduce((acc, notif) => {
    if (!acc[notif.category]) {
      acc[notif.category] = [];
    }
    acc[notif.category].push(notif);
    return acc;
  }, {} as Record<string, NotificationType[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 max-w-4xl px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Phone className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">SMS Notification Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Get instant SMS alerts on your phone for important events. Configure which notifications you want to receive.
          </p>
        </div>

        {/* Phone Number Setup */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Your Phone Number
            </CardTitle>
            <CardDescription>
              Enter your phone number to receive SMS notifications. Include country code (e.g., +1 for US).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="max-w-xs"
              />
              <Button 
                onClick={() => updatePhone.mutate(phoneNumber)}
                disabled={updatePhone.isPending}
              >
                {updatePhone.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Number
              </Button>
            </div>
            {!profile?.account_phone && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                ⚠️ Add your phone number to enable SMS notifications
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quick Settings</CardTitle>
                <CardDescription>
                  {enabledCount} of {NOTIFICATION_TYPES.length} SMS notifications enabled
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllSMS.mutate(true)}
                  disabled={toggleAllSMS.isPending}
                >
                  Enable All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllSMS.mutate(false)}
                  disabled={toggleAllSMS.isPending}
                >
                  Disable All
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Notification Categories */}
        {Object.entries(groupedNotifications).map(([category, notifications]) => (
          <Card key={category} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {category}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.map((notif) => {
                const IconComponent = notif.icon;
                return (
                  <div key={notif.type} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">{notif.label}</h3>
                        <p className="text-sm text-muted-foreground">{notif.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={getPreferenceValue(notif.type)}
                      onCheckedChange={(checked) => 
                        updatePreference.mutate({ 
                          notificationType: notif.type, 
                          enabled: checked 
                        })
                      }
                      disabled={!profile?.account_phone}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* SMS Consent */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>SMS Consent & Terms</CardTitle>
            <CardDescription>
              By enabling SMS notifications, you consent to receive text messages from Seeksy at the phone number you provided. 
              Message and data rates may apply. Message frequency varies based on your preferences. 
              You can opt out at any time by disabling SMS notifications above or replying STOP to any message.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}