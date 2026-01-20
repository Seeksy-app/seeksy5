import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  ExternalLink,
  Search,
  Building2,
  Newspaper,
  BarChart3,
  Globe,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookmarkPlus,
  Sparkles
} from 'lucide-react';
import { 
  useMarketIntelligenceSources, 
  useMarketIntelligenceInsights,
  useMarketIntelligenceJobs,
  useRefreshSource,
  useRefreshAllSources,
  useMarketIntelligenceSearch,
  useAddSource,
  useToggleSourceActive,
  useDeleteSource,
  useArchiveInsight,
  useToggleInsightFeatured,
  type MarketIntelligenceSource
} from '@/hooks/useMarketIntelligence';
import { useSaveInsightToRD, useScheduleSourceRefresh } from '@/hooks/useSaveInsightToRD';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, React.ElementType> = {
  competitor: Building2,
  industry_publication: Newspaper,
  market_research: BarChart3,
  news: Globe,
  financial: DollarSign,
};

export function MarketIntelligenceAdmin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('');
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [activeTopicCategory, setActiveTopicCategory] = useState<string>('all');

  const { data: sources, isLoading: sourcesLoading } = useMarketIntelligenceSources();
  const { data: insights, isLoading: insightsLoading } = useMarketIntelligenceInsights({ limit: 50 });
  const { data: jobs } = useMarketIntelligenceJobs(20);

  const refreshSource = useRefreshSource();
  const refreshAll = useRefreshAllSources();
  const search = useMarketIntelligenceSearch();
  const addSource = useAddSource();
  const toggleActive = useToggleSourceActive();
  const deleteSource = useDeleteSource();
  const archiveInsight = useArchiveInsight();
  const toggleFeatured = useToggleInsightFeatured();
  const saveToRD = useSaveInsightToRD();
  const scheduleRefresh = useScheduleSourceRefresh();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Enter a search query');
      return;
    }
    try {
      await search.mutateAsync({ query: searchQuery, category: searchCategory || undefined });
      toast.success('Search completed');
      setSearchQuery('');
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleRefreshAll = async () => {
    try {
      await refreshAll.mutateAsync();
      toast.success('All sources refreshed');
    } catch (error) {
      toast.error('Refresh failed');
    }
  };

  // Research topic categories
  const topicCategories = [
    { id: 'all', label: 'All' },
    { id: 'social', label: 'Social' },
    { id: 'commerce', label: 'Commerce' },
    { id: 'creator', label: 'Creators' },
    { id: 'ai', label: 'AI & Tech' },
    { id: 'ads', label: 'Advertising' },
  ];

  // Expanded quick research topics by category
  const researchTopics = [
    // Social Platforms
    { label: 'Instagram Live TV', query: 'Instagram Live TV 2025 creator features shopping engagement metrics revenue', category: 'social' },
    { label: 'YouTube Shorts', query: 'YouTube Shorts monetization 2025 CPM creator fund revenue growth', category: 'social' },
    { label: 'TikTok Shop 2025', query: 'TikTok Shop sales growth 2025 shoptainment live shopping revenue GMV', category: 'social' },
    { label: 'Meta Reels', query: 'Meta Reels monetization Instagram Facebook 2025 creator earnings bonus', category: 'social' },
    { label: 'Snapchat Spotlight', query: 'Snapchat Spotlight creator earnings 2025 monetization trends', category: 'social' },
    { label: 'X/Twitter Spaces', query: 'Twitter X Spaces monetization 2025 creator revenue live audio', category: 'social' },
    
    // Commerce
    { label: 'Live Shopping', query: 'live shopping ecommerce trends 2025 creator economy conversion rates revenue', category: 'commerce' },
    { label: 'Social Commerce', query: 'social commerce Instagram shopping Meta shops creator storefronts 2025 GMV', category: 'commerce' },
    { label: 'Affiliate Marketing', query: 'affiliate marketing creator economy 2025 commission rates Amazon LTK', category: 'commerce' },
    { label: 'Shoppable Video', query: 'shoppable video commerce 2025 click-through rates conversion creator', category: 'commerce' },
    
    // Creator Economy
    { label: 'Creator Monetization', query: 'creator monetization revenue streams 2025 trends sponsorships affiliate subscriptions', category: 'creator' },
    { label: 'Creator Funds', query: 'creator fund payouts 2025 TikTok YouTube Instagram Snapchat comparison', category: 'creator' },
    { label: 'Influencer Rates', query: 'influencer marketing rates 2025 sponsored post pricing nano micro macro', category: 'creator' },
    { label: 'Patreon & Memberships', query: 'Patreon membership platforms 2025 creator subscriptions revenue Substack', category: 'creator' },
    { label: 'UGC Creator Market', query: 'UGC user generated content creator market 2025 brand deals rates', category: 'creator' },
    
    // AI & Tech
    { label: 'AI Content Tools', query: 'AI content creation tools market 2025 video editing automation growth', category: 'ai' },
    { label: 'AI Video Generation', query: 'AI video generation tools 2025 Sora Runway creator adoption market size', category: 'ai' },
    { label: 'AI Voice Cloning', query: 'AI voice cloning creator tools 2025 ElevenLabs podcasting dubbing', category: 'ai' },
    { label: 'AI Editing Software', query: 'AI video editing software 2025 CapCut Descript auto-edit features', category: 'ai' },
    
    // Advertising
    { label: 'Podcast Ads', query: 'podcast advertising market 2025 CPM rates growth host-read ads programmatic', category: 'ads' },
    { label: 'Influencer Ad Spend', query: 'influencer marketing ad spend 2025 brand budgets ROI measurement', category: 'ads' },
    { label: 'Audio Ads Market', query: 'audio advertising market 2025 Spotify podcast streaming ad revenue', category: 'ads' },
    { label: 'Video Ad CPMs', query: 'video advertising CPM rates 2025 YouTube TikTok Instagram Reels comparison', category: 'ads' },
  ];

  const filteredTopics = activeTopicCategory === 'all' 
    ? researchTopics 
    : researchTopics.filter(t => t.category === activeTopicCategory);

  const handleQuickSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      await search.mutateAsync({ query, category: undefined });
      toast.success('Research completed - check Insights tab');
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleSaveToRD = (insight: any) => {
    saveToRD.mutate({
      title: insight.title,
      url: insight.source_url,
      content: `${insight.summary}\n\nKey Points:\n${insight.key_points?.map((p: string) => `• ${p}`).join('\n') || ''}`,
      sourceName: insight.source_name,
      tags: [insight.insight_type, ...insight.audience],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Market Intelligence</h1>
          <p className="text-muted-foreground">Research topics, manage sources, and review AI-extracted insights</p>
        </div>
        <Button onClick={handleRefreshAll} disabled={refreshAll.isPending}>
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshAll.isPending && "animate-spin")} />
          Refresh All Sources
        </Button>
      </div>

      {/* Research Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Market Research</CardTitle>
          </div>
          <CardDescription>Search the web with Firecrawl + AI analysis (Gemini)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Custom Search */}
          <div className="flex gap-3">
            <Input 
              placeholder="Enter your research topic... (e.g., TikTok shoptainment 2025 market data)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-background"
            />
            <Select value={searchCategory} onValueChange={(val) => setSearchCategory(val === 'all' ? '' : val)}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="competitor">Competitors</SelectItem>
                <SelectItem value="industry_publication">Industry</SelectItem>
                <SelectItem value="market_research">Research</SelectItem>
                <SelectItem value="news">News</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={search.isPending}>
              <Search className="h-4 w-4 mr-2" />
              {search.isPending ? 'Researching...' : 'Research'}
            </Button>
          </div>

          {/* Quick Topics with Category Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Quick research topics:</p>
              <div className="flex gap-1">
                {topicCategories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeTopicCategory === cat.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTopicCategory(cat.id)}
                    className="h-6 px-2 text-xs"
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredTopics.map((topic) => (
                <Button
                  key={topic.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSearch(topic.query)}
                  disabled={search.isPending}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1 text-primary" />
                  {topic.label}
                </Button>
              ))}
            </div>
          </div>

          {search.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Searching web sources and extracting insights with AI...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">Sources ({sources?.length || 0})</TabsTrigger>
          <TabsTrigger value="insights">Insights ({insights?.length || 0})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        {/* Sources Tab */}
        <TabsContent value="sources" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Curated Sources</CardTitle>
              <Dialog open={addSourceOpen} onOpenChange={setAddSourceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Source
                  </Button>
                </DialogTrigger>
                <AddSourceDialog 
                  onAdd={async (source) => {
                    await addSource.mutateAsync(source);
                    setAddSourceOpen(false);
                    toast.success('Source added');
                  }}
                  isLoading={addSource.isPending}
                />
              </Dialog>
            </CardHeader>
            <CardContent>
              {sourcesLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading sources...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Last Fetched</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources?.map((source) => {
                      const Icon = categoryIcons[source.category] || Globe;
                      return (
                        <TableRow key={source.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{source.name}</p>
                                <a 
                                  href={source.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                >
                                  {new URL(source.url).hostname}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {source.category.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={source.refresh_frequency} 
                              onValueChange={(val) => scheduleRefresh.mutate({ 
                                sourceId: source.id, 
                                frequency: val as 'hourly' | 'daily' | 'weekly' 
                              })}
                            >
                              <SelectTrigger className="w-[100px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hourly">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Hourly
                                  </span>
                                </SelectItem>
                                <SelectItem value="daily">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Daily
                                  </span>
                                </SelectItem>
                                <SelectItem value="weekly">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Weekly
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {source.last_fetched_at 
                              ? formatDistanceToNow(new Date(source.last_fetched_at), { addSuffix: true })
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>
                            <Switch 
                              checked={source.is_active}
                              onCheckedChange={(checked) => 
                                toggleActive.mutate({ id: source.id, isActive: checked })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => refreshSource.mutate(source.id)}
                                disabled={refreshSource.isPending}
                              >
                                <RefreshCw className={cn(
                                  "h-4 w-4",
                                  refreshSource.isPending && "animate-spin"
                                )} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  if (confirm('Delete this source?')) {
                                    deleteSource.mutate(source.id);
                                    toast.success('Source deleted');
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading insights...</p>
              ) : !insights || insights.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No insights yet. Refresh sources or run a search.</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <div 
                        key={insight.id}
                        className="border rounded-lg p-4 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="capitalize text-xs">
                                {insight.insight_type.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Score: {(insight.relevance_score * 100).toFixed(0)}%
                              </Badge>
                              {insight.is_featured && (
                                <Badge className="bg-yellow-500/20 text-yellow-600 text-xs">Featured</Badge>
                              )}
                            </div>
                            <h4 className="font-medium">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{insight.summary}</p>
                            {insight.key_points && insight.key_points.length > 0 && (
                              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                                {insight.key_points.slice(0, 3).map((point, i) => (
                                  <li key={i}>• {point}</li>
                                ))}
                              </ul>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>From: {insight.source_name}</span>
                              <span>{formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleSaveToRD(insight)}
                                    disabled={saveToRD.isPending}
                                  >
                                    <BookmarkPlus className="h-4 w-4 mr-1" />
                                    Save to R&D
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Save this insight to R&D Intelligence Feeds</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleFeatured.mutate({ 
                                id: insight.id, 
                                featured: !insight.is_featured 
                              })}
                            >
                              {insight.is_featured ? 'Unfeature' : 'Feature'}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                archiveInsight.mutate(insight.id);
                                toast.success('Insight archived');
                              }}
                            >
                              Archive
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Query / Source</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs?.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="capitalize">{job.job_type.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {job.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {job.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                          {job.status === 'running' && <Clock className="h-4 w-4 text-blue-500 animate-pulse" />}
                          {job.status === 'pending' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                          <span className="capitalize">{job.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {job.query || job.source_id || '-'}
                      </TableCell>
                      <TableCell>{job.results_count}</TableCell>
                      <TableCell>
                        {job.started_at 
                          ? format(new Date(job.started_at), 'MMM d, HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {job.started_at && job.completed_at
                          ? `${Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)}s`
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddSourceDialog({ 
  onAdd, 
  isLoading 
}: { 
  onAdd: (source: Omit<MarketIntelligenceSource, 'id' | 'created_at' | 'last_fetched_at'>) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<MarketIntelligenceSource['category']>('news');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<MarketIntelligenceSource['refresh_frequency']>('daily');

  const handleSubmit = () => {
    if (!name || !url) {
      toast.error('Name and URL are required');
      return;
    }
    onAdd({
      name,
      url,
      category,
      description: description || null,
      is_active: true,
      refresh_frequency: frequency,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Source</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input 
            placeholder="TechCrunch"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>URL</Label>
          <Input 
            placeholder="https://techcrunch.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="competitor">Competitor</SelectItem>
              <SelectItem value="industry_publication">Industry Publication</SelectItem>
              <SelectItem value="market_research">Market Research</SelectItem>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Refresh Frequency</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Input 
            placeholder="Brief description of the source"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Source'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
