import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const UploadContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<"audio" | "video" | "bundle" | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Detect content type from file
      let detectedType: "audio" | "video" | "bundle" = "audio";
      if (file.type.startsWith("video/")) {
        detectedType = "video";
      } else if (file.type.startsWith("audio/")) {
        detectedType = "audio";
      } else {
        detectedType = "bundle";
      }
      
      setSelectedFile(file);
      setContentType(detectedType);
      toast({
        title: "Content selected",
        description: `${file.name} ready for certification`,
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleContinue = () => {
    if (selectedFile && contentType) {
      navigate("/content-certification/fingerprint", {
        state: { 
          contentFile: selectedFile,
          contentType: contentType
        }
      });
    }
  };

  const hasContent = selectedFile !== null;

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-white">
            <span className="font-bold text-xl">Seeksy</span>
            <span className="text-white/60 text-sm">Content Certification</span>
          </div>
          <div className="text-white/60 text-sm font-medium">LOVABLE</div>
        </div>

        <Card className="bg-card p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Upload Content for Certification</h2>
            <p className="text-muted-foreground">
              Upload your audio, video, or content bundle to verify authenticity and mint a certificate.
            </p>
          </div>

          {/* File Upload Area */}
          <div 
            className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={handleUploadClick}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p className="text-foreground font-medium mb-2">
              {selectedFile ? selectedFile.name : "Choose a file or drag it here"}
            </p>
            {!selectedFile && (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  Audio: MP3, WAV, M4A
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Video: MP4, MOV, AVI
                </p>
                <p className="text-sm text-muted-foreground">
                  Bundle: ZIP, TAR
                </p>
              </>
            )}
            {selectedFile && (
              <p className="text-sm text-primary mt-2">
                Type: {contentType?.toUpperCase()}
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*,.zip,.tar"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/voice-certification-flow")}
              className="text-foreground hover:text-foreground/80"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!hasContent}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UploadContent;
