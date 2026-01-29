import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, Search, ArrowLeft, LayoutGrid, List as ListIcon, ArrowUpDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateBlogPostModal } from "@/components/admin/CreateBlogPostModal";

const AdminMasterBlog = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "ai" | "user">("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Helper to decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    if (!text) return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const handleGenerateAIPosts = async () => {
    if (!confirm("Generate 3 new AI blog posts for the Master Blog?")) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-master-blog-posts');

      if (error) throw error;

      if (data.success) {
        toast.success(`Generated ${data.postsCreated} new AI blog posts!`);
        queryClient.invalidateQueries({ queryKey: ["master-blog-admin"] });
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate AI posts');
    } finally {
      setIsGenerating(false);
    }
  };

  const { data: posts, isLoading } = useQuery({
    queryKey: ["master-blog-admin", filterType],
    queryFn: async () => {
      let query = (supabase as any)
        .from("blog_posts")
        .select("*")
        .eq("publish_to_master", true)
        .order("master_published_at", { ascending: false });

      if (filterType === "ai") {
        query = query.eq("is_ai_generated", true);
      } else if (filterType === "user") {
        query = query.eq("is_ai_generated", false);
      }

      const result = await query;
      if (result.error) throw result.error;
      const data = result.data as any[];

      // Fetch profiles separately
      const postsWithProfiles = await Promise.all(
        (data || []).map(async (post: any) => {
          const profileResult = await (supabase as any)
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", post.user_id)
            .single();
          
          return { ...post, profile: profileResult.data };
        })
      );

      return postsWithProfiles as any[];
    },
  });

  const filteredPosts = posts?.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPosts = filteredPosts?.sort((a, b) => {
    const dateA = new Date(a.master_published_at || a.created_at).getTime();
    const dateB = new Date(b.master_published_at || b.created_at).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this post from the Master Blog?")) return;

    const result = await (supabase as any)
      .from("blog_posts")
      .update({ 
        publish_to_master: false,
        master_published_at: null
      })
      .eq("id", id);
    const error = result.error;

    if (error) {
      toast.error("Failed to remove post");
      return;
    }

    toast.success("Post removed from Master Blog");
    queryClient.invalidateQueries({ queryKey: ["master-blog-admin"] });
  };

  const handleUnpublish = async (postId: string) => {
    const result = await (supabase as any)
      .from("blog_posts")
      .update({ 
        publish_to_master: false,
        master_published_at: null
      })
      .eq("id", postId);
    const error = result.error;

    if (error) {
      toast.error("Failed to unpublish from master");
      return;
    }

    toast.success("Post unpublished from Master Blog");
    queryClient.invalidateQueries({ queryKey: ["master-blog-admin"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Master Blog Management</h1>
              <p className="text-muted-foreground">Manage all posts on the Seeksy Master Blog</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open("/blog", "_blank")}>
              <Eye className="w-4 h-4 mr-2" />
              View Master Blog
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGenerateAIPosts}
              disabled={isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate AI Posts"}
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </div>
        </div>

        <CreateBlogPostModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["master-blog-admin"] })}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">AI Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts?.filter(p => p.is_ai_generated).length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">User Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts?.filter(p => !p.is_ai_generated).length || 0}</div>
            </CardContent>
          </Card>
        </div>

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
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              All
            </Button>
            <Button
              variant={filterType === "ai" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("ai")}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Generated
            </Button>
            <Button
              variant={filterType === "user" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("user")}
            >
              User Submitted
            </Button>
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
                {searchQuery ? "No posts found matching your search" : "No blog posts on Master Blog yet"}
              </p>
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
                      {post.is_ai_generated && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                      {(post.external_id || post.source_rss_url) && (
                        <Badge variant="outline" className="text-xs">
                          RSS
                        </Badge>
                      )}
                    </div>
                  </div>
                  {post.excerpt && (
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  )}
                  <p className="text-xs text-muted-foreground">
                    By {post.profile?.full_name || post.profile?.username || "Unknown"}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{format(new Date(post.master_published_at || post.created_at), "MMM d, yyyy")}</span>
                    <span>{post.views_count} views</span>
                  </div>
                  <div className="flex gap-2">
                    {!post.is_ai_generated && !post.external_id && !post.source_rss_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/blog/edit/${post.id}`)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
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
                <TableHead>Type</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="cursor-pointer" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Views</TableHead>
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
                    {post.is_ai_generated && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    {(post.external_id || post.source_rss_url) && (
                      <Badge variant="outline" className="text-xs">
                        RSS
                      </Badge>
                    )}
                    {!post.is_ai_generated && !post.external_id && !post.source_rss_url && (
                      <Badge variant="outline" className="text-xs">
                        Manual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {post.profile?.full_name || post.profile?.username || "Unknown"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(post.master_published_at || post.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{post.views_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!post.is_ai_generated && !post.external_id && !post.source_rss_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/blog/edit/${post.id}`)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
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
    </div>
  );
};

export default AdminMasterBlog;
