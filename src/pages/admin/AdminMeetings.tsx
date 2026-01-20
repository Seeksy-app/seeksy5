import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Search, Filter, Eye, X, Users, TrendingUp, Clock } from 'lucide-react';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';

export default function AdminMeetings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['admin-all-bookings', statusFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('meeting_bookings')
        .select(`
          *,
          meeting_types(name, duration, location_type),
          host:profiles!meeting_bookings_host_user_id_fkey(id, username, full_name, email)
        `)
        .order('start_time_utc', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateRange !== 'all') {
        const daysAgo = parseInt(dateRange);
        query = query.gte('start_time_utc', subDays(new Date(), daysAgo).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-meeting-stats'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      const { data: allBookings } = await supabase
        .from('meeting_bookings')
        .select('status, start_time_utc')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const total = allBookings?.length || 0;
      const scheduled = allBookings?.filter(b => b.status === 'scheduled').length || 0;
      const completed = allBookings?.filter(b => b.status === 'completed').length || 0;
      const canceled = allBookings?.filter(b => b.status === 'canceled').length || 0;
      const noShow = allBookings?.filter(b => b.status === 'no_show').length || 0;

      return { total, scheduled, completed, canceled, noShow };
    }
  });

  const cancelBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meeting_bookings')
        .update({ status: 'canceled', canceled_at: new Date().toISOString(), cancel_reason: 'Canceled by admin' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-bookings'] });
      toast({ title: 'Booking canceled' });
      setSelectedBooking(null);
    }
  });

  const filteredBookings = bookings.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.guest_name?.toLowerCase().includes(term) ||
      b.guest_email?.toLowerCase().includes(term) ||
      (b.host as any)?.full_name?.toLowerCase().includes(term) ||
      (b.host as any)?.username?.toLowerCase().includes(term)
    );
  });

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500',
    completed: 'bg-green-500',
    canceled: 'bg-gray-500',
    no_show: 'bg-red-500'
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Meetings & Events
          </h1>
          <p className="text-muted-foreground mt-1">View and manage all bookings across the platform</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total (30d)</p>
                <p className="text-xl font-bold">{stats?.total || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold">{stats?.scheduled || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{stats?.completed || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <X className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No-Shows</p>
                <p className="text-xl font-bold">{stats?.noShow || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by guest or host..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="no_show">No-Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Meeting Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking: any) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{format(parseISO(booking.start_time_utc), 'MMM d, yyyy')}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(booking.start_time_utc), 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{booking.host?.full_name || booking.host?.username || 'Unknown'}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.guest_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.guest_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{booking.meeting_types?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[booking.status]} text-white`}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(booking)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Guest</p>
                    <p className="font-medium">{selectedBooking.guest_name}</p>
                    <p className="text-sm">{selectedBooking.guest_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Host</p>
                    <p className="font-medium">
                      {selectedBooking.host?.full_name || selectedBooking.host?.username}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {format(parseISO(selectedBooking.start_time_utc), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm">
                      {format(parseISO(selectedBooking.start_time_utc), 'h:mm a')} - 
                      {format(parseISO(selectedBooking.end_time_utc), 'h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Meeting Type</p>
                    <p className="font-medium">{selectedBooking.meeting_types?.name}</p>
                    <p className="text-sm">{selectedBooking.meeting_types?.duration} min</p>
                  </div>
                </div>
                {selectedBooking.guest_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Guest Notes</p>
                    <p className="text-sm">{selectedBooking.guest_notes}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  {selectedBooking.status === 'scheduled' && (
                    <Button
                      variant="destructive"
                      onClick={() => cancelBooking.mutate(selectedBooking.id)}
                      disabled={cancelBooking.isPending}
                    >
                      Cancel as Admin
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
