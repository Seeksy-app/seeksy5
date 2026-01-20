import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface IdentityWidgetProps {
  faceVerified?: boolean;
  voiceVerified?: boolean;
}

export function IdentityWidget({ faceVerified = false, voiceVerified = false }: IdentityWidgetProps) {
  const navigate = useNavigate();
  
  const isFullyVerified = faceVerified && voiceVerified;
  const isPartiallyVerified = faceVerified || voiceVerified;

  const status = isFullyVerified ? "verified" : isPartiallyVerified ? "partial" : "unverified";
  
  const statusConfig = {
    verified: {
      label: "Fully Verified",
      bgGradient: "from-emerald-50 to-green-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-500",
      badgeBg: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle,
    },
    partial: {
      label: "Partially Verified",
      bgGradient: "from-amber-50 to-yellow-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-700",
      iconBg: "bg-gradient-to-br from-amber-500 to-yellow-500",
      badgeBg: "bg-amber-100 text-amber-700",
      icon: AlertCircle,
    },
    unverified: {
      label: "Not Verified",
      bgGradient: "from-slate-50 to-gray-50",
      borderColor: "border-slate-200",
      textColor: "text-slate-600",
      iconBg: "bg-gradient-to-br from-slate-400 to-gray-500",
      badgeBg: "bg-slate-100 text-slate-600",
      icon: Shield,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card className={cn(
        "shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 rounded-2xl",
        `bg-gradient-to-br ${config.bgGradient}`,
        config.borderColor
      )}>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl text-white shadow-md", config.iconBg)}>
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-bold text-base">Identity Verification</span>
            </div>
            <Badge className={cn("text-xs font-semibold px-3 py-1 rounded-full", config.badgeBg)}>
              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
              {config.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={cn(
              "p-4 rounded-xl border-2 transition-all",
              faceVerified 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-white/50 border-slate-200'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {faceVerified ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                )}
                <span className="text-sm font-semibold">Face</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {faceVerified ? "Verified on-chain" : "Not verified"}
              </p>
            </div>
            <div className={cn(
              "p-4 rounded-xl border-2 transition-all",
              voiceVerified 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-white/50 border-slate-200'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {voiceVerified ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                )}
                <span className="text-sm font-semibold">Voice</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {voiceVerified ? "Verified on-chain" : "Not verified"}
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className={cn(
              "w-full h-11 text-sm font-semibold rounded-xl border-2",
              isFullyVerified 
                ? "border-emerald-300 hover:bg-emerald-50" 
                : "border-primary/30 hover:bg-primary/5"
            )}
            onClick={() => navigate("/identity")}
          >
            {isFullyVerified ? "View Certificates" : "Complete Verification"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
