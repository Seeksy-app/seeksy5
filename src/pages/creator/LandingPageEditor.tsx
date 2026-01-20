import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { SmartSuggestionsPanel } from "@/components/landing/SmartSuggestionsPanel";
import { EnhancedCTAManager } from "@/components/landing/EnhancedCTAManager";

export default function LandingPageEditor() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");

  // Fetch current user's landing page
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: landingPage, isLoading } = useQuery({
    queryKey: ["my-landing-page", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from("landing_pages")
        .select(`
          *,
          landing_social_links(*),
          guest_appearances(*),
          landing_ctas(*)
        `)
        .eq("owner_user_id", session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Form state
  const [formData, setFormData] = useState({
    title: landingPage?.title || "",
    subtitle: landingPage?.subtitle || "",
    slug: landingPage?.slug || "",
    page_type: landingPage?.page_type || "creator",
    bio: landingPage?.bio || "",
    avatar_url: landingPage?.avatar_url || "",
    main_player_url: landingPage?.main_player_url || "",
    theme: landingPage?.theme || "light",
    is_published: landingPage?.is_published || false,
  });

  // Save landing page mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!session?.user?.id) throw new Error("Not authenticated");

      if (landingPage) {
        const { error } = await supabase
          .from("landing_pages")
          .update(data)
          .eq("id", landingPage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("landing_pages")
          .insert([{ ...data, owner_user_id: session.user.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Landing page saved!");
      queryClient.invalidateQueries({ queryKey: ["my-landing-page"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handlePublishToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_published: checked }));
    saveMutation.mutate({ 
      ...formData, 
      is_published: checked,
      published_at: checked && !landingPage?.published_at ? new Date().toISOString() : landingPage?.published_at
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const handleSmartSuggestion = (type: string, data: any) => {
    setActiveTab("ctas");
    toast.success("Scroll down to add this suggestion to your CTAs");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landing Page Editor</h1>
          <p className="text-muted-foreground mt-2">
            Create your professional landing page
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {landingPage && (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={handlePublishToggle}
                />
                <Label>
                  {formData.is_published ? "Published" : "Draft"}
                </Label>
              </div>
              
              {formData.is_published && (
                <Button variant="outline" asChild>
                  <a href={`/p/${landingPage.slug}`} target="_blank">
                    View Live
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </>
          )}
          
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {session?.user?.id && landingPage && (
        <SmartSuggestionsPanel
          userId={session.user.id}
          onAddSuggestion={handleSmartSuggestion}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="appearances">Appearances</TabsTrigger>
          <TabsTrigger value="ctas">CTAs</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure your page title, bio, and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Your Name or Show Title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">seeksy.io/p/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      placeholder="your-name"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Short tagline"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell your story..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page_type">Page Type</Label>
                <Select
                  value={formData.page_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, page_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="creator">Creator / Host</SelectItem>
                    <SelectItem value="guest">Podcast Guest</SelectItem>
                    <SelectItem value="show">Show / Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              {formData.page_type === 'creator' && (
                <div className="space-y-2">
                  <Label htmlFor="main_player_url">Main Player Embed URL</Label>
                  <Input
                    id="main_player_url"
                    value={formData.main_player_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, main_player_url: e.target.value }))}
                    placeholder="Spotify or Apple Podcasts embed URL"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: https://open.spotify.com/embed/show/...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearances">
          <GuestAppearancesTab landingPageId={landingPage?.id} />
        </TabsContent>

        <TabsContent value="ctas">
          {session?.user?.id && landingPage && (
            <EnhancedCTAManager 
              landingPageId={landingPage.id} 
              userId={session.user.id}
            />
          )}
        </TabsContent>

        <TabsContent value="social">
          <SocialLinksTab landingPageId={landingPage?.id} />
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Styling</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for different tabs (simplified for now)
function GuestAppearancesTab({ landingPageId }: { landingPageId?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest Appearances</CardTitle>
        <CardDescription>Add podcast episodes you've appeared on</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Guest appearances management coming soon...</p>
      </CardContent>
    </Card>
  );
}


function SocialLinksTab({ landingPageId }: { landingPageId?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
        <CardDescription>Connect your social profiles</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Social links management coming soon...</p>
      </CardContent>
    </Card>
  );
}
