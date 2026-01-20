import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, ArrowLeft, Sparkles } from "lucide-react";

export default function CreateCivicArticle() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    author: "",
    category: "",
    content: "",
    hero_image_url: "",
    topics: [] as string[],
    status: "draft",
  });

  const [topicInput, setTopicInput] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const generateAIDraftMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingAI(true);
      const { data, error } = await supabase.functions.invoke("generate-civic-article-draft", {
        body: {
          title: formData.title,
          category: formData.category,
          topics: formData.topics,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setFormData({ ...formData, content: data.content });
      toast.success("AI draft generated", {
        description: "Review and edit the content before publishing.",
      });
      setIsGeneratingAI(false);
    },
    onError: () => {
      toast.error("Failed to generate AI draft");
      setIsGeneratingAI(false);
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: article, error } = await supabase
        .from("civic_articles")
        .insert([{
          ...data,
          user_id: user.id,
          ai_drafted: isGeneratingAI,
          publish_date: data.status === "published" ? new Date().toISOString() : null,
        }])
        .select()
        .single();

      if (error) throw error;
      return article;
    },
    onSuccess: (article) => {
      toast.success(
        article.status === "published" ? "Article published successfully" : "Draft saved successfully"
      );
      navigate("/civic/blog");
    },
    onError: () => {
      toast.error("Failed to save article");
    },
  });

  const handleAddTopic = () => {
    if (topicInput.trim() && !formData.topics.includes(topicInput.trim())) {
      setFormData({ ...formData, topics: [...formData.topics, topicInput.trim()] });
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setFormData({ ...formData, topics: formData.topics.filter(t => t !== topic) });
  };

  const handleSubmit = (e: React.FormEvent, status: "draft" | "published") => {
    e.preventDefault();
    createArticleMutation.mutate({ ...formData, status });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/civic/blog")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Blog
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Create Article</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Share updates and information with your constituents. AI can help draft content that is
            strictly informational and non-persuasive.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Article Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setFormData({
                    ...formData,
                    title,
                    slug: generateSlug(title),
                  });
                }}
                required
                placeholder="e.g., Infrastructure Improvements in District 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                placeholder="infrastructure-improvements-district-5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g., Representative Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Community Updates"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_image_url">Hero Image URL</Label>
              <Input
                id="hero_image_url"
                value={formData.hero_image_url}
                onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Topics / Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                  placeholder="Add topic and press Enter"
                />
                <Button type="button" onClick={handleAddTopic} variant="outline">
                  Add
                </Button>
              </div>
              {formData.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.topics.map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(topic)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {formData.title && formData.category && (
              <div className="border-t pt-4">
                <Button
                  type="button"
                  onClick={() => generateAIDraftMutation.mutate()}
                  disabled={isGeneratingAI || !formData.title}
                  variant="outline"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingAI ? "Generating AI Draft..." : "Generate AI Draft"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  AI will generate a strictly informational, non-persuasive draft based on your title and topics.
                  You can review and edit before publishing.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="content">Article Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                placeholder="Write your article content here..."
                rows={16}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/civic/blog")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={(e) => handleSubmit(e, "draft")}
                disabled={createArticleMutation.isPending}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, "published")}
                disabled={createArticleMutation.isPending}
              >
                Publish Article
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
