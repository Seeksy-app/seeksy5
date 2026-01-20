import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Mail, MessageSquare, Send, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function MarketingCampaigns() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*, campaign_lists(list_id, subscriber_lists(name, slug))')
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

  const { data: audienceCount } = useQuery({
    queryKey: ['audience-count', selectedLists],
    queryFn: async () => {
      if (selectedLists.length === 0) return 0;
      const { data: listRecords } = await supabase
        .from('subscriber_lists')
        .select('id')
        .in('slug', selectedLists);
      if (!listRecords?.length) return 0;
      const listIds = listRecords.map(l => l.id);
      const { count, error } = await supabase
        .from('subscriber_list_members')
        .select('subscriber_id', { count: 'exact', head: true })
        .in('list_id', listIds);
      if (error) return 0;
      return count || 0;
    },
    enabled: selectedLists.length > 0,
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      const { data: campaign, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .insert({ name, channel, subject, content })
        .select()
        .single();
      if (campaignError) throw campaignError;

      if (selectedLists.length > 0) {
        const { data: listRecords } = await supabase
          .from('subscriber_lists')
          .select('id')
          .in('slug', selectedLists);
        if (listRecords?.length) {
          const links = listRecords.map(l => ({
            campaign_id: campaign.id,
            list_id: l.id,
          }));
          await supabase.from('campaign_lists').insert(links);
        }
      }
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast.success('Campaign created');
      resetForm();
    },
    onError: () => toast.error('Failed to create campaign'),
  });

  const resetForm = () => {
    setName('');
    setChannel('email');
    setSubject('');
    setContent('');
    setSelectedLists([]);
    setIsOpen(false);
  };

  const toggleList = (slug: string) => {
    setSelectedLists(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500/10 text-green-600';
      case 'scheduled': return 'bg-blue-500/10 text-blue-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketing Campaigns</h1>
          <p className="text-muted-foreground">Create and manage email/SMS campaigns</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Newsletter" />
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={channel} onValueChange={(v: 'email' | 'sms') => setChannel(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email"><Mail className="w-4 h-4 inline mr-2" />Email</SelectItem>
                    <SelectItem value="sms"><MessageSquare className="w-4 h-4 inline mr-2" />SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {channel === 'email' && (
                <div>
                  <Label>Subject Line</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" />
                </div>
              )}
              <div>
                <Label>Content</Label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Message content..." rows={4} />
              </div>
              <div>
                <Label>Target Lists</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {lists?.map(list => (
                    <div key={list.id} className="flex items-center gap-2">
                      <Checkbox
                        id={list.slug}
                        checked={selectedLists.includes(list.slug)}
                        onCheckedChange={() => toggleList(list.slug)}
                      />
                      <label htmlFor={list.slug} className="text-sm cursor-pointer">{list.name}</label>
                    </div>
                  ))}
                </div>
                {selectedLists.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Audience: ~{audienceCount || 0} subscribers
                  </p>
                )}
              </div>
              <Button onClick={() => createCampaign.mutate()} disabled={!name || createCampaign.isPending} className="w-full">
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {campaigns?.map(campaign => (
          <Card key={campaign.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {campaign.channel === 'email' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  {campaign.name}
                </CardTitle>
                <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {campaign.campaign_lists?.length || 0} lists
                </span>
                {campaign.scheduled_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(campaign.scheduled_at).toLocaleDateString()}
                  </span>
                )}
                {campaign.sent_at && (
                  <span className="flex items-center gap-1">
                    <Send className="w-4 h-4" />
                    Sent {new Date(campaign.sent_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {campaigns?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No campaigns yet. Create your first one!</p>
        )}
      </div>
    </div>
  );
}
