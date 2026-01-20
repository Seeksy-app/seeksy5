import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Save, Eye, Shield, FileText, Image, Calendar as CalendarIcon,
  ArrowLeft, Bold, Italic, Link2, List, ListOrdered, Heading1, Heading2,
  Quote, Code, ImagePlus, Video, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Search, Tag, Globe, Clock, Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BlogImageUpload } from "@/components/BlogImageUpload";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export default function BlogEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  
  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [certifyOnPublish, setCertifyOnPublish] = useState(false);
  const [author, setAuthor] = useState('');
  
  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchBlogPost();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBlogPost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setTitle(data.title || '');
      setSlug(data.slug || '');
      setExcerpt(data.excerpt || '');
      setContent(data.content || '');
      setFeaturedImage(data.featured_image_url || null);
      setTags([]);
      setAuthor('');
      setSeoTitle(data.seo_title || '');
      setSeoDescription(data.seo_description || '');
      setSeoKeywords(Array.isArray(data.seo_keywords) ? data.seo_keywords.join(', ') : '');
      setCanonicalUrl('');
      
      // Fetch categories for this post
      const { data: postCategories } = await supabase
        .from('blog_post_categories')
        .select('category_id')
        .eq('post_id', id);
      
      if (postCategories) {
        setSelectedCategories(postCategories.map(pc => pc.category_id));
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast.error("Error loading blog post");
    } finally {
      setLoading(false);
    }
  };

  const normalizeSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isEditing) {
      setSlug(normalizeSlug(newTitle));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleSave = async (status: 'draft' | 'published' | 'scheduled' = 'draft') => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }

    if (status === 'scheduled' && !scheduledDate) {
      toast.error("Please select a scheduled date");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const readTime = Math.ceil((content?.length || 0) / 1000);

      const blogData = {
        title,
        slug: normalizeSlug(slug),
        excerpt,
        content,
        featured_image_url: featuredImage,
        seo_title: seoTitle || title,
        seo_description: seoDescription || excerpt,
        seo_keywords: seoKeywords ? seoKeywords.split(',').map(k => k.trim()) : [],
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        user_id: user.id,
      };

      let savedId = id;

      if (!isEditing) {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert([blogData])
          .select()
          .single();

        if (error) throw error;
        savedId = data.id;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .update(blogData)
          .eq('id', id);

        if (error) throw error;
      }

      // Update categories
      if (savedId) {
        await supabase.from('blog_post_categories').delete().eq('post_id', savedId);
        if (selectedCategories.length > 0) {
          await supabase.from('blog_post_categories').insert(
            selectedCategories.map(catId => ({ post_id: savedId, category_id: catId }))
          );
        }
      }

      // Auto-certify if enabled and publishing
      if (status === 'published' && certifyOnPublish && savedId) {
        try {
          await supabase.functions.invoke('mint-content-credential', {
            body: { content_type: 'blog_post', blog_post_id: savedId },
          });
          toast.success("Content certified on-chain");
        } catch (certError) {
          console.error('Certification error:', certError);
        }
      }

      const statusMessages = {
        draft: "Blog post saved as draft",
        published: "Blog post published!",
        scheduled: `Blog post scheduled for ${format(scheduledDate!, 'PPP')}`,
      };

      toast.success(statusMessages[status]);

      if (savedId !== id) {
        navigate(`/marketing/blog/${savedId}/edit`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast.error("Error saving blog post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/marketing/blog')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Blog Post' : 'New Blog Post'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Popover open={showScheduler} onOpenChange={setShowScheduler}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={(date) => {
                  setScheduledDate(date);
                  if (date) {
                    handleSave('scheduled');
                    setShowScheduler(false);
                  }
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => handleSave('published')} disabled={saving}>
            <Globe className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter blog post title..."
                  className="text-lg font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(normalizeSlug(e.target.value))}
                    placeholder="url-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description of your post..."
                  rows={3}
                />
              </div>

              {/* Rich Text Toolbar */}
              <div className="border rounded-lg">
                <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
                  <Button variant="ghost" size="sm" onClick={() => insertFormatting('**', '**')} title="Bold">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertFormatting('*', '*')} title="Italic">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertFormatting('[', '](url)')} title="Link">
                    <Link2 className="h-4 w-4" />
                  </Button>
                  <div className="w-px bg-border mx-1" />
                  <Button variant="ghost" size="sm" onClick={() => insertFormatting('# ')} title="Heading 1">
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertFormatting('## ')} title="Heading 2">
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <div className="w-px bg-border mx-1" />
                  <Button variant="ghost" size="sm" onClick={() => insertFormatting('- ')} title="Bullet List">
                    <List className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertFormatting('1. ')} title="Numbered List">
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertFormatting('> ')} title="Quote">
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => insertFormatting('```\n', '\n```')} title="Code Block">
                    <Code className="h-4 w-4" />
                  </Button>
                  <div className="w-px bg-border mx-1" />
                  <Button variant="ghost" size="sm" onClick={() => insertFormatting('![Image](', ')')} title="Image">
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  ref={contentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your blog post content here... (Markdown supported)"
                  className="min-h-[400px] border-0 focus-visible:ring-0 resize-none font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <BlogImageUpload
                value={featuredImage}
                onChange={setFeaturedImage}
              />
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button variant="outline" size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(c => c !== category.id));
                      }
                    }}
                    className="rounded border-border"
                  />
                  <span className="text-sm">{category.name}</span>
                </label>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">No categories yet</p>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                SEO Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">SEO Title</Label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || "SEO title..."}
                />
                <p className="text-xs text-muted-foreground">{seoTitle.length}/60 chars</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Meta Description</Label>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder={excerpt || "Meta description..."}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">{seoDescription.length}/160 chars</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Keywords</Label>
                <Input
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="keyword1, keyword2..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Author & Certification */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Author & Certification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Author Name</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name..."
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Certify on Publish</Label>
                  <p className="text-xs text-muted-foreground">Mint on-chain credential</p>
                </div>
                <Switch
                  checked={certifyOnPublish}
                  onCheckedChange={setCertifyOnPublish}
                />
              </div>
            </CardContent>
          </Card>

          {/* Read Time */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~{Math.ceil((content?.length || 0) / 1000)} min read</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <div className="prose dark:prose-invert max-w-none">
            {featuredImage && (
              <img src={featuredImage} alt={title} className="w-full rounded-lg mb-6" />
            )}
            <h1>{title || 'Untitled'}</h1>
            {excerpt && <p className="lead">{excerpt}</p>}
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
