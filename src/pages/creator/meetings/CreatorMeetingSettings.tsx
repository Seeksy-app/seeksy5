import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Calendar, Mail, MessageSquare, Video, Link2, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreatorMeetingSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [defaultLocation, setDefaultLocation] = useState('seeksy_studio');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const { data: calendarConnection } = useQuery({
    queryKey: ['creator-calendar-connection'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return data;
    }
  });

  const { data: zoomConnection } = useQuery({
    queryKey: ['creator-zoom-connection'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('zoom_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save to localStorage for now
      localStorage.setItem(`meeting_settings_${user.id}`, JSON.stringify({
        defaultLocation,
        emailNotifications,
        smsNotifications
      }));
    },
    onSuccess: () => {
      toast({ title: 'Settings saved!' });
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meeting Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your meeting preferences and integrations</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendar Integration
            </CardTitle>
            <CardDescription>
              Connect your calendar to avoid double-bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">Sync events automatically</p>
                </div>
              </div>
              {calendarConnection ? (
                <Badge className="bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Button variant="outline" onClick={() => navigate('/integrations')}>
                  Connect
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Outlook Calendar</p>
                  <p className="text-sm text-muted-foreground">Sync with Microsoft 365</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/integrations')}>
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Video Platform */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Platform
            </CardTitle>
            <CardDescription>
              Choose your default meeting location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Default Meeting Location</label>
              <Select value={defaultLocation} onValueChange={setDefaultLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seeksy_studio">Seeksy Studio (Recommended)</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="meet">Google Meet</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {defaultLocation === 'zoom' && (
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Video className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Zoom</p>
                    <p className="text-sm text-muted-foreground">Auto-create meeting links</p>
                  </div>
                </div>
                {zoomConnection ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Button variant="outline" onClick={() => navigate('/integrations')}>
                    Connect
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              How you and your guests get notified about bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive booking confirmations via email</p>
                  </div>
                </div>
                <Switch 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Get text reminders for meetings</p>
                  </div>
                </div>
                <Switch 
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
