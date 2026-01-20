import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Clock, MapPin, ArrowLeft, CheckCircle, Video, Phone, Users } from 'lucide-react';
import { format, parseISO, addMinutes, isSameDay, startOfDay } from 'date-fns';
import { generateAvailableSlots, formatSlotTime, type AvailabilityWindow, type ExistingBooking } from '@/lib/meetingSlots';

interface BookingForm {
  name: string;
  email: string;
  notes: string;
}

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [step, setStep] = useState<'date' | 'time' | 'form' | 'confirmed'>('date');
  const [form, setForm] = useState<BookingForm>({ name: '', email: '', notes: '' });
  const guestTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Load meeting type by slug
  const { data: meetingType, isLoading: typeLoading, error: typeError } = useQuery({
    queryKey: ['public-meeting-type', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_types')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      
      // Get profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .eq('id', data.user_id)
        .single();
      
      return { ...data, profile };
    },
    enabled: !!slug
  });

  // Load availability windows for this meeting type
  const { data: availability = [] } = useQuery({
    queryKey: ['public-availability', meetingType?.id, meetingType?.user_id],
    queryFn: async () => {
      if (!meetingType) return [];
      
      const { data, error } = await supabase
        .from('meeting_availability')
        .select('*')
        .eq('meeting_type_id', meetingType.id)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []).map(a => ({
        weekday: a.weekday,
        startTime: a.start_time,
        endTime: a.end_time,
        timezone: a.timezone
      })) as AvailabilityWindow[];
    },
    enabled: !!meetingType
  });

  // Load existing bookings to block slots
  const { data: existingBookings = [] } = useQuery({
    queryKey: ['public-bookings', meetingType?.user_id],
    queryFn: async () => {
      if (!meetingType) return [];

      const { data, error } = await supabase
        .from('meeting_bookings')
        .select('start_time_utc, end_time_utc')
        .eq('host_user_id', meetingType.profile?.id || meetingType.user_id)
        .eq('status', 'scheduled')
        .gte('start_time_utc', new Date().toISOString());

      if (error) throw error;
      return (data || []) as ExistingBooking[];
    },
    enabled: !!meetingType
  });

  // Generate available slots
  const availableSlots = useMemo(() => {
    if (!meetingType || availability.length === 0) return new Map();
    
    return generateAvailableSlots(
      availability,
      existingBookings,
      meetingType.duration,
      meetingType.buffer_time_before || 0,
      meetingType.buffer_time_after || 0,
      30,
      guestTimezone
    );
  }, [meetingType, availability, existingBookings, guestTimezone]);

  // Get slots for selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return availableSlots.get(dateKey) || [];
  }, [selectedDate, availableSlots]);

  // Dates with availability
  const datesWithSlots = useMemo(() => {
    return Array.from(availableSlots.keys()).map(d => parseISO(d));
  }, [availableSlots]);

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!selectedSlot || !meetingType) throw new Error('No slot selected');

      const { data, error } = await supabase
        .from('meeting_bookings')
        .insert({
          meeting_type_id: meetingType.id,
          host_user_id: meetingType.profile?.id || meetingType.user_id,
          guest_name: form.name,
          guest_email: form.email,
          guest_notes: form.notes,
          start_time_utc: selectedSlot.start.toISOString(),
          end_time_utc: selectedSlot.end.toISOString(),
          location_details: meetingType.custom_location_url
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('conflict') || error.code === '23505') {
          throw new Error('This time slot is no longer available. Please select another.');
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      setStep('confirmed');
    },
    onError: (error: any) => {
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'zoom':
      case 'google_meet':
        return <Video className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'in_person':
        return <Users className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getLocationLabel = (type: string) => {
    const labels: Record<string, string> = {
      zoom: 'Zoom Meeting',
      google_meet: 'Google Meet',
      phone: 'Phone Call',
      in_person: 'In-Person',
      custom: 'Web Conference'
    };
    return labels[type] || type;
  };

  if (typeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (typeError || !meetingType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Meeting Not Found</h2>
          <p className="text-muted-foreground">This booking link may be inactive or invalid.</p>
        </Card>
      </div>
    );
  }

  const profile = meetingType.profile as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Host Info Header */}
        <Card className="mb-6">
          <CardContent className="p-6 flex items-center gap-4">
            <Avatar className="w-16 h-16">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="text-xl">
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{meetingType.name}</h1>
              <p className="text-muted-foreground">with {profile?.full_name || profile?.username}</p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                {meetingType.duration} min
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getLocationIcon(meetingType.location_type)}
                {getLocationLabel(meetingType.location_type)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmed State */}
        {step === 'confirmed' && selectedSlot && (
          <Card className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">You're Booked!</h2>
            <p className="text-muted-foreground mb-6">
              A confirmation has been sent to {form.email}
            </p>
            <Card className="bg-muted/50 p-4 text-left max-w-sm mx-auto">
              <p className="font-medium">{meetingType.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(selectedSlot.start, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')} ({guestTimezone})
              </p>
            </Card>
          </Card>
        )}

        {/* Booking Flow */}
        {step !== 'confirmed' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Calendar & Times */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select a Date & Time</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                    setStep('time');
                  }}
                  disabled={(date) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    return !availableSlots.has(dateKey);
                  }}
                  modifiers={{
                    available: datesWithSlots
                  }}
                  modifiersStyles={{
                    available: { fontWeight: 'bold' }
                  }}
                  className="rounded-md border"
                />

                {selectedDate && slotsForSelectedDate.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">
                      Available times for {format(selectedDate, 'MMMM d')}
                    </p>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {slotsForSelectedDate.map((slot, i) => (
                        <Button
                          key={i}
                          variant={selectedSlot?.start.getTime() === slot.startTime.getTime() ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setSelectedSlot({ start: slot.startTime, end: slot.endTime });
                            setStep('form');
                          }}
                        >
                          {format(slot.startTime, 'h:mm a')}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDate && slotsForSelectedDate.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    No available times for this date.
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-4">
                  Times shown in {guestTimezone}
                </p>
              </CardContent>
            </Card>

            {/* Right: Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {meetingType.description && (
                  <p className="text-sm text-muted-foreground">{meetingType.description}</p>
                )}

                {selectedSlot && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="font-medium">{format(selectedSlot.start, 'EEEE, MMMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}
                    </p>
                  </div>
                )}

                <div>
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Anything you'd like to share ahead of the meeting..."
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedSlot || !form.name || !form.email || createBooking.isPending}
                  onClick={() => createBooking.mutate()}
                >
                  {createBooking.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by Seeksy
        </p>
      </div>
    </div>
  );
}
