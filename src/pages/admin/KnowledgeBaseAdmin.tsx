import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  FileText, 
  Eye, 
  ThumbsUp,
  ExternalLink,
  Search
} from "lucide-react";
import { toast } from "sonner";

export default function KnowledgeBaseAdmin() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-kb-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kb_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["admin-kb-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kb_articles")
        .select("*, kb_categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveArticle = useMutation({
    mutationFn: async (article: any) => {
      if (article.id) {
        const { error } = await supabase
          .from("kb_articles")
          .update({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content,
            category_id: article.category_id,
            is_published: article.is_published,
            is_featured: article.is_featured,
            updated_at: new Date().toISOString(),
          })
          .eq("id", article.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("kb_articles")
          .insert({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content,
            category_id: article.category_id,
            is_published: article.is_published,
            is_featured: article.is_featured,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-kb-articles"] });
      setIsArticleDialogOpen(false);
      setEditingArticle(null);
      toast.success("Article saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save article: " + error.message);
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kb_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-kb-articles"] });
      toast.success("Article deleted");
    },
  });

  const filteredArticles = articles.filter((article: any) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalArticles: articles.length,
    publishedArticles: articles.filter((a: any) => a.is_published).length,
    totalViews: articles.reduce((sum: number, a: any) => sum + (a.view_count || 0), 0),
    helpfulVotes: articles.reduce((sum: number, a: any) => sum + (a.helpful_count || 0), 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-[hsl(220,85%,55%)]" />
            <div>
              <h1 className="text-2xl font-bold">Knowledge Base</h1>
              <p className="text-muted-foreground">Manage help articles and documentation</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open("/kb", "_blank")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public KB
            </Button>
            <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingArticle({})}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingArticle?.id ? "Edit Article" : "New Article"}</DialogTitle>
                </DialogHeader>
                <ArticleForm
                  article={editingArticle}
                  categories={categories}
                  onSave={(data: any) => saveArticle.mutate(data)}
                  onCancel={() => {
                    setIsArticleDialogOpen(false);
                    setEditingArticle(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalArticles}</div>
              <p className="text-sm text-muted-foreground">Total Articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.publishedArticles}</div>
              <p className="text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.helpfulVotes}</div>
              <p className="text-sm text-muted-foreground">Helpful Votes</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="articles">
          <TabsList>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Articles Table */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredArticles.map((article: any) => (
                    <div key={article.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{article.title}</h3>
                          {article.is_featured && <Badge className="bg-yellow-500">Featured</Badge>}
                          {!article.is_published && <Badge variant="secondary">Draft</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{article.kb_categories?.name || "Uncategorized"}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {article.view_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" /> {article.helpful_count || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingArticle(article);
                            setIsArticleDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this article?")) {
                              deleteArticle.mutate(article.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category: any) => (
                <Card key={category.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {articles.filter((a: any) => a.category_id === category.id).length} articles
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ArticleForm({ article, categories, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    id: article?.id || null,
    title: article?.title || "",
    slug: article?.slug || "",
    excerpt: article?.excerpt || "",
    content: article?.content || "",
    category_id: article?.category_id || "",
    is_published: article?.is_published || false,
    is_featured: article?.is_featured || false,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => {
              setFormData({
                ...formData,
                title: e.target.value,
                slug: formData.slug || generateSlug(e.target.value),
              });
            }}
            placeholder="Article title"
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="article-slug"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Excerpt</Label>
        <Input
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="Brief description of the article"
        />
      </div>

      <div className="space-y-2">
        <Label>Content (Markdown)</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="# Article Title&#10;&#10;Write your content here using markdown..."
          rows={15}
          className="font-mono text-sm"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_published}
            onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
          />
          <Label>Published</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_featured}
            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
          />
          <Label>Featured</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Save Article</Button>
      </div>
    </div>
  );
}
