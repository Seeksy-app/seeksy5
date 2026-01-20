import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Mic, ArrowLeft, FileAudio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CertificationStepper } from "@/components/voice-certification/CertificationStepper";

const UploadOrRecordVoice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"upload" | "record" | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedMethod("upload");
      setRecordedBlob(null);
      toast({
        title: "File selected",
        description: `${file.name} ready for upload`,
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRecordClick = () => {
    setSelectedMethod("record");
    setSelectedFile(null);
    setIsRecording(true);
    
    // Simulate recording for demo purposes - 10 seconds to match minimum recommended length
    setTimeout(() => {
      setIsRecording(false);
      const mockBlob = new Blob(["mock audio data"], { type: "audio/wav" });
      setRecordedBlob(mockBlob);
      toast({
        title: "Recording captured",
        description: "Voice sample recorded successfully",
      });
    }, 10000);
  };

  const handleContinue = () => {
    if (selectedFile || recordedBlob) {
      // Pass the file/blob to the next screen via state
      navigate("/voice-certification/fingerprint", {
        state: { audioData: selectedFile || recordedBlob }
      });
    }
  };

  const hasAudio = selectedFile !== null || recordedBlob !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <CertificationStepper 
          currentStep={2} 
          totalSteps={7} 
          stepLabel="Provide Voice Sample"
        />

        <Card className="p-8 space-y-6">
          <div className="text-center mb-4">
            <FileAudio className="h-12 w-12 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-2">Submit Your Voice Sample</h2>
            <p className="text-muted-foreground">
              Upload a high-quality voice recording or record a new sample. This sample is used only to create your encrypted voice fingerprint.
            </p>
          </div>

          {/* Details Section */}
          <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Supported formats: WAV, MP3, M4A</li>
              <li>• Minimum recommended length: 10–15 seconds</li>
              <li>• Your audio is processed securely and never shared</li>
            </ul>
          </div>

          {/* File Upload Area */}
          <div 
            className="border-2 border-dashed border-primary/20 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={handleUploadClick}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p className="text-foreground font-medium mb-2">
              {selectedFile ? `✓ ${selectedFile.name}` : "Choose a file or drag it here"}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,.mp3,.m4a,audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Record Voice Section */}
          <div className="relative">
            <div className="absolute inset-x-0 top-0 flex items-center">
              <div className="flex-1 border-t border-border"></div>
              <span className="px-4 text-xs font-medium text-muted-foreground uppercase">Or</span>
              <div className="flex-1 border-t border-border"></div>
            </div>
            
            <div className="pt-8">
              <Button
                size="lg"
                variant={recordedBlob ? "outline" : "default"}
                onClick={handleRecordClick}
                disabled={isRecording}
                className="w-full py-6 text-lg"
              >
                <Mic className="mr-2 h-5 w-5" />
                {isRecording ? "Recording... (10 seconds)" : recordedBlob ? "✓ Recorded - Click to Re-record" : "Record New Sample"}
              </Button>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/voice-certification-flow")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!hasAudio}
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UploadOrRecordVoice;
