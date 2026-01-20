import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Sparkles, TrendingUp, Info } from "lucide-react";
import { toast } from "sonner";
import { SpinWheelDialog } from "@/components/credits/SpinWheelDialog";
import { useWelcomeSpin } from "@/hooks/useWelcomeSpin";
import { Link } from "react-router-dom";

export default function Credits() {
  const queryClient = useQueryClient();
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [isEligibleForSpin, setIsEligibleForSpin] = useState(false);
  const { showWelcomeSpin, setShowWelcomeSpin } = useWelcomeSpin();

  // Fetch user credits
  const { data: userCredits, isLoading: creditsLoading } = useQuery({
    queryKey: ["user-credits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch credit packages
  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["credit-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data;
    },
  });

  // Purchase credits mutation
  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        body: { packageId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to start purchase", {
        description: error.message,
      });
    },
  });

  // Check spin wheel eligibility
  const checkSpinEligibility = () => {
    if (userCredits && userCredits.total_spent > 0) {
      const creditsUntilNextSpin = 20 - (userCredits.total_spent % 20);
      setIsEligibleForSpin(creditsUntilNextSpin === 0 || userCredits.total_spent % 20 === 0);
    }
  };

  const handlePurchase = (packageId: string) => {
    purchaseMutation.mutate(packageId);
  };

  const handleSpinComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["user-credits"] });
    setShowSpinWheel(false);
    checkSpinEligibility();
  };

  // Check eligibility on load
  useEffect(() => {
    checkSpinEligibility();
  }, [userCredits]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Your Credits</h1>
        <p className="text-muted-foreground">Purchase credits to unlock all Seeksy features</p>
        <Button size="lg" onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}>
          <Coins className="mr-2 h-5 w-5" />
          Add Credits
        </Button>
      </div>

      {/* Current Balance Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-5xl font-bold text-primary">
            {creditsLoading ? "..." : userCredits?.balance || 0}
            <span className="text-2xl ml-2 text-muted-foreground">credits</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Purchased</div>
              <div className="text-lg font-semibold">{userCredits?.total_purchased || 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Spent</div>
              <div className="text-lg font-semibold">{userCredits?.total_spent || 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Earned</div>
              <div className="text-lg font-semibold">{userCredits?.total_earned || 0}</div>
            </div>
          </div>

          {isEligibleForSpin && (
            <Button
              onClick={() => setShowSpinWheel(true)}
              className="w-full"
              size="lg"
              variant="default"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Spin the Wheel for Free Credits!
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div id="packages">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Purchase Credits</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packagesLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Loading packages...
            </div>
          ) : (
            packages?.map((pkg) => (
              <Card key={pkg.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription>
                    {pkg.credits} credits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    ${pkg.price}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${(pkg.price / pkg.credits).toFixed(2)} per credit
                  </div>
                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchaseMutation.isPending}
                    className="w-full"
                  >
                    {purchaseMutation.isPending ? "Processing..." : "Purchase"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* How Credits Work */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>How Credits Work</CardTitle>
            <Link to="/credit-info">
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4 mr-2" />
                View Full Breakdown
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✨ Each activity costs <strong className="text-foreground">1 credit</strong></p>
          <p>🎯 Activities include: creating meetings, uploading videos, using AI Studio, creating studios, and more</p>
          <p>🎰 Spend 20 credits and get a chance to <strong className="text-foreground">spin the wheel</strong> for free bonus credits!</p>
          <p>🎁 New users start with <strong className="text-foreground">5 free credits</strong></p>
          <p className="pt-2">
            <Link to="/credit-info" className="text-primary hover:underline font-medium">
              See complete list of credit costs →
            </Link>
          </p>
        </CardContent>
      </Card>

      <SpinWheelDialog
        open={showSpinWheel}
        onOpenChange={setShowSpinWheel}
        onSpinComplete={handleSpinComplete}
      />
      
      <SpinWheelDialog
        open={showWelcomeSpin}
        onOpenChange={setShowWelcomeSpin}
        onSpinComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["user-credits"] });
          queryClient.invalidateQueries({ queryKey: ["spin-history"] });
          setShowWelcomeSpin(false);
        }}
        isWelcomeSpin={true}
      />
    </div>
  );
}