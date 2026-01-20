import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Upload, Download, Image as ImageIcon } from "lucide-react";
import { ThumbnailLogoManager } from "./ThumbnailLogoManager";

interface ThumbnailManagerProps {
  mediaId: string;
  currentThumbnail?: string;
  onThumbnailUpdate?: (thumbnailUrl: string) => void;
}

export function ThumbnailManager({ mediaId, currentThumbnail, onThumbnailUpdate }: ThumbnailManagerProps) {
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(currentThumbnail || null);

  const handleGenerateThumbnail = async () => {
    setIsGenerating(true);
    setGeneratedThumbnails([]);
    setSelectedThumbnail(null);
    
    try {
      // Generate 5 thumbnail options
      const promises = Array(5).fill(0).map(() =>
        supabase.functions.invoke('generate-ai-thumbnail', {
          body: { 
            videoTitle: videoTitle || undefined,
            videoDescription: videoDescription || undefined,
            style: "eye-catching"
          }
        })
      );

      const results = await Promise.all(promises);
      const thumbnails: string[] = [];
      
      for (const result of results) {
        if (result.error) {
          console.error('Error generating thumbnail:', result.error);
        } else if (result.data?.imageUrl) {
          thumbnails.push(result.data.imageUrl);
        }
      }

      if (thumbnails.length > 0) {
        setGeneratedThumbnails(thumbnails);
        toast.success(`Generated ${thumbnails.length} thumbnail option${thumbnails.length > 1 ? 's' : ''}`);
      } else {
        toast.error("Failed to generate thumbnails");
      }
    } catch (error: any) {
      console.error('Error generating thumbnail:', error);
      toast.error(error.message || "Failed to generate thumbnail");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${mediaId}-thumbnail-${Date.now()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('studio-recordings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('studio-recordings')
        .getPublicUrl(filePath);

      setUploadedThumbnail(urlData.publicUrl);
      onThumbnailUpdate?.(urlData.publicUrl);
      toast.success("Thumbnail uploaded successfully");
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      toast.error("Failed to upload thumbnail");
    } finally {
      setIsUploading(false);
    }
  };

  const saveThumbnail = async (thumbnailUrl: string) => {
    try {
      // Note: thumbnail storage is handled via metadata for now
      // In future, add thumbnail_url column to media_files table
      onThumbnailUpdate?.(thumbnailUrl);
      toast.success("Thumbnail saved");
    } catch (error: any) {
      console.error('Error saving thumbnail:', error);
      toast.error("Failed to save thumbnail");
    }
  };

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `thumbnail-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Thumbnail</h3>
        <p className="text-xs text-muted-foreground">
          Upload or generate a thumbnail for your video
        </p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Generate
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4 mt-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Video Title (Optional)</Label>
            <Input
              placeholder="Enter video title for context..."
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Description (Optional)</Label>
            <Textarea
              placeholder="Brief description to help AI generate relevant thumbnail..."
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>

          <Button 
            onClick={handleGenerateThumbnail} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Thumbnail
              </>
            )}
          </Button>

          {generatedThumbnails.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Choose your thumbnail</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateThumbnail}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  Regenerate
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {generatedThumbnails.map((thumbnail, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all ${
                      selectedThumbnail === thumbnail 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedThumbnail(thumbnail)}
                  >
                    <CardContent className="p-3">
                      <img 
                        src={thumbnail} 
                        alt={`Thumbnail option ${index + 1}`}
                        className="w-full h-auto rounded-md mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(thumbnail);
                          }}
                          className="flex-1 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveThumbnail(thumbnail);
                          }}
                          className="flex-1 text-xs"
                        >
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Add Logo Manager for selected thumbnail */}
              {selectedThumbnail && (
                <>
                  <Separator className="my-4" />
                  <ThumbnailLogoManager 
                    thumbnailUrl={selectedThumbnail}
                    onLogoApplied={(thumbnailWithLogo) => {
                      // Update the selected thumbnail with logo version
                      setSelectedThumbnail(thumbnailWithLogo);
                    }}
                  />
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Upload Thumbnail</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 1920x1080px (16:9), max 5MB
            </p>
          </div>

          {isUploading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {uploadedThumbnail && !isUploading && (
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <Label className="text-sm font-medium mb-2 block">Uploaded Thumbnail</Label>
                <img 
                  src={uploadedThumbnail} 
                  alt="Uploaded thumbnail"
                  className="w-full h-auto rounded-md"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
