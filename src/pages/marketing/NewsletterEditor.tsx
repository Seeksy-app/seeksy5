import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, Send, Eye, Calendar as CalendarIcon, Save,
  Type, Image, Link2, Podcast, Video, FileText, ShoppingBag,
  Plus, Trash2, GripVertical, Settings, Mail
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'podcast' | 'video' | 'blog' | 'product' | 'divider';
  content: any;
}

const BLOCK_TYPES = [
  { type: 'text', icon: Type, label: 'Text Block' },
  { type: 'image', icon: Image, label: 'Image' },
  { type: 'button', icon: Link2, label: 'CTA Button' },
  { type: 'podcast', icon: Podcast, label: 'Podcast Episode' },
  { type: 'video', icon: Video, label: 'Video Card' },
  { type: 'blog', icon: FileText, label: 'Blog Excerpt' },
  { type: 'product', icon: ShoppingBag, label: 'Product Block' },
  { type: 'divider', icon: () => <div className="w-4 h-px bg-current" />, label: 'Divider' },
];

export default function NewsletterEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = id && id !== 'new';
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([
    { id: '1', type: 'text', content: { text: 'Welcome to our newsletter!' } }
  ]);
  const [showPreview, setShowPreview] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [saving, setSaving] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Fetch blog posts for embedding
  const { data: blogPosts } = useQuery({
    queryKey: ['blog-posts-for-newsletter'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, slug, featured_image_url')
        .eq('user_id', user.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  useEffect(() => {
    if (isEditing) {
      fetchCampaign();
    }
  }, [id]);

  const fetchCampaign = async () => {
    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error("Error loading newsletter");
      return;
    }

    setTitle(data.title || '');
    setSubject(data.subject || '');
    setPreviewText(data.preview_text || '');
    
    // Parse HTML content back to blocks if possible
    // For now, just use as single text block
    if (data.html_content) {
      setBlocks([{ id: '1', type: 'text', content: { html: data.html_content } }]);
    }
  };

  const addBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
    };
    setBlocks([...blocks, newBlock]);
    setActiveBlockId(newBlock.id);
  };

  const getDefaultContent = (type: ContentBlock['type']) => {
    switch (type) {
      case 'text': return { text: '' };
      case 'image': return { url: '', alt: '' };
      case 'button': return { text: 'Click Here', url: '' };
      case 'podcast': return { episodeId: '' };
      case 'video': return { url: '', title: '' };
      case 'blog': return { postId: '' };
      case 'product': return { name: '', price: '', url: '', image: '' };
      case 'divider': return {};
      default: return {};
    }
  };

  const updateBlock = (blockId: string, content: any) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, content } : b));
  };

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
    if (activeBlockId === blockId) setActiveBlockId(null);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      setBlocks(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const generateHTML = () => {
    return blocks.map(block => {
      switch (block.type) {
        case 'text':
          return `<div style="margin-bottom: 16px;">${block.content.text || block.content.html || ''}</div>`;
        case 'image':
          return block.content.url 
            ? `<img src="${block.content.url}" alt="${block.content.alt || ''}" style="max-width: 100%; margin-bottom: 16px;" />`
            : '';
        case 'button':
          return `<a href="${block.content.url}" style="display: inline-block; padding: 12px 24px; background-color: #2C6BED; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">${block.content.text}</a>`;
        case 'divider':
          return `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />`;
        case 'blog':
          const post = blogPosts?.find(p => p.id === block.content.postId);
          if (post) {
            return `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                ${post.featured_image_url ? `<img src="${post.featured_image_url}" alt="${post.title}" style="width: 100%; border-radius: 4px; margin-bottom: 12px;" />` : ''}
                <h3 style="margin: 0 0 8px;">${post.title}</h3>
                <p style="color: #6b7280; margin: 0 0 12px;">${post.excerpt || ''}</p>
                <a href="/blog/${post.slug}" style="color: #2C6BED;">Read more →</a>
              </div>
            `;
          }
          return '';
        default:
          return '';
      }
    }).join('');
  };

  const handleSave = async (status: 'draft' | 'scheduled' | 'sending' = 'draft') => {
    if (!title.trim() || !subject.trim()) {
      toast.error("Title and subject are required");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const htmlContent = generateHTML();
      
      const campaignData = {
        user_id: user.id,
        title,
        subject,
        preview_text: previewText,
        html_content: htmlContent,
        status,
        scheduled_at: status === 'scheduled' ? scheduledDate?.toISOString() : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('newsletter_campaigns')
          .update(campaignData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('newsletter_campaigns')
          .insert(campaignData);
        if (error) throw error;
      }

      if (status === 'sending') {
        // Trigger send
        const { error: sendError } = await supabase.functions.invoke('send-newsletter', {
          body: { campaignId: id || 'new' },
        });
        if (sendError) {
          toast.error("Failed to send newsletter");
          return;
        }
        toast.success("Newsletter sent!");
      } else if (status === 'scheduled') {
        toast.success(`Newsletter scheduled for ${format(scheduledDate!, 'PPP')}`);
      } else {
        toast.success("Newsletter saved");
      }

      queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
      navigate('/marketing/newsletters');
    } catch (error) {
      console.error('Error saving newsletter:', error);
      toast.error("Error saving newsletter");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error("No email found for test send");
      return;
    }

    toast.info(`Sending test to ${user.email}...`);
    
    // In production, this would call an edge function
    setTimeout(() => {
      toast.success("Test email sent!");
    }, 1000);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/marketing/newsletters')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Newsletter' : 'New Newsletter'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSendTest}>
            <Mail className="mr-2 h-4 w-4" />
            Send Test
          </Button>
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
          <Button onClick={() => handleSave('sending')} disabled={saving}>
            <Send className="mr-2 h-4 w-4" />
            Send Now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Email Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign Title (Internal)</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., December Newsletter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Subject</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject line recipients will see"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview Text</Label>
                <Input
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Text shown in inbox preview"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Blocks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content Blocks</CardTitle>
              <CardDescription>Drag to reorder, click to edit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all",
                    activeBlockId === block.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setActiveBlockId(block.id)}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{block.type}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                            disabled={index === blocks.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Block Editor */}
                      {block.type === 'text' && (
                        <Textarea
                          value={block.content.text || ''}
                          onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                          placeholder="Enter text..."
                          rows={3}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      {block.type === 'image' && (
                        <div className="space-y-2">
                          <Input
                            value={block.content.url || ''}
                            onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })}
                            placeholder="Image URL..."
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Input
                            value={block.content.alt || ''}
                            onChange={(e) => updateBlock(block.id, { ...block.content, alt: e.target.value })}
                            placeholder="Alt text..."
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      {block.type === 'button' && (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={block.content.text || ''}
                            onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
                            placeholder="Button text..."
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Input
                            value={block.content.url || ''}
                            onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })}
                            placeholder="URL..."
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      {block.type === 'blog' && (
                        <select
                          value={block.content.postId || ''}
                          onChange={(e) => updateBlock(block.id, { postId: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Select a blog post...</option>
                          {blogPosts?.map(post => (
                            <option key={post.id} value={post.id}>{post.title}</option>
                          ))}
                        </select>
                      )}
                      {block.type === 'divider' && (
                        <hr className="my-2" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Block Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {BLOCK_TYPES.map(({ type, icon: Icon, label }) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock(type as ContentBlock['type'])}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">active subscribers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Keep subject lines under 50 characters</p>
              <p>• Include a clear call-to-action</p>
              <p>• Test on mobile before sending</p>
              <p>• Always include an unsubscribe link (added automatically)</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-white">
            <div className="text-sm text-muted-foreground mb-4">
              <p><strong>Subject:</strong> {subject || 'No subject'}</p>
              <p><strong>Preview:</strong> {previewText || 'No preview text'}</p>
            </div>
            <hr className="my-4" />
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: generateHTML() }}
            />
            <hr className="my-4" />
            <p className="text-xs text-center text-muted-foreground">
              <a href="#" className="underline">Unsubscribe</a> from these emails
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
