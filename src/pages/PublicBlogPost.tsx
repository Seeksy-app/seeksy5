import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Eye, Share2 } from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet";
import { BlogMarkdownContent } from "@/components/blog/BlogMarkdownContent";
import { BlogRightRail } from "@/components/blog/BlogRightRail";
import { BlogSources } from "@/components/blog/BlogSources";
import { BlogKeepReading } from "@/components/blog/BlogKeepReading";
import { BlogSubscriptionGate } from "@/components/blog/BlogSubscriptionGate";
import { useMemo, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { gtmEvents, createScrollTracker, trackRouteChange } from "@/utils/gtm";

interface Source {
  title: string;
  url: string;
}

const PublicBlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper to decode HTML entities in titles
  const decodeHtmlEntities = (text: string): string => {
    if (!text) return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const { data: post, isLoading } = useQuery({
    queryKey: ["public-blog-post", slug],
    queryFn: async () => {
      // First get the blog post
      const { data: blogData, error: blogError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (blogError) throw blogError;

      // Then get the profile separately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url")
        .eq("id", blogData.user_id)
        .single();

      // Increment view count
      await supabase
        .from("blog_posts")
        .update({ views_count: (blogData.views_count || 0) + 1 })
        .eq("id", blogData.id);

      return { ...blogData, profile: profileData };
    },
    enabled: !!slug,
  });

  // Fetch related posts - prioritize same category/tags, then recent
  const { data: relatedPosts, isLoading: relatedLoading } = useQuery({
    queryKey: ["related-posts", post?.id, post?.seo_keywords],
    queryFn: async () => {
      if (!post?.id) return [];

      // Try to get posts with matching tags first
      let query = supabase
        .from("blog_posts")
        .select("id, title, excerpt, slug, featured_image_url, published_at, is_ai_generated, content, seo_keywords")
        .eq("status", "published")
        .neq("id", post.id)
        .order("published_at", { ascending: false })
        .limit(6);

      const { data, error } = await query;

      if (error) throw error;
      
      // Sort by tag overlap if we have keywords
      if (post.seo_keywords && post.seo_keywords.length > 0 && data) {
        const postKeywords = new Set(post.seo_keywords.map((k: string) => k.toLowerCase()));
        const scored = data.map(p => {
          const pKeywords = (p.seo_keywords || []).map((k: string) => k.toLowerCase());
          const overlap = pKeywords.filter((k: string) => postKeywords.has(k)).length;
          return { ...p, score: overlap };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored;
      }
      
      return data || [];
    },
    enabled: !!post?.id,
  });

  // Memoize related posts to avoid refetch loops
  const memoizedRelatedPosts = useMemo(() => relatedPosts || [], [relatedPosts]);
  
  // Parse sources from jsonb
  const sources: Source[] = useMemo(() => {
    if (!post?.sources) return [];
    try {
      const arr = post.sources as unknown as Array<{ title?: string; url?: string }>;
      if (!Array.isArray(arr)) return [];
      return arr.filter(s => s && typeof s.url === 'string').map(s => ({
        title: s.title || s.url || '',
        url: s.url || ''
      }));
    } catch {
      return [];
    }
  }, [post?.sources]);

  // SEO meta data
  const seoTitle = post ? `${decodeHtmlEntities(post.title)} | Seeksy Blog` : 'Seeksy Blog';
  const seoDescription = post?.seo_description || post?.excerpt || 'Read this article on the Seeksy Blog';
  const seoKeywords = post?.seo_keywords?.join(', ') || '';
  const canonicalUrl = `https://seeksy.io/blog/${slug}`;
  const ogImage = post?.featured_image_url || 'https://lovable.dev/opengraph-image-p98pqg.png';

  // Scroll depth tracking for GTM
  useEffect(() => {
    if (!post?.id || !post?.title) return;
    
    const scrollHandler = createScrollTracker(post.id, post.title, (milestone) => {
      console.log(`[GTM] Scroll milestone: ${milestone}%`);
    });
    
    window.addEventListener('scroll', scrollHandler, { passive: true });
    return () => window.removeEventListener('scroll', scrollHandler);
  }, [post?.id, post?.title]);

  // Page view event - fires once per unique route
  useEffect(() => {
    if (post?.id && slug) {
      trackRouteChange(`/blog/${slug}`, post.title);
    }
  }, [post?.id, slug, post?.title]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Article link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">This blog post doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/blog")}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  // Check if gated (default true if not specified)
  const isGated = post.is_subscription_gated !== false;

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription.slice(0, 160)} />
        {seoKeywords && <meta name="keywords" content={seoKeywords} />}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* OpenGraph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription.slice(0, 160)} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={ogImage} />
        {post?.published_at && (
          <meta property="article:published_time" content={post.published_at} />
        )}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription.slice(0, 160)} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8 max-w-[1140px] mx-auto">
          {/* Main Content - max 720px */}
          <article className="flex-1 max-w-[720px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/blog")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>

            {post.featured_image_url && (
              <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {decodeHtmlEntities(post.title)}
              </h1>

              {post.excerpt && (
                <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-10 w-10">
                  {post.is_ai_generated ? (
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">AS</AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={post.profile?.avatar_url} />
                      <AvatarFallback>
                        {post.profile?.full_name?.[0] || post.profile?.username?.[0] || "U"}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {post.is_ai_generated ? "Ask Seeksy" : (post.profile?.full_name || post.profile?.username || "Anonymous")}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(post.published_at), "MMMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.views_count} views
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags - clickable to filter by tag */}
              {post.seo_keywords && post.seo_keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.seo_keywords.map((tag: string) => (
                    <Badge 
                      key={tag}
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => navigate(`/blog?tag=${encodeURIComponent(tag)}`)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </header>

            <Separator className="mb-8" />

            {/* Blog Content with subscription gate */}
            <BlogSubscriptionGate postId={post.id} postTitle={post.title} isGated={isGated}>
              <BlogMarkdownContent content={post.content} />
              
              {/* Sources Section */}
              <BlogSources sources={sources} />
            </BlogSubscriptionGate>

            <Separator className="my-8" />

            {/* Keep Reading Section */}
            <BlogKeepReading 
              posts={memoizedRelatedPosts} 
              currentPostId={post.id} 
            />

            <Separator className="my-8" />

            <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Last updated: {format(new Date(post.updated_at), "MMMM d, yyyy")}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </footer>
          </article>

          {/* Right Rail - Hidden on mobile/tablet */}
          <BlogRightRail 
            relatedPosts={memoizedRelatedPosts} 
            isLoading={relatedLoading}
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default PublicBlogPost;
