import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { FirecrawlBlogLayout } from '@/components/knowledge-blog/FirecrawlBlogLayout';
import { ArticleDetail } from '@/components/knowledge-blog/ArticleDetail';
import { useKnowledgeArticle, useRegenerateArticle } from '@/hooks/useKnowledgeArticles';
import { PortalType } from '@/types/knowledge-blog';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';

interface KnowledgeArticlePageProps {
  portal: PortalType;
}

export function KnowledgeArticlePage({ portal }: KnowledgeArticlePageProps) {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { isAdmin } = useUserRoles();
  
  const { data: article, isLoading, error } = useKnowledgeArticle(portal, slug || '');
  const regenerateMutation = useRegenerateArticle();

  // Parse headings for TOC
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
      toast({
        title: 'Article regenerated',
        description: 'The article has been updated with fresh content.'
      });
    } catch (error) {
      toast({
        title: 'Regeneration failed',
        description: 'Could not regenerate the article. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <FirecrawlBlogLayout portal={portal}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </FirecrawlBlogLayout>
    );
  }

  if (error || !article) {
    return (
      <FirecrawlBlogLayout portal={portal}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Article not found</h2>
          <p className="text-muted-foreground">The article you're looking for doesn't exist or has been removed.</p>
        </div>
      </FirecrawlBlogLayout>
    );
  }

  return (
    <FirecrawlBlogLayout 
      portal={portal} 
      currentCategory={article.category}
      tableOfContents={tableOfContents}
      onTocClick={scrollToSection}
      sourceUrl={article.source_url}
    >
      <ArticleDetail
        article={article}
        portal={portal}
        onRegenerate={handleRegenerate}
        isRegenerating={regenerateMutation.isPending}
        canEdit={isAdmin}
      />
    </FirecrawlBlogLayout>
  );
}
