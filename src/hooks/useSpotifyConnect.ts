import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useSpotifyConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const connectSpotify = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth');
      
      if (error) {
        console.error('Spotify auth error:', error);
        toast({
          title: 'Connection Failed',
          description: 'Failed to start Spotify connection. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.authUrl) {
        // Open Spotify OAuth in popup
        const width = 500;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.authUrl,
          'spotify-oauth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for OAuth completion
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'spotify-oauth-success') {
            toast({
              title: 'Spotify Connected',
              description: 'Your Spotify account has been connected successfully.',
            });
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'spotify-oauth-error') {
            toast({
              title: 'Connection Failed',
              description: event.data.error || 'Failed to connect Spotify.',
              variant: 'destructive',
            });
            window.removeEventListener('message', handleMessage);
          }
        };

        window.addEventListener('message', handleMessage);
      } else {
        toast({
          title: 'Connection Failed',
          description: 'No authentication URL received.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Spotify connect error:', err);
      toast({
        title: 'Connection Failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const importPodcasts = async () => {
    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-import-podcasts');
      
      if (error) {
        console.error('Spotify import error:', error);
        toast({
          title: 'Import Failed',
          description: 'Failed to import podcasts from Spotify. Please try again.',
          variant: 'destructive',
        });
        return null;
      }

      toast({
        title: 'Import Complete',
        description: data.message || `Imported ${data.imported} episodes for content protection.`,
      });
      
      return data;
    } catch (err) {
      console.error('Spotify import error:', err);
      toast({
        title: 'Import Failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    connectSpotify,
    importPodcasts,
    isConnecting,
    isImporting,
  };
}
