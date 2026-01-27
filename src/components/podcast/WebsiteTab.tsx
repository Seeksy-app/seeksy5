import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Globe, Upload } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface WebsiteTabProps {
  podcastId: string;
}

export const WebsiteTab = ({ podcastId }: WebsiteTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [customDomain, setCustomDomain] = useState("");

  // Website settings stored in state (will be added to podcast table via migration if needed)
  const { data: podcast, isLoading } = useQuery({
    queryKey: ["podcast-website", podcastId],
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Store in podcast metadata for now
      const { data, error } = await supabase
        .from("podcasts")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", podcastId)
        .select()
        .single();

      if (error) throw error;
      
      // Store settings locally for now - can be moved to dedicated table later
      localStorage.setItem(`podcast-seo-${podcastId}`, JSON.stringify({
        seoTitle,
        seoDescription,
        seoKeywords,
        customDomain,
      }));
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcast-website", podcastId] });
      toast.success("Website settings saved");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Website Preview */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Website Preview</CardTitle>
          <CardDescription>
            Preview of your podcast's public page on My Page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative bg-muted rounded-xl overflow-hidden mb-4 border">
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <div className="text-center text-muted-foreground">
                <Globe className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Your podcast website will appear here</p>
                <p className="text-sm mt-1">Enable Podcast section in My Page to display</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/profile/edit")} className="flex-1 gap-2">
              <Edit className="w-4 h-4" />
              Edit in My Page Builder
            </Button>
            <Button variant="outline" onClick={() => window.open(`/${(podcast as any)?.author_name || 'podcast'}`, '_blank')} className="gap-2">
              <Globe className="w-4 h-4" />
              View Public Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>
            Optimize your podcast website for search engines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seo-title">SEO Title</Label>
            <Input
              id="seo-title"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Your Podcast Name | Tagline"
              maxLength={60}
            />
            <p className="text-sm text-muted-foreground mt-1">{seoTitle.length}/60 characters</p>
          </div>

          <div>
            <Label htmlFor="seo-description">SEO Description</Label>
            <Textarea
              id="seo-description"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Describe your podcast in 160 characters or less"
              maxLength={160}
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-1">{seoDescription.length}/160 characters</p>
          </div>

          <div>
            <Label htmlFor="seo-keywords">Keywords</Label>
            <Input
              id="seo-keywords"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="podcast, topic, keywords (comma-separated)"
            />
          </div>

          <div>
            <Label htmlFor="og-image">Open Graph Image</Label>
            <div className="flex gap-2 mt-2">
              <Input id="og-image" type="file" accept="image/*" />
              <Button variant="outline">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Recommended: 1200x630px
            </p>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
            Save SEO Settings
          </Button>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>
            Connect your own domain to your podcast website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-domain">Domain</Label>
            <Input
              id="custom-domain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="podcast.yourdomain.com"
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium mb-2">DNS Configuration Instructions</p>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Add a CNAME record pointing to: seeksy.io</li>
              <li>Or add an A record pointing to: 76.76.21.21</li>
              <li>Wait 24-48 hours for DNS propagation</li>
            </ol>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
            Save Custom Domain
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
