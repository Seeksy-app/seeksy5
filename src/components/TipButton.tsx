import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, DollarSign } from "lucide-react";

interface TipButtonProps {
  creatorId: string;
  creatorName: string;
  buttonText?: string;
}

export function TipButton({ creatorId, creatorName, buttonText = 'Send a Tip' }: TipButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const predefinedAmounts = [5, 10, 25, 50];

  const handleTip = async () => {
    const tipAmount = parseFloat(amount);
    
    if (!tipAmount || tipAmount < 1) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid tip amount (minimum $1)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-tip-payment", {
        body: {
          creatorId,
          amount: tipAmount,
          message: message.trim(),
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, "_blank");
        setIsOpen(false);
        
        toast({
          title: "Redirecting to payment",
          description: "Complete your tip in the new tab",
        });
        
        // Reset form
        setAmount("");
        setMessage("");
      }
    } catch (error) {
      console.error("Error creating tip:", error);
      toast({
        title: "Error",
        description: "Failed to process tip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="gap-2 bg-gradient-to-r from-brand-red to-pink-600 hover:from-brand-red/90 hover:to-pink-600/90 text-white shadow-lg"
        >
          <Heart className="h-5 w-5 fill-current" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Support {creatorName}</DialogTitle>
          <DialogDescription>
            Send a tip to show your appreciation during the live stream
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Tip Amount (USD)</Label>
            <div className="flex gap-2 mb-2">
              {predefinedAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant={amount === amt.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(amt.toString())}
                  className="flex-1"
                >
                  ${amt}
                </Button>
              ))}
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter custom amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Leave a message for the creator..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/200 characters
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleTip}
            disabled={isProcessing || !amount}
          >
            {isProcessing ? "Processing..." : "Send Tip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
