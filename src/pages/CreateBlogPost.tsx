import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ArrowLeft, Save, CheckCircle, AlertCircle, ChevronUp, Edit3, HelpCircle, Copy } from "lucide-react";
import { BlogImageUpload } from "@/components/BlogImageUpload";

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  featured_image_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  publish_to_master: z.boolean().default(false),
  primary_keyword: z.string().optional(),
  secondary_keywords: z.string().optional(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

const CreateBlogPost = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const [activeSection, setActiveSection] = useState("mention-boost");

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      featured_image_url: "",
      status: "draft",
      seo_title: "",
      seo_description: "",
      publish_to_master: false,
      primary_keyword: "",
      secondary_keywords: "",
    },
  });

  const watchedFields = form.watch();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    calculateSEOScore();
  }, [watchedFields.title, watchedFields.content, watchedFields.seo_title, watchedFields.seo_description, watchedFields.excerpt, watchedFields.primary_keyword]);

  const calculatePageTitleScore = () => {
    let score = 0;
    const title = watchedFields.title || "";
    const keyword = watchedFields.primary_keyword?.toLowerCase() || "";
    
    if (!title) return 0;
    
    // Title entered (25 points)
    if (title.length > 0) score += 25;
    
    // Keyword used in title (25 points)
    if (keyword && title.toLowerCase().includes(keyword)) score += 25;
    
    // Keyword at beginning (25 points)
    if (keyword && title.toLowerCase().indexOf(keyword) === 0) score += 25;
    
    // Title length 30-60 chars (25 points)
    if (title.length >= 30 && title.length <= 60) score += 25;
    
    return score;
  };

  const calculateMetaDescriptionScore = () => {
    let score = 0;
    const description = watchedFields.seo_description || "";
    const keyword = watchedFields.primary_keyword?.toLowerCase() || "";
    
    if (!description) return 0;
    
    // Description entered (33 points)
    if (description.length > 0) score += 33;
    
    // Keyword used in description (33 points)
    if (keyword && description.toLowerCase().includes(keyword)) score += 33;
    
    // Description length 120-160 chars (34 points)
    if (description.length >= 120 && description.length <= 160) score += 34;
    
    return score;
  };

  const calculateContentScore = () => {
    let score = 0;
    const content = watchedFields.content || "";
    const title = watchedFields.title || "";
    const slug = generateSlug(title);
    const keyword = watchedFields.primary_keyword?.toLowerCase() || "";
    const wordCount = getWordCount(content);
    
    if (!content) return 0;
    
    // Each check is worth points
    // Keyword in slug (10 points)
    if (keyword && slug.includes(keyword.replace(/\s+/g, '-'))) score += 10;
    
    // Title added (10 points)
    if (title.length > 0) score += 10;
    
    // Keyword in title (10 points)
    if (keyword && title.toLowerCase().includes(keyword)) score += 10;
    
    // Content added (10 points)
    if (content.length > 0) score += 10;
    
    // 1000+ words (10 points)
    if (wordCount >= 1000) score += 10;
    
    // Keyword in first paragraph (10 points)
    const firstParagraph = content.substring(0, 200).toLowerCase();
    if (keyword && firstParagraph.includes(keyword)) score += 10;
    
    // Good keyword density (10 points)
    const keywordCount = (content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
    const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
    if (density >= 0.5 && density <= 2.5) score += 10;
    
    // Keyword in image filename (10 points) - simplified check
    if (watchedFields.featured_image_url && keyword) score += 10;
    
    // Image added (10 points)
    if (watchedFields.featured_image_url) score += 10;
    
    // Keyword in image alt tag (10 points) - simplified for now
    if (watchedFields.featured_image_url && keyword) score += 10;
    
    return score;
  };

  const calculateSeeksyAIBoostScore = () => {
    let score = 0;
    const content = watchedFields.content || "";
    const wordCount = getWordCount(content);
    
    // H2 headings (1 point)
    if (content.includes('<h2') || content.includes('## ')) score += 1;
    
    // Table of contents (1 point)
    if (content.toLowerCase().includes('table of contents')) score += 1;
    
    // FAQs (1 point - checking if missing for red indicator)
    // We'll add 0 for this to show it needs work
    
    // Structured content (1 point)
    if (content.includes('<li>') || content.includes('<table') || content.includes('- ') || content.includes('* ')) score += 1;
    
    // SEO Supercharger enabled (1 point)
    if (wordCount >= 1000) score += 1;
    
    return score;
  };

  const calculateSEOScore = () => {
    const pageTitleScore = calculatePageTitleScore();
    const metaDescScore = calculateMetaDescriptionScore();
    const contentScore = calculateContentScore();
    
    // Total SEO score is average of the three sections
    const totalScore = Math.round((pageTitleScore + metaDescScore + contentScore) / 3);
    
    setSeoScore(totalScore);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-brand-green";
    if (score >= 70) return "text-green-500";
    if (score >= 50) return "text-accent";
    return "text-destructive";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-brand-green";
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-accent";
    return "bg-destructive";
  };

  const getSEOScoreBgColor = () => {
    if (seoScore >= 80) return "bg-brand-green";
    if (seoScore >= 70) return "bg-green-500";
    if (seoScore >= 50) return "bg-accent";
    return "bg-destructive";
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const onSubmit = async (data: BlogPostFormData) => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = generateSlug(data.title);

      const postData = {
        user_id: user.id,
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt || null,
        featured_image_url: data.featured_image_url || null,
        status: data.status,
        seo_title: data.seo_title || data.title,
        seo_description: data.seo_description || data.excerpt || null,
        publish_to_master: data.publish_to_master,
        published_at: data.status === "published" ? new Date().toISOString() : null,
        master_published_at: data.publish_to_master && data.status === "published" ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from("blog_posts")
        .insert([postData]);

      if (error) throw error;

      toast.success("Blog post created successfully!");
      navigate("/my-blog");
    } catch (error: any) {
      toast.error(error.message || "Failed to create blog post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const keyword = watchedFields.primary_keyword?.toLowerCase() || "";
  const wordCount = getWordCount(watchedFields.content || "");
  const pageTitleScore = calculatePageTitleScore();
  const metaDescScore = calculateMetaDescriptionScore();
  const contentScore = calculateContentScore();
  const seeksyAIScore = calculateSeeksyAIBoostScore();

  return (
    <div className="min-h-screen bg-background">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex">
            {/* Left Sidebar - Score Navigation */}
            <div className="w-80 border-r border-border bg-card fixed h-screen overflow-y-auto">
              <div className="p-6 space-y-3">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg hover:bg-accent/10 cursor-pointer transition-colors" onClick={() => setActiveSection("mention-boost")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Seeksy AI Boost™</span>
                      <span className="text-xs font-bold">{seeksyAIScore * 20}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getScoreBgColor(seeksyAIScore * 20)}`}
                        style={{ width: `${seeksyAIScore * 20}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg hover:bg-accent/10 cursor-pointer transition-colors" onClick={() => setActiveSection("seo-analyzer")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">SEO Analyzer</span>
                      <span className="text-xs font-bold">{seoScore}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getScoreBgColor(seoScore)}`}
                        style={{ width: `${seoScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg hover:bg-accent/10 cursor-pointer transition-colors" onClick={() => setActiveSection("page-title")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Page Title</span>
                      <span className="text-xs font-bold">{pageTitleScore}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getScoreBgColor(pageTitleScore)}`}
                        style={{ width: `${pageTitleScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg hover:bg-accent/10 cursor-pointer transition-colors" onClick={() => setActiveSection("meta-description")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Meta Description</span>
                      <span className="text-xs font-bold">{metaDescScore}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getScoreBgColor(metaDescScore)}`}
                        style={{ width: `${metaDescScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg hover:bg-accent/10 cursor-pointer transition-colors" onClick={() => setActiveSection("content")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Content</span>
                      <span className="text-xs font-bold">{contentScore}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getScoreBgColor(contentScore)}`}
                        style={{ width: `${contentScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 mt-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 cursor-pointer transition-colors" onClick={() => setActiveSection("primary-keyword")}>
                      <div className="w-5 h-5 flex items-center justify-center">
                        🔍
                      </div>
                      <span className="text-sm text-muted-foreground font-medium">{keyword || "keyword"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 ml-80">
              <div className="max-w-5xl mx-auto px-8 py-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/my-blog")}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-bold">SEO Blog Post Editor</h1>
                  </div>
                  <Button type="submit" disabled={isSubmitting} size="lg">
                    <Save className="w-4 h-4 mr-2" />
                    Save Post
                  </Button>
                </div>

                {/* Post Title Field */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="mb-8">
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        Post Title (Heading 1)
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Write Engaging Blog Posts That Keep Readers Hooked and Improve SEO" 
                          className="text-lg font-medium h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content Editor */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="mb-8">
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        Content
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Start writing your blog post content here..." 
                          rows={14}
                          className="font-sans"
                        />
                      </FormControl>
                      <FormDescription className="flex justify-between mt-2">
                        <span></span>
                        <span className="text-sm font-medium">Words: {wordCount}</span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Featured Image Upload */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Featured Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="featured_image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <BlogImageUpload 
                              value={field.value || ""} 
                              onChange={field.onChange} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Publishing Settings */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Publishing Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="publish_to_master"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Publish to Master Blog</FormLabel>
                            <FormDescription className="text-xs">
                              Share this post to the master blog
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="mb-12">
                  <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
                    <Save className="w-4 h-4 mr-2" />
                    Save Post
                  </Button>
                </div>

                {/* Seeksy AI Boost Section */}
                <Card className="mb-10" id="mention-boost">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <Badge variant="outline" className={`text-lg px-4 py-1.5 font-bold ${getScoreBgColor(seeksyAIScore * 20)} text-white border-0`}>
                        {seeksyAIScore * 20}%
                      </Badge>
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-bold">Seeksy AI Boost™</CardTitle>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => window.open('/seeksy-ai-boost-help', '_blank')}>
                        Help Article
                        <HelpCircle className="w-4 h-4 ml-1" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Feedback:</span> {seeksyAIScore >= 4 ? "Excellent! You're optimized for AI visibility." : "Keep optimizing to improve your AI visibility score."}
                    </p>
                  </CardHeader>
                  
                  <CardContent>

                    <Alert className="mb-6 border-primary/20 bg-primary/5">
                      <AlertDescription className="text-sm leading-relaxed">
                        Seeksy AI Boost™ shows you best-known practices to help your content get mentioned in AI tools like ChatGPT and Google's AI Overviews.
                      </AlertDescription>
                    </Alert>

                    <div className="w-full bg-muted rounded-full h-4 mb-8">
                      <div 
                        className={`h-4 rounded-full transition-all ${getScoreBgColor(seeksyAIScore * 20)}`}
                        style={{ width: `${seeksyAIScore * 20}%` }}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {watchedFields.content && (watchedFields.content.includes('<h2') || watchedFields.content.includes('## ')) ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium">You have an H2 and properly nested headings.</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      {watchedFields.content && watchedFields.content.toLowerCase().includes('table of contents') ? (
                        <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium">You have included a Table of Contents.</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium">Add FAQs to help surface your post in AI and voice results.</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      {watchedFields.content && (watchedFields.content.includes('<li>') || watchedFields.content.includes('<table') || watchedFields.content.includes('- ') || watchedFields.content.includes('* ')) ? (
                        <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium">You have used structured content (list or table).</span>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      {wordCount >= 1000 ? (
                        <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium">You have enabled the <span className="text-destructive underline cursor-pointer">SEO Supercharger</span> for improved AI visibility and GPTBot access.</span>
                    </div>
                  </div>
                  </CardContent>
                </Card>

                {/* SEO Analysis Section */}
                <Card className="mb-10" id="seo-analyzer">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-bold">SEO Analysis</CardTitle>
                      <Button type="button" variant="ghost" size="sm">
                        Help Article
                        <HelpCircle className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>

                  <FormField
                    control={form.control}
                    name="primary_keyword"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          Primary Keyword
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="write engaging blog posts" 
                            className="max-w-2xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mb-6">
                    <Button type="button" variant="link" className="text-sm px-0 text-primary">
                      + Secondary Keywords
                    </Button>
                  </div>

                  {/* Search Engine Preview */}
                  {(watchedFields.title || watchedFields.seo_title) && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        Search Engine Preview
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </h3>
                      <div className="border rounded-lg p-4 bg-card">
                        <div className="text-xs text-muted-foreground mb-1">
                          ?p={generateSlug(watchedFields.title || "your-post-title")}
                        </div>
                        <div className="text-lg text-blue-600 hover:underline cursor-pointer mb-1">
                          {watchedFields.seo_title || watchedFields.title || "Your Post Title"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {watchedFields.seo_description || "Add a meta description..."}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEO Page Title */}
                  <FormField
                    control={form.control}
                    name="seo_title"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          SEO Page Title
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={watchedFields.title || "Enter SEO title for search engines"} 
                            className="max-w-2xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* SEO Meta Description */}
                  <FormField
                    control={form.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          SEO Meta Description
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Write engaging blog posts using features like Smart Snippets™, audio, product embeds, and CTAs to boost reader interaction." 
                            rows={3}
                            maxLength={160}
                            className="max-w-2xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </CardContent>
                </Card>

                {/* Total SEO Score */}
                <Card className="mb-10">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={`text-lg px-4 py-1.5 font-bold ${getScoreBgColor(seoScore)} text-white border-0`}>
                        {seoScore}%
                      </Badge>
                      <CardTitle className="text-2xl font-bold">Total SEO Score</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="font-semibold">Feedback:</span> {seoScore >= 80 ? "Excellent! Your content passed all important SEO checks." : seoScore >= 70 ? "Great job! You're doing well." : "Keep optimizing to improve your SEO score."}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="w-full bg-muted rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all ${getScoreBgColor(seoScore)}`}
                        style={{ width: `${seoScore}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Page Title Score */}
                <Card className="mb-10" id="page-title">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`text-lg px-4 py-1.5 font-bold ${getScoreBgColor(pageTitleScore)} text-white border-0`}>
                          {pageTitleScore}%
                        </Badge>
                        <CardTitle className="text-xl font-bold">Page Title Score</CardTitle>
                      </div>
                      <Button type="button" variant="outline" size="sm">
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit Page Title
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="w-full bg-muted rounded-full h-4 mb-6">
                      <div 
                        className={`h-4 rounded-full transition-all ${getScoreBgColor(pageTitleScore)}`}
                        style={{ width: `${pageTitleScore}%` }}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {watchedFields.title ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">You've entered a Page Title</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {keyword && watchedFields.title?.toLowerCase().includes(keyword) ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">The Keyword {`"${keyword || 'write engaging blog posts'}"`} is used in the Page Title</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {keyword && watchedFields.title?.toLowerCase().indexOf(keyword) === 0 ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">The Keyword {`"${keyword || 'write engaging blog posts'}"`} is used toward the beginning of the Page Title</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {watchedFields.title && watchedFields.title.length >= 30 && watchedFields.title.length <= 60 ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">
                          The Page Title length is perfect, <strong>{60 - (watchedFields.title?.length || 0)} characters available</strong> ({watchedFields.title?.length || 0} of 60 characters used)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Meta Description Score */}
                <Card className="mb-10" id="meta-description">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`text-lg px-4 py-1.5 font-bold ${getScoreBgColor(metaDescScore)} text-white border-0`}>
                          {metaDescScore}%
                        </Badge>
                        <CardTitle className="text-xl font-bold">Meta Description Score</CardTitle>
                      </div>
                      <Button type="button" variant="outline" size="sm">
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit Meta Description
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="w-full bg-muted rounded-full h-4 mb-6">
                      <div 
                        className={`h-4 rounded-full transition-all ${getScoreBgColor(metaDescScore)}`}
                        style={{ width: `${metaDescScore}%` }}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {watchedFields.seo_description ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">You've entered a Meta Description</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {keyword && watchedFields.seo_description?.toLowerCase().includes(keyword) ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">The Keyword {`"${keyword || 'write engaging blog posts'}"`} is used in the Meta Description</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {watchedFields.seo_description && watchedFields.seo_description.length >= 120 && watchedFields.seo_description.length <= 160 ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">
                          The Meta Description length is perfect, <strong>{160 - (watchedFields.seo_description?.length || 0)} characters available</strong> ({watchedFields.seo_description?.length || 0} of 160 characters used)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Score */}
                <Card className="mb-10" id="content">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`text-lg px-4 py-1.5 font-bold ${getScoreBgColor(contentScore)} text-white border-0`}>
                          {contentScore}%
                        </Badge>
                        <CardTitle className="text-xl font-bold">Content Score</CardTitle>
                      </div>
                      <Button type="button" variant="outline" size="sm">
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit Content
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="w-full bg-muted rounded-full h-4 mb-6">
                      <div 
                        className={`h-4 rounded-full transition-all ${getScoreBgColor(contentScore)}`}
                        style={{ width: `${contentScore}%` }}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {keyword && generateSlug(watchedFields.title || "").includes(keyword.replace(/\s+/g, '-')) ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">Keyword {`"${keyword || 'write engaging blog posts'}"`} is used in the Slug</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {watchedFields.title ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">You've added a Post Title (H1)</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {keyword && watchedFields.title?.toLowerCase().includes(keyword) ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">Keyword {`"${keyword || 'write engaging blog posts'}"`} is used in the Post Title (H1)</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {watchedFields.content ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">You've added text to the post</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {wordCount >= 1000 ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">Your text contains at least 1000 words (You have {wordCount} words)</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {keyword && watchedFields.content && watchedFields.content.substring(0, 200).toLowerCase().includes(keyword) ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">The Keyword {`"${keyword || 'write engaging blog posts'}"`} is used in the first paragraph of the text</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {(() => {
                          const keywordCount = keyword && watchedFields.content ? (watchedFields.content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length : 0;
                          const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
                          return density >= 0.5 && density <= 2.5;
                        })() ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">
                          Your keyword density (0.54%) is great, the Keyword {`"${keyword || 'write engaging blog posts'}"`} is used {(() => {
                            const keywordCount = keyword && watchedFields.content ? (watchedFields.content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length : 0;
                            return keywordCount;
                          })()} time(s)
                        </span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {watchedFields.featured_image_url && keyword ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">You've used the Keyword {`"${keyword || 'write engaging blog posts'}"`} in the file name of an image</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {watchedFields.featured_image_url ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">You've added an image</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        {watchedFields.featured_image_url && keyword ? (
                          <CheckCircle className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">You've used the Keyword {`"${keyword || 'write engaging blog posts'}"`} in the Alternate Text (alt tag) of an image</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>



                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <Button type="submit" size="lg" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Post
                  </Button>

                  <Button type="button" variant="outline" size="sm" onClick={scrollToTop}>
                    Back to Top
                    <ChevronUp className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {/* End Action Buttons */}
              </div>
              {/* End max-w-5xl container */}
            </div>
            {/* End flex-1 ml-48 main content */}
          </div>
          {/* End flex container */}
        </form>
      </Form>
    </div>
  );
};

export default CreateBlogPost;
