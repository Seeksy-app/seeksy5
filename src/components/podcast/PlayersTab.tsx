import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PlayersTabProps {
  podcastId: string;
}

export const PlayersTab = ({ podcastId }: PlayersTabProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [size, setSize] = useState<"small" | "medium" | "large">("medium");

  const { data: podcast } = useQuery({
    queryKey: ["podcast", podcastId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", podcastId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: directories } = useQuery({
    queryKey: ["podcast-directories", podcastId],
    queryFn: async () => {
      const result = await (supabase as any)
        .from("podcast_directories")
        .select("*")
        .eq("podcast_id", podcastId);
      if (result.error) throw result.error;
      return (result.data || []) as any[];
    },
  });

  const embedCode = `<iframe 
  src="https://seeksy.io/embed/podcast/${podcastId}?theme=${theme}&size=${size}" 
  width="${size === 'small' ? '300' : size === 'medium' ? '450' : '600'}" 
  height="${size === 'small' ? '150' : size === 'medium' ? '200' : '250'}"
  frameborder="0"
  allow="autoplay; encrypted-media"
></iframe>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied to clipboard");
  };

  const copyLink = (url: string | null) => {
    if (!url) {
      toast.error("Link not available");
      return;
    }
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const appleUrl = directories?.find((d: any) => d.directory_name === "Apple Podcasts")?.directory_specific_url;
  const spotifyUrl = directories?.find((d: any) => d.directory_name === "Spotify")?.directory_specific_url;
  const amazonUrl = directories?.find((d: any) => d.directory_name === "Amazon Music")?.directory_specific_url;

  return (
    <div className="space-y-6">
      {/* Seeksy Player */}
      <Card>
        <CardHeader>
          <CardTitle>Seeksy Podcast Player</CardTitle>
          <CardDescription>
            Embed your podcast player on any website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Theme</Label>
                <RadioGroup value={theme} onValueChange={(v) => setTheme(v as any)} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Dark</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Size</Label>
                <RadioGroup value={size} onValueChange={(v) => setSize(v as any)} className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small">Small (300x150)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium (450x200)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="large" id="large" />
                    <Label htmlFor="large">Large (600x250)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <Label className="mb-2 block">Preview</Label>
              <div className={`bg-${theme === 'light' ? 'white' : 'gray-900'} p-4 rounded border`}>
                <div className="text-center text-muted-foreground">
                  Player preview will appear here
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>Embed Code</Label>
            <div className="flex gap-2 mt-2">
              <code className="flex-1 bg-muted p-3 rounded text-sm overflow-x-auto block">
                {embedCode}
              </code>
              <Button variant="outline" size="sm" onClick={copyEmbedCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Directory Links */}
      <Card>
        <CardHeader>
          <CardTitle>Directory Links</CardTitle>
          <CardDescription>
            Share direct links to your podcast on major platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Apple Podcasts</span>
              {appleUrl && <p className="text-sm text-muted-foreground truncate max-w-md">{appleUrl}</p>}
            </div>
            <div className="flex gap-2">
              {appleUrl ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => copyLink(appleUrl)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(appleUrl, '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Badge variant="outline">Not Listed</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Spotify</span>
              {spotifyUrl && <p className="text-sm text-muted-foreground truncate max-w-md">{spotifyUrl}</p>}
            </div>
            <div className="flex gap-2">
              {spotifyUrl ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => copyLink(spotifyUrl)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(spotifyUrl, '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Badge variant="outline">Not Listed</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Amazon Music</span>
              {amazonUrl && <p className="text-sm text-muted-foreground truncate max-w-md">{amazonUrl}</p>}
            </div>
            <div className="flex gap-2">
              {amazonUrl ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => copyLink(amazonUrl)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(amazonUrl, '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Badge variant="outline">Not Listed</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <span className="font-medium">RSS Feed</span>
              <p className="text-sm text-muted-foreground truncate max-w-md">{(podcast as any)?.rss_feed_url || (podcast as any)?.rss_url || "Not generated"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyLink((podcast as any)?.rss_feed_url || (podcast as any)?.rss_url)}>
                <Copy className="w-4 h-4" />
              </Button>
              {((podcast as any)?.rss_feed_url || (podcast as any)?.rss_url) && (
                <Button variant="outline" size="sm" onClick={() => window.open((podcast as any)?.rss_feed_url || (podcast as any)?.rss_url, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
