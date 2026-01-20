import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Clock, Save } from 'lucide-react';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland'
];

interface AvailabilitySlot {
  id?: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function MeetingTypeAvailability() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timezone, setTimezone] = useState('America/New_York');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const { data: meetingType, isLoading: typeLoading } = useQuery({
    queryKey: ['meeting-type', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: existingAvailability = [], isLoading: availLoading } = useQuery({
    queryKey: ['meeting-availability', id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meeting_availability')
        .select('*')
        .eq('meeting_type_id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  useEffect(() => {
    if (existingAvailability.length > 0) {
      setSlots(existingAvailability.map(a => ({
        id: a.id,
        weekday: a.weekday,
        start_time: a.start_time,
        end_time: a.end_time,
        is_active: a.is_active
      })));
      setTimezone(existingAvailability[0].timezone || 'America/New_York');
    } else {
      // Default availability: Mon-Fri 9am-5pm
      setSlots([
        { weekday: 1, start_time: '09:00', end_time: '17:00', is_active: true },
        { weekday: 2, start_time: '09:00', end_time: '17:00', is_active: true },
        { weekday: 3, start_time: '09:00', end_time: '17:00', is_active: true },
        { weekday: 4, start_time: '09:00', end_time: '17:00', is_active: true },
        { weekday: 5, start_time: '09:00', end_time: '17:00', is_active: true },
      ]);
    }
  }, [existingAvailability]);

  const saveAvailability = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete existing availability for this meeting type
      await supabase
        .from('meeting_availability')
        .delete()
        .eq('meeting_type_id', id)
        .eq('user_id', user.id);

      // Insert new availability
      const activeSlots = slots.filter(s => s.is_active);
      if (activeSlots.length > 0) {
        const { error } = await supabase
          .from('meeting_availability')
          .insert(activeSlots.map(s => ({
            user_id: user.id,
            meeting_type_id: id,
            weekday: s.weekday,
            start_time: s.start_time,
            end_time: s.end_time,
            timezone,
            is_active: true
          })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-availability'] });
      toast({ title: 'Availability saved!' });
      navigate('/creator/meetings');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const addSlot = (weekday: number) => {
    setSlots(prev => [...prev, {
      weekday,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true
    }]);
  };

  const removeSlot = (index: number) => {
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const toggleDay = (weekday: number, enabled: boolean) => {
    if (enabled) {
      // Add default slot if none exists for this day
      if (!slots.some(s => s.weekday === weekday)) {
        addSlot(weekday);
      } else {
        setSlots(prev => prev.map(s => s.weekday === weekday ? { ...s, is_active: true } : s));
      }
    } else {
      setSlots(prev => prev.map(s => s.weekday === weekday ? { ...s, is_active: false } : s));
    }
  };

  if (typeLoading || availLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/creator/meetings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Set Availability</h1>
            <p className="text-muted-foreground">{meetingType?.name}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timezone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {WEEKDAYS.map((day, weekday) => {
              const daySlots = slots.filter(s => s.weekday === weekday);
              const isDayActive = daySlots.some(s => s.is_active);

              return (
                <div key={weekday} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isDayActive}
                        onCheckedChange={(checked) => toggleDay(weekday, checked)}
                      />
                      <span className={`font-medium ${!isDayActive ? 'text-muted-foreground' : ''}`}>
                        {day}
                      </span>
                    </div>
                    {isDayActive && (
                      <Button variant="ghost" size="sm" onClick={() => addSlot(weekday)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Time
                      </Button>
                    )}
                  </div>

                  {isDayActive && (
                    <div className="space-y-2 pl-10">
                      {daySlots.filter(s => s.is_active).map((slot, slotIndex) => {
                        const globalIndex = slots.findIndex(s => s === slot);
                        return (
                          <div key={slotIndex} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={slot.start_time}
                              onChange={e => updateSlot(globalIndex, 'start_time', e.target.value)}
                              className="w-32"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={slot.end_time}
                              onChange={e => updateSlot(globalIndex, 'end_time', e.target.value)}
                              className="w-32"
                            />
                            {daySlots.filter(s => s.is_active).length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSlot(globalIndex)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!isDayActive && (
                    <p className="text-sm text-muted-foreground pl-10">Unavailable</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/creator/meetings')}>
            Cancel
          </Button>
          <Button onClick={() => saveAvailability.mutate()} disabled={saveAvailability.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveAvailability.isPending ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </div>
    </div>
  );
}
