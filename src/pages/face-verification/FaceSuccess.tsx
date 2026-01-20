import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { refetchUserIdentity } from "@/lib/identity/refetchIdentity";

const FaceSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const assetId = location.state?.assetId;

  useEffect(() => {
    // Force immediate refetch using centralized utility
    const refetchIdentity = async () => {
      console.log('[FaceSuccess] Force refetching all identity queries...');
      await refetchUserIdentity(queryClient);
      console.log('[FaceSuccess] All identity queries refetched');
    };
    
    refetchIdentity().catch(err => {
      console.error('[FaceSuccess] Refetch error (non-critical):', err);
    });
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="p-12 max-w-md w-full">
        <div className="text-center space-y-6">
          <CheckCircle className="h-24 w-24 mx-auto text-green-500" />
          <div>
            <h1 className="text-3xl font-bold mb-3">Face Verified</h1>
            <p className="text-muted-foreground">
              Your face identity has been confirmed and stored on-chain.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {assetId && (
              <Button 
                onClick={() => navigate(`/certificate/identity/${assetId}`)}
                size="lg"
                className="w-full"
              >
                View Certificate
              </Button>
            )}
            <Button 
              onClick={() => navigate("/identity")}
              size="lg"
              className="w-full"
            >
              Back to Identity Hub
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate("/my-voice-identity")}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Voice Identity
              </Button>
              <Button 
                onClick={() => navigate("/identity/rights")}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Rights
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FaceSuccess;
