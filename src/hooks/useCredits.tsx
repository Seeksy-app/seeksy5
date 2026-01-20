import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export function useCredits() {
  const queryClient = useQueryClient();
  const [showSpinWheel, setShowSpinWheel] = useState(false);

  const deductCreditMutation = useMutation({
    mutationFn: async ({
      activityType,
      description,
      metadata,
    }: {
      activityType: string;
      description?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("deduct-credit", {
        body: { activityType, description, metadata },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      
      if (data.isEligibleForSpin) {
        setShowSpinWheel(true);
      }
    },
    onError: (error: any) => {
      if (error.message?.includes("Insufficient credits")) {
        toast.error("Insufficient credits", {
          description: "Purchase more credits to continue using this feature.",
          action: {
            label: "Buy Credits",
            onClick: () => (window.location.href = "/credits"),
          },
        });
      } else {
        toast.error("Failed to process credit", {
          description: error.message,
        });
      }
    },
  });

  const deductCredit = async (
    activityType: string,
    description?: string,
    metadata?: Record<string, any>
  ) => {
    return deductCreditMutation.mutateAsync({ activityType, description, metadata });
  };

  return {
    deductCredit,
    isDeducting: deductCreditMutation.isPending,
    showSpinWheel,
    setShowSpinWheel,
  };
}