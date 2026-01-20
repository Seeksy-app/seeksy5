/**
 * Holiday Welcome Modal
 * Shows on first login when Holiday Mode is enabled
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HolidayWelcomeModal = () => {
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const hasSeenHolidayWelcome = localStorage.getItem("holiday_welcome_seen");
    
    if (!hasSeenHolidayWelcome) {
      setTimeout(() => {
        setOpen(true);
        setIsAnimating(true);
      }, 500);
    }
  }, []);

  const handleBegin = () => {
    localStorage.setItem("holiday_welcome_seen", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md max-w-[90vw] bg-white dark:bg-white border-gray-200">
        <DialogHeader>
          <div className="flex justify-center mb-6">
            <img 
              src="/spark/holiday/spark-santa-waving.png" 
              alt="Santa Spark"
              className={`w-24 h-24 sm:w-32 sm:h-32 object-contain ${isAnimating ? 'animate-[wave_1.2s_ease-in-out]' : ''}`}
              onAnimationEnd={() => setIsAnimating(false)}
              style={{ 
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))',
                background: 'transparent'
              }}
            />
          </div>
          <DialogTitle className="text-center text-xl sm:text-2xl text-gray-900 px-2">
            Welcome to Seeksy! 🎄✨
          </DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base pt-2 px-4 leading-relaxed text-gray-600">
            I'm Santa Spark — your holiday guide. Let's set up your creator page, launch your podcast, or grow your community for the season.
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
