import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Copy, Clock, Video, Phone, MapPin, Link2, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const locationOptions = [
  { value: 'seeksy_studio', label: 'Seeksy Studio', icon: Radio },
  { value: 'zoom', label: 'Zoom', icon: Video },
  { value: 'meet', label: 'Google Meet', icon: Video },
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'in-person', label: 'In-Person', icon: MapPin },
  { value: 'custom', label: 'Custom Link', icon: Link2 },
];

export default function CreatorMeetingTypes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    location_type: 'seeksy_studio' as string,
    custom_location_url: '',
    buffer_time_before: 0,
    buffer_time_after: 0,
    is_active: true
  });

  const { data: meetingTypes = [], isLoading } = useQuery({
    queryKey: ['creator-meeting-types'],
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const { data: newType, error } = await supabase
        .from('meeting_types')
        .insert([{
          user_id: user.id,
          name: data.name,
          description: data.description,
          duration: data.duration,
          location_type: data.location_type as any,
          custom_location_url: data.custom_location_url,
          buffer_time_before: data.buffer_time_before,
          buffer_time_after: data.buffer_time_after,
          is_active: data.is_active,
          slug
        }])
        .select()
        .single();

      if (error) throw error;
      return newType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-meeting-types'] });
      setShowModal(false);
      resetForm();
      toast({ title: 'Meeting type created!' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('meeting_types')
        .update({
          name: data.name,
          description: data.description,
          duration: data.duration,
          location_type: data.location_type as any,
          custom_location_url: data.custom_location_url,
          buffer_time_before: data.buffer_time_before,
          buffer_time_after: data.buffer_time_after,
          is_active: data.is_active
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-meeting-types'] });
      setShowModal(false);
      resetForm();
      toast({ title: 'Meeting type updated!' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meeting_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-meeting-types'] });
      toast({ title: 'Meeting type deleted' });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 30,
      location_type: 'seeksy_studio',
      custom_location_url: '',
      buffer_time_before: 0,
      buffer_time_after: 0,
      is_active: true
    });
    setEditingType(null);
  };

  const openEdit = (type: any) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      duration: type.duration,
      location_type: type.location_type,
      custom_location_url: type.custom_location_url || '',
      buffer_time_before: type.buffer_time_before || 0,
      buffer_time_after: type.buffer_time_after || 0,
      is_active: type.is_active
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/m/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Booking link copied!', description: url });
  };

  const getLocationIcon = (type: string) => {
    const option = locationOptions.find(o => o.value === type);
    return option ? option.icon : Video;
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meeting Types</h1>
          <p className="text-muted-foreground mt-1">Create different meeting types for your bookings</p>
        </div>
        <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Meeting Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingType ? 'Edit Meeting Type' : 'Create Meeting Type'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Meeting Name</Label>
                <Input 
                  placeholder="e.g., 30-min Intro Call"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  placeholder="What's this meeting about?"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration</Label>
                  <Select 
                    value={String(formData.duration)} 
                    onValueChange={v => setFormData(prev => ({ ...prev, duration: Number(v) }))}
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
                    value={formData.location_type} 
                    onValueChange={v => setFormData(prev => ({ ...prev, location_type: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {locationOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(formData.location_type === 'custom' || formData.location_type === 'in-person') && (
                <div>
                  <Label>{formData.location_type === 'in-person' ? 'Address' : 'Meeting Link'}</Label>
                  <Input 
                    placeholder={formData.location_type === 'in-person' ? '123 Main St, City' : 'https://...'}
                    value={formData.custom_location_url}
                    onChange={e => setFormData(prev => ({ ...prev, custom_location_url: e.target.value }))}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Buffer Before (min)</Label>
                  <Input 
                    type="number" 
                    min={0}
                    value={formData.buffer_time_before}
                    onChange={e => setFormData(prev => ({ ...prev, buffer_time_before: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label>Buffer After (min)</Label>
                  <Input 
                    type="number" 
                    min={0}
                    value={formData.buffer_time_after}
                    onChange={e => setFormData(prev => ({ ...prev, buffer_time_after: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.is_active}
                  onCheckedChange={v => setFormData(prev => ({ ...prev, is_active: v }))}
                />
                <Label>Active (visible on booking page)</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSave}
                  disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted" />)}
        </div>
      ) : meetingTypes.length === 0 ? (
        <Card className="p-12 text-center">
          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No meeting types yet</h3>
          <p className="text-muted-foreground mb-4">Create your first meeting type to start accepting bookings</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Meeting Type
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetingTypes.map((type: any) => {
            const LocationIcon = getLocationIcon(type.location_type);
            return (
              <Card key={type.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LocationIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">/{type.slug}</p>
                      </div>
                    </div>
                    <Badge variant={type.is_active ? 'default' : 'secondary'}>
                      {type.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{type.description}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{type.duration} min</span>
                    <span className="capitalize">{type.location_type?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => type.slug && copyLink(type.slug)}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Link
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(type)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(type.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
