/**
 * SparkWelcomeModal Component
 * Onboarding assistant modal for new users
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SparkAvatar } from "./SparkAvatar";
import { getSparkOnboardingMessage, type UserRole } from "@/lib/spark/sparkPersonality";
import { ArrowRight } from "lucide-react";

interface SparkWelcomeModalProps {
  role: UserRole;
  onComplete: () => void;
}

export const SparkWelcomeModal = ({ role, onComplete }: SparkWelcomeModalProps) => {
  const [open, setOpen] = useState(false);
  const message = getSparkOnboardingMessage(role);

  useEffect(() => {
    // Check if user has seen welcome modal
    const hasSeenWelcome = localStorage.getItem("spark_welcome_seen");
    
    if (!hasSeenWelcome && role !== "guest") {
      setTimeout(() => setOpen(true), 500);
    }
  }, [role]);

  const handleBegin = () => {
    localStorage.setItem("spark_welcome_seen", "true");
    setOpen(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md max-w-[90vw]">
        <DialogHeader>
          <div className="flex justify-center mb-4 bg-transparent">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-transparent">
              <SparkAvatar pose="waving" size="full" animated />
            </div>
          </div>
          <DialogTitle className="text-center text-xl sm:text-2xl px-2">
            Welcome to Seeksy! {message.emoji}
          </DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base pt-2 px-4">
            {message.text}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center pt-4 px-4">
          <Button onClick={handleBegin} size="lg" className="gap-2 w-full sm:w-auto">
            Let's Begin
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
