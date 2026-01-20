/**
 * Lead Credits Chip
 * 
 * Small badge showing current credit balance.
 */

import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";

interface LeadCreditsChipProps {
  balance: number;
}

export function LeadCreditsChip({ balance }: LeadCreditsChipProps) {
  const isLow = balance < 50;
  const isCritical = balance < 10;

  return (
    <Badge 
      variant={isCritical ? "destructive" : isLow ? "secondary" : "outline"}
      className="gap-1 px-2 py-1"
    >
      <Coins className="h-3 w-3" />
      <span>{balance} credits</span>
    </Badge>
  );
}
