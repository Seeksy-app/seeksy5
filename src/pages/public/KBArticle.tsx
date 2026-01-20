import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ThumbsUp, ThumbsDown, BookOpen, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

export default function KBArticle() {
  const { categorySlug, articleSlug } = useParams();
  const navigate = useNavigate();

  const { data: article, refetch } = useQuery({
    queryKey: ["kb-article", articleSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kb_articles")
        .select("*, kb_categories(name, slug, description)")
        .eq("slug", articleSlug)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Track view count
  useEffect(() => {
    if (article?.id) {
      supabase
        .from("kb_articles")
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq("id", article.id)
        .then(() => {});
    }
  }, [article?.id]);

  const handleFeedback = async (helpful: boolean) => {
    if (!article?.id) return;
    
    const field = helpful ? "helpful_count" : "not_helpful_count";
    const currentCount = helpful ? article.helpful_count : article.not_helpful_count;
    
    await supabase
      .from("kb_articles")
      .update({ [field]: (currentCount || 0) + 1 })
      .eq("id", article.id);
    
    toast.success("Thank you for your feedback!");
    refetch();
  };

  // Simple markdown to HTML conversion
  const renderContent = (content: string) => {
    return content
      .split("\n")
      .map((line, index) => {
        if (line.startsWith("# ")) {
          return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={index} className="text-2xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith("- **")) {
          const match = line.match(/- \*\*(.+?)\*\*:? ?(.+)?/);
          if (match) {
            return (
              <li key={index} className="ml-4 mb-2">
                <strong>{match[1]}</strong>{match[2] ? `: ${match[2]}` : ""}
              </li>
            );
          }
        }
        if (line.startsWith("- ")) {
          return <li key={index} className="ml-4 mb-1">{line.slice(2)}</li>;
        }
        if (line.match(/^\d+\. /)) {
          return <li key={index} className="ml-4 mb-1 list-decimal">{line.replace(/^\d+\. /, "")}</li>;
        }
        if (line.trim() === "") {
          return <br key={index} />;
        }
        return <p key={index} className="mb-2 text-muted-foreground">{line}</p>;
      });
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Article not found</h2>
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
      <div className="bg-gradient-to-b from-muted to-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <button onClick={() => navigate("/kb")} className="hover:text-foreground">
              Knowledge Base
            </button>
            <span>/</span>
            <button 
              onClick={() => navigate(`/kb/${categorySlug}`)}
              className="hover:text-foreground"
            >
              {article.kb_categories?.name}
            </button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{article.title}</h1>
          <div className="flex items-center gap-4 mt-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.view_count || 0} views
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.ceil((article.content?.length || 0) / 1000)} min read
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(`/kb/${categorySlug}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {article.kb_categories?.name}
          </Button>

          <Card>
            <CardContent className="p-8">
              <article className="prose prose-slate dark:prose-invert max-w-none">
                {renderContent(article.content || "")}
              </article>
            </CardContent>
          </Card>

          {/* Feedback Section */}
          <Separator className="my-8" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Was this article helpful?</h3>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => handleFeedback(true)}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                Yes ({article.helpful_count || 0})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleFeedback(false)}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                No ({article.not_helpful_count || 0})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
