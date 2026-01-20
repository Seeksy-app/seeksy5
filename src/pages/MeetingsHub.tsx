import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Plus, Video, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MeetingsHub() {
  const navigate = useNavigate();

  const { data: meetingTypes = [], isLoading } = useQuery({
    queryKey: ['meeting-types'],
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

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings-upcoming'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              Meetings
            </h1>
            <p className="text-muted-foreground mt-1">Create meeting types, manage bookings, and connect calendars</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/meetings')}>
              <Clock className="w-4 h-4 mr-2" />
              View All Meetings
            </Button>
            <Button onClick={() => navigate('/meeting-types/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Meeting Type
            </Button>
          </div>
        </div>

        <Tabs defaultValue="types" className="space-y-6">
          <TabsList>
            <TabsTrigger value="types" className="gap-2">
              <Video className="w-4 h-4" />
              Meeting Types
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="w-4 h-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse h-32" />
                ))}
              </div>
            ) : meetingTypes.length === 0 ? (
              <Card className="p-12 text-center">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No meeting types yet</h3>
                <p className="text-muted-foreground mb-4">Create meeting types to accept bookings</p>
                <Button onClick={() => navigate('/meeting-types/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Meeting Type
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meetingTypes.map((type: any) => (
                  <Card key={type.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/meeting-types/${type.id}`)}>
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-1">{type.name}</h3>
                      {type.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{type.description}</p>
                      )}
                      <Badge variant="secondary">{type.duration} min</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {meetings.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No upcoming meetings</h3>
                <p className="text-muted-foreground">Schedule a meeting to get started</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting: any) => (
                  <Card key={meeting.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{meeting.title}</p>
                        <p className="text-sm text-muted-foreground">{meeting.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(meeting.start_time).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-1">Upcoming</p>
                  <p className="text-2xl font-bold">{meetings.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-1">Meeting Types</p>
                  <p className="text-2xl font-bold">{meetingTypes.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-1">This Week</p>
                  <p className="text-2xl font-bold">—</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
