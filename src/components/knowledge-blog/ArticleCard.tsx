import { Link } from 'react-router-dom';
import { KnowledgeArticle } from '@/types/knowledge-blog';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ArticleCardProps {
  article: KnowledgeArticle;
  basePath: string;
}

export function ArticleCard({ article, basePath }: ArticleCardProps) {
  return (
    <Link
      to={`${basePath}/${article.slug}`}
      className="block group"
    >
      <article className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {article.section}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
              {article.title}
            </h3>
            
            {article.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {article.excerpt}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.view_count} views
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
