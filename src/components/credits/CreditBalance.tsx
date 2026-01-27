import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function CreditBalance() {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnimatedOnLoadRef = useRef(false);

  const { data: userCredits } = useQuery({
    queryKey: ["user-credits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const result = await (supabase as any)
        .from("user_credits")
        .select("balance, total_spent")
        .eq("user_id", user.id)
        .single();

      if (result.error) return null;
      return result.data as any;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Pulse animation on initial load for 4 seconds
  useEffect(() => {
    if (!userCredits || hasAnimatedOnLoadRef.current) return;

    setShouldAnimate(true);
    hasAnimatedOnLoadRef.current = true;
    
    animationTimerRef.current = setTimeout(() => {
      setShouldAnimate(false);
    }, 4000);

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [userCredits]);

  const handleClick = () => {
    // Stop animation on click
    setShouldAnimate(false);
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }
  };

  if (!userCredits) return null;

  const isLowBalance = userCredits.balance < 5;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/credit-info" onClick={handleClick}>
            <Button
              variant={isLowBalance ? "destructive" : "outline"}
              size="sm"
              className={`gap-2 ${shouldAnimate ? 'animate-pulse' : ''}`}
            >
              <Coins className="h-4 w-4" />
              <span className="font-semibold">{userCredits.balance}</span>
              {isLowBalance && <span className="text-xs">Low!</span>}
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">Credits remaining</p>
            <p className="text-sm">
              You have <span className="font-medium">{userCredits.balance}</span> credits left this billing period.
            </p>
            {isLowBalance && (
              <p className="text-xs text-muted-foreground">
                Consider upgrading or buying more credits.
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              {userCredits.total_spent || 0} credits used • Click to buy more
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}