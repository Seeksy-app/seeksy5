import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Rss, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const ImportBlogRSSDialog = () => {
  const [open, setOpen] = useState(false);
  const [rssUrl, setRssUrl] = useState("");
  const [limit, setLimit] = useState("10");
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!rssUrl.trim()) {
      toast.error("Please enter an RSS feed URL");
      return;
    }

    setIsImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('import-blog-rss', {
        body: { 
          rssUrl: rssUrl.trim(),
          limit: parseInt(limit)
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message || `Imported ${data.imported} blog posts!`);
        setOpen(false);
        setRssUrl("");
        // Refresh the page to show new posts
        window.location.reload();
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import RSS feed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Rss className="w-4 h-4 mr-2" />
          Import Posts (One-Time)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>One-Time Import from RSS</DialogTitle>
          <DialogDescription>
            Import a specific number of posts from any RSS feed (YouTube, Medium, WordPress, etc.). This is a one-time import - for automatic ongoing sync, set your RSS feed in Blog Settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rss-url">RSS Feed URL</Label>
            <Input
              id="rss-url"
              placeholder="https://example.com/feed or https://youtube.com/@channel/videos"
              value={rssUrl}
              onChange={(e) => setRssUrl(e.target.value)}
              disabled={isImporting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Number of Posts to Import</Label>
            <Select value={limit} onValueChange={setLimit} disabled={isImporting}>
              <SelectTrigger id="limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 posts</SelectItem>
                <SelectItem value="10">10 posts</SelectItem>
                <SelectItem value="25">25 posts</SelectItem>
                <SelectItem value="50">50 posts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>How to find RSS feeds:</strong>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>TechCrunch:</strong> https://techcrunch.com/feed/</li>
                <li><strong>Medium:</strong> https://medium.com/feed/@username</li>
                <li><strong>YouTube:</strong> https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID</li>
                <li><strong>WordPress:</strong> Usually at /feed or /rss</li>
                <li><strong>Substack:</strong> Add /feed to newsletter URL</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};