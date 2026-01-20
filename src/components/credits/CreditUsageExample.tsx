/**
 * Example Component - How to use CreditNotificationDialog
 * 
 * This shows how to integrate credit notifications into your features.
 * Copy this pattern when adding credit-consuming actions.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditNotificationDialog } from "./CreditNotificationDialog";
import { useCreditNotification, CreditAction } from "@/hooks/useCreditNotification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CreditUsageExample() {
  const [showNotification, setShowNotification] = useState(false);
  const creditNotification = useCreditNotification();
  
  // Example: Creating a meeting
  const handleCreateMeeting = async () => {
    const action: CreditAction = "create_meeting";
    
    // Check if we should show the notification
    if (creditNotification.shouldShow(action)) {
      setShowNotification(true);
      return; // Wait for user to confirm
    }
    
    // If notification already seen, proceed directly
    await executeCreateMeeting();
  };

  const executeCreateMeeting = async () => {
    try {
      // TODO: Implement your credit deduction logic here
      // Example: await supabase.from('user_credits').update({ balance: balance - 1 })
      
      // Proceed with creating meeting
      // ... your meeting creation logic here ...
      
      toast.success("Meeting created! 1 credit used.");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create meeting");
    }
  };

  return (
    <>
      <Button onClick={handleCreateMeeting}>
        Create Meeting
      </Button>

      <CreditNotificationDialog
        open={showNotification}
        onOpenChange={setShowNotification}
        action="Create Meeting"
        cost={1}
        description="Schedule a new meeting with attendees"
        onDontShowAgain={() => {
          creditNotification.markAsSeen("create_meeting");
          executeCreateMeeting();
        }}
      />
    </>
  );
}
