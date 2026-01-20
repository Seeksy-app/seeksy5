import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FirecrawlBlogLayout } from '@/components/knowledge-blog/FirecrawlBlogLayout';
import { ArticleCard } from '@/components/knowledge-blog/ArticleCard';
import { ArticleDetail } from '@/components/knowledge-blog/ArticleDetail';
import { useKnowledgeArticles, useSearchKnowledgeArticles, useKnowledgeArticle } from '@/hooks/useKnowledgeArticles';
import { PortalType, PORTAL_LABELS, KnowledgeArticle } from '@/types/knowledge-blog';
import { Loader2, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeBlogPortalProps {
  portal: PortalType;
  slug?: string;
}

export function KnowledgeBlogPortal({ portal, slug }: KnowledgeBlogPortalProps) {
  const [searchParams] = useSearchParams();
  const currentSection = searchParams.get('section');
  const currentCategory = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: articles, isLoading } = useKnowledgeArticles(portal, currentSection);
  const { data: searchResults, isLoading: isSearching } = useSearchKnowledgeArticles(searchQuery, portal);
  const { data: singleArticle, isLoading: loadingArticle } = useKnowledgeArticle(portal, slug || '');
  
  const basePath = `/knowledge/${portal}`;
  const displayArticles = searchQuery.length > 2 ? searchResults : articles;
  
  // Filter by category if specified
  const filteredArticles = useMemo(() => {
    if (!displayArticles) return [];
    if (!currentCategory) return displayArticles;
    return displayArticles.filter(a => a.category === currentCategory);
  }, [displayArticles, currentCategory]);

  // Parse TOC from article content
  const tableOfContents = useMemo(() => {
    if (!singleArticle?.content) return [];
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const items: { id: string; text: string; level: number }[] = [];
    let match;
    
    while ((match = headingRegex.exec(singleArticle.content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      items.push({ id, text, level });
    }
    
    return items;
  }, [singleArticle?.content]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Single article view
  if (slug && singleArticle) {
    return (
      <FirecrawlBlogLayout
        portal={portal}
        currentCategory={singleArticle.category}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        tableOfContents={tableOfContents}
        onTocClick={scrollToSection}
        sourceUrl={singleArticle.source_url}
      >
        <ArticleDetail article={singleArticle} portal={portal} />
      </FirecrawlBlogLayout>
    );
  }

  // Loading single article
  if (slug && loadingArticle) {
    return (
      <FirecrawlBlogLayout
        portal={portal}
        currentCategory={currentCategory}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </FirecrawlBlogLayout>
    );
  }

  // Article list view
  return (
    <FirecrawlBlogLayout
      portal={portal}
      currentCategory={currentCategory}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
    >
      <div className="p-6 lg:p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {currentCategory || PORTAL_LABELS[portal]}
          </h1>
          <p className="text-muted-foreground">
            {currentCategory 
              ? `Browse articles in ${currentCategory}`
              : `Explore all knowledge articles for ${portal === 'admin' ? 'administrators' : portal === 'creator' ? 'creators' : 'board members'}`
            }
          </p>
        </div>

        {/* Loading State */}
        {(isLoading || isSearching) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isSearching && filteredArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No articles found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? 'Try a different search term'
                : 'Check back soon for new content'
              }
            </p>
          </div>
        )}

        {/* Article List */}
        {!isLoading && !isSearching && filteredArticles.length > 0 && (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                to={`${basePath}/${article.slug}`}
                className="block group"
              >
                <Card className="transition-all hover:shadow-md hover:border-primary/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{article.category || 'Uncategorized'}</Badge>
                      {article.section && (
                        <Badge variant="secondary" className="text-xs">
                          {article.section}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {article.title}
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
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}</span>
                        <span>{article.view_count} views</span>
                        {article.source_url && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            External source
                          </span>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </FirecrawlBlogLayout>
  );
}
