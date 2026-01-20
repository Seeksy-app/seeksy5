import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, ExternalLink, Shield, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FaceIdentityAsset {
  id: string;
  cert_status: string;
  face_hash: string | null;
  cert_explorer_url: string | null;
  cert_tx_hash: string | null;
}

interface FaceIdentitySectionProps {
  asset: FaceIdentityAsset | undefined;
}

export function FaceIdentitySection({ asset }: FaceIdentitySectionProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadStep, setUploadStep] = useState<'upload' | 'confirm' | 'processing'>('upload');

  const status = asset?.cert_status || "not_set";

  const statusConfig = {
    not_set: {
      color: "bg-muted text-muted-foreground",
      label: "Not set",
    },
    pending: {
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      label: "Verification in progress",
    },
    minting: {
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      label: "Certifying…",
    },
    minted: {
      color: "bg-green-500/10 text-green-600 border-green-200",
      label: "Verified",
    },
    failed: {
      color: "bg-red-500/10 text-red-600 border-red-200",
      label: "Verification failed",
    },
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_set;

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const readers = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((images) => {
      setSelectedImages((prev) => [...prev, ...images].slice(0, 5)); // Max 5 images
      if (images.length > 0) {
        setUploadStep('confirm');
      }
    });
  }, []);

  const handleStartVerification = async () => {
    console.log("[FaceIdentity] ========== BUTTON CLICKED ==========");
    console.log("[FaceIdentity] Selected images count:", selectedImages.length);
    console.log("[FaceIdentity] First image preview:", selectedImages[0]?.substring(0, 50));
    
    if (selectedImages.length < 3) {
      console.log("[FaceIdentity] ERROR: Not enough images");
      toast.error("Please upload at least 3 photos");
      return;
    }

    console.log("[FaceIdentity] ✓ Validation passed, starting verification with", selectedImages.length, "images");
    
    setUploadStep('processing');
    setIsVerifying(true);

    try {
      console.log("[FaceIdentity] Calling verify-face edge function...");
      
      const { data, error } = await supabase.functions.invoke("verify-face", {
        body: { images: selectedImages },
      });

      console.log("[FaceIdentity] Response:", { data, error });

      if (error) {
        console.error("[FaceIdentity] Supabase function error:", error);
        throw error;
      }

      if (!data) {
        console.error("[FaceIdentity] No data returned from function");
        throw new Error("No response from verification service");
      }

      // Log structured error details if available
      if (data.stage || data.code) {
        console.error(`[FaceIdentity] Failure stage: ${data.stage}`);
        console.error(`[FaceIdentity] Error code: ${data.code}`);
        console.error(`[FaceIdentity] Error message: ${data.message}`);
      }

      if (data.status === "verified") {
        console.log("[FaceIdentity] ✓ Verification successful:", data);
        toast.success("Face identity verified successfully!");
        queryClient.invalidateQueries({ queryKey: ["identity-assets"] });
        setIsDialogOpen(false);
        setSelectedImages([]);
        setUploadStep('upload');
      } else if (data.status === "failed") {
        console.error("[FaceIdentity] Verification failed:", data);
        
        // Show detailed error based on stage
        let errorTitle = "Face Verification Failed";
        let errorDescription = data.message || "Please try again";
        
        if (data.stage === "openai") {
          errorTitle = "AI Analysis Failed";
          errorDescription = "We couldn't analyze your photos. Please try different images.";
        } else if (data.stage === "mint") {
          errorTitle = "Blockchain Minting Failed";
          errorDescription = "Face analyzed successfully, but blockchain certificate failed. Please retry.";
        } else if (data.stage === "db") {
          errorTitle = "Database Error";
          errorDescription = "Please try again in a moment.";
        }
        
        toast.error(errorTitle, { description: errorDescription });
        setUploadStep('confirm');
      }
    } catch (error) {
      console.error("[FaceIdentity] Network/Edge error:", error);
      
      // User-friendly error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("Failed to send") || errorMessage.includes("fetch")) {
        toast.error("Connection Error", {
          description: "We couldn't reach the verification service. Please check your internet connection and try again.",
        });
      } else if (errorMessage.includes("Not authenticated")) {
        toast.error("Authentication Error", {
          description: "Please log out and log back in, then try again.",
        });
      } else {
        toast.error("Verification Failed", {
          description: "We couldn't complete the verification. Please try again in a few minutes or contact support if this continues.",
        });
      }
      
      setUploadStep('confirm');
    } finally {
      setIsVerifying(false);
    }
  };

  const resetUpload = () => {
    setSelectedImages([]);
    setUploadStep('upload');
  };

  return (
    <>
      <Card className="border-2">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Face Identity</h4>
                <Badge variant="outline" className={currentStatus.color}>
                  {currentStatus.label}
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {status === "not_set" && "Verify your face to protect your identity"}
            {status === "pending" && "Verification in progress"}
            {status === "minting" && "Minting certificate on blockchain"}
            {status === "minted" && "Face identity certified on-chain"}
            {status === "failed" && "Verification failed - please retry"}
          </p>

          {status === "not_set" || status === "failed" ? (
            <Button 
              className="w-full" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              {status === "failed" ? "Retry Face Verification" : "Start Face Verification"}
            </Button>
          ) : status === "pending" || status === "minting" ? (
            <Button className="w-full" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verification in progress…
            </Button>
          ) : status === "minted" && asset ? (
            <div className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate(`/certificate/identity/${asset.id}`)}
              >
                <Shield className="h-4 w-4 mr-2" />
                View Certificate
              </Button>
              {(asset.cert_explorer_url || asset.face_hash) && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    const url = asset.cert_explorer_url || `https://polygonscan.com/tx/${asset.face_hash}`;
                    window.open(url, "_blank");
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Polygon
                </Button>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetUpload();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {uploadStep === 'upload' && "Upload Your Face Photos"}
              {uploadStep === 'confirm' && "Confirm & Submit"}
              {uploadStep === 'processing' && "Verifying..."}
            </DialogTitle>
            <DialogDescription>
              {uploadStep === 'upload' && "Upload 3–5 clear photos to create your blockchain-verified face identity"}
              {uploadStep === 'confirm' && "Review your photos and submit for verification"}
              {uploadStep === 'processing' && "Creating your encrypted FaceHash and blockchain certificate"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Upload */}
            {uploadStep === 'upload' && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Confirm your real identity and protect how your face is used.</p>
                  <p className="text-sm text-muted-foreground">
                    Upload a few clear photos and we'll generate a secure FaceHash—your cryptographic identity signature stored on the blockchain.
                  </p>
                </div>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Upload Instructions</p>
                    <ul className="text-xs text-muted-foreground space-y-1 text-left max-w-xs mx-auto">
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span> Your full face is visible
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span> Good lighting
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span> No sunglasses or heavy filters
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-primary">✓</span> Avoid group photos
                      </li>
                    </ul>
                  </div>
                  <div className="flex gap-2 justify-center mt-6">
                    <Button asChild>
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photos (3–5)
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
              </>
            )}

            {/* Step 2: Confirm & Preview */}
            {uploadStep === 'confirm' && selectedImages.length > 0 && (
              <>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-3">
                      Preview Gallery ({selectedImages.length} photo{selectedImages.length !== 1 ? 's' : ''})
                    </p>
                    <div className="grid grid-cols-5 gap-3">
                      {selectedImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                          <img src={img} alt={`Face ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={resetUpload}
                      className="flex-1"
                    >
                      Choose Different Photos
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log("[FaceIdentity] Submit button clicked!");
                        handleStartVerification();
                      }}
                      disabled={selectedImages.length < 3 || isVerifying}
                      className="flex-1"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit for Verification"
                      )}
                    </Button>
                  </div>

                  {selectedImages.length < 3 && (
                    <p className="text-sm text-amber-600 dark:text-amber-500 text-center">
                      Please upload at least 3 photos to continue
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Processing */}
            {uploadStep === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Verifying your photos…</p>
                  <p className="text-xs text-muted-foreground">
                    We're creating your encrypted FaceHash and preparing your certificate.
                  </p>
                </div>
              </div>
            )}

            {/* Identity Promise */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Identity Promise</p>
              <p className="text-xs text-muted-foreground">
                Seeksy does not sell, license, or share your likeness without your explicit permission. 
                Your identity belongs to you. All AI usage requires your consent.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}