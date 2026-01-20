import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArticleCard } from '@/components/knowledge-blog/ArticleCard';
import { useKnowledgeArticles, useSearchKnowledgeArticles } from '@/hooks/useKnowledgeArticles';
import { PORTAL_LABELS, BLOG_CATEGORIES } from '@/types/knowledge-blog';
import { Loader2, FileText, ExternalLink, BookOpen, ChevronRight, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function BoardKnowledgeBlog() {
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: articles, isLoading } = useKnowledgeArticles('board');
  const { data: searchResults, isLoading: isSearching } = useSearchKnowledgeArticles(searchQuery, 'board');
  
  const displayArticles = searchQuery.length > 2 ? searchResults : articles;
  
  // Filter by category if specified
  const filteredArticles = useMemo(() => {
    if (!displayArticles) return [];
    if (!currentCategory) return displayArticles;
    return displayArticles.filter(a => a.category === currentCategory);
  }, [displayArticles, currentCategory]);

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Categories */}
      <aside className="w-56 shrink-0 border-r bg-muted/20 hidden lg:block">
        <ScrollArea className="h-full">
          <nav className="p-4 space-y-1">
            <Link
              to="/board/knowledge"
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors font-medium",
                !currentCategory
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <BookOpen className="h-4 w-4" />
              All Articles
            </Link>
            
            <div className="pt-4 pb-2 px-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Categories
              </span>
            </div>
            
            {BLOG_CATEGORIES.map((category) => (
              <Link
                key={category}
                to={`/board/knowledge?category=${encodeURIComponent(category)}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                  currentCategory === category
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <ChevronRight className="h-3 w-3" />
                {category}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 lg:p-8 max-w-4xl">
          {/* Header with Search */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {currentCategory || 'Knowledge Hub'}
                </h1>
                <p className="text-muted-foreground">
                  {currentCategory 
                    ? `Browse articles in ${currentCategory}`
                    : 'Explore insights and resources for board members'
                  }
                </p>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
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
                  to={`/board/knowledge/${article.slug}`}
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
      </main>
    </div>
  );
}
