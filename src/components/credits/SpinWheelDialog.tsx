import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";

interface SpinWheelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpinComplete: () => void;
  isWelcomeSpin?: boolean;
}

export function SpinWheelDialog({ open, onOpenChange, onSpinComplete, isWelcomeSpin = false }: SpinWheelDialogProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{ creditsWon: number; prizeLabel: string; isWelcomeSpin?: boolean } | null>(null);

  const spinMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("spin-wheel", {
        body: {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResult({
        creditsWon: data.creditsWon,
        prizeLabel: data.prizeLabel,
        isWelcomeSpin: data.isWelcomeSpin,
      });
      
      // Trigger confetti celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      
      const confettiInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) {
          clearInterval(confettiInterval);
          return;
        }
        
        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          particleCount: 2,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
          colors: ['#FF6B9D', '#C44569', '#FFA07A', '#FFD700', '#9B59B6'],
        });
      }, 50);
      
      toast.success(`🎉 Congratulations! You won ${data.creditsWon} credits!`, {
        description: data.prizeLabel,
        duration: 5000,
      });
      
      setTimeout(() => {
        onSpinComplete();
        setResult(null);
        
        // Redirect to credits page after welcome spin
        if (data.isWelcomeSpin) {
          setTimeout(() => {
            window.location.href = '/credits';
          }, 500);
        }
      }, 5000);
    },
    onError: (error: Error) => {
      toast.error("Failed to spin", {
        description: error.message,
      });
      onOpenChange(false);
    },
    onSettled: () => {
      setIsSpinning(false);
    },
  });

  const handleSpin = () => {
    setIsSpinning(true);
    spinMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isWelcomeSpin ? (
              <>
                <PartyPopper className="h-5 w-5 text-primary" />
                Welcome to Seeksy! 🎉
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-primary" />
                Spin the Wheel!
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isWelcomeSpin 
              ? "As a welcome gift, spin the wheel to win 5-20 free credits!"
              : "You've earned a free spin! Click the button to see what you win."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-8">
          {/* Wheel of Fortune style wheel */}
          <div className="relative w-64 h-64">
            {/* Pointer at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-500 drop-shadow-lg" />
            </div>
            
            {/* Spinning wheel */}
            <div
              className={`relative w-full h-full rounded-full border-8 border-yellow-500 shadow-2xl overflow-hidden transition-all duration-500 ${
                result ? "scale-105" : ""
              }`}
              style={{
                transform: isSpinning ? `rotate(${Math.random() * 360 + 1440}deg)` : 'rotate(0deg)',
                transition: isSpinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'transform 0.5s',
              }}
            >
              {/* Wheel segments */}
              {[
                { credits: 5, color: 'from-red-500 to-red-600', label: '5' },
                { credits: 8, color: 'from-blue-500 to-blue-600', label: '8' },
                { credits: 10, color: 'from-green-500 to-green-600', label: '10' },
                { credits: 12, color: 'from-purple-500 to-purple-600', label: '12' },
                { credits: 15, color: 'from-orange-500 to-orange-600', label: '15' },
                { credits: 18, color: 'from-pink-500 to-pink-600', label: '18' },
                { credits: 20, color: 'from-yellow-500 to-yellow-600', label: '20' },
                { credits: 25, color: 'from-cyan-500 to-cyan-600', label: '25' },
              ].map((segment, index) => {
                const rotation = (360 / 8) * index;
                return (
                  <div
                    key={index}
                    className={`absolute w-full h-full bg-gradient-to-br ${segment.color}`}
                    style={{
                      clipPath: 'polygon(50% 50%, 100% 0%, 100% 100%)',
                      transform: `rotate(${rotation}deg)`,
                      transformOrigin: '0% 50%',
                    }}
                  >
                    <div
                      className="absolute text-white font-bold text-xl"
                      style={{
                        top: '30%',
                        left: '60%',
                        transform: `rotate(${22.5}deg)`,
                      }}
                    >
                      {segment.label}
                    </div>
                  </div>
                );
              })}
              
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white border-4 border-yellow-500 flex items-center justify-center shadow-lg z-10">
                <Sparkles className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            
            {/* Result overlay */}
            {result && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm z-30 animate-fade-in">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white drop-shadow-lg mb-2">
                    {result.creditsWon}
                  </div>
                  <div className="text-xl text-yellow-300 font-semibold">
                    CREDITS!
                  </div>
                </div>
              </div>
            )}
          </div>

          {result ? (
            <div className="text-center space-y-2 animate-fade-in">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
                🎉 You won {result.creditsWon} credits! 🎉
              </div>
              <div className="text-lg text-muted-foreground">{result.prizeLabel}</div>
              {result.isWelcomeSpin && (
                <div className="text-sm text-primary font-semibold mt-2">
                  Welcome bonus unlocked! Redirecting to purchase more...
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={handleSpin}
              disabled={isSpinning}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90"
            >
              {isSpinning ? "Spinning..." : isWelcomeSpin ? "Claim Your Welcome Gift!" : "Spin Now!"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}