import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, Video, Copy, X, ExternalLink } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function CreatorScheduledMeetings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['creator-scheduled-meetings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meeting_bookings')
        .select('*, meeting_types(name, duration, location_type)')
        .eq('host_user_id', user.id)
        .order('start_time_utc', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meeting_bookings')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-scheduled-meetings'] });
      toast({ title: 'Meeting canceled' });
    }
  });

  const copyJoinLink = (booking: any) => {
    const link = booking.room_url || `${window.location.origin}/studio/meeting/${booking.id}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Join link copied!' });
  };

  const upcomingBookings = bookings.filter(b => 
    b.status === 'scheduled' && !isPast(parseISO(b.start_time_utc))
  );

  const pastBookings = bookings.filter(b => 
    b.status !== 'scheduled' || isPast(parseISO(b.end_time_utc))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'canceled': return 'bg-gray-500';
      case 'no_show': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const BookingCard = ({ booking }: { booking: any }) => {
    const isUpcoming = booking.status === 'scheduled' && !isPast(parseISO(booking.start_time_utc));
    const meetingType = booking.meeting_types as any;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(booking.status)}`} />
                <span className="font-medium">{meetingType?.name || 'Meeting'}</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {booking.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(parseISO(booking.start_time_utc), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {format(parseISO(booking.start_time_utc), 'h:mm a')}
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  {meetingType?.duration} min
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{booking.attendee_name}</span>
                <span className="text-muted-foreground">({booking.attendee_email})</span>
              </div>
              {booking.notes && (
                <p className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                  {booking.notes}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {isUpcoming && (
                <>
                  <Button 
                    size="sm" 
                    onClick={() => navigate(`/studio/meeting/${booking.id}`)}
                    className="gap-1"
                  >
                    <Video className="w-4 h-4" />
                    Enter Studio
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyJoinLink(booking)}
                    className="gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => cancelMutation.mutate(booking.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}
              {!isUpcoming && booking.recording_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={booking.recording_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Recording
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scheduled Meetings</h1>
        <p className="text-muted-foreground mt-1">View and manage your upcoming and past meetings</p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <Clock className="w-4 h-4" />
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Card key={i} className="h-28 animate-pulse bg-muted" />)}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No upcoming meetings</h3>
              <p className="text-muted-foreground">Share your booking links to start receiving bookings</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No past meetings</h3>
              <p className="text-muted-foreground">Your completed meetings will appear here</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pastBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
