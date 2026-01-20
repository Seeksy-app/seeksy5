import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Youtube, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
}

interface YouTubeChannelSelectModalProps {
  sessionId: string | null;
  onClose: () => void;
  onConnected: (channelName: string) => void;
}

export function YouTubeChannelSelectModal({ 
  sessionId, 
  onClose, 
  onConnected 
}: YouTubeChannelSelectModalProps) {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchChannels();
    }
  }, [sessionId]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('youtube-get-session-channels', {
        body: null,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Handle the response properly - it comes back with data wrapper
      const result = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-get-session-channels?session_id=${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await result.json();

      if (!result.ok) {
        if (data.code === 'SESSION_EXPIRED') {
          setError('Your YouTube connection session expired. Please reconnect YouTube.');
        } else if (data.code === 'SESSION_USED') {
          setError('This session has already been used.');
        } else {
          setError(data.error || 'Failed to fetch channels');
        }
        return;
      }

      setChannels(data.channels || []);
    } catch (err) {
      console.error('Error fetching channels:', err);
      setError('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const connectChannel = async (channelId: string) => {
    try {
      setConnecting(channelId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-connect-channel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            channel_id: channelId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to connect channel');
        return;
      }

      onConnected(data.channel.title);
    } catch (err) {
      console.error('Error connecting channel:', err);
      toast.error('Failed to connect channel');
    } finally {
      setConnecting(null);
    }
  };

  const formatSubscribers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M subscribers`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K subscribers`;
    }
    return `${count} subscribers`;
  };

  return (
    <Dialog open={!!sessionId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Choose a YouTube channel
          </DialogTitle>
          <DialogDescription>
            This Google account manages multiple channels. Select the one you want Seeksy to sync.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <>
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={channel.thumbnail} alt={channel.title} />
                    <AvatarFallback>
                      <Youtube className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{channel.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatSubscribers(channel.subscriberCount)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => connectChannel(channel.id)}
                    disabled={connecting !== null}
                  >
                    {connecting === channel.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Connect'
                    )}
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>

        {!loading && !error && (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
