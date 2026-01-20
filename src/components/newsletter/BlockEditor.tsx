import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { NewsletterBlock, BlockContent, BLOCK_DEFINITIONS } from "./types";

interface BlockEditorProps {
  block: NewsletterBlock | null;
  onUpdate: (block: NewsletterBlock) => void;
  onClose: () => void;
}

export function BlockEditor({ block, onUpdate, onClose }: BlockEditorProps) {
  const [content, setContent] = useState<BlockContent>({});

  useEffect(() => {
    if (block) {
      setContent(block.content);
    }
  }, [block]);

  if (!block) return null;

  const handleChange = (key: keyof BlockContent, value: any) => {
    const newContent = { ...content, [key]: value };
    setContent(newContent);
    onUpdate({ ...block, content: newContent });
  };

  const { label } = BLOCK_DEFINITIONS[block.type];

  const renderEditor = () => {
    switch (block.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <Textarea
                value={content.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Enter your text..."
                className="min-h-[120px] mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Alignment</Label>
                <Select
                  value={content.textAlign || 'left'}
                  onValueChange={(v) => handleChange('textAlign', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Font Size</Label>
                <Select
                  value={content.fontSize || 'base'}
                  onValueChange={(v) => handleChange('fontSize', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="base">Normal</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                    <SelectItem value="2xl">Heading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label>Image URL</Label>
              <Input
                value={content.imageUrl || ''}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Alt Text</Label>
              <Input
                value={content.imageAlt || ''}
                onChange={(e) => handleChange('imageAlt', e.target.value)}
                placeholder="Describe the image..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Link URL (optional)</Label>
              <Input
                value={content.imageLink || ''}
                onChange={(e) => handleChange('imageLink', e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <Label>Button Text</Label>
              <Input
                value={content.buttonText || ''}
                onChange={(e) => handleChange('buttonText', e.target.value)}
                placeholder="Click Here"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Link URL</Label>
              <Input
                value={content.buttonUrl || ''}
                onChange={(e) => handleChange('buttonUrl', e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Style</Label>
                <Select
                  value={content.buttonStyle || 'primary'}
                  onValueChange={(v) => handleChange('buttonStyle', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alignment</Label>
                <Select
                  value={content.buttonAlign || 'center'}
                  onValueChange={(v) => handleChange('buttonAlign', v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'blog-excerpt':
        return (
          <div className="space-y-4">
            <div>
              <Label>Blog Post Title</Label>
              <Input
                value={content.blogPostTitle || ''}
                onChange={(e) => handleChange('blogPostTitle', e.target.value)}
                placeholder="Enter title..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Textarea
                value={content.blogPostExcerpt || ''}
                onChange={(e) => handleChange('blogPostExcerpt', e.target.value)}
                placeholder="Blog post excerpt..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={content.blogPostImage || ''}
                onChange={(e) => handleChange('blogPostImage', e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={content.showReadMore !== false}
                onCheckedChange={(v) => handleChange('showReadMore', v)}
              />
              <Label>Show "Read More" link</Label>
            </div>
          </div>
        );

      case 'product-card':
        return (
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input
                value={content.productName || ''}
                onChange={(e) => handleChange('productName', e.target.value)}
                placeholder="Product name..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={content.productDescription || ''}
                onChange={(e) => handleChange('productDescription', e.target.value)}
                placeholder="Product description..."
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price</Label>
                <Input
                  value={content.productPrice || ''}
                  onChange={(e) => handleChange('productPrice', e.target.value)}
                  placeholder="$29.99"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={content.productImage || ''}
                  onChange={(e) => handleChange('productImage', e.target.value)}
                  placeholder="https://..."
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Product URL</Label>
              <Input
                value={content.productUrl || ''}
                onChange={(e) => handleChange('productUrl', e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
          </div>
        );

      case 'poll':
        return (
          <div className="space-y-4">
            <div>
              <Label>Question</Label>
              <Input
                value={content.pollQuestion || ''}
                onChange={(e) => handleChange('pollQuestion', e.target.value)}
                placeholder="What do you think about...?"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Options (one per line)</Label>
              <Textarea
                value={(content.pollOptions || []).join('\n')}
                onChange={(e) => handleChange('pollOptions', e.target.value.split('\n').filter(Boolean))}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                className="mt-1.5"
              />
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="space-y-4">
            <div>
              <Label>Label</Label>
              <Input
                value={content.countdownLabel || ''}
                onChange={(e) => handleChange('countdownLabel', e.target.value)}
                placeholder="Countdown to..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>End Date & Time</Label>
              <Input
                type="datetime-local"
                value={content.countdownDate || ''}
                onChange={(e) => handleChange('countdownDate', e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        );

      case 'ad-marker':
        return (
          <div className="space-y-4">
            <div>
              <Label>Ad Type</Label>
              <Select
                value={content.adType || 'cpm'}
                onValueChange={(v) => handleChange('adType', v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpm">CPM (Cost Per Mille)</SelectItem>
                  <SelectItem value="cpc">CPC (Cost Per Click)</SelectItem>
                  <SelectItem value="flat_rate">Flat Rate Sponsorship</SelectItem>
                  <SelectItem value="hybrid">Hybrid (CPM + CPC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Label (optional)</Label>
              <Input
                value={content.adLabel || ''}
                onChange={(e) => handleChange('adLabel', e.target.value)}
                placeholder="Sponsored content"
                className="mt-1.5"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ads will be automatically filled based on your advertiser partnerships when you publish.
            </p>
          </div>
        );

      case 'social-embed':
        return (
          <div className="space-y-4">
            <div>
              <Label>Platform</Label>
              <Select
                value={content.platform || 'twitter'}
                onValueChange={(v) => handleChange('platform', v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Embed URL</Label>
              <Input
                value={content.embedUrl || ''}
                onChange={(e) => handleChange('embedUrl', e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
          </div>
        );

      case 'divider':
        return (
          <p className="text-sm text-muted-foreground">
            A horizontal line will be displayed to separate content sections.
          </p>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Edit {label}</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>{renderEditor()}</CardContent>
    </Card>
  );
}
