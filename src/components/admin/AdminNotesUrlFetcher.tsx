/**
 * Admin Notes URL Fetcher
 * Fetches content from a URL using Firecrawl and imports it into notes
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Globe, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminNotesUrlFetcherProps {
  onContentFetched: (title: string, content: string) => void;
}

export function AdminNotesUrlFetcher({ onContentFetched }: AdminNotesUrlFetcherProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFetch = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { 
          url: url.trim(),
          options: { formats: ['markdown'], onlyMainContent: true }
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch content');
      }

      const markdown = data.data?.markdown || data.markdown || '';
      const title = data.data?.metadata?.title || data.metadata?.title || 'Imported Content';

      if (!markdown) {
        throw new Error('No content found at URL');
      }

      onContentFetched(title, markdown);
      toast.success('Content imported successfully');
      setOpen(false);
      setUrl('');
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Globe className="h-4 w-4 mr-2" />
          Fetch from URL
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import from URL
          </DialogTitle>
          <DialogDescription>
            Enter a URL to fetch its content and import it into a new note using Firecrawl.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Input
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleFetch} disabled={isLoading || !url.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Fetch Content
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
