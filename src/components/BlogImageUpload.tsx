import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface BlogImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export const BlogImageUpload = ({ value, onChange }: BlogImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [urlInput, setUrlInput] = useState(value);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('podcast-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('podcast-covers')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput) {
      toast.error('Please enter an image URL');
      return;
    }
    
    try {
      new URL(urlInput);
      onChange(urlInput);
      toast.success('Image URL set!');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Please enter a prompt for the image');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-image', {
        body: { prompt: imagePrompt }
      });

      if (error) throw error;

      if (data.imageUrl) {
        onChange(data.imageUrl);
        toast.success('Image generated successfully!');
        setImagePrompt("");
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error: any) {
      console.error('Generate error:', error);
      toast.error(error.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="w-4 h-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label htmlFor="image-upload">Upload Image File</Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <p className="text-sm text-muted-foreground">
                  Max size: 5MB. Supports JPG, PNG, WEBP
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label htmlFor="image-url">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image-url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <Button onClick={handleUrlSubmit} type="button">
                    Set
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter a URL to an image hosted elsewhere
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label htmlFor="image-prompt">Describe the image you want</Label>
                <Textarea
                  id="image-prompt"
                  placeholder="A modern tech blog header with vibrant colors and abstract shapes..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  disabled={isGenerating}
                />
                <Button 
                  onClick={handleGenerateImage} 
                  disabled={isGenerating || !imagePrompt.trim()}
                  type="button"
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  AI will generate a unique image based on your description
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {value && (
        <Card>
          <CardContent className="pt-6">
            <Label>Current Image</Label>
            <img 
              src={value} 
              alt="Featured" 
              className="mt-2 w-full h-48 object-cover rounded-md"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800';
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};