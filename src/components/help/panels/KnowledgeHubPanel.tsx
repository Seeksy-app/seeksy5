/**
 * Portal-scoped Knowledge Hub Panel
 * Content is loaded from database, filtered by portal context
 * Articles can be auto-generated via Firecrawl
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import { PortalType, PORTAL_LABELS } from '@/hooks/useHelpDrawer';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useHelpDrawerStore } from '@/hooks/useHelpDrawer';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';

interface KnowledgeHubPanelProps {
  portal: PortalType;
  contentKey: string;
}

// Fallback static articles when database is empty - Creator-focused content
const FALLBACK_ARTICLES: Record<PortalType, Array<{
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}>> = {
  admin: [
    { id: 'admin-1', title: 'Admin Dashboard Overview', content: 'Learn how to navigate the admin dashboard and manage platform settings.', category: 'Getting Started', tags: ['admin', 'dashboard'] },
    { id: 'admin-2', title: 'User Management', content: 'How to manage users, roles, and permissions.', category: 'Administration', tags: ['users', 'roles'] },
  ],
  creator: [
    { id: 'creator-1', title: 'Getting Started as a Creator', content: 'Welcome to Seeksy! This guide will help you set up your creator profile, connect your social accounts, and start building your audience. Start by completing your profile, then explore the Studio for recording.', category: 'Getting Started', tags: ['onboarding', 'profile'] },
    { id: 'creator-2', title: 'Podcast Studio Guide', content: 'Learn how to use the podcast recording studio. Record solo episodes or invite guests. Features include noise reduction, AI transcription, and automatic clip generation.', category: 'Studio', tags: ['studio', 'recording', 'podcast'] },
    { id: 'creator-3', title: 'Monetization Strategies', content: 'Discover multiple revenue streams: sponsorships, dynamic ads, tips, paid subscriptions, and merchandise. Learn which monetization methods work best for your audience size.', category: 'Monetization', tags: ['monetization', 'revenue', 'ads'] },
    { id: 'creator-4', title: 'Growing Your Podcast Audience', content: 'Proven strategies for podcast growth: SEO optimization, cross-promotion, social media clips, guest appearances, and newsletter integration.', category: 'Growth', tags: ['growth', 'audience', 'marketing'] },
    { id: 'creator-5', title: 'AI Tools for Creators', content: 'Use AI to supercharge your workflow: auto-transcription, clip suggestions, show notes generation, social post drafts, and voice cloning for intros.', category: 'AI Tools', tags: ['ai', 'automation', 'tools'] },
    { id: 'creator-6', title: 'Distribution & RSS', content: 'Get your podcast on Spotify, Apple Podcasts, and more. Manage your RSS feed, track analytics across platforms, and optimize for discovery.', category: 'Distribution', tags: ['distribution', 'rss', 'spotify'] },
  ],
  advertiser: [
    { id: 'adv-1', title: 'Campaign Setup Guide', content: 'Create and manage your advertising campaigns.', category: 'Campaigns', tags: ['campaigns'] },
    { id: 'adv-2', title: 'Targeting Options', content: 'Learn about audience targeting and segmentation.', category: 'Targeting', tags: ['targeting'] },
  ],
  board: [
    { id: 'board-1', title: 'Board Dashboard Overview', content: 'Navigate the board member dashboard.', category: 'Getting Started', tags: ['dashboard'] },
    { id: 'board-2', title: 'Financial Reports', content: 'Access and understand financial reports.', category: 'Finance', tags: ['finance', 'reports'] },
  ],
};

export function KnowledgeHubPanel({ portal, contentKey }: KnowledgeHubPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<{id: string; title: string; content: string} | null>(null);
  const navigate = useNavigate();
  const { close } = useHelpDrawerStore();
  
  // Fetch from knowledge_articles table (correct table with portal-scoped content)
  const { data: dbArticles, isLoading } = useQuery({
    queryKey: ['knowledge-articles-panel', portal, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_articles')
        .select('id, title, content, category, excerpt, key_takeaways')
        .eq('portal', portal)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }
      
      const { data } = await query;
      // Map to expected format with tags derived from category
      return (data || []).map(article => ({
        ...article,
        tags: article.key_takeaways?.slice(0, 3) || [article.category]
      }));
    },
  });
  
  const articles = dbArticles && dbArticles.length > 0 ? dbArticles : FALLBACK_ARTICLES[portal] || [];
  
  const handleViewFullHub = () => {
    close();
    // Open public Knowledge Base in new tab (standalone page without sidebar)
    const route = portal === 'admin' ? '/admin/knowledge-base' : '/kb';
    window.open(route, '_blank');
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Knowledge articles for {PORTAL_LABELS[portal]} portal
        </p>
        <Button variant="outline" size="sm" onClick={handleViewFullHub}>
          <ExternalLink className="h-4 w-4 mr-1" />
          View Full Hub
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {dbArticles && dbArticles.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>AI-powered articles from Firecrawl</span>
        </div>
      )}
      
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-4">
          {articles.map(article => (
            <Card 
              key={article.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedArticle(article)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">{article.title}</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs line-clamp-2">
                  {(article as any).excerpt || article.content.replace(/^#.*\n/gm, '').slice(0, 150)}...
                </CardDescription>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {article.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {articles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No articles found</p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Article Detail Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.title}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{selectedArticle?.content || ''}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
