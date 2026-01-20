import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Plus, FileText, Edit, Trash2, Eye, Shield, Search, 
  Calendar, BarChart2, Share2, Settings, Rss, Tag,
  Clock, TrendingUp, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  source_type?: string;
  published_at: string | null;
  scheduled_at?: string | null;
  created_at: string;
  has_credential: boolean;
  views_count?: number;
  shares_count?: number;
  read_time?: number;
  featured_image_url?: string | null;
  tags?: string[];
}

interface BlogStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  totalViews: number;
  totalShares: number;
}

export default function BlogDashboard() {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<BlogStats>({
    total: 0,
    published: 0,
    drafts: 0,
    scheduled: 0,
    totalViews: 0,
    totalShares: 0,
  });

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const postIds = posts?.map(p => p.id) || [];
      const { data: credentials } = await supabase
        .from('content_credentials')
        .select('blog_post_id')
        .in('blog_post_id', postIds)
        .eq('status', 'minted');

      const credentialIds = new Set(credentials?.map(c => c.blog_post_id) || []);

      const enrichedPosts = posts?.map(post => ({
        ...post,
        has_credential: credentialIds.has(post.id),
        views_count: post.views_count || 0,
        shares_count: 0,
        read_time: Math.ceil((post.content?.length || 0) / 1000),
      })) || [];

      setBlogPosts(enrichedPosts);

      // Calculate stats
      const published = enrichedPosts.filter(p => p.status === 'published');
      const drafts = enrichedPosts.filter(p => p.status === 'draft');
      const scheduled = enrichedPosts.filter(p => p.status === 'scheduled');
      
      setStats({
        total: enrichedPosts.length,
        published: published.length,
        drafts: drafts.length,
        scheduled: scheduled.length,
        totalViews: enrichedPosts.reduce((acc, p) => acc + (p.views_count || 0), 0),
        totalShares: enrichedPosts.reduce((acc, p) => acc + (p.shares_count || 0), 0),
      });
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast.error("Error loading blog posts");
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
      toast.success("Blog post deleted");
      fetchBlogPosts();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast.error("Error deleting blog post");
    }
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesFilter = filter === 'all' || post.status === filter;
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and publish your blog content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/marketing/blog/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={() => navigate('/marketing/blog/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Shares</p>
                <p className="text-2xl font-bold">{stats.totalShares.toLocaleString()}</p>
              </div>
              <Share2 className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/marketing/blog/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.open(`/blog`, '_blank')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View Blog
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/marketing/blog/tags')}>
          <Tag className="mr-2 h-4 w-4" />
          Manage Tags
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/marketing/blog/settings')}>
          <Rss className="mr-2 h-4 w-4" />
          RSS Feed
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({stats.drafts})</TabsTrigger>
            <TabsTrigger value="published">Published ({stats.published})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({stats.scheduled})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first blog post to get started
            </p>
            <Button onClick={() => navigate('/marketing/blog/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Blog Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {post.featured_image_url && (
                    <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={post.featured_image_url} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg truncate">{post.title}</h3>
                          {post.has_credential && (
                            <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <Badge variant={post.status === 'published' ? 'default' : post.status === 'scheduled' ? 'outline' : 'secondary'}>
                            {post.status}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.read_time} min read
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views_count} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            {post.shares_count} shares
                          </span>
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(post.published_at), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/marketing/blog/${post.id}/edit`)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                          title="Preview"
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
