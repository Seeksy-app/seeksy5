/**
 * StartOnboardingButton Component
 * Compact pill button - tours temporarily disabled
 */

import { Button } from '@/components/ui/button';
import { Sparkles, HelpCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface StartOnboardingButtonProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function StartOnboardingButton({ className, variant = 'default' }: StartOnboardingButtonProps) {
  // Tours temporarily disabled - show coming soon toast
  const handleTourClick = () => {
    toast.info("Guided tours are coming soon.", {
      description: "We're building an improved onboarding experience.",
      duration: 3000,
    });
  };

  // Compact pill variant
  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleTourClick}
        className="h-7 px-2.5 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full border border-border/50 hover:border-border hover:bg-muted/50"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tour</span>
      </Button>
    );
  }

  // Default variant - pill style with dropdown (shows coming soon)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 gap-2 text-xs font-medium rounded-full border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
          id="creatorhub-start-onboarding-button"
          data-onboarding="start-onboarding"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Start Onboarding
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-popover">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Guided Tours
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleTourClick}
          className="gap-2 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Coming Soon</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
