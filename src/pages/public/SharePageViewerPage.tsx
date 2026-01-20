import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, FileText, Download, ExternalLink, Play } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function SharePageViewerPage() {
  const { slug } = useParams();
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const { data: page, isLoading: pageLoading, error: pageError } = useQuery({
    queryKey: ["share-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_share_pages")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: blocks } = useQuery({
    queryKey: ["share-page-blocks", slug],
    queryFn: async () => {
      if (!page) return [];
      const { data, error } = await supabase
        .from("admin_share_page_blocks")
        .select("*")
        .eq("page_id", page.id)
        .eq("is_visible", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!page && isUnlocked,
  });

  // Log access and increment view count
  const logAccessMutation = useMutation({
    mutationFn: async () => {
      if (!page) return;
      
      // Log access
      await supabase.from("admin_share_page_access_logs").insert({
        page_id: page.id,
        user_agent: navigator.userAgent,
      });

      // Increment view count
      await supabase
        .from("admin_share_pages")
        .update({ view_count: (page.view_count || 0) + 1 })
        .eq("id", page.id);
    },
  });

  useEffect(() => {
    if (page && !page.password_hash) {
      setIsUnlocked(true);
      logAccessMutation.mutate();
    }
  }, [page]);

  const handleUnlock = () => {
    if (!page?.password_hash) return;
    
    // Simple password check (matches the btoa encoding used when creating)
    if (btoa(password) === page.password_hash) {
      setIsUnlocked(true);
      setPasswordError("");
      logAccessMutation.mutate();
    } else {
      setPasswordError("Incorrect password");
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (pageError || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground">
              This share page doesn't exist or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password gate
  if (page.password_hash && !isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{page.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              This page is password protected
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder="Enter password"
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
            <Button onClick={handleUnlock} className="w-full">
              Unlock Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold">{page.title}</h1>
          {page.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {page.description}
            </p>
          )}
        </div>
      </div>

      {/* Content Blocks */}
      <div className="container mx-auto py-8 px-4 space-y-8">
        {blocks?.map((block) => (
          <div key={block.id}>
            {renderBlock(block)}
          </div>
        ))}

        {blocks?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No content available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-card mt-12">
        <div className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
          Shared via Seeksy
        </div>
      </div>
    </div>
  );
}

function renderBlock(block: any) {
  const content = block.content || {};

  switch (block.block_type) {
    case "video":
      return (
        <Card>
          {block.title && (
            <CardHeader>
              <CardTitle className="text-xl">{block.title}</CardTitle>
            </CardHeader>
          )}
          <CardContent className="space-y-4">
            {content.url && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {content.url.includes("youtube.com") || content.url.includes("youtu.be") ? (
                  <iframe
                    src={getYouTubeEmbedUrl(content.url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : content.url.includes("vimeo.com") ? (
                  <iframe
                    src={getVimeoEmbedUrl(content.url)}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={content.url} controls className="w-full h-full" />
                )}
              </div>
            )}
            {content.description && (
              <p className="text-muted-foreground">{content.description}</p>
            )}
          </CardContent>
        </Card>
      );

    case "document":
      return (
        <Card>
          {block.title && (
            <CardHeader>
              <CardTitle className="text-xl">{block.title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{content.filename || "Document"}</p>
                {content.description && (
                  <p className="text-sm text-muted-foreground">{content.description}</p>
                )}
              </div>
              {content.url && (
                <Button asChild>
                  <a href={content.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );

    case "text":
      return (
        <Card>
          {block.title && (
            <CardHeader>
              <CardTitle className="text-xl">{block.title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{content.content || ""}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      );

    case "metrics":
      const metrics = content.metrics || [];
      return (
        <Card>
          {block.title && (
            <CardHeader>
              <CardTitle className="text-xl">{block.title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((metric: any, index: number) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );

    case "timeline":
      const items = content.items || [];
      return (
        <Card>
          {block.title && (
            <CardHeader>
              <CardTitle className="text-xl">{block.title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="relative space-y-8 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {items.map((item: any, index: number) => (
                <div key={index} className="relative">
                  <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                    <p className="font-medium">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );

    case "team":
      const members = content.members || [];
      return (
        <Card>
          {block.title && (
            <CardHeader>
              <CardTitle className="text-xl">{block.title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member: any, index: number) => (
                <div key={index} className="flex items-start gap-4">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-semibold text-muted-foreground">
                        {member.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    {member.bio && (
                      <p className="text-sm mt-1">{member.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
}

function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function getVimeoEmbedUrl(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : url;
}
