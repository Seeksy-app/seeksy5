import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Plus, Video, Link2, Copy, Trash2, Edit, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, addDays, startOfDay, endOfDay } from 'date-fns';

export default function MeetingsDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMeetingType, setNewMeetingType] = useState({
    name: '',
    description: '',
    duration: 30,
    location_type: 'zoom' as 'zoom' | 'meet' | 'phone' | 'in-person' | 'custom' | 'seeksy_studio' | 'teams',
    custom_location_url: '',
    buffer_time_before: 0,
    buffer_time_after: 0,
    is_active: true
  });

  const { data: meetingTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['meeting-types-full'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meeting_types')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['meeting-bookings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meeting_bookings')
        .select('*, meeting_types(name, duration)')
        .eq('host_user_id', user.id)
        .order('start_time_utc', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      return data;
    }
  });

  // Stats
  const upcomingCount = bookings.filter(b => 
    b.status === 'scheduled' && 
    new Date(b.start_time_utc) > new Date() &&
    new Date(b.start_time_utc) < addDays(new Date(), 7)
  ).length;

  const thisMonthCount = bookings.filter(b => {
    const bookingDate = new Date(b.start_time_utc);
    const now = new Date();
    return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
  }).length;

  const noShowRate = bookings.length > 0 
    ? Math.round((bookings.filter(b => b.status === 'no_show').length / bookings.length) * 100)
    : 0;

  const createMeetingType = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meeting_types')
        .insert([{
          user_id: user.id,
          name: newMeetingType.name,
          description: newMeetingType.description,
          duration: newMeetingType.duration,
          location_type: newMeetingType.location_type,
          custom_location_url: newMeetingType.custom_location_url,
          buffer_time_before: newMeetingType.buffer_time_before,
          buffer_time_after: newMeetingType.buffer_time_after,
          is_active: newMeetingType.is_active
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-types-full'] });
      setShowCreateModal(false);
      toast({ title: 'Meeting type created', description: 'Now set up your availability.' });
      navigate(`/meeting-types/${data.id}/edit`);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMeetingType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meeting_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-types-full'] });
      toast({ title: 'Meeting type deleted' });
    }
  });

  const cancelBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meeting_bookings')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-bookings'] });
      toast({ title: 'Booking canceled' });
    }
  });

  const copyBookingLink = (slug: string) => {
    const url = `${window.location.origin}/m/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!', description: url });
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Meetings
          </h1>
          <p className="text-muted-foreground mt-1">Create meeting types, share your link, and manage bookings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/creator/meetings/settings')}>
            <Clock className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={() => navigate('/creator/meetings/availability')}>
            <Calendar className="w-4 h-4 mr-2" />
            Availability
          </Button>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Meeting Type
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Meeting Type</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Title</Label>
                  <Input 
                    placeholder="e.g., 30-min Intro Call"
                    value={newMeetingType.name}
                    onChange={e => setNewMeetingType(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Brief description of the meeting..."
                    value={newMeetingType.description}
                    onChange={e => setNewMeetingType(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Select 
                      value={String(newMeetingType.duration)} 
                      onValueChange={v => setNewMeetingType(prev => ({ ...prev, duration: Number(v) }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Select 
                      value={newMeetingType.location_type} 
                      onValueChange={v => setNewMeetingType(prev => ({ ...prev, location_type: v as any }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="meet">Google Meet</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="custom">Custom Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(newMeetingType.location_type === 'custom' || newMeetingType.location_type === 'in-person') && (
                  <div>
                    <Label>Meeting Link / Location Details</Label>
                    <Input 
                      placeholder="https://... or address"
                      value={newMeetingType.custom_location_url}
                      onChange={e => setNewMeetingType(prev => ({ ...prev, custom_location_url: e.target.value }))}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Buffer Before (min)</Label>
                    <Input 
                      type="number" 
                      min={0}
                      value={newMeetingType.buffer_time_before}
                      onChange={e => setNewMeetingType(prev => ({ ...prev, buffer_time_before: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label>Buffer After (min)</Label>
                    <Input 
                      type="number" 
                      min={0}
                      value={newMeetingType.buffer_time_after}
                      onChange={e => setNewMeetingType(prev => ({ ...prev, buffer_time_after: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={newMeetingType.is_active}
                    onCheckedChange={v => setNewMeetingType(prev => ({ ...prev, is_active: v }))}
                  />
                  <Label>Active (visible on booking page)</Label>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createMeetingType.mutate()}
                  disabled={!newMeetingType.name || createMeetingType.isPending}
                >
                  {createMeetingType.isPending ? 'Creating...' : 'Create & Set Availability'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming (7 days)</p>
                <p className="text-2xl font-bold">{upcomingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{thisMonthCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No-Show Rate</p>
                <p className="text-2xl font-bold">{noShowRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="types" className="space-y-4">
          <TabsList>
            <TabsTrigger value="types" className="gap-2">
              <Video className="w-4 h-4" />
              Meeting Types
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <Users className="w-4 h-4" />
              Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types">
            {typesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-40 animate-pulse" />
                ))}
              </div>
            ) : meetingTypes.length === 0 ? (
              <Card className="p-12 text-center">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No meeting types yet</h3>
                <p className="text-muted-foreground mb-4">Create meeting types to accept bookings</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Meeting Type
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meetingTypes.map((type: any) => (
                  <Card key={type.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{type.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{type.description}</p>
                        </div>
                        <Badge variant={type.is_active ? 'default' : 'secondary'}>
                          {type.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Clock className="w-4 h-4" />
                        {type.duration} min
                        <span className="mx-1">•</span>
                        <Video className="w-4 h-4" />
                        {type.location_type}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => type.slug && copyBookingLink(type.slug)}
                          disabled={!type.slug}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/meeting-types/${type.id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteMeetingType.mutate(type.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            {bookingsLoading ? (
              <Card className="p-8 text-center">Loading...</Card>
            ) : bookings.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No bookings yet</h3>
                <p className="text-muted-foreground">When guests book meetings, they'll appear here</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {bookings.map((booking: any) => {
                  const isPast = new Date(booking.end_time_utc) < new Date();
                  const statusColor = {
                    scheduled: 'bg-blue-500',
                    completed: 'bg-green-500',
                    canceled: 'bg-gray-500',
                    no_show: 'bg-red-500'
                  }[booking.status] || 'bg-gray-500';

                  return (
                    <Card key={booking.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                          <div>
                            <p className="font-medium">{booking.guest_name}</p>
                            <p className="text-sm text-muted-foreground">{booking.guest_email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{format(parseISO(booking.start_time_utc), 'MMM d, yyyy')}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(booking.start_time_utc), 'h:mm a')} - {format(parseISO(booking.end_time_utc), 'h:mm a')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{(booking.meeting_types as any)?.name}</Badge>
                          <Badge variant={booking.status === 'scheduled' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                          {booking.status === 'scheduled' && !isPast && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => cancelBooking.mutate(booking.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
