import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Plus, CreditCard, History } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WalletWidgetProps {
  wallet: any;
  advertiserId?: string;
}

export function WalletWidget({ wallet, advertiserId }: WalletWidgetProps) {
  const queryClient = useQueryClient();
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundAmount, setFundAmount] = useState("");

  const fundWallet = useMutation({
    mutationFn: async (amount: number) => {
      if (!advertiserId) throw new Error("No advertiser ID");
      
      // First, get or create wallet
      let walletId = wallet?.id;
      if (!walletId) {
        const { data: newWallet, error: walletError } = await (supabase as any)
          .from('advertiser_wallet')
          .insert({
            advertiser_id: advertiserId,
            balance: 0
          })
          .select()
          .single();
        
        if (walletError) throw walletError;
        walletId = (newWallet as any).id;
      }

      const newBalance = (wallet?.balance || 0) + amount;

      // Update wallet balance
      const { error: updateError } = await (supabase as any)
        .from('advertiser_wallet')
        .update({ 
          balance: newBalance,
          last_funded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('advertiser_id', advertiserId);
      
      if (updateError) throw updateError;

      // Record transaction
      const { error: txError } = await (supabase as any)
        .from('advertiser_funding_transactions')
        .insert({
          advertiser_id: advertiserId,
          wallet_id: walletId,
          amount: amount,
          type: 'credit',
          source: 'manual',
          description: 'Manual wallet funding',
          balance_after: newBalance
        });
      
      if (txError) throw txError;

      return newBalance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertiser-wallet'] });
      toast.success('Wallet funded successfully!');
      setShowFundDialog(false);
      setFundAmount("");
    },
    onError: (error) => {
      toast.error('Failed to fund wallet');
      console.error(error);
    }
  });

  const handleFund = () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    fundWallet.mutate(amount);
  };

  const quickAmounts = [100, 500, 1000, 5000];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5 text-primary" />
          Wallet
        </CardTitle>
        <CardDescription>Your advertising balance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-3xl font-bold text-primary">
            ${(wallet?.balance || 0).toLocaleString()}
          </p>
        </div>

        <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Funds
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds to Wallet</DialogTitle>
              <DialogDescription>
                Add funds to your advertising wallet to run campaigns.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setFundAmount(amount.toString())}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>

              <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Demo Mode</p>
                  <p className="text-muted-foreground">Funds are added instantly for testing</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFundDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleFund} disabled={fundWallet.isPending}>
                {fundWallet.isPending ? 'Processing...' : 'Add Funds'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" className="w-full" size="sm">
          <History className="h-4 w-4 mr-2" />
          Transaction History
        </Button>
      </CardContent>
    </Card>
  );
}
