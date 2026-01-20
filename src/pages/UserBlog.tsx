import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Calendar, Sparkles } from "lucide-react";
import { format } from "date-fns";

const UserBlog = () => {
  const { username } = useParams<{ username: string }>();

  // Helper to decode HTML entities in titles
  const decodeHtmlEntities = (text: string): string => {
    if (!text) return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Fetch user profile by either blog_name or username
  const { data: profile } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      // First try to find by blog_name
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("blog_name", username)
        .maybeSingle();

      // If not found by blog_name, try by username
      if (!data && !error) {
        const result = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data;
    },
  });

  // Fetch published blog posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ["user-blog-posts", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("user_id", profile.id)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const featuredPost = posts?.[0];
  const otherPosts = posts?.slice(1) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <Link to={`/${username}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || username}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {profile.full_name || username}'s Blog
              </h1>
              {profile.bio && (
                <p className="text-muted-foreground mt-2">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No blog posts yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Post */}
            {featuredPost && (
              <Link to={`/blog/${featuredPost.slug}`} target="_blank">
                <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
                  <div className="grid md:grid-cols-2 gap-6">
                    {featuredPost.featured_image_url && (
                      <div className="relative h-80 md:h-full overflow-hidden">
                        <img
                          src={featuredPost.featured_image_url}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className={`p-8 flex flex-col justify-center ${!featuredPost.featured_image_url ? 'md:col-span-2' : ''}`}>
                      <div className="flex items-center gap-2 mb-4">
                        {featuredPost.is_ai_generated && (
                          <Badge variant="secondary" className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Generated
                          </Badge>
                        )}
                        <Badge variant="outline">Featured</Badge>
                      </div>
                      <h2 className="text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                        {decodeHtmlEntities(featuredPost.title)}
                      </h2>
                      {featuredPost.excerpt && (
                        <p className="text-muted-foreground text-lg mb-4 line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {featuredPost.published_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(featuredPost.published_at), "MMM d, yyyy")}
                          </div>
                        )}
                        {featuredPost.views_count !== null && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {featuredPost.views_count} views
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            )}

            {/* Other Posts List */}
            <div className="grid gap-6">
              {otherPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} target="_blank">
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
                    <div className="grid md:grid-cols-4 gap-6">
                      {post.featured_image_url && (
                        <div className="relative h-48 md:h-full overflow-hidden">
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className={`p-6 flex flex-col justify-center ${post.featured_image_url ? 'md:col-span-3' : 'md:col-span-4'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          {post.is_ai_generated && (
                            <Badge variant="secondary" className="gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {decodeHtmlEntities(post.title)}
                        </h3>
                        {post.excerpt && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {post.published_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(post.published_at), "MMM d, yyyy")}
                            </div>
                          )}
                          {post.views_count !== null && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {post.views_count} views
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBlog;
