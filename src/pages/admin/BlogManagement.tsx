import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, RefreshCw, Rss, FileText, Sparkles, Clock, ExternalLink } from 'lucide-react';
import { BLOG_CATEGORIES } from '@/types/knowledge-blog';
import { format } from 'date-fns';
import BlogScheduler from '@/components/admin/BlogScheduler';

export default function BlogManagement() {
  const queryClient = useQueryClient();
  const [newSourceOpen, setNewSourceOpen] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', category: 'Industry Insights' });

  // Fetch RSS sources
  const { data: rssSources, isLoading: loadingRss } = useQuery({
    queryKey: ['blog-rss-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_rss_sources')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent articles
  const { data: recentArticles } = useQuery({
    queryKey: ['recent-knowledge-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, portal, category, is_published, view_count, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  // Fetch generation jobs
  const { data: jobs } = useQuery({
    queryKey: ['blog-generation-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_generation_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    }
  });

  // Add RSS source
  const addSourceMutation = useMutation({
    mutationFn: async (source: { name: string; url: string; category: string }) => {
      const { error } = await supabase.from('blog_rss_sources').insert(source);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-rss-sources'] });
      toast.success('RSS source added');
      setNewSourceOpen(false);
      setNewSource({ name: '', url: '', category: 'Industry Insights' });
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Toggle source active
  const toggleSourceMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('blog_rss_sources')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-rss-sources'] })
  });

  // Delete source
  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_rss_sources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-rss-sources'] });
      toast.success('RSS source removed');
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Trigger article generation
  const generateArticles = async (useFirecrawl = true) => {
    setIsGenerating(true);
    toast.info(useFirecrawl ? 'Scraping sources & generating articles...' : 'Generating articles...');
    try {
      const { data, error } = await supabase.functions.invoke('generate-knowledge-articles', {
        body: { count: 3, useFirecrawl }
      });
      if (error) throw error;
      toast.success(`Generated ${data?.generated || 0} articles${data?.usedFirecrawl ? ' from web sources' : ''}`);
      queryClient.invalidateQueries({ queryKey: ['blog-generation-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['recent-knowledge-articles'] });
      queryClient.invalidateQueries({ queryKey: ['blog-rss-sources'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Content Generator</h1>
          <p className="text-muted-foreground">Manage RSS sources, content generation, and articles</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => generateArticles(false)} 
            disabled={isGenerating}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Only
          </Button>
          <Button onClick={() => generateArticles(true)} disabled={isGenerating} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Scrape & Generate'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Rss className="h-5 w-5 text-primary" />
              RSS Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rssSources?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Active content sources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Total Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recentArticles?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Published articles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Generation Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{jobs?.filter(j => j.status === 'completed').length || 0}</div>
            <p className="text-sm text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>
      </div>

      {/* RSS Sources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>RSS Sources</CardTitle>
              <CardDescription>Manage content sources for article generation</CardDescription>
            </div>
            <Dialog open={newSourceOpen} onOpenChange={setNewSourceOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Source
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add RSS Source</DialogTitle>
                  <DialogDescription>Add a new RSS feed for content sourcing</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Source Name</Label>
                    <Input
                      value={newSource.name}
                      onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                      placeholder="TechCrunch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>RSS URL</Label>
                    <Input
                      value={newSource.url}
                      onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                      placeholder="https://example.com/rss"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newSource.category}
                      onValueChange={(v) => setNewSource({ ...newSource, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOG_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewSourceOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={() => addSourceMutation.mutate(newSource)}
                    disabled={!newSource.name || !newSource.url}
                  >
                    Add Source
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Last Fetched</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rssSources?.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {source.name}
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{source.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {source.last_fetched_at 
                      ? format(new Date(source.last_fetched_at), 'MMM d, HH:mm')
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={source.is_active}
                      onCheckedChange={(checked) => 
                        toggleSourceMutation.mutate({ id: source.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSourceMutation.mutate(source.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!rssSources || rssSources.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No RSS sources configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scheduler */}
      <BlogScheduler />

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Articles</CardTitle>
          <CardDescription>Latest generated and published articles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentArticles?.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium max-w-[300px] truncate">
                    {article.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{article.portal}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{article.category || 'Uncategorized'}</Badge>
                  </TableCell>
                  <TableCell>{article.view_count}</TableCell>
                  <TableCell>
                    <Badge variant={article.is_published ? 'default' : 'secondary'}>
                      {article.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(article.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
