import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function BackgroundRemover() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setResultUrl(""); // Clear previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile || !previewUrl) {
      toast({
        title: "No image selected",
        description: "Please select an image first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke("remove-background", {
        body: { imageUrl: previewUrl },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to remove background");
      }

      setResultUrl(data.imageUrl);
      toast({
        title: "✅ Background removed!",
        description: "Your transparent image is ready to download",
      });
    } catch (error: any) {
      console.error("Error removing background:", error);
      toast({
        title: "Failed to remove background",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `transparent-${selectedFile?.name || "image.png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Background Remover</h1>
          <p className="text-muted-foreground">
            Remove backgrounds from your Spark mascot images using AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Original Image</CardTitle>
              <CardDescription>Upload your mascot image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB
                  </span>
                </label>
              </div>

              {previewUrl && (
                <div className="relative aspect-square bg-checkerboard rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <Button
                onClick={handleRemoveBackground}
                disabled={!selectedFile || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Remove Background
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card>
            <CardHeader>
              <CardTitle>Transparent Result</CardTitle>
              <CardDescription>Your image with background removed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-square bg-checkerboard rounded-lg overflow-hidden border-2 border-muted">
                {resultUrl ? (
                  <img
                    src={resultUrl}
                    alt="Transparent result"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <ImageIcon className="h-12 w-12 mx-auto opacity-50" />
                      <p className="text-sm">Transparent image will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleDownload}
                disabled={!resultUrl}
                className="w-full"
                size="lg"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Upload your Spark mascot image (the one with a background)</li>
              <li>Click "Remove Background" and wait for AI processing (usually 5-10 seconds)</li>
              <li>Download your transparent PNG image</li>
              <li>Use the transparent image in your app, website, or designs</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <style>{`
        .bg-checkerboard {
          background-image: 
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}
