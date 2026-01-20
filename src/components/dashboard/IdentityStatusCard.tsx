import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";
import { motion } from "framer-motion";

export const IdentityStatusCard = () => {
  const navigate = useNavigate();
  const { data: identityStatus } = useIdentityStatus();

  const faceVerified = identityStatus?.faceVerified || false;
  const voiceVerified = identityStatus?.voiceVerified || false;
  const isComplete = faceVerified && voiceVerified;

  const getStatusBadge = (verified: boolean) => {
    if (verified) {
      return (
        <Badge className="gap-1 bg-gradient-to-r from-green-500 to-emerald-500 border-0 shadow-sm">
          <CheckCircle className="h-3 w-3" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 bg-muted/50">
        <AlertCircle className="h-3 w-3" />
        Not Setup
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Identity Status</CardTitle>
            </div>
            {isComplete && (
              <div className="p-1 rounded-full bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            )}
          </div>
          <CardDescription>Your verified identity assets</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">Face Identity</span>
              {getStatusBadge(faceVerified)}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">Voice Identity</span>
              {getStatusBadge(voiceVerified)}
            </div>
          </div>

          {/* View on Polygon buttons */}
          {isComplete && (identityStatus?.faceExplorerUrl || identityStatus?.voiceExplorerUrl) && (
            <div className="space-y-2 pt-2">
              {identityStatus?.faceExplorerUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs hover:bg-primary/5"
                  onClick={() => window.open(identityStatus.faceExplorerUrl!, "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Face on Polygon
                </Button>
              )}
              {identityStatus?.voiceExplorerUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs hover:bg-primary/5"
                  onClick={() => window.open(identityStatus.voiceExplorerUrl!, "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Voice on Polygon
                </Button>
              )}
            </div>
          )}

          <Button 
            onClick={() => navigate("/identity")}
            className={`w-full ${isComplete ? "" : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md"}`}
            variant={isComplete ? "outline" : "default"}
          >
            {isComplete ? "Manage Identity" : "Complete Identity"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
