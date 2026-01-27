/**
 * Register Face Dialog
 * Simple flow for creator face registration
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RegisterFaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegisterFaceDialog = ({
  open,
  onOpenChange,
}: RegisterFaceDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRegister = async () => {
    if (!selectedFile) {
      toast({
        title: "No image selected",
        description: "Please select a photo to continue",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Upload thumbnail to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `face-thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media-files")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media-files")
        .getPublicUrl(filePath);

      // Call edge function to generate embedding
      const { data, error: functionError } = await supabase.functions.invoke(
        "generate-face-embedding",
        {
          body: { imageUrl: publicUrl },
        }
      );

      if (functionError) throw functionError;

      // Store face registration
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const insertResult = await (supabase as any)
        .from("creator_faces")
        .insert({
          creator_id: user.id,
          embedding: data.embedding,
          thumbnail_url: publicUrl,
        });

      if (insertResult.error) throw insertResult.error;

      toast({
        title: "Face registered successfully!",
        description: "Your face is now registered for identity protection",
      });

      onOpenChange(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error("Face registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Could not register your face",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register Your Face</DialogTitle>
          <DialogDescription>
            Register your face for identity protection and facial attribution
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="webcam" disabled>
              <Camera className="h-4 w-4 mr-2" />
              Webcam
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 pt-4">
            {previewUrl ? (
              <div className="space-y-4">
                <div className="aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden border">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Change Photo
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleRegister}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Register Face"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a clear photo of your face
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="face-upload"
                  />
                  <Button asChild>
                    <label htmlFor="face-upload" className="cursor-pointer">
                      Choose Photo
                    </label>
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-2">
                  <p>📸 Tips for best results:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Use good lighting</li>
                    <li>Face the camera directly</li>
                    <li>Remove glasses and hats</li>
                    <li>Neutral expression works best</li>
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="webcam" className="py-8 text-center">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Webcam capture coming soon
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
