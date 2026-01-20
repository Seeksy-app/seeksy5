import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Facebook, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FacebookPage {
  id: string;
  name: string;
  picture: string;
  fans: number;
}

interface FacebookPageSelectModalProps {
  sessionId: string | null;
  onClose: () => void;
  onConnected: (pageName: string) => void;
}

export function FacebookPageSelectModal({ 
  sessionId, 
  onClose, 
  onConnected 
}: FacebookPageSelectModalProps) {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchPages();
    }
  }, [sessionId]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const result = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-get-session-pages?session_id=${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await result.json();

      if (!result.ok) {
        if (data.code === 'SESSION_EXPIRED') {
          setError('Your Facebook connection session expired. Please reconnect.');
        } else if (data.code === 'SESSION_USED') {
          setError('This session has already been used.');
        } else {
          setError(data.error || 'Failed to fetch pages');
        }
        return;
      }

      setPages(data.pages || []);
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const connectPage = async (pageId: string) => {
    try {
      setConnecting(pageId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-connect-page`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            page_id: pageId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to connect page');
        return;
      }

      onConnected(data.page.name);
    } catch (err) {
      console.error('Error connecting page:', err);
      toast.error('Failed to connect page');
    } finally {
      setConnecting(null);
    }
  };

  const formatFans = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M fans`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K fans`;
    }
    return `${count} fans`;
  };

  return (
    <Dialog open={!!sessionId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Choose a Facebook Page
          </DialogTitle>
          <DialogDescription>
            This Meta account manages multiple Pages. Select the one you want Seeksy to sync.
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
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={page.picture} alt={page.name} />
                    <AvatarFallback>
                      <Facebook className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{page.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatFans(page.fans)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => connectPage(page.id)}
                    disabled={connecting !== null}
                  >
                    {connecting === page.id ? (
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
