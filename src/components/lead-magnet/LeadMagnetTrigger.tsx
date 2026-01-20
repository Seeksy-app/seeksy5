import { Download } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeadMagnetTriggerProps extends ButtonProps {
  onTrigger: () => void;
  label?: string;
}

export function LeadMagnetTrigger({
  onTrigger,
  label = "Get Free Report",
  className,
  variant = "outline",
  ...props
}: LeadMagnetTriggerProps) {
  return (
    <Button
      variant={variant}
      onClick={onTrigger}
      className={cn("gap-2", className)}
      {...props}
    >
      <Download className="w-4 h-4" />
      {label}
    </Button>
  );
}
