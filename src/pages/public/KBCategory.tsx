import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, BookOpen, FileText } from "lucide-react";

export default function KBCategory() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  const { data: category } = useQuery({
    queryKey: ["kb-category", categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kb_categories")
        .select("*")
        .eq("slug", categorySlug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["kb-category-articles", categorySlug],
    queryFn: async () => {
      if (!category?.id) return [];
      const { data, error } = await supabase
        .from("kb_articles")
        .select("*")
        .eq("category_id", category.id)
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("view_count", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Category not found</h2>
          <Button variant="outline" onClick={() => navigate("/kb")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-muted to-background py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-muted mb-4"
            onClick={() => navigate("/kb")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
              <p className="text-muted-foreground mt-1">{category.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">{articles.length} articles</span>
        </div>

        <div className="grid gap-4">
          {articles.map((article: any) => (
            <Card 
              key={article.id}
              className="cursor-pointer hover:border-[hsl(220,85%,55%)] hover:shadow-md transition-all group"
              onClick={() => navigate(`/kb/${categorySlug}/${article.slug}`)}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {article.is_featured && (
                      <Badge className="bg-[hsl(220,85%,55%)]">Featured</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg group-hover:text-[hsl(220,85%,55%)] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{article.excerpt}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[hsl(220,85%,55%)] group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground">Check back soon for new content</p>
          </div>
        )}
      </div>
    </div>
  );
}
