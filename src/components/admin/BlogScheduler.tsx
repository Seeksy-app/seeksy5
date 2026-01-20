import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Clock, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

interface Schedule {
  id: string;
  name: string;
  portal: string;
  article_count: number;
  schedule_time: string;
  timezone: string;
  days_of_week: number[];
  email_to_creators: boolean;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}

export default function BlogScheduler() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: 'Daily Creator Articles',
    portal: 'creator',
    article_count: 3,
    schedule_time: '09:00',
    timezone: 'America/New_York',
    days_of_week: [1, 2, 3, 4, 5],
    email_to_creators: true,
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['blog-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_generation_schedules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Schedule[];
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (schedule: typeof newSchedule) => {
      const { error } = await supabase
        .from('blog_generation_schedules')
        .insert({
          ...schedule,
          schedule_time: schedule.schedule_time + ':00',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-schedules'] });
      toast.success('Schedule created');
      setDialogOpen(false);
      setNewSchedule({
        name: 'Daily Creator Articles',
        portal: 'creator',
        article_count: 3,
        schedule_time: '09:00',
        timezone: 'America/New_York',
        days_of_week: [1, 2, 3, 4, 5],
        email_to_creators: true,
      });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('blog_generation_schedules')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-schedules'] });
      toast.success('Schedule updated');
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_generation_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-schedules'] });
      toast.success('Schedule deleted');
    }
  });

  const toggleDay = (day: number) => {
    setNewSchedule(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Generation
            </CardTitle>
            <CardDescription>Automate article generation and creator emails</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Generation Schedule</DialogTitle>
                <DialogDescription>Set up automated article generation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Schedule Name</Label>
                  <Input
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                    placeholder="Daily Creator Articles"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Portal</Label>
                    <Select
                      value={newSchedule.portal}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, portal: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="board">Board</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Articles</Label>
                    <Select
                      value={String(newSchedule.article_count)}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, article_count: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 article</SelectItem>
                        <SelectItem value="3">3 articles</SelectItem>
                        <SelectItem value="5">5 articles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={newSchedule.schedule_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, schedule_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={newSchedule.timezone}
                      onValueChange={(v) => setNewSchedule({ ...newSchedule, timezone: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">EST</SelectItem>
                        <SelectItem value="America/Chicago">CST</SelectItem>
                        <SelectItem value="America/Denver">MST</SelectItem>
                        <SelectItem value="America/Los_Angeles">PST</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={newSchedule.days_of_week.includes(day.value) ? 'default' : 'outline'}
                        size="sm"
                        className="w-10 h-10 p-0"
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Email to Creators</span>
                  </div>
                  <Switch
                    checked={newSchedule.email_to_creators}
                    onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, email_to_creators: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createScheduleMutation.mutate(newSchedule)}
                  disabled={!newSchedule.name || newSchedule.days_of_week.length === 0}
                >
                  Create Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading schedules...</div>
        ) : !schedules?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No schedules configured. Click "Add Schedule" to automate article generation.
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div 
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{schedule.name}</span>
                    <Badge variant="secondary">{schedule.portal}</Badge>
                    {schedule.email_to_creators && (
                      <Badge variant="outline" className="gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {schedule.schedule_time.substring(0, 5)} {schedule.timezone.split('/')[1] || schedule.timezone}
                    <span className="mx-1">•</span>
                    {schedule.article_count} article{schedule.article_count > 1 ? 's' : ''}
                    <span className="mx-1">•</span>
                    {schedule.days_of_week.map(d => DAYS_OF_WEEK.find(dw => dw.value === d)?.label).join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={schedule.is_active}
                    onCheckedChange={(checked) => 
                      toggleScheduleMutation.mutate({ id: schedule.id, is_active: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}