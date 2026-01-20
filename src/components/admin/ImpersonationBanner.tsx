import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImpersonationBannerProps {
  impersonatedUserName: string;
  onExitImpersonation: () => void;
}

export default function ImpersonationBanner({
  impersonatedUserName,
  onExitImpersonation,
}: ImpersonationBannerProps) {
  const handleExitImpersonation = async () => {
    const originalAdminId = localStorage.getItem("original_admin_id");
    
    if (!originalAdminId) {
      toast.error("Cannot exit impersonation - original admin ID not found");
      return;
    }

    // Clear impersonation state
    localStorage.removeItem("impersonating_user_id");
    localStorage.removeItem("original_admin_id");
    
    toast.success("Exited impersonation mode");
    
    // Reload the page to restore admin session
    window.location.href = "/admin";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black py-2 px-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">
            Impersonating: {impersonatedUserName}
          </span>
          <span className="text-sm opacity-80">
            You are viewing the platform as this user
          </span>
        </div>
        <Button
          onClick={handleExitImpersonation}
          variant="outline"
          size="sm"
          className="bg-black text-yellow-500 hover:bg-black/80"
        >
          Exit Impersonation
        </Button>
      </div>
    </div>
  );
}
