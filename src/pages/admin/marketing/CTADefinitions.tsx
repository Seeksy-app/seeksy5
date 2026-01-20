import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, MousePointer, Pencil, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function CTADefinitions() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const { data: ctas, isLoading } = useQuery({
    queryKey: ['cta-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cta_definitions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: lists } = useQuery({
    queryKey: ['subscriber-lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriber_lists')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const saveCTA = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        event_name: eventName,
        description,
        auto_lists: selectedLists,
        is_active: isActive,
      };
      if (editingId) {
        const { error } = await supabase.from('cta_definitions').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cta_definitions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cta-definitions'] });
      toast.success(editingId ? 'CTA updated' : 'CTA created');
      resetForm();
    },
    onError: () => toast.error('Failed to save CTA'),
  });

  const deleteCTA = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cta_definitions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cta-definitions'] });
      toast.success('CTA deleted');
    },
  });

  const resetForm = () => {
    setName('');
    setEventName('');
    setDescription('');
    setSelectedLists([]);
    setIsActive(true);
    setEditingId(null);
    setIsOpen(false);
  };

  const openEdit = (cta: any) => {
    setEditingId(cta.id);
    setName(cta.name);
    setEventName(cta.event_name);
    setDescription(cta.description || '');
    setSelectedLists(cta.auto_lists || []);
    setIsActive(cta.is_active);
    setIsOpen(true);
  };

  const toggleList = (slug: string) => {
    setSelectedLists(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const copyEventCode = (eventName: string) => {
    const code = `trackEvent('${eventName}', { email: user.email, lists: ${JSON.stringify(selectedLists)} });`;
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CTA Definitions</h1>
          <p className="text-muted-foreground">Define CTAs that auto-assign subscribers to lists</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New CTA</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit CTA' : 'Create CTA'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>CTA Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Blog Newsletter Gate" />
              </div>
              <div>
                <Label>Event Name</Label>
                <Input 
                  value={eventName} 
                  onChange={e => setEventName(e.target.value.replace(/\s/g, '_').toLowerCase())} 
                  placeholder="e.g. blog_subscribe" 
                />
                <p className="text-xs text-muted-foreground mt-1">Used in trackEvent() calls</p>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Where this CTA is used" />
              </div>
              <div>
                <Label>Auto-assign to Lists</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {lists?.map(list => (
                    <div key={list.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`cta-${list.slug}`}
                        checked={selectedLists.includes(list.slug)}
                        onCheckedChange={() => toggleList(list.slug)}
                      />
                      <label htmlFor={`cta-${list.slug}`} className="text-sm cursor-pointer">{list.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active</Label>
              </div>
              <Button onClick={() => saveCTA.mutate()} disabled={!name || !eventName || saveCTA.isPending} className="w-full">
                {editingId ? 'Update CTA' : 'Create CTA'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {ctas?.map(cta => (
          <Card key={cta.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MousePointer className="w-4 h-4" />
                  {cta.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={cta.is_active ? 'default' : 'secondary'}>
                    {cta.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cta)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteCTA.mutate(cta.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{cta.event_name}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyEventCode(cta.event_name)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                {cta.description && <p className="text-sm text-muted-foreground">{cta.description}</p>}
                <div className="flex flex-wrap gap-1 mt-2">
                  {cta.auto_lists?.map((slug: string) => (
                    <Badge key={slug} variant="outline">{slug}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {ctas?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No CTAs defined yet.</p>
        )}
      </div>
    </div>
  );
}
