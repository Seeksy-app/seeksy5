import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Upload } from "lucide-react";
import { toast } from "sonner";

const FaceUpload = () => {
  const navigate = useNavigate();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const readers = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((images) => {
      setSelectedImages((prev) => [...prev, ...images].slice(0, 5));
    });
  };

  const handleUpload = () => {
    if (selectedImages.length < 3) {
      toast.error("Please upload at least 3 photos");
      return;
    }
    
    navigate("/face-verification/processing", { state: { images: selectedImages } });
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/identity")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Identity
        </Button>

        <Card className="p-12">
          <div className="text-center space-y-6">
            <Camera className="h-16 w-16 mx-auto text-primary" />
            <div>
              <h1 className="text-3xl font-bold mb-3">Face Verification</h1>
              <p className="text-muted-foreground">
                Upload 3–5 photos so we can verify your identity.
              </p>
            </div>

            {/* Upload Dropzone */}
            <div className="border-2 border-dashed border-border rounded-lg p-12">
              <div className="space-y-4">
                <div className="space-y-2 text-left max-w-xs mx-auto text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Good lighting
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span> No filters
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Clear view of your face
                  </p>
                </div>

                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-6">
                    {selectedImages.map((img, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden border">
                        <img src={img} alt={`Face ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <Button asChild className="mt-6">
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </label>
                </Button>
              </div>
            </div>

            {selectedImages.length >= 3 && (
              <Button size="lg" onClick={handleUpload} className="w-full">
                Continue ({selectedImages.length} photos)
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FaceUpload;
