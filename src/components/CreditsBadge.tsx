import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

export function CreditsBadge() {
  const [credits, setCredits] = useState<number | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnimatedOnLoadRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCredits();
    
    // Cleanup animation timer on unmount
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (credits === null || hasAnimatedOnLoadRef.current) return;

    // Pulse on initial load for 4 seconds (about 4 pulse cycles), then stop
    setShouldAnimate(true);
    hasAnimatedOnLoadRef.current = true;
    
    animationTimerRef.current = setTimeout(() => {
      setShouldAnimate(false);
    }, 4000);
  }, [credits]);

  const loadCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch real credits from user_credits table
      const { data: creditData, error } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching credits:", error);
        setCredits(0);
        return;
      }

      setCredits(creditData?.balance ?? 0);
    } catch (error) {
      console.error("Error loading credits:", error);
      setCredits(0);
    }
  };

  const handleClick = () => {
    // Stop animation on click
    setShouldAnimate(false);
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }
    
    navigate("/settings/billing");
  };

  if (credits === null) return null;

  // Color logic: >20 blue, 5-20 yellow, ≤4 red
  const getVariant = () => {
    if (credits > 20) return "default"; // blue
    if (credits >= 5) return "secondary"; // yellow
    return "destructive"; // red
  };

  const isLow = credits <= 4;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={getVariant()}
            className={`cursor-pointer hover:scale-105 transition-all duration-200 flex items-center gap-1.5 px-3 py-1.5 ${
              shouldAnimate ? 'animate-pulse' : ''
            }`}
            onClick={handleClick}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="font-semibold">{credits}</span>
            {isLow && <span className="text-xs opacity-90">Low!</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">Credits remaining</p>
            <p className="text-sm">
              You have <span className="font-medium">{credits}</span> credits left this billing period.
            </p>
            {isLow && (
              <p className="text-xs text-muted-foreground">
                Consider upgrading or buying more credits.
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              Click to manage credits
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}