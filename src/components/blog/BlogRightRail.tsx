import React, { useMemo } from 'react';
import { RelatedArticleCard } from './RelatedArticleCard';
import { BlogAdSlot } from '@/components/BlogAdSlot';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image_url?: string | null;
  published_at?: string | null;
  content?: string | null;
  category?: string | null;
}

interface BlogRightRailProps {
  relatedPosts: RelatedPost[];
  isLoading?: boolean;
}

export const BlogRightRail = ({ relatedPosts, isLoading }: BlogRightRailProps) => {
  // Use Intersection Observer - only render content when rail is visible
  const [railRef, isVisible] = useIntersectionObserver<HTMLElement>({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true,
  });

  // Memoize the rail items to avoid recalculation on re-renders
  const railItems = useMemo(() => {
    if (!isVisible || relatedPosts.length === 0) return [];
    
    const items: React.ReactNode[] = [];
    
    relatedPosts.forEach((post, index) => {
      // Add related article card
      items.push(
        <RelatedArticleCard
          key={post.id}
          id={post.id}
          title={post.title}
          slug={post.slug}
          excerpt={post.excerpt}
          featuredImageUrl={post.featured_image_url}
          publishedAt={post.published_at}
          content={post.content}
          category={post.category}
        />
      );
      
      // Add ad slot after each article (except the last one)
      if (index < relatedPosts.length - 1) {
        items.push(
          <div key={`ad-${index}`} className="py-2">
            <BlogAdSlot position="sidebar" />
          </div>
        );
      }
    });

    // Add final ad slot at the end if we have posts
    if (relatedPosts.length > 0) {
      items.push(
        <div key="ad-final" className="py-2">
          <BlogAdSlot position="sidebar" />
        </div>
      );
    }
    
    return items;
  }, [relatedPosts, isVisible]);

  // Loading skeleton
  const loadingSkeleton = (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex gap-3 p-3 rounded-lg border border-border/50">
            <div className="w-[120px] h-[68px] bg-muted rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <aside 
      ref={railRef}
      className="hidden lg:block lg:w-[320px] flex-shrink-0"
    >
      <div className="sticky top-6 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Related Articles
        </h3>
        {isLoading || !isVisible ? (
          loadingSkeleton
        ) : relatedPosts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No related articles found
          </div>
        ) : (
          <div className="space-y-4">
            {railItems}
          </div>
        )}
      </div>
    </aside>
  );
};
