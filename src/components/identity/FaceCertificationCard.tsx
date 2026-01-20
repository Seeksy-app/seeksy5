import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScanFace, Upload, X, CheckCircle2, Loader2, Camera, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FaceCertificationCardProps {
  userId: string;
  faceIdentity: any | null;
  onCertified: () => void;
}

export function FaceCertificationCard({ userId, faceIdentity, onCertified }: FaceCertificationCardProps) {
  const [images, setImages] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [...images];
    
    for (let i = 0; i < files.length && newImages.length < 5; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      
      // Convert to base64 - ensure we get proper JPEG/PNG format
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Ensure proper data URL format
          if (result.startsWith("data:image/")) {
            resolve(result);
          } else {
            resolve(`data:image/jpeg;base64,${result}`);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      newImages.push(base64);
    }
    
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleVerifyFace = async () => {
    if (images.length < 3) {
      toast.error("Please upload at least 3 photos of your face");
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-face", {
        body: { images },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Face verified and certified successfully!");
        onCertified();
      } else {
        toast.error(data.error || "Face verification failed");
      }
    } catch (error) {
      console.error("Face verification error:", error);
      toast.error("Failed to verify face. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const isCertified = faceIdentity?.verification_status === "verified";

  return (
    <Card className={isCertified ? "border-green-500/50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScanFace className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Face Certification</CardTitle>
              <CardDescription>
                Create a unique face fingerprint for identity verification
              </CardDescription>
            </div>
          </div>
          {isCertified && (
            <Badge className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Certified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCertified ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Your face is certified! You can now use face-based detection to find your appearances in videos across YouTube, Instagram, and TikTok.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Upload 3-5 clear photos of your face. Our AI will create a unique "face fingerprint" that can be used to find your appearances in videos.
              </AlertDescription>
            </Alert>

            {/* Image Upload Area */}
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img src={img} alt={`Face ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                  >
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <p className="text-xs text-muted-foreground text-center">
                {images.length}/5 photos • Need at least 3 for certification
              </p>
            </div>

            <Button
              onClick={handleVerifyFace}
              disabled={images.length < 3 || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Face...
                </>
              ) : (
                <>
                  <ScanFace className="h-4 w-4 mr-2" />
                  Certify My Face
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
