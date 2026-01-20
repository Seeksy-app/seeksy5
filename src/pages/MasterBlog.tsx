import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { NewsletterSignupForm } from "@/components/NewsletterSignupForm";

const MasterBlog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["master-blog-posts", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("status", "published")
        .eq("publish_to_master", true)
        .order("master_published_at", { ascending: false })
        .limit(20);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Manually fetch profiles since the query might fail with the join
      const postsWithProfiles = await Promise.all(
        (data || []).map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", post.user_id)
            .single();
          
          return { ...post, profile };
        })
      );

      return postsWithProfiles;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-bold mb-2">Seeksy Master Blog</h1>
                <p className="text-muted-foreground">Discover stories from creators across the platform</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="mb-8 flex justify-center">
            <NewsletterSignupForm />
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading articles...</div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-8">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <div className="grid md:grid-cols-3 gap-6">
                    {post.featured_image_url && (
                      <div className="md:col-span-1 aspect-video md:aspect-square overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className={post.featured_image_url ? "md:col-span-2" : "md:col-span-3"}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.profile?.avatar_url} />
                            <AvatarFallback>
                              {post.profile?.full_name?.[0] || post.profile?.username?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {post.profile?.full_name || post.profile?.username}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(post.master_published_at), "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.views_count} views
                              </span>
                            </div>
                          </div>
                          {post.is_ai_generated && (
                            <Badge variant="secondary" className="text-xs">
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-2xl mb-2">{post.title}</CardTitle>
                        {post.excerpt && (
                          <CardDescription className="text-base line-clamp-3">
                            {post.excerpt}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? "No articles found matching your search" : "No articles published yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterBlog;
