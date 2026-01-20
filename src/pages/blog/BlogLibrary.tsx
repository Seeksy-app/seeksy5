import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Edit, Trash2, Eye, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  source_type?: string;
  published_at: string | null;
  created_at: string;
  has_credential: boolean;
}

export default function BlogLibrary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch blog posts
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch credentials for these posts
      const postIds = posts?.map(p => p.id) || [];
      const { data: credentials } = await supabase
        .from('content_credentials')
        .select('blog_post_id')
        .in('blog_post_id', postIds)
        .eq('status', 'minted');

      const credentialIds = new Set(credentials?.map(c => c.blog_post_id) || []);

      const enrichedPosts = posts?.map(post => ({
        ...post,
        has_credential: credentialIds.has(post.id)
      })) || [];

      setBlogPosts(enrichedPosts);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({
        title: "Error loading blog posts",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Blog post deleted",
        description: "The blog post has been removed.",
      });

      fetchBlogPosts();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast({
        title: "Error deleting blog post",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handlePublishToggle = async (post: BlogPost) => {
    try {
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('blog_posts')
        .update({
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null
        })
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: newStatus === 'published' ? "Blog post published" : "Blog post unpublished",
        description: `The blog post is now ${newStatus}.`,
      });

      fetchBlogPosts();
    } catch (error) {
      console.error('Error updating blog post:', error);
      toast({
        title: "Error updating blog post",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleCertify = async (postId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('mint-content-credential', {
        body: {
          content_type: 'blog_post',
          blog_post_id: postId,
        },
      });

      if (error) throw error;

      toast({
        title: "Certification complete!",
        description: "Your blog post is now certified on-chain.",
      });

      fetchBlogPosts();
    } catch (error) {
      console.error('Error certifying blog post:', error);
      toast({
        title: "Certification failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const filteredPosts = blogPosts.filter(post => {
    if (filter === 'all') return true;
    return post.status === filter;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Library</h1>
          <p className="text-muted-foreground mt-1">
            Manage your blog posts and certify them on-chain
          </p>
        </div>
        <Button onClick={() => navigate('/blog/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Blog Post
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({blogPosts.length})
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          onClick={() => setFilter('draft')}
        >
          Drafts ({blogPosts.filter(p => p.status === 'draft').length})
        </Button>
        <Button
          variant={filter === 'published' ? 'default' : 'outline'}
          onClick={() => setFilter('published')}
        >
          Published ({blogPosts.filter(p => p.status === 'published').length})
        </Button>
      </div>

      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first blog post or generate one from a transcript
            </p>
            <Button onClick={() => navigate('/blog/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Blog Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{post.title}</CardTitle>
                      {post.has_credential && (
                        <div className="flex items-center" title="On-Chain Certified">
                          <Shield className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                        {post.status}
                      </Badge>
                      {post.source_type && (
                        <Badge variant="outline">
                          {post.source_type === 'transcript' ? 'From Transcript' : 'Manual'}
                        </Badge>
                      )}
                      {post.published_at && (
                        <span className="text-xs text-muted-foreground">
                          Published {format(new Date(post.published_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/blog/${post.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/blog/${post.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePublishToggle(post)}
                  >
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  {!post.has_credential && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCertify(post.id)}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Certify on-Chain
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
