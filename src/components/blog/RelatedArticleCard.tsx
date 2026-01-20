import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { extractFirstImageFromContent, getCategoryImage } from '@/utils/extractFirstImage';

interface RelatedArticleCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  publishedAt?: string | null;
  content?: string | null;
  category?: string | null;
}

const DEFAULT_PLACEHOLDER = '/placeholder.svg';

// Helper to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export const RelatedArticleCard = ({
  title,
  slug,
  excerpt,
  featuredImageUrl,
  publishedAt,
  content,
  category,
}: RelatedArticleCardProps) => {
  const navigate = useNavigate();
  
  // Image fallback chain: featured_image → first content image → category default → placeholder
  const imageUrl = useMemo(() => {
    if (featuredImageUrl) return featuredImageUrl;
    
    const contentImage = extractFirstImageFromContent(content);
    if (contentImage) return contentImage;
    
    if (category) return getCategoryImage(category);
    
    return DEFAULT_PLACEHOLDER;
  }, [featuredImageUrl, content, category]);

  return (
    <div
      className="group flex gap-3 p-3 rounded-lg border border-border/50 bg-card 
                 hover:border-border hover:shadow-sm transition-all cursor-pointer"
      onClick={() => navigate(`/blog/${slug}`)}
    >
      {/* Image */}
      <div className="flex-shrink-0 w-[120px] h-[68px] rounded-md overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER;
          }}
        />
      </div>
      
      {/* Text */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {decodeHtmlEntities(title)}
        </h4>
        {excerpt && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {excerpt}
          </p>
        )}
        {publishedAt && (
          <span className="text-[10px] text-muted-foreground mt-1.5">
            {format(new Date(publishedAt), 'MMM d, yyyy')}
          </span>
        )}
      </div>
    </div>
  );
};
