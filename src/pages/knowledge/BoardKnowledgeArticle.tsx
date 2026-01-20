import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArticleDetail } from '@/components/knowledge-blog/ArticleDetail';
import { useKnowledgeArticle, useRegenerateArticle } from '@/hooks/useKnowledgeArticles';
import { Loader2, ArrowLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function BoardKnowledgeArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useKnowledgeArticle('board', slug || '');
  const regenerateMutation = useRegenerateArticle();
  
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

  const handleRegenerate = async () => {
    if (!article) return;
    try {
      await regenerateMutation.mutateAsync(article.id);
      toast.success('Article regenerated successfully');
    } catch (err) {
      toast.error('Failed to regenerate article');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <h2 className="text-xl font-semibold mb-2">Article not found</h2>
        <p className="text-muted-foreground mb-4">The article you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/board/knowledge">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Hub
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 lg:p-8 max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/board/knowledge">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Knowledge Hub
            </Link>
          </Button>
          
          <ArticleDetail 
            article={article} 
            portal="board" 
            onRegenerate={handleRegenerate}
            isRegenerating={regenerateMutation.isPending}
          />
        </div>
      </main>

      {/* Right Sidebar - Table of Contents / Source */}
      {(tableOfContents.length > 0 || article.source_url) && (
        <aside className="w-52 shrink-0 border-l bg-muted/10 hidden xl:block overflow-auto">
          <div className="p-4 sticky top-0">
            {/* Source Link */}
            {article.source_url && (
              <div className="mb-6">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Source
                </div>
                <a 
                  href={article.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  Read original
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            
            {/* Table of Contents */}
            {tableOfContents.length > 0 && (
              <>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  On this page
                </div>
                
                <nav className="space-y-0.5">
                  {tableOfContents.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={cn(
                        "block w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-muted",
                        item.level === 2 
                          ? "text-foreground font-medium" 
                          : "text-muted-foreground pl-4 text-xs"
                      )}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
