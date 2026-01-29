import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Trash, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, Search, ArrowLeft, LayoutGrid, List as ListIcon, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ImportBlogRSSDialog } from "@/components/ImportBlogRSSDialog";
import { ImportYouTubeDialog } from "@/components/ImportYouTubeDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Blog = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [username, setUsername] = useState<string>("");
  const [rssUrl, setRssUrl] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isYouTubeDialogOpen, setIsYouTubeDialogOpen] = useState(false);

  // Fetch user's username for blog URL
  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = await (supabase as any)
        .from("profiles")
        .select("username, auto_publish_rss, blog_rss_url, blog_name")
        .eq("id", user.id)
        .single();

      if (result.error) throw result.error;
      const data = result.data as any;
      
      // Set local RSS URL state when profile loads
      if (data?.blog_rss_url) {
        setRssUrl(data.blog_rss_url);
      }
      
      return data;
    },
  });

  // Check if user has any RSS imported posts
  const { data: rssPostsCount } = useQuery({
    queryKey: ["rss-posts-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { count, error } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("source_rss_url", "is", null);

      if (error) throw error;
      return count || 0;
    },
  });

  const hasRssFeed = (rssPostsCount || 0) > 0;

  const blogUrl = profile?.blog_name 
    ? `seeksy.io/${profile.blog_name}.blog`
    : profile?.username 
    ? `seeksy.io/${profile.username}.blog`
    : "";

  // Helper to decode HTML entities in titles
  const decodeHtmlEntities = (text: string): string => {
    if (!text) return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = await (supabase as any)
        .from("blog_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (result.error) throw result.error;
      return result.data as any[];
    },
  });

  const filteredPosts = posts?.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPosts = filteredPosts?.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete post");
      return;
    }

    toast.success("Post deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
  };

  const handleUnpublish = async (postId: string) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({ 
        status: "draft",
        published_at: null
      })
      .eq("id", postId);

    if (error) {
      toast.error("Failed to unpublish post");
      return;
    }

    toast.success("Post unpublished");
    queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
  };

  const handlePublishToMyBlog = async (postId: string) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({ 
        status: "published",
        published_at: new Date().toISOString()
      })
      .eq("id", postId);

    if (error) {
      toast.error("Failed to publish post");
      return;
    }

    toast.success("Post published to your blog!");
    queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
  };

  const handlePublishToMaster = async (postId: string) => {
    const result = await (supabase as any)
      .from("blog_posts")
      .update({ 
        publish_to_master: true,
        master_published_at: new Date().toISOString()
      })
      .eq("id", postId);

    if (result.error) {
      toast.error("Failed to publish to master blog");
      return;
    }

    toast.success("Post published to master blog!");
    queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500";
      case "draft":
        return "bg-yellow-500";
      case "archived":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  // Calculate SEO score based on SEO best practices
  const calculateSEOScore = (post: any) => {
    let score = 0;
    const maxScore = 100;
    
    // SEO Title (20 points)
    if (post.seo_title) {
      score += 15;
      // Optimal length: 50-60 characters
      if (post.seo_title.length >= 50 && post.seo_title.length <= 60) {
        score += 5;
      }
    }
    
    // SEO Description (20 points)
    if (post.seo_description) {
      score += 15;
      // Optimal length: 150-160 characters
      if (post.seo_description.length >= 150 && post.seo_description.length <= 160) {
        score += 5;
      }
    }
    
    // SEO Keywords (15 points)
    if (post.seo_keywords && post.seo_keywords.length > 0) {
      score += 15;
    }
    
    // Featured Image (15 points)
    if (post.featured_image_url) {
      score += 15;
    }
    
    // Content Length (20 points) - optimal is 1000+ words
    if (post.content) {
      const wordCount = post.content.split(/\s+/).length;
      if (wordCount >= 300) score += 5;
      if (wordCount >= 600) score += 5;
      if (wordCount >= 1000) score += 5;
      if (wordCount >= 1500) score += 5;
    }
    
    // Title Length (10 points) - should be descriptive but not too long
    if (post.title) {
      if (post.title.length >= 30 && post.title.length <= 70) {
        score += 10;
      } else if (post.title.length >= 20) {
        score += 5;
      }
    }
    
    return Math.min(score, maxScore);
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getSEOScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    if (score >= 40) return "bg-orange-100";
    return "bg-red-100";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">My Blog</h1>
              <p className="text-muted-foreground">Manage your blog posts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ImportBlogRSSDialog />
            <Button variant="outline" size="sm" onClick={() => setIsYouTubeDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              YouTube
            </Button>
            <Button onClick={() => navigate("/blog/create")}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>

        {/* Blog Settings Card - Collapsible */}
        <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen} className="mb-6">
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <CardTitle className="text-lg">Manage Your Blog</CardTitle>
                    <CardDescription>Blog URL, RSS feed, and settings</CardDescription>
                  </div>
                  {isSettingsOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
            {/* Blog URL */}
            {blogUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Blog URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={blogUrl} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${blogUrl}`);
                      toast.success("Blog URL copied!");
                    }}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://${blogUrl}`, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            )}

            {/* RSS Feed URL */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-sm font-medium">RSS Feed URL (Auto-Sync)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Set a single RSS feed for automatic hourly sync
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/feed"
                  value={rssUrl}
                  onChange={(e) => setRssUrl(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    
                    const result = await (supabase as any)
                      .from("profiles")
                      .update({ blog_rss_url: rssUrl.trim() || null })
                      .eq("id", user.id);
                    
                    if (result.error) {
                      toast.error("Failed to update RSS feed");
                    } else {
                      toast.success("RSS feed updated!");
                      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
                    }
                  }}
                >
                  Save
                </Button>
                {profile?.blog_rss_url && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (!confirm("Remove RSS feed? This won't delete existing posts.")) return;
                      
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      
                      const result = await (supabase as any)
                        .from("profiles")
                        .update({ blog_rss_url: null })
                        .eq("id", user.id);
                      
                      if (result.error) {
                        toast.error("Failed to remove RSS feed");
                      } else {
                        setRssUrl("");
                        toast.success("RSS feed removed");
                        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
                      }
                    }}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* RSS Auto-Publish Switch */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-1 flex-1">
                <Label className="text-sm font-medium">RSS Auto-Publish</Label>
                <p className="text-xs text-muted-foreground">Automatically publish new posts from RSS feeds</p>
              </div>
              <Switch
                id="auto-publish-rss"
                checked={profile?.auto_publish_rss || false}
                onCheckedChange={async (checked) => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;
                  
                  const result = await (supabase as any)
                    .from("profiles")
                    .update({ auto_publish_rss: checked })
                    .eq("id", user.id);
                  
                  if (result.error) {
                    toast.error("Failed to update settings");
                  } else {
                    toast.success(`Auto-publish ${checked ? "enabled" : "disabled"}`);
                    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
                  }
                }}
              />
            </div>

            {/* RSS Feed Status */}
            {profile?.blog_rss_url && rssPostsCount && rssPostsCount > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {rssPostsCount} imported {rssPostsCount === 1 ? 'post' : 'posts'} from RSS feed
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Delete all ${rssPostsCount} RSS imported posts? This won't affect your RSS feed URL.`)) return;

                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;

                        const { error } = await supabase
                          .from("blog_posts")
                          .delete()
                          .eq("user_id", user.id)
                          .not("source_rss_url", "is", null);

                        if (error) {
                          toast.error("Failed to delete RSS posts");
                        } else {
                          toast.success("All RSS posts deleted");
                          queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
                          queryClient.invalidateQueries({ queryKey: ["rss-posts-count"] });
                        }
                      }}
                    >
                      <Trash className="w-3 h-3 mr-1" />
                      Delete All Imported Posts
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Blocks
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === "desc" ? "Newest" : "Oldest"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading posts...</div>
        ) : !sortedPosts || sortedPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No posts found matching your search" : "No blog posts yet"}
              </p>
              <Button onClick={() => navigate("/blog/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Post
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {post.featured_image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2">{decodeHtmlEntities(post.title)}</CardTitle>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                      {(post.external_id || post.source_rss_url) && (
                        <Badge variant="outline" className="text-xs">
                          RSS Import
                        </Badge>
                      )}
                    </div>
                  </div>
                  {post.excerpt && (
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{format(new Date(post.created_at), "MMM d, yyyy")}</span>
                    <span>{post.views_count} views</span>
                  </div>
                  <div className="flex gap-2">
                  {post.external_id || post.source_rss_url ? (
                      // RSS imported posts - show publish options
                      <>
                        {post.status !== "published" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublishToMyBlog(post.id)}
                            className="flex-1"
                          >
                            Publish to My Blog
                          </Button>
                        )}
                        {post.status === "published" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnpublish(post.id)}
                            className="flex-1"
                          >
                            Unpublish
                          </Button>
                        )}
                        {!post.publish_to_master && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublishToMaster(post.id)}
                            className="flex-1"
                          >
                            Publish to Master
                          </Button>
                        )}
                        {post.status === "published" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      // Regular posts - show edit option
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/blog/edit/${post.id}`)}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        {post.status === "published" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
          </div>
        ) : (
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-96">Post</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>SEO Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.featured_image_url && (
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate max-w-md">{decodeHtmlEntities(post.title)}</div>
                          {post.excerpt && (
                            <div className="text-sm text-muted-foreground truncate max-w-md">
                              {post.excerpt}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                      {(post.external_id || post.source_rss_url) && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          RSS
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(post.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{post.views_count}</TableCell>
                    <TableCell>
                      {(() => {
                        const score = calculateSEOScore(post);
                        return (
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full ${getSEOScoreBgColor(score)}`}>
                              <span className={`font-bold ${getSEOScoreColor(score)}`}>
                                {score}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {post.external_id || post.source_rss_url ? (
                          <>
                        {post.status === "published" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnpublish(post.id)}
                          >
                            Unpublish
                          </Button>
                        )}
                        {post.status !== "published" && (
                          <>
                            {post.status !== "published" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePublishToMyBlog(post.id)}
                              >
                                Publish to My Blog
                              </Button>
                            )}
                            {!post.publish_to_master && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePublishToMaster(post.id)}
                              >
                                Publish to Master
                              </Button>
                            )}
                          </>
                        )}
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/blog/edit/${post.id}`)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        {post.status === "published" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        )}
      </div>

      <ImportYouTubeDialog
        open={isYouTubeDialogOpen}
        onOpenChange={setIsYouTubeDialogOpen}
      />
    </div>
  );
};

export default Blog;
