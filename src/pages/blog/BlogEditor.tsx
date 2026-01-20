import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, Shield, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function BlogEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [certifyOnPublish, setCertifyOnPublish] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchBlogPost();
    }
  }, [id]);

  const fetchBlogPost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, transcripts(raw_text)')
        .eq('id', id)
        .single();

      if (error) throw error;

      setTitle(data.title || '');
      setSlug(data.slug || '');
      setExcerpt(data.excerpt || '');
      setContent(data.content || '');
      
      if (data.transcripts) {
        setTranscriptText(data.transcripts.raw_text);
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast({
        title: "Error loading blog post",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
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
    if (!id || id === 'new') {
      setSlug(normalizeSlug(newTitle));
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast({
        title: "Validation error",
        description: "Title, slug, and content are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const blogData = {
        title,
        slug: normalizeSlug(slug),
        excerpt,
        content,
        transcript_id: transcriptId,
        source_type: transcriptId ? 'transcript' : 'manual',
        status: publish ? 'published' : 'draft',
        published_at: publish ? new Date().toISOString() : null,
        user_id: user.id,
      };

      let savedId = id;

      if (!id || id === 'new') {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(blogData)
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

      toast({
        title: publish ? "Blog post published" : "Blog post saved",
        description: `Your blog post has been ${publish ? 'published' : 'saved as draft'}.`,
      });

      // Auto-certify if enabled and publishing
      if (publish && certifyOnPublish && savedId) {
        try {
          await supabase.functions.invoke('mint-content-credential', {
            body: {
              content_type: 'blog_post',
              blog_post_id: savedId,
            },
          });
          toast({
            title: "Content certified",
            description: "Your blog post has been certified on-chain.",
          });
        } catch (certError) {
          console.error('Certification error:', certError);
          // Don't fail the publish if certification fails
        }
      }

      if (savedId !== id) {
        navigate(`/blog/${savedId}/edit`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      toast({
        title: "Error saving blog post",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const insertTranscriptText = () => {
    if (transcriptText) {
      setContent(prev => prev + '\n\n' + transcriptText);
      toast({
        title: "Transcript inserted",
        description: "The transcript has been added to your blog content.",
      });
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
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {id && id !== 'new' ? 'Edit Blog Post' : 'New Blog Post'}
          </h1>
          {transcriptId && (
            <Badge variant="secondary" className="mt-2">
              <FileText className="mr-2 h-3 w-3" />
              Based on transcript
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/blog')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Eye className="mr-2 h-4 w-4" />
            Publish
          </Button>
          {id && id !== 'new' && (
            <Button variant="outline" onClick={() => navigate(`/blog/${id}/certify`)}>
              <Shield className="mr-2 h-4 w-4" />
              Certify
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blog Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter blog post title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(normalizeSlug(e.target.value))}
                  placeholder="url-friendly-slug"
                />
                <p className="text-xs text-muted-foreground">
                  The URL will be: /blog/{slug || 'your-slug'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Short description of your blog post"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your blog post content here..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {transcriptText && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Source Transcript</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 overflow-y-auto text-sm text-muted-foreground bg-muted p-3 rounded">
                  {transcriptText}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={insertTranscriptText}
                  className="w-full"
                >
                  Insert Transcript
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Certification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="certify-on-publish"
                  checked={certifyOnPublish}
                  onChange={(e) => setCertifyOnPublish(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <label
                    htmlFor="certify-on-publish"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Certify on publish
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mint a verifiable content credential so others can verify this blog was authored by you
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                Publish Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
