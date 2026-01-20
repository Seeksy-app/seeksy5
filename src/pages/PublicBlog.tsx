import { useState, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Search, Calendar, Eye, ArrowRight, Sparkles, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet";
import { NewsletterSignupForm } from "@/components/NewsletterSignupForm";
import { BlogLoadMore } from "@/components/blog/BlogLoadMore";
import { gtmEvents, trackRouteChange } from "@/utils/gtm";
import blogHeroImage from "@/assets/blog-hero.jpg";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  status: string;
  master_published_at: string;
  views_count: number;
  is_ai_generated: boolean;
  profile?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const PAGE_SIZE = 12;

const PublicBlog = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const activeTag = searchParams.get("tag");

  // Use infinite query for pagination
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["public-blog-posts-infinite", searchQuery, activeTag],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .eq("publish_to_master", true)
        .order("master_published_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      if (activeTag) {
        query = query.contains("seo_keywords", [activeTag]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles for each post
      const postsWithProfiles = await Promise.all(
        (data || []).map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", post.user_id)
            .single();
          
          return { ...post, profile } as BlogPost;
        })
      );

      return {
        posts: postsWithProfiles,
        nextPage: postsWithProfiles.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  // Flatten all pages into single array
  const allPosts = data?.pages.flatMap(page => page.posts) || [];
  const featuredPost = allPosts[0];
  const remainingPosts = allPosts.slice(1);

  // Page view tracking - fires once per route
  useEffect(() => {
    trackRouteChange('/blog', 'Seeksy Blog');
  }, []);

  // Track view more clicks
  const handleLoadMore = () => {
    const currentPage = data?.pages.length || 0;
    gtmEvents.viewMoreClicked(currentPage);
    fetchNextPage();
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Seeksy Blog - Stories from Creators</title>
        <meta name="description" content="Discover insights, tutorials, and stories from the Seeksy creator community. Expert perspectives on podcasting, content creation, and building your audience." />
        <meta name="keywords" content="creator economy, podcasting, content creation, creator tools, audience building" />
        <link rel="canonical" href="https://seeksy.io/blog" />
        
        <meta property="og:title" content="Seeksy Blog - Stories from Creators" />
        <meta property="og:description" content="Discover insights, tutorials, and stories from the Seeksy creator community." />
        <meta property="og:url" content="https://seeksy.io/blog" />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Seeksy Blog - Stories from Creators" />
        <meta name="twitter:description" content="Discover insights, tutorials, and stories from the Seeksy creator community." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Hero Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${blogHeroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-1 bg-background/80 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Seeksy Blog
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground drop-shadow-sm">
              Stories from Creators
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto drop-shadow-sm">
              Discover insights, tutorials, and stories from the Seeksy creator community. 
              Expert perspectives on podcasting, content creation, and building your audience.
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-background/90 backdrop-blur-sm border-border/50"
              />
            </div>

            {/* Active Tag Filter */}
            {activeTag && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-sm text-foreground/70">Filtering by:</span>
                <Badge variant="default" className="gap-1">
                  {activeTag}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => setSearchParams({})}
                  />
                </Badge>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          
          {isLoading ? (
            <div className="space-y-8">
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <div className="grid md:grid-cols-3 gap-6">
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-[300px] rounded-xl" />
              </div>
            </div>
          ) : allPosts.length > 0 ? (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <div className="mb-12">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Featured Article
                  </h2>
                  <Card 
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-card/50 backdrop-blur-sm"
                    onClick={() => navigate(`/blog/${featuredPost.slug}`)}
                  >
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="aspect-video md:aspect-auto md:h-full overflow-hidden bg-muted">
                        {featuredPost.featured_image_url ? (
                          <img
                            src={featuredPost.featured_image_url}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Sparkles className="w-16 h-16 text-primary/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-8 md:p-10 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10 border-2 border-background">
                            {featuredPost.is_ai_generated ? (
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">AS</AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src={featuredPost.profile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {featuredPost.profile?.full_name?.[0] || featuredPost.profile?.username?.[0] || "U"}
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {featuredPost.is_ai_generated ? "Ask Seeksy" : (featuredPost.profile?.full_name || featuredPost.profile?.username || "Anonymous")}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(featuredPost.master_published_at), "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {featuredPost.views_count} views
                              </span>
                            </div>
                          </div>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                          {featuredPost.title}
                        </h3>
                        {featuredPost.excerpt && (
                          <p className="text-muted-foreground mb-6 line-clamp-3">
                            {featuredPost.excerpt}
                          </p>
                        )}
                        <Button variant="ghost" className="w-fit p-0 h-auto text-primary group-hover:gap-3 transition-all">
                          Read Article <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Remaining Posts Grid */}
              {remainingPosts.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
                    Latest Articles
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remainingPosts.map((post) => (
                      <Card
                        key={post.id}
                        className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                      >
                        <div className="aspect-video overflow-hidden bg-muted">
                          {post.featured_image_url ? (
                            <img
                              src={post.featured_image_url}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <Sparkles className="w-10 h-10 text-primary/30" />
                            </div>
                          )}
                        </div>
                        <CardHeader className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar className="h-6 w-6">
                              {post.is_ai_generated ? (
                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">AS</AvatarFallback>
                              ) : (
                                <>
                                  <AvatarImage src={post.profile?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {post.profile?.full_name?.[0] || post.profile?.username?.[0] || "U"}
                                  </AvatarFallback>
                                </>
                              )}
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {post.is_ai_generated ? "Ask Seeksy" : (post.profile?.full_name || post.profile?.username)}
                            </span>
                          </div>
                          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </CardTitle>
                          {post.excerpt && (
                            <CardDescription className="line-clamp-2 mt-2">
                              {post.excerpt}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(post.master_published_at), "MMM d")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.views_count}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* View More Button */}
                  <BlogLoadMore
                    onLoadMore={handleLoadMore}
                    isLoading={isFetchingNextPage}
                    hasMore={!!hasNextPage}
                  />
                </div>
              )}

              {/* Newsletter Section */}
              <div className="mt-16 py-12 px-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl text-center">
                <h2 className="text-2xl font-bold mb-3">Stay Updated</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Get the latest articles and creator insights delivered to your inbox.
                </p>
                <div className="max-w-md mx-auto">
                  <NewsletterSignupForm />
                </div>
              </div>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="text-center py-16">
                <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No articles found" : "No articles yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "Check back soon for new content from our creators"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            © {new Date().getFullYear()} Seeksy. All rights reserved.
          </Link>
        </div>
      </footer>
    </div>
    </>
  );
};

export default PublicBlog;
