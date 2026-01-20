import { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FirecrawlBlogLayout } from '@/components/knowledge-blog/FirecrawlBlogLayout';
import { ArticleDetail } from '@/components/knowledge-blog/ArticleDetail';
import { PortalType, KnowledgeArticle, BLOG_CATEGORIES } from '@/types/knowledge-blog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Clock, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function KnowledgeBlogPage() {
  const { portal, slug } = useParams<{ portal: string; slug?: string }>();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  const portalType = (portal || 'creator') as PortalType;
  const currentCategory = searchParams.get('category');

  // Fetch articles
  const { data: articles, isLoading } = useQuery({
    queryKey: ['knowledge-articles', portalType, currentCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_articles')
        .select('*')
        .eq('portal', portalType)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (currentCategory) {
        query = query.eq('category', currentCategory);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KnowledgeArticle[];
    }
  });

  // Fetch single article if slug is provided
  const { data: article, isLoading: loadingArticle } = useQuery({
    queryKey: ['knowledge-article', portalType, slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('portal', portalType)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      if (error) throw error;
      
      // Increment view count
      await supabase
        .from('knowledge_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);
      
      return data as KnowledgeArticle;
    },
    enabled: !!slug
  });

  // Parse TOC from article content
  const tableOfContents = useMemo(() => {
    if (!article?.content) return [];
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const items: { id: string; text: string; level: number }[] = [];
    let match;
    
    while ((match = headingRegex.exec(article.content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      items.push({ id, text, level });
    }
    
    return items;
  }, [article?.content]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Single article view
  if (slug && article) {
    return (
      <FirecrawlBlogLayout
        portal={portalType}
        currentCategory={article.category}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        tableOfContents={tableOfContents}
        onTocClick={scrollToSection}
      >
        <ArticleDetail article={article} portal={portalType} />
      </FirecrawlBlogLayout>
    );
  }

  // Article list view
  return (
    <FirecrawlBlogLayout
      portal={portalType}
      currentCategory={currentCategory}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
    >
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {currentCategory || 'All Articles'}
          </h1>
          <p className="text-muted-foreground">
            {currentCategory 
              ? `Browse articles in ${currentCategory}`
              : `Explore all knowledge articles for ${portalType === 'board' ? 'board members' : portalType === 'admin' ? 'administrators' : 'creators'}`
            }
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/knowledge/${portalType}/${article.slug}`}
                className="block group"
              >
                <Card className="transition-all hover:shadow-md hover:border-primary/30">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{article.category || 'Uncategorized'}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.view_count} views
                      </span>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                      {article.title}
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>
                    {article.excerpt && (
                      <CardDescription className="line-clamp-2">
                        {article.excerpt}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {article.key_takeaways && article.key_takeaways.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1.5">
                        {article.key_takeaways.slice(0, 3).map((takeaway, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs font-normal">
                            {takeaway.length > 50 ? takeaway.substring(0, 50) + '...' : takeaway}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `No articles found matching "${searchQuery}"`
                  : 'No articles available yet'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </FirecrawlBlogLayout>
  );
}
