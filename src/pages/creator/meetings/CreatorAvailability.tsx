import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, Calendar, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleCalendarSettings } from '@/components/meetings/GoogleCalendarSettings';

const weekDays = [
  { id: 0, key: 'sunday', label: 'Sunday' },
  { id: 1, key: 'monday', label: 'Monday' },
  { id: 2, key: 'tuesday', label: 'Tuesday' },
  { id: 3, key: 'wednesday', label: 'Wednesday' },
  { id: 4, key: 'thursday', label: 'Thursday' },
  { id: 5, key: 'friday', label: 'Friday' },
  { id: 6, key: 'saturday', label: 'Saturday' },
];

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
});

interface DayAvailability {
  enabled: boolean;
  start: string;
  end: string;
}

const defaultAvailability: Record<string, DayAvailability> = {
  sunday: { enabled: false, start: '9:00 AM', end: '5:00 PM' },
  monday: { enabled: true, start: '9:00 AM', end: '5:00 PM' },
  tuesday: { enabled: true, start: '9:00 AM', end: '5:00 PM' },
  wednesday: { enabled: true, start: '9:00 AM', end: '5:00 PM' },
  thursday: { enabled: true, start: '9:00 AM', end: '5:00 PM' },
  friday: { enabled: true, start: '9:00 AM', end: '5:00 PM' },
  saturday: { enabled: false, start: '9:00 AM', end: '5:00 PM' },
};

export default function CreatorAvailability() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>(defaultAvailability);
  const [allowSameDay, setAllowSameDay] = useState(true);
  const [minNoticeHours, setMinNoticeHours] = useState(1);
  const [maxDaysAhead, setMaxDaysAhead] = useState(30);
  const [hasChanges, setHasChanges] = useState(false);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [userId, setUserId] = useState<string | null>(null);

  // Load saved availability from localStorage
  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      const localSettings = localStorage.getItem(`availability_${user.id}`);
      
      if (localSettings) {
        const settings = JSON.parse(localSettings);
        if (settings.weekly) setAvailability(settings.weekly);
        if (settings.allowSameDay !== undefined) setAllowSameDay(settings.allowSameDay);
        if (settings.minNoticeHours !== undefined) setMinNoticeHours(settings.minNoticeHours);
        if (settings.maxDaysAhead !== undefined) setMaxDaysAhead(settings.maxDaysAhead);
        if (settings.timezone) setTimezone(settings.timezone);
      }
    };
    
    loadSettings();
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save to localStorage
      localStorage.setItem(`availability_${user.id}`, JSON.stringify({
        weekly: availability,
        allowSameDay,
        minNoticeHours,
        maxDaysAhead,
        timezone
      }));
    },
    onSuccess: () => {
      setHasChanges(false);
      toast({ title: 'Availability saved!', description: 'Your booking availability has been updated.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error saving', description: err.message, variant: 'destructive' });
    }
  });

  const updateDay = (day: string, field: keyof DayAvailability, value: any) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
    setHasChanges(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/creator/meetings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Availability</h1>
            <p className="text-muted-foreground mt-1">Set your weekly availability for bookings</p>
          </div>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={!hasChanges || saveMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
            <CardDescription>
              Set the times you're available each day. Times outside these windows won't be bookable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {weekDays.map(day => (
              <div key={day.key} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <Switch 
                  checked={availability[day.key]?.enabled ?? false}
                  onCheckedChange={v => updateDay(day.key, 'enabled', v)}
                />
                <span className="w-28 font-medium">{day.label}</span>
                {availability[day.key]?.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Select 
                      value={availability[day.key]?.start || '9:00 AM'}
                      onValueChange={v => updateDay(day.key, 'start', v)}
                    >
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">to</span>
                    <Select 
                      value={availability[day.key]?.end || '5:00 PM'}
                      onValueChange={v => updateDay(day.key, 'end', v)}
                    >
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Unavailable</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right column - Settings & Google Calendar */}
        <div className="space-y-6">
          {/* Booking Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Booking Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Same-Day Bookings</p>
                  <p className="text-xs text-muted-foreground">Allow bookings for today</p>
                </div>
                <Switch 
                  checked={allowSameDay}
                  onCheckedChange={v => { setAllowSameDay(v); setHasChanges(true); }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Minimum Notice</Label>
                <Select 
                  value={String(minNoticeHours)}
                  onValueChange={v => { setMinNoticeHours(Number(v)); setHasChanges(true); }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No minimum</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Max Days Ahead</Label>
                <Select 
                  value={String(maxDaysAhead)}
                  onValueChange={v => { setMaxDaysAhead(Number(v)); setHasChanges(true); }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar Integration */}
          <GoogleCalendarSettings />
        </div>
      </div>
    </div>
  );
}
