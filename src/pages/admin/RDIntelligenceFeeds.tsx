import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Rss, Plus, Trash2, Podcast, FileText, AlertCircle, RefreshCw, Upload, ExternalLink, Loader2, Youtube, Eye, Search, Filter, Clock, Tag, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RDFeed {
  id: string;
  type: string;
  title: string;
  rss_url: string;
  category: string | null;
  trust_level: string;
  active: boolean;
  created_at: string;
  last_synced_at: string | null;
}

interface RDFeedItem {
  id: string;
  feed_id: string | null;
  title: string;
  url: string | null;
  published_at: string | null;
  content_type: string;
  processed: boolean;
  created_at: string;
  source_name: string | null;
  cleaned_text: string | null;
  raw_content: string | null;
}

interface RDInsight {
  id: string;
  feed_item_id: string;
  summary: string | null;
  tags: string[] | null;
  stance: string | null;
  confidence_score: number | null;
}

export default function RDIntelligenceFeeds() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isYoutubeDialogOpen, setIsYoutubeDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RDFeedItem | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<RDInsight | null>(null);
  const [feedType, setFeedType] = useState<'blog' | 'podcast'>('blog');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    rss_url: '',
    category: '',
    trust_level: 'medium',
  });

  // Fetch feeds
  const { data: feeds, isLoading } = useQuery({
    queryKey: ['rdFeeds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rd_feeds' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[RD Feeds] Error:', error);
        return [];
      }
      return (data as unknown) as RDFeed[];
    },
  });

  // Fetch feed items with insights
  const { data: feedItems, isLoading: feedItemsLoading } = useQuery({
    queryKey: ['rdFeedItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rd_feed_items' as any)
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('[RD Feed Items] Error:', error);
        return [];
      }
      return (data as unknown) as RDFeedItem[];
    },
  });

  // Fetch insights
  const { data: insights } = useQuery({
    queryKey: ['rdInsights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rd_insights' as any)
        .select('*');
      
      if (error) return [];
      return (data as unknown) as RDInsight[];
    },
  });

  // Fetch kb_chunks count
  const { data: chunksCount } = useQuery({
    queryKey: ['kbChunksCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('kb_chunks' as any)
        .select('*', { count: 'exact', head: true });
      
      return count || 0;
    },
  });

  // Add feed mutation
  const addFeedMutation = useMutation({
    mutationFn: async (feed: { type: string; title: string; rss_url: string; category: string | null; trust_level: string }) => {
      try {
        new URL(feed.rss_url);
      } catch {
        throw new Error('Invalid RSS URL');
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('rd_feeds' as any)
        .insert({
          type: feed.type,
          title: feed.title,
          rss_url: feed.rss_url,
          category: feed.category,
          trust_level: feed.trust_level,
          created_by: user?.id,
        });

      if (error) {
        if (error.code === '23505') throw new Error('This feed already exists.');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdFeeds'] });
      setIsAddDialogOpen(false);
      setFormData({ title: '', rss_url: '', category: '', trust_level: 'medium' });
      toast.success('Feed added successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Sync feeds mutation
  const syncFeedsMutation = useMutation({
    mutationFn: async (feedId?: string) => {
      const { data, error } = await supabase.functions.invoke('sync-rd-feeds', {
        body: feedId ? { feedId } : {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdFeeds'] });
      queryClient.invalidateQueries({ queryKey: ['rdFeedItems'] });
      toast.success(data?.message || 'Feeds synced successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Sync failed'),
  });

  // Process content mutation
  const processContentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-rd-content', {
        body: { batchSize: 10 },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdFeedItems'] });
      queryClient.invalidateQueries({ queryKey: ['rdInsights'] });
      queryClient.invalidateQueries({ queryKey: ['kbChunksCount'] });
      toast.success(data?.message || 'Content processed');
    },
    onError: (error: any) => toast.error(error.message || 'Processing failed'),
  });

  // YouTube ingestion mutation
  const ingestYoutubeMutation = useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke('ingest-youtube-rd', {
        body: { youtubeUrl: url },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdFeedItems'] });
      queryClient.invalidateQueries({ queryKey: ['rdInsights'] });
      queryClient.invalidateQueries({ queryKey: ['kbChunksCount'] });
      setIsYoutubeDialogOpen(false);
      setYoutubeUrl('');
      toast.success(data?.message || 'YouTube video ingested');
    },
    onError: (error: any) => toast.error(error.message || 'YouTube ingestion failed'),
  });

  // Reprocess item mutation
  const reprocessItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { data, error } = await supabase.functions.invoke('process-rd-content', {
        body: { itemId, forceReprocess: true },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rdFeedItems'] });
      queryClient.invalidateQueries({ queryKey: ['rdInsights'] });
      queryClient.invalidateQueries({ queryKey: ['kbChunksCount'] });
      toast.success(data?.message || 'Item reprocessed');
    },
    onError: (error: any) => toast.error(error.message || 'Reprocessing failed'),
  });

  // Toggle feed mutation
  const toggleFeedMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('rd_feeds' as any).update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rdFeeds'] }),
  });

  // Delete feed mutation
  const deleteFeedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rd_feeds' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdFeeds'] });
      toast.success('Feed deleted');
    },
  });

  // PDF upload handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setUploadingPdf(true);

    try {
      const fileName = `rd-pdfs/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('media-vault').upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: insertData, error: insertError } = await supabase
        .from('rd_feed_items' as any)
        .insert({
          feed_id: null,
          title: file.name.replace('.pdf', ''),
          url: fileName,
          content_type: 'pdf',
          source_name: 'PDF Upload',
          processed: false,
          item_guid: `pdf-${Date.now()}`,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger PDF extraction
      const itemId = (insertData as any)?.id;
      if (itemId) {
        await supabase.functions.invoke('extract-pdf-text', {
          body: { itemId, storagePath: fileName },
        });
      }

      queryClient.invalidateQueries({ queryKey: ['rdFeedItems'] });
      toast.success('PDF uploaded and processing started');
      setIsPdfDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  // View item details
  const handleViewItem = async (item: RDFeedItem) => {
    setSelectedItem(item);
    const insight = insights?.find(i => i.feed_item_id === item.id);
    setSelectedInsight(insight || null);
    setIsViewDialogOpen(true);
  };

  // Filter items
  const filteredItems = feedItems?.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || item.content_type === filterType;
    
    return matchesSearch && matchesType;
  }) || [];

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'experimental': return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-600';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
      case 'blog': return <FileText className="w-4 h-4" />;
      case 'podcast':
      case 'audio': return <Podcast className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      default: return <Rss className="w-4 h-4" />;
    }
  };

  const blogFeeds = feeds?.filter(f => f.type === 'blog') || [];
  const podcastFeeds = feeds?.filter(f => f.type === 'podcast') || [];
  const lastSyncTime = feeds?.reduce((latest, feed) => {
    if (!feed.last_synced_at) return latest;
    return !latest || new Date(feed.last_synced_at) > new Date(latest) ? feed.last_synced_at : latest;
  }, null as string | null);

  return (
    <div className="px-10 pt-8 pb-16 flex flex-col items-start w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between w-full">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-foreground">R&D Intelligence Feeds</h1>
          <p className="text-muted-foreground mt-1">
            Research feeds powering AI insights and CFO forecasts
          </p>
        </div>
        
        {/* System Health Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Last Sync:</span>
            <span className="font-medium">
              {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{feedItems?.length || 0}</span>
            <span className="text-muted-foreground">Articles</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{chunksCount || 0}</span>
            <span className="text-muted-foreground">KB Chunks</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => { setFeedType('blog'); setIsAddDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Blog RSS Feed
        </Button>
        <Button onClick={() => { setFeedType('podcast'); setIsAddDialogOpen(true); }} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Podcast RSS Feed
        </Button>
        <Button onClick={() => setIsYoutubeDialogOpen(true)} variant="outline" className="gap-2">
          <Youtube className="w-4 h-4" />
          Add YouTube Link
        </Button>
        <Button onClick={() => setIsPdfDialogOpen(true)} variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Upload PDF
        </Button>
        <div className="flex-1" />
        <Button 
          onClick={() => syncFeedsMutation.mutate(undefined)} 
          variant="secondary" 
          className="gap-2"
          disabled={syncFeedsMutation.isPending}
        >
          {syncFeedsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync All Feeds
        </Button>
        <Button 
          onClick={() => processContentMutation.mutate()} 
          variant="secondary" 
          className="gap-2"
          disabled={processContentMutation.isPending}
        >
          {processContentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Process Content
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="articles" onValueChange={(value) => {
        if (value === 'youtube') setFilterType('youtube');
        else if (value === 'pdfs') setFilterType('pdf');
        else if (value === 'articles') setFilterType('all');
      }}>
        <TabsList>
          <TabsTrigger value="articles">Articles ({feedItems?.length || 0})</TabsTrigger>
          <TabsTrigger value="youtube">YouTube ({feedItems?.filter(i => i.content_type === 'youtube').length || 0})</TabsTrigger>
          <TabsTrigger value="pdfs">PDFs ({feedItems?.filter(i => i.content_type === 'pdf').length || 0})</TabsTrigger>
          <TabsTrigger value="feeds">Feeds ({feeds?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="pdf">PDFs</SelectItem>
                <SelectItem value="podcast">Podcasts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {feedItemsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No articles ingested yet</h3>
                  <p className="text-sm mb-4">Add RSS feeds and click "Sync All Feeds" to start ingesting content.</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {filteredItems.map(item => {
                      const insight = insights?.find(i => i.feed_item_id === item.id);
                      return (
                        <div 
                          key={item.id} 
                          className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleViewItem(item)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getContentTypeIcon(item.content_type)}
                                <span className="font-medium truncate">{item.title}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.source_name || item.content_type}
                                </Badge>
                                {item.processed ? (
                                  <Badge className="bg-green-500/20 text-green-600 text-xs">Processed</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'No date'}
                                </span>
                              </div>

                              {insight?.summary && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {insight.summary}
                                </p>
                              )}

                              {insight?.tags && insight.tags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {insight.tags.slice(0, 5).map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  reprocessItemMutation.mutate(item.id);
                                }}
                                disabled={reprocessItemMutation.isPending}
                                title="Reprocess with AI"
                              >
                                {reprocessItemMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
                                )}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewItem(item); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              {item.url && !item.url.startsWith('rd-pdfs/') && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => { e.stopPropagation(); window.open(item.url!, '_blank'); }}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* YouTube Tab */}
        <TabsContent value="youtube" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {feedItemsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Youtube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No YouTube videos ingested yet</h3>
                  <p className="text-sm mb-4">Click "Add YouTube Link" to ingest video transcripts and metadata.</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {filteredItems.map(item => {
                      const insight = insights?.find(i => i.feed_item_id === item.id);
                      return (
                        <div 
                          key={item.id} 
                          className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleViewItem(item)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Youtube className="w-4 h-4 text-red-500" />
                                <span className="font-medium truncate">{item.title}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">YouTube</Badge>
                                {item.processed ? (
                                  <Badge className="bg-green-500/20 text-green-600 text-xs">Processed</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'No date'}
                                </span>
                              </div>

                              {insight?.summary && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{insight.summary}</p>
                              )}

                              {insight?.tags && insight.tags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {insight.tags.slice(0, 5).map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); reprocessItemMutation.mutate(item.id); }}
                                disabled={reprocessItemMutation.isPending}
                                title="Reprocess with AI"
                              >
                                {reprocessItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewItem(item); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              {item.url && (
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); window.open(item.url!, '_blank'); }}>
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDFs Tab */}
        <TabsContent value="pdfs" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {feedItemsLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No PDFs uploaded yet</h3>
                  <p className="text-sm mb-4">Click "Upload PDF" to extract text and generate insights.</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {filteredItems.map(item => {
                      const insight = insights?.find(i => i.feed_item_id === item.id);
                      return (
                        <div 
                          key={item.id} 
                          className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleViewItem(item)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-orange-500" />
                                <span className="font-medium truncate">{item.title}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">PDF Upload</Badge>
                                {item.processed ? (
                                  <Badge className="bg-green-500/20 text-green-600 text-xs">Processed</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'No date'}
                                </span>
                              </div>

                              {insight?.summary && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{insight.summary}</p>
                              )}

                              {insight?.tags && insight.tags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {insight.tags.slice(0, 5).map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); reprocessItemMutation.mutate(item.id); }}
                                disabled={reprocessItemMutation.isPending}
                                title="Reprocess with AI"
                              >
                                {reprocessItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewItem(item); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feeds Tab */}
        <TabsContent value="feeds" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Blog Feeds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Blog Feeds
                </CardTitle>
                <CardDescription>Articles and written content</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : blogFeeds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Rss className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No blog feeds added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blogFeeds.map(feed => (
                      <FeedItem
                        key={feed.id}
                        feed={feed}
                        onToggle={(active) => toggleFeedMutation.mutate({ id: feed.id, active })}
                        onDelete={() => deleteFeedMutation.mutate(feed.id)}
                        onSync={() => syncFeedsMutation.mutate(feed.id)}
                        getTrustLevelColor={getTrustLevelColor}
                        isSyncing={syncFeedsMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Podcast Feeds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Podcast className="w-5 h-5 text-purple-500" />
                  Podcast Feeds
                </CardTitle>
                <CardDescription>Audio content for transcription</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : podcastFeeds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Podcast className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No podcast feeds added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {podcastFeeds.map(feed => (
                      <FeedItem
                        key={feed.id}
                        feed={feed}
                        onToggle={(active) => toggleFeedMutation.mutate({ id: feed.id, active })}
                        onDelete={() => deleteFeedMutation.mutate(feed.id)}
                        onSync={() => syncFeedsMutation.mutate(feed.id)}
                        getTrustLevelColor={getTrustLevelColor}
                        isSyncing={syncFeedsMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Feed Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feedType === 'blog' ? <FileText className="w-5 h-5 text-blue-500" /> : <Podcast className="w-5 h-5 text-purple-500" />}
              Add {feedType === 'blog' ? 'Blog' : 'Podcast'} RSS Feed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Feed Title</Label>
              <Input id="title" placeholder="e.g., TechCrunch" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="rss_url">RSS URL</Label>
              <Input id="rss_url" placeholder="https://example.com/rss" value={formData.rss_url} onChange={(e) => setFormData({ ...formData, rss_url: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="AdTech, Creator Tools" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="trust_level">Trust Level</Label>
              <Select value={formData.trust_level} onValueChange={(value) => setFormData({ ...formData, trust_level: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="experimental">Experimental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => addFeedMutation.mutate({ type: feedType, ...formData, category: formData.category || null })} disabled={addFeedMutation.isPending} className="w-full">
              {addFeedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Feed
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Upload Dialog */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload PDF for Analysis
            </DialogTitle>
            <DialogDescription>
              Upload a PDF document to extract text and generate AI insights
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Input 
              type="file" 
              accept="application/pdf,.pdf" 
              onChange={handlePdfUpload} 
              disabled={uploadingPdf} 
            />
            {uploadingPdf && <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading and processing...</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* YouTube Dialog */}
      <Dialog open={isYoutubeDialogOpen} onOpenChange={setIsYoutubeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Add YouTube Video
            </DialogTitle>
            <DialogDescription>
              Paste a YouTube video URL to ingest metadata, description, and generate AI insights.
              <span className="block text-xs mt-1 text-amber-600">Playlist and channel support coming soon.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input 
              placeholder="https://youtube.com/watch?v=... or https://youtu.be/..." 
              value={youtubeUrl} 
              onChange={(e) => setYoutubeUrl(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">
              Supports: youtube.com/watch?v=, youtu.be/, and youtube.com/embed/ URLs
            </p>
            <Button onClick={() => ingestYoutubeMutation.mutate(youtubeUrl)} disabled={ingestYoutubeMutation.isPending || !youtubeUrl} className="w-full">
              {ingestYoutubeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Ingest Video
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              {selectedItem?.source_name} • {selectedItem?.published_at ? new Date(selectedItem.published_at).toLocaleDateString() : 'No date'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 mt-4">
              {selectedInsight?.summary && (
                <div>
                  <Label className="text-sm font-medium">AI Summary</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedInsight.summary}</p>
                </div>
              )}
              
              {selectedInsight?.tags && selectedInsight.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {selectedInsight.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedInsight?.stance && (
                <div>
                  <Label className="text-sm font-medium">Sentiment</Label>
                  <Badge variant="outline" className="mt-1 capitalize">{selectedInsight.stance}</Badge>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Full Content</Label>
                <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {selectedItem?.cleaned_text || selectedItem?.raw_content || 'No content available'}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Feed Item Component
function FeedItem({ feed, onToggle, onDelete, onSync, getTrustLevelColor, isSyncing }: {
  feed: RDFeed;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
  onSync: () => void;
  getTrustLevelColor: (level: string) => string;
  isSyncing: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{feed.title}</span>
          <Badge className={`${getTrustLevelColor(feed.trust_level)} text-xs`}>
            {feed.trust_level}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{feed.rss_url}</p>
        {feed.last_synced_at && (
          <p className="text-xs text-muted-foreground">
            Last sync: {new Date(feed.last_synced_at).toLocaleString()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button variant="ghost" size="icon" onClick={onSync} disabled={isSyncing}>
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
        <Switch checked={feed.active} onCheckedChange={onToggle} />
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
