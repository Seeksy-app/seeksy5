import React, { useState, useCallback } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => void | Promise<void>;
  loadingText?: string;
  icon?: React.ReactNode;
  preventDoubleClick?: boolean;
  debounceMs?: number;
}

export function ActionButton({
  onClick,
  loadingText,
  icon,
  children,
  disabled,
  className,
  preventDoubleClick = true,
  debounceMs = 500,
  ...props
}: ActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleClick = useCallback(async () => {
    // Double-click prevention
    if (preventDoubleClick) {
      const now = Date.now();
      if (now - lastClickTime < debounceMs) {
        return;
      }
      setLastClickTime(now);
    }

    // Handle async onClick
    const result = onClick();
    if (result instanceof Promise) {
      setIsLoading(true);
      try {
        await result;
      } finally {
        setIsLoading(false);
      }
    }
  }, [onClick, preventDoubleClick, debounceMs, lastClickTime]);

  const isDisabled = disabled || isLoading;

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn("gap-2", className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  );
}
