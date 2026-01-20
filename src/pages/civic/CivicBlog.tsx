import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function CivicBlog() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");

  const { data: articles, isLoading } = useQuery({
    queryKey: ["civic-articles", filter],
    queryFn: async () => {
      let query = supabase
        .from("civic_articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "draft":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Civic Blog & Articles</h1>
          <p className="text-muted-foreground">Share updates and information with your constituents</p>
        </div>
        <Button onClick={() => navigate("/civic/blog/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Article
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Articles
        </Button>
        <Button
          variant={filter === "published" ? "default" : "outline"}
          onClick={() => setFilter("published")}
        >
          Published
        </Button>
        <Button
          variant={filter === "draft" ? "default" : "outline"}
          onClick={() => setFilter("draft")}
        >
          Drafts
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : articles && articles.length > 0 ? (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/civic/blog/${article.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      <Badge className={getStatusColor(article.status)}>
                        {article.status}
                      </Badge>
                      {article.ai_drafted && (
                        <Badge variant="outline" className="text-xs">
                          AI Assisted
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {article.author && `By ${article.author}`}
                      {article.category && ` • ${article.category}`}
                    </CardDescription>
                  </div>
                  {article.hero_image_url && (
                    <img
                      src={article.hero_image_url}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {article.topics && article.topics.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {article.topics.slice(0, 5).map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(article.created_at), "PPP")}
                  </div>
                  {article.publish_date && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      Published {format(new Date(article.publish_date), "PPP")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first article to share updates with constituents
            </p>
            <Button onClick={() => navigate("/civic/blog/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Article
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
