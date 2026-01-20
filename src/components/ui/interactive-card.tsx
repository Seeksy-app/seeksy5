import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

export interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Handler called when the card is clicked or activated via keyboard
   */
  onInteract?: () => void;
  /**
   * Whether the card should be interactive (clickable)
   * @default true when onInteract is provided
   */
  interactive?: boolean;
  /**
   * Hover animation variant
   * @default "lift" - Lifts card slightly with shadow
   */
  hoverVariant?: "lift" | "glow" | "scale" | "none";
  /**
   * Whether to show focus ring when focused
   * @default true
   */
  showFocusRing?: boolean;
}

const InteractiveCard = React.forwardRef<HTMLDivElement, InteractiveCardProps>(
  (
    {
      children,
      className,
      onInteract,
      interactive = !!onInteract,
      hoverVariant = "lift",
      showFocusRing = true,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (interactive && onInteract) {
        onInteract();
      }
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (interactive && onInteract && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onInteract();
      }
      onKeyDown?.(e);
    };

    const hoverVariantClasses = {
      lift: "hover:shadow-lg hover:border-primary/30 hover:-translate-y-1",
      glow: "hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50",
      scale: "hover:scale-[1.02] hover:shadow-lg hover:border-primary/30",
      none: "",
    };

    return (
      <Card
        ref={ref}
        className={cn(
          "transition-all duration-200",
          interactive && "cursor-pointer",
          interactive && hoverVariantClasses[hoverVariant],
          interactive && showFocusRing && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "button" : undefined}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

InteractiveCard.displayName = "InteractiveCard";

export { InteractiveCard };
