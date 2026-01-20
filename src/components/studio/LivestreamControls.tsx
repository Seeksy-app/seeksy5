import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Radio, Copy, Eye, EyeOff, Trash2, Plus, Settings, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveChannel {
  id: string;
  channel_name: string;
  stream_key: string;
  ingest_endpoint: string;
  playback_url: string;
  status: string;
  viewer_count: number;
  started_at: string | null;
}

export function LivestreamControls() {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState<Record<string, boolean>>({});
  const [newChannelName, setNewChannelName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadChannels();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('live_channels_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_channels' },
        () => loadChannels()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ivs-channel-management', {
        body: { action: 'list_channels' }
      });

      if (error) throw error;
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createChannel = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ivs-channel-management', {
        body: { action: 'create_channel', channelName: newChannelName || 'My Live Channel' }
      });

      if (error) throw error;

      toast({
        title: 'Channel created',
        description: 'Your livestream channel is ready to use.',
      });

      setNewChannelName('');
      setIsDialogOpen(false);
      loadChannels();
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to create channel. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteChannel = async (channelId: string) => {
    try {
      const { error } = await supabase.functions.invoke('ivs-channel-management', {
        body: { action: 'delete_channel', channelId }
      });

      if (error) throw error;

      toast({ title: 'Channel deleted' });
      loadChannels();
    } catch (error) {
      console.error('Error deleting channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete channel.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const toggleStreamKeyVisibility = (channelId: string) => {
    setShowStreamKey(prev => ({
      ...prev,
      [channelId]: !prev[channelId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'starting': return 'bg-yellow-500';
      case 'stopping': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Livestream Channels</h3>
          <p className="text-sm text-muted-foreground">
            Manage your live streaming channels
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Livestream Channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="channelName">Channel Name</Label>
                <Input
                  id="channelName"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="My Live Show"
                />
              </div>
              <Button onClick={createChannel} disabled={isCreating} className="w-full">
                {isCreating ? 'Creating...' : 'Create Channel'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {channels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No channels yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first livestream channel to start broadcasting
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Channel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => (
            <Card key={channel.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-3 h-3 rounded-full', getStatusColor(channel.status))} />
                    <CardTitle className="text-base">{channel.channel_name}</CardTitle>
                    <Badge variant={channel.status === 'live' ? 'destructive' : 'secondary'}>
                      {channel.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {channel.status === 'live' && (
                      <span className="text-sm text-muted-foreground">
                        {channel.viewer_count} viewers
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteChannel(channel.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stream Key */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Stream Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={showStreamKey[channel.id] ? channel.stream_key : '••••••••••••••••'}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleStreamKeyVisibility(channel.id)}
                    >
                      {showStreamKey[channel.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(channel.stream_key, 'Stream key')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* RTMP URL */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">RTMP Ingest URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={`rtmps://${channel.ingest_endpoint}:443/app`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(`rtmps://${channel.ingest_endpoint}:443/app`, 'RTMP URL')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Playback URL */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Playback URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={channel.playback_url}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(channel.playback_url, 'Playback URL')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Use OBS, Streamlabs, or any RTMP-compatible software to stream to this channel.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
