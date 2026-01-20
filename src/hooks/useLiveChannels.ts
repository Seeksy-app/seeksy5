import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveChannel {
  id: string;
  user_id: string;
  channel_name: string;
  playback_url: string;
  status: string;
  viewer_count: number;
  started_at: string | null;
  metadata: unknown;
}

export function useLiveChannels() {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveChannels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('live_channels')
        .select('*')
        .eq('status', 'live')
        .eq('is_active', true)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setChannels(data || []);
    } catch (err) {
      console.error('Error fetching live channels:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveChannels();

    // Subscribe to realtime updates for live channel status changes
    const subscription = supabase
      .channel('public_live_channels')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'live_channels',
          filter: 'status=eq.live'
        },
        () => fetchLiveChannels()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchLiveChannels]);

  return { channels, isLoading, error, refetch: fetchLiveChannels };
}

export function useMyChannels() {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyChannels = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ivs-channel-management', {
        body: { action: 'list_channels' }
      });

      if (error) throw error;
      setChannels(data.channels || []);
    } catch (err) {
      console.error('Error fetching my channels:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createChannel = useCallback(async (channelName: string) => {
    const { data, error } = await supabase.functions.invoke('ivs-channel-management', {
      body: { action: 'create_channel', channelName }
    });

    if (error) throw error;
    await fetchMyChannels();
    return data;
  }, [fetchMyChannels]);

  const deleteChannel = useCallback(async (channelId: string) => {
    const { error } = await supabase.functions.invoke('ivs-channel-management', {
      body: { action: 'delete_channel', channelId }
    });

    if (error) throw error;
    await fetchMyChannels();
  }, [fetchMyChannels]);

  useEffect(() => {
    fetchMyChannels();
  }, [fetchMyChannels]);

  return { 
    channels, 
    isLoading, 
    error, 
    refetch: fetchMyChannels,
    createChannel,
    deleteChannel,
  };
}
