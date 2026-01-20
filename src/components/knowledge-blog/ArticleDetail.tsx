import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { KnowledgeArticle, PortalType, PORTAL_SECTIONS } from '@/types/knowledge-blog';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Clock, Eye, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ArticleDetailProps {
  article: KnowledgeArticle;
  portal: PortalType;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  canEdit?: boolean;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function ArticleDetail({ 
  article, 
  portal, 
  onRegenerate, 
  isRegenerating,
  canEdit 
}: ArticleDetailProps) {
  const basePath = `/knowledge/${portal}`;
  const sections = PORTAL_SECTIONS[portal];

  // Parse headings for TOC
  const toc = useMemo(() => {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const items: TOCItem[] = [];
    let match;
    
    while ((match = headingRegex.exec(article.content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      items.push({ id, text, level });
    }
    
    return items;
  }, [article.content]);

  // Render markdown content with heading IDs
  const renderedContent = useMemo(() => {
    let content = article.content;
    
    // Add IDs to headings
    content = content.replace(/^(#{2,3})\s+(.+)$/gm, (match, hashes, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const level = hashes.length;
      return `<h${level} id="${id}" class="scroll-mt-20">${text}</h${level}>`;
    });

    // Convert markdown to HTML
    content = content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-sm">$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc pl-6 space-y-1 my-2">$1</ul>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(?!<[hup])/gm, '');

    return `<p class="mb-4">${content}</p>`;
  }, [article.content]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Left Column - Section Navigation (Sticky) */}
      <aside className="w-52 shrink-0 border-r sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto bg-muted/20">
        <div className="p-4">
          <Link
            to={basePath}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to articles
          </Link>
          
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Sections
          </div>
          
          <nav className="space-y-0.5">
            {sections.map((section) => (
              <Link
                key={section}
                to={`${basePath}?section=${encodeURIComponent(section)}`}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 text-sm rounded transition-colors",
                  article.section === section
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <ChevronRight className="h-3 w-3" />
                {section}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Middle Column - Main Article Content */}
      <main className="flex-1 min-w-0 max-w-3xl">
        <article className="p-6 lg:p-8">
          {/* Article Header */}
          <header className="mb-6">
            <Badge variant="outline" className="mb-3">
              {article.section}
            </Badge>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {article.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {article.view_count} views
              </span>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-1.5", isRegenerating && "animate-spin")} />
                  Regenerate
                </Button>
              )}
            </div>
          </header>

          {/* Purpose & Why It Matters */}
          {article.purpose && (
            <section className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <h2 className="text-sm font-semibold text-primary mb-2">Purpose & Why It Matters</h2>
              <p className="text-sm text-foreground">{article.purpose}</p>
            </section>
          )}

          {/* Expected Outcomes */}
          {article.expected_outcomes && (
            <section className="mb-6 p-4 rounded-lg bg-muted/50 border">
              <h2 className="text-sm font-semibold text-foreground mb-2">Expected Outcomes</h2>
              <p className="text-sm text-muted-foreground">{article.expected_outcomes}</p>
            </section>
          )}

          {/* Key Takeaways */}
          {article.key_takeaways && article.key_takeaways.length > 0 && (
            <section className="mb-6 p-4 rounded-lg border bg-card">
              <h2 className="text-sm font-semibold text-foreground mb-2">Key Takeaways</h2>
              <ul className="space-y-1.5">
                {article.key_takeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Main Content */}
          <div 
            className="prose prose-slate prose-sm max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />

          {/* Execution Steps */}
          {article.execution_steps && article.execution_steps.length > 0 && (
            <section className="mb-6 p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <h2 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                How to Apply This
              </h2>
              <ol className="space-y-1.5 list-decimal list-inside">
                {article.execution_steps.map((step, index) => (
                  <li key={index} className="text-sm text-green-900 dark:text-green-100">
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Questions to Ponder */}
          {article.questions && article.questions.length > 0 && (
            <section className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
              <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                Questions to Reflect On
              </h2>
              <ul className="space-y-1.5">
                {article.questions.map((question, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100">
                    <span className="font-medium">{index + 1}.</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
    </div>
  );
}
