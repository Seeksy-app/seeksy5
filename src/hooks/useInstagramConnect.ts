import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useInstagramConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const connectInstagram = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-auth');
      
      if (error) {
        console.error('Instagram auth error:', error);
        toast({
          title: 'Connection Failed',
          description: 'Failed to start Instagram connection. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast({
          title: 'Connection Failed',
          description: 'No authentication URL received.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Instagram connect error:', err);
      toast({
        title: 'Connection Failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const importMedia = async () => {
    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-import-media');
      
      if (error) {
        console.error('Instagram import error:', error);
        toast({
          title: 'Import Failed',
          description: 'Failed to import media from Instagram. Please try again.',
          variant: 'destructive',
        });
        return null;
      }

      toast({
        title: 'Import Complete',
        description: data.message || `Imported ${data.imported} items for content protection.`,
      });
      
      return data;
    } catch (err) {
      console.error('Instagram import error:', err);
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
    connectInstagram,
    importMedia,
    isConnecting,
    isImporting,
  };
}
