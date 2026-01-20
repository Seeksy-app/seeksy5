import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Coins, Info } from "lucide-react";
import { useState } from "react";

interface CreditNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;
  cost: number;
  description: string;
  onDontShowAgain?: () => void;
}

export function CreditNotificationDialog({
  open,
  onOpenChange,
  action,
  cost,
  description,
  onDontShowAgain,
}: CreditNotificationDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain && onDontShowAgain) {
      onDontShowAgain();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Credit Usage</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            This action will use credits from your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start justify-between p-4 rounded-lg border bg-muted/50">
            <div className="space-y-1 flex-1">
              <div className="font-semibold text-lg">{action}</div>
              <div className="text-sm text-muted-foreground">
                {description}
              </div>
            </div>
            <Badge variant="secondary" className="ml-4 shrink-0 text-base px-3 py-1">
              {cost} credit{cost !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">How Credits Work</p>
              <p className="text-blue-700 dark:text-blue-300">
                Each platform activity costs 1 credit. Use the spin wheel to earn free credits after spending credits on activities!
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-3">
          <div className="flex items-center space-x-2 self-start">
            <Checkbox
              id="dontShow"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label
              htmlFor="dontShow"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Don't show this notification again
            </label>
          </div>
          
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleClose} className="flex-1">
              Continue
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
