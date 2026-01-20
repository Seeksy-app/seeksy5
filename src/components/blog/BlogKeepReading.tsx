import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image_url?: string | null;
  published_at?: string | null;
  is_ai_generated?: boolean;
}

interface BlogKeepReadingProps {
  posts: RelatedPost[];
  currentPostId: string;
}

export const BlogKeepReading = ({ posts, currentPostId }: BlogKeepReadingProps) => {
  const navigate = useNavigate();
  
  // Filter out current post and take top 3
  const relatedPosts = posts.filter(p => p.id !== currentPostId).slice(0, 3);
  
  if (relatedPosts.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h3 className="text-lg font-semibold mb-6 text-foreground">Keep Reading</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {relatedPosts.map((post) => (
          <Card
            key={post.id}
            className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => navigate(`/blog/${post.slug}`)}
          >
            <div className="aspect-video overflow-hidden bg-muted">
              {post.featured_image_url ? (
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary/20">S</span>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {post.is_ai_generated ? 'AS' : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {post.is_ai_generated ? 'Ask Seeksy' : 'Author'}
                </span>
                {post.published_at && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.published_at), 'MMM d')}
                    </span>
                  </>
                )}
              </div>
              <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h4>
              <div className="mt-3 flex items-center text-xs text-primary">
                Read more <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
