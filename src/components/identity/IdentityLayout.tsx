import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Mic, Lock, ShieldCheck, XCircle, Eye } from "lucide-react";
import { useIdentityStatus } from "@/hooks/useIdentityStatus";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IdentityLayoutProps {
  children: React.ReactNode;
}

export function IdentityLayout({ children }: IdentityLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: identityStatus } = useIdentityStatus();

  const voiceVerified = identityStatus?.voiceVerified || false;
  const faceVerified = identityStatus?.faceVerified || false;

  const getOverallStatus = () => {
    if (voiceVerified && faceVerified) return { label: "Verified", icon: ShieldCheck, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950" };
    if (voiceVerified || faceVerified) return { label: "Partial", icon: Shield, color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950" };
    return { label: "Not Verified", icon: XCircle, color: "text-muted-foreground", bgColor: "bg-muted" };
  };

  const overallStatus = getOverallStatus();

  const isActive = (path: string) => {
    if (path === "/identity") {
      return location.pathname === "/identity";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Status Badges */}
      <div className="border-b bg-card">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Identity & Rights</h1>
              <p className="text-muted-foreground mt-1">
                Manage your verified face, voice, and permissions
              </p>
            </div>
            <div className="flex gap-3">
              <Badge 
                variant="outline" 
                className={cn(
                  "px-4 py-2 text-sm font-medium",
                  overallStatus.bgColor,
                  overallStatus.color
                )}
              >
                <overallStatus.icon className="h-4 w-4 mr-2" />
                {overallStatus.label}
              </Badge>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex gap-3 mb-6">
            <Badge 
              variant="outline" 
              className={cn(
                "px-3 py-1.5",
                faceVerified ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200" : "bg-muted"
              )}
            >
              {faceVerified ? <ShieldCheck className="h-3 w-3 mr-1.5" /> : <XCircle className="h-3 w-3 mr-1.5" />}
              Face {faceVerified ? "Verified" : "Not Verified"}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "px-3 py-1.5",
                voiceVerified ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200" : "bg-muted"
              )}
            >
              {voiceVerified ? <ShieldCheck className="h-3 w-3 mr-1.5" /> : <XCircle className="h-3 w-3 mr-1.5" />}
              Voice {voiceVerified ? "Verified" : "Not Verified"}
            </Badge>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => navigate("/identity")}
              variant={isActive("/identity") && !isActive("/identity/voice") && !isActive("/identity/rights") && !isActive("/broadcast-monitoring") ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Identity Hub
            </Button>
            <Button
              onClick={() => navigate("/identity/voice")}
              variant={isActive("/identity/voice") ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Mic className="h-4 w-4" />
              Voice Identity
            </Button>
            <Button
              onClick={() => navigate("/identity/rights")}
              variant={isActive("/identity/rights") ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Lock className="h-4 w-4" />
              Rights
            </Button>
            <Button
              onClick={() => navigate("/broadcast-monitoring")}
              variant={isActive("/broadcast-monitoring") ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Content Protection
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}
