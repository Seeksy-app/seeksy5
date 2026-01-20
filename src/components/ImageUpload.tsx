import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, X } from "lucide-react";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  label?: string;
  bucket?: string;
  variant?: "default" | "avatar";
}

const ImageUpload = ({ onImageUploaded, currentImage, label = "Image", bucket = "event-images", variant = "default" }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      // Get user ID for folder structure (required for RLS policies)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to upload images");
      }
      
      // Organize files by user ID in folder structure
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onImageUploaded(data.publicUrl);

      toast({
        title: "Image uploaded!",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onImageUploaded("");
  };

  if (variant === "avatar") {
    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        <div className="flex items-center gap-4">
          {currentImage ? (
            <>
              <div className="relative">
                <img
                  src={currentImage}
                  alt="Profile"
                  className="w-20 h-20 object-cover rounded-full border-2 border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                  onClick={handleRemove}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                    <span className="cursor-pointer">
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Change Photo
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                    <span className="cursor-pointer">
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Photo
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {currentImage ? (
        <div className="relative">
          <img
            src={currentImage}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            {uploading ? (
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              {uploading ? "Uploading..." : "Click to upload an image"}
            </p>
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
